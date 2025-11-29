import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { budgetRepository } from '@/lib/repositories/budget-repository'
import { z } from 'zod'

// Validation schema for budget creation
const createBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  monthlyLimit: z.number().positive('Monthly limit must be positive'),
  alertThreshold: z.number().min(0).max(100, 'Alert threshold must be between 0 and 100'),
})

/**
 * GET /api/budgets
 * Get all budgets for the authenticated user with spending data
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

    const budgets = await budgetRepository.getAllBudgetsWithSpending(session.user.id)

    return NextResponse.json({ budgets })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/budgets
 * Create a new budget
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
    const validatedData = createBudgetSchema.parse(body)

    // Check if budget already exists for this category
    const existingBudget = await budgetRepository.findByCategory(
      session.user.id,
      validatedData.category
    )

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists for this category' },
        { status: 409 }
      )
    }

    const budget = await budgetRepository.create({
      category: validatedData.category,
      monthlyLimit: validatedData.monthlyLimit,
      alertThreshold: validatedData.alertThreshold,
      user: {
        connect: { id: session.user.id },
      },
    })

    // Get budget with spending data
    const budgetWithSpending = await budgetRepository.getBudgetWithSpending(
      budget.id,
      session.user.id
    )

    return NextResponse.json(
      { budget: budgetWithSpending },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}
