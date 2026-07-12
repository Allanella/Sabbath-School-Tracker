import api from './api';

const weeklyDataService = {
  submit: async (data) => {
    const response = await api.post('/weekly-data', data);
    return response;
  },

  getByClass: async (classId) => {
    const response = await api.get(`/weekly-data/class/${classId}`);
    return response;
  },

  getByWeek: async (classId, weekNumber) => {
    try {
      // api interceptor already returns response.data
      // so response here is { success, data: {...} } or { success, data: null }
      const response = await api.get(`/weekly-data/class/${classId}/week/${weekNumber}`);

      // response is already unwrapped by interceptor
      // backend returns { success: true, data: {...} }
      if (response && response.data) {
        return { data: response.data }; // wrap back so checkExistingData can do response.data
      }

      // Fallback: fetch all class data and filter
      const allData = await api.get(`/weekly-data/class/${classId}`);
      const weeks = Array.isArray(allData) ? allData : (allData?.data || []);
      const found = weeks.find(d => d.week_number === parseInt(weekNumber));
      return found ? { data: found } : { data: null };

    } catch (error) {
      console.error('Error fetching week data:', error);

      // Fallback on error
      try {
        const allData = await api.get(`/weekly-data/class/${classId}`);
        const weeks = Array.isArray(allData) ? allData : (allData?.data || []);
        const found = weeks.find(d => d.week_number === parseInt(weekNumber));
        return found ? { data: found } : { data: null };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      return { data: null };
    }
  },

  update: async (id, data) => {
    const response = await api.put(`/weekly-data/${id}`, data);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/weekly-data/${id}`);
    return response;
  }
};

export default weeklyDataService;