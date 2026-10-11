import api from './api';

const weeklyDataService = {
  // Get all weekly data for a class in a quarter
  getAll: async (classId, quarterId) => {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (quarterId) params.append('quarter_id', quarterId);
    const response = await api.get(`/weekly-data?${params.toString()}`);
    return response;
  },

  // Get weekly data for a specific week
  getByWeek: async (classId, weekNumber, quarterId) => {
    const params = new URLSearchParams();
    if (quarterId) params.append('quarter_id', quarterId);
    const response = await api.get(
      `/weekly-data/class/${classId}/week/${weekNumber}?${params.toString()}`
    );
    return response;
  },

  // Submit new weekly data
  submit: async (data) => {
    const response = await api.post('/weekly-data', data);
    return response;
  },

  // Update existing weekly data
  update: async (id, data) => {
    const response = await api.put(`/weekly-data/${id}`, data);
    return response;
  },

  // Delete weekly data
  delete: async (id) => {
    const response = await api.delete(`/weekly-data/${id}`);
    return response;
  },

  // Get summary/report for a quarter
  getSummary: async (quarterId, classId) => {
    const params = new URLSearchParams();
    if (quarterId) params.append('quarter_id', quarterId);
    if (classId) params.append('class_id', classId);
    const response = await api.get(`/weekly-data/summary?${params.toString()}`);
    return response;
  },
};

export default weeklyDataService;