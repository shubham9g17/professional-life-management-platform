'use client'

interface HabitProgressProps {
  habit: {
    id: string
    name: string
    currentStreak: number
    longestStreak: number
    completionRate: number
    completions: Array<{
      id: string
      completedAt: Date
      notes: string | null
    }>
  }
}

export function HabitProgress({ habit }: HabitProgressProps) {
  // Get last 30 days of completions
  const getLast30Days = () => {
    const days = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      days.push(date)
    }
    
    return days
  }

  const last30Days = getLast30Days()
  
  // Create a set of completion dates for quick lookup
  const completionDates = new Set(
    habit.completions.map(c => {
      const date = new Date(c.completedAt)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
  )

  const isCompleted = (date: Date) => {
    return completionDates.has(date.getTime())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{habit.name}</h3>
        <div className="text-sm text-muted-foreground">
          Last 30 Days
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {habit.currentStreak}
          </div>
          <div className="text-xs text-muted-foreground">Current Streak</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {habit.longestStreak}
          </div>
          <div className="text-xs text-muted-foreground">Best Streak</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {habit.completionRate.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Completion Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-1">
        {last30Days.map((date, index) => {
          const completed = isCompleted(date)
          const isToday = date.toDateString() === new Date().toDateString()

          return (
            <div
              key={index}
              className={`aspect-square rounded ${
                completed
                  ? 'bg-green-500 dark:bg-green-600'
                  : isToday
                  ? 'bg-gray-300 dark:bg-gray-700 border-2 border-blue-500'
                  : 'bg-gray-200 dark:bg-gray-800'
              }`}
              title={`${date.toLocaleDateString()} - ${
                completed ? 'Completed' : 'Not completed'
              }`}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}
