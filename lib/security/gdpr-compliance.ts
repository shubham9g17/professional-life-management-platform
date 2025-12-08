/**
 * GDPR Compliance Utilities
 * Implements data export and deletion for GDPR compliance
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { auditLogger, AuditAction, AuditResource } from '@/lib/logging/audit';

/**
 * Export all user data in a structured format (GDPR Right to Data Portability)
 */
export async function exportUserData(userId: string): Promise<any> {
  try {
    logger.info('Starting GDPR data export', { userId });
    
    // Fetch all user data
    const [
      user,
      tasks,
      habits,
      habitCompletions,
      transactions,
      budgets,
      exercises,
      healthMetrics,
      fitnessGoals,
      meals,
      waterIntakes,
      learningResources,
      dailyMetrics,
      achievements,
      notifications,
      integrations,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          theme: true,
          timezone: true,
          taskReminders: true,
          habitNudges: true,
          achievementNotifications: true,
          budgetAlerts: true,
          quietHoursStart: true,
          quietHoursEnd: true,
          notificationFrequency: true,
          productivityScore: true,
          wellnessScore: true,
          growthScore: true,
          overallScore: true,
        },
      }),
      prisma.task.findMany({ where: { userId } }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.habitCompletion.findMany({
        where: { habit: { userId } },
      }),
      prisma.transaction.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.exercise.findMany({ where: { userId } }),
      prisma.healthMetric.findMany({ where: { userId } }),
      prisma.fitnessGoal.findMany({ where: { userId } }),
      prisma.meal.findMany({ where: { userId } }),
      prisma.waterIntake.findMany({ where: { userId } }),
      prisma.learningResource.findMany({ where: { userId } }),
      prisma.dailyMetrics.findMany({ where: { userId } }),
      prisma.achievement.findMany({ where: { userId } }),
      prisma.notification.findMany({ where: { userId } }),
      prisma.integration.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          status: true,
          lastSyncAt: true,
          syncFrequency: true,
          createdAt: true,
          // Exclude sensitive tokens
        },
      }),
    ]);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user,
      data: {
        tasks,
        habits,
        habitCompletions,
        transactions,
        budgets,
        exercises,
        healthMetrics,
        fitnessGoals,
        meals,
        waterIntakes,
        learningResources,
        dailyMetrics,
        achievements,
        notifications,
        integrations,
      },
      statistics: {
        totalTasks: tasks.length,
        totalHabits: habits.length,
        totalTransactions: transactions.length,
        totalExercises: exercises.length,
        totalMeals: meals.length,
        totalLearningResources: learningResources.length,
        totalAchievements: achievements.length,
      },
    };
    
    // Audit log
    await auditLogger.logDataAccess(
      userId,
      AuditAction.READ,
      AuditResource.USER,
      userId,
      { action: 'GDPR_DATA_EXPORT' }
    );
    
    logger.info('GDPR data export completed', { userId });
    
    return exportData;
  } catch (error) {
    logger.error('GDPR data export failed', { userId, error });
    throw error;
  }
}

/**
 * Delete all user data (GDPR Right to Erasure)
 */
export async function deleteUserData(userId: string): Promise<void> {
  try {
    logger.info('Starting GDPR data deletion', { userId });
    
    // Delete all user data in correct order (respecting foreign key constraints)
    // Prisma cascade delete will handle most of this, but we'll be explicit
    
    await prisma.$transaction(async (tx: any) => {
      // Delete habit completions first (references habits)
      await tx.habitCompletion.deleteMany({
        where: { habit: { userId } },
      });
      
      // Delete all user-related data
      await Promise.all([
        tx.task.deleteMany({ where: { userId } }),
        tx.habit.deleteMany({ where: { userId } }),
        tx.transaction.deleteMany({ where: { userId } }),
        tx.budget.deleteMany({ where: { userId } }),
        tx.exercise.deleteMany({ where: { userId } }),
        tx.healthMetric.deleteMany({ where: { userId } }),
        tx.fitnessGoal.deleteMany({ where: { userId } }),
        tx.meal.deleteMany({ where: { userId } }),
        tx.waterIntake.deleteMany({ where: { userId } }),
        tx.learningResource.deleteMany({ where: { userId } }),
        tx.dailyMetrics.deleteMany({ where: { userId } }),
        tx.achievement.deleteMany({ where: { userId } }),
        tx.notification.deleteMany({ where: { userId } }),
        tx.syncQueue.deleteMany({ where: { userId } }),
        tx.conflictResolution.deleteMany({ where: { userId } }),
        tx.integration.deleteMany({ where: { userId } }),
      ]);
      
      // Finally, delete the user account
      await tx.user.delete({ where: { id: userId } });
    });
    
    // Audit log (stored separately from user data)
    await auditLogger.logDataAccess(
      userId,
      AuditAction.DELETE,
      AuditResource.USER,
      userId,
      { action: 'GDPR_DATA_DELETION' }
    );
    
    logger.info('GDPR data deletion completed', { userId });
  } catch (error) {
    logger.error('GDPR data deletion failed', { userId, error });
    throw error;
  }
}

