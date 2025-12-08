import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { generateWeeklyReport, generateMonthlyReport } from '@/lib/repositories/analytics-repository'

/**
 * GET /api/analytics/reports
 * Get weekly or monthly summary reports
 * Query params: type (weekly|monthly)
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
    const type = searchParams.get('type') || 'weekly'

    if (type !== 'weekly' && type !== 'monthly') {
      return NextResponse.json(
        { error: 'Type parameter must be "weekly" or "monthly"' },
        { status: 400 }
      )
    }

    let report
    if (type === 'weekly') {
      report = await generateWeeklyReport(session.user.id)
    } else {
      report = await generateMonthlyReport(session.user.id)
    }

    if (!report) {
      return NextResponse.json(
        { error: 'No data available for report generation' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      type,
      report,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
