/**
 * Sync status API endpoint
 * GET /api/sync/status - Get sync status for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get sync queue items from database
    const syncQueueItems = await prisma.syncQueue.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });

    // Get unresolved conflicts
    const conflicts = await prisma.conflictResolution.findMany({
      where: {
        userId,
        resolvedVersion: { equals: Prisma.JsonNull }, // Unresolved conflicts
      },
    });

    // Calculate sync statistics
    const totalOperations = syncQueueItems.length;
    const syncedOperations = syncQueueItems.filter((op: any) => op.synced).length;
    const pendingOperations = totalOperations - syncedOperations;

    // Get last sync time
    const lastSyncedOperation = syncQueueItems
      .filter((op: any) => op.synced)
      .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const lastSyncTime = lastSyncedOperation?.timestamp || null;

    // Group pending operations by entity type
    const pendingByEntity = syncQueueItems
      .filter((op: any) => !op.synced)
      .reduce((acc: any, op: any) => {
        acc[op.entity] = (acc[op.entity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return NextResponse.json({
      status: pendingOperations > 0 ? 'pending' : 'synced',
      totalOperations,
      syncedOperations,
      pendingOperations,
      unresolvedConflicts: conflicts.length,
      lastSyncTime,
      pendingByEntity,
      conflicts: conflicts.map((c: any) => ({
        id: c.id,
        entity: c.entity,
        entityId: c.entityId,
        strategy: c.strategy,
      })),
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
