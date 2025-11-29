'use client'

interface Exercise {
  date: Date
  duration: number
  activityType: string
  intensity: string
}

interface HealthMetric {
  date: Date
  weight?: number
  sleepQuality?: number
  stressLevel?: number
  energyLevel?: number
}

interface FitnessChartsProps {
  exercises: Exercise[]
  healthMetrics: HealthMetric[]
}

export function FitnessCharts({ exercises, healthMetrics }: FitnessChartsProps) {
  // Group exercises by date
  const exercisesByDate = exercises.reduce((acc, exercise) => {
    const dateKey = new Date(exercise.date).toLocaleDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = { duration: 0, count: 0 }
    }
    acc[dateKey].duration += exercise.duration
    acc[dateKey].count += 1
    return acc
  }, {} as Record<string, { duration: number; count: number }>)

  // Group exercises by activity type
  const exercisesByType = exercises.reduce((acc, exercise) => {
    acc[exercise.activityType] = (acc[exercise.activityType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group exercises by intensity
  const exercisesByIntensity = exercises.reduce((acc, exercise) => {
    acc[exercise.intensity] = (acc[exercise.intensity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Exercise Duration Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Exercise Duration Trend</h3>
        <div className="space-y-2">
          {Object.entries(exercisesByDate)
            .slice(-7)
            .map(([date, data]) => (
              <div key={date} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">{date}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(100, (data.duration / 120) * 100)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{data.duration} min</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Activity Type Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Type Distribution</h3>
        <div className="space-y-3">
          {Object.entries(exercisesByType).map(([type, count]) => {
            const total = exercises.length
            const percentage = (count / total) * 100
            return (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{type}</span>
                  <span className="font-semibold">{count} workouts</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Intensity Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Intensity Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(exercisesByIntensity).map(([intensity, count]) => (
            <div key={intensity} className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">{intensity}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Health Metrics Trends */}
      {healthMetrics.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Health Metrics Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight Trend */}
            {healthMetrics.some((m) => m.weight) && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Weight (kg)</h4>
                <div className="space-y-1">
                  {healthMetrics
                    .filter((m) => m.weight)
                    .slice(-7)
                    .map((metric, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 w-20">
                          {new Date(metric.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="font-medium">{metric.weight} kg</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sleep Quality Trend */}
            {healthMetrics.some((m) => m.sleepQuality) && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Sleep Quality</h4>
                <div className="space-y-1">
                  {healthMetrics
                    .filter((m) => m.sleepQuality)
                    .slice(-7)
                    .map((metric, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-20">
                          {new Date(metric.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-purple-500 h-4 rounded-full"
                            style={{ width: `${(metric.sleepQuality! / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{metric.sleepQuality}/10</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
