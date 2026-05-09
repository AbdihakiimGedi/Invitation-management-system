const db = require('../config/database');
const ActivityLogService = require('./activityLogService');

const DashboardService = {
  async ensureOptionalSchema() {
    await ActivityLogService.ensureSchema();
  },

  async getOverview() {
    await this.ensureOptionalSchema();
    const [metricsRes, participantTypesRes, invitationsPerEventRes, attendancePerEventRes, requestTrendsRes, recentActivityRes, extremeAttendanceRes, eventStatsRes] = await Promise.all([
      db.query(`
        SELECT
          (SELECT COUNT(*)::int FROM event_participants ep JOIN people_types pt ON pt.id = ep.type_id WHERE pt.table_name = 'students') AS graduates,
          (SELECT COUNT(*)::int FROM event_participants ep JOIN people_types pt ON pt.id = ep.type_id WHERE pt.type_name = 'Guests') AS guests,
          (SELECT COUNT(*)::int FROM event_participants ep JOIN people_types pt ON pt.id = ep.type_id WHERE pt.type_name = 'VIP Guests') AS vip_guests,
          (SELECT COUNT(*)::int FROM event_participants) AS total_participants,
          (SELECT COUNT(*)::int FROM events) AS total_events,
          (SELECT COUNT(*)::int FROM events WHERE event_date >= CURRENT_TIMESTAMP) AS active_events,
          (SELECT COUNT(*)::int FROM events WHERE event_date < CURRENT_TIMESTAMP) AS finished_events,
          (SELECT COALESCE(SUM(quantity), 0)::int FROM invitations) AS total_invitations_sent,
          (SELECT COUNT(*)::int FROM attendance_records) AS total_attended,
          (SELECT COUNT(*)::int FROM invitation_requests WHERE status = 'PENDING') AS pending_invitation_requests
      `),
      db.query(`
        SELECT pt.type_name, COUNT(ep.eventparticipant_id)::int AS count
        FROM people_types pt
        LEFT JOIN event_participants ep ON ep.type_id = pt.id
        GROUP BY pt.id, pt.type_name
        ORDER BY count DESC, pt.type_name ASC
      `),
      db.query(`
        SELECT e.id, e.event_name, COALESCE(SUM(i.quantity), 0)::int AS invitations
        FROM events e
        LEFT JOIN invitations i ON i.event_id = e.id
        GROUP BY e.id, e.event_name, e.event_date
        ORDER BY e.event_date ASC
        LIMIT 10
      `),
      db.query(`
        SELECT 
          e.id, 
          e.event_name, 
          COUNT(ar.id)::int AS attended,
          COALESCE(SUM(i.quantity), 0)::int AS invitations
        FROM events e
        LEFT JOIN invitations i ON i.event_id = e.id
        LEFT JOIN attendance_records ar ON ar.event_id = e.id
        GROUP BY e.id, e.event_name, e.event_date
        ORDER BY e.event_date ASC
        LIMIT 10
      `),
      db.query(`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS requests
        FROM invitation_requests
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),
      db.query(`
        SELECT
          l.id,
          l.action_type,
          l.description,
          l.created_at,
          COALESCE(u.full_name, u.username, 'System') AS performed_by
        FROM system_activity_logs l
        LEFT JOIN users u ON u.id = l.actor_user_id
        ORDER BY l.created_at DESC
        LIMIT 10
      `),
      db.query(`
        WITH event_attendance AS (
          SELECT e.id, e.event_name, COUNT(ar.id)::int AS attended
          FROM events e
          LEFT JOIN attendance_records ar ON ar.event_id = e.id
          GROUP BY e.id, e.event_name
        )
        SELECT 
          (SELECT event_name FROM event_attendance ORDER BY attended DESC LIMIT 1) AS highest_attended_event,
          (SELECT attended FROM event_attendance ORDER BY attended DESC LIMIT 1) AS highest_count,
          (SELECT event_name FROM event_attendance ORDER BY attended ASC LIMIT 1) AS lowest_attended_event,
          (SELECT attended FROM event_attendance ORDER BY attended ASC LIMIT 1) AS lowest_count
      `),
      db.query(`
        SELECT 
          e.event_name,
          COUNT(ep.eventparticipant_id)::int AS participant_count
        FROM events e
        LEFT JOIN event_participants ep ON ep.event_id = e.id
        GROUP BY e.id, e.event_name
        ORDER BY e.created_at DESC
        LIMIT 10
      `)
    ]);

    const metrics = metricsRes.rows[0];
    const attendanceRate = metrics.total_invitations_sent > 0 
      ? Math.round((metrics.total_attended / metrics.total_invitations_sent) * 100) 
      : 0;

    return {
      metrics: {
        ...metrics,
        attendance_rate: attendanceRate
      },
      summary: extremeAttendanceRes.rows[0],
      analytics: {
        participant_type_distribution: participantTypesRes.rows,
        invitations_per_event: invitationsPerEventRes.rows,
        attendance_per_event: attendancePerEventRes.rows,
        invitation_request_trends: requestTrendsRes.rows,
        event_participant_counts: eventStatsRes.rows
      },
      recent_activity: recentActivityRes.rows
    };
  }
};

module.exports = DashboardService;
