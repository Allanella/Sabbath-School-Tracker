import React, { useEffect } from 'react';
// TEMPORARY CSS IMPORT TO VERIFY
import './App.css';
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

// COMPLETELY DISABLE SERVICE WORKERS
const useDisableServiceWorkers = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister ALL service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('Service Worker unregistered:', registration);
        });
        
        // If we found any service workers, force clear caches and reload
        if (registrations.length > 0) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              caches.delete(cacheName);
            });
            console.log('All caches cleared');
            // Force reload to apply changes
            window.location.reload();
          });
        }
      });
    }
  }, []);
};

// Enhanced CSS Debug Hook
const useCSSDebug = () => {
  const [cssInfo, setCssInfo] = React.useState({ count: 0, files: [] });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const updateCSSInfo = () => {
        const stylesheets = document.querySelectorAll('style, link[rel="stylesheet"]');
        const files = Array.from(stylesheets).map(sheet => {
          if (sheet.href) {
            return sheet.href.split('/').pop() || sheet.href;
          }
          return 'inline-style';
        });
        
        setCssInfo({
          count: stylesheets.length,
          files: files
        });
      };

      // Check immediately
      updateCSSInfo();
      
      // Check again after a delay to catch dynamically loaded CSS
      const timer = setTimeout(updateCSSInfo, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return cssInfo;
};

function AppContent() {
  const isPWA = useIsPWA();
  useDisableServiceWorkers(); // This will disable ALL service workers
  const { count, files } = useCSSDebug(); // Enhanced CSS debug info

  return (
    <div className={`min-h-screen bg-gray-50 ${isPWA ? 'pwa-mode' : ''}`}>
      {/* ENHANCED DEBUG DIV - Shows detailed CSS information */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        background: 'red', 
        color: 'white', 
        padding: '10px', 
        zIndex: 9999,
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '300px',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
        <div><strong>CSS Debug Info:</strong></div>
        <div>Total Stylesheets: {count}</div>
        {files.length > 0 && (
          <div>
            Files: 
            <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
              {files.map((file, index) => (
                <li key={index} style={{ fontSize: '10px', wordBreak: 'break-all' }}>
                  {file}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>Tailwind Check: {
          typeof document !== 'undefined' && document.documentElement.classList.contains('bg-gray-50') 
            ? '✅ Loaded' 
            : '❌ Missing'
        }</div>
      </div>

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