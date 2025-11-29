/**
 * Row-Level Security (RLS) Utilities
 * Ensures users can only access their own data
 */

import { Prisma } from '@prisma/client';

/**
 * Add user filter to Prisma query
 * Ensures queries only return data belonging to the authenticated user
 */
export function addUserFilter<T extends { userId?: string }>(
  userId: string,
  where?: T
): T & { userId: string } {
  return {
    ...where,
    userId,
  } as T & { userId: string };
}

/**
 * Validate that a user owns a resource
 */
export async function validateResourceOwnership(
  prisma: any,
  model: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  try {
    const resource = await prisma[model].findUnique({
      where: { id: resourceId },
      select: { userId: true },
    });
    
    return resource?.userId === userId;
  } catch {
    return false;
  }
}

/**
 * Create a secure Prisma client wrapper that enforces RLS
 */
export function createSecurePrismaClient(prisma: any, userId: string) {
  return new Proxy(prisma, {
    get(target, prop) {
      const original = target[prop];
      
      // Only intercept model operations
      if (typeof original !== 'object' || !original) {
        return original;
      }
      
      // Models that have userId field
      const modelsWithUserId = [
        'task',
        'habit',
        'transaction',
        'budget',
        'exercise',
        'healthMetric',
        'fitnessGoal',
        'meal',
        'waterIntake',
        'learningResource',
        'dailyMetrics',
        'achievement',
        'notification',
        'syncQueue',
        'conflictResolution',
        'integration',
      ];
      
      if (!modelsWithUserId.includes(prop as string)) {
        return original;
      }
      
      // Wrap model operations
      return new Proxy(original, {
        get(modelTarget, operation) {
          const originalOperation = modelTarget[operation];
          
          if (typeof originalOperation !== 'function') {
            return originalOperation;
          }
          
          // Operations that need userId filter
          const operationsToFilter = [
            'findMany',
            'findFirst',
            'findUnique',
            'count',
            'aggregate',
            'groupBy',
            'update',
            'updateMany',
            'delete',
            'deleteMany',
          ];
          
          if (!operationsToFilter.includes(operation as string)) {
            return originalOperation;
          }
          
          // Wrap the operation to add userId filter
          return function (args: any) {
            const modifiedArgs = { ...args };
            
            // Add userId to where clause
            if (operation === 'findUnique') {
              // For findUnique, we need to validate after fetching
              return originalOperation.call(modelTarget, args).then((result: any) => {
                if (result && result.userId !== userId) {
                  return null; // Hide resources that don't belong to user
                }
                return result;
              });
            } else {
              // For other operations, add userId to where clause
              modifiedArgs.where = addUserFilter(userId, modifiedArgs.where);
              return originalOperation.call(modelTarget, modifiedArgs);
            }
          };
        },
      });
    },
  });
}

/**
 * Middleware to enforce row-level security in Prisma
 */
export function createRLSMiddleware(userId: string) {
  return async (params: any, next: any) => {
    // Models that have userId field
    const modelsWithUserId = [
      'Task',
      'Habit',
      'Transaction',
      'Budget',
      'Exercise',
      'HealthMetric',
      'FitnessGoal',
      'Meal',
      'WaterIntake',
      'LearningResource',
      'DailyMetrics',
      'Achievement',
      'Notification',
      'SyncQueue',
      'ConflictResolution',
      'Integration',
    ];
    
    if (!modelsWithUserId.includes(params.model || '')) {
      return next(params);
    }
    
    // Operations that need userId filter
    const readOperations = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'];
    const writeOperations = ['create', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'];
    
    if (readOperations.includes(params.action)) {
      // Add userId filter to read operations
      params.args.where = addUserFilter(userId, params.args.where);
    } else if (writeOperations.includes(params.action)) {
      // For create operations, ensure userId is set
      if (params.action === 'create') {
        params.args.data = {
          ...params.args.data,
          userId,
        };
      } else {
        // For update/delete operations, add userId filter
        params.args.where = addUserFilter(userId, params.args.where);
      }
    }
    
    return next(params);
  };
}

/**
 * Check if user has permission to access a resource
 */
export interface ResourcePermission {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export async function checkResourcePermission(
  prisma: any,
  model: string,
  resourceId: string,
  userId: string
): Promise<ResourcePermission> {
  const isOwner = await validateResourceOwnership(prisma, model, resourceId, userId);
  
  return {
    canRead: isOwner,
    canWrite: isOwner,
    canDelete: isOwner,
  };
}

/**
 * Sanitize query results to remove sensitive fields
 */
export function sanitizeUserData<T extends Record<string, any>>(
  data: T,
  sensitiveFields: (keyof T)[] = ['passwordHash', 'accessToken', 'refreshToken']
): Omit<T, keyof T> {
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    delete sanitized[field];
  }
  
  return sanitized;
}

/**
 * Batch validate resource ownership
 */
export async function validateBatchOwnership(
  prisma: any,
  model: string,
  resourceIds: string[],
  userId: string
): Promise<{ valid: boolean; invalidIds: string[] }> {
  const resources = await prisma[model].findMany({
    where: {
      id: { in: resourceIds },
    },
    select: {
      id: true,
      userId: true,
    },
  });
  
  const invalidIds = resources
    .filter((resource: any) => resource.userId !== userId)
    .map((resource: any) => resource.id);
  
  return {
    valid: invalidIds.length === 0,
    invalidIds,
  };
}
