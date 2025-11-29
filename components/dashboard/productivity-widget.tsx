'use client'

import { Card } from '@/components/ui/card'

interface ProductivityWidgetProps {
  tasksCompleted: number
  tasksTotal: number
  tasksOnTime: number
  productivityScore: number
}

export function ProductivityWidget({
  tasksCompleted,
  tasksTotal,
  tasksOnTime,
  productivityScore,
}: ProductivityWidgetProps) {
  const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0
  const onTimeRate = tasksCompleted > 0 ? (tasksOnTime / tasksCompleted) * 100 : 0

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Productivity</h3>
          <p className="text-sm text-muted-foreground">Task completion & efficiency</p>
        </div>
        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        {/* Score */}
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              {Math.round(productivityScore)}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all"
              style={{ width: `${productivityScore}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tasks Completed</p>
            <p className="text-lg font-semibold">
              {tasksCompleted} / {tasksTotal}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {completionRate.toFixed(0)}% complete
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">On-Time Rate</p>
            <p className="text-lg font-semibold">{onTimeRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              {tasksOnTime} on time
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
