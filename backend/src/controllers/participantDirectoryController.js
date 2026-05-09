const ParticipantDirectoryService = require('../services/participantDirectoryService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const ActivityLogService = require('../services/activityLogService');

const ParticipantDirectoryController = {
  async listEvents(req, res) {
    try {
      const data = await ParticipantDirectoryService.listEvents(req.params.typeSlug);
      return sendSuccess(res, data, 'Participant directory events retrieved successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to retrieve events', statusCode);
    }
  },

  async listParticipants(req, res) {
    try {
      const data = await ParticipantDirectoryService.listParticipants(req.params.typeSlug, req.params.eventId, {
        search: req.query.search
      });
      return sendSuccess(res, data, 'Participants retrieved successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to retrieve participants', statusCode);
    }
  },

  async getParticipantDetails(req, res) {
    try {
      const data = await ParticipantDirectoryService.getParticipantDetails(
        req.params.typeSlug,
        req.params.eventId,
        req.params.eventParticipantId
      );
      return sendSuccess(res, data, 'Participant details retrieved successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to retrieve participant details', statusCode);
    }
  },

  async generatePassword(req, res) {
    try {
      const data = await ParticipantDirectoryService.generatePassword(
        req.params.typeSlug,
        req.params.eventId,
        req.params.eventParticipantId
      );
      await ActivityLogService.log({
        actorUserId: req.user.id,
        actionType: 'PARTICIPANT_PASSWORD_GENERATED',
        entityType: 'event_participants',
        entityId: req.params.eventParticipantId,
        description: `Password generated for participant ID: ${req.params.eventParticipantId}`
      });
      return sendSuccess(res, data, 'Participant password generated successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to generate password', statusCode);
    }
  },

  async getCredential(req, res) {
    try {
      const data = await ParticipantDirectoryService.getCredential(
        req.params.typeSlug,
        req.params.eventId,
        req.params.eventParticipantId
      );
      return sendSuccess(res, data, 'Participant credential retrieved successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') || error.message.includes('not been generated') ? 404 : 500;
      return sendError(res, error.message || 'Failed to retrieve credential', statusCode);
    }
  },

  async updateParticipant(req, res) {
    try {
      const data = await ParticipantDirectoryService.updateParticipant(
        req.params.typeSlug,
        req.params.eventId,
        req.params.eventParticipantId,
        req.body
      );
      await ActivityLogService.log({
        actorUserId: req.user.id,
        actionType: 'PARTICIPANT_UPDATED',
        entityType: 'event_participants',
        entityId: req.params.eventParticipantId,
        description: `Participant updated: ID ${req.params.eventParticipantId}`
      });
      return sendSuccess(res, data, 'Participant updated successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to update participant', statusCode);
    }
  }
};

module.exports = ParticipantDirectoryController;
