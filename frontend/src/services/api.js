import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
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

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
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
      const response = await api.get(`/events/${id}/participants?status=${status}&type=${type}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
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
  getMyInvitations: async () => {
    try {
      const response = await api.get('/invitations/my-invitations');
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

export const peopleService = {
  getTypes: async () => {
    try {
      const response = await api.get('/people/types');
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
  searchPreview: async (searchTerm, typeName) => {
    try {
      const response = await api.get(`/people/preview?search=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(typeName)}`);
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

export default api;
