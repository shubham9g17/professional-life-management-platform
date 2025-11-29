'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MealFormProps {
  onSubmit: (data: MealFormData) => Promise<void>
  initialData?: Partial<MealFormData>
  isEditing?: boolean
}

export interface MealFormData {
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  foodItems: string[]
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  date: string
}

const mealTypes = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACK', label: 'Snack' },
]

export function MealForm({ onSubmit, initialData, isEditing = false }: MealFormProps) {
  const [formData, setFormData] = useState<MealFormData>({
    mealType: initialData?.mealType || 'BREAKFAST',
    foodItems: initialData?.foodItems || [],
    calories: initialData?.calories,
    protein: initialData?.protein,
    carbs: initialData?.carbs,
    fats: initialData?.fats,
    date: initialData?.date || new Date().toISOString().split('T')[0],
  })
  const [foodItemInput, setFoodItemInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddFoodItem = () => {
    if (foodItemInput.trim()) {
      setFormData({
        ...formData,
        foodItems: [...formData.foodItems, foodItemInput.trim()],
      })
      setFoodItemInput('')
    }
  }

  const handleRemoveFoodItem = (index: number) => {
    setFormData({
      ...formData,
      foodItems: formData.foodItems.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.foodItems.length === 0) {
      setError('Please add at least one food item')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mealType">Meal Type</Label>
        <select
          id="mealType"
          value={formData.mealType}
          onChange={(e) =>
            setFormData({
              ...formData,
              mealType: e.target.value as MealFormData['mealType'],
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {mealTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="foodItems">Food Items</Label>
        <div className="flex gap-2">
          <Input
            id="foodItems"
            type="text"
            value={foodItemInput}
            onChange={(e) => setFoodItemInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddFoodItem()
              }
            }}
            placeholder="Add food item..."
          />
          <Button type="button" onClick={handleAddFoodItem}>
            Add
          </Button>
        </div>
        {formData.foodItems.length > 0 && (
          <div className="mt-2 space-y-1">
            {formData.foodItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFoodItem(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3">Macro Tracking (Optional)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calories">Calories</Label>
            <Input
              id="calories"
              type="number"
              min="0"
              value={formData.calories || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  calories: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              min="0"
              step="0.1"
              value={formData.protein || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  protein: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              min="0"
              step="0.1"
              value={formData.carbs || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  carbs: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fats">Fats (g)</Label>
            <Input
              id="fats"
              type="number"
              min="0"
              step="0.1"
              value={formData.fats || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fats: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : isEditing ? 'Update Meal' : 'Log Meal'}
      </Button>
    </form>
  )
}
