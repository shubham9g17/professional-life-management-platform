'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Exercise {
  id: string
  activityType: string
  duration: number
  intensity: string
  caloriesBurned?: number
  notes?: string
  date: Date
}

interface ExerciseLogProps {
  exercises: Exercise[]
  onEdit?: (exercise: Exercise) => void
  onDelete?: (exerciseId: string) => void
}

const intensityColors = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  INTENSE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

export function ExerciseLog({ exercises, onEdit, onDelete }: ExerciseLogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (exerciseId: string) => {
    if (!onDelete) return
    
    if (confirm('Are you sure you want to delete this exercise log?')) {
      setDeletingId(exerciseId)
      try {
        await onDelete(exerciseId)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No exercises logged yet</p>
        <p className="text-sm mt-2">Start tracking your fitness activities!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise) => (
        <div
          key={exercise.id}
          className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{exercise.activityType}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    intensityColors[exercise.intensity as keyof typeof intensityColors] ||
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200'
                  }`}
                >
                  {exercise.intensity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                <div>
                  <span className="font-medium">Duration:</span> {exercise.duration} min
                </div>
                {exercise.caloriesBurned && (
                  <div>
                    <span className="font-medium">Calories:</span> {exercise.caloriesBurned}
                  </div>
                )}
                <div>
                  <span className="font-medium">Date:</span> {formatDate(exercise.date)}
                </div>
              </div>

              {exercise.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">{exercise.notes}</p>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(exercise)}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(exercise.id)}
                  disabled={deletingId === exercise.id}
                >
                  {deletingId === exercise.id ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
