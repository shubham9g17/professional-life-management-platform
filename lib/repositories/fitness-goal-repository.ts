import { prisma } from '../prisma'

export interface CreateFitnessGoalInput {
  userId: string
  goalType: 'WEIGHT_LOSS' | 'WEIGHT_GAIN' | 'EXERCISE_MINUTES' | 'STRENGTH' | 'ENDURANCE' | 'CUSTOM'
  targetValue: number
  currentValue?: number
  unit: string
  deadline?: Date
}

export interface UpdateFitnessGoalInput {
  goalType?: string
  targetValue?: number
  currentValue?: number
  unit?: string
  deadline?: Date
  status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
}

/**
 * Calculate progress percentage for a fitness goal
 */
export function calculateGoalProgress(currentValue: number, targetValue: number): number {
  if (targetValue === 0) return 0
  const progress = (currentValue / targetValue) * 100
  return Math.min(100, Math.max(0, Math.round(progress * 100) / 100))
}

/**
 * Get all fitness goals for a user
 */
export async function getFitnessGoals(userId: string, status?: string) {
  const where: any = { userId }
  
  if (status) {
    where.status = status
  }

  return await prisma.fitnessGoal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get a single fitness goal by ID
 */
export async function getFitnessGoalById(goalId: string, userId: string) {
  return await prisma.fitnessGoal.findFirst({
    where: { id: goalId, userId },
  })
}

/**
 * Create a new fitness goal
 */
export async function createFitnessGoal(input: CreateFitnessGoalInput) {
  return await prisma.fitnessGoal.create({
    data: {
      userId: input.userId,
      goalType: input.goalType,
      targetValue: input.targetValue,
      currentValue: input.currentValue || 0,
      unit: input.unit,
      deadline: input.deadline,
      status: 'ACTIVE',
    },
  })
}

/**
 * Update a fitness goal
 */
export async function updateFitnessGoal(
  goalId: string,
  userId: string,
  input: UpdateFitnessGoalInput
) {
  const goal = await prisma.fitnessGoal.findFirst({
    where: { id: goalId, userId },
  })

  if (!goal) {
    throw new Error('Fitness goal not found')
  }

  // Auto-complete goal if target is reached
  const updates: any = { ...input }
  if (input.currentValue !== undefined && input.currentValue >= goal.targetValue) {
    updates.status = 'COMPLETED'
  }

  return await prisma.fitnessGoal.update({
    where: { id: goalId, userId },
    data: updates,
  })
}

/**
 * Delete a fitness goal
 */
export async function deleteFitnessGoal(goalId: string, userId: string) {
  return await prisma.fitnessGoal.delete({
    where: { id: goalId, userId },
  })
}

/**
 * Update goal progress based on current value
 */
export async function updateGoalProgress(
  goalId: string,
  userId: string,
  currentValue: number
) {
  const goal = await getFitnessGoalById(goalId, userId)
  
  if (!goal) {
    throw new Error('Fitness goal not found')
  }

  const updates: any = { currentValue }
  
  // Auto-complete if target reached
  if (currentValue >= goal.targetValue) {
    updates.status = 'COMPLETED'
  }

  return await prisma.fitnessGoal.update({
    where: { id: goalId, userId },
    data: updates,
  })
}

/**
 * Get active fitness goals with progress
 */
export async function getActiveGoalsWithProgress(userId: string) {
  const goals = await prisma.fitnessGoal.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  })

  return goals.map((goal) => ({
    ...goal,
    progress: calculateGoalProgress(goal.currentValue, goal.targetValue),
  }))
}
