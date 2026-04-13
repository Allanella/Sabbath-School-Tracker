import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    // api.js interceptor already extracts .data, so response is already the data object
    if (response.success) {
      // Store user info
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Store token if it exists in response
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
    }
    return response;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Store token if it exists in response
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
    }
    return response;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response;
  }
};

export default authService;