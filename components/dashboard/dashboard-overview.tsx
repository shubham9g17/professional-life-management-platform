'use client'

import { useEffect, useState } from 'react'
import { ProductivityWidget } from './productivity-widget'
import { WellnessWidget } from './wellness-widget'
import { GrowthWidget } from './growth-widget'
import { FinancialWidget } from './financial-widget'
import { QuickActionsWidget } from './quick-actions-widget'
import { ActivityFeedWidget } from './activity-feed-widget'

interface DashboardData {
  scores: {
    productivity: number
    wellness: number
    growth: number
    overall: number
  }
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

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadDashboardData()

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadDashboardData(true)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true)
    }
    setError(null)

    try {
      const response = await fetch('/api/dashboard/overview', {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

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
      <div className="p-12 text-center bg-card border border-border rounded-lg">
        <svg
          className="w-12 h-12 mx-auto text-red-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-foreground mb-4">{error}</p>
        <button
          onClick={() => loadDashboardData()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-card border border-border rounded-lg animate-pulse" />
          <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => loadDashboardData()}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Refresh dashboard"
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Main widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProductivityWidget
          tasksCompleted={data.productivity.tasksCompleted}
          tasksTotal={data.productivity.tasksTotal}
          tasksOnTime={data.productivity.tasksOnTime}
          productivityScore={data.scores.productivity}
        />
        <WellnessWidget
          habitsCompleted={data.wellness.habitsCompleted}
          habitsTotal={data.wellness.habitsTotal}
          exerciseMinutes={data.wellness.exerciseMinutes}
          waterGoalMet={data.wellness.waterGoalMet}
          wellnessScore={data.scores.wellness}
        />
        <GrowthWidget
          learningMinutes={data.growth.learningMinutes}
          resourcesInProgress={data.growth.resourcesInProgress}
          resourcesCompleted={data.growth.resourcesCompleted}
          growthScore={data.scores.growth}
        />
        <FinancialWidget
          currentBalance={data.financial.currentBalance}
          monthlyIncome={data.financial.monthlyIncome}
          monthlyExpenses={data.financial.monthlyExpenses}
          savingsRate={data.financial.savingsRate}
        />
      </div>

      {/* Secondary widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeedWidget activities={data.activities} />
        </div>
        <div>
          <QuickActionsWidget />
        </div>
      </div>
    </div>
  )
}
