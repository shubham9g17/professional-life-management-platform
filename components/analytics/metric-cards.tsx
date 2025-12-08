'use client'

interface MetricCardProps {
  title: string
  value: number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

export function MetricCard({ title, value, subtitle, trend, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${colorClasses[color].split(' ')[0]}`}>
            {Math.round(value)}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>
      {trend && (
        <div className={`mt-3 flex items-center text-sm ${trendColors[trend.direction]}`}>
          <span className="font-semibold mr-1">{trendIcons[trend.direction]}</span>
          <span className="font-medium">{Math.abs(trend.value).toFixed(1)}%</span>
          <span className="text-gray-500 ml-1">vs last week</span>
        </div>
      )}
    </div>
  )
}

interface MetricCardsGridProps {
  productivityScore: number
  wellnessScore: number
  growthScore: number
  overallScore: number
}

export function MetricCardsGrid({
  productivityScore,
  wellnessScore,
  growthScore,
  overallScore,
}: MetricCardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Overall Score"
        value={overallScore}
        subtitle="Your balanced performance"
        color="blue"
      />
      <MetricCard
        title="Productivity"
        value={productivityScore}
        subtitle="Task completion & efficiency"
        color="green"
      />
      <MetricCard
        title="Wellness"
        value={wellnessScore}
        subtitle="Health & habits"
        color="purple"
      />
      <MetricCard
        title="Growth"
        value={growthScore}
        subtitle="Learning & development"
        color="orange"
      />
    </div>
  )
}
