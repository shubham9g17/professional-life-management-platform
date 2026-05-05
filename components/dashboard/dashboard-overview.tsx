'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Heart,
  Wallet,
  Activity,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  BentoCard,
  BentoCardBody,
  BentoCardHeader,
  BentoCardTitle,
  BentoGrid,
} from './bento-card'
import { SparkArea } from './spark-area'
import { ActivityFeedWidget } from './activity-feed-widget'
import { QuickActionsWidget } from './quick-actions-widget'

interface DashboardData {
  productivity: {
    tasksCompleted: number
    tasksTotal: number
    tasksOnTime: number
  }
  wellness: {
    habitsCompleted: number
    habitsTotal: number
    exerciseMinutes: number
    waterGoalMet: boolean
  }
  growth: {
    learningMinutes: number
    resourcesInProgress: number
    resourcesCompleted: number
  }
  financial: {
    currentBalance: number
    monthlyIncome: number
    monthlyExpenses: number
    savingsRate: number
  }
  activities: Array<{
    id: string
    type: 'TASK' | 'HABIT' | 'EXERCISE' | 'MEAL' | 'TRANSACTION' | 'LEARNING'
    title: string
    description: string
    timestamp: Date
    category?: string
  }>
}

const seededSpark = (base: number) =>
  Array.from({ length: 7 }, (_, i) => ({
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    value: Math.max(
      0,
      Math.round(base + Math.sin(i * 0.9 + base / 17) * (base * 0.18) + (i - 3) * 1.2)
    ),
  }))

const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const reduce = useReducedMotion()

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(() => loadDashboardData(true), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/overview', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      const dashboardData = await response.json()
      setData(dashboardData)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="bento-card flex flex-col items-center gap-4 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-foreground">{error}</p>
        <Button onClick={() => loadDashboardData()}>
          <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading || !data) {
    return <DashboardSkeleton />
  }

  const greeting = greetingFor(new Date().getHours())
  const completionPct =
    data.productivity.tasksTotal > 0
      ? Math.round((data.productivity.tasksCompleted / data.productivity.tasksTotal) * 100)
      : 0
  const habitPct =
    data.wellness.habitsTotal > 0
      ? Math.round((data.wellness.habitsCompleted / data.wellness.habitsTotal) * 100)
      : 0
  const cashflow = data.financial.monthlyIncome - data.financial.monthlyExpenses
  const cashflowPositive = cashflow >= 0

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => loadDashboardData()}
          aria-label="Refresh dashboard"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>

      <BentoGrid>
        {/* Hero — Cashflow */}
        <BentoCard
          span="2x2"
          index={0}
          className="bg-gradient-to-br from-primary/15 via-card to-card"
        >
          <BentoCardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              <BentoCardTitle className="text-primary">Cashflow</BentoCardTitle>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                cashflowPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {cashflowPositive ? (
                <TrendingUp className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              )}
              {data.financial.savingsRate.toFixed(0)}%
            </span>
          </BentoCardHeader>
          <BentoCardBody className="flex flex-col justify-between gap-4">
            <div>
              <p
                className="font-mono text-5xl font-semibold tracking-tight text-foreground tabular-nums sm:text-6xl"
                data-numeric
              >
                {formatCurrency(data.financial.currentBalance)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatCurrency(cashflow)} this month
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricSlice
                icon={TrendingUp}
                label="Income"
                value={formatCurrency(data.financial.monthlyIncome)}
                tint="text-success"
              />
              <MetricSlice
                icon={TrendingDown}
                label="Expenses"
                value={formatCurrency(data.financial.monthlyExpenses)}
                tint="text-destructive"
              />
              <MetricSlice
                icon={Wallet}
                label="Savings"
                value={`${data.financial.savingsRate.toFixed(0)}%`}
                tint="text-primary"
              />
            </div>
          </BentoCardBody>
        </BentoCard>

        {/* Productivity KPI */}
        <KpiCard
          index={1}
          icon={CheckCircle2}
          label="Tasks today"
          value={`${data.productivity.tasksCompleted}/${data.productivity.tasksTotal}`}
          delta={`${completionPct}% complete`}
          deltaPositive={completionPct >= 60}
          spark={seededSpark(data.productivity.tasksCompleted + 4)}
          color="rgb(var(--chart-1))"
        />

        {/* Habits KPI */}
        <KpiCard
          index={2}
          icon={Heart}
          label="Habits"
          value={`${habitPct}%`}
          delta={
            data.wellness.habitsTotal > 0
              ? `${data.wellness.habitsCompleted} of ${data.wellness.habitsTotal} done`
              : 'No habits yet'
          }
          deltaPositive={habitPct >= 80}
          spark={seededSpark(data.wellness.habitsCompleted + 6)}
          color="rgb(var(--chart-3))"
        />

        {/* Exercise KPI */}
        <KpiCard
          index={3}
          icon={Activity}
          label="Exercise"
          value={`${data.wellness.exerciseMinutes} min`}
          delta={
            data.wellness.exerciseMinutes >= 30
              ? 'Daily goal hit'
              : data.wellness.exerciseMinutes > 0
                ? `${30 - data.wellness.exerciseMinutes} min to goal`
                : 'No activity yet'
          }
          deltaPositive={data.wellness.exerciseMinutes >= 30}
          spark={seededSpark(data.wellness.exerciseMinutes + 3)}
          color="rgb(var(--chart-4))"
        />

        {/* Learning KPI */}
        <KpiCard
          index={4}
          icon={GraduationCap}
          label="Learning"
          value={`${data.growth.learningMinutes} min`}
          delta={
            data.growth.resourcesInProgress > 0
              ? `${data.growth.resourcesInProgress} in progress`
              : data.growth.resourcesCompleted > 0
                ? `${data.growth.resourcesCompleted} completed`
                : 'No resources yet'
          }
          deltaPositive={data.growth.learningMinutes > 0}
          spark={seededSpark(data.growth.learningMinutes + 2)}
          color="rgb(var(--chart-2))"
        />

        {/* Activity feed (3x1) */}
        <BentoCard span="3x1" index={5} className="p-0">
          <ActivityFeedWidget activities={data.activities} />
        </BentoCard>

        {/* Quick actions */}
        <BentoCard span="1x1" index={6} className="p-0 sm:col-span-2 lg:col-span-1">
          <QuickActionsWidget />
        </BentoCard>
      </BentoGrid>
    </motion.div>
  )
}

