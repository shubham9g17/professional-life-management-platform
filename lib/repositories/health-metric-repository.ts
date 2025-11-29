import { prisma } from '../prisma'

export interface CreateHealthMetricInput {
  userId: string
  date: Date
  weight?: number
  sleepQuality?: number // 1-10
  stressLevel?: number // 1-10
  energyLevel?: number // 1-10
}

export interface UpdateHealthMetricInput {
  weight?: number
  sleepQuality?: number
  stressLevel?: number
  energyLevel?: number
}

export interface HealthMetricTrends {
  weightTrend: Array<{ date: Date; value: number }>
  sleepQualityTrend: Array<{ date: Date; value: number }>
  stressLevelTrend: Array<{ date: Date; value: number }>
  energyLevelTrend: Array<{ date: Date; value: number }>
  averages: {
    weight?: number
    sleepQuality?: number
    stressLevel?: number
    energyLevel?: number
  }
}

/**
 * Get all health metrics for a user within a date range
 */
export async function getHealthMetrics(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { userId }

  if (startDate || endDate) {
    where.date = {}
    if (startDate) {
      where.date.gte = startDate
    }
    if (endDate) {
      where.date.lte = endDate
    }
  }

  return await prisma.healthMetric.findMany({
    where,
    orderBy: { date: 'desc' },
  })
}

/**
 * Get health metric for a specific date
 */
export async function getHealthMetricByDate(userId: string, date: Date) {
  // Normalize date to start of day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  return await prisma.healthMetric.findFirst({
    where: {
      userId,
      date: startOfDay,
    },
  })
}

/**
 * Create or update health metric for a specific date
 */
export async function upsertHealthMetric(input: CreateHealthMetricInput) {
  // Normalize date to start of day
  const startOfDay = new Date(input.date)
  startOfDay.setHours(0, 0, 0, 0)

  return await prisma.healthMetric.upsert({
    where: {
      userId_date: {
        userId: input.userId,
        date: startOfDay,
      },
    },
    create: {
      userId: input.userId,
      date: startOfDay,
      weight: input.weight,
      sleepQuality: input.sleepQuality,
      stressLevel: input.stressLevel,
      energyLevel: input.energyLevel,
    },
    update: {
      weight: input.weight,
      sleepQuality: input.sleepQuality,
      stressLevel: input.stressLevel,
      energyLevel: input.energyLevel,
    },
  })
}

/**
 * Update health metric for a specific date
 */
export async function updateHealthMetric(
  userId: string,
  date: Date,
  input: UpdateHealthMetricInput
) {
  // Normalize date to start of day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  return await prisma.healthMetric.update({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
    data: input,
  })
}

/**
 * Delete health metric for a specific date
 */
export async function deleteHealthMetric(userId: string, date: Date) {
  // Normalize date to start of day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  return await prisma.healthMetric.delete({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
  })
}

/**
 * Get health metric trends over time
 */
export async function getHealthMetricTrends(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<HealthMetricTrends> {
  const metrics = await prisma.healthMetric.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  })

  // Build trend arrays
  const weightTrend = metrics
    .filter((m) => m.weight !== null)
    .map((m) => ({ date: m.date, value: m.weight! }))

  const sleepQualityTrend = metrics
    .filter((m) => m.sleepQuality !== null)
    .map((m) => ({ date: m.date, value: m.sleepQuality! }))

  const stressLevelTrend = metrics
    .filter((m) => m.stressLevel !== null)
    .map((m) => ({ date: m.date, value: m.stressLevel! }))

  const energyLevelTrend = metrics
    .filter((m) => m.energyLevel !== null)
    .map((m) => ({ date: m.date, value: m.energyLevel! }))

  // Calculate averages
  const averages = {
    weight:
      weightTrend.length > 0
        ? weightTrend.reduce((sum, t) => sum + t.value, 0) / weightTrend.length
        : undefined,
    sleepQuality:
      sleepQualityTrend.length > 0
        ? sleepQualityTrend.reduce((sum, t) => sum + t.value, 0) / sleepQualityTrend.length
        : undefined,
    stressLevel:
      stressLevelTrend.length > 0
        ? stressLevelTrend.reduce((sum, t) => sum + t.value, 0) / stressLevelTrend.length
        : undefined,
    energyLevel:
      energyLevelTrend.length > 0
        ? energyLevelTrend.reduce((sum, t) => sum + t.value, 0) / energyLevelTrend.length
        : undefined,
  }

  return {
    weightTrend,
    sleepQualityTrend,
    stressLevelTrend,
    energyLevelTrend,
    averages,
  }
}

/**
 * Get latest health metrics
 */
export async function getLatestHealthMetric(userId: string) {
  return await prisma.healthMetric.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  })
}
