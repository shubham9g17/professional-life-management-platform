import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getMealById,
  updateMeal,
  deleteMeal,
} from '@/lib/repositories/meal-repository'

/**
 * PATCH /api/meals/[id]
 * Update a meal log
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: mealId } = await params
    const body = await request.json()

    // Check if meal exists and belongs to user
    const existingMeal = await getMealById(mealId, session.user.id)
    if (!existingMeal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      )
    }

    // Validate mealType if provided
    if (body.mealType) {
      const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
      if (!validMealTypes.includes(body.mealType)) {
        return NextResponse.json(
          { error: 'Invalid mealType. Must be BREAKFAST, LUNCH, DINNER, or SNACK' },
          { status: 400 }
        )
      }
    }

    // Validate foodItems if provided
    if (body.foodItems && (!Array.isArray(body.foodItems) || body.foodItems.length === 0)) {
      return NextResponse.json(
        { error: 'foodItems must be a non-empty array' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (body.mealType) updateData.mealType = body.mealType
    if (body.foodItems) updateData.foodItems = body.foodItems
    if (body.calories !== undefined) updateData.calories = body.calories
    if (body.protein !== undefined) updateData.protein = body.protein
    if (body.carbs !== undefined) updateData.carbs = body.carbs
    if (body.fats !== undefined) updateData.fats = body.fats
    if (body.date) updateData.date = new Date(body.date)

    const meal = await updateMeal(mealId, session.user.id, updateData)

    // Parse foodItems back to array for response
    const parsedMeal = {
      ...meal,
      foodItems: JSON.parse(meal.foodItems),
    }

    return NextResponse.json({ meal: parsedMeal })
  } catch (error) {
    console.error('Error updating meal:', error)
    return NextResponse.json(
      { error: 'Failed to update meal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/meals/[id]
 * Delete a meal log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: mealId } = await params

    // Check if meal exists and belongs to user
    const existingMeal = await getMealById(mealId, session.user.id)
    if (!existingMeal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      )
    }

    await deleteMeal(mealId, session.user.id)

    return NextResponse.json({ message: 'Meal deleted successfully' })
  } catch (error) {
    console.error('Error deleting meal:', error)
    return NextResponse.json(
      { error: 'Failed to delete meal' },
      { status: 500 }
    )
  }
}
