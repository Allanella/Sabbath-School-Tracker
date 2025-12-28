import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import AdminDashboard from './components/Admin/Dashboard';
import UserManagement from './components/Admin/UserManagement';
import QuarterSetup from './components/Admin/QuarterSetup';
import ClassManagement from './components/Admin/ClassManagement';
import SecretaryDashboard from './components/Secretary/Dashboard';
import WeeklyDataEntry from './components/Secretary/WeeklyDataEntry';
import WeeklyReport from './components/Reports/WeeklyReport';
import QuarterlyReport from './components/Reports/QuarterlyReport';
import FinancialReport from './components/Reports/FinancialReport';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/quarters" element={<ProtectedRoute roles={['admin']}><QuarterSetup /></ProtectedRoute>} />
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
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;