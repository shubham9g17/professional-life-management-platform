import { prisma } from '@/lib/prisma'

/**
 * Metrics Engine for calculating productivity, wellness, growth, and overall scores
 * 
 * Score Calculation Methodology:
 * - Productivity Score: Based on task completion rate, on-time delivery, and workspace balance
 * - Wellness Score: Based on habit consistency, fitness activity, nutrition tracking, and health metrics
 * - Growth Score: Based on learning progress, time invested, and skill development
 * - Overall Score: Weighted average of all scores
 */

export interface MetricsInput {
  userId: string
  date: Date
}

export interface DailyMetricsData {
  tasksCompleted: number
  tasksOnTime: number
  totalTasks: number
  habitsCompleted: number
  totalHabits: number
  exerciseMinutes: number
  caloriesTracked: boolean
  waterGoalMet: boolean
  learningMinutes: number
}

export interface ScoreBreakdown {
  productivityScore: number
  wellnessScore: number
  growthScore: number
  overallScore: number
}

/**
 * Calculate productivity score based on task completion and timeliness
 * 
 * Factors:
 * - Task completion rate (50%)
 * - On-time completion rate (30%)
 * - Task activity (20%)
 * 
 * @returns Score from 0-100
 */
export function calculateProductivityScore(data: DailyMetricsData): number {
  const { tasksCompleted, tasksOnTime, totalTasks } = data

  // If no tasks, return baseline score
  if (totalTasks === 0) {
    return 50
  }

  // Completion rate (0-50 points)
  const completionRate = (tasksCompleted / totalTasks) * 50

  // On-time rate (0-30 points)
  const onTimeRate = tasksCompleted > 0 ? (tasksOnTime / tasksCompleted) * 30 : 0

  // Activity bonus (0-20 points) - rewards having tasks
  const activityBonus = Math.min(20, totalTasks * 2)

  const score = completionRate + onTimeRate + activityBonus

  return Math.min(100, Math.round(score * 100) / 100)
}

/**
 * Calculate wellness score based on habits, fitness, and nutrition
 * 
 * Factors:
 * - Habit completion rate (40%)
 * - Exercise activity (30%)
 * - Nutrition tracking (30%)
 * 
 * @returns Score from 0-100
 */
export function calculateWellnessScore(data: DailyMetricsData): number {
  const { habitsCompleted, totalHabits, exerciseMinutes, caloriesTracked, waterGoalMet } = data

  // Habit completion (0-40 points)
  const habitScore = totalHabits > 0 ? (habitsCompleted / totalHabits) * 40 : 20

  // Exercise score (0-30 points)
  // Target: 30+ minutes per day
  const exerciseScore = Math.min(30, (exerciseMinutes / 30) * 30)

  // Nutrition score (0-30 points)
  let nutritionScore = 0
  if (caloriesTracked) nutritionScore += 15
  if (waterGoalMet) nutritionScore += 15

  const score = habitScore + exerciseScore + nutritionScore

  return Math.min(100, Math.round(score * 100) / 100)
}

/**
 * Calculate growth score based on learning activities
 * 
 * Factors:
 * - Learning time invested (70%)
 * - Consistency bonus (30%)
 * 
 * @returns Score from 0-100
 */
export function calculateGrowthScore(data: DailyMetricsData): number {
  const { learningMinutes } = data

  // Learning time score (0-70 points)
  // Target: 60+ minutes per day
  const learningScore = Math.min(70, (learningMinutes / 60) * 70)

  // Consistency bonus (0-30 points)
  // Rewards any learning activity
  const consistencyBonus = learningMinutes > 0 ? 30 : 0

  const score = learningScore + consistencyBonus

  return Math.min(100, Math.round(score * 100) / 100)
}

/**
 * Calculate overall balance score as weighted average
 * 
 * Weights:
 * - Productivity: 35%
 * - Wellness: 35%
 * - Growth: 30%
 * 
 * @returns Score from 0-100
 */
export function calculateOverallScore(scores: ScoreBreakdown): number {
  const { productivityScore, wellnessScore, growthScore } = scores

  const overall = (
    productivityScore * 0.35 +
    wellnessScore * 0.35 +
    growthScore * 0.30
  )

  return Math.min(100, Math.round(overall * 100) / 100)
}

/**
 * Aggregate daily metrics data from various sources
 */
