'use client';

/**
 * Hook for optimistic UI updates
 * Provides optimistic updates with automatic rollback on error
 */

import { useState, useCallback } from 'react';
import { getSyncQueue } from './sync-queue';

interface OptimisticMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

export function useOptimisticMutation<T = any>(
  mutationFn: () => Promise<T>,
  options?: OptimisticMutationOptions<T>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn();
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
      options?.onSettled?.();
    }
  }, [mutationFn, options]);

  return {
    mutate,
    isLoading,
    error,
  };
}

/**
 * Hook for offline-aware mutations
 * Automatically queues operations when offline
 */
export function useOfflineMutation<T = any>(
  userId: string,
  entity: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  mutationFn: () => Promise<T>,
  options?: OptimisticMutationOptions<T>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (entityId: string, data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if online
      if (navigator.onLine) {
        // Try to execute mutation
        const result = await mutationFn();
        options?.onSuccess?.(result);
        return result;
      } else {
        // Queue for offline sync
        const syncQueue = getSyncQueue();
        await syncQueue.queueOperation(userId, operation, entity as any, entityId, data);
        
        // Return optimistic result
        const optimisticResult = { id: entityId, ...data } as T;
        options?.onSuccess?.(optimisticResult);
        return optimisticResult;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      // If online request failed, queue for offline sync
      if (navigator.onLine) {
        const syncQueue = getSyncQueue();
        await syncQueue.queueOperation(userId, operation, entity as any, entityId, data);
      }
      
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
      options?.onSettled?.();
    }
  }, [userId, entity, operation, mutationFn, options]);

  return {
    mutate,
    isLoading,
    error,
  };
}
