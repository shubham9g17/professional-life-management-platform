import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface LearningResourceFilters {
  type?: string
  category?: string
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'ALL'
  startDate?: Date
  endDate?: Date
}

export class LearningResourceRepository {
  /**
   * Find all learning resources for a user with optional filtering
   */
  async findByUserId(userId: string, filters?: LearningResourceFilters) {
    const where: Prisma.LearningResourceWhereInput = {
      userId,
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.status) {
      if (filters.status === 'COMPLETED') {
        where.completionPercentage = 100
      } else if (filters.status === 'IN_PROGRESS') {
        where.completionPercentage = { lt: 100 }
      }
    }

    if (filters?.startDate || filters?.endDate) {
      where.startDate = {}
      if (filters.startDate) {
        where.startDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate
      }
    }

    return prisma.learningResource.findMany({
      where,
      orderBy: [
        { completionPercentage: 'asc' },
        { startDate: 'desc' },
      ],
    })
  }

  /**
   * Find a single learning resource by ID
   */
  async findById(id: string, userId: string) {
    return prisma.learningResource.findFirst({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Create a new learning resource
   */
  async create(data: Prisma.LearningResourceCreateInput) {
    return prisma.learningResource.create({
      data,
    })
  }

  /**
   * Update a learning resource
   */
  async update(id: string, userId: string, data: Prisma.LearningResourceUpdateInput) {
    return prisma.learningResource.updateMany({
      where: {
        id,
        userId,
      },
      data,
    })
  }

  /**
   * Delete a learning resource
   */
  async delete(id: string, userId: string) {
    return prisma.learningResource.deleteMany({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Update progress for a learning resource
   * Automatically marks as completed when reaching 100%
   */
  async updateProgress(
    id: string,
    userId: string,
    completionPercentage: number,
    timeInvested?: number
  ) {
    const updateData: Prisma.LearningResourceUpdateInput = {
      completionPercentage,
      updatedAt: new Date(),
    }

    // Add time invested if provided
    if (timeInvested !== undefined) {
      const resource = await this.findById(id, userId)
      if (resource) {
        updateData.timeInvested = resource.timeInvested + timeInvested
      }
    }

    // Mark as completed if reaching 100%
    if (completionPercentage >= 100) {
      updateData.completionPercentage = 100
      updateData.completedAt = new Date()
    }

    return prisma.learningResource.updateMany({
      where: {
        id,
        userId,
      },
      data: updateData,
    })
  }

  /**
   * Get learning statistics for a user
   */
  async getStats(userId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.LearningResourceWhereInput = {
      userId,
    }

    if (startDate || endDate) {
      where.startDate = {}
      if (startDate) {
        where.startDate.gte = startDate
      }
      if (endDate) {
        where.startDate.lte = endDate
      }
    }

    const [
      total,
      completed,
      inProgress,
      byType,
      byCategory,
      totalTimeInvested,
      completedResources,
    ] = await Promise.all([
      prisma.learningResource.count({ where }),
      prisma.learningResource.count({
        where: { ...where, completionPercentage: 100 },
      }),
      prisma.learningResource.count({
        where: { ...where, completionPercentage: { lt: 100 } },
      }),
      prisma.learningResource.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      prisma.learningResource.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      prisma.learningResource.aggregate({
        where,
        _sum: {
          timeInvested: true,
        },
      }),
      prisma.learningResource.findMany({
        where: { ...where, completionPercentage: 100 },
        select: {
          id: true,
          title: true,
          type: true,
          completedAt: true,
          timeInvested: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 10,
      }),
    ])

    return {
      total,
      completed,
      inProgress,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count
        return acc
      }, {} as Record<string, number>),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count
        return acc
      }, {} as Record<string, number>),
      totalTimeInvested: totalTimeInvested._sum.timeInvested || 0,
      recentlyCompleted: completedResources,
    }
  }

  /**
   * Get in-progress resources for a user
   */
  async getInProgress(userId: string) {
    return prisma.learningResource.findMany({
      where: {
        userId,
        completionPercentage: { lt: 100 },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  }

  /**
   * Get completed resources for a user
   */
  async getCompleted(userId: string) {
    return prisma.learningResource.findMany({
      where: {
        userId,
        completionPercentage: 100,
      },
      orderBy: {
        completedAt: 'desc',
      },
    })
  }

  /**
   * Get resources by category
   */
  async getByCategory(userId: string, category: string) {
    return prisma.learningResource.findMany({
      where: {
        userId,
        category,
      },
      orderBy: {
        completionPercentage: 'asc',
      },
    })
  }

  /**
   * Get resources by type
   */
  async getByType(userId: string, type: string) {
    return prisma.learningResource.findMany({
      where: {
        userId,
        type,
      },
      orderBy: {
        completionPercentage: 'asc',
      },
    })
  }
}

// Export a singleton instance
export const learningResourceRepository = new LearningResourceRepository()
