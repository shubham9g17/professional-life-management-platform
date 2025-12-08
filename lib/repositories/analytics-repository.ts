import { prisma } from '@/lib/prisma'

export interface TrendData {
  date: Date
  productivityScore: number
  wellnessScore: number
  growthScore: number
  overallScore: number
}

export interface InsightData {
  type: 'POSITIVE' | 'NEUTRAL' | 'IMPROVEMENT'
  category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'OVERALL'
  title: string
  description: string
  metric?: number
}

/**
 * Get daily metrics for a date range
 */
export async function getDailyMetrics(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.dailyMetrics.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })
}

/**
 * Get trend data for charts
 */
export async function getTrendData(
  userId: string,
  days: number = 30
): Promise<TrendData[]> {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const metrics = await getDailyMetrics(userId, startDate, endDate)

  return metrics.map(m => ({
    date: m.date,
    productivityScore: m.productivityScore,
    wellnessScore: m.wellnessScore,
    growthScore: m.growthScore,
    overallScore: (m.productivityScore * 0.35 + m.wellnessScore * 0.35 + m.growthScore * 0.30),
  }))
}

/**
 * Get overview statistics for dashboard
 */
export async function getOverviewStats(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get user's current scores
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      productivityScore: true,
      wellnessScore: true,
      growthScore: true,
      overallScore: true,
    },
  })

  // Get today's metrics
  const todayMetrics = await prisma.dailyMetrics.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  })

  // Get last 7 days metrics for trends
  const weekMetrics = await prisma.dailyMetrics.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: 'asc' },
  })

  // Get last 30 days metrics for monthly stats
  const monthMetrics = await prisma.dailyMetrics.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
  })

  // Calculate weekly averages
  const weekAvg = weekMetrics.length > 0 ? {
    productivity: weekMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / weekMetrics.length,
    wellness: weekMetrics.reduce((sum, m) => sum + m.wellnessScore, 0) / weekMetrics.length,
    growth: weekMetrics.reduce((sum, m) => sum + m.growthScore, 0) / weekMetrics.length,
  } : { productivity: 0, wellness: 0, growth: 0 }

  // Calculate monthly totals
  const monthTotals = {
    tasksCompleted: monthMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0),
    habitsCompleted: monthMetrics.reduce((sum, m) => sum + m.habitsCompleted, 0),
    exerciseMinutes: monthMetrics.reduce((sum, m) => sum + m.exerciseMinutes, 0),
    learningMinutes: monthMetrics.reduce((sum, m) => sum + m.learningMinutes, 0),
  }

  return {
    currentScores: user || {
      productivityScore: 0,
      wellnessScore: 0,
      growthScore: 0,
      overallScore: 0,
    },
    today: todayMetrics || {
      tasksCompleted: 0,
      habitsCompleted: 0,
      exerciseMinutes: 0,
      learningMinutes: 0,
    },
    weeklyAverages: weekAvg,
    monthlyTotals: monthTotals,
  }
}

/**
 * Generate insights based on user data
 */
