'use client'

import { useEffect, useState } from 'react'
import { MetricCardsGrid } from './metric-cards'
import { TrendCharts } from './trend-charts'
import { InsightPanel } from './insight-panel'
import { ReportGenerator } from './report-generator'
import { AchievementDisplay } from './achievement-display'

interface OverviewData {
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
  weeklyAverages: {
    productivity: number
    wellness: number
    growth: number
  }
  monthlyTotals: {
    tasksCompleted: number
    habitsCompleted: number
    exerciseMinutes: number
    learningMinutes: number
  }
}

interface TrendData {
  date: Date
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

interface Achievement {
  id: string
  type: string
  title: string
  description: string
  unlockedAt: Date
  category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'FINANCIAL'
}

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch all analytics data in parallel
      const [overviewRes, trendsRes, insightsRes, achievementsRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/analytics/trends?days=30'),
        fetch('/api/analytics/insights'),
        fetch('/api/achievements?limit=5'),
      ])

      if (!overviewRes.ok || !trendsRes.ok || !insightsRes.ok || !achievementsRes.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const [overviewData, trendsData, insightsData, achievementsData] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        insightsRes.json(),
        achievementsRes.json(),
      ])

      setOverview(overviewData)
      setTrends(trendsData.trends || [])
      setInsights(insightsData.insights || [])
      setAchievements(achievementsData.achievements || [])
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateReport = async (type: 'weekly' | 'monthly') => {
    try {
      const response = await fetch(`/api/analytics/reports?type=${type}`)
      if (!response.ok) {
        throw new Error('Failed to generate report')
      }
      const data = await response.json()
      return data.report
    } catch (err) {
      console.error('Error generating report:', err)
      throw err
    }
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-white border border-gray-200 rounded-lg">
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
        <p className="text-gray-700 mb-4">{error}</p>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Track your progress and gain insights into your productivity, wellness, and growth.
        </p>
      </div>

      {/* Key Metrics */}
      {overview && (
        <MetricCardsGrid
          productivityScore={overview.currentScores.productivityScore}
          wellnessScore={overview.currentScores.wellnessScore}
          growthScore={overview.currentScores.growthScore}
          overallScore={overview.currentScores.overallScore}
        />
      )}

      {/* Today's Activity */}
      {overview && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">{overview.today.tasksCompleted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Habits Completed</p>
              <p className="text-2xl font-bold text-gray-900">{overview.today.habitsCompleted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Exercise Minutes</p>
              <p className="text-2xl font-bold text-gray-900">{overview.today.exerciseMinutes}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Learning Minutes</p>
              <p className="text-2xl font-bold text-gray-900">{overview.today.learningMinutes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <InsightPanel insights={insights} isLoading={isLoading} />

      {/* Trends */}
      <TrendCharts data={trends} isLoading={isLoading} />

      {/* Recent Achievements */}
      <AchievementDisplay achievements={achievements} isLoading={isLoading} limit={5} />

      {/* Report Generator */}
      <ReportGenerator onGenerate={handleGenerateReport} />
    </div>
  )
}
