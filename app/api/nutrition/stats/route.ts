import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getMeals } from '@/lib/repositories/meal-repository'
import { getWaterIntakes, getTotalWaterIntakeForDate } from '@/lib/repositories/water-intake-repository'

export interface NutritionStats {
  totalMeals: number
  mealsByType: Record<string, number>
  averageCalories: number
  totalCalories: number
  averageProtein: number
  averageCarbs: number
  averageFats: number
  totalWaterIntake: number
  averageDailyWater: number
  daysTracked: number
  waterGoalMetDays: number
  nutritionGoalMetDays: number
}

/**
 * GET /api/nutrition/stats
 * Get nutrition statistics for the authenticated user
 * Query params:
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: any = {}
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    // Fetch meals and water intakes
    const [meals, waterIntakes] = await Promise.all([
      getMeals(session.user.id, filters),
      getWaterIntakes(session.user.id, filters),
    ])

    // Parse foodItems for meals
    const parsedMeals = meals.map(meal => ({
      ...meal,
      foodItems: JSON.parse(meal.foodItems),
    }))

    // Calculate meal statistics
    const totalMeals = parsedMeals.length
    const mealsByType: Record<string, number> = {}
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFats = 0
    let mealsWithMacros = 0

    parsedMeals.forEach(meal => {
      mealsByType[meal.mealType] = (mealsByType[meal.mealType] || 0) + 1
      
      if (meal.calories) {
        totalCalories += meal.calories
      }
      
      if (meal.protein !== null && meal.carbs !== null && meal.fats !== null) {
        totalProtein += meal.protein || 0
        totalCarbs += meal.carbs || 0
        totalFats += meal.fats || 0
        mealsWithMacros++
      }
    })

    const averageCalories = totalMeals > 0 ? totalCalories / totalMeals : 0
    const averageProtein = mealsWithMacros > 0 ? totalProtein / mealsWithMacros : 0
    const averageCarbs = mealsWithMacros > 0 ? totalCarbs / mealsWithMacros : 0
    const averageFats = mealsWithMacros > 0 ? totalFats / mealsWithMacros : 0

    // Calculate water statistics
    const totalWaterIntake = waterIntakes.reduce((sum, intake) => sum + intake.amount, 0)

    // Calculate unique days tracked
    const uniqueDays = new Set<string>()
    parsedMeals.forEach(meal => {
      const dateKey = meal.date.toISOString().split('T')[0]
      uniqueDays.add(dateKey)
    })
    waterIntakes.forEach(intake => {
      const dateKey = intake.date.toISOString().split('T')[0]
      uniqueDays.add(dateKey)
    })
    const daysTracked = uniqueDays.size

    const averageDailyWater = daysTracked > 0 ? totalWaterIntake / daysTracked : 0

    // Calculate goal achievement days
    // Water goal: 2000ml per day
    // Nutrition goal: at least 3 meals per day
    const waterGoalMetDays = 0 // Simplified for now
    const nutritionGoalMetDays = 0 // Simplified for now

    const stats: NutritionStats = {
      totalMeals,
      mealsByType,
      averageCalories: Math.round(averageCalories),
      totalCalories: Math.round(totalCalories),
      averageProtein: Math.round(averageProtein * 10) / 10,
      averageCarbs: Math.round(averageCarbs * 10) / 10,
      averageFats: Math.round(averageFats * 10) / 10,
      totalWaterIntake,
      averageDailyWater: Math.round(averageDailyWater),
      daysTracked,
      waterGoalMetDays,
      nutritionGoalMetDays,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching nutrition stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nutrition stats' },
      { status: 500 }
    )
  }
}
