import { prisma } from '@/lib/prisma'
import { taskRepository } from './task-repository'
import { transactionRepository } from './transaction-repository'
import { learningResourceRepository } from './learning-resource-repository'
import { getExerciseStats } from './exercise-repository'
import { getLatestHealthMetric } from './health-metric-repository'
import { checkDailyNutritionGoals } from './meal-repository'
import { checkDailyWaterGoal } from './water-intake-repository'
import { getHabitsWithCompletions, calculateStreak } from './habit-repository'

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

export interface DomainStats {
  tasks: {
    total: number
    completed: number
    inProgress: number
    todo: number
    overdueCount: number
    completionRate: number
    byWorkspace: Record<string, number>
  }
  habits: {
    activeHabits: number
    bestStreak: number
    averageCompletionRate: number
    topHabit: { name: string; streak: number } | null
  }
  finance: {
    income: number
    expenses: number
    balance: number
    savingsRate: number
    topExpenseCategory: { name: string; amount: number } | null
  }
  fitness: {
    totalMinutes: number
    sessionCount: number
    averageIntensity: string
    mostCommonActivity: string
    latestWeight: number | null
  }
  nutrition: {
    daysWithNutritionTracked: number
    daysWithWaterGoalMet: number
    totalDays: number
  }
  learning: {
    total: number
    completed: number
    inProgress: number
    minutesInvested: number
    completionRate: number
  }
}

export interface CorrelationResult {
  id: string
  label: string
  metric: string
  condition: string
  withValue: number
  withoutValue: number
  withCount: number
  withoutCount: number
  deltaAbs: number
  deltaPct: number
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
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
 * Get overview statistics for dashboard / analytics hero
 *
 * @param days — period for the rolling average and totals (default 7).
 */
export async function getOverviewStats(userId: string, days: number = 7) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const periodStart = new Date(today)
  periodStart.setDate(periodStart.getDate() - days)

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

  // Get period metrics for averages + totals
  const periodMetrics = await prisma.dailyMetrics.findMany({
    where: {
      userId,
      date: { gte: periodStart },
    },
    orderBy: { date: 'asc' },
  })

  const periodAverages = periodMetrics.length > 0 ? {
    productivity: periodMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / periodMetrics.length,
    wellness: periodMetrics.reduce((sum, m) => sum + m.wellnessScore, 0) / periodMetrics.length,
    growth: periodMetrics.reduce((sum, m) => sum + m.growthScore, 0) / periodMetrics.length,
    overall: periodMetrics.reduce((sum, m) =>
      sum + (m.productivityScore * 0.35 + m.wellnessScore * 0.35 + m.growthScore * 0.30), 0) / periodMetrics.length,
  } : { productivity: 0, wellness: 0, growth: 0, overall: 0 }

  const periodTotals = {
    tasksCompleted: periodMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0),
    habitsCompleted: periodMetrics.reduce((sum, m) => sum + m.habitsCompleted, 0),
    exerciseMinutes: periodMetrics.reduce((sum, m) => sum + m.exerciseMinutes, 0),
    learningMinutes: periodMetrics.reduce((sum, m) => sum + m.learningMinutes, 0),
  }

  return {
    period: { days, start: periodStart, end: today },
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
    periodAverages,
    periodTotals,
    daysWithData: periodMetrics.length,
  }
}

/**
 * Compose per-domain stats for the analytics page domain grid.
 * Pulls from each module's repository so the analytics page hits one endpoint.
 */
