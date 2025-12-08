/**
 * Conflict resolution strategies for offline sync
 * Implements various strategies to resolve data conflicts
 */

import { ConflictData, getConflictingFields } from './conflict-detection';

export type ResolutionStrategy = 
  | 'LOCAL_WINS'      // Local changes take precedence
  | 'SERVER_WINS'     // Server changes take precedence
  | 'MERGE'           // Attempt to merge both versions
  | 'LATEST_WINS'     // Most recent timestamp wins
  | 'MANUAL';         // Requires manual resolution

export interface ResolvedConflict {
  conflictId: string;
  strategy: ResolutionStrategy;
  resolvedData: any;
  resolvedAt: number;
}

/**
 * Resolve conflict using local wins strategy
 */
export function resolveLocalWins(conflict: ConflictData): ResolvedConflict {
  return {
    conflictId: conflict.id,
    strategy: 'LOCAL_WINS',
    resolvedData: conflict.localVersion,
    resolvedAt: Date.now(),
  };
}

/**
 * Resolve conflict using server wins strategy
 */
export function resolveServerWins(conflict: ConflictData): ResolvedConflict {
  return {
    conflictId: conflict.id,
    strategy: 'SERVER_WINS',
    resolvedData: conflict.serverVersion,
    resolvedAt: Date.now(),
  };
}

/**
 * Resolve conflict using latest timestamp wins strategy
 */
export function resolveLatestWins(conflict: ConflictData): ResolvedConflict {
  const useLocal = conflict.localTimestamp > conflict.serverTimestamp;
  
  return {
    conflictId: conflict.id,
    strategy: 'LATEST_WINS',
    resolvedData: useLocal ? conflict.localVersion : conflict.serverVersion,
    resolvedAt: Date.now(),
  };
}

/**
 * Resolve conflict using merge strategy
 * Attempts to merge non-conflicting fields
 */
export function resolveMerge(conflict: ConflictData): ResolvedConflict {
  const conflictingFields = getConflictingFields(
    conflict.localVersion,
    conflict.serverVersion
  );

  // Start with server version as base
  const merged = { ...conflict.serverVersion };

  // For non-conflicting fields, prefer local if it's newer
  const allKeys = new Set([
    ...Object.keys(conflict.localVersion || {}),
    ...Object.keys(conflict.serverVersion || {})
  ]);

  for (const key of allKeys) {
    // Skip conflicting fields - keep server version
    if (conflictingFields.includes(key)) {
      continue;
    }

    // For non-conflicting fields, use local if it exists
    if (conflict.localVersion && key in conflict.localVersion) {
      merged[key] = conflict.localVersion[key];
    }
  }

  // For conflicting fields, use latest timestamp
  for (const field of conflictingFields) {
    if (conflict.localTimestamp > conflict.serverTimestamp) {
      merged[field] = conflict.localVersion[field];
    } else {
      merged[field] = conflict.serverVersion[field];
    }
  }

  return {
    conflictId: conflict.id,
    strategy: 'MERGE',
    resolvedData: merged,
    resolvedAt: Date.now(),
  };
}

/**
 * Automatically resolve conflict using best strategy
 */
export function autoResolve(conflict: ConflictData): ResolvedConflict {
  // If one version is null/undefined, use the other
  if (!conflict.localVersion && conflict.serverVersion) {
    return resolveServerWins(conflict);
  }
  if (conflict.localVersion && !conflict.serverVersion) {
    return resolveLocalWins(conflict);
  }

  // Get conflicting fields
  const conflictingFields = getConflictingFields(
    conflict.localVersion,
    conflict.serverVersion
  );

  // If no conflicting fields, use local (shouldn't happen, but safe)
  if (conflictingFields.length === 0) {
    return resolveLocalWins(conflict);
  }

  // If only timestamp-related fields conflict, use latest
  const nonTimestampConflicts = conflictingFields.filter(
    field => !field.toLowerCase().includes('time') && 
             !field.toLowerCase().includes('date') &&
             field !== 'updatedAt'
  );

  if (nonTimestampConflicts.length === 0) {
    return resolveLatestWins(conflict);
  }

  // If few conflicts, try merge
  if (conflictingFields.length <= 2) {
    return resolveMerge(conflict);
  }

  // For complex conflicts, use latest timestamp
  return resolveLatestWins(conflict);
}

/**
 * Resolve conflict with specified strategy
 */
export function resolveConflict(
  conflict: ConflictData,
  strategy: ResolutionStrategy
): ResolvedConflict {
  switch (strategy) {
    case 'LOCAL_WINS':
      return resolveLocalWins(conflict);
    
    case 'SERVER_WINS':
      return resolveServerWins(conflict);
    
    case 'LATEST_WINS':
      return resolveLatestWins(conflict);
    
    case 'MERGE':
      return resolveMerge(conflict);
    
    case 'MANUAL':
      throw new Error('Manual resolution requires user input');
    
    default:
      return autoResolve(conflict);
  }
}

/**
 * Batch resolve multiple conflicts
 */
export function batchResolve(
  conflicts: ConflictData[],
  strategy: ResolutionStrategy
): ResolvedConflict[] {
  return conflicts.map(conflict => resolveConflict(conflict, strategy));
}

/**
 * Get recommended resolution strategy for a conflict
 */
export function getRecommendedStrategy(conflict: ConflictData): ResolutionStrategy {
  const conflictingFields = getConflictingFields(
    conflict.localVersion,
    conflict.serverVersion
  );

  // If no real conflicts, use local
  if (conflictingFields.length === 0) {
    return 'LOCAL_WINS';
  }

  // If only a few fields conflict, try merge
  if (conflictingFields.length <= 2) {
    return 'MERGE';
  }

  // If many fields conflict, use latest timestamp
  if (conflictingFields.length > 5) {
    return 'LATEST_WINS';
  }

  // Default to merge for moderate conflicts
  return 'MERGE';
}
