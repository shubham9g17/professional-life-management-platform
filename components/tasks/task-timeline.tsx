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
  LOW: 'bg-gray-400 dark:bg-gray-500',
  MEDIUM: 'bg-blue-400 dark:bg-blue-500',
  HIGH: 'bg-orange-400 dark:bg-orange-500',
  URGENT: 'bg-red-400 dark:bg-red-500',
}

const statusColors = {
  TODO: 'border-l-gray-300 dark:border-l-gray-600',
  IN_PROGRESS: 'border-l-blue-400 dark:border-l-blue-500',
  COMPLETED: 'border-l-green-400 dark:border-l-green-500',
  ARCHIVED: 'border-l-gray-200 dark:border-l-gray-700',
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Task Timeline</h2>
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

      {/* Timeline */}
      {tasksByDate.length === 0 ? (
        <div className="bento-card text-center py-12">
          <p className="text-muted-foreground text-lg">No tasks with due dates</p>
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
                    <h3 className="text-lg font-semibold text-foreground">
                      {dateKey}
                    </h3>
                    {overdue && (
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">Overdue</span>
                    )}
                    {dueSoon && (
                      <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Due Soon</span>
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
                        'w-full text-left bg-card border border-border border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all',
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
                            <span className="text-xs text-muted-foreground uppercase">
                              {task.workspace}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="font-semibold text-foreground mb-1">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className={cn(
                              'px-2 py-1 rounded',
                              task.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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

                        <div className="text-sm text-muted-foreground">
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
                  <div className="absolute left-[5px] top-12 bottom-0 w-0.5 bg-border" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
