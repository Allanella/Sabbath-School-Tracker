import React from 'react';
import { usePWA } from '../hooks/usePWA';

const PWAInstallButton = () => {
  const { isInstallable, installPWA } = usePWA();

  const handleInstallClick = async () => {
    const installed = await installPWA();
    if (installed) {
      console.log('App installed successfully!');
    }
  };

  if (!isInstallable) {
    return null; // Don't show button if not installable
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-colors"
        title="Install Sabbath School Tracker app"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>Install App</span>
      </button>
    </div>
  );
};

export default PWAInstallButton;