'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2,
  Heart,
  GraduationCap,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrendCharts } from '@/components/analytics/trend-charts'
import { InsightPanel } from '@/components/analytics/insight-panel'
import { ReportGenerator } from '@/components/analytics/report-generator'
import { AchievementDisplay } from '@/components/analytics/achievement-display'
import { DomainStatsGrid } from '@/components/analytics/domain-stats-grid'
import { CorrelationPanel } from '@/components/analytics/correlation-panel'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type Period = 7 | 30 | 90

interface TrendPoint {
  date: string
  productivityScore: number
  wellnessScore: number
  growthScore: number
  overallScore: number
}

interface Insight {
  type: 'POSITIVE' | 'NEUTRAL' | 'IMPROVEMENT'
  category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'OVERALL'
  title: string
  description: string
  metric?: number
}

interface OverviewData {
  period: { days: number; start: string; end: string }
  currentScores: {
    productivityScore: number
    wellnessScore: number
    growthScore: number
    overallScore: number
  }
  today: {
    tasksCompleted: number
    habitsCompleted: number
    exerciseMinutes: number
    learningMinutes: number
  }
  periodAverages: {
    productivity: number
    wellness: number
    growth: number
    overall: number
  }
  periodTotals: {
    tasksCompleted: number
    habitsCompleted: number
    exerciseMinutes: number
    learningMinutes: number
  }
  daysWithData: number
}

