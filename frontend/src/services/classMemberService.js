import api from './api';

const classMemberService = {
  // Get all members for a class
  getByClass: (classId) => {
    return api.get(`/classes/${classId}/members`);
  },

  // Get all class members (with optional class filter)
  getAll: (classId) => {
    const params = classId ? { class_id: classId } : {};
    return api.get('/class-members', { params });
  },

  // Create new member
  create: (memberData) => {
    return api.post('/class-members', memberData);
  },

  // Update member
  update: (id, memberData) => {
    return api.put(`/class-members/${id}`, memberData);
  },

  // Delete member (soft delete)
  delete: (id) => {
    return api.delete(`/class-members/${id}`);
  },
};

export default classMemberService;