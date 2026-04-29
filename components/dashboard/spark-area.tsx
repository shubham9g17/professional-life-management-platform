'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface SparkAreaProps {
  data: Array<{ value: number; label?: string }>
  color?: string
  height?: number
  ariaLabel?: string
}

/**
 * Decorative sparkline. Hidden from assistive tech (label is on the
 * surrounding KPI text); use `ariaLabel` only when this is the only data
 * representation on screen.
 */
export function SparkArea({
  data,
  color = 'rgb(var(--chart-1))',
  height = 56,
  ariaLabel,
}: SparkAreaProps) {
  return (
    <div
      className="w-full min-w-0"
      style={{ height }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill="url(#sparkArea)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
