const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const ParticipantDirectoryModel = require('../models/participantDirectoryModel');
const InvitationManagementService = require('./invitationManagementService');

const authRoleForType = (typeMeta) => {
  if (typeMeta.table_name === 'students') return 'Graduate';
  return typeMeta.type_name.toLowerCase().includes('vip') ? 'Special Guest' : 'Guest';
};

const ParticipantDirectoryService = {
  async getType(typeSlug) {
    const type = await ParticipantDirectoryModel.getTypeBySlug(typeSlug);
    if (!type) {
      throw new Error('Participant type not found');
    }
    return type;
  },

  async listEvents(typeSlug) {
    const type = await this.getType(typeSlug);
    const events = await ParticipantDirectoryModel.getEventsForType(type.id);
    return { type, events };
  },

  async listParticipants(typeSlug, eventId, filters = {}) {
    const type = await this.getType(typeSlug);
    const participants = await ParticipantDirectoryModel.getParticipants(eventId, type.id, filters);
    return { type, participants };
  },

  async getParticipantDetails(typeSlug, eventId, eventParticipantId) {
    const type = await this.getType(typeSlug);
    const participant = await ParticipantDirectoryModel.getParticipantDetails(
      eventId,
      type.id,
      eventParticipantId
    );

    if (!participant) {
      throw new Error('Participant not found for this event and type');
    }

    return { type, participant };
  },

  async generatePassword(typeSlug, eventId, eventParticipantId) {
    const { type, participant } = await this.getParticipantDetails(typeSlug, eventId, eventParticipantId);
    const password = String(crypto.randomInt(0, 10000)).padStart(4, '0');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await ParticipantDirectoryModel.upsertCredentialWithPassword({
      username: participant.username,
      passwordHash,
      generatedPassword: password,
      role: authRoleForType(type)
    });

    return {
      username: user.username,
      password,
      role: user.role,
      participant: {
        eventparticipant_id: participant.eventparticipant_id,
        full_name: participant.full_name,
        email: participant.email
      }
    };
  },

  async getCredential(typeSlug, eventId, eventParticipantId) {
    const { participant } = await this.getParticipantDetails(typeSlug, eventId, eventParticipantId);
    const credential = await ParticipantDirectoryModel.getCredential(participant.username);
    if (!credential || !credential.generated_password) {
      throw new Error('Password has not been generated for this participant');
    }

    return {
      username: credential.username,
      password: credential.generated_password,
      role: credential.role,
      participant: {
        eventparticipant_id: participant.eventparticipant_id,
        full_name: participant.full_name,
        email: participant.email
      }
    };
  },

  async updateParticipant(typeSlug, eventId, eventParticipantId, updates) {
    const type = await this.getType(typeSlug);
    const result = await ParticipantDirectoryModel.updateParticipantProfile(
      eventId,
      type.id,
      eventParticipantId,
      updates
    );

    if (!result) {
      throw new Error('Participant not found for this event and type');
    }

    let resend = null;
    if (result.emailChanged && result.after.email) {
      resend = await InvitationManagementService.resendParticipantInvitation(eventId, eventParticipantId);
    }

    return {
      type,
      participant: result.after,
      emailChanged: result.emailChanged,
      invitationResent: resend?.sent || 0
    };
  }
};

module.exports = ParticipantDirectoryService;
