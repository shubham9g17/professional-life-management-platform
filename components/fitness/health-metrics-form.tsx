'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface HealthMetricsFormProps {
  onSubmit: (data: HealthMetricsFormData) => Promise<void>
  initialData?: Partial<HealthMetricsFormData>
}

export interface HealthMetricsFormData {
  date: string
  weight?: number
  sleepQuality?: number
  stressLevel?: number
  energyLevel?: number
}

export function HealthMetricsForm({ onSubmit, initialData }: HealthMetricsFormProps) {
  const [formData, setFormData] = useState<HealthMetricsFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    weight: initialData?.weight,
    sleepQuality: initialData?.sleepQuality,
    stressLevel: initialData?.stressLevel,
    energyLevel: initialData?.energyLevel,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate at least one metric is provided
    if (
      formData.weight === undefined &&
      formData.sleepQuality === undefined &&
      formData.stressLevel === undefined &&
      formData.energyLevel === undefined
    ) {
      setError('Please provide at least one health metric')
      return
    }

    // Validate ranges
    if (formData.sleepQuality !== undefined && (formData.sleepQuality < 1 || formData.sleepQuality > 10)) {
      setError('Sleep quality must be between 1 and 10')
      return
    }

    if (formData.stressLevel !== undefined && (formData.stressLevel < 1 || formData.stressLevel > 10)) {
      setError('Stress level must be between 1 and 10')
      return
    }

    if (formData.energyLevel !== undefined && (formData.energyLevel < 1 || formData.energyLevel > 10)) {
      setError('Energy level must be between 1 and 10')
      return
    }

    if (formData.weight !== undefined && formData.weight <= 0) {
      setError('Weight must be a positive number')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save health metrics')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor="weight">Weight (kg) - Optional</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          min="0"
          value={formData.weight || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              weight: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          placeholder="e.g., 70.5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sleepQuality">Sleep Quality (1-10) - Optional</Label>
        <Input
          id="sleepQuality"
          type="number"
          min="1"
          max="10"
          value={formData.sleepQuality || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              sleepQuality: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder="1 = Poor, 10 = Excellent"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stressLevel">Stress Level (1-10) - Optional</Label>
        <Input
          id="stressLevel"
          type="number"
          min="1"
          max="10"
          value={formData.stressLevel || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              stressLevel: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder="1 = Low, 10 = High"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="energyLevel">Energy Level (1-10) - Optional</Label>
        <Input
          id="energyLevel"
          type="number"
          min="1"
          max="10"
          value={formData.energyLevel || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              energyLevel: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder="1 = Low, 10 = High"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : 'Save Health Metrics'}
      </Button>
    </form>
  )
}
