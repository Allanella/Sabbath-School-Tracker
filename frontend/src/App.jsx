import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Layout from './components/Layout/Layout';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy loaded components
const Login = lazy(() => import('./components/Auth/Login'));
const AdminDashboard = lazy(() => import('./components/Admin/Dashboard'));
const UserManagement = lazy(() => import('./components/Admin/UserManagement'));
const QuarterSetup = lazy(() => import('./components/Admin/QuarterSetup'));
const ClassManagement = lazy(() => import('./components/Admin/ClassManagement'));
const ClassSetup = lazy(() => import('./components/Admin/ClassSetup'));
const SecretaryDashboard = lazy(() => import('./components/Secretary/SecretaryDashboard'));
const WeeklyDataEntry = lazy(() => import('./components/Secretary/WeeklyDataEntry'));
const PaymentManagement = lazy(() => import('./components/Secretary/PaymentManagement'));
const MemberSearch = lazy(() => import('./components/Reports/MemberSearch'));
const ClassSearch = lazy(() => import('./components/Reports/ClassSearch'));
const PerformanceComparison = lazy(() => import('./components/Reports/PerformanceComparison'));
const ClassRankings = lazy(() => import('./components/Reports/ClassRankings'));
const OverallChampion = lazy(() => import('./components/Reports/OverallChampion'));
const PaymentReport = lazy(() => import('./components/Reports/PaymentReport'));
const PaymentHistory = lazy(() => import('./components/Reports/PaymentHistory'));
const WeeklyReport = lazy(() => import('./components/Reports/WeeklyReport'));
const QuarterlyReport = lazy(() => import('./components/Reports/QuarterlyReport'));
const FinancialReport = lazy(() => import('./components/Reports/FinancialReport'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes with Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Admin Routes */}
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="admin/quarters" element={<QuarterSetup />} />
                <Route path="admin/classes" element={<ClassManagement />} />
                <Route path="admin/classes/setup" element={<ClassSetup />} />

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
          </Suspense>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
