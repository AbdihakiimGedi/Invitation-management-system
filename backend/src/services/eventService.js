const EventModel = require('../models/eventModel');

const EventService = {
  async listEvents() {
    return await EventModel.getAll();
  },

  async getEvent(id) {
    const event = await EventModel.getById(id);
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  },

  async getEventParticipants(id, status, typeName = 'graduate') {
    if (!['eligible', 'rejected'].includes(status)) {
      throw new Error('Invalid status filter');
    }
    return await EventModel.getParticipants(id, status, typeName);
  },

  async createEvent(eventData) {
    // Primary Field Check (Ensuring alignment with frontend property names)
    if (!eventData.event_name || !eventData.event_date || !eventData.location) {
      throw new Error('Event Name, Date, and Location are required');
    }

    // STRICT DATE VALIDATION: event_date >= TODAY (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const eventDate = new Date(eventData.event_date).toISOString().split('T')[0];

    if (eventDate < today) {
      throw new Error('Invalid event date. Event date must be today or a future date.');
    }
    
    return await EventModel.create({
      ...eventData,
      status: eventData.status || 'active'
    });
  },

  async updateEvent(id, eventData) {
    const event = await EventModel.getById(id);
    if (!event) {
      throw new Error('Event not found');
    }
    
    // STRICT DATE VALIDATION: Check incoming update if date is changing
    if (eventData.event_date) {
      const today = new Date().toISOString().split('T')[0];
      const eventDate = new Date(eventData.event_date).toISOString().split('T')[0];

      if (eventDate < today) {
        throw new Error('Invalid event date. Event date must be today or a future date.');
      }
    }

    const updatedData = {
      event_name: eventData.event_name || event.event_name,
      description: eventData.description || event.description,
      event_date: eventData.event_date || event.event_date,
      location: eventData.location || event.location,
      status: eventData.status || event.status,
      max_capacity: eventData.max_capacity || event.max_capacity
    };

    return await EventModel.update(id, updatedData);
  },

  async removeEvent(id) {
    const event = await EventModel.getById(id);
    if (!event) {
      throw new Error('Event not found');
    }
    return await EventModel.delete(id);
  }
};

module.exports = EventService;
