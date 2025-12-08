'use client'

interface LearningResource {
  category: string
  completionPercentage: number
  type: string
}

interface SkillMatrixProps {
  resources: LearningResource[]
}

export function SkillMatrix({ resources }: SkillMatrixProps) {
  // Group resources by category and calculate proficiency
  const categoryData = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        avgCompletion: 0,
        resources: [],
      }
    }

    acc[resource.category].total++
    acc[resource.category].resources.push(resource)

    if (resource.completionPercentage === 100) {
      acc[resource.category].completed++
    } else if (resource.completionPercentage > 0) {
      acc[resource.category].inProgress++
    }

    return acc
  }, {} as Record<string, any>)

  // Calculate average completion for each category
  Object.keys(categoryData).forEach((category) => {
    const resources = categoryData[category].resources
    const totalCompletion = resources.reduce(
      (sum: number, r: LearningResource) => sum + r.completionPercentage,
      0
    )
    categoryData[category].avgCompletion = Math.round(totalCompletion / resources.length)
  })

  const getProficiencyLevel = (avgCompletion: number) => {
    if (avgCompletion >= 80) return { level: 'Advanced', color: 'bg-green-500' }
    if (avgCompletion >= 50) return { level: 'Intermediate', color: 'bg-blue-500' }
    if (avgCompletion >= 20) return { level: 'Beginner', color: 'bg-yellow-500' }
    return { level: 'Starting', color: 'bg-gray-400' }
  }

  const categories = Object.keys(categoryData).sort(
    (a, b) => categoryData[b].avgCompletion - categoryData[a].avgCompletion
  )

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No learning data available yet.</p>
        <p className="text-sm mt-2">Start adding resources to see your skill matrix!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Knowledge Areas & Proficiency</h3>

      <div className="grid gap-4">
        {categories.map((category) => {
          const data = categoryData[category]
          const proficiency = getProficiencyLevel(data.avgCompletion)

          return (
            <div
              key={category}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{category}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium text-white ${proficiency.color}`}
                    >
                      {proficiency.level}
                    </span>
                    <span className="text-sm text-gray-600">
                      {data.avgCompletion}% proficiency
                    </span>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-600">
                  <div>{data.total} resources</div>
                  <div className="text-green-600">{data.completed} completed</div>
                  <div className="text-blue-600">{data.inProgress} in progress</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${proficiency.color}`}
                  style={{ width: `${data.avgCompletion}%` }}
                />
              </div>

              {/* Resource Types Breakdown */}
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(
                  data.resources.reduce((acc: Record<string, number>, r: LearningResource) => {
                    acc[r.type] = (acc[r.type] || 0) + 1
                    return acc
                  }, {})
                ).map(([type, count]) => (
                  <span
                    key={type}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {count as number} {type.toLowerCase()}
                    {(count as number) !== 1 ? 's' : ''}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
