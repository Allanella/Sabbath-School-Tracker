import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import AdminDashboard from './components/Admin/Dashboard';
import UserManagement from './components/Admin/UserManagement';
import QuarterSetup from './components/Admin/QuarterSetup';
import ClassManagement from './components/Admin/ClassManagement';
import SecretaryDashboard from './components/Secretary/SecretaryDashboard';
import WeeklyDataEntry from './components/Secretary/WeeklyDataEntry';
import PaymentManagement from './components/Secretary/PaymentManagement';
import MemberSearch from './components/Reports/MemberSearch';
import ClassSearch from './components/Reports/ClassSearch';
import PerformanceComparison from './components/Reports/PerformanceComparison';
import ClassRankings from './components/Reports/ClassRankings';
import OverallChampion from './components/Reports/OverallChampion';
import PaymentReport from './components/Reports/PaymentReport';
import PaymentHistory from './components/Reports/PaymentHistory';
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
            <Route path="secretary/payments" element={<PaymentManagement />} />
            
            {/* Report Routes */}
            <Route path="reports/member-search" element={<MemberSearch />} />
            <Route path="reports/class-search" element={<ClassSearch />} />
            <Route path="reports/performance" element={<PerformanceComparison />} />
            <Route path="reports/rankings" element={<ClassRankings />} />
            <Route path="reports/champion" element={<OverallChampion />} />
            <Route path="reports/payments" element={<PaymentReport />} />
            <Route path="reports/payment-history" element={<PaymentHistory />} />
            <Route path="reports/weekly" element={<WeeklyReport />} />
            <Route path="reports/quarterly" element={<QuarterlyReport />} />
            <Route path="reports/financial" element={<FinancialReport />} />
            
            {/* Root Redirect */}
            <Route index element={<Navigate to="admin" replace />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;