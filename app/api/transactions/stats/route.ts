import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { transactionRepository } from '@/lib/repositories/transaction-repository'

/**
 * GET /api/transactions/stats
 * Get transaction statistics for the authenticated user
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
      ? new Date(searchParams.get('startDate')!) 
      : undefined
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined

    const stats = await transactionRepository.getStats(
      session.user.id,
      startDate,
      endDate
    )

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching transaction stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction statistics' },
      { status: 500 }
    )
  }
}
