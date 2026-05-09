const InvitationModel = require('../models/invitationModel');
const InvitationBatchModel = require('../models/invitationBatchModel');
const SeatModel = require('../models/seatModel');
const CommunicationService = require('./communicationService');
const InvitationManagementService = require('./invitationManagementService');
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
        "SELECT ep.eventparticipant_id, ep.user_id, s.full_name, s.email, s.phone, e.event_name, e.location as event_location, e.event_date FROM event_participants ep JOIN students s ON ep.user_id = s.student_id JOIN events e ON ep.event_id = e.id WHERE ep.event_id = $1 AND ep.status = 'eligible'",
        [batch.event_id]
      );
      const participants = participantsRes.rows;

      if (participants.length > availableSeats.length) {
        throw new Error(`Insufficient seats. Required: ${participants.length}, Available: ${availableSeats.length}. Please define more seats in the Seat Management Panel.`);
      }

      await InvitationBatchModel.updateProgress(batch.id, 0);

      // 4. Process each person and assign a seat
      let processed = 0;
      let blocked = 0;
      const qtyPerPerson = batch.qty_per_person || 1;

      for (let i = 0; i < participants.length; i++) {
        const person = participants[i];
        const seat = availableSeats[i]; // Sequential assignment from pool

        try {
          await InvitationManagementService.assertCapacity(batch.event_id, qtyPerPerson);
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

          if (person.phone) {
            const waMessage = `Hello ${person.full_name},

You are officially invited to the  ceremony.

Event: ${person.event_name}
Location: ${person.event_location || 'TBD'}
📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
Seat Group: ${seat.zone}`;

            await CommunicationService.sendWhatsApp(
              person.phone, 
              waMessage, 
              { qrTokens: generatedTokens }
            );
          }

          processed++;
          if (processed % 5 === 0 || processed + blocked === participants.length) {
            await InvitationBatchModel.updateProgress(batch.id, processed);
          }
        } catch (err) {
          if (err.statusCode === 409) {
            blocked++;
            console.warn(`[INVITATION] Blocked ${person.user_id}: Event capacity is full. No more invitations are available for this event.`);
            continue;
          }
          console.error(`Failed to process invitation for ${person.user_id}:`, err);
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
    
    // Step 1: The Assign People flow owns classification, logical groups, and
    // physical seat availability. This removes the old manual pre-step.
    await SeatModel.ensureUnifiedAssignmentFlow(eventId, client);
    const startingCapacity = await InvitationManagementService.getCapacity(eventId, client);
    if (startingCapacity.remaining_invitations === 0) {
      return {
        count: 0,
        blocked: 0,
        message: 'Event capacity is full. No more invitations are available for this event.',
        capacity: startingCapacity
      };
    }

    // Step 2: Fetch Participants who need invitations with their resolved group.
    const participantsRes = await client.query(`
      SELECT
        ep.eventparticipant_id,
        sa.seat_group_id,
        sg.name AS seat_group_name
      FROM event_participants ep 
      JOIN seat_assignments sa
        ON sa.eventparticipant_id = ep.eventparticipant_id
       AND sa.event_id = ep.event_id
      JOIN seat_groups sg ON sg.id = sa.seat_group_id
      WHERE ep.event_id = $1 
        AND ep.status = 'eligible'
        AND NOT EXISTS (SELECT 1 FROM invitations i WHERE i.eventparticipant_id = ep.eventparticipant_id)
      ORDER BY sg.name, ep.eventparticipant_id
    `, [eventId]);
    const participants = participantsRes.rows;

    if (participants.length === 0) return { count: 0 };
    const allowedCount = startingCapacity.remaining_invitations === null
      ? participants.length
      : Math.min(participants.length, startingCapacity.remaining_invitations);
    const participantsToInvite = participants.slice(0, allowedCount);
    const blockedCount = participants.length - participantsToInvite.length;

    // Step 4: Atomic Assignment & Creation
    let createdCount = 0;
    for (let i = 0; i < participantsToInvite.length; i++) {
      const participant = participantsToInvite[i];
      const epId = participant.eventparticipant_id;
      await InvitationManagementService.assertCapacity(eventId, 1, client);
      const seatRes = await client.query(`
        SELECT id
        FROM seats
        WHERE event_id = $1
          AND zone = $2
          AND status = 'Available'
        ORDER BY seat_number, id
        LIMIT 1
      `, [eventId, participant.seat_group_name]);

      if (seatRes.rowCount === 0) {
        throw new Error(`No available seats in ${participant.seat_group_name}.`);
      }

      const seatId = seatRes.rows[0].id;
      const token = crypto.randomBytes(32).toString('hex');

      await client.query(`
        INSERT INTO invitations (id, event_id, eventparticipant_id, seat_id, seat_group_id, qr_token, quantity, status, comm_status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 1, 'ACTIVE', 'PENDING')
      `, [eventId, epId, seatId, participant.seat_group_id, token]);

      await client.query("UPDATE seats SET status = 'Occupied' WHERE id = $1", [seatId]);
      createdCount++;
    }

    console.log(`[INVITATION] Created ${createdCount} new invitations for event ${eventId}`);
    return {
      count: createdCount,
      blocked: blockedCount,
      message: blockedCount > 0
        ? 'Event capacity is full. No more invitations are available for this event.'
        : undefined,
      capacity: await InvitationManagementService.getCapacity(eventId, client)
    };
  }
};

module.exports = InvitationService;
