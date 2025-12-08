'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskBoard } from '@/components/tasks/task-board'
import { TaskList } from '@/components/tasks/task-list'
import { TaskCalendar } from '@/components/tasks/task-calendar'
import { TaskTimeline } from '@/components/tasks/task-timeline'
import { TaskForm, TaskFormData } from '@/components/tasks/task-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Fetch tasks
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (data: TaskFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setTasks([...tasks, result.task])
        setShowForm(false)
        toast({
          title: 'Success',
          description: 'Task created successfully',
        })
      } else {
        throw new Error('Failed to create task')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setTasks(tasks.map(t => t.id === editingTask.id ? result.task : t))
        setEditingTask(null)
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        })
      } else {
        throw new Error('Failed to update task')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== taskId))
        toast({
          title: 'Success',
          description: 'Task deleted successfully',
        })
      } else {
        throw new Error('Failed to delete task')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      })
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        setTasks(tasks.map(t => t.id === taskId ? result.task : t))
        toast({
          title: 'Success',
          description: 'Task completed!',
        })
      } else {
        throw new Error('Failed to complete task')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const result = await response.json()
        setTasks(tasks.map(t => t.id === taskId ? result.task : t))
      } else {
        throw new Error('Failed to update task status')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Tabs defaultValue="board" className="w-full">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-6">
            <TaskBoard
              tasks={tasks}
              onEdit={(task) => setEditingTask(task)}
              onDelete={handleDeleteTask}
              onComplete={handleCompleteTask}
              onStatusChange={handleStatusChange}
              onCreateNew={() => setShowForm(true)}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <TaskList
              tasks={tasks}
              onEdit={(task) => setEditingTask(task)}
              onDelete={handleDeleteTask}
              onComplete={handleCompleteTask}
              onCreateNew={() => setShowForm(true)}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <TaskCalendar
              tasks={tasks}
              onTaskClick={(task) => setEditingTask(task)}
              onCreateNew={() => setShowForm(true)}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <TaskTimeline
              tasks={tasks}
              onTaskClick={(task) => setEditingTask(task)}
              onCreateNew={() => setShowForm(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              onSubmit={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
              initialData={{
                title: editingTask.title,
                description: editingTask.description,
                workspace: editingTask.workspace as any,
                priority: editingTask.priority as any,
                status: editingTask.status as any,
                dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().slice(0, 16) : '',
                estimatedEffort: editingTask.estimatedEffort,
                tags: editingTask.tags,
              }}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
