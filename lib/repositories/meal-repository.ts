import { prisma } from '../prisma'

export interface CreateMealInput {
  userId: string
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  foodItems: string[]
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  date: Date
}

export interface UpdateMealInput {
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  foodItems?: string[]
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  date?: Date
}

export interface MealFilters {
  startDate?: Date
  endDate?: Date
  mealType?: string
}

/**
 * Get all meals for a user with optional filtering
 */
export async function getMeals(
  userId: string,
  filters?: MealFilters
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

  if (filters?.mealType) {
    where.mealType = filters.mealType
  }

  return await prisma.meal.findMany({
    where,
    orderBy: { date: 'desc' },
  })
}

/**
 * Get a single meal by ID
 */
export async function getMealById(mealId: string, userId: string) {
  return await prisma.meal.findFirst({
    where: { id: mealId, userId },
  })
}

/**
 * Create a new meal log
 */
export async function createMeal(input: CreateMealInput) {
  return await prisma.meal.create({
    data: {
      ...input,
      foodItems: JSON.stringify(input.foodItems),
    },
  })
}

/**
 * Update a meal log
 */
export async function updateMeal(
  mealId: string,
  userId: string,
  input: UpdateMealInput
) {
  const data: any = { ...input }
  
  if (input.foodItems) {
    data.foodItems = JSON.stringify(input.foodItems)
  }

  return await prisma.meal.update({
    where: { id: mealId, userId },
    data,
  })
}

/**
 * Delete a meal log
 */
export async function deleteMeal(mealId: string, userId: string) {
  return await prisma.meal.delete({
    where: { id: mealId, userId },
  })
}

/**
 * Get meals for a specific date
 */
export async function getMealsByDate(userId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return await prisma.meal.findMany({
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
 * Check if daily nutrition goals are met for a specific date
 * Returns true if at least 3 meals are logged for the day
 */
export async function checkDailyNutritionGoals(
  userId: string,
  date: Date
): Promise<boolean> {
  const meals = await getMealsByDate(userId, date)
  
  // Consider nutrition goals met if at least 3 meals are logged
  return meals.length >= 3
}
