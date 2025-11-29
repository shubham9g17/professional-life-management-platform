# Task Management Components

This directory contains all the UI components and utilities for the task management module.

## Components

### TaskForm
A comprehensive form for creating and editing tasks with workspace selection, priority, status, due dates, and tags.

**Props:**
- `onSubmit: (task: TaskFormData) => void` - Callback when form is submitted
- `onCancel?: () => void` - Optional callback for cancel action
- `initialData?: Partial<TaskFormData>` - Initial form data for editing
- `isLoading?: boolean` - Loading state

### TaskCard
Displays a single task with all its details, actions, and visual indicators for overdue/due soon tasks.

**Props:**
- `task: Task` - The task to display
- `onEdit?: (task: Task) => void` - Callback for edit action
- `onDelete?: (taskId: string) => void` - Callback for delete action
- `onComplete?: (taskId: string) => void` - Callback for complete action
- `onStatusChange?: (taskId: string, status: string) => void` - Callback for status changes

### TaskList
A filterable list view of tasks with search and filter capabilities.

**Props:**
- `tasks: Task[]` - Array of tasks to display
- `onEdit?: (task: Task) => void` - Callback for edit action
- `onDelete?: (taskId: string) => void` - Callback for delete action
- `onComplete?: (taskId: string) => void` - Callback for complete action
- `onCreateNew?: () => void` - Callback for creating new task

**Features:**
- Search by title, description, or tags
- Filter by workspace, status, and priority
- Clear all filters button
- Empty state with call-to-action

### TaskBoard
A Kanban-style board with drag-and-drop functionality for managing tasks across different statuses.

**Props:**
- `tasks: Task[]` - Array of tasks to display
- `onEdit?: (task: Task) => void` - Callback for edit action
- `onDelete?: (taskId: string) => void` - Callback for delete action
- `onComplete?: (taskId: string) => void` - Callback for complete action
- `onStatusChange?: (taskId: string, newStatus: string) => void` - Callback when task is dragged to new status
- `onCreateNew?: () => void` - Callback for creating new task

**Features:**
- Three columns: To Do, In Progress, Completed
- Drag and drop tasks between columns
- Visual feedback during drag
- Task count per column

### TaskCalendar
A monthly calendar view showing tasks on their due dates.

**Props:**
- `tasks: Task[]` - Array of tasks to display
- `onTaskClick?: (task: Task) => void` - Callback when task is clicked
- `onCreateNew?: () => void` - Callback for creating new task

**Features:**
- Monthly calendar view
- Navigate between months
- "Today" quick navigation
- Color-coded by priority
- Shows up to 3 tasks per day with overflow indicator
- Highlights today's date

### TaskTimeline
A chronological timeline view of tasks organized by due date.

**Props:**
- `tasks: Task[]` - Array of tasks to display
- `onTaskClick?: (task: Task) => void` - Callback when task is clicked
- `onCreateNew?: () => void` - Callback for creating new task

**Features:**
- Chronological ordering by due date
- Visual indicators for overdue and due soon
- Grouped by date
- Shows time of day for each task
- Status and priority indicators

## API Endpoints

### GET /api/tasks
Get all tasks for authenticated user with optional filtering.

**Query Parameters:**
- `workspace` - Filter by workspace (PROFESSIONAL, PERSONAL, LEARNING)
- `status` - Filter by status (TODO, IN_PROGRESS, COMPLETED, ARCHIVED)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `startDate` - Filter by due date range start (ISO date string)
- `endDate` - Filter by due date range end (ISO date string)
- `tags` - Filter by tags (comma-separated)

### POST /api/tasks
Create a new task.

**Body:**
```json
{
  "title": "Task title",
  "description": "Optional description",
  "workspace": "PROFESSIONAL",
  "priority": "MEDIUM",
  "status": "TODO",
  "dueDate": "2024-12-31T23:59:59Z",
  "estimatedEffort": 60,
  "tags": ["tag1", "tag2"]
}
```

### GET /api/tasks/[id]
Get a single task by ID.

### PATCH /api/tasks/[id]
Update a task.

**Body:** Same as POST, all fields optional

### DELETE /api/tasks/[id]
Soft delete a task (sets status to ARCHIVED).

