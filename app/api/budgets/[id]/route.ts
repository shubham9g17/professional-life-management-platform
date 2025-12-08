import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { budgetRepository } from '@/lib/repositories/budget-repository'
import { z } from 'zod'

// Validation schema for budget update
const updateBudgetSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  monthlyLimit: z.number().positive('Monthly limit must be positive').optional(),
  alertThreshold: z.number().min(0).max(100, 'Alert threshold must be between 0 and 100').optional(),
})

/**
 * GET /api/budgets/[id]
 * Get a single budget with spending data
 */
export async function GET(
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

    const { id } = await params

    const budget = await budgetRepository.getBudgetWithSpending(
      id,
      session.user.id
    )

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ budget })
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/budgets/[id]
 * Update a budget
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

    const { id } = await params
    const body = await request.json()
    const validatedData = updateBudgetSchema.parse(body)

    // Check if budget exists and belongs to user
    const existingBudget = await budgetRepository.findById(
      id,
      session.user.id
    )

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // If category is being changed, check for conflicts
    if (validatedData.category && validatedData.category !== existingBudget.category) {
      const conflictingBudget = await budgetRepository.findByCategory(
        session.user.id,
        validatedData.category
      )

      if (conflictingBudget) {
        return NextResponse.json(
          { error: 'Budget already exists for this category' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.monthlyLimit !== undefined) updateData.monthlyLimit = validatedData.monthlyLimit
    if (validatedData.alertThreshold !== undefined) updateData.alertThreshold = validatedData.alertThreshold

    await budgetRepository.update(id, session.user.id, updateData)

    // Fetch updated budget with spending data
    const updatedBudget = await budgetRepository.getBudgetWithSpending(
      id,
      session.user.id
    )

    if (!updatedBudget) {
      return NextResponse.json(
        { error: 'Failed to fetch updated budget' },
        { status: 500 }
      )
    }

    return NextResponse.json({ budget: updatedBudget })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/budgets/[id]
 * Delete a budget
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

    const { id } = await params

    // Check if budget exists and belongs to user
    const existingBudget = await budgetRepository.findById(
      id,
      session.user.id
    )

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    await budgetRepository.delete(id, session.user.id)

    return NextResponse.json(
      { message: 'Budget deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    )
  }
}
