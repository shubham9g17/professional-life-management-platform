import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getWaterIntakeById,
  deleteWaterIntake,
} from '@/lib/repositories/water-intake-repository'

/**
 * DELETE /api/water/[id]
 * Delete a water intake log
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

    const { id: intakeId } = await params

    // Check if water intake exists and belongs to user
    const existingIntake = await getWaterIntakeById(intakeId, session.user.id)
    if (!existingIntake) {
      return NextResponse.json(
        { error: 'Water intake not found' },
        { status: 404 }
      )
    }

    await deleteWaterIntake(intakeId, session.user.id)

    return NextResponse.json({ message: 'Water intake deleted successfully' })
  } catch (error) {
    console.error('Error deleting water intake:', error)
    return NextResponse.json(
      { error: 'Failed to delete water intake' },
      { status: 500 }
    )
  }
}
