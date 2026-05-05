'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Heart,
  Wallet,
  Activity,
  Apple,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DomainStats {
  tasks: {
    total: number
    completed: number
    inProgress: number
    todo: number
    overdueCount: number
    completionRate: number
    byWorkspace: Record<string, number>
  }
  habits: {
    activeHabits: number
    bestStreak: number
    averageCompletionRate: number
    topHabit: { name: string; streak: number } | null
  }
  finance: {
    income: number
    expenses: number
    balance: number
    savingsRate: number
    topExpenseCategory: { name: string; amount: number } | null
  }
  fitness: {
    totalMinutes: number
    sessionCount: number
    averageIntensity: string
    mostCommonActivity: string
    latestWeight: number | null
  }
  nutrition: {
    daysWithNutritionTracked: number
    daysWithWaterGoalMet: number
    totalDays: number
  }
  learning: {
    total: number
    completed: number
    inProgress: number
    minutesInvested: number
    completionRate: number
  }
}

interface DomainStatsGridProps {
  days: number
}

const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function DomainStatsGrid({ days }: DomainStatsGridProps) {
  const [stats, setStats] = useState<DomainStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/analytics/domains?days=${days}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setStats(data.domains)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [days])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bento-card h-44 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bento-card p-6 text-center text-sm text-muted-foreground">
        Couldn&apos;t load domain stats. Try refreshing.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DomainCard
        icon={CheckCircle2}
        title="Tasks"
        tint="text-chart-1"
        primary={`${Math.round(stats.tasks.completionRate)}%`}
        primaryLabel="completion rate"
        rows={[
          { label: 'Completed', value: stats.tasks.completed },
          { label: 'In progress', value: stats.tasks.inProgress },
          { label: 'Overdue', value: stats.tasks.overdueCount, accent: stats.tasks.overdueCount > 0 ? 'warn' : undefined },
        ]}
      />

      <DomainCard
        icon={Heart}
        title="Habits"
        tint="text-chart-3"
        primary={`${stats.habits.bestStreak}d`}
        primaryLabel="best streak"
        rows={[
          { label: 'Active habits', value: stats.habits.activeHabits },
          { label: 'Avg completion', value: `${Math.round(stats.habits.averageCompletionRate)}%` },
          {
            label: 'Top habit',
            value: stats.habits.topHabit ? stats.habits.topHabit.name : '—',
          },
        ]}
      />

      <DomainCard
        icon={Wallet}
        title="Finance"
        tint="text-success"
        primary={formatCurrency(stats.finance.balance)}
        primaryLabel="net for period"
        rows={[
          { label: 'Income', value: formatCurrency(stats.finance.income) },
          { label: 'Expenses', value: formatCurrency(stats.finance.expenses) },
          {
            label: 'Top category',
            value: stats.finance.topExpenseCategory
              ? `${stats.finance.topExpenseCategory.name} · ${formatCurrency(stats.finance.topExpenseCategory.amount)}`
              : '—',
          },
        ]}
      />

      <DomainCard
        icon={Activity}
        title="Fitness"
        tint="text-chart-4"
        primary={`${stats.fitness.totalMinutes} min`}
        primaryLabel={`${stats.fitness.sessionCount} session${stats.fitness.sessionCount === 1 ? '' : 's'}`}
        rows={[
          { label: 'Avg intensity', value: stats.fitness.averageIntensity },
          { label: 'Top activity', value: stats.fitness.mostCommonActivity },
          {
            label: 'Latest weight',
            value: stats.fitness.latestWeight !== null ? `${stats.fitness.latestWeight} kg` : '—',
          },
        ]}
      />

      <DomainCard
        icon={Apple}
        title="Nutrition"
        tint="text-pink-500 dark:text-pink-400"
        primary={`${stats.nutrition.daysWithNutritionTracked}/${stats.nutrition.totalDays}`}
        primaryLabel="days tracked"
        rows={[
          {
            label: 'Water goal met',
            value: `${stats.nutrition.daysWithWaterGoalMet}/${stats.nutrition.totalDays} days`,
          },
          {
            label: 'Tracking rate',
            value:
              stats.nutrition.totalDays > 0
                ? `${Math.round((stats.nutrition.daysWithNutritionTracked / stats.nutrition.totalDays) * 100)}%`
                : '—',
          },
        ]}
      />

      <DomainCard
        icon={GraduationCap}
        title="Learning"
        tint="text-chart-2"
        primary={`${stats.learning.minutesInvested} min`}
        primaryLabel="time invested"
        rows={[
          { label: 'In progress', value: stats.learning.inProgress },
          { label: 'Completed', value: stats.learning.completed },
          { label: 'Completion rate', value: `${Math.round(stats.learning.completionRate)}%` },
        ]}
      />
    </div>
  )
}

interface DomainCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  tint: string
  primary: string
  primaryLabel: string
  rows: Array<{
    label: string
    value: string | number
    accent?: 'warn' | 'success'
  }>
}

function DomainCard({ icon: Icon, title, tint, primary, primaryLabel, rows }: DomainCardProps) {
  return (
    <div className="bento-card flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', tint)} strokeWidth={1.75} aria-hidden="true" />
        <h3 className="text-sm font-medium tracking-tight text-muted-foreground">{title}</h3>
      </div>

      <div>
        <p
          className="font-mono text-3xl font-semibold tabular-nums text-foreground sm:text-4xl"
          data-numeric
        >
          {primary}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{primaryLabel}</p>
      </div>

      <dl className="space-y-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd
              className={cn(
                'truncate text-right font-medium text-foreground',
                row.accent === 'warn' && 'text-warning',
                row.accent === 'success' && 'text-success'
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
