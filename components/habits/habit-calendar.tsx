'use client'

interface HabitCalendarProps {
  habits: Array<{
    id: string
    name: string
    completions: Array<{
      id: string
      completedAt: Date
      notes: string | null
    }>
  }>
}

export function HabitCalendar({ habits }: HabitCalendarProps) {
  // Get last 12 weeks (84 days) for a nice calendar view
  const getLastWeeks = (numWeeks: number = 12) => {
    const weeks = []
    const today = new Date()
    
    for (let week = numWeeks - 1; week >= 0; week--) {
      const weekDays = []
      for (let day = 6; day >= 0; day--) {
        const date = new Date(today)
        date.setDate(date.getDate() - (week * 7 + day))
        date.setHours(0, 0, 0, 0)
        weekDays.push(date)
      }
      weeks.push(weekDays)
    }
    
    return weeks
  }

  const weeks = getLastWeeks()

  // Count completions per day across all habits
  const getCompletionCount = (date: Date) => {
    let count = 0
    const dateTime = date.getTime()
    
    habits.forEach(habit => {
      const hasCompletion = habit.completions.some(c => {
        const completionDate = new Date(c.completedAt)
        completionDate.setHours(0, 0, 0, 0)
        return completionDate.getTime() === dateTime
      })
      if (hasCompletion) count++
    })
    
    return count
  }

  // Get color intensity based on completion count
  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-gray-100'
    if (count === 1) return 'bg-green-200'
    if (count === 2) return 'bg-green-400'
    if (count === 3) return 'bg-green-600'
    return 'bg-green-800'
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Habit Calendar</h3>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded" />
            <div className="w-3 h-3 bg-green-200 rounded" />
            <div className="w-3 h-3 bg-green-400 rounded" />
            <div className="w-3 h-3 bg-green-600 rounded" />
            <div className="w-3 h-3 bg-green-800 rounded" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Day labels column */}
          <div className="flex flex-col gap-1 pr-2">
            <div className="h-3" /> {/* Spacer for month labels */}
            {dayLabels.map((day, index) => (
              <div
                key={day}
                className="h-3 text-xs text-gray-500 flex items-center"
              >
                {index % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {/* Month label */}
                <div className="h-3 text-xs text-gray-500">
                  {weekIndex === 0 || week[0].getDate() <= 7
                    ? monthLabels[week[0].getMonth()]
                    : ''}
                </div>
                
                {/* Days in week */}
                {week.map((date, dayIndex) => {
                  const count = getCompletionCount(date)
                  const isToday = date.toDateString() === new Date().toDateString()
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded ${getColorClass(count)} ${
                        isToday ? 'ring-2 ring-blue-500' : ''
                      }`}
                      title={`${date.toLocaleDateString()}: ${count} habit${
                        count !== 1 ? 's' : ''
                      } completed`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Total habits tracked: {habits.length}
      </div>
    </div>
  )
}
