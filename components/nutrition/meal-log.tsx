'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Meal {
  id: string
  mealType: string
  foodItems: string[]
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  date: Date
}

interface MealLogProps {
  onEdit?: (meal: Meal) => void
  onDelete?: (mealId: string) => void
}

export function MealLog({ onEdit, onDelete }: MealLogProps) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchMeals()
  }, [filter])

  const fetchMeals = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (filter !== 'all') {
        params.append('mealType', filter)
      }

      const response = await fetch(`/api/meals?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch meals')
      
      const data = await response.json()
      setMeals(data.meals.map((meal: any) => ({
        ...meal,
        date: new Date(meal.date),
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return

    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete meal')

      setMeals(meals.filter((m) => m.id !== mealId))
      if (onDelete) onDelete(mealId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete meal')
    }
  }

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BREAKFAST: 'Breakfast',
      LUNCH: 'Lunch',
      DINNER: 'Dinner',
      SNACK: 'Snack',
    }
    return labels[type] || type
  }

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      BREAKFAST: 'bg-yellow-100 text-yellow-800',
      LUNCH: 'bg-green-100 text-green-800',
      DINNER: 'bg-blue-100 text-blue-800',
      SNACK: 'bg-purple-100 text-purple-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading meals...</div>
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filter === 'BREAKFAST' ? 'default' : 'outline'}
          onClick={() => setFilter('BREAKFAST')}
          size="sm"
        >
          Breakfast
        </Button>
        <Button
          variant={filter === 'LUNCH' ? 'default' : 'outline'}
          onClick={() => setFilter('LUNCH')}
          size="sm"
        >
          Lunch
        </Button>
        <Button
          variant={filter === 'DINNER' ? 'default' : 'outline'}
          onClick={() => setFilter('DINNER')}
          size="sm"
        >
          Dinner
        </Button>
        <Button
          variant={filter === 'SNACK' ? 'default' : 'outline'}
          onClick={() => setFilter('SNACK')}
          size="sm"
        >
          Snack
        </Button>
      </div>

      {meals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No meals logged yet. Start tracking your nutrition!
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getMealTypeColor(
                      meal.mealType
                    )}`}
                  >
                    {getMealTypeLabel(meal.mealType)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {meal.date.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(meal)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(meal.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mb-2">
                <h4 className="text-sm font-medium mb-1">Food Items:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {meal.foodItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              {(meal.calories || meal.protein || meal.carbs || meal.fats) && (
                <div className="flex gap-4 text-sm text-gray-600 pt-2 border-t">
                  {meal.calories && <span>Calories: {meal.calories}</span>}
                  {meal.protein && <span>Protein: {meal.protein}g</span>}
                  {meal.carbs && <span>Carbs: {meal.carbs}g</span>}
                  {meal.fats && <span>Fats: {meal.fats}g</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
