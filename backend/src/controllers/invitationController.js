const InvitationBatchModel = require('../models/invitationBatchModel');
const InvitationModel = require('../models/invitationModel');
const QRCodeService = require('../services/qrcodeService');
const InvitationManagementService = require('../services/invitationManagementService');
const ActivityLogService = require('../services/activityLogService');

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

  async getManagementEvents(req, res) {
    try {
      const events = await InvitationManagementService.listEvents();
      res.json({ status: 'success', data: events });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getSentParticipants(req, res) {
    try {
      const data = await InvitationManagementService.listSentParticipants(req.params.eventId);
      res.json({ status: 'success', data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async resendParticipantInvitation(req, res) {
    try {
      const data = await InvitationManagementService.resendParticipantInvitation(
        req.params.eventId,
        req.params.eventParticipantId
      );
      await ActivityLogService.log({
        actorUserId: req.user.id,
        actionType: 'INVITATION_RESENT',
        entityType: 'event_participants',
        entityId: req.params.eventParticipantId,
        description: `Invitation resent for participant ID: ${req.params.eventParticipantId}`,
        metadata: { event_id: req.params.eventId }
      });
      res.json({ status: 'success', data, message: 'Invitation resend processed successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        data: error.capacity ? { capacity: error.capacity } : undefined
      });
    }
  },

  async createMoreInvitationRequest(req, res) {
    try {
      const request = await InvitationManagementService.createRequest(req.user.id, req.body);
      res.status(201).json({ status: 'success', data: request, message: 'Invitation request submitted successfully' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  async getMoreInvitationRequests(req, res) {
    try {
      const requests = await InvitationManagementService.listRequests(req.params.eventId);
      res.json({ status: 'success', data: requests });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getMoreInvitationRequestDetails(req, res) {
    try {
      const request = await InvitationManagementService.getRequestDetails(req.params.requestId);
      if (!request) return res.status(404).json({ error: 'Invitation request not found' });
      res.json({ status: 'success', data: request });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async approveMoreInvitationRequest(req, res) {
    try {
      const data = await InvitationManagementService.approveRequest(req.params.requestId, req.user.id);
      await ActivityLogService.log({
        actorUserId: req.user.id,
        actionType: 'INVITATION_REQUEST_APPROVED',
        entityType: 'invitation_requests',
        entityId: req.params.requestId,
        description: `Invitation request approved: ${req.params.requestId}`
      });
      res.json({ status: 'success', data, message: data.message });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  async getMyInvitations(req, res) {
    try {
      const invitations = await InvitationModel.getForUser(req.user.id);
      const enriched = await Promise.all(invitations.map(async (invitation) => ({
        ...invitation,
        qr_code: invitation.qr_token ? await QRCodeService.generateQRCode(invitation.qr_token) : null
      })));
      res.json({ status: 'success', data: enriched });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getMyInvitation(req, res) {
    try {
      const invitation = await InvitationModel.getForUserById(req.user.id, req.params.invitationId);
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      res.json({
        status: 'success',
        data: {
          ...invitation,
          qr_code: invitation.qr_token ? await QRCodeService.generateQRCode(invitation.qr_token) : null
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getMyEvents(req, res) {
    try {
      const events = await InvitationModel.getEventsForUser(req.user.id);
      res.json({
        status: 'success',
        data: {
          full_name: events[0]?.full_name || null,
          events
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getMyEventInvitation(req, res) {
    try {
      const invitation = await InvitationModel.getForUserByEvent(req.user.id, req.params.eventId);
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found for this event' });
      }

      res.json({
        status: 'success',
        data: {
          ...invitation,
          qr_code: invitation.qr_token ? await QRCodeService.generateQRCode(invitation.qr_token) : null
        }
      });
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
      const result = await SeatModel.ensureUnifiedAssignmentFlow(event_id);

      res.json({
        success: true,
        message: 'Unified assignment seating verified.',
        groups_count: result.groups,
        assignments_count: result.assignments,
        seats_created: result.seatsCreated
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
