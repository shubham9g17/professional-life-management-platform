import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { transactionRepository } from '@/lib/repositories/transaction-repository'
import { z } from 'zod'

// Validation schema for transaction update
const updateTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().min(1).max(100).optional(),
  subcategory: z.string().max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  date: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
})

/**
 * PATCH /api/transactions/[id]
 * Update a transaction
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
    const validatedData = updateTransactionSchema.parse(body)

    // Check if transaction exists and belongs to user
    const existingTransaction = await transactionRepository.findById(
      id,
      session.user.id
    )

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.subcategory !== undefined) updateData.subcategory = validatedData.subcategory
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date)
    if (validatedData.tags !== undefined) updateData.tags = JSON.stringify(validatedData.tags)

    await transactionRepository.update(id, session.user.id, updateData)

    // Fetch updated transaction
    const updatedTransaction = await transactionRepository.findById(
      id,
      session.user.id
    )

    if (!updatedTransaction) {
      return NextResponse.json(
        { error: 'Failed to fetch updated transaction' },
        { status: 500 }
      )
    }

    // Parse tags back to array for response
    const transactionWithParsedTags = {
      ...updatedTransaction,
      tags: updatedTransaction.tags ? JSON.parse(updatedTransaction.tags) : [],
    }

    return NextResponse.json({ transaction: transactionWithParsedTags })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete a transaction
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

    // Check if transaction exists and belongs to user
    const existingTransaction = await transactionRepository.findById(
      id,
      session.user.id
    )

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    await transactionRepository.delete(id, session.user.id)

    return NextResponse.json(
      { message: 'Transaction deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
