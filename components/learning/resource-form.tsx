'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ResourceFormProps {
  onSubmit: (data: ResourceFormData) => Promise<void>
  initialData?: Partial<ResourceFormData>
  isEditing?: boolean
}

export interface ResourceFormData {
  title: string
  type: 'BOOK' | 'COURSE' | 'CERTIFICATION' | 'ARTICLE'
  category: string
  completionPercentage: number
  timeInvested: number
  startDate: string
  notes?: string
  url?: string
}

const resourceTypes = [
  { value: 'BOOK', label: 'Book' },
  { value: 'COURSE', label: 'Course' },
  { value: 'CERTIFICATION', label: 'Certification' },
  { value: 'ARTICLE', label: 'Article' },
]

export function ResourceForm({ onSubmit, initialData, isEditing = false }: ResourceFormProps) {
  const [formData, setFormData] = useState<ResourceFormData>({
    title: initialData?.title || '',
    type: initialData?.type || 'BOOK',
    category: initialData?.category || '',
    completionPercentage: initialData?.completionPercentage || 0,
    timeInvested: initialData?.timeInvested || 0,
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
    url: initialData?.url || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (!formData.category.trim()) {
      setError('Category is required')
      return
    }

    if (formData.completionPercentage < 0 || formData.completionPercentage > 100) {
      setError('Completion percentage must be between 0 and 100')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert startDate to ISO datetime string
      const submitData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
      }
      await onSubmit(submitData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save learning resource')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Clean Code by Robert Martin"
          required
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as ResourceFormData['type'],
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {resourceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Software Engineering"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="completionPercentage">Completion % *</Label>
          <Input
            id="completionPercentage"
            type="number"
            min="0"
            max="100"
            value={formData.completionPercentage}
            onChange={(e) =>
              setFormData({
                ...formData,
                completionPercentage: parseInt(e.target.value) || 0,
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeInvested">Time Invested (minutes)</Label>
          <Input
            id="timeInvested"
            type="number"
            min="0"
            value={formData.timeInvested}
            onChange={(e) =>
              setFormData({
                ...formData,
                timeInvested: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date *</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://example.com/resource"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add notes about this resource..."
          className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : isEditing ? 'Update Resource' : 'Create Resource'}
      </Button>
    </form>
  )
}
