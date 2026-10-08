import api from './api';

const weeklyDataService = {
  submit: async (data) => {
    return await api.post('/weekly-data', data);
  },

  getByClass: async (classId) => {
    return await api.get(`/weekly-data/class/${classId}`);
  },

  getByWeek: async (classId, weekNumber, quarterId = '') => {
    try {
      const url = `/weekly-data/class/${classId}/week/${weekNumber}${
        quarterId ? `?quarter_id=\${quarterId}` : ''
      }`;
      const response = await api.get(url);

      // Handle un-wrapped API responses cleanly
      const record = response?.data !== undefined ? response.data : response;
      if (record && Object.keys(record).length > 0) {
        return { data: record };
      }

      // Fallback manual lookup
      const allData = await api.get(`/weekly-data/class/${classId}`);
      const weeks = Array.isArray(allData) ? allData : allData?.data || [];
      const found = weeks.find((d) => Number(d.week_number) === Number(weekNumber));

      return { data: found || null };
    } catch (error) {
      console.error('Error fetching week data:', error);
      try {
        const allData = await api.get(`/weekly-data/class/${classId}`);
        const weeks = Array.isArray(allData) ? allData : allData?.data || [];
        const found = weeks.find((d) => Number(d.week_number) === Number(weekNumber));
        return { data: found || null };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      return { data: null };
    }
  },

  update: async (id, data) => {
    return await api.put(`/weekly-data/${id}`, data);
  },

  delete: async (id) => {
    return await api.delete(`/weekly-data/${id}`);
  },
};

export default weeklyDataService;