'use client'

interface TrendData {
  date: Date
  productivityScore: number
  wellnessScore: number
  growthScore: number
  overallScore: number
}

interface TrendChartsProps {
  data: TrendData[]
  isLoading?: boolean
}

export function TrendCharts({ data, isLoading }: TrendChartsProps) {
  if (isLoading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-500">No trend data available yet. Keep tracking your activities!</p>
      </div>
    )
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.flatMap(d => [d.productivityScore, d.wellnessScore, d.growthScore, d.overallScore])
  )
  const scale = maxValue > 0 ? 100 / maxValue : 1

  return (
    <div className="space-y-6">
      {/* Overall Score Trend */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Score Trend</h3>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {data.map((point, index) => {
              const height = (point.overallScore * scale).toFixed(1)
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${formatDate(point.date)}: ${point.overallScore.toFixed(1)}`}
                  />
                  {index % Math.ceil(data.length / 7) === 0 && (
                    <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                      {formatDate(point.date)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Multi-line Comparison */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Comparison</h3>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-700">Productivity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-gray-700">Wellness</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-gray-700">Growth</span>
            </div>
          </div>

          {/* Chart */}
          <div className="relative h-64">
            <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((value) => (
                <g key={value}>
                  <line
                    x1="0"
                    y1={200 - (value * 2)}
                    x2="800"
                    y2={200 - (value * 2)}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x="5"
                    y={200 - (value * 2) - 5}
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {value}
                  </text>
                </g>
              ))}

              {/* Productivity line */}
              <polyline
                points={data.map((point, index) => {
                  const x = (index / (data.length - 1)) * 800
                  const y = 200 - (point.productivityScore * 2)
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />

              {/* Wellness line */}
              <polyline
                points={data.map((point, index) => {
                  const x = (index / (data.length - 1)) * 800
                  const y = 200 - (point.wellnessScore * 2)
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
              />

              {/* Growth line */}
              <polyline
                points={data.map((point, index) => {
                  const x = (index / (data.length - 1)) * 800
                  const y = 200 - (point.growthScore * 2)
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Date labels */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatDate(data[0].date)}</span>
            <span>{formatDate(data[Math.floor(data.length / 2)].date)}</span>
            <span>{formatDate(data[data.length - 1].date)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
