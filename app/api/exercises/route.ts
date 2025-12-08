import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getExercises,
  createExercise,
} from '@/lib/repositories/exercise-repository'

/**
 * GET /api/exercises
 * Get all exercises for the authenticated user with optional filtering
 * Query params:
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - activityType: Filter by activity type
 * - intensity: Filter by intensity level
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
    const activityType = searchParams.get('activityType')
    const intensity = searchParams.get('intensity')

    const filters: any = {}
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)
    if (activityType) filters.activityType = activityType
    if (intensity) filters.intensity = intensity

    const exercises = await getExercises(session.user.id, filters)

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/exercises
 * Create a new exercise log
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
    const { activityType, duration, intensity, caloriesBurned, notes, date } = body

    // Validate required fields
    if (!activityType || !duration || !intensity || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: activityType, duration, intensity, date' },
        { status: 400 }
      )
    }

    // Validate intensity
    const validIntensities = ['LOW', 'MODERATE', 'HIGH', 'INTENSE']
    if (!validIntensities.includes(intensity)) {
      return NextResponse.json(
        { error: 'Invalid intensity. Must be LOW, MODERATE, HIGH, or INTENSE' },
        { status: 400 }
      )
    }

    // Validate duration
    if (typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'Duration must be a positive number' },
        { status: 400 }
      )
    }

    const exercise = await createExercise({
      userId: session.user.id,
      activityType,
      duration,
      intensity,
      caloriesBurned,
      notes,
      date: new Date(date),
    })

    return NextResponse.json({ exercise }, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}
