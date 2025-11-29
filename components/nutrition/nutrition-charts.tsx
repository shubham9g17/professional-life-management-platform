'use client'

import { useState, useEffect } from 'react'

interface Meal {
  id: string
  mealType: string
  calories?: number
  date: Date
}

interface WaterIntake {
  id: string
  amount: number
  date: Date
}

export function NutritionCharts() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [waterIntakes, setWaterIntakes] = useState<WaterIntake[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // Get data for the last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const [mealsResponse, waterResponse] = await Promise.all([
        fetch(`/api/meals?${params.toString()}`),
        fetch(`/api/water?${params.toString()}`),
      ])

      if (!mealsResponse.ok || !waterResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const mealsData = await mealsResponse.json()
      const waterData = await waterResponse.json()

      setMeals(
        mealsData.meals.map((meal: any) => ({
          ...meal,
          date: new Date(meal.date),
        }))
      )

      setWaterIntakes(
        waterData.waterIntakes.map((intake: any) => ({
          ...intake,
          date: new Date(intake.date),
        }))
      )
    } catch (err) {
      console.error('Error fetching nutrition data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Group meals by day
  const mealsByDay: Record<string, number> = {}
  meals.forEach((meal) => {
    const dateKey = meal.date.toISOString().split('T')[0]
    mealsByDay[dateKey] = (mealsByDay[dateKey] || 0) + 1
  })

  // Group water by day
  const waterByDay: Record<string, number> = {}
  waterIntakes.forEach((intake) => {
    const dateKey = intake.date.toISOString().split('T')[0]
    waterByDay[dateKey] = (waterByDay[dateKey] || 0) + intake.amount
  })

  // Group calories by day
  const caloriesByDay: Record<string, number> = {}
  meals.forEach((meal) => {
    if (meal.calories) {
      const dateKey = meal.date.toISOString().split('T')[0]
      caloriesByDay[dateKey] = (caloriesByDay[dateKey] || 0) + meal.calories
    }
  })

  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading charts...</div>
  }

  return (
    <div className="space-y-6">
      {/* Meals per Day Chart */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Meals per Day (Last 7 Days)</h3>
        <div className="space-y-2">
          {last7Days.map((dateKey) => {
            const count = mealsByDay[dateKey] || 0
            const maxCount = Math.max(...Object.values(mealsByDay), 1)
            const percentage = (count / maxCount) * 100

            return (
              <div key={dateKey} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24">
                  {new Date(dateKey).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-green-500 h-full flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%` }}
                  >
                    {count > 0 && (
                      <span className="text-xs text-white font-medium">{count}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Water Intake Chart */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Water Intake (Last 7 Days)</h3>
        <div className="space-y-2">
          {last7Days.map((dateKey) => {
            const amount = waterByDay[dateKey] || 0
            const goal = 2000 // 2L daily goal
            const percentage = Math.min((amount / goal) * 100, 100)

            return (
              <div key={dateKey} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24">
                  {new Date(dateKey).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-end pr-2 ${
                      amount >= goal ? 'bg-blue-500' : 'bg-blue-300'
                    }`}
                    style={{ width: `${percentage}%` }}
                  >
                    {amount > 0 && (
                      <span className="text-xs text-white font-medium">
                        {amount} ml
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">Daily goal: 2000 ml</p>
      </div>

      {/* Calories Chart */}
      {Object.keys(caloriesByDay).length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Calories per Day (Last 7 Days)</h3>
          <div className="space-y-2">
            {last7Days.map((dateKey) => {
              const calories = caloriesByDay[dateKey] || 0
              const maxCalories = Math.max(...Object.values(caloriesByDay), 1)
              const percentage = (calories / maxCalories) * 100

              return (
                <div key={dateKey} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">
                    {new Date(dateKey).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      {calories > 0 && (
                        <span className="text-xs text-white font-medium">
                          {calories}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
