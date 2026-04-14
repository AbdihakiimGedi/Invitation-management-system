const db = require('../config/database');

const EventModel = {
  async getAll() {
    const query = 'SELECT * FROM events ORDER BY event_date ASC';
    const result = await db.query(query);
    return result.rows;
  },

  async getById(id) {
    const query = 'SELECT * FROM events WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async getParticipants(eventId, status, typeName = 'graduate') {
    const isGuest = typeName.toLowerCase().includes('guest');
    
    if (isGuest) {
      const query = `
        SELECT 
          g.guest_name as full_name,
          g.guest_id as student_id,
          g.phone,
          g.email,
          ep.status,
          ep.reason,
          ep.type_id
        FROM event_participants ep
        JOIN guests g ON ep.guest_ref_id = g.guest_id
        WHERE ep.event_id = $1 AND ep.status = $2 
        AND ep.type_id = (SELECT id FROM people_types WHERE type_name = 'Guests' LIMIT 1)
      `;
      const result = await db.query(query, [eventId, status]);
      return result.rows;
    }

    const query = `
      SELECT 
        s.full_name,
        s.student_id,
        f.faculty_name,
        d.department_name,
        s.phone,
        s.email,
        ep.status,
        ep.reason,
        ep.type_id
      FROM event_participants ep
      JOIN students s ON ep.user_id = s.student_id
      LEFT JOIN faculties f ON s.faculty_id = f.faculty_id
      LEFT JOIN departments d ON s.department_id = d.department_id
      WHERE ep.event_id = $1 AND ep.status = $2
      AND ep.type_id = (SELECT id FROM people_types WHERE type_name IN ('Graduates', 'Students') LIMIT 1)
    `;
    const result = await db.query(query, [eventId, status]);
    return result.rows;
  },

  async create(eventData) {
    const { event_name, description, event_date, location, status, max_capacity, created_by } = eventData;
    const query = `
      INSERT INTO events (id, event_name, description, event_date, location, status, max_capacity, created_by)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(query, [
      event_name,
      description,
      event_date,
      location,
      status || 'active',
      max_capacity,
      created_by
    ]);
    return result.rows[0];
  },

  async update(id, eventData) {
    const { event_name, description, event_date, location, status, max_capacity } = eventData;
    const query = `
      UPDATE events
      SET event_name = $1, description = $2, event_date = $3, location = $4, status = $5, max_capacity = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const result = await db.query(query, [event_name, description, event_date, location, status, max_capacity, id]);
    return result.rows[0];
  },

  async delete(id) {
    const query = 'DELETE FROM events WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async getAvailableForTransfer(excludeEventId) {
    const query = `
      SELECT e.id, e.event_name, e.max_capacity, 
             (SELECT COUNT(*) FROM event_participants ep 
              WHERE ep.event_id = e.id AND ep.status = 'eligible' AND ep.is_participating = TRUE) as current_count
      FROM events e
      WHERE e.status = 'active'
      AND e.id != $1
      AND (e.max_capacity IS NULL OR (SELECT COUNT(*) FROM event_participants ep 
                                      WHERE ep.event_id = e.id AND ep.status = 'eligible' AND ep.is_participating = TRUE) < e.max_capacity)
      ORDER BY e.event_date ASC
    `;
    const result = await db.query(query, [excludeEventId]);
    return result.rows;
  }
};

module.exports = EventModel;
