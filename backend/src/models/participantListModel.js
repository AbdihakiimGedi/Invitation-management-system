const db = require('../config/database');

const buildParticipantFilter = (filters = {}, params) => {
  const conditions = [];
  const search = String(filters.search || '').trim();

  if (search) {
    params.push(`%${search}%`);
    const searchParam = `$${params.length}`;
    conditions.push(`(
      COALESCE(s.full_name, g.guest_name, ep.user_id) ILIKE ${searchParam}
      OR COALESCE(s.email, g.email, '') ILIKE ${searchParam}
      OR COALESCE(s.phone, g.phone, '') ILIKE ${searchParam}
    )`);
  }

  if (filters.gpaRange) {
    const ranges = {
      above_4: 's.gpa > 4.0',
      gpa_3_5_4: 's.gpa >= 3.5 AND s.gpa <= 4.0',
      gpa_3_0_3_49: 's.gpa >= 3.0 AND s.gpa < 3.5',
      below_3: 's.gpa < 3.0'
    };

    if (!ranges[filters.gpaRange]) {
      throw new Error('Invalid GPA filter');
    }

    conditions.push(`(pt.table_name <> 'students' OR (${ranges[filters.gpaRange]}))`);
  }

  return conditions.length ? ` AND ${conditions.join(' AND ')}` : '';
};

const ParticipantListModel = {
  async getEventParticipantGroups(eventId, filters = {}) {
    const params = [eventId];
    const filterSql = buildParticipantFilter(filters, params);
    const query = `
      WITH type_counts AS (
        SELECT
          pt.id AS type_id,
          pt.type_name,
          pt.table_name,
          COUNT(ep.eventparticipant_id)::int AS participant_count
        FROM people_types pt
        LEFT JOIN event_participants ep
          ON ep.type_id = pt.id
         AND ep.event_id = $1
        LEFT JOIN students s
          ON pt.table_name = 'students'
         AND ep.user_id = s.student_id
        LEFT JOIN guests g
          ON pt.table_name = 'guests'
         AND ep.guest_ref_id = g.guest_id
        WHERE TRUE
          ${filterSql}
        GROUP BY pt.id, pt.type_name, pt.table_name
      )
      SELECT
        type_id,
        type_name,
        LOWER(REGEXP_REPLACE(type_name, '[^a-zA-Z0-9]+', '_', 'g')) AS type_key,
        table_name,
        CASE WHEN table_name = 'students' THEN TRUE ELSE FALSE END AS supports_gpa_filter,
        participant_count
      FROM type_counts
      ORDER BY
        CASE WHEN table_name = 'students' THEN 0 ELSE 1 END,
        type_name ASC
    `;
    const result = await db.query(query, params);
    return result.rows;
  },

  async getParticipantsByType(eventId, typeId, filters = {}) {
    const params = [eventId, typeId];
    const filterSql = buildParticipantFilter(filters, params);
    const query = `
      SELECT
        ep.eventparticipant_id,
        ep.status,
        ep.reason,
        pt.id AS type_id,
        pt.type_name AS role,
        pt.table_name,
        s.gpa,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(s.phone, g.phone) AS phone,
        i.id AS invitation_id,
        CASE WHEN i.id IS NULL THEN FALSE ELSE TRUE END AS has_invitation
      FROM event_participants ep
      JOIN people_types pt ON ep.type_id = pt.id
      LEFT JOIN students s
        ON pt.table_name = 'students'
       AND ep.user_id = s.student_id
      LEFT JOIN guests g
        ON pt.table_name = 'guests'
       AND ep.guest_ref_id = g.guest_id
      LEFT JOIN LATERAL (
        SELECT id
        FROM invitations
        WHERE eventparticipant_id = ep.eventparticipant_id
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 1
      ) i ON TRUE
      WHERE ep.event_id = $1
        AND ep.type_id = $2
        ${filterSql}
      ORDER BY COALESCE(s.full_name, g.guest_name, ep.user_id) ASC
    `;
    const result = await db.query(query, params);
    return result.rows;
  },

  async getParticipantDetails(eventId, eventParticipantId) {
    const query = `
      SELECT
        ep.eventparticipant_id,
        ep.user_id,
        ep.status,
        ep.reason,
        ep.guest_ref_id,
        e.event_name,
        e.event_date,
        e.location,
        pt.id AS type_id,
        pt.type_name AS role,
        pt.table_name,
        COALESCE(s.full_name, g.guest_name, ep.user_id) AS full_name,
        COALESCE(s.email, g.email) AS email,
        COALESCE(s.phone, g.phone) AS phone,
        s.student_id,
        s.gpa,
        f.faculty_name,
        d.department_name,
        g.guest_id,
        i.id AS invitation_id,
        i.qr_token,
        i.status AS invitation_status,
        i.comm_status,
        i.quantity,
        i.created_at AS invitation_created_at,
        se.zone AS seat_zone,
        se.seat_number,
        se.category_type AS seat_category,
        jsonb_strip_nulls(jsonb_build_object(
          'student_id', s.student_id,
          'guest_id', g.guest_id,
          'phone', COALESCE(s.phone, g.phone),
          'faculty', f.faculty_name,
          'department', d.department_name,
          'gpa', s.gpa,
          'status_reason', ep.reason,
          'seat_zone', se.zone,
          'seat_number', se.seat_number,
          'seat_category', se.category_type,
          'invitation_status', i.status,
          'communication_status', i.comm_status,
          'quantity', i.quantity
        )) AS metadata
      FROM event_participants ep
      JOIN events e ON e.id = ep.event_id
      JOIN people_types pt ON ep.type_id = pt.id
      LEFT JOIN students s
        ON pt.table_name = 'students'
       AND ep.user_id = s.student_id
      LEFT JOIN faculties f ON s.faculty_id = f.faculty_id
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN guests g
        ON pt.table_name = 'guests'
       AND ep.guest_ref_id = g.guest_id
      LEFT JOIN LATERAL (
        SELECT *
        FROM invitations
        WHERE eventparticipant_id = ep.eventparticipant_id
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 1
      ) i ON TRUE
      LEFT JOIN seats se ON se.id = i.seat_id
      WHERE ep.event_id = $1
        AND ep.eventparticipant_id = $2
      LIMIT 1
    `;
    const result = await db.query(query, [eventId, eventParticipantId]);
    return result.rows[0];
  }
};

module.exports = ParticipantListModel;