function greetingFor(hour: number): string {
  if (hour < 5) return 'Still up?'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Winding down'
}

function MetricSlice({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  value: string
  tint: string
}) {
  return (
    <div className="rounded-lg bg-background/50 p-2.5 ring-1 ring-border/60">
      <Icon className={cn('mb-1.5 h-4 w-4', tint)} strokeWidth={1.75} aria-hidden="true" />
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-mono text-base font-semibold tabular-nums text-foreground sm:text-lg" data-numeric>
        {value}
      </p>
    </div>
  )
}

interface KpiCardProps {
  index: number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  value: string
  delta: string
  deltaPositive: boolean
  spark: Array<{ value: number; label?: string }>
  color: string
}

function KpiCard({ index, icon: Icon, label, value, delta, deltaPositive, spark, color }: KpiCardProps) {
  return (
    <BentoCard span="1x1" index={index}>
      <BentoCardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          <BentoCardTitle>{label}</BentoCardTitle>
        </div>
      </BentoCardHeader>
      <BentoCardBody className="flex flex-col justify-between gap-2 pb-3">
        <p
          className="font-mono text-3xl font-semibold tabular-nums text-foreground"
          data-numeric
        >
          {value}
        </p>
        <p
          className={cn(
            'text-xs',
            deltaPositive ? 'text-success' : 'text-muted-foreground'
          )}
        >
          {delta}
        </p>
        <SparkArea data={spark} color={color} height={36} />
      </BentoCardBody>
    </BentoCard>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header — mirrors the greeting + refresh button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 sm:h-9 sm:w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>

      <BentoGrid>
        {/* Hero — Cashflow (2x2) */}
        <div className="bento-card col-span-1 row-span-2 flex flex-col gap-5 p-6 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-12 w-48 sm:h-14 sm:w-56" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="mt-auto grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* 4 KPI tiles (1x1 each) */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bento-card col-span-1 row-span-1 flex flex-col gap-3 p-5"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-auto h-9 w-full rounded-sm" />
          </div>
        ))}

        {/* Activity feed (3x1) */}
        <div className="bento-card col-span-1 row-span-1 space-y-3 p-5 sm:col-span-2 lg:col-span-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4 max-w-xs" />
                <Skeleton className="h-3 w-1/2 max-w-[10rem]" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>

        {/* Quick actions (1x1, expands to 2 cols on sm) */}
        <div className="bento-card col-span-1 row-span-1 space-y-3 p-5 sm:col-span-2 lg:col-span-1">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        </div>
      </BentoGrid>
    </div>
  )
}
