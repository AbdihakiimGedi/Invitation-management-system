const db = require('../config/database');
const InvitationManagementService = require('../services/invitationManagementService');
const AttendanceService = require('../services/attendanceService');

const loginUsernameSql = `
  CASE
    WHEN pt.table_name = 'students' THEN ep.user_id
    WHEN LOWER(pt.type_name) LIKE '%vip%' THEN 'VIP-' || ep.user_id
    ELSE 'GUEST-' || ep.user_id
  END
`;

const getActiveEventFilterSql = async () => {
  const result = await db.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'events'
        AND column_name = 'event_end_date'
      LIMIT 1
    `
  );
  return result.rowCount > 0
    ? 'AND COALESCE(e.event_end_date, e.event_date)::date >= CURRENT_DATE'
    : 'AND e.event_date::date >= CURRENT_DATE';
};

const InvitationModel = {
  async create(data, client = db) {
    const { event_id, eventparticipant_id, seat_id, qr_token, quantity = 1 } = data;
    await InvitationManagementService.assertCapacity(event_id, quantity, client);
    const query = `
      INSERT INTO invitations (id, event_id, eventparticipant_id, seat_id, qr_token, quantity, status, comm_status)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'ACTIVE', 'PENDING')
      RETURNING *
    `;
    const res = await client.query(query, [event_id, eventparticipant_id, seat_id, qr_token, quantity]);
    return res.rows[0];
  },

  async bulkCreate(invitations, client = db) {
    if (invitations.length > 0) {
      const byEvent = invitations.reduce((acc, invitation) => {
        acc[invitation.event_id] = (acc[invitation.event_id] || 0) + (invitation.quantity || 1);
        return acc;
      }, {});
      for (const [eventId, needed] of Object.entries(byEvent)) {
        await InvitationManagementService.assertCapacity(eventId, needed, client);
      }
    }
    // Using unnest for bulk insert performance
    const query = `
      INSERT INTO invitations (id, event_id, eventparticipant_id, seat_id, qr_token, quantity, status, comm_status)
      SELECT gen_random_uuid(), unnest($1::uuid[]), unnest($2::int[]), unnest($3::uuid[]), unnest($4::text[]), unnest($5::int[]), 'ACTIVE', 'PENDING'
      RETURNING *
    `;
    const res = await client.query(query, [
      invitations.map(i => i.event_id),
      invitations.map(i => i.participant_id),
      invitations.map(i => i.seat_id),
      invitations.map(i => i.qr_token),
      invitations.map(i => i.quantity)
    ]);
    return res.rows;
  },

  async getByToken(token) {
    const query = `
      SELECT i.*, ep.user_id, ep.type_id, pt.type_name, e.event_name, s.zone as group_name, s.seat_number
      FROM invitations i
      JOIN event_participants ep ON i.eventparticipant_id = ep.eventparticipant_id
      JOIN people_types pt ON ep.type_id = pt.id
      JOIN events e ON i.event_id = e.id
      JOIN seats s ON i.seat_id = s.id
      WHERE i.qr_token = $1
    `;
    const res = await db.query(query, [token]);
    return res.rows[0];
  },

  async verifyAndUse(token, device_info = null, ip_address = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const invitation = await this.getByToken(token);
      if (!invitation) {
        await this.logScan(null, 'FAILED_INVALID', device_info, ip_address, client);
        await client.query('COMMIT');
        return { success: false, reason: 'INVALID_TOKEN' };
      }

      if (invitation.status === 'USED') {
        await this.logScan(invitation.id, 'FAILED_USED', device_info, ip_address, client);
        await client.query('COMMIT');
        return { success: false, reason: 'ALREADY_USED', invitation };
      }

      // Mark as used
      await client.query('UPDATE invitations SET status = \'USED\' WHERE id = $1', [invitation.id]);
      await this.logScan(invitation.id, 'SUCCESS', device_info, ip_address, client);
      
      await client.query('COMMIT');
      return { success: true, invitation };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async logScan(invitationId, status, device_info, ip_address, client = db) {
    const query = `
      INSERT INTO invitation_scans (invitation_id, status, device_info, ip_address)
      VALUES ($1, $2, $3, $4)
    `;
    return client.query(query, [invitationId, status, device_info, ip_address]);
  },

  async getForUser(userId) {
    await AttendanceService.ensureSchema();
    const activeEventFilterSql = await getActiveEventFilterSql();
    const query = `
      SELECT
        i.id,
        i.event_id,
        i.eventparticipant_id,
        i.qr_token,
        i.quantity,
        i.status,
        i.comm_status,
        i.created_at,
        COALESCE(ar.attendance_status, 'NOT_ATTENDED') AS attendance_status,
        ar.scanned_at AS attended_at,
        e.event_name,
        e.event_date,
        e.location,
        pt.type_name AS invitation_type,
        ${loginUsernameSql} AS username,
        ep.user_id AS participant_ref,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(s.phone, g.phone) AS phone,
        se.zone AS seat_group,
        se.section,
        se.row_number,
        se.seat_number,
        se.category_type,
        jsonb_strip_nulls(jsonb_build_object(
          'participant_status', ep.status,
          'seat_group', se.zone,
          'section', se.section,
          'row_number', se.row_number,
          'seat_number', se.seat_number,
          'category_type', se.category_type,
          'communication_status', i.comm_status,
          'attendance_status', COALESCE(ar.attendance_status, 'NOT_ATTENDED'),
          'attended_at', ar.scanned_at,
          'quantity', i.quantity
        )) AS metadata
      FROM users u
      JOIN event_participants ep ON TRUE
      JOIN people_types pt ON pt.id = ep.type_id
      JOIN events e ON e.id = ep.event_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      LEFT JOIN invitations i ON i.eventparticipant_id = ep.eventparticipant_id
      LEFT JOIN seats se ON se.id = i.seat_id
      LEFT JOIN attendance_records ar ON ar.invitation_id = i.id
      WHERE u.id = $1
        AND u.username = (${loginUsernameSql})
        AND ep.status = 'eligible'
        ${activeEventFilterSql}
      ORDER BY e.event_date ASC, i.created_at DESC NULLS LAST
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  async getForUserById(userId, invitationId) {
    await AttendanceService.ensureSchema();
    const activeEventFilterSql = await getActiveEventFilterSql();
    const query = `
      SELECT *
      FROM (
        SELECT
          i.id,
          i.event_id,
          i.eventparticipant_id,
          i.qr_token,
          i.quantity,
          i.status,
          i.comm_status,
          i.created_at,
          COALESCE(ar.attendance_status, 'NOT_ATTENDED') AS attendance_status,
          ar.scanned_at AS attended_at,
          e.event_name,
          e.event_date,
          e.location,
          pt.type_name AS invitation_type,
          ${loginUsernameSql} AS username,
          ep.user_id AS participant_ref,
          COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
          COALESCE(s.email, g.email) AS email,
          COALESCE(s.phone, g.phone) AS phone,
          se.zone AS seat_group,
          se.section,
          se.row_number,
          se.seat_number,
          se.category_type,
          jsonb_strip_nulls(jsonb_build_object(
            'participant_status', ep.status,
            'seat_group', se.zone,
            'section', se.section,
            'row_number', se.row_number,
            'seat_number', se.seat_number,
            'category_type', se.category_type,
            'communication_status', i.comm_status,
            'attendance_status', COALESCE(ar.attendance_status, 'NOT_ATTENDED'),
            'attended_at', ar.scanned_at,
            'quantity', i.quantity
          )) AS metadata
        FROM users u
        JOIN event_participants ep ON TRUE
        JOIN people_types pt ON pt.id = ep.type_id
        JOIN events e ON e.id = ep.event_id
        LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
        LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
        LEFT JOIN invitations i ON i.eventparticipant_id = ep.eventparticipant_id
        LEFT JOIN seats se ON se.id = i.seat_id
        LEFT JOIN attendance_records ar ON ar.invitation_id = i.id
        WHERE u.id = $1
          AND u.username = (${loginUsernameSql})
          AND ep.status = 'eligible'
          ${activeEventFilterSql}
      ) my_invitations
      WHERE id = $2
      LIMIT 1
    `;
    const result = await db.query(query, [userId, invitationId]);
    return result.rows[0];
  },

  async getEventsForUser(userId) {
    const activeEventFilterSql = await getActiveEventFilterSql();
    const query = `
      SELECT DISTINCT
        e.id,
        e.event_name,
        e.event_date,
        e.location,
        pt.type_name AS participant_role,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name
      FROM users u
      JOIN event_participants ep ON TRUE
      JOIN people_types pt ON pt.id = ep.type_id
      JOIN events e ON e.id = ep.event_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      WHERE u.id = $1
        AND u.username = (${loginUsernameSql})
        AND ep.status = 'eligible'
        ${activeEventFilterSql}
      ORDER BY e.event_date ASC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  async getForUserByEvent(userId, eventId) {
    await AttendanceService.ensureSchema();
    const activeEventFilterSql = await getActiveEventFilterSql();
    const query = `
      SELECT
        i.id,
        i.event_id,
        i.eventparticipant_id,
        i.qr_token,
        i.quantity,
        i.status,
        i.comm_status,
        i.created_at,
        COALESCE(ar.attendance_status, 'NOT_ATTENDED') AS attendance_status,
        ar.scanned_at AS attended_at,
        e.event_name,
        e.event_date,
        e.location,
        pt.type_name AS invitation_type,
        ${loginUsernameSql} AS username,
        ep.user_id AS participant_ref,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(s.phone, g.phone) AS phone,
        se.zone AS seat_group,
        se.section,
        se.row_number,
        se.seat_number,
        se.category_type,
        jsonb_strip_nulls(jsonb_build_object(
          'participant_status', ep.status,
          'seat_group', se.zone,
          'section', se.section,
          'row_number', se.row_number,
          'seat_number', se.seat_number,
          'category_type', se.category_type,
          'communication_status', i.comm_status,
          'attendance_status', COALESCE(ar.attendance_status, 'NOT_ATTENDED'),
          'attended_at', ar.scanned_at,
          'quantity', i.quantity
        )) AS metadata
      FROM users u
      JOIN event_participants ep ON TRUE
      JOIN people_types pt ON pt.id = ep.type_id
      JOIN events e ON e.id = ep.event_id
      LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
      LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
      LEFT JOIN invitations i ON i.eventparticipant_id = ep.eventparticipant_id
      LEFT JOIN seats se ON se.id = i.seat_id
      LEFT JOIN attendance_records ar ON ar.invitation_id = i.id
      WHERE u.id = $1
        AND u.username = (${loginUsernameSql})
        AND ep.event_id = $2
        AND ep.status = 'eligible'
        ${activeEventFilterSql}
      ORDER BY i.created_at DESC NULLS LAST
      LIMIT 1
    `;
    const result = await db.query(query, [userId, eventId]);
    return result.rows[0];
  }
};

module.exports = InvitationModel;
