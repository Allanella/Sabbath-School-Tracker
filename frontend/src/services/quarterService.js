import api from './api';

const quarterService = {
  getAll: async () => {
    const response = await api.get('/quarters');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/quarters/${id}`);
    return response.data;
  },

  create: async (quarterData) => {
    const response = await api.post('/quarters', quarterData);
    return response.data;
  },

  update: async (id, quarterData) => {
    const response = await api.put(`/quarters/${id}`, quarterData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/quarters/${id}`);
    return response.data;
  },

  setActive: async (id) => {
    const response = await api.post(`/quarters/${id}/set-active`);
    return response.data;
  },

  copyFromPreviousQuarter: async (sourceQuarterId, targetQuarterId) => {
    const response = await api.post('/quarters/copy', {
      source_quarter_id: sourceQuarterId,
      target_quarter_id: targetQuarterId
    });
    return response.data;
  }
};

export default quarterService;