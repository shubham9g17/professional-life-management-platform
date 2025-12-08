import { notificationRepository } from '../repositories/notification-repository'
import { prisma } from '../prisma'

/**
 * Service for generating notifications based on system events
 */
export class NotificationService {
  /**
   * Check for tasks that need reminders and create notifications
   */
  async generateTaskReminders(): Promise<number> {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    // Find tasks due within 24 hours that haven't been completed
    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: {
          in: ['TODO', 'IN_PROGRESS'],
        },
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            taskReminders: true,
          },
        },
      },
    })

    let notificationsCreated = 0

    for (const task of upcomingTasks) {
      if (task.user.taskReminders && task.dueDate) {
        const notification = await notificationRepository.createTaskReminder(
          task.id,
          task.userId,
          task.title,
          task.dueDate
        )
        if (notification) {
          notificationsCreated++
        }
      }
    }

    return notificationsCreated
  }

  /**
   * Check for habits that need nudges and create notifications
   */
  async generateHabitNudges(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find habits that haven't been completed today
    const habits = await prisma.habit.findMany({
      where: {
        frequency: 'DAILY',
        OR: [
          { lastCompletedAt: null },
          {
            lastCompletedAt: {
              lt: today,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            habitNudges: true,
          },
        },
      },
    })

    let notificationsCreated = 0

    for (const habit of habits) {
      if (habit.user.habitNudges) {
        const notification = await notificationRepository.createHabitNudge(
          habit.id,
          habit.userId,
          habit.name
        )
        if (notification) {
          notificationsCreated++
        }
      }
    }

    return notificationsCreated
  }

  /**
   * Create achievement notification when a milestone is reached
   */
  async notifyAchievement(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    achievementId: string
  ): Promise<boolean> {
    const notification = await notificationRepository.createAchievementNotification(
      userId,
      achievementTitle,
      achievementDescription,
      achievementId
    )
    return !!notification
  }

  /**
   * Check budgets and create alerts for those exceeding thresholds
   */
  async generateBudgetAlerts(): Promise<number> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all budgets
    const budgets = await prisma.budget.findMany({
      include: {
        user: {
          select: {
            id: true,
            budgetAlerts: true,
          },
        },
      },
    })

    let notificationsCreated = 0

    for (const budget of budgets) {
      if (!budget.user.budgetAlerts) {
        continue
      }

      // Calculate spending for this category this month
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: budget.userId,
          category: budget.category,
          type: 'EXPENSE',
          date: {
            gte: startOfMonth,
          },
        },
      })

      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)
      const percentageUsed = (totalSpent / budget.monthlyLimit) * 100

      // Check if threshold is exceeded
      if (percentageUsed >= budget.alertThreshold) {
        // Check if we already sent an alert this month
        const existingAlert = await prisma.notification.findFirst({
          where: {
            userId: budget.userId,
            type: 'BUDGET_ALERT',
            createdAt: {
              gte: startOfMonth,
            },
          },
        })

        if (!existingAlert) {
          const notification = await notificationRepository.createBudgetAlert(
            budget.userId,
            budget.category,
            percentageUsed,
            budget.alertThreshold
          )
          if (notification) {
            notificationsCreated++
          }
        }
      }
    }

    return notificationsCreated
  }

  /**
   * Check fitness goals and create progress notifications
   */
  async generateGoalProgressNotifications(): Promise<number> {
    const goals = await prisma.fitnessGoal.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            achievementNotifications: true,
          },
        },
      },
    })

    let notificationsCreated = 0

    for (const goal of goals) {
      if (!goal.user.achievementNotifications) {
        continue
      }

      const progress = (goal.currentValue / goal.targetValue) * 100

      // Notify at 25%, 50%, 75%, and 100% milestones
      const milestones = [25, 50, 75, 100]
      
      for (const milestone of milestones) {
        if (progress >= milestone) {
          // Check if we already notified for this milestone
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: goal.userId,
              type: 'GOAL_PROGRESS',
              message: {
                contains: `${milestone}%`,
              },
            },
          })

          if (!existingNotification) {
            const notification = await notificationRepository.createGoalProgressNotification(
              goal.userId,
              goal.goalType,
              milestone
            )
            if (notification) {
              notificationsCreated++
            }
            break // Only notify for the highest milestone reached
          }
        }
      }
    }

    return notificationsCreated
  }

  /**
   * Run all notification generation tasks
   * This can be called by a cron job or scheduled task
   */
  async generateAllNotifications(): Promise<{
    taskReminders: number
    habitNudges: number
    budgetAlerts: number
    goalProgress: number
  }> {
    const [taskReminders, habitNudges, budgetAlerts, goalProgress] = await Promise.all([
      this.generateTaskReminders(),
      this.generateHabitNudges(),
      this.generateBudgetAlerts(),
      this.generateGoalProgressNotifications(),
    ])

    return {
      taskReminders,
      habitNudges,
      budgetAlerts,
      goalProgress,
    }
  }
}

export const notificationService = new NotificationService()
