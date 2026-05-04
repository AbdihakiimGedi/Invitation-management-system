const InvitationBatchModel = require('../models/invitationBatchModel');
const InvitationModel = require('../models/invitationModel');

const InvitationController = {
  /**
   * Creates a new generation batch.
   * This just adds a record to invitation_batches with 'Pending' status.
   * The background worker will pick it up.
   */
  async createBatch(req, res) {
    try {
      const { event_id, batch_name, total_count, qty_per_person } = req.body;
      
      if (!event_id) {
        return res.status(400).json({ error: 'Event ID is required' });
      }

      const batch = await InvitationBatchModel.create({
        event_id,
        batch_name: batch_name || `Batch ${new Date().toLocaleString()}`,
        total_count: total_count || 0,
        qty_per_person: qty_per_person || 1
      });

      res.status(201).json({
        message: 'Invitation generation started in background.',
        batch
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getBatches(req, res) {
    try {
      const { eventId } = req.params;
      const batches = await InvitationBatchModel.getAllByEvent(eventId);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Triggers seating initialization for the event.
   * This prepares the seat_assignments needed for invitation generation.
   */
  async initializeEventSeating(req, res) {
    try {
      const { event_id, groups } = req.body;
      if (!event_id) return res.status(400).json({ error: 'Event ID is required' });

      const SeatModel = require('../models/seatModel');
      
      // If groups are provided, we perform manual creation
      if (groups && Array.isArray(groups) && groups.length > 0) {
        const result = await SeatModel.createManualSeats(event_id, groups);
        return res.json({ success: true, message: result.message, total_seats: result.totalSeats });
      }

      // If no groups provided, we check if seats ALREADY exist (Verification mode)
      const existingGroups = await SeatModel.getSeatGroupsByEvent(event_id);
      if (existingGroups.length === 0) {
        return res.status(400).json({ 
          error: 'Seats must be created before generating invitations. Please use the Seat Management panel to define your seating architecture.' 
        });
      }

      res.json({
        success: true,
        message: 'Seating architecture verified.',
        groups_count: existingGroups.length
      });
    } catch (error) {
      console.error('[INVITATION-CTRL] Seating initialization error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Public/Scanner endpoint to verify an invitation
   */
  async verifyInvitation(req, res) {
    try {
      const { token } = req.body;
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const result = await InvitationModel.verifyAndUse(token, deviceInfo, ipAddress);

      if (result.success) {
        res.json({
          success: true,
          message: 'Entry Verified',
          invitation: result.invitation
        });
      } else {
        const errorMsg = result.reason === 'ALREADY_USED' ? 'Invitation already scanned at gate.' : 'Invalid or fake invitation.';
        res.status(400).json({
          success: false,
          error: result.reason,
          message: errorMsg,
          invitation: result.invitation
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = InvitationController;
