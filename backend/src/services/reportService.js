const db = require('../config/database');

const ReportService = {
  async getEventsList() {
    const result = await db.query(`
      SELECT id, event_name, event_date, status
      FROM events
      ORDER BY event_date DESC
    `);
    return result.rows;
  },

  async getEventReport(eventId) {
    const [eventRes, participantRes, attendanceRes, invitationRes] = await Promise.all([
      db.query('SELECT * FROM events WHERE id = $1', [eventId]),
      db.query(`
        SELECT 
          pt.type_name, 
          COUNT(ep.eventparticipant_id)::int as count
        FROM people_types pt
        LEFT JOIN event_participants ep ON ep.type_id = pt.id AND ep.event_id = $1
        GROUP BY pt.id, pt.type_name
      `, [eventId]),
      db.query(`
        SELECT 
          (SELECT COUNT(*)::int FROM event_participants WHERE event_id = $1) as total_participants,
          (SELECT COUNT(*)::int FROM attendance_records WHERE event_id = $1) as attended_count
      `, [eventId]),
      db.query(`
        SELECT 
          COALESCE(SUM(quantity), 0)::int as total_invitations,
          (SELECT COUNT(*)::int FROM invitation_requests WHERE event_id = $1 AND status = 'PENDING') as pending_requests,
          (SELECT COUNT(*)::int FROM invitation_requests WHERE event_id = $1 AND status = 'REJECTED') as rejected_requests
        FROM invitations
        WHERE event_id = $1
      `, [eventId])
    ]);

    if (eventRes.rowCount === 0) {
      throw new Error('Event not found');
    }

    const event = eventRes.rows[0];
    const participants = participantRes.rows;
    const attendance = attendanceRes.rows[0];
    const invitations = invitationRes.rows[0];

    // Detailed lists
    const [attendedList, absentList] = await Promise.all([
      db.query(`
        SELECT 
          COALESCE(s.full_name, g.guest_name, ep.user_id) as name,
          pt.type_name as type,
          ar.scanned_at as time
        FROM attendance_records ar
        JOIN invitations i ON i.id = ar.invitation_id
        JOIN event_participants ep ON ep.eventparticipant_id = ar.participant_id
        JOIN people_types pt ON pt.id = ep.type_id
        LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
        LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
        WHERE ar.event_id = $1
        ORDER BY ar.scanned_at DESC
      `, [eventId]),
      db.query(`
        SELECT 
          COALESCE(s.full_name, g.guest_name, ep.user_id) as name,
          pt.type_name as type
        FROM event_participants ep
        JOIN people_types pt ON pt.id = ep.type_id
        LEFT JOIN students s ON pt.table_name = 'students' AND s.student_id = ep.user_id
        LEFT JOIN guests g ON pt.table_name = 'guests' AND g.guest_id = ep.guest_ref_id
        LEFT JOIN attendance_records ar ON ar.event_id = ep.event_id AND ar.participant_id = ep.eventparticipant_id
        WHERE ep.event_id = $1 AND ar.id IS NULL
          AND ep.status = 'eligible'
      `, [eventId])
    ]);

    return {
      summary: {
        id: event.id,
        name: event.event_name,
        date: event.event_date,
        capacity: event.max_capacity,
        total_invitations: invitations.total_invitations,
        total_attended: attendance.attended_count,
        remaining_capacity: Math.max(0, (event.max_capacity || 0) - attendance.attended_count)
      },
      participant_breakdown: participants,
      attendance_analysis: {
        attended: attendance.attended_count,
        absent: Math.max(0, attendance.total_participants - attendance.attended_count),
        percentage: attendance.total_participants > 0 ? Math.round((attendance.attended_count / attendance.total_participants) * 100) : 0
      },
      invitation_analysis: {
        sent: invitations.total_invitations,
        pending: invitations.pending_requests,
        rejected: invitations.rejected_requests
      },
      lists: {
        attended: attendedList.rows,
        absent: absentList.rows
      }
    };
  }
};

module.exports = ReportService;