### POST /api/tasks/[id]/complete
Mark a task as completed and update productivity metrics.

## Repository

The `TaskRepository` class in `lib/repositories/task-repository.ts` provides data access methods:

- `findByUserId(userId, filters?)` - Get all tasks for a user with optional filtering
- `findById(id, userId)` - Get a single task
- `create(data)` - Create a new task
- `update(id, userId, data)` - Update a task
- `softDelete(id, userId)` - Soft delete a task
- `complete(id, userId)` - Mark task as completed
- `getStats(userId, startDate?, endDate?)` - Get task statistics
- `getOverdue(userId)` - Get overdue tasks
- `getDueSoon(userId)` - Get tasks due within 24 hours

## Reminder Logic

The `lib/tasks/reminder-logic.ts` module provides intelligent reminder scheduling based on task priority:

- **URGENT**: Reminders at 24h, 12h, 6h, 3h, 1h, 30min before due
- **HIGH**: Reminders at 24h, 12h, 3h, 1h before due
- **MEDIUM**: Reminders at 24h, 6h before due
- **LOW**: Reminder at 24h before due

**Functions:**
- `calculateReminderSchedule(task)` - Get all reminder times for a task
- `getNextReminderTime(task)` - Get the next reminder time
- `shouldSendReminder(task, lastReminderSent?)` - Check if reminder should be sent
- `getTasksNeedingReminders(tasks, lastReminderTimes)` - Get all tasks needing reminders

## Usage Example

```tsx
'use client'

import { useState } from 'react'
import { TaskList, TaskForm, TaskBoard, TaskCalendar, TaskTimeline } from '@/components/tasks'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [view, setView] = useState<'list' | 'board' | 'calendar' | 'timeline'>('list')
  const [showForm, setShowForm] = useState(false)

  const handleCreateTask = async (taskData) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    })
    const { task } = await response.json()
    setTasks([...tasks, task])
    setShowForm(false)
  }

  const handleCompleteTask = async (taskId) => {
    await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' })
    // Refresh tasks
  }

  const handleDeleteTask = async (taskId) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  return (
    <div>
      {/* View switcher */}
      <div className="mb-4">
        <button onClick={() => setView('list')}>List</button>
        <button onClick={() => setView('board')}>Board</button>
        <button onClick={() => setView('calendar')}>Calendar</button>
        <button onClick={() => setView('timeline')}>Timeline</button>
      </div>

      {/* Render appropriate view */}
      {view === 'list' && (
        <TaskList
          tasks={tasks}
          onComplete={handleCompleteTask}
          onDelete={handleDeleteTask}
          onCreateNew={() => setShowForm(true)}
        />
      )}
      {view === 'board' && (
        <TaskBoard
          tasks={tasks}
          onComplete={handleCompleteTask}
          onDelete={handleDeleteTask}
          onCreateNew={() => setShowForm(true)}
        />
      )}
      {view === 'calendar' && (
        <TaskCalendar
          tasks={tasks}
          onCreateNew={() => setShowForm(true)}
        />
      )}
      {view === 'timeline' && (
        <TaskTimeline
          tasks={tasks}
          onCreateNew={() => setShowForm(true)}
        />
      )}

      {/* Task form modal */}
      {showForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
```

## Color Coding

### Priority Colors
- **LOW**: Gray
- **MEDIUM**: Blue
- **HIGH**: Orange
- **URGENT**: Red

### Workspace Colors
- **PROFESSIONAL**: Purple
- **PERSONAL**: Green
- **LEARNING**: Yellow

### Status Colors
- **TODO**: Gray
- **IN_PROGRESS**: Blue
- **COMPLETED**: Green
- **ARCHIVED**: Light gray

## Features Implemented

✅ Task creation with workspace categorization
✅ Task filtering by workspace, status, priority, date range, and tags
✅ Soft delete functionality (ARCHIVED status)
✅ Task completion with automatic metrics update
✅ Multiple view options (List, Board, Calendar, Timeline)
✅ Drag-and-drop Kanban board
✅ Calendar view with monthly navigation
✅ Timeline view with chronological ordering
✅ Intelligent reminder scheduling based on priority
✅ Overdue and due soon indicators
✅ Tag management
✅ Estimated effort tracking
✅ Responsive design
