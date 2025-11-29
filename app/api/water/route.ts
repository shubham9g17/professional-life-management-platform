import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getWaterIntakes,
  createWaterIntake,
} from '@/lib/repositories/water-intake-repository'

/**
 * GET /api/water
 * Get all water intake logs for the authenticated user with optional filtering
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

    const waterIntakes = await getWaterIntakes(session.user.id, filters)

    return NextResponse.json({ waterIntakes })
  } catch (error) {
    console.error('Error fetching water intakes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch water intakes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/water
 * Create a new water intake log
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
    const { amount, date } = body

    // Validate required fields
    if (!amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, date' },
        { status: 400 }
      )
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number (in ml)' },
        { status: 400 }
      )
    }

    const waterIntake = await createWaterIntake({
      userId: session.user.id,
      amount,
      date: new Date(date),
    })

    return NextResponse.json({ waterIntake }, { status: 201 })
  } catch (error) {
    console.error('Error creating water intake:', error)
    return NextResponse.json(
      { error: 'Failed to create water intake' },
      { status: 500 }
    )
  }
}
