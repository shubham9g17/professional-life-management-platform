'use client'

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

export function InsightPanel({ insights, isLoading }: InsightPanelProps) {
  if (isLoading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'POSITIVE':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          iconBg: 'bg-green-100',
        }
      case 'IMPROVEMENT':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          iconBg: 'bg-orange-100',
        }
      case 'NEUTRAL':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
        }
    }
  }

  const getTypeIcon = (type: Insight['type']) => {
    switch (type) {
      case 'POSITIVE':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'IMPROVEMENT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'NEUTRAL':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getCategoryBadge = (category: Insight['category']) => {
    const colors = {
      PRODUCTIVITY: 'bg-green-100 text-green-800',
      WELLNESS: 'bg-purple-100 text-purple-800',
      GROWTH: 'bg-orange-100 text-orange-800',
      OVERALL: 'bg-blue-100 text-blue-800',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[category]}`}>
        {category.toLowerCase()}
      </span>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-gray-200 rounded-lg">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <p className="text-gray-500">Keep tracking your activities to generate personalized insights!</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Insights & Recommendations</h3>
        <span className="text-sm text-gray-500">{insights.length} insights</span>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const styles = getTypeStyles(insight.type)
          return (
            <div
              key={index}
              className={`p-4 border rounded-lg ${styles.bg} ${styles.border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${styles.iconBg} ${styles.icon}`}>
                  {getTypeIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    {getCategoryBadge(insight.category)}
                  </div>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                  {insight.metric !== undefined && (
                    <div className="mt-2">
                      <span className="text-lg font-bold text-gray-900">{insight.metric}</span>
                      <span className="text-sm text-gray-600 ml-1">score</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
