/**
 * Conflict detection logic for offline sync
 * Detects when local and server versions of data conflict
 */

export interface ConflictData {
  id: string;
  userId: string;
  entity: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  localTimestamp: number;
  serverTimestamp: number;
  detectedAt: number;
}

export type ConflictType = 
  | 'UPDATE_UPDATE' // Both local and server updated
  | 'UPDATE_DELETE' // Local updated, server deleted
  | 'DELETE_UPDATE' // Local deleted, server updated
  | 'CREATE_CREATE'; // Both created (rare, but possible with UUID collisions)

/**
 * Detect if there's a conflict between local and server data
 */
export function detectConflict(
  localData: any,
  serverData: any,
  localTimestamp: number,
  serverTimestamp: number
): boolean {
  // No conflict if timestamps match
  if (localTimestamp === serverTimestamp) {
    return false;
  }

  // No conflict if data is identical
  if (JSON.stringify(localData) === JSON.stringify(serverData)) {
    return false;
  }

  // Conflict exists if both have been modified
  return true;
}

/**
 * Determine the type of conflict
 */
export function getConflictType(
  localExists: boolean,
  serverExists: boolean,
  localOperation: 'CREATE' | 'UPDATE' | 'DELETE',
  serverOperation?: 'CREATE' | 'UPDATE' | 'DELETE'
): ConflictType {
  if (localOperation === 'DELETE' && serverExists && serverOperation === 'UPDATE') {
    return 'DELETE_UPDATE';
  }

  if (localOperation === 'UPDATE' && !serverExists) {
    return 'UPDATE_DELETE';
  }

  if (localOperation === 'CREATE' && serverExists) {
    return 'CREATE_CREATE';
  }

  return 'UPDATE_UPDATE';
}

/**
 * Check if a field has been modified
 */
export function isFieldModified(
  localValue: any,
  serverValue: any
): boolean {
  // Handle null/undefined
  if (localValue === null || localValue === undefined) {
    return serverValue !== null && serverValue !== undefined;
  }
  if (serverValue === null || serverValue === undefined) {
    return localValue !== null && localValue !== undefined;
  }

  // Handle dates
  if (localValue instanceof Date && serverValue instanceof Date) {
    return localValue.getTime() !== serverValue.getTime();
  }

  // Handle objects
  if (typeof localValue === 'object' && typeof serverValue === 'object') {
    return JSON.stringify(localValue) !== JSON.stringify(serverValue);
  }

  // Handle primitives
  return localValue !== serverValue;
}

/**
 * Get list of conflicting fields
 */
export function getConflictingFields(
  localData: any,
  serverData: any
): string[] {
  const conflicts: string[] = [];
  
  // Get all unique keys
  const allKeys = new Set([
    ...Object.keys(localData || {}),
    ...Object.keys(serverData || {})
  ]);

  for (const key of allKeys) {
    // Skip metadata fields
    if (['id', 'userId', 'createdAt'].includes(key)) {
      continue;
    }

    if (isFieldModified(localData[key], serverData[key])) {
      conflicts.push(key);
    }
  }

  return conflicts;
}

/**
 * Calculate conflict severity (0-1)
 * Higher values indicate more severe conflicts
 */
export function calculateConflictSeverity(
  localData: any,
  serverData: any
): number {
  const conflictingFields = getConflictingFields(localData, serverData);
  const totalFields = new Set([
    ...Object.keys(localData || {}),
    ...Object.keys(serverData || {})
  ]).size;

  if (totalFields === 0) return 0;

  return conflictingFields.length / totalFields;
}

/**
 * Check if conflict can be auto-resolved
 * Returns true if the conflict is simple enough to auto-resolve
 */
export function canAutoResolve(
  localData: any,
  serverData: any,
  conflictType: ConflictType
): boolean {
  // Can't auto-resolve delete conflicts
  if (conflictType === 'DELETE_UPDATE' || conflictType === 'UPDATE_DELETE') {
    return false;
  }

  // Can auto-resolve if severity is low
  const severity = calculateConflictSeverity(localData, serverData);
  return severity < 0.3; // Less than 30% of fields conflict
}

/**
 * Create a conflict data object
 */
export function createConflictData(
  userId: string,
  entity: string,
  entityId: string,
  localVersion: any,
  serverVersion: any,
  localTimestamp: number,
  serverTimestamp: number
): ConflictData {
  return {
    id: `conflict_${entityId}_${Date.now()}`,
    userId,
    entity,
    entityId,
    localVersion,
    serverVersion,
    localTimestamp,
    serverTimestamp,
    detectedAt: Date.now(),
  };
}
