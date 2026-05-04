const db = require('../config/database');
const CommunicationService = require('./communicationService');

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
      SELECT 
        i.id as invitation_id,
        i.qr_token,
        se.seat_number,
        se.zone as seat_group_name,
        s.email,
        s.full_name,
        e.event_name,
        e.event_date,
        e.location
      FROM invitations i
      JOIN event_participants ep ON i.eventparticipant_id = ep.eventparticipant_id
      JOIN students s ON ep.user_id = s.student_id
      JOIN events e ON i.event_id = e.id
      JOIN seats se ON i.seat_id = se.id
      WHERE i.event_id = $1 
        AND i.comm_status = 'PENDING'
    `;
    
    try {
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
          `Official Graduation Invitation: ${inv.event_name}`, 
          {
            fullName: inv.full_name,
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
  }
};

module.exports = InvitationEmailService;
