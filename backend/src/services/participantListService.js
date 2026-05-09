const EventModel = require('../models/eventModel');
const ParticipantListModel = require('../models/participantListModel');
const QRCodeService = require('./qrcodeService');

const ParticipantListService = {
  async listEvents() {
    return EventModel.getAll();
  },

  async getEventParticipantLists(eventId, filters = {}) {
    const event = await EventModel.getById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const groups = await ParticipantListModel.getEventParticipantGroups(eventId, filters);
    const tabs = [];

    for (const group of groups) {
      const participants = await ParticipantListModel.getParticipantsByType(eventId, group.type_id, filters);
      tabs.push({
        ...group,
        participants
      });
    }

    return {
      event,
      filters: {
        search: filters.search || '',
        gpaRange: filters.gpaRange || ''
      },
      gpaFilters: [
        { value: 'above_4', label: 'Above 4.0' },
        { value: 'gpa_3_5_4', label: '3.5 - 4.0' },
        { value: 'gpa_3_0_3_49', label: '3.0 - 3.49' },
        { value: 'below_3', label: 'Below 3.0' }
      ],
      tabs
    };
  },

  async getParticipantDetails(eventId, eventParticipantId) {
    const participant = await ParticipantListModel.getParticipantDetails(eventId, eventParticipantId);
    if (!participant) {
      throw new Error('Participant not found for this event');
    }

    const qr_code = participant.qr_token
      ? await QRCodeService.generateQRCode(participant.qr_token)
      : null;

    return {
      ...participant,
      qr_code
    };
  }
};

module.exports = ParticipantListService;
