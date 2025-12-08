import { prisma } from '../prisma'
import type { Notification, User } from '@prisma/client'

export interface NotificationPreferences {
  taskReminders: boolean
  habitNudges: boolean
  achievementNotifications: boolean
  budgetAlerts: boolean
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
  notificationFrequency: 'REALTIME' | 'HOURLY' | 'DAILY'
}

export interface CreateNotificationInput {
  userId: string
  type: 'TASK_REMINDER' | 'HABIT_NUDGE' | 'ACHIEVEMENT' | 'BUDGET_ALERT' | 'GOAL_PROGRESS'
  title: string
  message: string
  data?: any
}

export class NotificationRepository {
  /**
   * Get all notifications for a user
   */
  async getNotifications(userId: string, options?: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }) {
    const where: any = { userId }
    
    if (options?.unreadOnly) {
      where.read = false
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    })
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    })
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        read: true,
      },
    })
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    })
    return result.count
  }

  /**
   * Create a notification with smart timing
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification | null> {
    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        taskReminders: true,
        habitNudges: true,
        achievementNotifications: true,
        budgetAlerts: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        notificationFrequency: true,
        timezone: true,
      },
    })

    if (!user) {
      return null
    }

    // Check if notification type is enabled
    if (!this.isNotificationTypeEnabled(input.type, user)) {
      return null
    }

    // Check quiet hours
    if (this.isInQuietHours(user.quietHoursStart, user.quietHoursEnd)) {
      // Don't create notification during quiet hours
      return null
    }

    // Check frequency limits
    const canSend = await this.checkFrequencyLimit(input.userId, input.type, user.notificationFrequency)
    if (!canSend) {
      return null
    }

    // Create the notification
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || null,
      },
    })
  }

  /**
   * Check if notification type is enabled in user preferences
   */
  private isNotificationTypeEnabled(
    type: string,
    preferences: Pick<User, 'taskReminders' | 'habitNudges' | 'achievementNotifications' | 'budgetAlerts'>
  ): boolean {
    switch (type) {
      case 'TASK_REMINDER':
        return preferences.taskReminders
      case 'HABIT_NUDGE':
        return preferences.habitNudges
      case 'ACHIEVEMENT':
        return preferences.achievementNotifications
      case 'BUDGET_ALERT':
        return preferences.budgetAlerts
      case 'GOAL_PROGRESS':
        return preferences.achievementNotifications // Use achievement setting for goal progress
      default:
        return true
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(quietHoursStart?: string | null, quietHoursEnd?: string | null): boolean {
    if (!quietHoursStart || !quietHoursEnd) {
      return false
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Handle quiet hours that span midnight
    if (quietHoursStart > quietHoursEnd) {
      return currentTime >= quietHoursStart || currentTime < quietHoursEnd
    }

    return currentTime >= quietHoursStart && currentTime < quietHoursEnd
  }

  /**
   * Check if notification can be sent based on frequency limits
   */
  private async checkFrequencyLimit(
    userId: string,
    type: string,
    frequency: string
  ): Promise<boolean> {
    const now = new Date()
    let timeThreshold: Date

    switch (frequency) {
      case 'REALTIME':
        // No limit for realtime
        return true
      
      case 'HOURLY':
        // Check if any notification of this type was sent in the last hour
        timeThreshold = new Date(now.getTime() - 60 * 60 * 1000)
        break
      
      case 'DAILY':
        // Check if any notification of this type was sent today
        timeThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      
      default:
        return true
    }

    const recentNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        createdAt: {
          gte: timeThreshold,
        },
      },
    })

    return !recentNotification
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        taskReminders: true,
        habitNudges: true,
        achievementNotifications: true,
        budgetAlerts: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        notificationFrequency: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      taskReminders: user.taskReminders,
      habitNudges: user.habitNudges,
      achievementNotifications: user.achievementNotifications,
      budgetAlerts: user.budgetAlerts,
      quietHoursStart: user.quietHoursStart,
      quietHoursEnd: user.quietHoursEnd,
      notificationFrequency: user.notificationFrequency as 'REALTIME' | 'HOURLY' | 'DAILY',
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        taskReminders: preferences.taskReminders,
        habitNudges: preferences.habitNudges,
        achievementNotifications: preferences.achievementNotifications,
        budgetAlerts: preferences.budgetAlerts,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        notificationFrequency: preferences.notificationFrequency,
      },
      select: {
        taskReminders: true,
        habitNudges: true,
        achievementNotifications: true,
        budgetAlerts: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        notificationFrequency: true,
      },
    })

    return {
      taskReminders: updated.taskReminders,
      habitNudges: updated.habitNudges,
      achievementNotifications: updated.achievementNotifications,
      budgetAlerts: updated.budgetAlerts,
      quietHoursStart: updated.quietHoursStart,
      quietHoursEnd: updated.quietHoursEnd,
      notificationFrequency: updated.notificationFrequency as 'REALTIME' | 'HOURLY' | 'DAILY',
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOldNotifications(userId: string, daysOld: number = 30): Promise<number> {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysOld)

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: threshold,
        },
        read: true, // Only delete read notifications
      },
    })

    return result.count
  }

  /**
   * Generate task reminder notification
   */
  async createTaskReminder(taskId: string, userId: string, taskTitle: string, dueDate: Date): Promise<Notification | null> {
    const now = new Date()
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    let message = ''
    if (hoursUntilDue <= 1) {
      message = `Task "${taskTitle}" is due in less than 1 hour!`
    } else if (hoursUntilDue <= 24) {
      message = `Task "${taskTitle}" is due today`
    } else {
      message = `Task "${taskTitle}" is due soon`
    }

    return this.createNotification({
      userId,
      type: 'TASK_REMINDER',
      title: 'Task Reminder',
      message,
      data: { taskId, dueDate: dueDate.toISOString() },
    })
  }

  /**
   * Generate habit nudge notification
   */
  async createHabitNudge(habitId: string, userId: string, habitName: string): Promise<Notification | null> {
    return this.createNotification({
      userId,
      type: 'HABIT_NUDGE',
      title: 'Habit Reminder',
      message: `Don't forget to complete "${habitName}" today!`,
      data: { habitId },
    })
  }

  /**
   * Generate achievement notification
   */
  async createAchievementNotification(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    achievementId: string
  ): Promise<Notification | null> {
    return this.createNotification({
      userId,
      type: 'ACHIEVEMENT',
      title: '🎉 Achievement Unlocked!',
      message: `${achievementTitle}: ${achievementDescription}`,
      data: { achievementId },
    })
  }

  /**
   * Generate budget alert notification
   */
  async createBudgetAlert(
    userId: string,
    category: string,
    percentageUsed: number,
    threshold: number
  ): Promise<Notification | null> {
    return this.createNotification({
      userId,
      type: 'BUDGET_ALERT',
      title: 'Budget Alert',
      message: `You've used ${percentageUsed.toFixed(0)}% of your ${category} budget (threshold: ${threshold}%)`,
      data: { category, percentageUsed, threshold },
    })
  }

  /**
   * Generate goal progress notification
   */
  async createGoalProgressNotification(
    userId: string,
    goalType: string,
    progress: number
  ): Promise<Notification | null> {
    return this.createNotification({
      userId,
      type: 'GOAL_PROGRESS',
      title: 'Goal Progress',
      message: `You're ${progress.toFixed(0)}% of the way to your ${goalType} goal!`,
      data: { goalType, progress },
    })
  }
}

export const notificationRepository = new NotificationRepository()
