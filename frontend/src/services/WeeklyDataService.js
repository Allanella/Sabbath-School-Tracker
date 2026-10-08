import api from './api';

const weeklyDataService = {
  submit: async (data) => {
    const response = await api.post('/weekly-data', data);
    return response?.data ?? response;
  },

  getByClass: async (classId) => {
    const response = await api.get(`/weekly-data/class/\${classId}`);
    return response?.data ?? response;
  },

  getByWeek: async (classId, weekNumber, quarterId = '') => {
    try {
      // Fixed string interpolation template literal syntax
      const url = `/weekly-data/class/\${classId}/week/${weekNumber}${
        quarterId ? `?quarter_id=${quarterId}` : ''
      }`;
      const response = await api.get(url);

      const record = response?.data !== undefined ? response.data : response;
      if (record && typeof record === 'object' && Object.keys(record).length > 0) {
        return { data: record };
      }

      // Fallback manual lookup
      const allDataResponse = await api.get(`/weekly-data/class/\${classId}`);
      const rawData = allDataResponse?.data ?? allDataResponse;
      const weeks = Array.isArray(rawData) ? rawData : rawData?.data || [];
      const found = weeks.find((d) => Number(d.week_number) === Number(weekNumber));

      return { data: found || null };
    } catch (error) {
      console.error('Error fetching week data:', error);
      try {
        const allDataResponse = await api.get(`/weekly-data/class/\${classId}`);
        const rawData = allDataResponse?.data ?? allDataResponse;
        const weeks = Array.isArray(rawData) ? rawData : rawData?.data || [];
        const found = weeks.find((d) => Number(d.week_number) === Number(weekNumber));
        return { data: found || null };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      return { data: null };
    }
  },

  update: async (id, data) => {
    const response = await api.put(`/weekly-data/\${id}`, data);
    return response?.data ?? response;
  },

  delete: async (id) => {
    const response = await api.delete(`/weekly-data/\${id}`);
    return response?.data ?? response;
  },
};

export default weeklyDataService;