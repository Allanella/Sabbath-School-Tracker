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
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes with Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Admin Routes */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/quarters" element={<QuarterSetup />} />
            <Route path="admin/classes" element={<ClassManagement />} />
            
            {/* Secretary Routes */}
            <Route path="secretary" element={<SecretaryDashboard />} />
            <Route path="secretary/entry" element={<WeeklyDataEntry />} />
            
            {/* Report Routes */}
            <Route path="reports/weekly" element={<WeeklyReport />} />
            <Route path="reports/quarterly" element={<QuarterlyReport />} />
            <Route path="reports/financial" element={<FinancialReport />} />
            
            {/* Root Redirect */}
            <Route index element={<Navigate to="admin" replace />} />
          </Route>
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;