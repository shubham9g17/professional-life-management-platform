import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { notificationRepository } from '@/lib/repositories/notification-repository'

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const preferences = await notificationRepository.getPreferences(session.user.id)

    if (!preferences) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for the authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate quiet hours: HH:mm with hours 00-23 and minutes 00-59.
    const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
    if (body.quietHoursStart && !HHMM.test(body.quietHoursStart)) {
      return NextResponse.json(
        { error: 'Invalid quietHoursStart format. Use HH:mm (00:00-23:59)' },
        { status: 400 }
      )
    }

    if (body.quietHoursEnd && !HHMM.test(body.quietHoursEnd)) {
      return NextResponse.json(
        { error: 'Invalid quietHoursEnd format. Use HH:mm (00:00-23:59)' },
        { status: 400 }
      )
    }

    // Validate notification frequency
    if (body.notificationFrequency && !['REALTIME', 'HOURLY', 'DAILY'].includes(body.notificationFrequency)) {
      return NextResponse.json(
        { error: 'Invalid notificationFrequency. Must be REALTIME, HOURLY, or DAILY' },
        { status: 400 }
      )
    }

    const preferences = await notificationRepository.updatePreferences(
      session.user.id,
      body
    )

    if (!preferences) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
