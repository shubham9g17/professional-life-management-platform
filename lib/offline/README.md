# Offline Support and Sync

This module provides comprehensive offline support for the Professional Life Management Platform, enabling users to continue working without an internet connection and automatically syncing changes when connectivity is restored.

## Features

- **IndexedDB Storage**: Local storage for offline data persistence
- **Sync Queue**: Automatic queuing of operations performed while offline
- **Conflict Detection**: Intelligent detection of data conflicts during sync
- **Conflict Resolution**: Multiple strategies for resolving sync conflicts
- **Optimistic UI Updates**: Immediate UI feedback with automatic rollback on errors
- **Offline Indicator**: Visual feedback of connection status
- **Sync Status**: Detailed view of pending operations and conflicts

## Architecture

### Storage Layer (`indexeddb.ts`)

The IndexedDB wrapper provides three main object stores:

1. **entities**: Cached entity data
2. **syncQueue**: Queue of operations to sync
3. **conflicts**: Unresolved sync conflicts

### Sync Queue (`sync-queue.ts`)

Manages offline operations:
- Queues CREATE, UPDATE, DELETE operations
- Deduplicates operations for the same entity
- Tracks sync status
- Provides operation counts and statistics

### Conflict Detection (`conflict-detection.ts`)

Detects conflicts between local and server data:
- Compares timestamps and data
- Identifies conflicting fields
- Calculates conflict severity
- Determines if auto-resolution is possible

### Conflict Resolution (`conflict-resolution.ts`)

Provides multiple resolution strategies:
- **LOCAL_WINS**: Keep local changes
- **SERVER_WINS**: Keep server version
- **LATEST_WINS**: Use most recent timestamp
- **MERGE**: Intelligently merge both versions
- **MANUAL**: Require user input

## API Endpoints

### POST /api/sync/queue

Batch sync operations from offline queue.

**Request:**
```json
{
  "operations": [
    {
      "id": "op-123",
      "operation": "CREATE",
      "entity": "task",
      "entityId": "task-456",
      "data": { ... },
      "timestamp": 1234567890
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "operationId": "op-123",
      "success": true
    }
  ],
  "totalProcessed": 1,
  "successful": 1,
  "failed": 0
}
```

### GET /api/sync/status

Get current sync status.

**Response:**
```json
{
  "status": "pending",
  "totalOperations": 10,
  "syncedOperations": 8,
  "pendingOperations": 2,
  "unresolvedConflicts": 1,
  "lastSyncTime": "2024-01-01T12:00:00Z",
  "pendingByEntity": {
    "task": 1,
    "habit": 1
  },
  "conflicts": [...]
}
```

### POST /api/sync/resolve-conflict

Resolve a sync conflict.

**Request:**
```json
{
  "conflictId": "conflict-123",
  "strategy": "MERGE",
  "resolvedData": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "conflict": { ... },
  "message": "Conflict resolved successfully"
}
```

## UI Components

### OfflineIndicator

Shows connection status and pending sync count.

```tsx
import { OfflineIndicator } from '@/components/offline';

<OfflineIndicator />
```

### SyncStatus

Detailed sync status with manual sync trigger.

```tsx
import { SyncStatus } from '@/components/offline';

<SyncStatus />
```

### ConflictResolver

Modal for resolving sync conflicts.

```tsx
import { ConflictResolver } from '@/components/offline';

<ConflictResolver
  conflicts={conflicts}
  onResolve={handleResolve}
  onClose={handleClose}
/>
```

## Hooks

### useOptimisticMutation

Basic optimistic updates:

```tsx
import { useOptimisticMutation } from '@/lib/offline/use-optimistic-mutation';

const { mutate, isLoading, error } = useOptimisticMutation(
  async () => {
    // Your mutation logic
  },
  {
    onSuccess: (data) => console.log('Success', data),
    onError: (error) => console.error('Error', error),
  }
);
```

### useOfflineMutation

Offline-aware mutations with automatic queuing:

```tsx
import { useOfflineMutation } from '@/lib/offline/use-optimistic-mutation';

const { mutate, isLoading, error } = useOfflineMutation(
  userId,
  'task',
  'CREATE',
  async () => {
    // Your mutation logic
  },
  {
    onSuccess: (data) => console.log('Success', data),
  }
);

// Use it
mutate(entityId, data);
```

## Usage Example

### Creating a Task Offline

```tsx
'use client';

import { useState } from 'react';
import { useOfflineMutation } from '@/lib/offline/use-optimistic-mutation';
import { OfflineIndicator } from '@/components/offline';

export function TaskForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState('');

  const { mutate, isLoading } = useOfflineMutation(
    userId,
    'task',
    'CREATE',
    async () => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      return response.json();
    },
    {
      onSuccess: () => {
        setTitle('');
        alert('Task created!');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskId = `task-${Date.now()}`;
    mutate(taskId, { title });
  };

  return (
    <>
      <OfflineIndicator />
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </>
  );
}
```

## Conflict Resolution Flow

1. **Detection**: When syncing, conflicts are detected by comparing timestamps and data
2. **Storage**: Conflicts are stored in the database for user review
3. **Notification**: User is notified of conflicts via UI
4. **Resolution**: User chooses a resolution strategy or provides manual resolution
5. **Application**: Resolved data is applied to the entity
6. **Cleanup**: Conflict record is marked as resolved

## Best Practices

1. **Always use optimistic updates** for better UX
2. **Queue operations when offline** to prevent data loss
3. **Handle conflicts gracefully** with clear UI
4. **Provide manual resolution** for complex conflicts
5. **Show sync status** to keep users informed
6. **Test offline scenarios** thoroughly

## Testing

The offline support includes property-based tests for:
- Operation idempotence (Property 13)
- Conflict resolution determinism (Property 14)

Run tests with:
```bash
npm test
```

## Future Enhancements

- Background sync with Service Workers
- Periodic auto-sync
- Conflict prediction
- Batch conflict resolution
- Sync history and audit trail