export async function aggregateDailyMetrics(
  userId: string,
  date: Date
): Promise<DailyMetricsData> {
  // Normalize date to start of day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // Fetch all data in parallel
  const [
    tasks,
    completedTasks,
    habits,
    habitCompletions,
    exercises,
    meals,
    waterIntakes,
    learningResources,
  ] = await Promise.all([
    // Total tasks for the day (created or due)
    prisma.task.count({
      where: {
        userId,
        OR: [
          { createdAt: { gte: startOfDay, lte: endOfDay } },
          { dueDate: { gte: startOfDay, lte: endOfDay } },
        ],
        status: { not: 'ARCHIVED' },
      },
    }),
    // Completed tasks
    prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        completedAt: true,
        dueDate: true,
      },
    }),
    // Total active habits
    prisma.habit.count({
      where: {
        userId,
        createdAt: { lte: endOfDay },
      },
    }),
    // Habit completions for the day
    prisma.habitCompletion.count({
      where: {
        habit: { userId },
        completedAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Exercise logs for the day
    prisma.exercise.findMany({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        duration: true,
      },
    }),
    // Meals logged for the day
    prisma.meal.count({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Water intake for the day
    prisma.waterIntake.aggregate({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      _sum: {
        amount: true,
      },
    }),
    // Learning resources with progress updates
    prisma.learningResource.findMany({
      where: {
        userId,
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        timeInvested: true,
      },
    }),
  ])

  // Calculate tasks completed on time
  const tasksOnTime = completedTasks.filter(task => {
    if (!task.dueDate || !task.completedAt) return false
    return task.completedAt <= task.dueDate
  }).length

  // Calculate total exercise minutes
  const exerciseMinutes = exercises.reduce((sum, ex) => sum + ex.duration, 0)

  // Check if calories were tracked (at least one meal logged)
  const caloriesTracked = meals > 0

  // Check if water goal was met (2000ml = 2 liters)
  const waterGoalMet = (waterIntakes._sum.amount || 0) >= 2000

  // Calculate learning minutes (estimate based on time invested field)
  const learningMinutes = learningResources.reduce((sum, lr) => sum + lr.timeInvested, 0)

  return {
    tasksCompleted: completedTasks.length,
    tasksOnTime,
    totalTasks: tasks,
    habitsCompleted: habitCompletions,
    totalHabits: habits,
    exerciseMinutes,
    caloriesTracked,
    waterGoalMet,
    learningMinutes,
  }
}

/**
 * Calculate all scores for a given day
 */
export async function calculateDailyScores(
  userId: string,
  date: Date
): Promise<ScoreBreakdown> {
  const data = await aggregateDailyMetrics(userId, date)

  const productivityScore = calculateProductivityScore(data)
  const wellnessScore = calculateWellnessScore(data)
  const growthScore = calculateGrowthScore(data)
  const overallScore = calculateOverallScore({
    productivityScore,
    wellnessScore,
    growthScore,
    overallScore: 0, // Will be calculated
  })

  return {
    productivityScore,
    wellnessScore,
    growthScore,
    overallScore,
  }
}

/**
 * Update or create daily metrics record
 */
export async function updateDailyMetrics(
  userId: string,
  date: Date
): Promise<void> {
  // Normalize date to start of day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  // Aggregate data and calculate scores
  const data = await aggregateDailyMetrics(userId, startOfDay)
  const scores = await calculateDailyScores(userId, startOfDay)

  // Upsert daily metrics
  await prisma.dailyMetrics.upsert({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
    create: {
      userId,
      date: startOfDay,
      tasksCompleted: data.tasksCompleted,
      tasksOnTime: data.tasksOnTime,
      habitsCompleted: data.habitsCompleted,
      exerciseMinutes: data.exerciseMinutes,
      caloriesTracked: data.caloriesTracked,
      waterGoalMet: data.waterGoalMet,
      learningMinutes: data.learningMinutes,
      productivityScore: scores.productivityScore,
      wellnessScore: scores.wellnessScore,
      growthScore: scores.growthScore,
    },
    update: {
      tasksCompleted: data.tasksCompleted,
      tasksOnTime: data.tasksOnTime,
      habitsCompleted: data.habitsCompleted,
      exerciseMinutes: data.exerciseMinutes,
      caloriesTracked: data.caloriesTracked,
      waterGoalMet: data.waterGoalMet,
      learningMinutes: data.learningMinutes,
      productivityScore: scores.productivityScore,
      wellnessScore: scores.wellnessScore,
      growthScore: scores.growthScore,
    },
  })

  // Update user's overall scores (rolling average of last 7 days)
  await updateUserScores(userId)
}

/**
 * Update user's overall scores based on recent daily metrics
 */
export async function updateUserScores(userId: string): Promise<void> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // Get last 7 days of metrics
  const recentMetrics = await prisma.dailyMetrics.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: 'desc' },
    take: 7,
  })

  if (recentMetrics.length === 0) {
    return
  }

  // Calculate averages
  const avgProductivity = recentMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / recentMetrics.length
  const avgWellness = recentMetrics.reduce((sum, m) => sum + m.wellnessScore, 0) / recentMetrics.length
  const avgGrowth = recentMetrics.reduce((sum, m) => sum + m.growthScore, 0) / recentMetrics.length
  const avgOverall = calculateOverallScore({
    productivityScore: avgProductivity,
    wellnessScore: avgWellness,
    growthScore: avgGrowth,
    overallScore: 0,
  })

  // Update user scores
  await prisma.user.update({
    where: { id: userId },
    data: {
      productivityScore: Math.round(avgProductivity * 100) / 100,
      wellnessScore: Math.round(avgWellness * 100) / 100,
      growthScore: Math.round(avgGrowth * 100) / 100,
      overallScore: Math.round(avgOverall * 100) / 100,
    },
  })
}
