import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in localStorage
    const currentUser = authService.getCurrentUser();
    
    if (currentUser) {
      // User exists in localStorage, set it immediately
      setUser(currentUser);
      setLoading(false);
      
      // Optional: Verify session with backend in background
      authService.getProfile()
        .then((response) => {
          if (response.success) {
            setUser(response.data);
          }
        })
        .catch((error) => {
          // If session is invalid, clear localStorage
          console.error('Session verification failed:', error);
          authService.logout();
          setUser(null);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response.data.user);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSecretary: user?.role === 'secretary',
    isViewer: user?.role === 'viewer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;