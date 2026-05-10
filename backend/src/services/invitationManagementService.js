const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const CommunicationService = require('./communicationService');
const InvitationEmailService = require('./invitationEmailService');
const ActivityLogService = require('./activityLogService');

const loginUsernameSql = `
  CASE
    WHEN pt.table_name = 'students' THEN ep.user_id
    WHEN LOWER(pt.type_name) LIKE '%vip%' THEN 'VIP-' || ep.user_id
    ELSE 'GUEST-' || ep.user_id
  END
`;

const formatEventDate = (value) => {
  if (!value) return { date: 'TBD', time: 'TBD' };
  const date = value instanceof Date ? value : new Date(value);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};

const InvitationManagementService = {
  async ensureSchema(client = db) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitation_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
        eventparticipant_id INTEGER REFERENCES event_participants(eventparticipant_id) ON DELETE SET NULL,
        delivery_type VARCHAR(30) NOT NULL DEFAULT 'SEND',
        status VARCHAR(20) NOT NULL DEFAULT 'SENT',
        sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitation_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requester_eventparticipant_id INTEGER REFERENCES event_participants(eventparticipant_id) ON DELETE SET NULL,
        receiver_type VARCHAR(100) NOT NULL,
        receiver_name VARCHAR(150) NOT NULL,
        relationship VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        admin_message TEXT,
        approved_eventparticipant_id INTEGER REFERENCES event_participants(eventparticipant_id) ON DELETE SET NULL,
        approved_invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_invitation_requests_event_status ON invitation_requests(event_id, status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invitation_requests_requester ON invitation_requests(requester_user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invitation_deliveries_event ON invitation_deliveries(event_id)');
  },

  async getCapacity(eventId, client = db) {
    await this.ensureSchema(client);
    const result = await client.query(`
      SELECT
        e.id,
        e.event_name,
        e.max_capacity,
        COALESCE(SUM(i.quantity), 0)::int AS total_generated_invitations
      FROM events e
      LEFT JOIN invitations i ON i.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id
      LIMIT 1
    `, [eventId]);

    const event = result.rows[0];
    if (!event) throw new Error('Event not found');

    const maxCapacity = event.max_capacity == null ? null : Number(event.max_capacity);
    const generated = Number(event.total_generated_invitations || 0);
    return {
      max_capacity: maxCapacity,
      total_generated_invitations: generated,
      total_sent_invitations: generated,
      remaining_invitations: maxCapacity == null ? null : Math.max(maxCapacity - generated, 0)
    };
  },

  async assertCapacity(eventId, needed = 1, client = db) {
    const capacity = await this.getCapacity(eventId, client);
    if (capacity.remaining_invitations !== null && capacity.remaining_invitations < needed) {
      const error = new Error('Event capacity is full. No more invitations are available for this event.');
      error.statusCode = 409;
      error.capacity = capacity;
      throw error;
    }
    return capacity;
  },

  async listEvents() {
    await this.ensureSchema();
    const result = await db.query(`
      SELECT
        e.*,
        COALESCE(SUM(i.quantity), 0)::int AS total_generated_invitations,
        COALESCE(SUM(i.quantity), 0)::int AS total_sent_invitations,
        CASE
          WHEN e.max_capacity IS NULL THEN NULL
          ELSE GREATEST(e.max_capacity - COALESCE(SUM(i.quantity), 0), 0)::int
        END AS remaining_invitations
      FROM events e
      LEFT JOIN invitations i ON i.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `);
    return result.rows;
  },

  async listSentParticipants(eventId) {
    const capacity = await this.getCapacity(eventId);
    const result = await db.query(`
      SELECT
        ep.eventparticipant_id,
        ${loginUsernameSql} AS username,
        pt.type_name AS role,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(i.comm_status, 'NOT_SENT') AS invitation_status,
        i.id AS invitation_id,
        i.created_at AS invitation_created_at
      FROM event_participants ep
      JOIN people_types pt ON pt.id = ep.type_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      LEFT JOIN LATERAL (
        SELECT id, comm_status, created_at
        FROM invitations
        WHERE eventparticipant_id = ep.eventparticipant_id
        ORDER BY created_at DESC NULLS LAST
        LIMIT 1
      ) i ON TRUE
      WHERE ep.event_id = $1
        AND ep.status = 'eligible'
      ORDER BY COALESCE(s.full_name, g.guest_name, ep.user_id) ASC
    `, [eventId]);

    return { capacity, participants: result.rows };
  },

  async resendParticipantInvitation(eventId, eventParticipantId) {
    const capacity = await this.assertCapacity(eventId, 1);
    const sent = await InvitationEmailService.resendParticipantInvitation(eventParticipantId);
    if ((sent.sent || 0) === 0) {
      return { ...sent, capacity };
    }

    const invitation = await db.query(`
      SELECT id
      FROM invitations
      WHERE event_id = $1
        AND eventparticipant_id = $2
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1
    `, [eventId, eventParticipantId]);

    await db.query(`
      INSERT INTO invitation_deliveries (event_id, invitation_id, eventparticipant_id, delivery_type, status)
      VALUES ($1, $2, $3, 'RESEND', 'SENT')
    `, [eventId, invitation.rows[0]?.id || null, eventParticipantId]);

    return {
      sent: sent.sent,
      capacity: await this.getCapacity(eventId)
    };
  },

  async findRequesterParticipant(userId, eventId, client = db) {
    const result = await client.query(`
      SELECT
        ep.eventparticipant_id,
        ep.user_id,
        ep.guest_ref_id,
        pt.type_name AS role,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email
      FROM users u
      JOIN event_participants ep ON TRUE
      JOIN people_types pt ON pt.id = ep.type_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      WHERE u.id = $1
        AND ep.event_id = $2
        AND u.username = (${loginUsernameSql})
        AND ep.status = 'eligible'
      LIMIT 1
    `, [userId, eventId]);
    return result.rows[0];
  },

  async createRequest(userId, { event_id, receiver_type, receiver_name, relationship }) {
    await this.ensureSchema();
    if (!event_id || !receiver_type || !receiver_name || !relationship) {
      const error = new Error('Event, receiver type, receiver name, and relationship are required.');
      error.statusCode = 400;
      throw error;
    }
    await this.assertCapacity(event_id, 1);

    const requester = await this.findRequesterParticipant(userId, event_id);
    if (!requester) {
      const error = new Error('Participant record not found for this event.');
      error.statusCode = 404;
      throw error;
    }

    const result = await db.query(`
      INSERT INTO invitation_requests (
        event_id,
        requester_user_id,
        requester_eventparticipant_id,
        receiver_type,
        receiver_name,
        relationship
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      event_id,
      userId,
      requester.eventparticipant_id,
      receiver_type.trim(),
      receiver_name.trim(),
      relationship.trim()
    ]);

    await ActivityLogService.log({
      actorUserId: userId,
      actionType: 'INVITATION_REQUEST_CREATED',
      entityType: 'invitation_requests',
      entityId: result.rows[0].id,
      description: `Invitation request created for ${receiver_name}`,
      metadata: { event_id }
    });

    return result.rows[0];
  },

  async listRequests(eventId) {
    await this.ensureSchema();
    const result = await db.query(`
      SELECT
        r.*,
        e.event_name,
        e.event_date,
        e.location,
        pt.type_name AS requester_role,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS requester_name,
        COALESCE(s.email, g.email) AS requester_email
      FROM invitation_requests r
      JOIN events e ON e.id = r.event_id
      LEFT JOIN event_participants ep ON ep.eventparticipant_id = r.requester_eventparticipant_id
      LEFT JOIN people_types pt ON pt.id = ep.type_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      WHERE r.event_id = $1
      ORDER BY r.created_at DESC
    `, [eventId]);
    return result.rows;
  },

  async getRequestDetails(requestId) {
    await this.ensureSchema();
    const result = await db.query(`
      SELECT
        r.*,
        e.event_name,
        e.event_date,
        e.location,
        e.max_capacity,
        pt.type_name AS requester_role,
        ep.user_id AS requester_participant_ref,
        ep.eventparticipant_id AS requester_eventparticipant_id,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS requester_name,
        COALESCE(s.email, g.email) AS requester_email,
        COALESCE(s.phone, g.phone) AS requester_phone
      FROM invitation_requests r
      JOIN events e ON e.id = r.event_id
      LEFT JOIN event_participants ep ON ep.eventparticipant_id = r.requester_eventparticipant_id
      LEFT JOIN people_types pt ON pt.id = ep.type_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      WHERE r.id = $1
      LIMIT 1
    `, [requestId]);
    return result.rows[0];
  },

  async approveRequest(requestId, actorUserId = null) {
    await this.ensureSchema();
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await this.ensureSchema(client);

      const requestResult = await client.query(`
        SELECT *
        FROM invitation_requests
        WHERE id = $1
        FOR UPDATE
      `, [requestId]);
      const request = requestResult.rows[0];
      if (!request) {
        const error = new Error('Invitation request not found');
        error.statusCode = 404;
        throw error;
      }
      if (request.status !== 'PENDING') {
        const error = new Error('Invitation request has already been processed');
        error.statusCode = 400;
        throw error;
      }

      try {
        await this.assertCapacity(request.event_id, 1, client);
      } catch (error) {
        const requester = await this.findRequesterParticipant(request.requester_user_id, request.event_id, client);
        const rejectionMessage = 'Sorry, this event is currently full. Your invitation request could not be approved.';
        if (requester?.email) {
          await CommunicationService.sendNotification(
            requester.email,
            'Additional Invitation Request Update',
            rejectionMessage
          );
        }
        await client.query(`
          UPDATE invitation_requests
          SET status = 'REJECTED',
              admin_message = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [requestId, rejectionMessage]);
        await client.query('COMMIT');
        return {
          approved: false,
          message: rejectionMessage,
          capacity: error.capacity
        };
      }

      const requester = await this.findRequesterParticipant(request.requester_user_id, request.event_id, client);
      if (!requester?.email) {
        const error = new Error('Requester email is required to send the additional invitation');
        error.statusCode = 400;
        throw error;
      }

      const typeResult = await client.query(`
        SELECT id, type_name
        FROM people_types
        WHERE table_name = 'guests'
        ORDER BY CASE WHEN LOWER(type_name) = 'guests' THEN 0 ELSE 1 END, type_name
        LIMIT 1
      `);
      const guestType = typeResult.rows[0];
      if (!guestType) throw new Error('Guest participant type is not configured.');

      const guestResult = await client.query(
        'INSERT INTO guests (guest_name, email) VALUES ($1, $2) RETURNING guest_id, guest_name, email',
        [request.receiver_name, requester.email]
      );
      const guest = guestResult.rows[0];

      const participantResult = await client.query(`
        INSERT INTO event_participants (event_id, user_id, type_id, status, guest_ref_id, reason)
        VALUES ($1, $2, $3, 'eligible', $4, $5)
        RETURNING eventparticipant_id
      `, [
        request.event_id,
        String(guest.guest_id),
        guestType.id,
        guest.guest_id,
        `Additional invitation request ${request.id}`
      ]);
      const eventParticipantId = participantResult.rows[0].eventparticipant_id;

      await this.assertCapacity(request.event_id, 1, client);
      const token = crypto.randomBytes(32).toString('hex');
      const invitationResult = await client.query(`
        INSERT INTO invitations (id, event_id, eventparticipant_id, qr_token, quantity, status, comm_status)
        VALUES (gen_random_uuid(), $1, $2, $3, 1, 'ACTIVE', 'PENDING')
        RETURNING id
      `, [request.event_id, eventParticipantId, token]);
      const invitationId = invitationResult.rows[0].id;

      const username = `GUEST-${guest.guest_id}`;
      const password = crypto.randomBytes(9).toString('base64url');
      const passwordHash = await bcrypt.hash(password, 10);
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS generated_password VARCHAR(150)');
      await client.query('ALTER TABLE users ALTER COLUMN generated_password TYPE VARCHAR(150)');
      await client.query(`
        INSERT INTO users (id, username, password_hash, generated_password, role, is_active)
        VALUES (gen_random_uuid(), $1, $2, $3, 'Guest', TRUE)
        ON CONFLICT (username)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          generated_password = EXCLUDED.generated_password,
          role = EXCLUDED.role,
          is_active = TRUE
      `, [username, passwordHash, password]);

      const eventResult = await client.query('SELECT event_name, event_date, location FROM events WHERE id = $1', [request.event_id]);
      const event = eventResult.rows[0];
      const { date, time } = formatEventDate(event.event_date);
      const success = await CommunicationService.sendEmail(
        requester.email,
        `Additional Invitation Approved: ${event.event_name}`,
        {
          fullName: request.receiver_name,
          participantTypeName: request.receiver_type || guestType.type_name,
          eventName: event.event_name,
          eventDate: date,
          eventTime: time,
          eventLocation: event.location,
          qrTokens: [token],
          qty: 1,
          groupName: 'Additional Invitation',
          portalCredential: { username, password }
        }
      );

      await client.query(
        "UPDATE invitations SET comm_status = $1 WHERE id = $2",
        [success ? 'SENT' : 'FAILED', invitationId]
      );
      if (success) {
        await client.query(`
          INSERT INTO invitation_deliveries (event_id, invitation_id, eventparticipant_id, delivery_type, status)
          VALUES ($1, $2, $3, 'REQUEST_APPROVAL', 'SENT')
        `, [request.event_id, invitationId, eventParticipantId]);
      }

      await client.query(`
        UPDATE invitation_requests
        SET status = $1,
            admin_message = $2,
            approved_eventparticipant_id = $3,
            approved_invitation_id = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        success ? 'APPROVED' : 'FAILED',
        success ? 'Invitation sent successfully.' : 'Invitation could not be emailed.',
        eventParticipantId,
        invitationId,
        requestId
      ]);

      await ActivityLogService.log({
        actorUserId,
        actionType: success ? 'INVITATION_REQUEST_APPROVED' : 'INVITATION_REQUEST_FAILED',
        entityType: 'invitation_requests',
        entityId: requestId,
        description: success ? `Invitation request approved: ${request.receiver_name}` : `Invitation request failed: ${request.receiver_name}`,
        metadata: { event_id: request.event_id, invitation_id: invitationId }
      }, client);

      await client.query('COMMIT');
      return {
        approved: success,
        message: success ? 'Invitation sent successfully.' : 'Invitation could not be emailed.',
        credential: { username, password },
        capacity: await this.getCapacity(request.event_id)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = InvitationManagementService;
