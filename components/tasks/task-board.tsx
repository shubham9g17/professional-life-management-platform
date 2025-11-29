'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './task-card'
import { Button } from '@/components/ui/button'

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

interface TaskBoardProps {
  tasks: Task[]
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onComplete?: (taskId: string) => void
  onStatusChange?: (taskId: string, newStatus: string) => void
  onCreateNew?: () => void
}

const columns = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-green-100' },
]

export function TaskBoard({ tasks, onEdit, onDelete, onComplete, onStatusChange, onCreateNew }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    // Check if dropped on a column
    if (columns.some(col => col.id === newStatus)) {
      const task = tasks.find(t => t.id === taskId)
      if (task && task.status !== newStatus && onStatusChange) {
        onStatusChange(taskId, newStatus)
      }
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Board</h2>
          <p className="text-gray-600 mt-1">{tasks.length} total tasks</p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            + New Task
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            
            return (
              <div
                key={column.id}
                className="flex flex-col bg-white border rounded-lg overflow-hidden"
              >
                {/* Column Header */}
                <div className={`${column.color} px-4 py-3 border-b`}>
                  <h3 className="font-semibold text-gray-900">
                    {column.title}
                    <span className="ml-2 text-sm text-gray-600">
                      ({columnTasks.length})
                    </span>
                  </h3>
                </div>

                {/* Column Content */}
                <SortableContext
                  items={columnTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                  id={column.id}
                >
                  <div className="flex-1 p-4 space-y-3 min-h-[200px]">
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No tasks
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          data-task-id={task.id}
                          className="cursor-move"
                        >
                          <TaskCard
                            task={task}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onComplete={onComplete}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-80">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
