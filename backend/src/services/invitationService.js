const InvitationModel = require('../models/invitationModel');
const InvitationBatchModel = require('../models/invitationBatchModel');
const SeatModel = require('../models/seatModel');
const CommunicationService = require('./communicationService');
const QRCode = require('qrcode');
const crypto = require('crypto');


const InvitationService = {
  isProcessing: false,

  /**
   * Starts the background processing loop.
   * In a real production app, this would be a separate worker process or a Bull queue.
   */
  startWorker() {
    console.log('[INVITATION] Worker started.');
    setInterval(() => this.processNextBatch(), 5000); // Check every 5 seconds
  },

  async processNextBatch() {
    if (this.isProcessing) return;
    
    const batch = await InvitationBatchModel.getPendingBatch();
    if (!batch) return;

    this.isProcessing = true;
    console.log(`[INVITATION] Processing batch: ${batch.id} for Event: ${batch.event_id}`);

    try {
      // 1. Mark batch as processing
      await InvitationBatchModel.updateStatus(batch.id, 'Processing');

      // 2. Fetch all seat assignments for this event
      const assignments = await SeatModel.getGroupsWithAssignments(batch.event_id);
      
      // Flatten assignments (assignments is an array of groups, each with a roster)
      let totalToProcess = 0;
      const tasks = [];
      
      for (const group of assignments) {
        if (!group.roster) continue;
        for (const person of group.roster) {
          totalToProcess++;
          tasks.push({
            event_id: batch.event_id,
            eventparticipant_id: person.eventparticipant_id,
            seat_group_id: group.id,
            person: person,
            groupName: group.name
          });
        }
      }

      await InvitationBatchModel.updateProgress(batch.id, 0); // Reset progress

      // 3. Process each person
      let processed = 0;
      const qtyPerPerson = batch.qty_per_person || 1;

      for (const task of tasks) {
        try {
          // Generate multiple invitations if qty_per_person > 1
          const generatedTokens = [];
          
          for (let i = 0; i < qtyPerPerson; i++) {
            const token = crypto.randomBytes(32).toString('hex');
            
            await InvitationModel.create({
              event_id: task.event_id,
              eventparticipant_id: task.eventparticipant_id,
              seat_group_id: task.seat_group_id,
              qr_token: token,
              quantity: 1
            });
            
            generatedTokens.push(token);
          }

          // Send notification with all tokens
          let formattedDate = 'TBD';
          let formattedTime = 'TBD';
          if (task.person.event_date) {
            const d = new Date(task.person.event_date);
            formattedDate = d.toLocaleDateString();
            formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          const eventLocation = task.person.event_location || 'TBD';

          if (task.person.email) {
            await CommunicationService.sendEmail(
              task.person.email, 
              `Graduation Invitation – ${task.person.event_name}`, 
              { 
                qrTokens: generatedTokens, 
                fullName: task.person.full_name,
                eventName: task.person.event_name, 
                groupName: task.groupName, 
                qty: qtyPerPerson,
                eventLocation,
                eventDate: formattedDate,
                eventTime: formattedTime
              }
            );
          }

          if (task.person.phone) {
            const waMessage = `Hello ${task.person.full_name},

You are officially invited to the graduation ceremony.

📌 Event: ${task.person.event_name}
📍 Location: ${eventLocation}
📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
🪑 Seat Group: ${task.groupName}`;

            await CommunicationService.sendWhatsApp(
              task.person.phone, 
              waMessage, 
              { qrTokens: generatedTokens }
            );
          }

          processed++;
          if (processed % 5 === 0 || processed === tasks.length) {
            await InvitationBatchModel.updateProgress(batch.id, processed);
          }
        } catch (err) {
          console.error(`Failed to process invitation for ${task.person.user_id}:`, err);
        }
      }

      // 4. Finalize batch
      await InvitationBatchModel.updateStatus(batch.id, 'Completed');
      console.log(`[INVITATION] Batch ${batch.id} completed successfully.`);

    } catch (error) {
      console.error(`[INVITATION] Batch ${batch.id} failed:`, error);
      await InvitationBatchModel.setError(batch.id, error.message);
    } finally {
      this.isProcessing = false;
    }
  }
};

module.exports = InvitationService;
