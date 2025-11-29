import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { completeHabit } from '@/lib/repositories/habit-repository'

/**
 * POST /api/habits/[id]/complete
 * Mark a habit as completed and update streak
 */
export async function POST(
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
    const { notes } = body

    const habit = await completeHabit(id, session.user.id, notes)

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Error completing habit:', error)
    
    if (error instanceof Error && error.message === 'Habit not found') {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to complete habit' },
      { status: 500 }
    )
  }
}
