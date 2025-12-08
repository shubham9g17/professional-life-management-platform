import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { transactionRepository } from '@/lib/repositories/transaction-repository'
import { z } from 'zod'

// Validation schema for transaction creation
const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required').max(100),
  subcategory: z.string().max(100).optional(),
  description: z.string().min(1, 'Description is required').max(500),
  date: z.string().datetime(),
  tags: z.array(z.string()).default([]),
})

/**
 * GET /api/transactions
 * Get all transactions for the authenticated user with optional filtering
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
    
    const filters = {
      type: searchParams.get('type') as 'INCOME' | 'EXPENSE' | undefined,
      category: searchParams.get('category') || undefined,
      startDate: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : undefined,
      endDate: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : undefined,
      tags: searchParams.get('tags')
        ? searchParams.get('tags')!.split(',')
        : undefined,
    }

    const transactions = await transactionRepository.findByUserId(session.user.id, filters)

    // Parse tags from JSON string to array
    const transactionsWithParsedTags = transactions.map((transaction: any) => ({
      ...transaction,
      tags: transaction.tags ? JSON.parse(transaction.tags) : [],
    }))

    return NextResponse.json({ transactions: transactionsWithParsedTags })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
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
    const validatedData = createTransactionSchema.parse(body)

    const transaction = await transactionRepository.create({
      amount: validatedData.amount,
      type: validatedData.type,
      category: validatedData.category,
      subcategory: validatedData.subcategory,
      description: validatedData.description,
      date: new Date(validatedData.date),
      tags: JSON.stringify(validatedData.tags),
      user: {
        connect: { id: session.user.id },
      },
    })

    // Parse tags back to array for response
    const transactionWithParsedTags = {
      ...transaction,
      tags: transaction.tags ? JSON.parse(transaction.tags) : [],
    }

    return NextResponse.json(
      { transaction: transactionWithParsedTags },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
