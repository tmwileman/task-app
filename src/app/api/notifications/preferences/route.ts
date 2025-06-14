import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await db.notificationPreferences.findUnique({
      where: {
        userId: session.user.id
      }
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await db.notificationPreferences.create({
        data: {
          userId: session.user.id,
          deadlineReminders: {
            enabled: true,
            intervals: [1440, 120, 30], // 1 day, 2 hours, 30 minutes
            types: ['browser', 'push'],
            sound: true,
            vibrate: true
          },
          dailyDigest: true,
          weeklyReview: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        }
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { deadlineReminders, dailyDigest, weeklyReview, quietHours } = await request.json()

    const preferences = await db.notificationPreferences.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        deadlineReminders,
        dailyDigest,
        weeklyReview,
        quietHours,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        deadlineReminders,
        dailyDigest,
        weeklyReview,
        quietHours
      }
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}