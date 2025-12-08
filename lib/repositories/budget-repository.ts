import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { transactionRepository } from './transaction-repository'

export interface BudgetWithSpending {
  id: string
  userId: string
  category: string
  monthlyLimit: number
  alertThreshold: number
  createdAt: Date
  updatedAt: Date
  currentSpending: number
  percentageUsed: number
  isOverThreshold: boolean
  isOverBudget: boolean
}

export class BudgetRepository {
  /**
   * Find all budgets for a user
   */
  async findByUserId(userId: string) {
    return prisma.budget.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    })
  }

  /**
   * Find a single budget by ID
   */
  async findById(id: string, userId: string) {
    return prisma.budget.findFirst({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Find a budget by category
   */
  async findByCategory(userId: string, category: string) {
    return prisma.budget.findFirst({
      where: {
        userId,
        category,
      },
    })
  }

  /**
   * Create a new budget
   */
  async create(data: Prisma.BudgetCreateInput) {
    return prisma.budget.create({
      data,
    })
  }

  /**
   * Update a budget
   */
  async update(id: string, userId: string, data: Prisma.BudgetUpdateInput) {
    return prisma.budget.updateMany({
      where: {
        id,
        userId,
      },
      data,
    })
  }

  /**
   * Delete a budget
   */
  async delete(id: string, userId: string) {
    return prisma.budget.deleteMany({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Get budget with current spending and threshold status
   */
  async getBudgetWithSpending(
    budgetId: string,
    userId: string
  ): Promise<BudgetWithSpending | null> {
    const budget = await this.findById(budgetId, userId)
    
    if (!budget) {
      return null
    }

    // Get current month's date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get spending for this category in current month
    const currentSpending = await transactionRepository.getCategorySpending(
      userId,
      budget.category,
      startOfMonth,
      endOfMonth
    )

    // Calculate percentage used
    const percentageUsed = budget.monthlyLimit > 0 
      ? (currentSpending / budget.monthlyLimit) * 100 
      : 0

    // Check threshold status
    const isOverThreshold = percentageUsed >= budget.alertThreshold
    const isOverBudget = currentSpending >= budget.monthlyLimit

    return {
      ...budget,
      currentSpending,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      isOverThreshold,
      isOverBudget,
    }
  }

  /**
   * Get all budgets with spending data for a user
   */
  async getAllBudgetsWithSpending(userId: string): Promise<BudgetWithSpending[]> {
    const budgets = await this.findByUserId(userId)

    // Get current month's date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const currentSpending = await transactionRepository.getCategorySpending(
          userId,
          budget.category,
          startOfMonth,
          endOfMonth
        )

        const percentageUsed = budget.monthlyLimit > 0 
          ? (currentSpending / budget.monthlyLimit) * 100 
          : 0

        const isOverThreshold = percentageUsed >= budget.alertThreshold
        const isOverBudget = currentSpending >= budget.monthlyLimit

        return {
          ...budget,
          currentSpending,
          percentageUsed: Math.round(percentageUsed * 100) / 100,
          isOverThreshold,
          isOverBudget,
        }
      })
    )

    return budgetsWithSpending
  }

  /**
   * Check if any budgets are over their alert threshold
   * Returns budgets that need alerts
   */
  async checkBudgetThresholds(userId: string): Promise<BudgetWithSpending[]> {
    const budgetsWithSpending = await this.getAllBudgetsWithSpending(userId)
    
    // Filter to only budgets that are over threshold
    return budgetsWithSpending.filter(budget => budget.isOverThreshold)
  }

  /**
   * Get budgets that are over their monthly limit
   */
  async getOverBudgetCategories(userId: string): Promise<BudgetWithSpending[]> {
    const budgetsWithSpending = await this.getAllBudgetsWithSpending(userId)
    
    // Filter to only budgets that are over limit
    return budgetsWithSpending.filter(budget => budget.isOverBudget)
  }
}

// Export a singleton instance
export const budgetRepository = new BudgetRepository()
