'use client'

interface Achievement {
  id: string
  type: string
  title: string
  description: string
  unlockedAt: Date
  category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'FINANCIAL'
}

interface AchievementDisplayProps {
  achievements: Achievement[]
  isLoading?: boolean
  limit?: number
}

export function AchievementDisplay({ achievements, isLoading, limit }: AchievementDisplayProps) {
  if (isLoading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const displayAchievements = limit ? achievements.slice(0, limit) : achievements

  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'PRODUCTIVITY':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'WELLNESS':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'GROWTH':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'FINANCIAL':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'PRODUCTIVITY':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'WELLNESS':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      case 'GROWTH':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'FINANCIAL':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (displayAchievements.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-gray-200 rounded-lg">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <p className="text-gray-500 mb-2">No achievements yet</p>
        <p className="text-sm text-gray-400">Keep working towards your goals to unlock achievements!</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
        <span className="text-sm text-gray-500">{achievements.length} unlocked</span>
      </div>

      <div className="space-y-4">
        {displayAchievements.map((achievement) => {
          const colorClass = getCategoryColor(achievement.category)
          return (
            <div
              key={achievement.id}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className={`p-3 rounded-full border-2 ${colorClass}`}>
                {getCategoryIcon(achievement.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(achievement.unlockedAt)}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${colorClass}`}>
                    {achievement.category.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {limit && achievements.length > limit && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all {achievements.length} achievements →
          </button>
        </div>
      )}
    </div>
  )
}
