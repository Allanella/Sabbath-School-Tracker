import api from './api';

const reportService = {
  getWeeklyReport: async (quarterId, weekNumber) => {
    return await api.get('/reports/weekly', {
      params: { quarter_id: quarterId, week_number: weekNumber }
    });
  },

  getClassQuarterlyReport: async (classId) => {
    return await api.get(`/reports/class/${classId}/quarterly`);
  },

  getChurchQuarterlyReport: async (quarterId) => {
    return await api.get(`/reports/church/${quarterId}/quarterly`);
  },

  getFinancialReport: async (quarterId, classId) => {
    const params = {};
    if (quarterId) params.quarter_id = quarterId;
    if (classId) params.class_id = classId;
    return await api.get('/reports/financial', { params });
  }
};

export default reportService;