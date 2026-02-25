import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show manual instructions if not installed
    if (iOS && !standalone) {
      setShowInstall(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual instructions for iOS or unsupported browsers
      if (isIOS) {
        alert('To install:\n1. Tap the Share button (⬆️)\n2. Tap "Add to Home Screen"');
      } else {
        alert('To install:\n1. Tap menu (⋮)\n2. Select "Add to Home screen" or "Install app"');
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or recently dismissed
  if (isStandalone) return null;
  
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-2xl border-2 border-indigo-500 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            {isIOS ? (
              <Smartphone className="h-6 w-6 text-white" />
            ) : (
              <Download className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Install App
          </h3>
          
          {isIOS ? (
            <p className="text-sm text-gray-600 mb-3">
              Tap <strong>Share (⬆️)</strong> then <strong>"Add to Home Screen"</strong>
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-3">
              Install for quick access and offline use!
            </p>
          )}

          <button
            onClick={handleInstallClick}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
          >
            {isIOS ? 'Show Instructions' : 'Install Now'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InstallPWA;