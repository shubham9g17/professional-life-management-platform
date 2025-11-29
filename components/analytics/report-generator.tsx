'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setReportType('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Report Display */}
      {report && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {report.type === 'weekly' ? 'Weekly' : 'Monthly'} Performance Report
            </h2>
            <p className="text-sm text-gray-600">
              {formatDate(report.period.start)} - {formatDate(report.period.end)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {report.daysTracked} days tracked
            </p>
          </div>

          {/* Average Scores */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Average Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Productivity</p>
                <p className="text-3xl font-bold text-green-600">
                  {report.averages.productivityScore}
                </p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Wellness</p>
                <p className="text-3xl font-bold text-purple-600">
                  {report.averages.wellnessScore}
                </p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Growth</p>
                <p className="text-3xl font-bold text-orange-600">
                  {report.averages.growthScore}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.totals.tasksCompleted}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {report.totals.tasksOnTime} on time
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Habits Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.totals.habitsCompleted}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Exercise Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMinutes(report.totals.exerciseMinutes)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Learning Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMinutes(report.totals.learningMinutes)}
                </p>
              </div>
            </div>
          </div>

          {/* Wellness Tracking */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Wellness Tracking</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Days with Nutrition Tracked</p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.totals.daysWithCaloriesTracked}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((report.totals.daysWithCaloriesTracked / report.daysTracked) * 100).toFixed(0)}% of days
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Days with Water Goal Met</p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.totals.daysWithWaterGoalMet}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((report.totals.daysWithWaterGoalMet / report.daysTracked) * 100).toFixed(0)}% of days
                </p>
              </div>
            </div>
          </div>

          {/* Achievements (monthly only) */}
          {report.achievementsUnlocked !== undefined && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Achievements</h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Achievements Unlocked</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {report.achievementsUnlocked}
                </p>
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export as PDF
              </Button>
              <Button variant="outline" size="sm">
                Export as CSV
              </Button>
              <Button variant="outline" size="sm">
                Share Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
