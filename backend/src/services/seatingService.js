const db = require('../config/database');

const SeatingService = {
  /**
   * Batch assigns seats for an entire event based on GPA and Degree ranking.
   * Priority: PhD > Master's > Bachelor's, followed by GPA (Descending).
   */
  async assignSeatsInBatch(event_id, client = db) {
    try {
      // 1. Fetch all eligible graduates and their academic data
      const graduatesQuery = `
        SELECT ep.user_id as student_id, g.degree_level, g.gpa
        FROM event_participants ep
        JOIN graduates g ON ep.user_id = g.student_id
        WHERE ep.event_id::text = $1::text
        AND ep.status = 'eligible'
        AND ep.type_id = (SELECT id FROM people_types WHERE type_name IN ('Graduates', 'Students') LIMIT 1)
        ORDER BY 
          CASE 
            WHEN g.degree_level = 'PhD' THEN 1
            WHEN g.degree_level = 'Master''s' THEN 2
            WHEN g.degree_level = 'Bachelor''s' THEN 3
            ELSE 4
          END ASC,
          g.gpa DESC
      `;
      const gradsRes = await client.query(graduatesQuery, [event_id]);
      const graduates = gradsRes.rows;

      if (graduates.length === 0) return { assigned: 0, message: 'No eligible graduates found.' };

      // 2. Fetch all available seats for this event
      const seatsQuery = `
        SELECT id FROM seats 
        WHERE event_id::text = $1::text
        AND status = 'Available'
        AND category_type = 'Graduate'
        ORDER BY zone, row_number, seat_number
      `;
      const seatsRes = await client.query(seatsQuery, [event_id]);
      const availableSeats = seatsRes.rows;

      if (availableSeats.length < graduates.length) {
        throw new Error(`Insufficient seats. Required: ${graduates.length}, Available: ${availableSeats.length}`);
      }

      // 3. Perform assignments
      let assignedCount = 0;
      for (let i = 0; i < graduates.length; i++) {
        const studentId = graduates[i].student_id;
        const seatId = availableSeats[i].id;

        // Update seat status
        await client.query('UPDATE seats SET status = \'Occupied\' WHERE id = $1', [seatId]);
        
        graduates[i].assigned_seat_id = seatId;
        assignedCount++;
      }

      return { 
        assigned: assignedCount, 
        mapping: graduates.map(g => ({ student_id: g.student_id, seat_id: g.assigned_seat_id })) 
      };
    } catch (error) {
      console.error('--- SEATING SERVICE ERROR ---');
      console.error('Event ID:', event_id);
      console.error('Error Details:', error);
      throw error;
    }
  },

  /**
   * Helper to assign a single seat (legacy/manual use)
   */
  async assignSeat(graduate_id, event_id, attendee_type, client = db) {
    const seatQuery = `
      SELECT id FROM seats 
      WHERE event_id = $1 
      AND status = 'Available'
      AND category_type = $2 
      LIMIT 1
    `;
    
    const category = attendee_type === 'Graduate' ? 'Graduate' : 'Guest';
    const seatRes = await client.query(seatQuery, [event_id, category]);
    
    if (seatRes.rows.length === 0) return null;

    const seatId = seatRes.rows[0].id;
    await client.query('UPDATE seats SET status = \'Occupied\' WHERE id = $1', [seatId]);
    return seatId;
  }
};

module.exports = SeatingService;
