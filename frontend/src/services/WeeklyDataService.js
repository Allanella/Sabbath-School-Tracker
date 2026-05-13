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
    try {
      // Try the direct endpoint first
      const response = await api.get(`/weekly-data/class/${classId}/week/${weekNumber}`);

      if (response.data) {
        return response.data;
      }

      // Fallback: fetch all class data and filter
      const allDataResponse = await api.get(`/weekly-data/class/${classId}`);
      const allData = allDataResponse.data;

      if (allData && Array.isArray(allData)) {
        return allData.find(d => d.week_number === parseInt(weekNumber)) || null;
      }

      return null;
    } catch (error) {
      console.error('Error fetching week data:', error);

      // Fallback: try getting all class data
      try {
        const allDataResponse = await api.get(`/weekly-data/class/${classId}`);
        const allData = allDataResponse.data;

        if (allData && Array.isArray(allData)) {
          return allData.find(d => d.week_number === parseInt(weekNumber)) || null;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      return null;
    }
  },

  update: async (id, data) => {
    const response = await api.put(`/weekly-data/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/weekly-data/${id}`);
    return response.data;
  },
};

export default weeklyDataService;