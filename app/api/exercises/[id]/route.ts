import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getExerciseById,
  updateExercise,
  deleteExercise,
} from '@/lib/repositories/exercise-repository'

/**
 * PATCH /api/exercises/[id]
 * Update an exercise log
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

    const { id: exerciseId } = await params
    const body = await request.json()

    // Check if exercise exists and belongs to user
    const existingExercise = await getExerciseById(exerciseId, session.user.id)
    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Validate intensity if provided
    if (body.intensity) {
      const validIntensities = ['LOW', 'MODERATE', 'HIGH', 'INTENSE']
      if (!validIntensities.includes(body.intensity)) {
        return NextResponse.json(
          { error: 'Invalid intensity. Must be LOW, MODERATE, HIGH, or INTENSE' },
          { status: 400 }
        )
      }
    }

    // Validate duration if provided
    if (body.duration !== undefined && (typeof body.duration !== 'number' || body.duration <= 0)) {
      return NextResponse.json(
        { error: 'Duration must be a positive number' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (body.activityType) updateData.activityType = body.activityType
    if (body.duration) updateData.duration = body.duration
    if (body.intensity) updateData.intensity = body.intensity
    if (body.caloriesBurned !== undefined) updateData.caloriesBurned = body.caloriesBurned
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.date) updateData.date = new Date(body.date)

    const exercise = await updateExercise(exerciseId, session.user.id, updateData)

    return NextResponse.json({ exercise })
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/exercises/[id]
 * Delete an exercise log
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

    const { id: exerciseId } = await params

    // Check if exercise exists and belongs to user
    const existingExercise = await getExerciseById(exerciseId, session.user.id)
    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    await deleteExercise(exerciseId, session.user.id)

    return NextResponse.json({ message: 'Exercise deleted successfully' })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    )
  }
}