/**
 * Anonymize user data (alternative to deletion)
 * Keeps data for analytics but removes personally identifiable information
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  try {
    logger.info('Starting user data anonymization', { userId });
    
    await prisma.$transaction(async (tx: any) => {
      // Anonymize user account
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `anonymized-${userId}@deleted.local`,
          name: 'Anonymized User',
          passwordHash: 'ANONYMIZED',
        },
      });
      
      // Remove sensitive data from integrations
      await tx.integration.updateMany({
        where: { userId },
        data: {
          accessToken: null,
          refreshToken: null,
          providerUserId: null,
          status: 'DISCONNECTED',
        },
      });
      
      // Remove personal notes from various entities
      await Promise.all([
        tx.task.updateMany({
          where: { userId },
          data: { description: null },
        }),
        tx.habitCompletion.updateMany({
          where: { habit: { userId } },
          data: { notes: null },
        }),
        tx.exercise.updateMany({
          where: { userId },
          data: { notes: null },
        }),
        tx.learningResource.updateMany({
          where: { userId },
          data: { notes: null, url: null },
        }),
      ]);
    });
    
    // Audit log
    await auditLogger.logDataAccess(
      userId,
      AuditAction.UPDATE,
      AuditResource.USER,
      userId,
      { action: 'USER_DATA_ANONYMIZATION' }
    );
    
    logger.info('User data anonymization completed', { userId });
  } catch (error) {
    logger.error('User data anonymization failed', { userId, error });
    throw error;
  }
}

/**
 * Get data retention information
 */
export interface DataRetentionInfo {
  userId: string;
  accountCreated: Date;
  lastActivity: Date;
  dataCategories: {
    category: string;
    recordCount: number;
    oldestRecord: Date | null;
    newestRecord: Date | null;
  }[];
  totalRecords: number;
}

export async function getDataRetentionInfo(userId: string): Promise<DataRetentionInfo> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, updatedAt: true },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const [
      taskCount,
      habitCount,
      transactionCount,
      exerciseCount,
      mealCount,
      learningCount,
      tasks,
      transactions,
      exercises,
    ] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.habit.count({ where: { userId } }),
      prisma.transaction.count({ where: { userId } }),
      prisma.exercise.count({ where: { userId } }),
      prisma.meal.count({ where: { userId } }),
      prisma.learningResource.count({ where: { userId } }),
      prisma.task.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
      }),
      prisma.transaction.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'asc' },
        take: 1,
      }),
      prisma.exercise.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'asc' },
        take: 1,
      }),
    ]);
    
    const dataCategories = [
      {
        category: 'Tasks',
        recordCount: taskCount,
        oldestRecord: tasks[0]?.createdAt || null,
        newestRecord: new Date(),
      },
      {
        category: 'Habits',
        recordCount: habitCount,
        oldestRecord: null,
        newestRecord: null,
      },
      {
        category: 'Transactions',
        recordCount: transactionCount,
        oldestRecord: transactions[0]?.date || null,
        newestRecord: new Date(),
      },
      {
        category: 'Exercises',
        recordCount: exerciseCount,
        oldestRecord: exercises[0]?.date || null,
        newestRecord: new Date(),
      },
      {
        category: 'Meals',
        recordCount: mealCount,
        oldestRecord: null,
        newestRecord: null,
      },
      {
        category: 'Learning Resources',
        recordCount: learningCount,
        oldestRecord: null,
        newestRecord: null,
      },
    ];
    
    return {
      userId,
      accountCreated: user.createdAt,
      lastActivity: user.updatedAt,
      dataCategories,
      totalRecords: taskCount + habitCount + transactionCount + exerciseCount + mealCount + learningCount,
    };
  } catch (error) {
    logger.error('Failed to get data retention info', { userId, error });
    throw error;
  }
}

/**
 * Check if user has requested data deletion
 */
export async function hasPendingDeletionRequest(userId: string): Promise<boolean> {
  // In a real implementation, you would check a deletion_requests table
  // For now, we'll return false
  return false;
}

/**
 * Schedule data deletion (with grace period)
 */
export async function scheduleDeletion(userId: string, deletionDate: Date): Promise<void> {
  // In a real implementation, you would:
  // 1. Create a deletion request record
  // 2. Set up a scheduled job to delete data on the specified date
  // 3. Send confirmation email to user
  
  logger.info('Data deletion scheduled', { userId, deletionDate });
  
  await auditLogger.logDataAccess(
    userId,
    AuditAction.UPDATE,
    AuditResource.USER,
    userId,
    { action: 'DELETION_SCHEDULED', deletionDate }
  );
}

/**
 * Cancel scheduled deletion
 */
export async function cancelScheduledDeletion(userId: string): Promise<void> {
  // In a real implementation, you would:
  // 1. Remove the deletion request record
  // 2. Cancel the scheduled job
  // 3. Send confirmation email to user
  
  logger.info('Data deletion cancelled', { userId });
  
  await auditLogger.logDataAccess(
    userId,
    AuditAction.UPDATE,
    AuditResource.USER,
    userId,
    { action: 'DELETION_CANCELLED' }
  );
}
