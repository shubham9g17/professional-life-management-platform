import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface TransactionFilters {
  type?: 'INCOME' | 'EXPENSE'
  category?: string
  startDate?: Date
  endDate?: Date
  tags?: string[]
}

export interface TransactionStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  byCategory: Record<string, number>
  byMonth: Array<{
    month: string
    income: number
    expenses: number
    balance: number
  }>
}

export class TransactionRepository {
  /**
   * Find all transactions for a user with optional filtering
   */
  async findByUserId(userId: string, filters?: TransactionFilters) {
    const where: Prisma.TransactionWhereInput = {
      userId,
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = filters.startDate
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate
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

    return prisma.transaction.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    })
  }

  /**
   * Find a single transaction by ID
   */
  async findById(id: string, userId: string) {
    return prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Create a new transaction
   */
  async create(data: Prisma.TransactionCreateInput) {
    return prisma.transaction.create({
      data,
    })
  }

  /**
   * Update a transaction
   */
  async update(id: string, userId: string, data: Prisma.TransactionUpdateInput) {
    return prisma.transaction.updateMany({
      where: {
        id,
        userId,
      },
      data,
    })
  }

  /**
   * Delete a transaction
   */
  async delete(id: string, userId: string) {
    return prisma.transaction.deleteMany({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Calculate balance for a user
   * Balance = Total Income - Total Expenses
   */
  async calculateBalance(userId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const where: Prisma.TransactionWhereInput = {
      userId,
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = startDate
      }
      if (endDate) {
        where.date.lte = endDate
      }
    }

    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ])

    const totalIncome = income._sum.amount || 0
    const totalExpenses = expenses._sum.amount || 0

    return totalIncome - totalExpenses
  }

  /**
   * Get transaction statistics for a user
   */
  async getStats(userId: string, startDate?: Date, endDate?: Date): Promise<TransactionStats> {
    const where: Prisma.TransactionWhereInput = {
      userId,
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = startDate
      }
      if (endDate) {
        where.date.lte = endDate
      }
    }

    const [income, expenses, byCategory, transactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['category', 'type'],
        where,
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where,
        select: {
          date: true,
          amount: true,
          type: true,
        },
        orderBy: { date: 'asc' },
      }),
    ])

    const totalIncome = income._sum.amount || 0
    const totalExpenses = expenses._sum.amount || 0
    const balance = totalIncome - totalExpenses

    // Group by category
    const categoryMap: Record<string, number> = {}
    byCategory.forEach(item => {
      const amount = item._sum.amount || 0
      const key = item.category
      if (!categoryMap[key]) {
        categoryMap[key] = 0
      }
      // For expenses, store as positive number for display
      categoryMap[key] += item.type === 'EXPENSE' ? amount : -amount
    })

    // Group by month
    const monthMap: Record<string, { income: number; expenses: number }> = {}
    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { income: 0, expenses: 0 }
      }
      if (t.type === 'INCOME') {
        monthMap[monthKey].income += t.amount
      } else {
        monthMap[monthKey].expenses += t.amount
      }
    })

    const byMonth = Object.entries(monthMap)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        balance: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      totalIncome,
      totalExpenses,
      balance,
      byCategory: categoryMap,
      byMonth,
    }
  }

  /**
   * Get transactions by category
   */
  async getByCategory(userId: string, category: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      category,
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = startDate
      }
      if (endDate) {
        where.date.lte = endDate
      }
    }

    return prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    })
  }

  /**
   * Get spending for a specific category in a date range
   */
  async getCategorySpending(
    userId: string,
    category: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        category,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    })

    return result._sum.amount || 0
  }
}

// Export a singleton instance
export const transactionRepository = new TransactionRepository()
