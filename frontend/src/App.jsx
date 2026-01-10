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
import MemberSearch from './components/Reports/MemberSearch';
import ClassSearch from './components/Reports/ClassSearch';
import WeeklyReport from './components/Reports/WeeklyReport';
import QuarterlyReport from './components/Reports/QuarterlyReport';
import FinancialReport from './components/Reports/FinancialReport';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ========== TEST ROUTES - CHECK THESE FIRST ========== */}
          
          {/* Test 1: Basic Route - No Auth Required */}
          <Route path="/test-basic" element={
            <div style={{padding: '50px', background: '#e8f5e9', minHeight: '100vh'}}>
              <h1 style={{color: '#2e7d32', fontSize: '2em'}}>✅ TEST 1: BASIC ROUTE WORKS!</h1>
              <p style={{fontSize: '1.2em'}}>If you see this, React Router is working correctly.</p>
              <hr style={{margin: '20px 0'}} />
              <h3>User Data from localStorage:</h3>
              <pre style={{background: 'white', padding: '15px', borderRadius: '5px'}}>
                {JSON.stringify(JSON.parse(localStorage.getItem('user') || 'null'), null, 2)}
              </pre>
              <button 
                onClick={() => window.location.href = '/test-protected'}
                style={{padding: '10px 20px', fontSize: '1em', margin: '10px 5px', cursor: 'pointer'}}
              >
                Test Protected Route →
              </button>
              <button 
                onClick={() => window.location.href = '/admin'}
                style={{padding: '10px 20px', fontSize: '1em', margin: '10px 5px', cursor: 'pointer'}}
              >
                Go to Admin →
              </button>
            </div>
          } />

          {/* Test 2: Protected Route - Requires Auth */}
          <Route path="/test-protected" element={
            <ProtectedRoute>
              <div style={{padding: '50px', background: '#e3f2fd', minHeight: '100vh'}}>
                <h1 style={{color: '#1565c0', fontSize: '2em'}}>✅ TEST 2: PROTECTED ROUTE WORKS!</h1>
                <p style={{fontSize: '1.2em'}}>If you see this, ProtectedRoute is working correctly.</p>
                <hr style={{margin: '20px 0'}} />
                <h3>Authenticated User:</h3>
                <pre style={{background: 'white', padding: '15px', borderRadius: '5px'}}>
                  {JSON.stringify(JSON.parse(localStorage.getItem('user') || 'null'), null, 2)}
                </pre>
                <button 
                  onClick={() => window.location.href = '/test-dashboard'}
                  style={{padding: '10px 20px', fontSize: '1em', margin: '10px 5px', cursor: 'pointer'}}
                >
                  Test Dashboard →
                </button>
                <button 
                  onClick={() => window.location.href = '/admin'}
                  style={{padding: '10px 20px', fontSize: '1em', margin: '10px 5px', cursor: 'pointer'}}
                >
                  Go to Admin →
                </button>
              </div>
            </ProtectedRoute>
          } />

          {/* Test 3: Dashboard Without Layout */}
          <Route path="/test-dashboard" element={
            <ProtectedRoute>
              <div style={{padding: '50px', background: '#fff3e0', minHeight: '100vh'}}>
                <h1 style={{color: '#e65100', fontSize: '2em'}}>✅ TEST 3: DASHBOARD COMPONENT</h1>
                <p style={{fontSize: '1.2em'}}>Testing AdminDashboard component directly (no Layout)</p>
                <hr style={{margin: '20px 0'}} />
                <div style={{border: '2px solid #e65100', padding: '20px', borderRadius: '5px'}}>
                  <AdminDashboard />
                </div>
                <button 
                  onClick={() => window.location.href = '/test-layout'}
                  style={{padding: '10px 20px', fontSize: '1em', margin: '10px 5px', cursor: 'pointer'}}
                >
                  Test With Layout →
                </button>
              </div>
            </ProtectedRoute>
          } />

          {/* Test 4: With Layout */}
          <Route path="/test-layout" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={
              <div style={{padding: '20px'}}>
                <h1 style={{color: '#9c27b0'}}>✅ TEST 4: LAYOUT + OUTLET WORKS!</h1>
                <p>If you see the sidebar AND this message, Layout with Outlet is working.</p>
              </div>
            } />
          </Route>

          {/* ========== ACTUAL APP ROUTES ========== */}
          
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
            <Route path="reports/member-search" element={<MemberSearch />} />
            <Route path="reports/class-search" element={<ClassSearch />} />
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