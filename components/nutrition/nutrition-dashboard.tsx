'use client'

import { useState, useEffect } from 'react'
import { MealForm } from './meal-form'
import { MealLog } from './meal-log'
import { WaterTracker } from './water-tracker'

interface NutritionStats {
  totalMeals: number
  mealsByType: Record<string, number>
  averageCalories: number
  totalCalories: number
  averageProtein: number
  averageCarbs: number
  averageFats: number
  totalWaterIntake: number
  averageDailyWater: number
  daysTracked: number
}

export function NutritionDashboard() {
  const [stats, setStats] = useState<NutritionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showMealForm, setShowMealForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'water'>('overview')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      // Get stats for the last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const response = await fetch(`/api/nutrition/stats?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch nutrition stats')

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching nutrition stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMealSubmit = async (mealData: any) => {
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData),
      })

      if (!response.ok) throw new Error('Failed to create meal')

      setShowMealForm(false)
      fetchStats() // Refresh stats
    } catch (err) {
      throw err
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'meals', label: 'Meals' },
    { id: 'water', label: 'Water' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Nutrition Tracking</h1>
        <button
          onClick={() => setShowMealForm(!showMealForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showMealForm ? 'Cancel' : 'Log Meal'}
        </button>
      </div>

      {/* Meal Form Modal */}
      {showMealForm && (
        <div className="bg-white border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Log New Meal</h2>
          <MealForm onSubmit={handleMealSubmit} />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {isLoading ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm text-gray-600 mb-1">Total Meals</h3>
                  <p className="text-2xl font-bold">{stats.totalMeals}</p>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm text-gray-600 mb-1">Avg Calories</h3>
                  <p className="text-2xl font-bold">{stats.averageCalories}</p>
                  <p className="text-xs text-gray-500 mt-1">Per meal</p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm text-gray-600 mb-1">Avg Water</h3>
                  <p className="text-2xl font-bold">{stats.averageDailyWater} ml</p>
                  <p className="text-xs text-gray-500 mt-1">Per day</p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-sm text-gray-600 mb-1">Days Tracked</h3>
                  <p className="text-2xl font-bold">{stats.daysTracked}</p>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>
              </div>

              {/* Meals by Type */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Meals by Type</h3>
                <div className="space-y-3">
                  {Object.entries(stats.mealsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-700 capitalize">
                        {type.toLowerCase()}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(count / stats.totalMeals) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macros Summary */}
              {(stats.averageProtein > 0 || stats.averageCarbs > 0 || stats.averageFats > 0) && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Average Macros per Meal</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {stats.averageProtein}g
                      </p>
                      <p className="text-sm text-gray-600">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats.averageCarbs}g
                      </p>
                      <p className="text-sm text-gray-600">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.averageFats}g
                      </p>
                      <p className="text-sm text-gray-600">Fats</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No nutrition data available yet. Start logging your meals!
            </div>
          )}
        </div>
      )}

      {activeTab === 'meals' && (
        <div>
          <MealLog onDelete={fetchStats} />
        </div>
      )}

      {activeTab === 'water' && (
        <div>
          <WaterTracker />
        </div>
      )}
    </div>
  )
}
