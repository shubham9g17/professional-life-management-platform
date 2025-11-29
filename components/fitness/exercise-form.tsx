'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExerciseFormProps {
  onSubmit: (data: ExerciseFormData) => Promise<void>
  initialData?: Partial<ExerciseFormData>
  isEditing?: boolean
}

export interface ExerciseFormData {
  activityType: string
  duration: number
  intensity: 'LOW' | 'MODERATE' | 'HIGH' | 'INTENSE'
  caloriesBurned?: number
  notes?: string
  date: string
}

const intensityLevels = [
  { value: 'LOW', label: 'Low' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'HIGH', label: 'High' },
  { value: 'INTENSE', label: 'Intense' },
]

const commonActivities = [
  'Running',
  'Walking',
  'Cycling',
  'Swimming',
  'Weightlifting',
  'Yoga',
  'Pilates',
  'HIIT',
  'Dancing',
  'Sports',
  'Other',
]

export function ExerciseForm({ onSubmit, initialData, isEditing = false }: ExerciseFormProps) {
  const [formData, setFormData] = useState<ExerciseFormData>({
    activityType: initialData?.activityType || '',
    duration: initialData?.duration || 30,
    intensity: initialData?.intensity || 'MODERATE',
    caloriesBurned: initialData?.caloriesBurned,
    notes: initialData?.notes || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.activityType.trim()) {
      setError('Activity type is required')
      return
    }

    if (formData.duration <= 0) {
      setError('Duration must be greater than 0')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exercise')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="activityType">Activity Type</Label>
        <select
          id="activityType"
          value={formData.activityType}
          onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select activity</option>
          {commonActivities.map((activity) => (
            <option key={activity} value={activity}>
              {activity}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="intensity">Intensity</Label>
        <select
          id="intensity"
          value={formData.intensity}
          onChange={(e) =>
            setFormData({
              ...formData,
              intensity: e.target.value as ExerciseFormData['intensity'],
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {intensityLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="caloriesBurned">Calories Burned (optional)</Label>
        <Input
          id="caloriesBurned"
          type="number"
          min="0"
          value={formData.caloriesBurned || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              caloriesBurned: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
        />
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

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
          placeholder="Add any notes about your workout..."
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : isEditing ? 'Update Exercise' : 'Log Exercise'}
      </Button>
    </form>
  )
}
