const EventService = require('../services/eventService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const EventController = {
  async list(req, res) {
    try {
      const events = await EventService.listEvents();
      return sendSuccess(res, events, 'Events retrieved successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  },

  async get(req, res) {
    try {
      const event = await EventService.getEvent(req.params.id);
      return sendSuccess(res, event, 'Event retrieved successfully');
    } catch (error) {
      const statusCode = error.message === 'Event not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  },

  async getParticipants(req, res) {
    try {
      const type = req.query.type || 'graduate';
      const status = req.query.status || 'eligible'; // Extract query
      const participants = await EventService.getEventParticipants(req.params.id, status, type);
      return sendSuccess(res, participants, `Event participants (${status}) retrieved successfully`);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  },

  async create(req, res) {
    try {
      const eventData = { ...req.body, created_by: req.user?.id };
      const newEvent = await EventService.createEvent(eventData);
      return sendSuccess(res, newEvent, 'Event created successfully', 201);
    } catch (error) {
      const statusCode = error.message.includes('required') ? 400 : 500;
      return sendError(res, error.message, statusCode);
    }
  },

  async update(req, res) {
    try {
      const updatedEvent = await EventService.updateEvent(req.params.id, req.body);
      return sendSuccess(res, updatedEvent, 'Event updated successfully');
    } catch (error) {
      const statusCode = error.message === 'Event not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  },

  async delete(req, res) {
    try {
      await EventService.removeEvent(req.params.id);
      return sendSuccess(res, null, 'Event deleted successfully');
    } catch (error) {
      const statusCode = error.message === 'Event not found' ? 404 : 500;
      return sendError(res, error.message, statusCode);
    }
  }
};

module.exports = EventController;
