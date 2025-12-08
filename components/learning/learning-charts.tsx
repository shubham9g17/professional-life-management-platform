'use client'

interface LearningResource {
  type: string
  category: string
  completionPercentage: number
  timeInvested: number
  startDate: string
  completedAt?: string | null
}

interface LearningChartsProps {
  resources: LearningResource[]
}

export function LearningCharts({ resources }: LearningChartsProps) {
  // Calculate type distribution
  const typeDistribution = resources.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate completion status
  const completionStatus = {
    completed: resources.filter((r) => r.completionPercentage === 100).length,
    inProgress: resources.filter((r) => r.completionPercentage > 0 && r.completionPercentage < 100)
      .length,
    notStarted: resources.filter((r) => r.completionPercentage === 0).length,
  }

  // Calculate time invested by category
  const timeByCategory = resources.reduce((acc, resource) => {
    acc[resource.category] = (acc[resource.category] || 0) + resource.timeInvested
    return acc
  }, {} as Record<string, number>)

  // Calculate monthly completions
  const monthlyCompletions = resources
    .filter((r) => r.completedAt)
    .reduce((acc, resource) => {
      const month = new Date(resource.completedAt!).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BOOK':
        return 'bg-blue-500'
      case 'COURSE':
        return 'bg-green-500'
      case 'CERTIFICATION':
        return 'bg-purple-500'
      case 'ARTICLE':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No learning data available yet.</p>
        <p className="text-sm mt-2">Start adding resources to see your progress!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Type Distribution */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Resources by Type</h3>
        <div className="space-y-3">
          {Object.entries(typeDistribution).map(([type, count]) => {
            const percentage = (count / resources.length) * 100
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{type}</span>
                  <span className="text-sm text-gray-600">
                    {count} ({Math.round(percentage)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getTypeColor(type)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Completion Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Completion Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {completionStatus.completed}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {completionStatus.inProgress}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {completionStatus.notStarted}
            </div>
            <div className="text-sm text-gray-600">Not Started</div>
          </div>
        </div>
      </div>

      {/* Time Investment by Category */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Time Investment by Category</h3>
        <div className="space-y-3">
          {Object.entries(timeByCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([category, time]) => {
              const totalTime = Object.values(timeByCategory).reduce((a, b) => a + b, 0)
              const percentage = (time / totalTime) * 100
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm text-gray-600">
                      {formatTime(time)} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Monthly Completions */}
      {Object.keys(monthlyCompletions).length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Completions Over Time</h3>
          <div className="space-y-3">
            {Object.entries(monthlyCompletions)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([month, count]) => {
                const maxCount = Math.max(...Object.values(monthlyCompletions))
                const percentage = (count / maxCount) * 100
                return (
                  <div key={month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{month}</span>
                      <span className="text-sm text-gray-600">{count} completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
