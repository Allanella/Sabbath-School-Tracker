import api from './api';

const weeklyDataService = {
  submit: async (data) => {
    const response = await api.post('/weekly-data', data);
    return response.data;
  },

  getByClass: async (classId) => {
    const response = await api.get(`/weekly-data/class/${classId}`);
    return response.data;
  },

  getByWeek: async (classId, weekNumber) => {
    const response = await api.get(`/weekly-data/class/${classId}/week/${weekNumber}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/weekly-data/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/weekly-data/${id}`);
    return response.data;
  }
};

export default weeklyDataService;