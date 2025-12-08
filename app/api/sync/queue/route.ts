/**
 * Sync queue API endpoint
 * POST /api/sync/queue - Batch sync operations from offline queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

interface SyncOperation {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  data: any;
  timestamp: number;
}

interface SyncResult {
  operationId: string;
  success: boolean;
  error?: string;
  conflict?: {
    localVersion: any;
    serverVersion: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { operations } = await request.json();

    if (!Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'Operations must be an array' },
        { status: 400 }
      );
    }

    const results: SyncResult[] = [];

    // Process each operation
    for (const op of operations as SyncOperation[]) {
      try {
        const result = await processSyncOperation(session.user.id, op);
        results.push(result);
      } catch (error) {
        results.push({
          operationId: op.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      results,
      totalProcessed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });
  } catch (error) {
    console.error('Sync queue error:', error);
    return NextResponse.json(
      { error: 'Failed to process sync queue' },
      { status: 500 }
    );
  }
}

async function processSyncOperation(
  userId: string,
  operation: SyncOperation
): Promise<SyncResult> {
  const { id, operation: op, entity, entityId, data } = operation;

  try {
    switch (entity) {
      case 'task':
        return await syncTask(userId, op, entityId, data);
      
      case 'habit':
        return await syncHabit(userId, op, entityId, data);
      
      case 'transaction':
        return await syncTransaction(userId, op, entityId, data);
      
      case 'exercise':
        return await syncExercise(userId, op, entityId, data);
      
      case 'meal':
        return await syncMeal(userId, op, entityId, data);
      
      case 'water':
        return await syncWater(userId, op, entityId, data);
      
      case 'learningResource':
        return await syncLearningResource(userId, op, entityId, data);
      
      default:
        return {
          operationId: id,
          success: false,
          error: `Unknown entity type: ${entity}`,
        };
    }
  } catch (error) {
    return {
      operationId: id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function syncTask(
  userId: string,
  operation: string,
  entityId: string,
  data: any
): Promise<SyncResult> {
  if (operation === 'CREATE') {
    const existing = await prisma.task.findUnique({ where: { id: entityId } });
    
    if (existing) {
      // Conflict: entity already exists
      return {
        operationId: entityId,
        success: false,
        error: 'Conflict detected',
        conflict: {
          localVersion: data,
          serverVersion: existing,
        },
      };
    }

    await prisma.task.create({
      data: {
        id: entityId,
        userId,
        ...data,
      },
    });

    return { operationId: entityId, success: true };
  }

  if (operation === 'UPDATE') {
    const existing = await prisma.task.findUnique({ where: { id: entityId } });
    
    if (!existing) {
      // Entity doesn't exist, treat as create
      await prisma.task.create({
        data: {
          id: entityId,
          userId,
          ...data,
        },
      });
      return { operationId: entityId, success: true };
    }

    // Check for conflicts
    if (existing.updatedAt.getTime() > data.updatedAt) {
      return {
        operationId: entityId,
        success: false,
        error: 'Conflict detected',
        conflict: {
          localVersion: data,
          serverVersion: existing,
        },
      };
    }

    await prisma.task.update({
      where: { id: entityId },
      data,
    });

    return { operationId: entityId, success: true };
  }

  if (operation === 'DELETE') {
    await prisma.task.delete({ where: { id: entityId } }).catch(() => {
      // Ignore if already deleted
    });
    return { operationId: entityId, success: true };
  }

  return {
    operationId: entityId,
    success: false,
    error: 'Unknown operation',
  };
}

async function syncHabit(
  userId: string,
  operation: string,
  entityId: string,
  data: any
): Promise<SyncResult> {
  if (operation === 'CREATE') {
    await prisma.habit.create({
      data: { id: entityId, userId, ...data },
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'UPDATE') {
    await prisma.habit.update({
      where: { id: entityId },
      data,
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'DELETE') {
    await prisma.habit.delete({ where: { id: entityId } }).catch(() => {});
    return { operationId: entityId, success: true };
  }

  return { operationId: entityId, success: false, error: 'Unknown operation' };
}

async function syncTransaction(
  userId: string,
  operation: string,
  entityId: string,
  data: any
): Promise<SyncResult> {
  if (operation === 'CREATE') {
    await prisma.transaction.create({
      data: { id: entityId, userId, ...data },
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'UPDATE') {
    await prisma.transaction.update({
      where: { id: entityId },
      data,
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'DELETE') {
    await prisma.transaction.delete({ where: { id: entityId } }).catch(() => {});
    return { operationId: entityId, success: true };
  }

  return { operationId: entityId, success: false, error: 'Unknown operation' };
}

async function syncExercise(
  userId: string,
  operation: string,
  entityId: string,
  data: any
): Promise<SyncResult> {
  if (operation === 'CREATE') {
    await prisma.exercise.create({
      data: { id: entityId, userId, ...data },
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'UPDATE') {
    await prisma.exercise.update({
      where: { id: entityId },
      data,
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'DELETE') {
    await prisma.exercise.delete({ where: { id: entityId } }).catch(() => {});
    return { operationId: entityId, success: true };
  }

  return { operationId: entityId, success: false, error: 'Unknown operation' };
}

async function syncMeal(
  userId: string,
  operation: string,
  entityId: string,
  data: any
): Promise<SyncResult> {
  if (operation === 'CREATE') {
    await prisma.meal.create({
      data: { id: entityId, userId, ...data },
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'UPDATE') {
    await prisma.meal.update({
      where: { id: entityId },
      data,
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'DELETE') {
    await prisma.meal.delete({ where: { id: entityId } }).catch(() => {});
    return { operationId: entityId, success: true };
  }

  return { operationId: entityId, success: false, error: 'Unknown operation' };
}

async function syncWater(
  userId: string,
  operation: string,
  entityId: string,
  data: any
): Promise<SyncResult> {
  if (operation === 'CREATE') {
    await prisma.waterIntake.create({
      data: { id: entityId, userId, ...data },
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'UPDATE') {
    await prisma.waterIntake.update({
      where: { id: entityId },
      data,
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'DELETE') {
    await prisma.waterIntake.delete({ where: { id: entityId } }).catch(() => {});
    return { operationId: entityId, success: true };
  }

  return { operationId: entityId, success: false, error: 'Unknown operation' };
}

async function syncLearningResource(
  userId: string,
  operation: string,
  entityId: string,
  data: any
): Promise<SyncResult> {
  if (operation === 'CREATE') {
    await prisma.learningResource.create({
      data: { id: entityId, userId, ...data },
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'UPDATE') {
    await prisma.learningResource.update({
      where: { id: entityId },
      data,
    });
    return { operationId: entityId, success: true };
  }

  if (operation === 'DELETE') {
    await prisma.learningResource.delete({ where: { id: entityId } }).catch(() => {});
    return { operationId: entityId, success: true };
  }

  return { operationId: entityId, success: false, error: 'Unknown operation' };
}
