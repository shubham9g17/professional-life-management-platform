'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FitnessGoal {
  id: string
  goalType: string
  targetValue: number
  currentValue: number
  unit: string
  deadline?: Date
  status: string
  progress?: number
}

interface FitnessGoalsProps {
  goals: FitnessGoal[]
  onCreateGoal?: (data: CreateGoalData) => Promise<void>
  onUpdateProgress?: (goalId: string, currentValue: number) => Promise<void>
  onDeleteGoal?: (goalId: string) => Promise<void>
}

export interface CreateGoalData {
  goalType: string
  targetValue: number
  currentValue?: number
  unit: string
  deadline?: string
}

const goalTypes = [
  { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
  { value: 'WEIGHT_GAIN', label: 'Weight Gain' },
  { value: 'EXERCISE_MINUTES', label: 'Exercise Minutes' },
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'ENDURANCE', label: 'Endurance' },
  { value: 'CUSTOM', label: 'Custom' },
]

export function FitnessGoals({ goals, onCreateGoal, onUpdateProgress, onDeleteGoal }: FitnessGoalsProps) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateGoalData>({
    goalType: 'EXERCISE_MINUTES',
    targetValue: 0,
    currentValue: 0,
    unit: 'minutes',
    deadline: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!onCreateGoal) return

    if (formData.targetValue <= 0) {
      setError('Target value must be greater than 0')
      return
    }

    setIsSubmitting(true)
    try {
      await onCreateGoal(formData)
      setShowForm(false)
      setFormData({
        goalType: 'EXERCISE_MINUTES',
        targetValue: 0,
        currentValue: 0,
        unit: 'minutes',
        deadline: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!onDeleteGoal) return
    
    if (confirm('Are you sure you want to delete this goal?')) {
      await onDeleteGoal(goalId)
    }
  }

  const calculateProgress = (goal: FitnessGoal) => {
    if (goal.progress !== undefined) return goal.progress
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
  }

  const formatDeadline = (deadline?: Date) => {
    if (!deadline) return 'No deadline'
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fitness Goals</h2>
        {onCreateGoal && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New Goal'}
          </Button>
        )}
      </div>

      {showForm && onCreateGoal && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Goal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalType">Goal Type</Label>
              <select
                id="goalType"
                value={formData.goalType}
                onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {goalTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.targetValue || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., kg, minutes, reps"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value (optional)</Label>
              <Input
                id="currentValue"
                type="number"
                min="0"
                step="0.1"
                value={formData.currentValue || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentValue: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No fitness goals yet</p>
            <p className="text-sm mt-2">Create a goal to start tracking your progress!</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal)
            const isCompleted = goal.status === 'COMPLETED'

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-lg shadow p-6 ${
                  isCompleted ? 'border-2 border-green-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {goalTypes.find((t) => t.value === goal.goalType)?.label || goal.goalType}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Target: {goal.targetValue} {goal.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current: {goal.currentValue} {goal.unit}
                    </p>
                    <p className="text-sm text-gray-600">Deadline: {formatDeadline(goal.deadline)}</p>
                  </div>
                  {onDeleteGoal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                {isCompleted && (
                  <div className="mt-3 text-green-600 font-semibold text-sm">
                    ✓ Goal Completed!
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
