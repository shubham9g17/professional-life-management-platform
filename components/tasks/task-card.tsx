'use client'

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

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onComplete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: string) => void
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  URGENT: 'bg-red-100 text-red-800 border-red-300',
}

const workspaceColors = {
  PROFESSIONAL: 'bg-purple-100 text-purple-800',
  PERSONAL: 'bg-green-100 text-green-800',
  LEARNING: 'bg-yellow-100 text-yellow-800',
}

const statusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-500',
}

export function TaskCard({ task, onEdit, onDelete, onComplete, onStatusChange }: TaskCardProps) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'COMPLETED'
  const isDueSoon = dueDate && !isOverdue && dueDate < new Date(Date.now() + 24 * 60 * 60 * 1000)

  return (
    <div
      className={cn(
        'bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow',
        isOverdue && 'border-red-300 bg-red-50',
        isDueSoon && 'border-yellow-300 bg-yellow-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                workspaceColors[task.workspace as keyof typeof workspaceColors]
              )}
            >
              {task.workspace}
            </span>
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-medium border',
                priorityColors[task.priority as keyof typeof priorityColors]
              )}
            >
              {task.priority}
            </span>
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                statusColors[task.status as keyof typeof statusColors]
              )}
            >
              {task.status.replace('_', ' ')}
            </span>
          </div>

          <h3 className="font-semibold text-lg mb-1 text-gray-900">{task.title}</h3>
          
          {task.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
            {dueDate && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Due:</span>
                <span className={cn(isOverdue && 'text-red-600 font-semibold')}>
                  {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {task.estimatedEffort && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Effort:</span>
                <span>{task.estimatedEffort} min</span>
              </div>
            )}
          </div>

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {task.status !== 'COMPLETED' && onComplete && (
            <Button
              size="sm"
              onClick={() => onComplete(task.id)}
              className="whitespace-nowrap"
            >
              Complete
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(task)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(task.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {isOverdue && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
          ⚠️ This task is overdue
        </div>
      )}
      {isDueSoon && (
        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
          ⏰ Due within 24 hours
        </div>
      )}
    </div>
  )
}
