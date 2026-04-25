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
      
      // If we get data, return it
      if (response.data) {
        return response;
      }
      
      // Otherwise, try fetching all class data and filter
      const allDataResponse = await api.get(`/weekly-data/class/${classId}`);
      
      if (allDataResponse.data && Array.isArray(allDataResponse.data)) {
        const weekData = allDataResponse.data.find(d => d.week_number === parseInt(weekNumber));
        return { data: weekData || null };
      }
      
      return { data: null };
    } catch (error) {
      console.error('Error fetching week data:', error);
      
      // Fallback: try getting all class data
      try {
        const allDataResponse = await api.get(`/weekly-data/class/${classId}`);
        
        if (allDataResponse.data && Array.isArray(allDataResponse.data)) {
          const weekData = allDataResponse.data.find(d => d.week_number === parseInt(weekNumber));
          return { data: weekData || null };
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      return { data: null };
    }
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