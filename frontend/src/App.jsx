import React, { useEffect } from 'react';
// CSS IMPORTS
import './App.css';
import './styles/index.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import Login from './components/Auth/Login.jsx';
import AdminDashboard from './components/Admin/Dashboard.jsx';
import UserManagement from './components/Admin/UserManagement.jsx';
import QuarterSetUp from './components/Admin/QuarterSetUp.jsx';
import ClassManagement from './components/Admin/ClassManagement.jsx';
import SecretaryDashboard from './components/Secretary/Dashboard.jsx';
import WeeklyDataEntry from './components/Secretary/WeeklyDataEntry.jsx';
import WeeklyReport from './components/Reports/WeeklyReport.jsx';
import QuarterlyReport from './components/Reports/QuarterlyReport.jsx';
import FinancialReport from './components/Reports/FinancialReport.jsx';
import Layout from './components/Layout/Layout.jsx';
import { useIsPWA } from './hooks/usePWA.js';

// COMPLETELY DISABLE SERVICE WORKERS - FIXED VERSION
const useDisableServiceWorkers = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('Disabling service workers...');
      
      // Method 1: Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(success => {
            console.log('ServiceWorker unregistered:', success);
          });
        });
      });

      // Method 2: Clear all caches
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
        console.log('All caches cleared');
      });

      // Method 3: Prevent future registrations
      const originalRegister = navigator.serviceWorker.register;
      navigator.serviceWorker.register = () => {
        console.log('Service worker registration blocked');
        return Promise.reject(new Error('Service workers disabled by app'));
      };

      // Force reload if we found any service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    }
  }, []);
};

// Remove CSS Debug to clean up screen
function AppContent() {
  const isPWA = useIsPWA();
  useDisableServiceWorkers();

  return (
    // ADDED explicit styles to ensure CSS works on Vercel
    <div 
      className={`min-h-screen bg-gray-50 ${isPWA ? 'pwa-mode' : ''}`}
      style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }} // Fallback styles
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/quarters" element={<ProtectedRoute roles={['admin']}><QuarterSetUp /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute roles={['admin']}><ClassManagement /></ProtectedRoute>} />

            {/* Secretary Routes */}
            <Route path="/secretary" element={<ProtectedRoute roles={['secretary']}><SecretaryDashboard /></ProtectedRoute>} />
            <Route path="/secretary/entry" element={<ProtectedRoute roles={['admin', 'secretary']}><WeeklyDataEntry /></ProtectedRoute>} />

            {/* Report Routes */}
            <Route path="/reports/weekly" element={<WeeklyReport />} />
            <Route path="/reports/quarterly" element={<QuarterlyReport />} />
            <Route path="/reports/financial" element={<FinancialReport />} />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

function App() {
  return (
    <React.Suspense fallback={
      // ADDED explicit fallback styles
      <div 
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
            style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '3rem', width: '3rem', borderBottom: '2px solid #2563eb', margin: '0 auto' }}
          ></div>
          <p 
            className="mt-4 text-gray-600"
            style={{ marginTop: '1rem', color: '#4b5563' }}
          >
            Loading Sabbath School Tracker...
          </p>
        </div>
      </div>
    }>
      <AppContent />
    </React.Suspense>
  );
}

export default App;