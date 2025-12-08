import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getTrendData } from '@/lib/repositories/analytics-repository'

/**
 * GET /api/analytics/trends
 * Get historical trend data for charts
 * Query params: days (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      )
    }

    const trends = await getTrendData(session.user.id, days)

    return NextResponse.json({
      trends,
      period: {
        days,
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    })
  } catch (error) {
    console.error('Error fetching analytics trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics trends' },
      { status: 500 }
    )
  }
}
