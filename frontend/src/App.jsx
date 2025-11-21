import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import AdminDashboard from './components/Admin/Dashboard';
import UserManagement from './components/Admin/UserManagement';
import QuarterSetUp from './components/Admin/QuarterSetUp.jsx';
import ClassManagement from './components/Admin/ClassManagement';
import SecretaryDashboard from './components/Secretary/Dashboard';
import WeeklyDataEntry from './components/Secretary/WeeklyDataEntry';
import WeeklyReport from './components/Reports/WeeklyReport';
import QuarterlyReport from './components/Reports/QuarterlyReport';
import FinancialReport from './components/Reports/FinancialReport';
import Layout from './components/Layout/Layout';
import { useIsPWA } from './hooks/usePWA';
import PWAInstallButton from './components/PWAInstallButton';

function AppContent() {
  const isPWA = useIsPWA();

  return (
    <div className={`min-h-screen bg-gray-50 ${isPWA ? 'pwa-mode' : ''}`}>
      <Router>
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
          
          {/* PWA Install Button - shows when installable */}
          <PWAInstallButton />
        </AuthProvider>
      </Router>
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