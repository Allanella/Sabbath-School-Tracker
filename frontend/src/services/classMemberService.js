import api from './api';

const classMemberService = {
  // Get all members for a class
  getByClass: async (classId) => {
    const response = await api.get(`/classes/${classId}/members`);
    return response.data;
  },

  // Get all class members (with optional class filter)
  getAll: async (classId) => {
    const params = classId ? { class_id: classId } : {};
    const response = await api.get('/class-members', { params });
    return response.data;
  },

  // Create new member
  create: async (memberData) => {
    const response = await api.post('/class-members', memberData);
    return response.data;
  },

  // Update member
  update: async (id, memberData) => {
    const response = await api.put(`/class-members/${id}`, memberData);
    return response.data;
  },

  // Delete member (soft delete)
  delete: async (id) => {
    const response = await api.delete(`/class-members/${id}`);
    return response.data;
  },
};

export default classMemberService;