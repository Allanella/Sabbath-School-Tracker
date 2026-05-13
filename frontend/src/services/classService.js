import api from './api';

const classService = {
  getAll: (quarterId) => {
    const params = quarterId ? { quarter_id: quarterId } : {};
    return api.get('/classes', { params });
  },
  getByQuarter: (quarterId) => api.get(`/classes?quarter_id=${quarterId}`),
  getById: (id) => api.get(`/classes/${id}`),
  search: (query) => api.get(`/classes/search?query=${query}`),
  getMyClasses: () => api.get('/classes/my-classes'),
  create: (classData) => api.post('/classes', classData),
  update: (id, classData) => api.put(`/classes/${id}`, classData),
  delete: (id) => api.delete(`/classes/${id}`),
};

export default classService;
