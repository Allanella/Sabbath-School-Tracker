import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/index.css'; // ← ADD THIS LINE!

// CSS LOADING TEST - Add a test to verify CSS is loaded        
const testCSSLoading = () => {
  console.log('🎯 CSS Loading Test Started...');

  // Test if Tailwind CSS is loaded
  const testElement = document.createElement('div');
  testElement.className = 'bg-red-500 p-4 text-white absolute top-0 left-0 opacity-0';
  testElement.textContent = 'CSS Test Element';
  document.body.appendChild(testElement);

  setTimeout(() => {
    const computedStyle = window.getComputedStyle(testElement); 
    const bgColor = computedStyle.backgroundColor;

    if (bgColor === 'rgb(239, 68, 68)') {
      console.log('✅ SUCCESS: Tailwind CSS is properly loaded!');
    } else {
      console.log('❌ FAILED: Tailwind CSS not loaded. Background color:', bgColor);
    }

    document.body.removeChild(testElement);
  }, 100);
};

// Execute test when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testCSSLoading);
} else {
  testCSSLoading();
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);