import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import offlineStorage from '../../utils/offlineStorage';
import weeklyDataService from '../../services/WeeklyDataService';

const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending data count
    checkPending();

    // Auto-sync when coming back online
    if (isOnline) {
      syncPendingData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  const checkPending = async () => {
    try {
      const count = await offlineStorage.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error checking pending data:', error);
    }
  };

  const syncPendingData = async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    setSyncStatus(null);

    try {
      const pending = await offlineStorage.getPendingData();
      
      if (pending.length === 0) {
        setPendingCount(0);
        setSyncing(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const item of pending) {
        try {
          await weeklyDataService.submit(item.data);
          await offlineStorage.markAsSynced(item.id);
          successCount++;
        } catch (error) {
          console.error('Sync failed for item:', item.id, error);
          failCount++;
        }
      }

      await offlineStorage.deleteSynced();
      await checkPending();

      if (failCount === 0) {
        setSyncStatus({ type: 'success', message: `✅ ${successCount} record(s) synced!` });
      } else {
        setSyncStatus({ type: 'warning', message: `⚠️ ${successCount} synced, ${failCount} failed` });
      }

      setTimeout(() => setSyncStatus(null), 5000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus({ type: 'error', message: '❌ Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  if (!isOnline && pendingCount === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-orange-100 border-2 border-orange-500 rounded-lg p-3 shadow-lg z-50 flex items-center space-x-2">
        <WifiOff className="h-5 w-5 text-orange-600" />
        <span className="text-sm font-medium text-orange-800">Offline Mode</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {syncStatus && (
          <div className={`mb-2 p-3 rounded-lg shadow-lg ${
            syncStatus.type === 'success' ? 'bg-green-100 border-2 border-green-500' :
            syncStatus.type === 'warning' ? 'bg-yellow-100 border-2 border-yellow-500' :
            'bg-red-100 border-2 border-red-500'
          }`}>
            <p className="text-sm font-medium">{syncStatus.message}</p>
          </div>
        )}

        <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {pendingCount} pending record(s)
                </p>
                {!isOnline && (
                  <p className="text-xs text-blue-700">Will sync when online</p>
                )}
              </div>
            </div>

            {isOnline && (
              <button
                onClick={syncPendingData}
                disabled={syncing}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center space-x-1 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineSync;