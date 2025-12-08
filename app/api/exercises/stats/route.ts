import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getExerciseStats } from '@/lib/repositories/exercise-repository'

/**
 * GET /api/exercises/stats
 * Get exercise statistics for the authenticated user
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

    const stats = await getExerciseStats(
      session.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching exercise stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise stats' },
      { status: 500 }
    )
  }
}
