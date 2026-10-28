import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getOverviewStats } from '@/lib/repositories/analytics-repository'

const ALLOWED_DAYS = new Set([7, 30, 90])

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requested = Number(new URL(request.url).searchParams.get('days') ?? 7)
    const days = ALLOWED_DAYS.has(requested) ? requested : 7

    const overview = await getOverviewStats(session.user.id, days)
    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error fetching analytics overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}
