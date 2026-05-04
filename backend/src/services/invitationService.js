const InvitationModel = require('../models/invitationModel');
const InvitationBatchModel = require('../models/invitationBatchModel');
const SeatModel = require('../models/seatModel');
const CommunicationService = require('./communicationService');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../config/database');


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

      // 2. STRICTURE: Fetch available physical seats from the 'seats' table
      const availableSeatsRes = await db.query(
        "SELECT id, zone, seat_number, category_type FROM seats WHERE event_id = $1 AND status = 'Available' ORDER BY zone, id",
        [batch.event_id]
      );
      const availableSeats = availableSeatsRes.rows;

      if (availableSeats.length === 0) {
        throw new Error('Seats must be created before generating invitations.');
      }

      // 3. Fetch all eligible participants for this event
      const participantsRes = await db.query(
        "SELECT ep.eventparticipant_id, ep.user_id, s.full_name, s.email, e.event_name, e.location as event_location, e.event_date FROM event_participants ep JOIN students s ON ep.user_id = s.student_id JOIN events e ON ep.event_id = e.id WHERE ep.event_id = $1 AND ep.status = 'eligible'",
        [batch.event_id]
      );
      const participants = participantsRes.rows;

      if (participants.length > availableSeats.length) {
        throw new Error(`Insufficient seats. Required: ${participants.length}, Available: ${availableSeats.length}. Please define more seats in the Seat Management Panel.`);
      }

      await InvitationBatchModel.updateProgress(batch.id, 0);

      // 4. Process each person and assign a seat
      let processed = 0;
      const qtyPerPerson = batch.qty_per_person || 1;

      for (let i = 0; i < participants.length; i++) {
        const person = participants[i];
        const seat = availableSeats[i]; // Sequential assignment from pool

        try {
          const generatedTokens = [];
          
          for (let j = 0; j < qtyPerPerson; j++) {
            const token = crypto.randomBytes(32).toString('hex');
            
            await InvitationModel.create({
              event_id: batch.event_id,
              eventparticipant_id: person.eventparticipant_id,
              seat_id: seat.id, // Linked to individual seat
              qr_token: token,
              quantity: 1
            });
            
            generatedTokens.push(token);
          }

          // Mark seat as occupied
          await db.query("UPDATE seats SET status = 'Occupied' WHERE id = $1", [seat.id]);

          // Send notification with all tokens
          let formattedDate = 'TBD';
          let formattedTime = 'TBD';
          if (person.event_date) {
            const d = new Date(person.event_date);
            formattedDate = d.toLocaleDateString();
            formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          if (person.email) {
            await CommunicationService.sendEmail(
              person.email, 
              `Graduation Invitation – ${person.event_name}`, 
              { 
                qrTokens: generatedTokens, 
                fullName: person.full_name,
                eventName: person.event_name, 
                groupName: seat.zone, // Use seat zone/group name
                seatNumber: seat.seat_number,
                qty: qtyPerPerson,
                eventLocation: person.event_location,
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
  },

  /**
   * Automatically generates invitations for all eligible participants of an event
   * who don't already have one. Database-driven approach.
   */
  async autoGenerateForEvent(eventId, client = db) {
    console.log(`[INVITATION] Auto-generating invitations for Event: ${eventId}`);
    
    // Step 1: Strict Seat Verification (Check for groups)
    const groupCheck = await client.query('SELECT COUNT(*) FROM seat_groups WHERE event_id = $1', [eventId]);
    if (parseInt(groupCheck.rows[0].count) === 0) {
      throw new Error("Seats must be created before generating invitations.");
    }

    // Step 2: Fetch Available Seats
    const availableSeatsRes = await client.query(
      "SELECT id FROM seats WHERE event_id = $1 AND status = 'Available' ORDER BY zone, id",
      [eventId]
    );
    const availableSeats = availableSeatsRes.rows;

    // Step 3: Fetch Participants who need invitations
    const participantsRes = await client.query(`
      SELECT ep.eventparticipant_id 
      FROM event_participants ep 
      WHERE ep.event_id = $1 
        AND ep.status = 'eligible'
        AND NOT EXISTS (SELECT 1 FROM invitations i WHERE i.eventparticipant_id = ep.eventparticipant_id)
      ORDER BY ep.eventparticipant_id
    `, [eventId]);
    const participants = participantsRes.rows;

    if (participants.length === 0) return { count: 0 };

    if (participants.length > availableSeats.length) {
      throw new Error(`Insufficient seats. Required: ${participants.length}, Available: ${availableSeats.length}. Please define more seats.`);
    }

    // Step 4: Atomic Assignment & Creation
    let createdCount = 0;
    for (let i = 0; i < participants.length; i++) {
      const epId = participants[i].eventparticipant_id;
      const seatId = availableSeats[i].id;
      const token = crypto.randomBytes(32).toString('hex');

      await client.query(`
        INSERT INTO invitations (id, event_id, eventparticipant_id, seat_id, qr_token, quantity, status, comm_status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 1, 'ACTIVE', 'PENDING')
      `, [eventId, epId, seatId, token]);

      await client.query("UPDATE seats SET status = 'Occupied' WHERE id = $1", [seatId]);
      createdCount++;
    }

    console.log(`[INVITATION] Created ${createdCount} new invitations for event ${eventId}`);
    return { count: createdCount };
  }
};

module.exports = InvitationService;
