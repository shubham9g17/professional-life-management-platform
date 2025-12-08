'use client'

import { Card } from '@/components/ui/card'

interface WellnessWidgetProps {
  habitsCompleted: number
  habitsTotal: number
  exerciseMinutes: number
  waterGoalMet: boolean
  wellnessScore: number
}

export function WellnessWidget({
  habitsCompleted,
  habitsTotal,
  exerciseMinutes,
  waterGoalMet,
  wellnessScore,
}: WellnessWidgetProps) {
  const habitCompletionRate = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Wellness</h3>
          <p className="text-sm text-muted-foreground">Health & habits</p>
        </div>
        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <svg
            className="w-6 h-6 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        {/* Score */}
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(wellnessScore)}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all"
              style={{ width: `${wellnessScore}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Habits Today</p>
            <p className="text-lg font-semibold">
              {habitsCompleted} / {habitsTotal}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {habitCompletionRate.toFixed(0)}% complete
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Exercise</p>
            <p className="text-lg font-semibold">{exerciseMinutes} min</p>
            <p className="text-xs text-muted-foreground">
              {waterGoalMet ? '💧 Hydrated' : '💧 Drink water'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
