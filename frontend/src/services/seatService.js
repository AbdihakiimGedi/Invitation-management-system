import api from './api';

const seatService = {
  // Seat Groups
  async getGroups(eventId) {
    try {
      const response = await api.get(`/seats/seat-groups/${eventId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async createGroup(groupData) {
    try {
      const response = await api.post('/seats/seat-groups', groupData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async updateGroup(id, groupData) {
    try {
      const response = await api.put(`/seats/seat-groups/${id}`, groupData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async deleteGroup(id) {
    try {
      const response = await api.delete(`/seats/seat-groups/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Participant Groups
  async getStudentGroups(eventId) {
    try {
      const response = await api.get(`/seats/events/${eventId}/student-groups`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getGuests(eventId) {
    try {
      const response = await api.get(`/seats/events/${eventId}/guests`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Assignments
  async assignPeople(eventId, seatGroupId, options = {}) {
    try {
      const { participantIds, gpaGroups } = options;
      const response = await api.post('/seats/seat-assignments', {
        event_id: eventId,
        seat_group_id: seatGroupId,
        participant_ids: participantIds,
        gpa_groups: gpaGroups
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getAssignments(eventId) {
    try {
      const response = await api.get(`/seats/seat-assignments/${eventId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async removeAssignment(assignmentId) {
    try {
      const response = await api.delete(`/seats/seat-assignments/${assignmentId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async updateAssignment(assignmentId, seatGroupId) {
    try {
      const response = await api.put(`/seats/seat-assignments/${assignmentId}`, {
        seat_group_id: seatGroupId
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reporting & Monitoring
  async getGroupsWithAssignments(eventId) {
    try {
      const response = await api.get(`/seats/seat-groups/${eventId}/with-assignments`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getGroupParticipants(eventId, groupId) {
    try {
      const response = await api.get(`/seats/seat-groups/${eventId}/${groupId}/participants`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async initializeSeats(eventId, groups = []) {
    try {
      const response = await api.post('/seats/initialize', { 
        event_id: eventId,
        groups: groups 
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default seatService;
