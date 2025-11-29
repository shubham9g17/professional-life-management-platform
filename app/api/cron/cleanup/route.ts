import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logging'

/**
 * Cleanup Cron Job
 * 
 * Runs daily to clean up old data:
 * - Delete old sync queue entries
 * - Delete old conflict resolutions
 * - Delete old notifications
 * - Archive old audit logs
 * 
 * Scheduled to run at 2 AM daily via vercel.json
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results = {
    syncQueue: 0,
    conflicts: 0,
    notifications: 0,
    success: true,
    errors: [] as string[],
  }

  try {
    // Clean up synced queue entries older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const syncQueueDeleted = await prisma.syncQueue.deleteMany({
      where: {
        synced: true,
        timestamp: {
          lt: sevenDaysAgo,
        },
      },
    })
    results.syncQueue = syncQueueDeleted.count

    // Clean up resolved conflicts older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const conflictsDeleted = await prisma.conflictResolution.deleteMany({
      where: {
        resolvedAt: {
          lt: thirtyDaysAgo,
        },
      },
    })
    results.conflicts = conflictsDeleted.count

    // Clean up read notifications older than 30 days
    const notificationsDeleted = await prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    })
    results.notifications = notificationsDeleted.count

    logger.info('Cleanup cron job completed', {
      duration: Date.now() - startTime,
      results,
    })

    return NextResponse.json({
      success: true,
      duration: Date.now() - startTime,
      results,
    })
  } catch (error) {
    logger.error('Cleanup cron job failed', { error })
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
