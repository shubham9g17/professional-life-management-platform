'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description?: string
  workspace: string
  priority: string
  status: string
  dueDate?: Date | string
  estimatedEffort?: number
  completedAt?: Date | string
  tags: string[]
  createdAt: Date | string
  updatedAt: Date | string
}

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onCreateNew?: () => void
}

const priorityColors = {
  LOW: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  MEDIUM: 'bg-blue-200 text-blue-900 hover:bg-blue-300 dark:bg-blue-900/50 dark:text-blue-100 dark:hover:bg-blue-900/70',
  HIGH: 'bg-orange-200 text-orange-900 hover:bg-orange-300 dark:bg-orange-900/50 dark:text-orange-100 dark:hover:bg-orange-900/70',
  URGENT: 'bg-red-200 text-red-900 hover:bg-red-300 dark:bg-red-900/50 dark:text-red-100 dark:hover:bg-red-900/70',
}

export function TaskCalendar({ tasks, onTaskClick, onCreateNew }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Get tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const date = new Date(task.dueDate)
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        
        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }
        map.get(dateKey)!.push(task)
      }
    })
    
    return map
  }, [tasks])

  const getTasksForDate = (day: number) => {
    const dateKey = `${year}-${month}-${day}`
    return tasksByDate.get(dateKey) || []
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Generate calendar days
  const calendarDays = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Task Calendar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.filter(t => t.dueDate).length} tasks with due dates
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            + New Task
          </Button>
        )}
      </div>

      {/* Calendar Controls */}
      <div className="bento-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">
            {monthNames[month]} {year}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              ← Previous
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              Next →
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center font-semibold text-muted-foreground py-2 text-sm"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[100px]" />
            }

            const dayTasks = getTasksForDate(day)
            const today = isToday(day)

            return (
              <div
                key={day}
                className={cn(
                  'min-h-[100px] border border-border rounded-lg p-2 bg-card hover:bg-muted/40 transition-colors',
                  today && 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-950/30'
                )}
              >
                <div className={cn(
                  'text-sm font-semibold mb-1',
                  today ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'
                )}>
                  {day}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded text-xs truncate transition-colors',
                        priorityColors[task.priority as keyof typeof priorityColors]
                      )}
                      title={task.title}
                    >
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground px-2">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bento-card p-4">
        <h4 className="font-semibold text-foreground mb-3">Priority Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <span className="text-sm text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900/60 rounded" />
            <span className="text-sm text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-200 dark:bg-orange-900/60 rounded" />
            <span className="text-sm text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 dark:bg-red-900/60 rounded" />
            <span className="text-sm text-muted-foreground">Urgent</span>
          </div>
        </div>
      </div>
    </div>
  )
}
