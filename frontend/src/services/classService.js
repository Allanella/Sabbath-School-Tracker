import api from './api';

const classService = {
  getAll: async (quarterId) => {
    const params = quarterId ? { quarter_id: quarterId } : {};
    return await api.get('/classes', { params });
  },

  getByQuarter: async (quarterId) => {
    return await api.get(`/classes?quarter_id=${quarterId}`);
  },

  getById: async (id) => {
    return await api.get(`/classes/${id}`);
  },

  search: async (query) => {
    return await api.get(`/classes/search?query=${query}`);
  },

  getMyClasses: async () => {
    return await api.get('/classes/my-classes');
  },

  create: async (classData) => {
    return await api.post('/classes', classData);
  },

  update: async (id, classData) => {
    return await api.put(`/classes/${id}`, classData);
  },

  delete: async (id) => {
    return await api.delete(`/classes/${id}`);
  }
};

export default classService;