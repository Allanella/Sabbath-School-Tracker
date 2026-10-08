import api from './api';

const classMemberService = {
  getByClass: async (classId, quarterId = '') => {
    const response = await api.get(`/class-members/class/${classId}`);
    return response?.data ?? response;
  },

  getAll: async (classId = '', quarterId = '') => {
    const params = {};
    if (classId) params.class_id = classId;
    if (quarterId) params.quarter_id = quarterId;

    const response = await api.get('/class-members', { params });
    return response?.data ?? response;
  },

  create: async (memberData) => {
    const response = await api.post('/class-members', memberData);
    return response?.data ?? response;
  },

  update: async (id, memberData) => {
    const response = await api.put(`/class-members/${id}`, memberData);
    return response?.data ?? response;
  },

  delete: async (id) => {
    const response = await api.delete(`/class-members/${id}`);
    return response?.data ?? response;
  },
};

export default classMemberService;