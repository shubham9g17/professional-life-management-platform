'use client'

import { Card } from '@/components/ui/card'

interface GrowthWidgetProps {
  learningMinutes: number
  resourcesInProgress: number
  resourcesCompleted: number
  growthScore: number
}

export function GrowthWidget({
  learningMinutes,
  resourcesInProgress,
  resourcesCompleted,
  growthScore,
}: GrowthWidgetProps) {
  const totalResources = resourcesInProgress + resourcesCompleted
  const completionRate = totalResources > 0 ? (resourcesCompleted / totalResources) * 100 : 0

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Growth</h3>
          <p className="text-sm text-muted-foreground">Learning & development</p>
        </div>
        <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
          <svg
            className="w-6 h-6 text-orange-600 dark:text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        {/* Score */}
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(growthScore)}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full transition-all"
              style={{ width: `${growthScore}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Learning Time</p>
            <p className="text-lg font-semibold">{learningMinutes} min</p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Today
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Resources</p>
            <p className="text-lg font-semibold">{resourcesInProgress}</p>
            <p className="text-xs text-muted-foreground">
              {completionRate.toFixed(0)}% completed
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
