import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getHabitById,
  updateHabit,
  deleteHabit,
} from '@/lib/repositories/habit-repository'

/**
 * GET /api/habits/[id]
 * Get a single habit by ID
 */
export async function GET(
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

    const { id } = await params
    const habit = await getHabitById(id, session.user.id)

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Error fetching habit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/habits/[id]
 * Update a habit
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

    const { id } = await params
    const body = await request.json()
    const { name, category, frequency } = body

    // Validate category if provided
    if (category) {
      const validCategories = [
        'PROFESSIONAL_DEVELOPMENT',
        'HEALTH',
        'PRODUCTIVITY',
        'PERSONAL_GROWTH',
      ]
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    // Validate frequency if provided
    if (frequency) {
      const validFrequencies = ['DAILY', 'WEEKLY', 'CUSTOM']
      if (!validFrequencies.includes(frequency)) {
        return NextResponse.json(
          { error: 'Invalid frequency' },
          { status: 400 }
        )
      }
    }

    const habit = await updateHabit(id, session.user.id, {
      name,
      category,
      frequency,
    })

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/habits/[id]
 * Delete a habit
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

    const { id } = await params

    await deleteHabit(id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    )
  }
}
