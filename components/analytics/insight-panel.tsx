'use client'

import { CheckCircle2, TrendingUp, Info, Lightbulb } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Insight {
  type: 'POSITIVE' | 'NEUTRAL' | 'IMPROVEMENT'
  category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'OVERALL'
  title: string
  description: string
  metric?: number
}

interface InsightPanelProps {
  insights: Insight[]
  isLoading?: boolean
}

const typeStyles: Record<Insight['type'], { surface: string; icon: string; Icon: typeof CheckCircle2 }> = {
  POSITIVE: {
    surface: 'border-success/30 bg-success/5',
    icon: 'text-success',
    Icon: CheckCircle2,
  },
  IMPROVEMENT: {
    surface: 'border-warning/30 bg-warning/5',
    icon: 'text-warning',
    Icon: TrendingUp,
  },
  NEUTRAL: {
    surface: 'border-primary/20 bg-primary/5',
    icon: 'text-primary',
    Icon: Info,
  },
}

const categoryStyles: Record<Insight['category'], string> = {
  PRODUCTIVITY: 'bg-chart-1/10 text-chart-1',
  WELLNESS: 'bg-chart-3/10 text-chart-3',
  GROWTH: 'bg-chart-2/10 text-chart-2',
  OVERALL: 'bg-primary/10 text-primary',
}

export function InsightPanel({ insights, isLoading }: InsightPanelProps) {
  if (isLoading) {
    return (
      <div className="bento-card p-5">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bento-card flex flex-col items-center gap-3 py-16 text-center">
        <Lightbulb className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className="text-base font-medium text-foreground">Nothing to suggest yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep tracking activities and personalized insights will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bento-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Insights & recommendations</h3>
        <span className="text-xs text-muted-foreground">
          {insights.length} insight{insights.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="space-y-3">
        {insights.map((insight, index) => {
          const styles = typeStyles[insight.type]
          const Icon = styles.Icon
          return (
            <li
              key={index}
              className={cn('rounded-lg border p-4 transition-colors', styles.surface)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border',
                    styles.icon
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-foreground">{insight.title}</h4>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                        categoryStyles[insight.category]
                      )}
                    >
                      {insight.category.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{insight.description}</p>
                  {insight.metric !== undefined && (
                    <p className="mt-2 font-mono text-sm tabular-nums text-foreground" data-numeric>
                      <span className="text-lg font-semibold">{insight.metric}</span>
                      <span className="ml-1 text-muted-foreground">score</span>
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
