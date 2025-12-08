'use client';

/**
 * Offline indicator component
 * Shows connection status and pending sync operations
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Fetch pending operations count when online
    if (isOnline) {
      fetchPendingCount();
    }
  }, [isOnline]);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/sync/status');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.pendingOperations || 0);
      }
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOnline ? (
        <Badge variant="destructive" className="px-4 py-2 text-sm">
          <span className="mr-2">●</span>
          Offline
        </Badge>
      ) : pendingCount > 0 ? (
        <Badge variant="secondary" className="px-4 py-2 text-sm">
          <span className="mr-2 animate-pulse">●</span>
          Syncing {pendingCount} {pendingCount === 1 ? 'item' : 'items'}...
        </Badge>
      ) : null}
    </div>
  );
}
