import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getHealthMetrics,
  upsertHealthMetric,
} from '@/lib/repositories/health-metric-repository'

/**
 * GET /api/health-metrics
 * Get health metrics for the authenticated user
 * Query params:
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const metrics = await getHealthMetrics(
      session.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Error fetching health metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health metrics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/health-metrics
 * Create or update health metrics for a specific date
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { date, weight, sleepQuality, stressLevel, energyLevel } = body

    // Validate required fields
    if (!date) {
      return NextResponse.json(
        { error: 'Missing required field: date' },
        { status: 400 }
      )
    }

    // Validate at least one metric is provided
    if (
      weight === undefined &&
      sleepQuality === undefined &&
      stressLevel === undefined &&
      energyLevel === undefined
    ) {
      return NextResponse.json(
        { error: 'At least one metric must be provided' },
        { status: 400 }
      )
    }

    // Validate ranges
    if (sleepQuality !== undefined && (sleepQuality < 1 || sleepQuality > 10)) {
      return NextResponse.json(
        { error: 'Sleep quality must be between 1 and 10' },
        { status: 400 }
      )
    }

    if (stressLevel !== undefined && (stressLevel < 1 || stressLevel > 10)) {
      return NextResponse.json(
        { error: 'Stress level must be between 1 and 10' },
        { status: 400 }
      )
    }

    if (energyLevel !== undefined && (energyLevel < 1 || energyLevel > 10)) {
      return NextResponse.json(
        { error: 'Energy level must be between 1 and 10' },
        { status: 400 }
      )
    }

    if (weight !== undefined && weight <= 0) {
      return NextResponse.json(
        { error: 'Weight must be a positive number' },
        { status: 400 }
      )
    }

    const metric = await upsertHealthMetric({
      userId: session.user.id,
      date: new Date(date),
      weight,
      sleepQuality,
      stressLevel,
      energyLevel,
    })

    return NextResponse.json({ metric }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating health metric:', error)
    return NextResponse.json(
      { error: 'Failed to create/update health metric' },
      { status: 500 }
    )
  }
}
