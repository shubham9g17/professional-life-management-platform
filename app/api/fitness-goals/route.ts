import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getFitnessGoals,
  createFitnessGoal,
  getActiveGoalsWithProgress,
} from '@/lib/repositories/fitness-goal-repository'

/**
 * GET /api/fitness-goals
 * Get fitness goals for the authenticated user
 * Query params:
 * - status: Filter by status (ACTIVE, COMPLETED, ABANDONED)
 * - withProgress: Include progress calculation (true/false)
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
    const status = searchParams.get('status')
    const withProgress = searchParams.get('withProgress') === 'true'

    let goals
    if (withProgress && (!status || status === 'ACTIVE')) {
      goals = await getActiveGoalsWithProgress(session.user.id)
    } else {
      goals = await getFitnessGoals(session.user.id, status || undefined)
    }

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching fitness goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fitness goals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/fitness-goals
 * Create a new fitness goal
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
    const { goalType, targetValue, currentValue, unit, deadline } = body

    // Validate required fields
    if (!goalType || !targetValue || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: goalType, targetValue, unit' },
        { status: 400 }
      )
    }

    // Validate goal type
    const validGoalTypes = [
      'WEIGHT_LOSS',
      'WEIGHT_GAIN',
      'EXERCISE_MINUTES',
      'STRENGTH',
      'ENDURANCE',
      'CUSTOM',
    ]
    if (!validGoalTypes.includes(goalType)) {
      return NextResponse.json(
        { error: 'Invalid goal type' },
        { status: 400 }
      )
    }

    // Validate target value
    if (typeof targetValue !== 'number' || targetValue <= 0) {
      return NextResponse.json(
        { error: 'Target value must be a positive number' },
        { status: 400 }
      )
    }

    // Validate current value if provided
    if (currentValue !== undefined && (typeof currentValue !== 'number' || currentValue < 0)) {
      return NextResponse.json(
        { error: 'Current value must be a non-negative number' },
        { status: 400 }
      )
    }

    const goal = await createFitnessGoal({
      userId: session.user.id,
      goalType,
      targetValue,
      currentValue,
      unit,
      deadline: deadline ? new Date(deadline) : undefined,
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating fitness goal:', error)
    return NextResponse.json(
      { error: 'Failed to create fitness goal' },
      { status: 500 }
    )
  }
}
