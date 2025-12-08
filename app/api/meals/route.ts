import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getMeals,
  createMeal,
} from '@/lib/repositories/meal-repository'

/**
 * GET /api/meals
 * Get all meals for the authenticated user with optional filtering
 * Query params:
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - mealType: Filter by meal type (BREAKFAST, LUNCH, DINNER, SNACK)
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
    const mealType = searchParams.get('mealType')

    const filters: any = {}
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)
    if (mealType) filters.mealType = mealType

    const meals = await getMeals(session.user.id, filters)

    // Parse foodItems JSON strings back to arrays
    const parsedMeals = meals.map(meal => ({
      ...meal,
      foodItems: JSON.parse(meal.foodItems),
    }))

    return NextResponse.json({ meals: parsedMeals })
  } catch (error) {
    console.error('Error fetching meals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/meals
 * Create a new meal log
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { mealType, foodItems, calories, protein, carbs, fats, date } = body

    // Validate required fields
    if (!mealType || !foodItems || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: mealType, foodItems, date' },
        { status: 400 }
      )
    }

    // Validate mealType
    const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
    if (!validMealTypes.includes(mealType)) {
      return NextResponse.json(
        { error: 'Invalid mealType. Must be BREAKFAST, LUNCH, DINNER, or SNACK' },
        { status: 400 }
      )
    }

    // Validate foodItems is an array
    if (!Array.isArray(foodItems) || foodItems.length === 0) {
      return NextResponse.json(
        { error: 'foodItems must be a non-empty array' },
        { status: 400 }
      )
    }

    const meal = await createMeal({
      userId: session.user.id,
      mealType,
      foodItems,
      calories,
      protein,
      carbs,
      fats,
      date: new Date(date),
    })

    // Parse foodItems back to array for response
    const parsedMeal = {
      ...meal,
      foodItems: JSON.parse(meal.foodItems),
    }

    return NextResponse.json({ meal: parsedMeal }, { status: 201 })
  } catch (error) {
    console.error('Error creating meal:', error)
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    )
  }
}
