import api from './api';

const reportService = {
  getWeeklyReport: (quarterId, weekNumber) =>
    api.get('/reports/weekly', { params: { quarter_id: quarterId, week_number: weekNumber } }),
  getClassQuarterlyReport: (classId) =>
    api.get(`/reports/class/${classId}/quarterly`),
  getChurchQuarterlyReport: (quarterId) =>
    api.get(`/reports/church/${quarterId}/quarterly`),
  getFinancialReport: (quarterId, classId) => {
    const params = {};
    if (quarterId) params.quarter_id = quarterId;
    if (classId) params.class_id = classId;
    return api.get('/reports/financial', { params });
  },
};

export default reportService;
