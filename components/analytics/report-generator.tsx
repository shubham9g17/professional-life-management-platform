'use client'

import { useState } from 'react'
import { FileText, Download, Loader2, Trophy, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ReportData {
  type: 'weekly' | 'monthly'
  period: {
    start: Date
    end: Date
  }
  totals: {
    tasksCompleted: number
    tasksOnTime: number
    habitsCompleted: number
    exerciseMinutes: number
    learningMinutes: number
    daysWithCaloriesTracked: number
    daysWithWaterGoalMet: number
  }
  averages: {
    productivityScore: number
    wellnessScore: number
    growthScore: number
  }
  achievementsUnlocked?: number
  daysTracked: number
}

interface ReportGeneratorProps {
  onGenerate: (type: 'weekly' | 'monthly') => Promise<ReportData | null>
}

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export function ReportGenerator({ onGenerate }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly')
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await onGenerate(reportType)
      setReport(data)
    } catch (err) {
      setError('Failed to generate report. Please try again.')
      console.error('Report generation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bento-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              Generate report
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Compile a periodic summary of your scores and activity.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            aria-label="Report period"
            className="inline-flex rounded-lg bg-muted p-0.5"
          >
            {(['weekly', 'monthly'] as const).map((value) => (
              <button
                key={value}
                role="radio"
                aria-checked={reportType === value}
                onClick={() => setReportType(value)}
                className={cn(
                  'relative rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                  reportType === value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {value}
              </button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                Generating
              </>
            ) : (
              'Generate report'
            )}
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            {error}
          </div>
        )}
      </div>

      {report && (
        <div className="bento-card space-y-6 p-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {report.type === 'weekly' ? 'Weekly' : 'Monthly'} performance report
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(report.period.start)} — {formatDate(report.period.end)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{report.daysTracked} days tracked</p>
          </div>

          <section>
            <h3 className="mb-3 text-base font-semibold text-foreground">Average scores</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ScoreTile label="Productivity" value={report.averages.productivityScore} tint="chart-1" />
              <ScoreTile label="Wellness" value={report.averages.wellnessScore} tint="chart-3" />
              <ScoreTile label="Growth" value={report.averages.growthScore} tint="chart-2" />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-base font-semibold text-foreground">Activity summary</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryTile
                label="Tasks completed"
                value={report.totals.tasksCompleted}
                hint={`${report.totals.tasksOnTime} on time`}
              />
              <SummaryTile label="Habits completed" value={report.totals.habitsCompleted} />
              <SummaryTile label="Exercise time" value={formatMinutes(report.totals.exerciseMinutes)} />
              <SummaryTile label="Learning time" value={formatMinutes(report.totals.learningMinutes)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-base font-semibold text-foreground">Wellness tracking</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryTile
                label="Days with nutrition tracked"
                value={report.totals.daysWithCaloriesTracked}
                hint={`${pct(report.totals.daysWithCaloriesTracked, report.daysTracked)}% of days`}
              />
              <SummaryTile
                label="Days with water goal met"
                value={report.totals.daysWithWaterGoalMet}
                hint={`${pct(report.totals.daysWithWaterGoalMet, report.daysTracked)}% of days`}
              />
            </div>
          </section>

          {report.achievementsUnlocked !== undefined && (
            <section>
              <h3 className="mb-3 text-base font-semibold text-foreground">Achievements</h3>
              <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <Trophy className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Unlocked</p>
                  <p className="font-mono text-2xl font-semibold tabular-nums text-foreground" data-numeric>
                    {report.achievementsUnlocked}
                  </p>
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <a
              href={`/api/analytics/reports/export?type=${report.type}`}
              download
              rel="noopener"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Export CSV
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

function ScoreTile({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-muted/30 p-4')}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className="mt-1 font-mono text-3xl font-semibold tabular-nums"
        style={{ color: `rgb(var(--${tint}))` }}
        data-numeric
      >
        {Math.round(value)}
      </p>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground" data-numeric>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
