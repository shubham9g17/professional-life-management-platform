import { prisma } from '../prisma'

export interface CreateExerciseInput {
  userId: string
  activityType: string
  duration: number // minutes
  intensity: 'LOW' | 'MODERATE' | 'HIGH' | 'INTENSE'
  caloriesBurned?: number
  notes?: string
  date: Date
}

export interface UpdateExerciseInput {
  activityType?: string
  duration?: number
  intensity?: 'LOW' | 'MODERATE' | 'HIGH' | 'INTENSE'
  caloriesBurned?: number
  notes?: string
  date?: Date
}

export interface ExerciseFilters {
  startDate?: Date
  endDate?: Date
  activityType?: string
  intensity?: string
}

export interface ExerciseStats {
  totalExercises: number
  totalMinutes: number
  totalCalories: number
  averageIntensity: string
  mostCommonActivity: string
  exercisesByType: Record<string, number>
  exercisesByIntensity: Record<string, number>
  weeklyMinutes: number
  monthlyMinutes: number
}

/**
 * Get all exercises for a user with optional filtering
 */
export async function getExercises(
  userId: string,
  filters?: ExerciseFilters
) {
  const where: any = { userId }

  if (filters?.startDate || filters?.endDate) {
    where.date = {}
    if (filters.startDate) {
      where.date.gte = filters.startDate
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate
    }
  }

  if (filters?.activityType) {
    where.activityType = filters.activityType
  }

  if (filters?.intensity) {
    where.intensity = filters.intensity
  }

  return await prisma.exercise.findMany({
    where,
    orderBy: { date: 'desc' },
  })
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(exerciseId: string, userId: string) {
  return await prisma.exercise.findFirst({
    where: { id: exerciseId, userId },
  })
}

/**
 * Create a new exercise log
 */
export async function createExercise(input: CreateExerciseInput) {
  return await prisma.exercise.create({
    data: input,
  })
}

/**
 * Update an exercise log
 */
export async function updateExercise(
  exerciseId: string,
  userId: string,
  input: UpdateExerciseInput
) {
  return await prisma.exercise.update({
    where: { id: exerciseId, userId },
    data: input,
  })
}

/**
 * Delete an exercise log
 */
export async function deleteExercise(exerciseId: string, userId: string) {
  return await prisma.exercise.delete({
    where: { id: exerciseId, userId },
  })
}

/**
 * Get exercise statistics for a user
 */
export async function getExerciseStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ExerciseStats> {
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

  const exercises = await prisma.exercise.findMany({
    where,
  })

  // Calculate statistics
  const totalExercises = exercises.length
  const totalMinutes = exercises.reduce((sum, ex) => sum + ex.duration, 0)
  const totalCalories = exercises.reduce(
    (sum, ex) => sum + (ex.caloriesBurned || 0),
    0
  )

  // Calculate average intensity
  const intensityScores = {
    LOW: 1,
    MODERATE: 2,
    HIGH: 3,
    INTENSE: 4,
  }
  const avgIntensityScore =
    exercises.length > 0
      ? exercises.reduce(
          (sum, ex) => sum + intensityScores[ex.intensity as keyof typeof intensityScores],
          0
        ) / exercises.length
      : 0
  
  const averageIntensity =
    avgIntensityScore <= 1.5
      ? 'LOW'
      : avgIntensityScore <= 2.5
      ? 'MODERATE'
      : avgIntensityScore <= 3.5
      ? 'HIGH'
      : 'INTENSE'

  // Count exercises by type
  const exercisesByType: Record<string, number> = {}
  exercises.forEach((ex) => {
    exercisesByType[ex.activityType] = (exercisesByType[ex.activityType] || 0) + 1
  })

  // Find most common activity
  const mostCommonActivity =
    Object.entries(exercisesByType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'

  // Count exercises by intensity
  const exercisesByIntensity: Record<string, number> = {}
  exercises.forEach((ex) => {
    exercisesByIntensity[ex.intensity] = (exercisesByIntensity[ex.intensity] || 0) + 1
  })

  // Calculate weekly and monthly minutes
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const weeklyMinutes = exercises
    .filter((ex) => ex.date >= weekAgo)
    .reduce((sum, ex) => sum + ex.duration, 0)

  const monthlyMinutes = exercises
    .filter((ex) => ex.date >= monthAgo)
    .reduce((sum, ex) => sum + ex.duration, 0)

  return {
    totalExercises,
    totalMinutes,
    totalCalories,
    averageIntensity,
    mostCommonActivity,
    exercisesByType,
    exercisesByIntensity,
    weeklyMinutes,
    monthlyMinutes,
  }
}

/**
 * Get exercises for a specific date range (for weekly/monthly views)
 */
export async function getExercisesByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.exercise.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  })
}
