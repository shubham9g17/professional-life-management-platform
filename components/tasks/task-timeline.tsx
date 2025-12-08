'use client'

import { useMemo } from 'react'
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

interface TaskTimelineProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onCreateNew?: () => void
}

const priorityColors = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-400',
  HIGH: 'bg-orange-400',
  URGENT: 'bg-red-400',
}

const statusColors = {
  TODO: 'border-gray-300',
  IN_PROGRESS: 'border-blue-400',
  COMPLETED: 'border-green-400',
  ARCHIVED: 'border-gray-200',
}

export function TaskTimeline({ tasks, onTaskClick, onCreateNew }: TaskTimelineProps) {
  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    
    // Sort tasks by due date
    const sortedTasks = [...tasks]
      .filter(task => task.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!)
        const dateB = new Date(b.dueDate!)
        return dateA.getTime() - dateB.getTime()
      })

    sortedTasks.forEach(task => {
      const date = new Date(task.dueDate!)
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(task)
    })
    
    return Array.from(grouped.entries())
  }, [tasks])

  const isOverdue = (dueDate: Date | string) => {
    return new Date(dueDate) < new Date()
  }

  const isDueSoon = (dueDate: Date | string) => {
    const date = new Date(dueDate)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    return date >= now && date <= tomorrow
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Timeline</h2>
          <p className="text-gray-600 mt-1">
            {tasks.filter(t => t.dueDate).length} tasks with due dates
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            + New Task
          </Button>
        )}
      </div>

      {/* Timeline */}
      {tasksByDate.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500 text-lg">No tasks with due dates</p>
          {onCreateNew && (
            <Button onClick={onCreateNew} className="mt-4">
              Create a Task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {tasksByDate.map(([dateKey, dateTasks]) => {
            const firstTask = dateTasks[0]
            const overdue = isOverdue(firstTask.dueDate!)
            const dueSoon = !overdue && isDueSoon(firstTask.dueDate!)

            return (
              <div key={dateKey} className="relative">
                {/* Date Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={cn(
                      'flex-shrink-0 w-3 h-3 rounded-full',
                      overdue ? 'bg-red-500' : dueSoon ? 'bg-yellow-500' : 'bg-blue-500'
                    )}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {dateKey}
                    </h3>
                    {overdue && (
                      <span className="text-sm text-red-600 font-medium">Overdue</span>
                    )}
                    {dueSoon && (
                      <span className="text-sm text-yellow-600 font-medium">Due Soon</span>
                    )}
                  </div>
                </div>

                {/* Tasks for this date */}
                <div className="ml-8 space-y-3">
                  {dateTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className={cn(
                        'w-full text-left bg-white border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all',
                        statusColors[task.status as keyof typeof statusColors]
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                priorityColors[task.priority as keyof typeof priorityColors]
                              )}
                            />
                            <span className="text-xs text-gray-500 uppercase">
                              {task.workspace}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="font-semibold text-gray-900 mb-1">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className={cn(
                              'px-2 py-1 rounded',
                              task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            )}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.estimatedEffort && (
                              <span>{task.estimatedEffort} min</span>
                            )}
                            {task.tags.length > 0 && (
                              <span>{task.tags.length} tags</span>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-gray-500">
                          {new Date(task.dueDate!).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Connecting line to next date */}
                {tasksByDate.indexOf([dateKey, dateTasks]) < tasksByDate.length - 1 && (
                  <div className="absolute left-[5px] top-12 bottom-0 w-0.5 bg-gray-200" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
