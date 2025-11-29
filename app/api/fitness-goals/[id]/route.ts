import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getFitnessGoalById,
  updateFitnessGoal,
  deleteFitnessGoal,
} from '@/lib/repositories/fitness-goal-repository'

/**
 * PATCH /api/fitness-goals/[id]
 * Update a fitness goal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: goalId } = await params
    const body = await request.json()

    // Check if goal exists and belongs to user
    const existingGoal = await getFitnessGoalById(goalId, session.user.id)
    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Fitness goal not found' },
        { status: 404 }
      )
    }

    // Validate goal type if provided
    if (body.goalType) {
      const validGoalTypes = [
        'WEIGHT_LOSS',
        'WEIGHT_GAIN',
        'EXERCISE_MINUTES',
        'STRENGTH',
        'ENDURANCE',
        'CUSTOM',
      ]
      if (!validGoalTypes.includes(body.goalType)) {
        return NextResponse.json(
          { error: 'Invalid goal type' },
          { status: 400 }
        )
      }
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['ACTIVE', 'COMPLETED', 'ABANDONED']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
    }

    // Validate target value if provided
    if (body.targetValue !== undefined && (typeof body.targetValue !== 'number' || body.targetValue <= 0)) {
      return NextResponse.json(
        { error: 'Target value must be a positive number' },
        { status: 400 }
      )
    }

    // Validate current value if provided
    if (body.currentValue !== undefined && (typeof body.currentValue !== 'number' || body.currentValue < 0)) {
      return NextResponse.json(
        { error: 'Current value must be a non-negative number' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (body.goalType) updateData.goalType = body.goalType
    if (body.targetValue !== undefined) updateData.targetValue = body.targetValue
    if (body.currentValue !== undefined) updateData.currentValue = body.currentValue
    if (body.unit) updateData.unit = body.unit
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null
    if (body.status) updateData.status = body.status

    const goal = await updateFitnessGoal(goalId, session.user.id, updateData)

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error updating fitness goal:', error)
    return NextResponse.json(
      { error: 'Failed to update fitness goal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/fitness-goals/[id]
 * Delete a fitness goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: goalId } = await params

    // Check if goal exists and belongs to user
    const existingGoal = await getFitnessGoalById(goalId, session.user.id)
    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Fitness goal not found' },
        { status: 404 }
      )
    }

    await deleteFitnessGoal(goalId, session.user.id)

    return NextResponse.json({ message: 'Fitness goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting fitness goal:', error)
    return NextResponse.json(
      { error: 'Failed to delete fitness goal' },
      { status: 500 }
    )
  }
}
