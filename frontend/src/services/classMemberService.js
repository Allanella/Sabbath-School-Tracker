import api from './api';

const classMemberService = {
  getByClass: (classId) => api.get(`/classes/${classId}/members`),
  getAll: (classId) => {
    const params = classId ? { class_id: classId } : {};
    return api.get('/class-members', { params });
  },
  create: (memberData) => api.post('/class-members', memberData),
  update: (id, memberData) => api.put(`/class-members/${id}`, memberData),
  delete: (id) => api.delete(`/class-members/${id}`),
};

export default classMemberService;
