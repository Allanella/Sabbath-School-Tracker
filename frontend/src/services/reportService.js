import api from './api';

const reportService = {
  getWeeklyReport: async (quarterId, weekNumber) => {
    const response = await api.get('/reports/weekly', {
      params: { quarter_id: quarterId, week_number: weekNumber }
    });
    return response.data;
  },

  getClassQuarterlyReport: async (classId) => {
    const response = await api.get(`/reports/class/${classId}/quarterly`);
    return response.data;
  },

  getChurchQuarterlyReport: async (quarterId) => {
    const response = await api.get(`/reports/church/${quarterId}/quarterly`);
    return response.data;
  },

  getFinancialReport: async (quarterId, classId) => {
    const params = {};
    if (quarterId) params.quarter_id = quarterId;
    if (classId) params.class_id = classId;
    const response = await api.get('/reports/financial', { params });
    return response.data;
  }
};

export default reportService;
