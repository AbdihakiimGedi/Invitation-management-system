import axios from 'axios';

const API_URL = 'https://kk0g84k04ow0cgs8owsckgwg.38.242.148.212.sslip.io/api/v1/invitations';

const invitationService = {
  getBatches: async (eventId) => {
    const response = await axios.get(`${API_URL}/batches/${eventId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  createBatch: async (eventId, batchName, totalCount, qtyPerPerson = 1) => {
    const response = await axios.post(`${API_URL}/batches`, {
      event_id: eventId,
      batch_name: batchName,
      total_count: totalCount,
      qty_per_person: qtyPerPerson
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  verifyInvitation: async (token) => {
    const response = await axios.post(`${API_URL}/verify`, { token });
    return response.data;
  }
};

export default invitationService;
