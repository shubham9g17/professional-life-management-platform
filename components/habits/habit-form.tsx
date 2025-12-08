'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface HabitFormProps {
  onSubmit: (data: HabitFormData) => Promise<void>
  initialData?: Partial<HabitFormData>
  isEditing?: boolean
}

export interface HabitFormData {
  name: string
  category: 'PROFESSIONAL_DEVELOPMENT' | 'HEALTH' | 'PRODUCTIVITY' | 'PERSONAL_GROWTH'
  frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM'
}

const categories = [
  { value: 'PROFESSIONAL_DEVELOPMENT', label: 'Professional Development' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'PRODUCTIVITY', label: 'Productivity' },
  { value: 'PERSONAL_GROWTH', label: 'Personal Growth' },
]

const frequencies = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'CUSTOM', label: 'Custom' },
]

export function HabitForm({ onSubmit, initialData, isEditing = false }: HabitFormProps) {
  const [formData, setFormData] = useState<HabitFormData>({
    name: initialData?.name || '',
    category: initialData?.category || 'PRODUCTIVITY',
    frequency: initialData?.frequency || 'DAILY',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Habit name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save habit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Habit Name</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Morning meditation"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) =>
            setFormData({
              ...formData,
              category: e.target.value as HabitFormData['category'],
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <select
          id="frequency"
          value={formData.frequency}
          onChange={(e) =>
            setFormData({
              ...formData,
              frequency: e.target.value as HabitFormData['frequency'],
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {frequencies.map((freq) => (
            <option key={freq.value} value={freq.value}>
              {freq.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : isEditing ? 'Update Habit' : 'Create Habit'}
      </Button>
    </form>
  )
}
