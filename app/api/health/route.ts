import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

/**
 * Health Check Endpoint
 * 
 * Returns the health status of the application and its dependencies.
 * Used by monitoring systems and load balancers.
 */
export async function GET() {
  const startTime = Date.now()
  
  const health: {
    status: string
    timestamp: string
    uptime: number
    checks: {
      database: { status: string; responseTime?: number; error?: string; message?: string }
      redis: { status: string; responseTime?: number; error?: string; message?: string }
      memory: { status: string; usage?: number; limit?: number; percentage?: number; error?: string; message?: string }
    }
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'unknown', responseTime: 0 },
      redis: { status: 'unknown', responseTime: 0 },
      memory: { status: 'unknown', usage: 0, limit: 0 },
    },
  }

  // Check database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.database = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check Redis connection
  if (redis) {
    try {
      const redisStart = Date.now()
      await redis.ping()
      health.checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStart,
      }
    } catch (error) {
      // Redis is optional, so we don't mark the whole system as unhealthy
      health.checks.redis = {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  } else {
    // Redis is disabled
    health.checks.redis = {
      status: 'disabled',
      message: 'Redis caching is disabled',
    }
  }

  // Check memory usage
  const memUsage = process.memoryUsage()
  const memLimit = 1024 * 1024 * 1024 // 1GB default limit
  const memPercent = (memUsage.heapUsed / memLimit) * 100
  
  health.checks.memory = {
    status: memPercent > 90 ? 'critical' : memPercent > 75 ? 'warning' : 'healthy',
    usage: memUsage.heapUsed,
    limit: memLimit,
    percentage: Math.round(memPercent * 100) / 100,
  }

  // Determine overall status
  if (health.checks.database.status === 'unhealthy') {
    health.status = 'unhealthy'
  } else if (
    health.checks.redis.status === 'degraded' ||
    health.checks.memory.status === 'warning'
  ) {
    health.status = 'degraded'
  }
  // Note: Redis 'disabled' status doesn't affect overall health

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
