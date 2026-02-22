import api from './api';

const classMemberService = {
  // Get all members for a class
  getByClass: (classId) => {
    return api.get(`/class-members/class/${classId}`);
  },

  // Create new member
  create: (memberData) => {
    return api.post('/class-members', memberData);
  },

  // Update member
  update: (id, memberData) => {
    return api.put(`/class-members/${id}`, memberData);
  },

  // Delete member
  delete: (id) => {
    return api.delete(`/class-members/${id}`);
  },
};

export default classMemberService;