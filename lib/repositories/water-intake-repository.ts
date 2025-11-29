import { prisma } from '../prisma'

export interface CreateWaterIntakeInput {
  userId: string
  amount: number // ml
  date: Date
}

export interface WaterIntakeFilters {
  startDate?: Date
  endDate?: Date
}

/**
 * Get all water intake logs for a user with optional filtering
 */
export async function getWaterIntakes(
  userId: string,
  filters?: WaterIntakeFilters
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

  return await prisma.waterIntake.findMany({
    where,
    orderBy: { date: 'desc' },
  })
}

/**
 * Get a single water intake log by ID
 */
export async function getWaterIntakeById(intakeId: string, userId: string) {
  return await prisma.waterIntake.findFirst({
    where: { id: intakeId, userId },
  })
}

/**
 * Create a new water intake log
 */
export async function createWaterIntake(input: CreateWaterIntakeInput) {
  return await prisma.waterIntake.create({
    data: input,
  })
}

/**
 * Delete a water intake log
 */
export async function deleteWaterIntake(intakeId: string, userId: string) {
  return await prisma.waterIntake.delete({
    where: { id: intakeId, userId },
  })
}

/**
 * Get water intake for a specific date
 */
export async function getWaterIntakeByDate(userId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return await prisma.waterIntake.findMany({
    where: {
      userId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { date: 'asc' },
  })
}

/**
 * Get total water intake for a specific date
 */
export async function getTotalWaterIntakeForDate(
  userId: string,
  date: Date
): Promise<number> {
  const intakes = await getWaterIntakeByDate(userId, date)
  return intakes.reduce((total, intake) => total + intake.amount, 0)
}

/**
 * Check if daily water goal is met for a specific date
 * Default goal is 2000ml (2 liters)
 */
export async function checkDailyWaterGoal(
  userId: string,
  date: Date,
  goalAmount: number = 2000
): Promise<boolean> {
  const totalIntake = await getTotalWaterIntakeForDate(userId, date)
  return totalIntake >= goalAmount
}
