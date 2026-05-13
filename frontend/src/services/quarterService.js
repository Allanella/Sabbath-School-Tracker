import api from './api';

const quarterService = {
  getAll: async () => {
    const response = await api.get('/quarters');
    return response.data;
  },

  getActive: async () => {
    const response = await api.get('/quarters/active');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/quarters/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/quarters', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/quarters/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/quarters/${id}`);
    return response.data;
  },

  setActive: async (id) => {
    const response = await api.post('/quarters/set-active', { quarter_id: id });
    return response.data;
  },

  copyFromPreviousQuarter: async (sourceQuarterId, targetQuarterId) => {
    const response = await api.post('/quarters/copy', {
      source_quarter_id: sourceQuarterId,
      target_quarter_id: targetQuarterId,
    });
    return response.data;
  },
};

export default quarterService;