const db = require('../config/database');
const CommunicationService = require('./communicationService');
const ActivityLogService = require('./activityLogService');

/**
 * Service to handle automatic email dispatch after invitation generation.
 */
const InvitationEmailService = {
  /**
   * Sends emails for all invitations in 'PENDING' communication status for a specific event.
   * @param {string} eventId - The UUID of the event
   * @returns {Promise<number>} - Number of successfully sent emails
   */
  async sendInvitations(eventId) {
    console.log(`[DEBUG-EMAIL] Called sendInvitations for event: ${eventId}`);
    console.log(`[EMAIL-SERVICE] Checking for pending invitations for Event: ${eventId}`);

    // 1. Fetch pending invitations with student and event details
    // We join event_participants to get the user_id (student_id)
    const query = `
      SELECT *
      FROM (
        SELECT 
          i.id as invitation_id,
          i.comm_status,
          i.qr_token,
          se.seat_number,
          se.zone as seat_group_name,
          COALESCE(s.email, g.email) as email,
          COALESCE(s.full_name, g.guest_name) as full_name,
          pt.type_name,
          pt.table_name,
          e.event_name,
          e.event_date,
          e.location,
          e.max_capacity,
          SUM(i.quantity) OVER (PARTITION BY i.event_id ORDER BY i.created_at ASC NULLS LAST, i.id) AS capacity_position
        FROM invitations i
        JOIN event_participants ep ON i.eventparticipant_id = ep.eventparticipant_id
        JOIN people_types pt ON ep.type_id = pt.id
        LEFT JOIN students s ON ep.user_id = s.student_id AND pt.table_name = 'students'
        LEFT JOIN guests g ON ep.guest_ref_id = g.guest_id AND pt.table_name = 'guests'
        JOIN events e ON i.event_id = e.id
        LEFT JOIN seats se ON i.seat_id = se.id
        WHERE i.event_id = $1
      ) pending
      WHERE comm_status = 'PENDING'
        AND email IS NOT NULL
        AND (max_capacity IS NULL OR capacity_position <= max_capacity)
    `;
    
    try {
      await db.query(`
        UPDATE invitations overflow_i
        SET comm_status = 'BLOCKED_CAPACITY'
        FROM (
          SELECT
            i.id,
            e.max_capacity,
            SUM(i.quantity) OVER (PARTITION BY i.event_id ORDER BY i.created_at ASC NULLS LAST, i.id) AS capacity_position
          FROM invitations i
          JOIN events e ON e.id = i.event_id
          WHERE i.event_id = $1
            AND e.max_capacity IS NOT NULL
        ) ranked
        WHERE overflow_i.id = ranked.id
          AND overflow_i.comm_status = 'PENDING'
          AND ranked.capacity_position > ranked.max_capacity
      `, [eventId]);

      const result = await db.query(query, [eventId]);
      const pending = result.rows;
      
      if (pending.length === 0) {
        console.log(`[EMAIL-SERVICE] No pending invitations found for event ${eventId}`);
        return 0;
      }
      
      console.log(`[EMAIL-SERVICE] Dispatching ${pending.length} invitations...`);
      
      let sentCount = 0;
      for (const inv of pending) {
        // Format date and time from the TIMESTAMP event_date
        let formattedDate = 'TBD';
        let formattedTime = 'TBD';
        
        if (inv.event_date instanceof Date) {
          formattedDate = inv.event_date.toLocaleDateString();
          formattedTime = inv.event_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const success = await CommunicationService.sendEmail(
          inv.email, 
          `Official ${inv.type_name} Invitation: ${inv.event_name}`, 
          {
            fullName: inv.full_name,
            participantTypeName: inv.type_name,
            eventName: inv.event_name,
            eventDate: formattedDate,
            eventTime: formattedTime,
            eventLocation: inv.location || 'Main Hall',
            qrTokens: [inv.qr_token],
            seatNumber: inv.seat_number,
            qty: 1,
            groupName: inv.seat_group_name || 'General Registry'
          }
        );
        
        if (success) {
          await db.query('UPDATE invitations SET comm_status = \'SENT\' WHERE id = $1', [inv.invitation_id]);
          await ActivityLogService.log({
            actionType: 'INVITATION_SENT',
            entityType: 'invitations',
            entityId: inv.invitation_id,
            description: `Invitation sent to ${inv.full_name}`,
            metadata: { event_name: inv.event_name }
          });
          sentCount++;
        } else {
          // Mark as failed so we can identify issues in logs
          await db.query('UPDATE invitations SET comm_status = \'FAILED\' WHERE id = $1', [inv.invitation_id]);
        }
      }
      
      console.log(`[EMAIL-SERVICE] ✅ Dispatch complete. Sent: ${sentCount}, Failed: ${pending.length - sentCount}`);
      return sentCount;
    } catch (error) {
      console.error('[EMAIL-SERVICE] ❌ Error during email dispatch:', error);
      throw error;
    }
  },

  async resendParticipantInvitation(eventParticipantId, emailOverride = null) {
    const query = `
      SELECT 
        i.id as invitation_id,
        i.qr_token,
        se.seat_number,
        se.zone as seat_group_name,
        COALESCE($2, s.email, g.email) as email,
        COALESCE(s.full_name, g.guest_name) as full_name,
        pt.type_name,
        e.event_name,
        e.event_date,
        e.location
      FROM invitations i
      JOIN event_participants ep ON i.eventparticipant_id = ep.eventparticipant_id
      JOIN people_types pt ON ep.type_id = pt.id
      LEFT JOIN students s ON ep.user_id = s.student_id AND pt.table_name = 'students'
      LEFT JOIN guests g ON ep.guest_ref_id = g.guest_id AND pt.table_name = 'guests'
      JOIN events e ON i.event_id = e.id
      LEFT JOIN seats se ON i.seat_id = se.id
      WHERE i.eventparticipant_id = $1
        AND COALESCE($2, s.email, g.email) IS NOT NULL
      ORDER BY i.created_at DESC NULLS LAST
    `;

    const result = await db.query(query, [eventParticipantId, emailOverride]);
    const invitations = result.rows;
    if (invitations.length === 0) {
      return { sent: 0, reason: 'No invitation found for participant' };
    }

    let sent = 0;
    for (const inv of invitations) {
      let formattedDate = 'TBD';
      let formattedTime = 'TBD';
      if (inv.event_date instanceof Date) {
        formattedDate = inv.event_date.toLocaleDateString();
        formattedTime = inv.event_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const success = await CommunicationService.sendEmail(
        inv.email,
        `Official ${inv.type_name} Invitation: ${inv.event_name}`,
        {
          fullName: inv.full_name,
          participantTypeName: inv.type_name,
          eventName: inv.event_name,
          eventDate: formattedDate,
          eventTime: formattedTime,
          eventLocation: inv.location || 'Main Hall',
          qrTokens: [inv.qr_token],
          seatNumber: inv.seat_number,
          qty: 1,
          groupName: inv.seat_group_name || 'General Registry'
        }
      );

      await db.query(
        "UPDATE invitations SET comm_status = $1 WHERE id = $2",
        [success ? 'SENT' : 'FAILED', inv.invitation_id]
      );
      if (success) sent++;
    }

    return { sent };
  }
};

module.exports = InvitationEmailService;
