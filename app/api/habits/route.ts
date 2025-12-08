import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getHabitsWithCompletions,
  createHabit,
  getHabitsByCategory,
} from '@/lib/repositories/habit-repository'

/**
 * GET /api/habits
 * Get all habits for the authenticated user with completion data
 * Optional query params:
 * - category: Filter by category
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
    const category = searchParams.get('category')

    let habits
    if (category) {
      habits = await getHabitsByCategory(session.user.id, category)
    } else {
      habits = await getHabitsWithCompletions(session.user.id)
    }

    return NextResponse.json({ habits })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/habits
 * Create a new habit with category
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
    const { name, category, frequency } = body

    // Validate required fields
    if (!name || !category || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, frequency' },
        { status: 400 }
      )
    }

    // Validate category
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

    // Validate frequency
    const validFrequencies = ['DAILY', 'WEEKLY', 'CUSTOM']
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      )
    }

    const habit = await createHabit({
      userId: session.user.id,
      name,
      category,
      frequency,
    })

    return NextResponse.json({ habit }, { status: 201 })
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    )
  }
}
