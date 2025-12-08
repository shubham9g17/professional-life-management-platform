import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { taskRepository } from '@/lib/repositories/task-repository'
import { z } from 'zod'
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/error'
import { getOrCreateCorrelationId } from '@/lib/logging/correlation'
import { logger } from '@/lib/logging/logger'
import { auditLogger, AuditAction, AuditResource } from '@/lib/logging/audit'

// Validation schema for task creation
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  workspace: z.enum(['PROFESSIONAL', 'PERSONAL', 'LEARNING']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).default('TODO'),
  dueDate: z.string().datetime().optional(),
  estimatedEffort: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
})

/**
 * GET /api/tasks
 * Get all tasks for the authenticated user with optional filtering
 */
export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request)
  
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      workspace: searchParams.get('workspace') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      startDate: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : undefined,
      endDate: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : undefined,
      tags: searchParams.get('tags')
        ? searchParams.get('tags')!.split(',')
        : undefined,
    }

    logger.info('Fetching tasks', { userId: session.user.id, filters, correlationId })

    const tasks = await taskRepository.findByUserId(session.user.id, filters)

    // Parse tags from JSON string to array
    const tasksWithParsedTags = tasks.map((task: any) => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    }))

    logger.debug('Tasks fetched successfully', { 
      userId: session.user.id, 
      count: tasksWithParsedTags.length,
      correlationId 
    })

    return NextResponse.json({ tasks: tasksWithParsedTags })
  } catch (error) {
    return handleApiError(error, correlationId)
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request)
  
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    
    // Validate request body
    let validatedData
    try {
      validatedData = createTaskSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid task data', { issues: error.issues })
      }
      throw error
    }

    logger.info('Creating task', { 
      userId: session.user.id, 
      workspace: validatedData.workspace,
      correlationId 
    })

    const task = await taskRepository.create({
      title: validatedData.title,
      description: validatedData.description,
      workspace: validatedData.workspace,
      priority: validatedData.priority,
      status: validatedData.status,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      estimatedEffort: validatedData.estimatedEffort,
      tags: JSON.stringify(validatedData.tags),
      user: {
        connect: { id: session.user.id },
      },
    })

    // Audit log
    await auditLogger.logDataAccess(
      session.user.id,
      AuditAction.CREATE,
      AuditResource.TASK,
      task.id,
      { workspace: task.workspace }
    )

    // Parse tags back to array for response
    const taskWithParsedTags = {
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    }

    logger.info('Task created successfully', { 
      userId: session.user.id, 
      taskId: task.id,
      correlationId 
    })

    return NextResponse.json(
      { task: taskWithParsedTags },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, correlationId)
  }
}
