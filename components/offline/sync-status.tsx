'use client';

/**
 * Sync status display component
 * Shows detailed sync status and allows manual sync trigger
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SyncStatus {
  status: 'pending' | 'synced';
  totalOperations: number;
  syncedOperations: number;
  pendingOperations: number;
  unresolvedConflicts: number;
  lastSyncTime: string | null;
  pendingByEntity: Record<string, number>;
  conflicts: Array<{
    id: string;
    entity: string;
    entityId: string;
    strategy: string;
  }>;
}

export function SyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      // This would trigger a manual sync
      // For now, just refresh the status
      await fetchSyncStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Sync Status</CardTitle>
        <Badge variant={syncStatus.status === 'synced' ? 'default' : 'secondary'}>
          {syncStatus.status === 'synced' ? 'Synced' : 'Pending'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Total Operations</p>
            <p className="text-2xl font-bold">{syncStatus.totalOperations}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Pending</p>
            <p className="text-2xl font-bold">{syncStatus.pendingOperations}</p>
          </div>
        </div>

        {/* Conflicts */}
        {syncStatus.unresolvedConflicts > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm font-medium text-yellow-900">
              {syncStatus.unresolvedConflicts} unresolved {syncStatus.unresolvedConflicts === 1 ? 'conflict' : 'conflicts'}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Review and resolve conflicts to complete sync
            </p>
          </div>
        )}

        {/* Pending by entity */}
        {syncStatus.pendingOperations > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pending by Type</p>
            <div className="space-y-1">
              {Object.entries(syncStatus.pendingByEntity).map(([entity, count]) => (
                <div key={entity} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{entity}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last sync time */}
        {syncStatus.lastSyncTime && (
          <div>
            <p className="text-sm font-medium">Last Synced</p>
            <p className="text-sm text-muted-foreground">
              {new Date(syncStatus.lastSyncTime).toLocaleString()}
            </p>
          </div>
        )}

        {/* Manual sync button */}
        <Button 
          onClick={handleManualSync} 
          disabled={syncing || syncStatus.pendingOperations === 0}
          className="w-full"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </CardContent>
    </Card>
  );
}