export async function generateInsights(userId: string): Promise<InsightData[]> {
  const insights: InsightData[] = []

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  fourteenDaysAgo.setHours(0, 0, 0, 0)

  // Get recent metrics
  const lastWeek = await prisma.dailyMetrics.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo },
    },
  })

  const previousWeek = await prisma.dailyMetrics.findMany({
    where: {
      userId,
      date: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
    },
  })

  if (lastWeek.length === 0) {
    return insights
  }

  // Calculate averages
  const lastWeekAvg = {
    productivity: lastWeek.reduce((sum, m) => sum + m.productivityScore, 0) / lastWeek.length,
    wellness: lastWeek.reduce((sum, m) => sum + m.wellnessScore, 0) / lastWeek.length,
    growth: lastWeek.reduce((sum, m) => sum + m.growthScore, 0) / lastWeek.length,
    tasks: lastWeek.reduce((sum, m) => sum + m.tasksCompleted, 0) / lastWeek.length,
    habits: lastWeek.reduce((sum, m) => sum + m.habitsCompleted, 0) / lastWeek.length,
    exercise: lastWeek.reduce((sum, m) => sum + m.exerciseMinutes, 0) / lastWeek.length,
  }

  const prevWeekAvg = previousWeek.length > 0 ? {
    productivity: previousWeek.reduce((sum, m) => sum + m.productivityScore, 0) / previousWeek.length,
    wellness: previousWeek.reduce((sum, m) => sum + m.wellnessScore, 0) / previousWeek.length,
    growth: previousWeek.reduce((sum, m) => sum + m.growthScore, 0) / previousWeek.length,
  } : null

  // Productivity insights
  if (lastWeekAvg.productivity >= 80) {
    insights.push({
      type: 'POSITIVE',
      category: 'PRODUCTIVITY',
      title: 'Excellent Productivity',
      description: `You're maintaining a strong productivity score of ${Math.round(lastWeekAvg.productivity)}. Keep up the great work!`,
      metric: Math.round(lastWeekAvg.productivity),
    })
  } else if (lastWeekAvg.productivity < 50) {
    insights.push({
      type: 'IMPROVEMENT',
      category: 'PRODUCTIVITY',
      title: 'Productivity Opportunity',
      description: `Your productivity score is ${Math.round(lastWeekAvg.productivity)}. Consider breaking tasks into smaller chunks and setting realistic deadlines.`,
      metric: Math.round(lastWeekAvg.productivity),
    })
  }

  // Wellness insights
  if (lastWeekAvg.exercise < 20) {
    insights.push({
      type: 'IMPROVEMENT',
      category: 'WELLNESS',
      title: 'Increase Physical Activity',
      description: `You're averaging ${Math.round(lastWeekAvg.exercise)} minutes of exercise per day. Aim for at least 30 minutes daily.`,
      metric: Math.round(lastWeekAvg.exercise),
    })
  }

  if (lastWeekAvg.habits >= 0.8 * lastWeek[0]?.habitsCompleted) {
    insights.push({
      type: 'POSITIVE',
      category: 'WELLNESS',
      title: 'Strong Habit Consistency',
      description: `You're completing most of your daily habits. This consistency will compound over time!`,
    })
  }

  // Growth insights
  if (lastWeekAvg.growth >= 70) {
    insights.push({
      type: 'POSITIVE',
      category: 'GROWTH',
      title: 'Committed to Learning',
      description: `Your growth score of ${Math.round(lastWeekAvg.growth)} shows strong commitment to professional development.`,
      metric: Math.round(lastWeekAvg.growth),
    })
  } else if (lastWeekAvg.growth < 30) {
    insights.push({
      type: 'IMPROVEMENT',
      category: 'GROWTH',
      title: 'Invest in Learning',
      description: `Consider dedicating 30-60 minutes daily to learning. Small consistent efforts lead to significant growth.`,
      metric: Math.round(lastWeekAvg.growth),
    })
  }

  // Trend insights (comparing to previous week)
  if (prevWeekAvg) {
    const productivityChange = lastWeekAvg.productivity - prevWeekAvg.productivity
    if (productivityChange >= 10) {
      insights.push({
        type: 'POSITIVE',
        category: 'PRODUCTIVITY',
        title: 'Productivity Trending Up',
        description: `Your productivity increased by ${Math.round(productivityChange)} points this week!`,
        metric: Math.round(productivityChange),
      })
    }

    const wellnessChange = lastWeekAvg.wellness - prevWeekAvg.wellness
    if (wellnessChange >= 10) {
      insights.push({
        type: 'POSITIVE',
        category: 'WELLNESS',
        title: 'Wellness Improving',
        description: `Your wellness score improved by ${Math.round(wellnessChange)} points this week!`,
        metric: Math.round(wellnessChange),
      })
    }
  }

  return insights
}

/**
 * Get achievements for a user
 */
