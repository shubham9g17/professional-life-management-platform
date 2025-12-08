'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProgressTrackerProps {
  resourceId: string
  currentProgress: number
  currentTimeInvested: number
  onUpdate: (resourceId: string, progress: number, timeAdded: number) => Promise<void>
}

export function ProgressTracker({
  resourceId,
  currentProgress,
  currentTimeInvested,
  onUpdate,
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState(currentProgress)
  const [timeToAdd, setTimeToAdd] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async () => {
    setError(null)

    if (progress < 0 || progress > 100) {
      setError('Progress must be between 0 and 100')
      return
    }

    if (timeToAdd < 0) {
      setError('Time cannot be negative')
      return
    }

    setIsUpdating(true)
    try {
      await onUpdate(resourceId, progress, timeToAdd)
      setTimeToAdd(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress')
    } finally {
      setIsUpdating(false)
    }
  }

  const quickAddTime = (minutes: number) => {
    setTimeToAdd((prev) => prev + minutes)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <h3 className="font-semibold text-lg">Update Progress</h3>

      <div className="space-y-2">
        <Label htmlFor="progress">Completion Percentage</Label>
        <div className="flex items-center gap-2">
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
            className="w-24"
          />
          <span className="text-sm text-gray-600">%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value))}
            className="flex-1"
          />
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Time Invested</Label>
        <div className="text-sm text-gray-600 mb-2">
          Total: {formatTime(currentTimeInvested + timeToAdd)}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeToAdd">Add Time (minutes)</Label>
          <Input
            id="timeToAdd"
            type="number"
            min="0"
            value={timeToAdd}
            onChange={(e) => setTimeToAdd(parseInt(e.target.value) || 0)}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickAddTime(15)}
            >
              +15m
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickAddTime(30)}
            >
              +30m
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickAddTime(60)}
            >
              +1h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickAddTime(120)}
            >
              +2h
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Button onClick={handleUpdate} disabled={isUpdating} className="w-full">
        {isUpdating ? 'Updating...' : 'Update Progress'}
      </Button>
    </div>
  )
}