interface Achievement {
  id: string
  type: string
  title: string
  description: string
  unlockedAt: Date
  category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'FINANCIAL'
}

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const { toast } = useToast()
  const reduce = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [overviewRes, trendsRes, insightsRes, achievementsRes] = await Promise.all([
          fetch(`/api/analytics/overview?days=${period}`),
          fetch(`/api/analytics/trends?days=${period}`),
          fetch('/api/analytics/insights'),
          fetch('/api/achievements'),
        ])

        if (!cancelled && overviewRes.ok) {
          setOverview(await overviewRes.json())
        }
        if (!cancelled && trendsRes.ok) {
          const json = await trendsRes.json()
          setTrends(json.trends ?? [])
        }
        if (!cancelled && insightsRes.ok) {
          const json = await insightsRes.json()
          setInsights(json.insights ?? [])
        }
        if (!cancelled && achievementsRes.ok) {
          const json = await achievementsRes.json()
          setAchievements(json.achievements ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        if (!cancelled) {
          toast({
            title: 'Error',
            description: 'Failed to load analytics data',
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [period, toast])

  const handleGenerateReport = async (type: 'weekly' | 'monthly') => {
    const res = await fetch(`/api/analytics/reports?type=${type}`)
    if (!res.ok) throw new Error('Report generation failed')
    const data = await res.json()
    if (!data.report) return null
    return { type, ...data.report }
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Insights and trends across your productivity, wellness, and growth.
          </p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* HERO — Today's snapshot vs period average */}
      <Hero overview={overview} loading={loading} period={period} />

      {/* TRENDS */}
      <Section title="Trends" subtitle={`Score history over ${period} days`}>
        <TrendCharts data={trends} isLoading={loading} />
      </Section>

      {/* PER-DOMAIN */}
      <Section title="By domain" subtitle="Where things stand in each area">
        <DomainStatsGrid days={period} />
      </Section>

      {/* CORRELATIONS */}
      <Section
        title="Cross-domain patterns"
        subtitle="What lifts your scores and what doesn't"
      >
        <CorrelationPanel days={period} />
      </Section>

      {/* INSIGHTS + ACHIEVEMENTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Insights" subtitle="What we noticed this week">
          <InsightPanel insights={insights} isLoading={loading} />
        </Section>
        <Section title="Recent achievements" subtitle="Your latest milestones">
          {loading ? (
            <Skeleton className="h-48 rounded-[var(--card-radius)]" />
          ) : (
            <AchievementDisplay
              achievements={achievements}
              limit={4}
              onViewAll={() => setAchievementsOpen(true)}
            />
          )}
        </Section>
      </div>

      {/* REPORTS BUTTON */}
      <div className="flex justify-center pt-2">
        <Button onClick={() => setReportOpen(true)} variant="outline">
          <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Generate weekly or monthly report
        </Button>
      </div>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Periodic report</DialogTitle>
          </DialogHeader>
          <ReportGenerator onGenerate={handleGenerateReport} />
        </DialogContent>
      </Dialog>

      {/* Full achievements dialog */}
      <Dialog open={achievementsOpen} onOpenChange={setAchievementsOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All achievements</DialogTitle>
          </DialogHeader>
          <AchievementDisplay achievements={achievements} />
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period
  onChange: (v: Period) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Period"
      className="inline-flex rounded-lg bg-muted p-0.5"
    >
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
            value === opt.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Hero({
  overview,
  loading,
  period,
}: {
  overview: OverviewData | null
  loading: boolean
  period: Period
}) {
  if (loading || !overview) {
    return <Skeleton className="h-56 rounded-[var(--card-radius)]" />
  }

  const overall = Math.round(overview.currentScores.overallScore)
  const periodAvg = overview.periodAverages.overall
  const delta = overall - periodAvg
  const deltaRounded = Math.round(delta * 10) / 10
  const direction =
    Math.abs(delta) < 1 ? 'neutral' : delta > 0 ? 'up' : 'down'
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  const trendTint =
    direction === 'up'
      ? 'text-success'
      : direction === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground'

  return (
    <div className="bento-card bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr] lg:gap-8">
        {/* Overall score */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Overall score · today
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-mono text-6xl font-semibold tabular-nums text-foreground sm:text-7xl"
              data-numeric
            >
              {overall}
            </span>
            <span className="text-base text-muted-foreground">/ 100</span>
          </div>
          <div className={cn('mt-3 inline-flex items-center gap-1.5 text-sm font-medium', trendTint)}>
            <TrendIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {deltaRounded > 0 ? '+' : ''}
            {deltaRounded} vs {period}d avg ({Math.round(periodAvg)})
          </div>
          {overview.daysWithData < period && (
            <p className="mt-2 text-xs text-muted-foreground">
              Based on {overview.daysWithData} of {period} days with data.
            </p>
          )}
        </div>

        {/* Sub-scores + today counts */}
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <SubScore
              label="Productivity"
              value={Math.round(overview.currentScores.productivityScore)}
              tint="text-chart-1"
            />
            <SubScore
              label="Wellness"
              value={Math.round(overview.currentScores.wellnessScore)}
              tint="text-chart-3"
            />
            <SubScore
              label="Growth"
              value={Math.round(overview.currentScores.growthScore)}
              tint="text-chart-2"
            />
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Today&apos;s activity
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ActivityTile
                icon={CheckCircle2}
                label="Tasks"
                value={overview.today.tasksCompleted}
                tint="text-chart-1"
              />
              <ActivityTile
                icon={Heart}
                label="Habits"
                value={overview.today.habitsCompleted}
                tint="text-chart-3"
              />
              <ActivityTile
                icon={Activity}
                label="Exercise"
                value={`${overview.today.exerciseMinutes}m`}
                tint="text-chart-4"
              />
              <ActivityTile
                icon={GraduationCap}
                label="Learning"
                value={`${overview.today.learningMinutes}m`}
                tint="text-chart-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubScore({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn('mt-1 font-mono text-2xl font-semibold tabular-nums', tint)}
        data-numeric
      >
        {value}
      </p>
    </div>
  )
}

function ActivityTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  value: string | number
  tint: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3">
      <Icon className={cn('h-4 w-4 shrink-0', tint)} strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className="font-mono text-base font-semibold tabular-nums text-foreground"
          data-numeric
        >
          {value}
        </p>
      </div>
    </div>
  )
}