export async function getAchievements(
  userId: string,
  limit?: number
) {
  return prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
    take: limit,
  })
}

/**
 * Create an achievement
 */
export async function createAchievement(
  userId: string,
  type: string,
  title: string,
  description: string,
  category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'FINANCIAL'
) {
  return prisma.achievement.create({
    data: {
      userId,
      type,
      title,
      description,
      category,
    },
  })
}

/**
 * Generate weekly report summary
 */
export async function generateWeeklyReport(userId: string) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const metrics = await getDailyMetrics(userId, sevenDaysAgo, today)

  if (metrics.length === 0) {
    return null
  }

  const totals = {
    tasksCompleted: metrics.reduce((sum, m) => sum + m.tasksCompleted, 0),
    tasksOnTime: metrics.reduce((sum, m) => sum + m.tasksOnTime, 0),
    habitsCompleted: metrics.reduce((sum, m) => sum + m.habitsCompleted, 0),
    exerciseMinutes: metrics.reduce((sum, m) => sum + m.exerciseMinutes, 0),
    learningMinutes: metrics.reduce((sum, m) => sum + m.learningMinutes, 0),
    daysWithCaloriesTracked: metrics.filter(m => m.caloriesTracked).length,
    daysWithWaterGoalMet: metrics.filter(m => m.waterGoalMet).length,
  }

  const averages = {
    productivityScore: metrics.reduce((sum, m) => sum + m.productivityScore, 0) / metrics.length,
    wellnessScore: metrics.reduce((sum, m) => sum + m.wellnessScore, 0) / metrics.length,
    growthScore: metrics.reduce((sum, m) => sum + m.growthScore, 0) / metrics.length,
  }

  return {
    period: {
      start: sevenDaysAgo,
      end: today,
    },
    totals,
    averages: {
      productivityScore: Math.round(averages.productivityScore * 100) / 100,
      wellnessScore: Math.round(averages.wellnessScore * 100) / 100,
      growthScore: Math.round(averages.growthScore * 100) / 100,
    },
    daysTracked: metrics.length,
  }
}

/**
 * Generate monthly report summary
 */
export async function generateMonthlyReport(userId: string) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const metrics = await getDailyMetrics(userId, thirtyDaysAgo, today)

  if (metrics.length === 0) {
    return null
  }

  const totals = {
    tasksCompleted: metrics.reduce((sum, m) => sum + m.tasksCompleted, 0),
    tasksOnTime: metrics.reduce((sum, m) => sum + m.tasksOnTime, 0),
    habitsCompleted: metrics.reduce((sum, m) => sum + m.habitsCompleted, 0),
    exerciseMinutes: metrics.reduce((sum, m) => sum + m.exerciseMinutes, 0),
    learningMinutes: metrics.reduce((sum, m) => sum + m.learningMinutes, 0),
    daysWithCaloriesTracked: metrics.filter(m => m.caloriesTracked).length,
    daysWithWaterGoalMet: metrics.filter(m => m.waterGoalMet).length,
  }

  const averages = {
    productivityScore: metrics.reduce((sum, m) => sum + m.productivityScore, 0) / metrics.length,
    wellnessScore: metrics.reduce((sum, m) => sum + m.wellnessScore, 0) / metrics.length,
    growthScore: metrics.reduce((sum, m) => sum + m.growthScore, 0) / metrics.length,
  }

  // Get achievements unlocked this month
  const achievements = await prisma.achievement.count({
    where: {
      userId,
      unlockedAt: {
        gte: thirtyDaysAgo,
        lte: today,
      },
    },
  })

  return {
    period: {
      start: thirtyDaysAgo,
      end: today,
    },
    totals,
    averages: {
      productivityScore: Math.round(averages.productivityScore * 100) / 100,
      wellnessScore: Math.round(averages.wellnessScore * 100) / 100,
      growthScore: Math.round(averages.growthScore * 100) / 100,
    },
    achievementsUnlocked: achievements,
    daysTracked: metrics.length,
  }
}
