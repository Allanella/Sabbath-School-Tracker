import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import Layout from './components/Layout/Layout.jsx';

// DEBUG COMPONENT
const CSSDebugger = () => {
  const [status, setStatus] = React.useState('Checking...');

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'bg-red-500 hidden';
    document.body.appendChild(el);

    const color = getComputedStyle(el).backgroundColor;
    document.body.removeChild(el);

    setStatus(color === 'rgb(239, 68, 68)' ? '✅ Tailwind Loaded' : '❌ Tailwind NOT Loaded');
  }, []);

  return <div className="fixed top-2 right-2 bg-black text-white p-3 z-50 rounded">{status}</div>;
};

// TEST COMPONENT
const StyleTest = () => (
  <div className="p-6 m-6 bg-yellow-100 border-4 border-green-500">
    <h1 className="text-2xl font-bold text-blue-600">TAILWIND TEST</h1>
    <p className="text-red-500">If this is colored, Tailwind works.</p>
    <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded">Button</button>
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CSSDebugger />
      <StyleTest />

      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
