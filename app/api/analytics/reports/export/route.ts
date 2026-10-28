import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  generateWeeklyReport,
  generateMonthlyReport,
} from '@/lib/repositories/analytics-repository'

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

type WeeklyReport = NonNullable<Awaited<ReturnType<typeof generateWeeklyReport>>>
type MonthlyReport = NonNullable<Awaited<ReturnType<typeof generateMonthlyReport>>>

function reportToCsv(
  type: 'weekly' | 'monthly',
  report: WeeklyReport | MonthlyReport
): string {
  const rows: Array<[string, string | number]> = [
    ['Report type', type],
    ['Period start', report.period.start.toISOString().slice(0, 10)],
    ['Period end', report.period.end.toISOString().slice(0, 10)],
    ['Days tracked', report.daysTracked],
    ['', ''],
    ['Productivity score (avg)', report.averages.productivityScore],
    ['Wellness score (avg)', report.averages.wellnessScore],
    ['Growth score (avg)', report.averages.growthScore],
    ['', ''],
    ['Tasks completed', report.totals.tasksCompleted],
    ['Tasks on time', report.totals.tasksOnTime],
    ['Habits completed', report.totals.habitsCompleted],
    ['Exercise minutes', report.totals.exerciseMinutes],
    ['Learning minutes', report.totals.learningMinutes],
    ['Days with calories tracked', report.totals.daysWithCaloriesTracked],
    ['Days with water goal met', report.totals.daysWithWaterGoalMet],
  ]

  if ('achievementsUnlocked' in report) {
    rows.push(['Achievements unlocked', report.achievementsUnlocked])
  }

  const header = ['Metric', 'Value']
  const csvLines = [header, ...rows].map((row) =>
    row.map(csvEscape).join(',')
  )
  return csvLines.join('\n') + '\n'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get('type') === 'monthly' ? 'monthly' : 'weekly'

    const report =
      type === 'monthly'
        ? await generateMonthlyReport(session.user.id)
        : await generateWeeklyReport(session.user.id)

    if (!report) {
      return NextResponse.json(
        { error: 'No data available to export' },
        { status: 404 }
      )
    }

    const csv = reportToCsv(type, report)
    const filename = `analytics-${type}-${report.period.end.toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}
