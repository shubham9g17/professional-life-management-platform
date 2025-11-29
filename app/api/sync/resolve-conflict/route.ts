/**
 * Conflict resolution API endpoint
 * POST /api/sync/resolve-conflict - Resolve a sync conflict
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

type ResolutionStrategy = 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE' | 'LATEST_WINS' | 'MANUAL';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { conflictId, strategy, resolvedData } = await request.json();

    if (!conflictId) {
      return NextResponse.json(
        { error: 'Conflict ID is required' },
        { status: 400 }
      );
    }

    if (!strategy) {
      return NextResponse.json(
        { error: 'Resolution strategy is required' },
        { status: 400 }
      );
    }

    // Get the conflict
    const conflict = await prisma.conflictResolution.findUnique({
      where: { id: conflictId },
    });

    if (!conflict) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (conflict.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Determine resolved data based on strategy
    let finalResolvedData = resolvedData;

    if (!finalResolvedData) {
      switch (strategy as ResolutionStrategy) {
        case 'LOCAL_WINS':
          finalResolvedData = conflict.localVersion;
          break;
        
        case 'SERVER_WINS':
          finalResolvedData = conflict.serverVersion;
          break;
        
        case 'LATEST_WINS':
          // Compare timestamps if available
          const localTime = (conflict.localVersion as any)?.updatedAt || 0;
          const serverTime = (conflict.serverVersion as any)?.updatedAt || 0;
          finalResolvedData = localTime > serverTime 
            ? conflict.localVersion 
            : conflict.serverVersion;
          break;
        
        case 'MERGE':
          // Simple merge: server base + local overrides
          finalResolvedData = {
            ...(conflict.serverVersion as object),
            ...(conflict.localVersion as object),
          };
          break;
        
        case 'MANUAL':
          return NextResponse.json(
            { error: 'Manual resolution requires resolved data' },
            { status: 400 }
          );
        
        default:
          return NextResponse.json(
            { error: 'Invalid resolution strategy' },
            { status: 400 }
          );
      }
    }

    // Update the conflict with resolution
    const updatedConflict = await prisma.conflictResolution.update({
      where: { id: conflictId },
      data: {
        resolvedVersion: finalResolvedData,
        strategy: strategy as ResolutionStrategy,
        resolvedAt: new Date(),
      },
    });

    // Apply the resolved data to the actual entity
    await applyResolvedData(
      conflict.entity,
      conflict.entityId,
      finalResolvedData,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      conflict: updatedConflict,
      message: 'Conflict resolved successfully',
    });
  } catch (error) {
    console.error('Conflict resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve conflict' },
      { status: 500 }
    );
  }
}

async function applyResolvedData(
  entity: string,
  entityId: string,
  data: any,
  userId: string
): Promise<void> {
  switch (entity) {
    case 'task':
      await prisma.task.upsert({
        where: { id: entityId },
        update: data,
        create: { id: entityId, userId, ...data },
      });
      break;
    
    case 'habit':
      await prisma.habit.upsert({
        where: { id: entityId },
        update: data,
        create: { id: entityId, userId, ...data },
      });
      break;
    
    case 'transaction':
      await prisma.transaction.upsert({
        where: { id: entityId },
        update: data,
        create: { id: entityId, userId, ...data },
      });
      break;
    
    case 'exercise':
      await prisma.exercise.upsert({
        where: { id: entityId },
        update: data,
        create: { id: entityId, userId, ...data },
      });
      break;
    
    case 'meal':
      await prisma.meal.upsert({
        where: { id: entityId },
        update: data,
        create: { id: entityId, userId, ...data },
      });
      break;
    
    case 'water':
      await prisma.waterIntake.upsert({
        where: { id: entityId },
        update: data,
        create: { id: entityId, userId, ...data },
      });
      break;
    
    case 'learningResource':
      await prisma.learningResource.upsert({
        where: { id: entityId },
        update: data,
        create: { id: entityId, userId, ...data },
      });
      break;
    
    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}
