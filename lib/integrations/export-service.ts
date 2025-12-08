import { prisma } from '../prisma'

export type ExportFormat = 'CSV' | 'JSON' | 'PDF'

export interface ExportOptions {
  userId: string
  format: ExportFormat
  entities?: string[] // Specific entities to export (tasks, habits, etc.)
  startDate?: Date
  endDate?: Date
}

/**
 * Service for exporting user data in various formats
 */
export class ExportService {
  /**
   * Export user data in the specified format
   */
  async exportData(options: ExportOptions): Promise<string | Buffer> {
    const data = await this.collectUserData(options)

    switch (options.format) {
      case 'JSON':
        return this.exportAsJSON(data)
      case 'CSV':
        return this.exportAsCSV(data)
      case 'PDF':
        return this.exportAsPDF(data)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * Collect user data based on export options
   */
  private async collectUserData(options: ExportOptions) {
    const { userId, entities, startDate, endDate } = options
    const data: any = {}

    const dateFilter = startDate && endDate
      ? {
          gte: startDate,
          lte: endDate,
        }
      : undefined

    // Collect user profile
    if (!entities || entities.includes('profile')) {
      data.profile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          theme: true,
          timezone: true,
          createdAt: true,
        },
      })
    }

    // Collect tasks
    if (!entities || entities.includes('tasks')) {
      data.tasks = await prisma.task.findMany({
        where: {
          userId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    // Collect habits
    if (!entities || entities.includes('habits')) {
      data.habits = await prisma.habit.findMany({
        where: { userId },
        include: {
          completions: dateFilter
            ? {
                where: { completedAt: dateFilter },
                orderBy: { completedAt: 'desc' },
              }
            : { orderBy: { completedAt: 'desc' } },
        },
      })
    }

    // Collect transactions
    if (!entities || entities.includes('transactions')) {
      data.transactions = await prisma.transaction.findMany({
        where: {
          userId,
          ...(dateFilter && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      })
    }

    // Collect budgets
    if (!entities || entities.includes('budgets')) {
      data.budgets = await prisma.budget.findMany({
        where: { userId },
      })
    }

    // Collect exercises
    if (!entities || entities.includes('exercises')) {
      data.exercises = await prisma.exercise.findMany({
        where: {
          userId,
          ...(dateFilter && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      })
    }

    // Collect health metrics
    if (!entities || entities.includes('healthMetrics')) {
      data.healthMetrics = await prisma.healthMetric.findMany({
        where: {
          userId,
          ...(dateFilter && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      })
    }

    // Collect fitness goals
    if (!entities || entities.includes('fitnessGoals')) {
      data.fitnessGoals = await prisma.fitnessGoal.findMany({
        where: { userId },
      })
    }

    // Collect meals
    if (!entities || entities.includes('meals')) {
      data.meals = await prisma.meal.findMany({
        where: {
          userId,
          ...(dateFilter && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      })
    }

    // Collect water intake
    if (!entities || entities.includes('waterIntake')) {
      data.waterIntake = await prisma.waterIntake.findMany({
        where: {
          userId,
          ...(dateFilter && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      })
    }

    // Collect learning resources
    if (!entities || entities.includes('learningResources')) {
      data.learningResources = await prisma.learningResource.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    }

    // Collect daily metrics
    if (!entities || entities.includes('dailyMetrics')) {
      data.dailyMetrics = await prisma.dailyMetrics.findMany({
        where: {
          userId,
          ...(dateFilter && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      })
    }

    // Collect achievements
    if (!entities || entities.includes('achievements')) {
      data.achievements = await prisma.achievement.findMany({
        where: {
          userId,
          ...(dateFilter && { unlockedAt: dateFilter }),
        },
        orderBy: { unlockedAt: 'desc' },
      })
    }

    return data
  }

  /**
   * Export data as JSON
   */
  private exportAsJSON(data: any): string {
    return JSON.stringify(data, null, 2)
  }

  /**
   * Export data as CSV
   */
  private exportAsCSV(data: any): string {
    const csvParts: string[] = []

    // Helper function to convert array of objects to CSV
    const arrayToCSV = (arr: any[], title: string): string => {
      if (!arr || arr.length === 0) return ''

      const headers = Object.keys(arr[0])
      const rows = arr.map(obj =>
        headers.map(header => {
          const value = obj[header]
          // Handle special cases
          if (value === null || value === undefined) return ''
          if (typeof value === 'object') return JSON.stringify(value)
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )

      return `\n# ${title}\n${headers.join(',')}\n${rows.join('\n')}`
    }

    // Export each entity type
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        csvParts.push(arrayToCSV(value, key))
      } else if (value && typeof value === 'object') {
        // For single objects like profile
        csvParts.push(arrayToCSV([value], key))
      }
    }

    return csvParts.join('\n\n')
  }

  /**
   * Export data as PDF
   * Note: This is a placeholder. In production, you'd use a library like pdfkit or puppeteer
   */
  private exportAsPDF(data: any): Buffer {
    // For now, return a simple text representation
    // In production, use a proper PDF generation library
    const text = `
Professional Life Management Platform
Data Export Report
Generated: ${new Date().toISOString()}

${JSON.stringify(data, null, 2)}
    `

    return Buffer.from(text, 'utf-8')
  }

  /**
   * Get export filename
   */
  getExportFilename(format: ExportFormat, userId: string): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const extension = format.toLowerCase()
    return `plmp-export-${userId}-${timestamp}.${extension}`
  }

  /**
   * Get content type for format
   */
  getContentType(format: ExportFormat): string {
    switch (format) {
      case 'JSON':
        return 'application/json'
      case 'CSV':
        return 'text/csv'
      case 'PDF':
        return 'application/pdf'
      default:
        return 'application/octet-stream'
    }
  }
}

export const exportService = new ExportService()
