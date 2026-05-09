const db = require('../config/database');
const ActivityLogService = require('./activityLogService');

const loginUsernameSql = `
  CASE
    WHEN pt.table_name = 'students' THEN ep.user_id
    WHEN LOWER(pt.type_name) LIKE '%vip%' THEN 'VIP-' || ep.user_id
    ELSE 'GUEST-' || ep.user_id
  END
`;

const activeEventEndSql = async (client = db) => {
  const result = await client.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'events'
      AND column_name = 'event_end_date'
    LIMIT 1
  `);
  return result.rowCount > 0 ? 'COALESCE(e.event_end_date, e.event_date)' : 'e.event_date';
};

const AttendanceService = {
  async ensureSchema(client = db) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id INTEGER NOT NULL REFERENCES event_participants(eventparticipant_id) ON DELETE CASCADE,
        invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        attendance_status VARCHAR(30) NOT NULL DEFAULT 'ATTENDED',
        UNIQUE (invitation_id),
        UNIQUE (event_id, participant_id)
      )
    `);
  },

  async listActiveEvents() {
    const endSql = await activeEventEndSql();
    const result = await db.query(`
      SELECT e.*
      FROM events e
      WHERE (${endSql})::date >= CURRENT_DATE
      ORDER BY e.event_date ASC
    `);
    return result.rows;
  },

  async findInvitationForScan(eventId, qrToken, client = db) {
    const result = await client.query(`
      SELECT
        i.id AS invitation_id,
        i.event_id,
        i.eventparticipant_id,
        i.status AS invitation_status,
        i.comm_status,
        i.qr_token,
        e.event_name,
        e.event_date,
        e.location,
        ep.status AS participant_status,
        pt.type_name AS participant_type,
        ${loginUsernameSql} AS username,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(s.phone, g.phone) AS phone,
        COALESCE(se.zone, sg.name) AS seat_group,
        se.seat_number,
        ar.id AS attendance_id,
        ar.scanned_at,
        ar.attendance_status
      FROM invitations i
      JOIN events e ON e.id = i.event_id
      JOIN event_participants ep ON ep.eventparticipant_id = i.eventparticipant_id
      JOIN people_types pt ON pt.id = ep.type_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      LEFT JOIN seats se ON se.id = i.seat_id
      LEFT JOIN seat_groups sg ON sg.id = i.seat_group_id
      LEFT JOIN attendance_records ar ON ar.invitation_id = i.id
      WHERE i.qr_token = $1
      LIMIT 1
    `, [qrToken]);

    const invitation = result.rows[0];
    if (!invitation) {
      const error = new Error('Invalid Invitation QR Code');
      error.statusCode = 404;
      throw error;
    }
    if (String(invitation.event_id) !== String(eventId)) {
      const error = new Error('Participant is not assigned to this event');
      error.statusCode = 400;
      throw error;
    }
    if (invitation.attendance_id) {
      const error = new Error('Participant Already Attended');
      error.statusCode = 409;
      error.invitation = invitation;
      throw error;
    }
    if (invitation.invitation_status && invitation.invitation_status !== 'ACTIVE') {
      const error = new Error('Invalid Invitation QR Code');
      error.statusCode = 400;
      throw error;
    }
    if (invitation.participant_status !== 'eligible') {
      const error = new Error('Invalid Invitation QR Code');
      error.statusCode = 400;
      throw error;
    }

    return invitation;
  },

  async validateScan(eventId, qrToken) {
    await this.ensureSchema();
    if (!eventId || !qrToken) {
      const error = new Error('Event and QR code are required');
      error.statusCode = 400;
      throw error;
    }
    return this.findInvitationForScan(eventId, qrToken.trim());
  },

  async confirmAttendance(eventId, qrToken, scannedBy) {
    await this.ensureSchema();
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await this.ensureSchema(client);
      const invitation = await this.findInvitationForScan(eventId, qrToken.trim(), client);

      const insertResult = await client.query(`
        INSERT INTO attendance_records (
          participant_id,
          invitation_id,
          event_id,
          scanned_by,
          attendance_status
        )
        VALUES ($1, $2, $3, $4, 'ATTENDED')
        ON CONFLICT (invitation_id) DO NOTHING
        RETURNING *
      `, [
        invitation.eventparticipant_id,
        invitation.invitation_id,
        eventId,
        scannedBy
      ]);

      if (insertResult.rowCount === 0) {
        const error = new Error('Participant Already Attended');
        error.statusCode = 409;
        throw error;
      }

      await ActivityLogService.log({
        actorUserId: scannedBy,
        actionType: 'ATTENDANCE_SCANNED',
        entityType: 'attendance_records',
        entityId: insertResult.rows[0].id,
        description: `Attendance scanned: ${invitation.full_name}`,
        metadata: {
          event_id: eventId,
          participant_id: invitation.eventparticipant_id,
          invitation_id: invitation.invitation_id
        }
      }, client);

      await client.query('COMMIT');
      return {
        attendance: insertResult.rows[0],
        invitation
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listAttendance(eventId) {
    await this.ensureSchema();
    const result = await db.query(`
      SELECT
        ar.id,
        ar.participant_id,
        ar.invitation_id,
        ar.event_id,
        ar.scanned_at,
        ar.attendance_status,
        pt.type_name AS participant_type,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(se.zone, sg.name) AS seat_group
      FROM attendance_records ar
      JOIN event_participants ep ON ep.eventparticipant_id = ar.participant_id
      JOIN people_types pt ON pt.id = ep.type_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      LEFT JOIN invitations i ON i.id = ar.invitation_id
      LEFT JOIN seats se ON se.id = i.seat_id
      LEFT JOIN seat_groups sg ON sg.id = i.seat_group_id
      WHERE ar.event_id = $1
      ORDER BY ar.scanned_at DESC
    `, [eventId]);
    return result.rows;
  },

  async getDashboard(eventId) {
    await this.ensureSchema();
    const participantRows = await db.query(`
      SELECT
        ep.eventparticipant_id,
        pt.type_name AS participant_type,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        i.id AS invitation_id,
        i.status AS invitation_status,
        i.comm_status,
        COALESCE(se.zone, sg.name) AS seat_group,
        ar.scanned_at,
        COALESCE(ar.attendance_status, 'NOT_ATTENDED') AS attendance_status
      FROM event_participants ep
      JOIN people_types pt ON pt.id = ep.type_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      LEFT JOIN invitations i ON i.eventparticipant_id = ep.eventparticipant_id
      LEFT JOIN seats se ON se.id = i.seat_id
      LEFT JOIN seat_groups sg ON sg.id = i.seat_group_id
      LEFT JOIN attendance_records ar ON ar.invitation_id = i.id
      WHERE ep.event_id = $1
        AND ep.status = 'eligible'
      ORDER BY COALESCE(s.full_name, g.guest_name, ep.user_id) ASC
    `, [eventId]);

    const rows = participantRows.rows;
    const attended = rows.filter(row => row.attendance_status === 'ATTENDED');
    const withInvitations = rows.filter(row => row.invitation_id);
    const withoutInvitations = rows.filter(row => !row.invitation_id);
    const notAttendedWithInvitations = rows.filter(row => row.invitation_id && row.attendance_status !== 'ATTENDED');

    return {
      metrics: {
        total_attended: attended.length,
        not_attended_with_invitations: notAttendedWithInvitations.length,
        not_attended_without_invitations: withoutInvitations.length,
        total_with_invitations: withInvitations.length,
        total_without_invitations: withoutInvitations.length
      },
      lists: {
        attended_participants: attended,
        not_attended_participants: rows.filter(row => row.attendance_status !== 'ATTENDED'),
        participants_with_invitations: withInvitations,
        participants_without_invitations: withoutInvitations
      }
    };
  }
};

module.exports = AttendanceService;
