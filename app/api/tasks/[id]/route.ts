import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { taskRepository } from '@/lib/repositories/task-repository'
import { z } from 'zod'

// Validation schema for task updates
const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  workspace: z.enum(['PROFESSIONAL', 'PERSONAL', 'LEARNING']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  estimatedEffort: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const task = await taskRepository.findById(id, session.user.id)

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Parse tags from JSON string to array
    const taskWithParsedTags = {
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    }

    return NextResponse.json({ task: taskWithParsedTags })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Check if task exists and belongs to user
    const existingTask = await taskRepository.findById(id, session.user.id)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.workspace !== undefined) updateData.workspace = validatedData.workspace
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }
    if (validatedData.estimatedEffort !== undefined) {
      updateData.estimatedEffort = validatedData.estimatedEffort
    }
    if (validatedData.tags !== undefined) {
      updateData.tags = JSON.stringify(validatedData.tags)
    }

    await taskRepository.update(id, session.user.id, updateData)

    // Fetch updated task
    const updatedTask = await taskRepository.findById(id, session.user.id)

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Failed to fetch updated task' },
        { status: 500 }
      )
    }

    // Parse tags back to array for response
    const taskWithParsedTags = {
      ...updatedTask,
      tags: updatedTask.tags ? JSON.parse(updatedTask.tags) : [],
    }

    return NextResponse.json({ task: taskWithParsedTags })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 * Soft delete a task (set status to ARCHIVED)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if task exists and belongs to user
    const existingTask = await taskRepository.findById(id, session.user.id)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    await taskRepository.softDelete(id, session.user.id)

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
