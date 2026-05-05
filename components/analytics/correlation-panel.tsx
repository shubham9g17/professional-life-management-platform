'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CorrelationResult {
  id: string
  label: string
  metric: string
  condition: string
  withValue: number
  withoutValue: number
  withCount: number
  withoutCount: number
  deltaAbs: number
  deltaPct: number
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
}

interface CorrelationPanelProps {
  days: number
}

export function CorrelationPanel({ days }: CorrelationPanelProps) {
  const [items, setItems] = useState<CorrelationResult[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/analytics/correlations?days=${days}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setItems(data.correlations)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [days])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bento-card h-36 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bento-card p-6 text-center text-sm text-muted-foreground">
        Couldn&apos;t load correlations. Try refreshing.
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="bento-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Not enough data yet to surface correlations.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Log activity across at least a few days — patterns appear once we have ≥3 days on each
          side of a comparison.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <CorrelationCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function CorrelationCard({ item }: { item: CorrelationResult }) {
  const isPositive = item.direction === 'POSITIVE'
  const isNegative = item.direction === 'NEGATIVE'
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const tint = isPositive
    ? 'text-success'
    : isNegative
      ? 'text-destructive'
      : 'text-muted-foreground'

  // Clamp bar widths so visual delta tracks the absolute scale (out of ~100)
  const max = Math.max(item.withValue, item.withoutValue, 1)
  const withWidth = `${(item.withValue / max) * 100}%`
  const withoutWidth = `${(item.withoutValue / max) * 100}%`

  return (
    <div className="bento-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{item.label}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">when {item.condition}</p>
        </div>
        <span className={cn('inline-flex items-center gap-1 text-sm font-semibold', tint)}>
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {item.deltaPct > 0 ? '+' : ''}
          {item.deltaPct.toFixed(1)}%
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <Bar
          label={`With (${item.withCount}d)`}
          value={item.withValue}
          width={withWidth}
          tint={tint}
        />
        <Bar
          label={`Without (${item.withoutCount}d)`}
          value={item.withoutValue}
          width={withoutWidth}
          tint="text-muted-foreground"
        />
      </div>
    </div>
  )
}

function Bar({
  label,
  value,
  width,
  tint,
}: {
  label: string
  value: number
  width: string
  tint: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-mono font-medium tabular-nums', tint)} data-numeric>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full',
            tint === 'text-success' && 'bg-success',
            tint === 'text-destructive' && 'bg-destructive',
            tint === 'text-muted-foreground' && 'bg-muted-foreground/40'
          )}
          style={{ width }}
        />
      </div>
    </div>
  )
}
