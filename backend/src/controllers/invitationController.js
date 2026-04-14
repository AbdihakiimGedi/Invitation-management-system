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
