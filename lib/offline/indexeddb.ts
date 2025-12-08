/**
 * IndexedDB wrapper for offline storage
 * Provides a simple interface for storing and retrieving data locally
 */

const DB_NAME = 'professional-life-platform';
const DB_VERSION = 1;

export interface StoredEntity {
  id: string;
  entity: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface SyncOperation {
  id: string;
  userId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

class IndexedDBWrapper {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for cached entities
        if (!db.objectStoreNames.contains('entities')) {
          const entityStore = db.createObjectStore('entities', { keyPath: 'id' });
          entityStore.createIndex('entity', 'entity', { unique: false });
          entityStore.createIndex('synced', 'synced', { unique: false });
        }

        // Store for sync queue
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('userId', 'userId', { unique: false });
          syncStore.createIndex('synced', 'synced', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for conflict resolution
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictStore.createIndex('userId', 'userId', { unique: false });
          conflictStore.createIndex('entity', 'entity', { unique: false });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Entity storage methods
  async storeEntity(entity: StoredEntity): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['entities'], 'readwrite');
      const store = transaction.objectStore('entities');
      const request = store.put(entity);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getEntity(id: string): Promise<StoredEntity | null> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['entities'], 'readonly');
      const store = transaction.objectStore('entities');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getEntitiesByType(entityType: string): Promise<StoredEntity[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['entities'], 'readonly');
      const store = transaction.objectStore('entities');
      const index = store.index('entity');
      const request = index.getAll(entityType);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteEntity(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['entities'], 'readwrite');
      const store = transaction.objectStore('entities');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Sync queue methods
  async addToSyncQueue(operation: SyncOperation): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueue(userId: string): Promise<SyncOperation[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const operations = request.result || [];
        // Sort by timestamp to maintain order
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };
    });
  }

  async getUnsyncedOperations(userId: string): Promise<SyncOperation[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const operations = (request.result || []).filter(
          (op: SyncOperation) => op.userId === userId && !op.synced
        );
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };
    });
  }

  async markOperationSynced(operationId: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getRequest = store.get(operationId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.synced = true;
          const putRequest = store.put(operation);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  async removeSyncOperation(operationId: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(operationId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Conflict storage methods
  async storeConflict(conflict: any): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['conflicts'], 'readwrite');
      const store = transaction.objectStore('conflicts');
      const request = store.put(conflict);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getConflicts(userId: string): Promise<any[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['conflicts'], 'readonly');
      const store = transaction.objectStore('conflicts');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteConflict(conflictId: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['conflicts'], 'readwrite');
      const store = transaction.objectStore('conflicts');
      const request = store.delete(conflictId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAll(): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['entities', 'syncQueue', 'conflicts'], 'readwrite');
      
      const clearPromises = [
        new Promise<void>((res, rej) => {
          const req = transaction.objectStore('entities').clear();
          req.onerror = () => rej(req.error);
          req.onsuccess = () => res();
        }),
        new Promise<void>((res, rej) => {
          const req = transaction.objectStore('syncQueue').clear();
          req.onerror = () => rej(req.error);
          req.onsuccess = () => res();
        }),
        new Promise<void>((res, rej) => {
          const req = transaction.objectStore('conflicts').clear();
          req.onerror = () => rej(req.error);
          req.onsuccess = () => res();
        }),
      ];

      Promise.all(clearPromises)
        .then(() => resolve())
        .catch(reject);
    });
  }
}

// Singleton instance
let dbInstance: IndexedDBWrapper | null = null;

export async function getDB(): Promise<IndexedDBWrapper> {
  if (!dbInstance) {
    dbInstance = new IndexedDBWrapper();
    await dbInstance.init();
  }
  return dbInstance;
}

export { IndexedDBWrapper };
