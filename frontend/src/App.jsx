import React, { useEffect } from 'react';
// TEMPORARILY COMMENT OUT CUSTOM CSS - TESTING ONLY
// import './App.css';
// import './styles/index.css';
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

// CSS DEBUG COMPONENT
const CSSDebugger = () => {
  const [cssStatus, setCssStatus] = React.useState('checking...');

  useEffect(() => {
    // Check if Tailwind CSS is loaded
    const checkTailwind = () => {
      const testElement = document.createElement('div');
      testElement.className = 'bg-red-500 hidden';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const bgColor = computedStyle.backgroundColor;
      
      document.body.removeChild(testElement);
      
      if (bgColor === 'rgb(239, 68, 68)') { // Tailwind red-500
        setCssStatus('✅ Tailwind CSS LOADED');
      } else {
        setCssStatus('❌ Tailwind CSS NOT LOADED');
      }
    };

    setTimeout(checkTailwind, 1000);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'blue',
      color: 'white',
      padding: '10px',
      zIndex: 9999,
      fontSize: '14px',
      borderRadius: '5px',
      border: '2px solid white'
    }}>
      <div>CSS Status: {cssStatus}</div>
      <div>Page: {window.location.pathname}</div>
    </div>
  );
};

// TEST COMPONENT - Simple styling check
const StyleTest = () => (
  <div className="p-4 m-4 border-4 border-green-500 bg-yellow-100">
    <h1 className="text-2xl font-bold text-blue-600">🎯 STYLE TEST</h1>
    <p className="text-red-500 font-semibold">If you see colors, CSS is working!</p>
    <div className="flex gap-2 mt-2">
      <button className="px-4 py-2 bg-blue-500 text-white rounded">Blue Button</button>
      <button className="px-4 py-2 bg-red-500 text-white rounded">Red Button</button>
      <button className="px-4 py-2 bg-green-500 text-white rounded">Green Button</button>
    </div>
  </div>
);

function AppContent() {
  const isPWA = useIsPWA();
  useDisableServiceWorkers();

  return (
    <div className={`min-h-screen bg-gray-50 ${isPWA ? 'pwa-mode' : ''}`}>
      {/* DEBUG COMPONENTS */}
      <CSSDebugger />
      <StyleTest />
      
      {/* ORIGINAL APP CONTENT */}
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