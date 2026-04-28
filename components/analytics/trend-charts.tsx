'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface TrendData {
  date: Date | string
  productivityScore: number
  wellnessScore: number
  growthScore: number
  overallScore: number
}

interface TrendChartsProps {
  data: TrendData[]
  isLoading?: boolean
}

const series = [
  {
    key: 'productivityScore',
    name: 'Productivity',
    color: 'rgb(var(--chart-1))',
    style: 'solid' as const,
    dash: undefined,
  },
  {
    key: 'wellnessScore',
    name: 'Wellness',
    color: 'rgb(var(--chart-3))',
    style: 'dashed' as const,
    dash: '6 4',
  },
  {
    key: 'growthScore',
    name: 'Growth',
    color: 'rgb(var(--chart-2))',
    style: 'dotted' as const,
    dash: '2 4',
  },
]

const formatTick = (date: string | Date) =>
  new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export function TrendCharts({ data, isLoading }: TrendChartsProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        date: typeof d.date === 'string' ? d.date : d.date.toISOString(),
      })),
    [data]
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[320px] rounded-[var(--card-radius)]" />
        <Skeleton className="h-[320px] rounded-[var(--card-radius)]" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bento-card flex flex-col items-center gap-3 py-16 text-center">
        <LineChartIcon className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className="text-base font-medium text-foreground">No trend data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep tracking your activities — trends appear after a few days of data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bento-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Overall score</h3>
            <p className="text-xs text-muted-foreground">
              {chartData.length} day{chartData.length === 1 ? '' : 's'} tracked
            </p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <defs>
                <linearGradient id="overallTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="rgb(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatTick}
                minTickGap={24}
              />
              <YAxis
                stroke="rgb(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="overallScore"
                name="Overall"
                stroke="rgb(var(--chart-1))"
                strokeWidth={2}
                fill="url(#overallTrend)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bento-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Score comparison</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="rgb(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatTick}
                minTickGap={24}
              />
              <YAxis
                stroke="rgb(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="plainline"
                wrapperStyle={{ fontSize: 12, color: 'rgb(var(--muted-foreground))' }}
              />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dash}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string | Date
}) {
  if (!active || !payload?.length) return null
  const dateLabel = label ? new Date(label).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) : ''
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{dateLabel}</p>
      <ul className="space-y-1">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}
            </span>
            <span className="font-mono tabular-nums text-foreground" data-numeric>
              {Math.round(p.value ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
