import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getAchievements, createAchievement } from '@/lib/repositories/analytics-repository'

/**
 * GET /api/achievements
 * Get user achievements
 * Query params: limit (optional)
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
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    const achievements = await getAchievements(session.user.id, limit)

    return NextResponse.json({
      achievements,
      total: achievements.length,
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/achievements
 * Create a new achievement (typically called by system)
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
    const { type, title, description, category } = body

    // Validate required fields
    if (!type || !title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, description, category' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['PRODUCTIVITY', 'WELLNESS', 'GROWTH', 'FINANCIAL']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: ' + validCategories.join(', ') },
        { status: 400 }
      )
    }

    const achievement = await createAchievement(
      session.user.id,
      type,
      title,
      description,
      category
    )

    return NextResponse.json(achievement, { status: 201 })
  } catch (error) {
    console.error('Error creating achievement:', error)
    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    )
  }
}
