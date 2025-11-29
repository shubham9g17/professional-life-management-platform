'use client'

import { useState, useEffect } from 'react'

interface ExerciseStats {
  totalExercises: number
  totalMinutes: number
  totalCalories: number
  averageIntensity: string
  mostCommonActivity: string
  weeklyMinutes: number
  monthlyMinutes: number
}

interface HealthMetric {
  date: Date
  weight?: number
  sleepQuality?: number
  stressLevel?: number
  energyLevel?: number
}

interface FitnessDashboardProps {
  stats: ExerciseStats
  latestMetrics?: HealthMetric
}

export function FitnessDashboard({ stats, latestMetrics }: FitnessDashboardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="animate-pulse">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Weekly Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Weekly Minutes</p>
            <p className="text-3xl font-bold text-blue-600">{stats.weeklyMinutes}</p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Monthly Minutes</p>
            <p className="text-3xl font-bold text-green-600">{stats.monthlyMinutes}</p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Workouts</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalExercises}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>
      </div>

      {/* Exercise Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Exercise Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Exercise Time</p>
            <p className="text-2xl font-semibold">{stats.totalMinutes} minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Calories Burned</p>
            <p className="text-2xl font-semibold">{stats.totalCalories} cal</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Average Intensity</p>
            <p className="text-2xl font-semibold">{stats.averageIntensity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Most Common Activity</p>
            <p className="text-2xl font-semibold">{stats.mostCommonActivity}</p>
          </div>
        </div>
      </div>

      {/* Latest Health Metrics */}
      {latestMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Latest Health Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {latestMetrics.weight && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Weight</p>
                <p className="text-2xl font-semibold">{latestMetrics.weight} kg</p>
              </div>
            )}
            {latestMetrics.sleepQuality && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Sleep Quality</p>
                <p className="text-2xl font-semibold">{latestMetrics.sleepQuality}/10</p>
              </div>
            )}
            {latestMetrics.stressLevel && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Stress Level</p>
                <p className="text-2xl font-semibold">{latestMetrics.stressLevel}/10</p>
              </div>
            )}
            {latestMetrics.energyLevel && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Energy Level</p>
                <p className="text-2xl font-semibold">{latestMetrics.energyLevel}/10</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
