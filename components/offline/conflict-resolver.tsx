'use client';

/**
 * Conflict resolver modal component
 * Allows users to manually resolve sync conflicts
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Conflict {
  id: string;
  entity: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  strategy?: string;
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, strategy: string, resolvedData?: any) => Promise<void>;
  onClose: () => void;
}

export function ConflictResolver({ conflicts, onResolve, onClose }: ConflictResolverProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('MERGE');

  if (conflicts.length === 0) {
    return null;
  }

  const currentConflict = conflicts[currentIndex];

  const handleResolve = async (strategy: string) => {
    setResolving(true);
    try {
      await onResolve(currentConflict.id, strategy);
      
      // Move to next conflict or close
      if (currentIndex < conflicts.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setResolving(false);
    }
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getConflictingFields = (): string[] => {
    const fields = new Set<string>();
    
    if (currentConflict.localVersion && currentConflict.serverVersion) {
      Object.keys(currentConflict.localVersion).forEach(key => fields.add(key));
      Object.keys(currentConflict.serverVersion).forEach(key => fields.add(key));
    }
    
    return Array.from(fields).filter(field => {
      const localVal = currentConflict.localVersion?.[field];
      const serverVal = currentConflict.serverVersion?.[field];
      return JSON.stringify(localVal) !== JSON.stringify(serverVal);
    });
  };

  const conflictingFields = getConflictingFields();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resolve Sync Conflict</CardTitle>
            <Badge variant="outline">
              {currentIndex + 1} of {conflicts.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Entity: <span className="font-medium capitalize">{currentConflict.entity}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conflict info */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-medium text-yellow-900">
              {conflictingFields.length} {conflictingFields.length === 1 ? 'field' : 'fields'} in conflict
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {conflictingFields.join(', ')}
            </p>
          </div>

          {/* Version comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Local version */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Your Changes (Local)</h3>
              <div className="rounded-lg border bg-muted p-3 space-y-2 max-h-64 overflow-auto">
                {conflictingFields.map(field => (
                  <div key={field} className="text-sm">
                    <span className="font-medium">{field}:</span>
                    <pre className="mt-1 text-xs whitespace-pre-wrap">
                      {renderValue(currentConflict.localVersion?.[field])}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Server version */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Server Version</h3>
              <div className="rounded-lg border bg-muted p-3 space-y-2 max-h-64 overflow-auto">
                {conflictingFields.map(field => (
                  <div key={field} className="text-sm">
                    <span className="font-medium">{field}:</span>
                    <pre className="mt-1 text-xs whitespace-pre-wrap">
                      {renderValue(currentConflict.serverVersion?.[field])}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution strategies */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Choose Resolution Strategy</h3>
            
            <div className="space-y-2">
              <Button
                variant={selectedStrategy === 'LOCAL_WINS' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedStrategy('LOCAL_WINS')}
              >
                <div className="text-left">
                  <div className="font-medium">Keep My Changes</div>
                  <div className="text-xs opacity-80">Use your local version</div>
                </div>
              </Button>

              <Button
                variant={selectedStrategy === 'SERVER_WINS' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedStrategy('SERVER_WINS')}
              >
                <div className="text-left">
                  <div className="font-medium">Keep Server Version</div>
                  <div className="text-xs opacity-80">Use the server version</div>
                </div>
              </Button>

              <Button
                variant={selectedStrategy === 'MERGE' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedStrategy('MERGE')}
              >
                <div className="text-left">
                  <div className="font-medium">Merge Both</div>
                  <div className="text-xs opacity-80">Combine changes intelligently</div>
                </div>
              </Button>

              <Button
                variant={selectedStrategy === 'LATEST_WINS' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedStrategy('LATEST_WINS')}
              >
                <div className="text-left">
                  <div className="font-medium">Use Latest</div>
                  <div className="text-xs opacity-80">Keep the most recent changes</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={resolving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleResolve(selectedStrategy)}
              disabled={resolving}
              className="flex-1"
            >
              {resolving ? 'Resolving...' : 'Resolve Conflict'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
