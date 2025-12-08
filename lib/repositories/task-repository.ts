import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface TaskFilters {
  workspace?: string
  status?: string
  startDate?: Date
  endDate?: Date
  priority?: string
  tags?: string[]
}

export class TaskRepository {
  /**
   * Find all tasks for a user with optional filtering
   */
  async findByUserId(userId: string, filters?: TaskFilters) {
    const where: Prisma.TaskWhereInput = {
      userId,
      status: { not: 'ARCHIVED' }, // Exclude soft-deleted tasks by default
    }

    if (filters?.workspace) {
      where.workspace = filters.workspace
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {}
      if (filters.startDate) {
        where.dueDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.dueDate.lte = filters.endDate
      }
    }

    // Filter by tags if provided
    if (filters?.tags && filters.tags.length > 0) {
      where.OR = filters.tags.map(tag => ({
        tags: {
          contains: tag
        }
      }))
    }

    return prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    })
  }

  /**
   * Find a single task by ID
   */
  async findById(id: string, userId: string) {
    return prisma.task.findFirst({
      where: {
        id,
        userId,
        status: { not: 'ARCHIVED' },
      },
    })
  }

  /**
   * Create a new task
   */
  async create(data: Prisma.TaskCreateInput) {
    return prisma.task.create({
      data,
    })
  }

  /**
   * Update a task
   */
  async update(id: string, userId: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.updateMany({
      where: {
        id,
        userId,
        status: { not: 'ARCHIVED' },
      },
      data,
    })
  }

  /**
   * Soft delete a task by setting status to ARCHIVED
   */
  async softDelete(id: string, userId: string) {
    return prisma.task.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        status: 'ARCHIVED',
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Mark a task as completed
   */
  async complete(id: string, userId: string) {
    return prisma.task.updateMany({
      where: {
        id,
        userId,
        status: { not: 'ARCHIVED' },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Get task statistics for a user
   */
  async getStats(userId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.TaskWhereInput = {
      userId,
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    const [total, completed, inProgress, todo, byWorkspace] = await Promise.all([
      prisma.task.count({ where: { ...where, status: { not: 'ARCHIVED' } } }),
      prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...where, status: 'TODO' } }),
      prisma.task.groupBy({
        by: ['workspace'],
        where: { ...where, status: { not: 'ARCHIVED' } },
        _count: true,
      }),
    ])

    return {
      total,
      completed,
      inProgress,
      todo,
      byWorkspace: byWorkspace.reduce((acc, item) => {
        acc[item.workspace] = item._count
        return acc
      }, {} as Record<string, number>),
    }
  }

  /**
   * Get overdue tasks for a user
   */
  async getOverdue(userId: string) {
    return prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueDate: {
          lt: new Date(),
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })
  }

  /**
   * Get tasks due soon (within next 24 hours)
   */
  async getDueSoon(userId: string) {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    return prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })
  }
}

// Export a singleton instance
export const taskRepository = new TaskRepository()
