import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getDomainStats } from '@/lib/repositories/analytics-repository'

const ALLOWED_DAYS = new Set([7, 30, 90])

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requested = Number(new URL(request.url).searchParams.get('days') ?? 30)
    const days = ALLOWED_DAYS.has(requested) ? requested : 30

    const domains = await getDomainStats(session.user.id, days)
    return NextResponse.json({ domains, period: { days } })
  } catch (error) {
    console.error('Error fetching domain stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain stats' },
      { status: 500 }
    )
  }
}
