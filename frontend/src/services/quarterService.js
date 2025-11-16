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

  create: async (quarterData) => {
    const response = await api.post('/quarters', quarterData);
    return response.data;
  },

  setActive: async (id) => {
    const response = await api.patch(`/quarters/${id}/set-active`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/quarters/${id}`);
    return response.data;
  }
};

export default quarterService;