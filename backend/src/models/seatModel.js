const db = require('../config/database');

const GPA_MAPPING = [
  { label: 'A+', min: 4.00, max: 4.00 },
  { label: 'A', min: 3.67, max: 3.99 },
  { label: 'A-', min: 3.33, max: 3.66 },
  { label: 'B+', min: 3.00, max: 3.32 },
  { label: 'B', min: 2.67, max: 2.99 },
  { label: 'B-', min: 2.33, max: 2.66 },
  { label: 'C+', min: 2.00, max: 2.32 },
  { label: 'C', min: 1.67, max: 1.99 },
  { label: 'F', min: 0.00, max: 1.66 }
];

const SeatModel = {
  // --- Seat Groups ---
  async createSeatGroup(groupData) {
    const { event_id, name, target_type, description } = groupData;
    const query = `
      INSERT INTO seat_groups (event_id, name, target_type, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const res = await db.query(query, [event_id, name, target_type, description]);
    return res.rows[0];
  },

  async getSeatGroupsByEvent(eventId) {
    const query = 'SELECT * FROM seat_groups WHERE event_id = $1 ORDER BY created_at ASC';
    const res = await db.query(query, [eventId]);
    return res.rows;
  },

  async getSeatGroupById(id) {
    const query = 'SELECT * FROM seat_groups WHERE id = $1';
    const res = await db.query(query, [id]);
    return res.rows[0];
  },

  async updateSeatGroup(id, groupData) {
    const { name, target_type, description } = groupData;
    const query = `
      UPDATE seat_groups
      SET name = $1, target_type = $2, description = $3
      WHERE id = $4
      RETURNING *
    `;
    const res = await db.query(query, [name, target_type, description, id]);
    return res.rows[0];
  },

  async deleteSeatGroup(id) {
    const query = 'DELETE FROM seat_groups WHERE id = $1';
    await db.query(query, [id]);
    return { success: true };
  },

  // --- Grouped Students ---
  async getGroupedStudents(eventId) {
    const query = `
      SELECT 
        ep.eventparticipant_id, 
        ep.user_id as student_id, 
        s.full_name, 
        s.gpa,
        sa.seat_group_id,
        sg.name as seat_group_name
      FROM event_participants ep
      JOIN students s ON ep.user_id = s.student_id
      LEFT JOIN seat_assignments sa ON ep.eventparticipant_id = sa.eventparticipant_id AND ep.event_id = sa.event_id
      LEFT JOIN seat_groups sg ON sa.seat_group_id = sg.id
      WHERE ep.event_id = $1 AND ep.status = 'eligible' AND ep.type_id IN (
        SELECT id FROM people_types WHERE type_name = 'Graduates'
      )
    `;
    const res = await db.query(query, [eventId]);
    const students = res.rows;

    // University Official Grading Scale
    const mapping = GPA_MAPPING;

    const grouped = {};
    mapping.forEach(m => grouped[m.label] = []);

    students.forEach(s => {
      const gpa = parseFloat(s.gpa || 0);
      const category = mapping.find(m => gpa >= m.min && gpa <= m.max);
      if (category) {
        grouped[category.label].push(s);
      } else {
        // Fallback for edge cases or missing GPA
        if (!grouped['F']) grouped['F'] = [];
        grouped['F'].push(s);
      }
    });

    return grouped;
  },

  // --- Guests ---
  async getGuests(eventId) {
    const query = `
      SELECT 
        ep.eventparticipant_id, 
        ep.user_id, 
        g.guest_name as full_name,
        sa.seat_group_id,
        sg.name as seat_group_name
      FROM event_participants ep
      JOIN guests g ON ep.guest_ref_id = g.guest_id
      LEFT JOIN seat_assignments sa ON ep.eventparticipant_id = sa.eventparticipant_id AND ep.event_id = sa.event_id
      LEFT JOIN seat_groups sg ON sa.seat_group_id = sg.id
      WHERE ep.event_id = $1 AND ep.status = 'eligible' AND ep.type_id IN (
        SELECT id FROM people_types WHERE type_name = 'Guests'
      )
    `;
    const res = await db.query(query, [eventId]);
    return res.rows;
  },

  // --- Assignments ---
  async bulkAssign(eventId, seatGroupId, participantIds) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      if (participantIds.length > 0) {
        // 1. Remove existing assignments for these participants in this event
        await client.query(
          'DELETE FROM seat_assignments WHERE event_id = $1 AND eventparticipant_id = ANY($2::int[])',
          [eventId, participantIds]
        );

        // 2. Perform bulk insert
        const insertQuery = `
          INSERT INTO seat_assignments (event_id, seat_group_id, eventparticipant_id)
          SELECT $1, $2, unnest($3::int[])
        `;
        await client.query(insertQuery, [eventId, seatGroupId, participantIds]);
      }

      await client.query('COMMIT');
      return { success: true, count: participantIds.length };
    } catch (err) {
      if (client) await client.query('ROLLBACK');
      throw err;
    } finally {
      if (client) client.release();
    }
  },

  async bulkAssignByGpaGroups(eventId, seatGroupId, gpaGroups) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Resolve bounds for the selected GPA groups
      const selectedBounds = GPA_MAPPING.filter(m => gpaGroups.includes(m.label));

      if (selectedBounds.length === 0) {
        await client.query('ROLLBACK');
        return { success: true, count: 0 };
      }

      // Build a query with dynamic OR conditions for GPA ranges
      const conditions = selectedBounds.map((_, i) => `(s.gpa >= $${i * 2 + 2} AND s.gpa <= $${i * 2 + 3})`).join(' OR ');
      const findParams = [eventId];
      selectedBounds.forEach(b => {
        findParams.push(b.min, b.max);
      });

      // 1. Find all eligible student IDs in this event matching the GPA categories
      const findParticipantsQuery = `
        SELECT ep.eventparticipant_id
        FROM event_participants ep
        JOIN students s ON ep.user_id = s.student_id
        WHERE ep.event_id = $1 
          AND ep.status = 'eligible'
          AND ep.type_id IN (SELECT id FROM people_types WHERE type_name = 'Graduates')
          AND (${conditions})
      `;

      const participantsRes = await client.query(findParticipantsQuery, findParams);
      const epIds = participantsRes.rows.map(r => r.eventparticipant_id);

      if (epIds.length > 0) {
        // 2. Remove existing assignments for these participants in this event
        await client.query(
          'DELETE FROM seat_assignments WHERE event_id = $1 AND eventparticipant_id = ANY($2::int[])',
          [eventId, epIds]
        );

        // 3. Perform bulk insert
        const insertQuery = `
          INSERT INTO seat_assignments (event_id, seat_group_id, eventparticipant_id)
          SELECT $1, $2, unnest($3::int[])
        `;
        await client.query(insertQuery, [eventId, seatGroupId, epIds]);
      }

      await client.query('COMMIT');
      return { success: true, count: epIds.length };
    } catch (err) {
      if (client) await client.query('ROLLBACK');
      throw err;
    } finally {
      if (client) client.release();
    }
  },

  async getAssignmentsByEvent(eventId) {
    const query = `
      SELECT sa.*, sg.name as seat_group_name, sg.target_type 
      FROM seat_assignments sa
      JOIN seat_groups sg ON sa.seat_group_id = sg.id
      WHERE sa.event_id = $1
    `;
    const res = await db.query(query, [eventId]);
    return res.rows;
  },

  async deleteAssignment(id) {
    const query = 'DELETE FROM seat_assignments WHERE id = $1';
    await db.query(query, [id]);
    return { success: true };
  },

  async updateAssignment(id, seatGroupId) {
    const query = 'UPDATE seat_assignments SET seat_group_id = $1 WHERE id = $2 RETURNING *';
    const res = await db.query(query, [seatGroupId, id]);
    return res.rows[0];
  },

  async getSeatGroupsWithCounts(eventId) {
    const query = `
      SELECT sg.*, COUNT(sa.id)::int as assigned_count
      FROM seat_groups sg
      LEFT JOIN seat_assignments sa ON sg.id = sa.seat_group_id
      WHERE sg.event_id = $1
      GROUP BY sg.id
      ORDER BY sg.name ASC
    `;
    const res = await db.query(query, [eventId]);
    return res.rows;
  },

  async getSeatGroupParticipants(eventId, groupId) {
    const query = `
      SELECT 
        ep.eventparticipant_id,
        ep.user_id,
        pt.type_name,
        COALESCE(s.full_name, g.guest_name) as full_name,
        s.student_id,
        s.gpa,
        g.phone as guest_phone,
        g.email as guest_email
      FROM seat_assignments sa
      JOIN event_participants ep ON sa.eventparticipant_id = ep.eventparticipant_id
      JOIN people_types pt ON ep.type_id = pt.id
      LEFT JOIN students s ON ep.user_id = s.student_id AND pt.type_name = 'Graduates'
      LEFT JOIN guests g ON ep.guest_ref_id = g.guest_id AND pt.type_name = 'Guests'
      WHERE sa.event_id = $1 AND sa.seat_group_id = $2
      ORDER BY full_name ASC
    `;
    const res = await db.query(query, [eventId, groupId]);
    return res.rows;
  },

  async getGroupsWithAssignments(eventId) {
    const query = `
      SELECT 
        sg.id, sg.name, sg.target_type,
        ep.eventparticipant_id,
        ep.user_id,
        pt.type_name,
        COALESCE(s.full_name, g.guest_name) as full_name,
        COALESCE(s.email, g.email) as email,
        COALESCE(s.phone, g.phone) as phone,
        e.event_name,
        e.location as event_location,
        e.event_date
      FROM seat_groups sg
      JOIN seat_assignments sa ON sg.id = sa.seat_group_id
      JOIN event_participants ep ON sa.eventparticipant_id = ep.eventparticipant_id
      JOIN events e ON ep.event_id = e.id
      JOIN people_types pt ON ep.type_id = pt.id
      LEFT JOIN students s ON ep.user_id = s.student_id AND pt.type_name = 'Graduates'
      LEFT JOIN guests g ON ep.guest_ref_id = g.guest_id AND pt.type_name = 'Guests'
      WHERE sg.event_id = $1
      ORDER BY sg.id, full_name
    `;

    const res = await db.query(query, [eventId]);
    const groupsMap = {};
    res.rows.forEach(row => {
      if (!groupsMap[row.id]) {
        groupsMap[row.id] = { id: row.id, name: row.name, target_type: row.target_type, roster: [] };
      }
      groupsMap[row.id].roster.push({
        eventparticipant_id: row.eventparticipant_id,
        user_id: row.user_id,
        type_name: row.type_name,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        event_name: row.event_name,
        event_location: row.event_location,
        event_date: row.event_date
      });
    });
    return Object.values(groupsMap);
  },

  async createManualSeats(eventId, groups) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Clear any existing seating for this event to avoid duplicates
      await client.query('DELETE FROM seat_assignments WHERE event_id = $1', [eventId]);
      await client.query('DELETE FROM seats WHERE event_id = $1', [eventId]);
      await client.query('DELETE FROM seat_groups WHERE event_id = $1', [eventId]);

      const createdGroups = [];
      let totalSeatsCreated = 0;

      for (const g of groups) {
        // 2. Create the Seat Group
        const groupRes = await client.query(
          'INSERT INTO seat_groups (event_id, name, target_type, description) VALUES ($1, $2, $3, $4) RETURNING id, name, target_type',
          [eventId, g.name, g.target_type || 'Both', g.description || '']
        );
        const group = groupRes.rows[0];
        createdGroups.push(group);

        // 3. Create individual Seat records based on quantity
        const quantity = parseInt(g.quantity || 0);
        for (let i = 1; i <= quantity; i++) {
          await client.query(
            'INSERT INTO seats (event_id, zone, seat_number, category_type, status) VALUES ($1, $2, $3, $4, $5)',
            [eventId, group.name, `S-${i}`, group.target_type === 'Student' ? 'Graduate' : (group.target_type === 'Guest' ? 'Guest' : 'VIP'), 'Available']
          );
          totalSeatsCreated++;
        }
      }

      await client.query('COMMIT');
      return { 
        success: true, 
        message: `Successfully created ${createdGroups.length} zones and ${totalSeatsCreated} individual seats.`,
        groups: createdGroups,
        totalSeats: totalSeatsCreated
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = SeatModel;
