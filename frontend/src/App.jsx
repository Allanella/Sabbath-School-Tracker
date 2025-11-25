import React, { useEffect } from 'react';
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
import PWAInstallButton from './components/PWAInstallButton.jsx';

// Service Worker management to fix CSS caching issues
const useServiceWorkerCleanup = () => {
  useEffect(() => {
    const cleanupServiceWorkers = async () => {
      // Only run in production (Vercel) environment
      const isProduction = process.env.NODE_ENV === 'production' && 
                          !window.location.hostname.includes('localhost');
      
      if (isProduction && 'serviceWorker' in navigator) {
        try {
          // Unregister all service workers
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.unregister();
            console.log('Service Worker unregistered to fix CSS issues');
          }
          
          // Clear all caches
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('All caches cleared');
          
          // Force reload to apply fresh CSS (only if we found old SW)
          if (registrations.length > 0) {
            window.location.reload();
          }
        } catch (error) {
          console.log('Error during Service Worker cleanup:', error);
        }
      }
    };

    cleanupServiceWorkers();
  }, []);
};

function AppContent() {
  const isPWA = useIsPWA();
  
  // Apply Service Worker cleanup on every load to ensure fresh CSS
  useServiceWorkerCleanup();

  return (
    <div className={`min-h-screen bg-gray-50 ${isPWA ? 'pwa-mode' : ''}`}>
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

        {/* PWA Install Button */}
        <PWAInstallButton />
      </AuthProvider>
    </div>
  );
}

// Main App component with error boundary
function App() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Sabbath School Tracker...</p>
        </div>
      </div>
    }>
      <AppContent />
    </React.Suspense>
  );
}

export default App;