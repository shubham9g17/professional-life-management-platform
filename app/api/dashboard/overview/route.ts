import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Fetch all data in parallel
    const [
      tasks,
      completedTasks,
      onTimeTasks,
      habits,
      habitCompletions,
      exercises,
      meals,
      waterIntakes,
      learningResources,
      transactions,
      dailyMetrics,
      recentActivities,
    ] = await Promise.all([
      // Tasks
      prisma.task.count({
        where: {
          userId: user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
        },
      }),
      prisma.task.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          completedAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.task.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          completedAt: { gte: today, lt: tomorrow },
          dueDate: { gte: today },
        },
      }),

      // Habits
      prisma.habit.count({
        where: { userId: user.id },
      }),
      prisma.habitCompletion.count({
        where: {
          habit: { userId: user.id },
          completedAt: { gte: today, lt: tomorrow },
        },
      }),

      // Exercise
      prisma.exercise.aggregate({
        where: {
          userId: user.id,
          date: { gte: today, lt: tomorrow },
        },
        _sum: { duration: true },
      }),

      // Meals
      prisma.meal.count({
        where: {
          userId: user.id,
          date: { gte: today, lt: tomorrow },
        },
      }),

      // Water
      prisma.waterIntake.aggregate({
        where: {
          userId: user.id,
          date: { gte: today, lt: tomorrow },
        },
        _sum: { amount: true },
      }),

      // Learning
      prisma.learningResource.findMany({
        where: { userId: user.id },
        select: {
          completionPercentage: true,
          timeInvested: true,
          completedAt: true,
        },
      }),

      // Transactions
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        select: {
          amount: true,
          type: true,
        },
      }),

      // Daily metrics
      prisma.dailyMetrics.findFirst({
        where: {
          userId: user.id,
          date: today,
        },
      }),

      // Recent activities (last 10)
      Promise.all([
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: 'COMPLETED',
            completedAt: { not: null },
          },
          select: {
            id: true,
            title: true,
            workspace: true,
            completedAt: true,
          },
          orderBy: { completedAt: 'desc' },
          take: 3,
        }),
        prisma.habitCompletion.findMany({
          where: {
            habit: { userId: user.id },
          },
          include: {
            habit: { select: { name: true, category: true } },
          },
          orderBy: { completedAt: 'desc' },
          take: 3,
        }),
        prisma.exercise.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            activityType: true,
            duration: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: 2,
        }),
        prisma.transaction.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            description: true,
            amount: true,
            type: true,
            category: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: 2,
        }),
      ]),
    ])

    // Calculate financial metrics
    const monthlyIncome = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const monthlyExpenses = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const currentBalance = monthlyIncome - monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0

    // Calculate learning metrics
    const resourcesInProgress = learningResources.filter(
      (r: any) => r.completionPercentage > 0 && r.completionPercentage < 100
    ).length
    const resourcesCompleted = learningResources.filter((r: any) => r.completionPercentage === 100).length
    const learningMinutes = learningResources
      .filter((r: any) => {
        if (!r.completedAt) return false
        const completedDate = new Date(r.completedAt)
        return completedDate >= today && completedDate < tomorrow
      })
      .reduce((sum: number, r: any) => sum + r.timeInvested, 0)

    // Water goal (2000ml default)
    const waterGoalMet = (waterIntakes._sum.amount || 0) >= 2000

    // Calculate scores (use daily metrics if available, otherwise calculate)
    const scores = {
      productivity: dailyMetrics?.productivityScore || calculateProductivityScore(completedTasks, tasks),
      wellness: dailyMetrics?.wellnessScore || calculateWellnessScore(habitCompletions, habits, exercises._sum.duration || 0),
      growth: dailyMetrics?.growthScore || calculateGrowthScore(learningMinutes, resourcesCompleted),
      overall: dailyMetrics?.productivityScore && dailyMetrics?.wellnessScore && dailyMetrics?.growthScore
        ? (dailyMetrics.productivityScore + dailyMetrics.wellnessScore + dailyMetrics.growthScore) / 3
        : 0,
    }

    // Format activities
    const [taskActivities, habitActivities, exerciseActivities, transactionActivities] = recentActivities
    const activities = [
      ...taskActivities.map((t: any) => ({
        id: t.id,
        type: 'TASK' as const,
        title: `Completed: ${t.title}`,
        description: `${t.workspace} task completed`,
        timestamp: t.completedAt!,
        category: t.workspace,
      })),
      ...habitActivities.map((h: any) => ({
        id: h.id,
        type: 'HABIT' as const,
        title: `Completed: ${h.habit.name}`,
        description: `Habit completed`,
        timestamp: h.completedAt,
        category: h.habit.category,
      })),
      ...exerciseActivities.map((e: any) => ({
        id: e.id,
        type: 'EXERCISE' as const,
        title: `Logged: ${e.activityType}`,
        description: `${e.duration} minutes of exercise`,
        timestamp: e.date,
        category: e.activityType,
      })),
      ...transactionActivities.map((t: any) => ({
        id: t.id,
        type: 'TRANSACTION' as const,
        title: `${t.type === 'INCOME' ? 'Income' : 'Expense'}: ${t.description}`,
        description: `$${t.amount.toFixed(2)} - ${t.category}`,
        timestamp: t.date,
        category: t.category,
      })),
    ]
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    const dashboardData = {
      scores,
      productivity: {
        tasksCompleted: completedTasks,
        tasksTotal: tasks + completedTasks,
        tasksOnTime: onTimeTasks,
      },
      wellness: {
        habitsCompleted: habitCompletions,
        habitsTotal: habits,
        exerciseMinutes: exercises._sum.duration || 0,
        waterGoalMet,
      },
      growth: {
        learningMinutes,
        resourcesInProgress,
        resourcesCompleted,
      },
      financial: {
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
      },
      activities,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// Helper functions for score calculation
function calculateProductivityScore(completed: number, total: number): number {
  if (total === 0) return 0
  const completionRate = (completed / total) * 100
  return Math.min(completionRate, 100)
}

function calculateWellnessScore(habitsCompleted: number, habitsTotal: number, exerciseMinutes: number): number {
  const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 50 : 0
  const exerciseScore = Math.min((exerciseMinutes / 30) * 50, 50) // 30 min = full score
  return habitScore + exerciseScore
}

function calculateGrowthScore(learningMinutes: number, resourcesCompleted: number): number {
  const timeScore = Math.min((learningMinutes / 60) * 70, 70) // 60 min = 70 points
  const completionScore = resourcesCompleted * 30 // 30 points per completion
  return Math.min(timeScore + completionScore, 100)
}
