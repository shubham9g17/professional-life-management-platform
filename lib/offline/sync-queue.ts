/**
 * Sync queue manager for offline operations
 * Handles queuing operations when offline and syncing when online
 */

import { getDB, SyncOperation } from './indexeddb';
import { v4 as uuidv4 } from 'uuid';

export type EntityType = 
  | 'task' 
  | 'habit' 
  | 'transaction' 
  | 'exercise' 
  | 'meal' 
  | 'water' 
  | 'learningResource'
  | 'healthMetric'
  | 'notification';

export interface QueuedOperation {
  id: string;
  userId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: EntityType;
  entityId: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

class SyncQueueManager {
  /**
   * Add an operation to the sync queue
   */
  async queueOperation(
    userId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: EntityType,
    entityId: string,
    data: any
  ): Promise<string> {
    const db = await getDB();
    
    const queuedOp: SyncOperation = {
      id: uuidv4(),
      userId,
      operation,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    await db.addToSyncQueue(queuedOp);
    return queuedOp.id;
  }

  /**
   * Get all unsynced operations for a user
   */
  async getUnsyncedOperations(userId: string): Promise<SyncOperation[]> {
    const db = await getDB();
    return db.getUnsyncedOperations(userId);
  }

  /**
   * Get all operations (synced and unsynced) for a user
   */
  async getAllOperations(userId: string): Promise<SyncOperation[]> {
    const db = await getDB();
    return db.getSyncQueue(userId);
  }

  /**
   * Mark an operation as synced
   */
  async markSynced(operationId: string): Promise<void> {
    const db = await getDB();
    await db.markOperationSynced(operationId);
  }

  /**
   * Remove an operation from the queue
   */
  async removeOperation(operationId: string): Promise<void> {
    const db = await getDB();
    await db.removeSyncOperation(operationId);
  }

  /**
   * Get the count of unsynced operations
   */
  async getUnsyncedCount(userId: string): Promise<number> {
    const operations = await this.getUnsyncedOperations(userId);
    return operations.length;
  }

  /**
   * Clear all synced operations (cleanup)
   */
  async clearSyncedOperations(userId: string): Promise<void> {
    const db = await getDB();
    const allOps = await db.getSyncQueue(userId);
    
    for (const op of allOps) {
      if (op.synced) {
        await db.removeSyncOperation(op.id);
      }
    }
  }

  /**
   * Deduplicate operations in the queue
   * If multiple operations exist for the same entity, keep only the latest
   */
  async deduplicateQueue(userId: string): Promise<void> {
    const db = await getDB();
    const operations = await db.getUnsyncedOperations(userId);
    
    // Group by entity and entityId
    const grouped = new Map<string, SyncOperation[]>();
    
    for (const op of operations) {
      const key = `${op.entity}:${op.entityId}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(op);
    }

    // For each group, keep only the latest operation
    for (const [, ops] of grouped) {
      if (ops.length > 1) {
        // Sort by timestamp
        ops.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove all but the last one
        for (let i = 0; i < ops.length - 1; i++) {
          await db.removeSyncOperation(ops[i].id);
        }
      }
    }
  }

  /**
   * Check if there are pending operations for a specific entity
   */
  async hasPendingOperations(userId: string, entity: EntityType, entityId: string): Promise<boolean> {
    const operations = await this.getUnsyncedOperations(userId);
    return operations.some(op => op.entity === entity && op.entityId === entityId);
  }
}

// Singleton instance
let queueManager: SyncQueueManager | null = null;

export function getSyncQueue(): SyncQueueManager {
  if (!queueManager) {
    queueManager = new SyncQueueManager();
  }
  return queueManager;
}

export { SyncQueueManager };
