'use client'

import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { TaskCard } from './task-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

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

interface TaskListProps {
  tasks: Task[]
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onComplete?: (taskId: string) => void
  onCreateNew?: () => void
}

const ALL = '__all__'

export function TaskList({ tasks, onEdit, onDelete, onComplete, onCreateNew }: TaskListProps) {
  const [filters, setFilters] = useState({
    workspace: '',
    status: '',
    priority: '',
    search: '',
  })

  const filteredTasks = tasks.filter((task) => {
    if (filters.workspace && task.workspace !== filters.workspace) return false
    if (filters.status && task.status !== filters.status) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  const clearFilters = () => {
    setFilters({ workspace: '', status: '', priority: '', search: '' })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  const handleSelect = (key: 'workspace' | 'status' | 'priority') => (value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === ALL ? '' : value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            {hasActiveFilters && ` (filtered from ${tasks.length})`}
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            New Task
          </Button>
        )}
      </div>

      <div className="bento-card space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Filters</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="search"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workspace">Workspace</Label>
            <Select
              value={filters.workspace || ALL}
              onValueChange={handleSelect('workspace')}
            >
              <SelectTrigger id="workspace">
                <SelectValue placeholder="All Workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Workspaces</SelectItem>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="PERSONAL">Personal</SelectItem>
                <SelectItem value="LEARNING">Learning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || ALL}
              onValueChange={handleSelect('status')}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={filters.priority || ALL}
              onValueChange={handleSelect('priority')}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bento-card flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-base text-muted-foreground">
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </p>
          {!hasActiveFilters && onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Create Your First Task
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
