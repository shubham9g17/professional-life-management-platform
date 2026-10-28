'use client'

import { Button } from '@/components/ui/button'

interface HabitCardProps {
  habit: {
    id: string
    name: string
    category: string
    frequency: string
    currentStreak: number
    longestStreak: number
    completionRate: number
    lastCompletedAt: Date | null
  }
  onComplete: (habitId: string) => Promise<void>
  onEdit?: (habitId: string) => void
  onDelete?: (habitId: string) => void
}

const categoryColors: Record<string, string> = {
  PROFESSIONAL_DEVELOPMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  HEALTH: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  PRODUCTIVITY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  PERSONAL_GROWTH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
}

const categoryLabels: Record<string, string> = {
  PROFESSIONAL_DEVELOPMENT: 'Professional Development',
  HEALTH: 'Health',
  PRODUCTIVITY: 'Productivity',
  PERSONAL_GROWTH: 'Personal Growth',
}

export function HabitCard({ habit, onComplete, onEdit, onDelete }: HabitCardProps) {
  const isCompletedToday = habit.lastCompletedAt
    ? new Date(habit.lastCompletedAt).toDateString() === new Date().toDateString()
    : false

  const handleComplete = async () => {
    await onComplete(habit.id)
  }

  return (
    <div className="bento-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{habit.name}</h3>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              categoryColors[habit.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {categoryLabels[habit.category] || habit.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {habit.currentStreak}
          </div>
          <div className="text-xs text-muted-foreground">Current Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {habit.longestStreak}
          </div>
          <div className="text-xs text-muted-foreground">Longest Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {habit.completionRate.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Completion Rate</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleComplete}
          disabled={isCompletedToday}
          className="flex-1"
          variant={isCompletedToday ? 'outline' : 'default'}
        >
          {isCompletedToday ? '✓ Completed Today' : 'Complete'}
        </Button>
        {onEdit && (
          <Button
            onClick={() => onEdit(habit.id)}
            variant="outline"
            size="sm"
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={() => onDelete(habit.id)}
            variant="outline"
            size="sm"
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