export async function getDomainStats(userId: string, days: number = 30): Promise<DomainStats> {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const [
    taskStats,
    overdueTasks,
    habits,
    transactionStats,
    exerciseStats,
    latestHealth,
    learningStats,
  ] = await Promise.all([
    taskRepository.getStats(userId),
    taskRepository.getOverdue(userId),
    getHabitsWithCompletions(userId),
    transactionRepository.getStats(userId, startDate, endDate),
    getExerciseStats(userId, startDate, endDate),
    getLatestHealthMetric(userId),
    learningResourceRepository.getStats(userId),
  ])

  // Habits — derive top streak + avg completion rate
  let bestStreak = 0
  let topHabit: { name: string; streak: number } | null = null
  let totalCompletionRate = 0
  habits.forEach((h) => {
    const dates = h.completions.map((c) => c.completedAt)
    const streak = calculateStreak(dates)
    if (streak > bestStreak) {
      bestStreak = streak
      topHabit = { name: h.name, streak }
    }
    totalCompletionRate += h.completionRate
  })
  const avgCompletionRate = habits.length > 0 ? totalCompletionRate / habits.length : 0

  // Finance — top expense category from groupBy result
  let topExpenseCategory: { name: string; amount: number } | null = null
  if (transactionStats.byCategory) {
    const entries = Object.entries(transactionStats.byCategory)
      .filter(([, amount]) => (amount as number) > 0)
      .sort(([, a], [, b]) => (b as number) - (a as number))
    if (entries.length > 0) {
      topExpenseCategory = { name: entries[0][0], amount: entries[0][1] as number }
    }
  }

  const savingsRate = transactionStats.totalIncome > 0
    ? ((transactionStats.totalIncome - transactionStats.totalExpenses) / transactionStats.totalIncome) * 100
    : 0

  // Nutrition — count days with tracking + water goal met within period
  // Loop over each day in range; queries are lightweight (count-based)
  let daysTracked = 0
  let daysWaterMet = 0
  const totalDays = days
  const dayChecks: Promise<[boolean, boolean]>[] = []
  for (let i = 0; i < days; i++) {
    const day = new Date(startDate)
    day.setDate(day.getDate() + i)
    dayChecks.push(
      Promise.all([
        checkDailyNutritionGoals(userId, day),
        checkDailyWaterGoal(userId, day),
      ])
    )
  }
  const checkResults = await Promise.all(dayChecks)
  checkResults.forEach(([nutri, water]) => {
    if (nutri) daysTracked++
    if (water) daysWaterMet++
  })

  return {
    tasks: {
      total: taskStats.total,
      completed: taskStats.completed,
      inProgress: taskStats.inProgress,
      todo: taskStats.todo,
      overdueCount: overdueTasks.length,
      completionRate: taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0,
      byWorkspace: taskStats.byWorkspace,
    },
    habits: {
      activeHabits: habits.length,
      bestStreak,
      averageCompletionRate: avgCompletionRate,
      topHabit,
    },
    finance: {
      income: transactionStats.totalIncome,
      expenses: transactionStats.totalExpenses,
      balance: transactionStats.balance,
      savingsRate,
      topExpenseCategory,
    },
    fitness: {
      totalMinutes: exerciseStats.totalMinutes,
      sessionCount: exerciseStats.totalExercises,
      averageIntensity: exerciseStats.averageIntensity,
      mostCommonActivity: exerciseStats.mostCommonActivity,
      latestWeight: latestHealth?.weight ?? null,
    },
    nutrition: {
      daysWithNutritionTracked: daysTracked,
      daysWithWaterGoalMet: daysWaterMet,
      totalDays,
    },
    learning: {
      total: learningStats.total,
      completed: learningStats.completed,
      inProgress: learningStats.inProgress,
      minutesInvested: learningStats.totalTimeInvested,
      completionRate: learningStats.completionRate,
    },
  }
}

/**
 * Compute simple group-by-mean correlations from DailyMetrics.
 * Returns null entries (filtered out by caller) when either group has fewer than `MIN_SAMPLE` days.
 *
 * Each result is the average of a target metric on days where a condition is true vs days where it's false.
 * Math is intentionally simple (mean comparison, not Pearson) so users can read "+27% on exercise days" directly.
 */
export async function getCorrelations(userId: string, days: number = 30): Promise<CorrelationResult[]> {
  const MIN_SAMPLE = 3
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)

  const metrics = await prisma.dailyMetrics.findMany({
    where: { userId, date: { gte: start, lte: today } },
  })

  type Predicate = (m: typeof metrics[number]) => boolean
  type ScoreOf = (m: typeof metrics[number]) => number

  const compare = (
    id: string,
    label: string,
    metricLabel: string,
    condition: string,
    pred: Predicate,
    score: ScoreOf
  ): CorrelationResult | null => {
    const withGroup = metrics.filter(pred)
    const withoutGroup = metrics.filter((m) => !pred(m))
    if (withGroup.length < MIN_SAMPLE || withoutGroup.length < MIN_SAMPLE) return null

    const withAvg = withGroup.reduce((s, m) => s + score(m), 0) / withGroup.length
    const withoutAvg = withoutGroup.reduce((s, m) => s + score(m), 0) / withoutGroup.length
    const deltaAbs = withAvg - withoutAvg
    const deltaPct = withoutAvg > 0 ? (deltaAbs / withoutAvg) * 100 : 0
    const direction: CorrelationResult['direction'] =
      Math.abs(deltaPct) < 5 ? 'NEUTRAL' : deltaPct > 0 ? 'POSITIVE' : 'NEGATIVE'

    return {
      id,
      label,
      metric: metricLabel,
      condition,
      withValue: Math.round(withAvg * 100) / 100,
      withoutValue: Math.round(withoutAvg * 100) / 100,
      withCount: withGroup.length,
      withoutCount: withoutGroup.length,
      deltaAbs: Math.round(deltaAbs * 100) / 100,
      deltaPct: Math.round(deltaPct * 10) / 10,
      direction,
    }
  }

  const results: (CorrelationResult | null)[] = [
    compare(
      'productivity-on-exercise',
      'Productivity on exercise days',
      'Productivity score',
      '≥30 min exercise',
      (m) => m.exerciseMinutes >= 30,
      (m) => m.productivityScore
    ),
    compare(
      'productivity-on-habit',
      'Productivity on habit-completion days',
      'Productivity score',
      'completed at least one habit',
      (m) => m.habitsCompleted > 0,
      (m) => m.productivityScore
    ),
    compare(
      'wellness-on-nutrition',
      'Wellness when tracking nutrition',
      'Wellness score',
      'logged a meal',
      (m) => m.caloriesTracked,
      (m) => m.wellnessScore
    ),
    compare(
      'wellness-on-water',
      'Wellness when hitting water goal',
      'Wellness score',
      '≥2 L water',
      (m) => m.waterGoalMet,
      (m) => m.wellnessScore
    ),
    compare(
      'growth-on-learning',
      'Growth on learning days',
      'Growth score',
      'logged learning minutes',
      (m) => m.learningMinutes > 0,
      (m) => m.growthScore
    ),
  ]

  return results.filter((r): r is CorrelationResult => r !== null)
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
