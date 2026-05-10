import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

const getError = (error) =>
  error.response?.data || { error: error.message || 'Request failed. Please try again.' };

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      throw getError(error);
    }
  }
};

export const eventModelService = {
  getAll: async () => {
    try {
      const response = await api.get('/events');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  create: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  update: async (id, eventData) => {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/events/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getParticipants: async (id, status = 'eligible', type = 'graduate') => {
    try {
      const response = await api.get(`/events/${id}/participants`, { params: { status, type } });
      return response.data.data;
    } catch (error) {
      throw getError(error);
    }
  },
  getAvailableTransferEvents: async (excludeId) => {
    try {
      const response = await api.get(`/people/transfer/available/${excludeId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const invitationService = {
  getManagementEvents: async () => {
    try {
      const response = await api.get('/invitations/management/events');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getSentParticipants: async (eventId) => {
    try {
      const response = await api.get(`/invitations/management/events/${eventId}/sent-participants`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  resendParticipantInvitation: async (eventId, eventParticipantId) => {
    try {
      const response = await api.post(`/invitations/management/events/${eventId}/participants/${eventParticipantId}/resend`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  createMoreInvitationRequest: async (requestData) => {
    try {
      const response = await api.post('/invitations/requests', requestData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getMoreInvitationRequests: async (eventId) => {
    try {
      const response = await api.get(`/invitations/management/events/${eventId}/requests`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getMoreInvitationRequestDetails: async (requestId) => {
    try {
      const response = await api.get(`/invitations/management/requests/${requestId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  approveMoreInvitationRequest: async (requestId) => {
    try {
      const response = await api.post(`/invitations/management/requests/${requestId}/approve`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getMyEvents: async () => {
    try {
      const response = await api.get('/invitations/my-events');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getMyEventInvitation: async (eventId) => {
    try {
      const response = await api.get(`/invitations/my-events/${eventId}/invitation`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getMyInvitations: async () => {
    try {
      const response = await api.get('/invitations/my-invitations');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getMyInvitation: async (invitationId) => {
    try {
      const response = await api.get(`/invitations/my-invitations/${invitationId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  generateBatch: async (eventId, batchName) => {
    try {
      const response = await api.post('/invitations/batch', { event_id: eventId, batch_name: batchName });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  assignBatchSeating: async (eventId) => {
    try {
      const response = await api.post('/invitations/seats', { event_id: eventId });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const attendanceService = {
  getEvents: async () => {
    try {
      const response = await api.get('/attendance/events');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  validateScan: async (eventId, qrToken) => {
    try {
      const response = await api.post('/attendance/scan/validate', {
        event_id: eventId,
        qr_token: qrToken
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  confirmAttendance: async (eventId, qrToken) => {
    try {
      const response = await api.post('/attendance/scan/confirm', {
        event_id: eventId,
        qr_token: qrToken
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getAttendanceList: async (eventId) => {
    try {
      const response = await api.get(`/attendance/events/${eventId}/list`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getDashboard: async (eventId) => {
    try {
      const response = await api.get(`/attendance/events/${eventId}/dashboard`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const dashboardService = {
  getOverview: async () => {
    try {
      const response = await api.get('/dashboard/overview');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const reportService = {
  getEvents: async () => {
    try {
      const response = await api.get('/reports/events');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getEventReport: async (eventId) => {
    try {
      const response = await api.get(`/reports/events/${eventId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const logService = {
  getLogs: async (filters = {}) => {
    try {
      const response = await api.get('/logs', { params: filters });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const userManagementService = {
  getRoles: async () => {
    try {
      const response = await api.get('/users/roles');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getUsers: async (filters = {}) => {
    try {
      const response = await api.get('/users', { params: filters });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  createUser: async (data) => {
    try {
      const response = await api.post('/users', data);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateUser: async (userId, data) => {
    try {
      const response = await api.patch(`/users/${userId}`, data);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  resetPassword: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/reset-password`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const peopleService = {
  getTypes: async () => {
    try {
      const response = await api.get('/people/types');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getLookupData: async (tableName, filters = {}) => {
    try {
      const response = await api.get(`/people/lookup/${tableName}`, { params: filters });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getDepartmentsByFaculty: async (facultyId) => {
    try {
      const response = await api.get(`/people/departments/by-faculty/${facultyId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getColumns: async (tableName) => {
    try {
      const response = await api.get(`/people/columns/${tableName}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getSchema: async (tableName) => {
    try {
      const response = await api.get(`/people/schema/${tableName}`);
      return response.data.data; // Returns array of { column, type, label, lookupTable?, ... }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  uploadPreview: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/people/upload-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  searchPreview: async (searchTerm, typeId) => {
    try {
      const response = await api.get(`/people/preview?search=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(typeId)}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  importPeople: async (importData) => {
    try {
      const response = await api.post('/people/import', importData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  manualRegister: async (registerData) => {
    try {
      const response = await api.post('/people/manual-register', registerData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  processParticipation: async (participationData) => {
    try {
      const response = await api.post('/people/process-participation', participationData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateParticipationStatus: async (updateData) => {
    try {
      const response = await api.patch('/people/participation', updateData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  transferParticipant: async (transferData) => {
    try {
      const response = await api.patch('/people/transfer', transferData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const participantListService = {
  getEvents: async () => {
    try {
      const response = await api.get('/participant-lists/events');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getEventLists: async (eventId, filters = {}) => {
    try {
      const response = await api.get(`/participant-lists/events/${eventId}`, { params: filters });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getParticipantDetails: async (eventId, eventParticipantId) => {
    try {
      const response = await api.get(`/participant-lists/events/${eventId}/participants/${eventParticipantId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const participantDirectoryService = {
  getEvents: async (typeSlug) => {
    try {
      const response = await api.get(`/participant-directories/types/${typeSlug}/events`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getParticipants: async (typeSlug, eventId, filters = {}) => {
    try {
      const response = await api.get(`/participant-directories/types/${typeSlug}/events/${eventId}/participants`, { params: filters });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getParticipantDetails: async (typeSlug, eventId, eventParticipantId) => {
    try {
      const response = await api.get(`/participant-directories/types/${typeSlug}/events/${eventId}/participants/${eventParticipantId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateParticipant: async (typeSlug, eventId, eventParticipantId, updates) => {
    try {
      const response = await api.patch(`/participant-directories/types/${typeSlug}/events/${eventId}/participants/${eventParticipantId}`, updates);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  generatePassword: async (typeSlug, eventId, eventParticipantId) => {
    try {
      const response = await api.post(`/participant-directories/types/${typeSlug}/events/${eventId}/participants/${eventParticipantId}/password`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getCredential: async (typeSlug, eventId, eventParticipantId) => {
    try {
      const response = await api.get(`/participant-directories/types/${typeSlug}/events/${eventId}/participants/${eventParticipantId}/credential`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default api;
