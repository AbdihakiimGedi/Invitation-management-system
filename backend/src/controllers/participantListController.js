const ParticipantListService = require('../services/participantListService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const ParticipantListController = {
  async listEvents(req, res) {
    try {
      const events = await ParticipantListService.listEvents();
      return sendSuccess(res, events, 'Participant list events retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve events', 500);
    }
  },

  async getEventLists(req, res) {
    try {
      const data = await ParticipantListService.getEventParticipantLists(req.params.eventId, {
        search: req.query.search,
        gpaRange: req.query.gpaRange
      });
      return sendSuccess(res, data, 'Participant lists retrieved successfully');
    } catch (error) {
      const statusCode = error.message === 'Event not found' ? 404 : error.message === 'Invalid GPA filter' ? 400 : 500;
      return sendError(res, error.message || 'Failed to retrieve participant lists', statusCode);
    }
  },

  async getParticipantDetails(req, res) {
    try {
      const data = await ParticipantListService.getParticipantDetails(
        req.params.eventId,
        req.params.eventParticipantId
      );
      return sendSuccess(res, data, 'Participant details retrieved successfully');
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to retrieve participant details', statusCode);
    }
  }
};

module.exports = ParticipantListController;
