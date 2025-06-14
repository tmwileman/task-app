import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Archive multiple tasks
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskIds, action } = await request.json()

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'Task IDs required' }, { status: 400 })
    }

    const now = new Date()

    if (action === 'archive') {
      // Archive tasks
      const result = await db.task.updateMany({
        where: {
          id: { in: taskIds },
          userId: session.user.id,
          archived: false
        },
        data: {
          archived: true,
          archivedAt: now
        }
      })

      return NextResponse.json({ 
        success: true, 
        archivedCount: result.count,
        message: `${result.count} task(s) archived`
      })
    } else if (action === 'unarchive') {
      // Unarchive tasks
      const result = await db.task.updateMany({
        where: {
          id: { in: taskIds },
          userId: session.user.id,
          archived: true
        },
        data: {
          archived: false,
          archivedAt: null
        }
      })

      return NextResponse.json({ 
        success: true, 
        unarchivedCount: result.count,
        message: `${result.count} task(s) restored from archive`
      })
    } else if (action === 'delete') {
      // Permanently delete archived tasks
      const result = await db.task.deleteMany({
        where: {
          id: { in: taskIds },
          userId: session.user.id,
          archived: true
        }
      })

      return NextResponse.json({ 
        success: true, 
        deletedCount: result.count,
        message: `${result.count} task(s) permanently deleted`
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing task archive:', error)
    return NextResponse.json(
      { error: 'Failed to manage archive' },
      { status: 500 }
    )
  }
}

// Get archived tasks
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const cursor = searchParams.get('cursor')

    const archivedTasks = await db.task.findMany({
      where: {
        userId: session.user.id,
        archived: true,
        parentId: null // Only top-level tasks
      },
      include: {
        list: true,
        subtasks: {
          where: { archived: false }, // Include non-archived subtasks
          orderBy: { order: 'asc' }
        },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: [
        { archivedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0
    })

    const hasNextPage = archivedTasks.length > limit
    const tasks = hasNextPage ? archivedTasks.slice(0, -1) : archivedTasks
    const nextCursor = hasNextPage ? tasks[tasks.length - 1]?.id : undefined

    // Get archive statistics
    const stats = await db.task.groupBy({
      by: ['archived'],
      where: {
        userId: session.user.id
      },
      _count: true
    })

    const archiveStats = {
      totalArchived: stats.find(s => s.archived)._count || 0,
      totalActive: stats.find(s => !s.archived)._count || 0
    }

    return NextResponse.json({
      tasks,
      nextCursor,
      hasNextPage,
      stats: archiveStats
    })

  } catch (error) {
    console.error('Error fetching archived tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archived tasks' },
      { status: 500 }
    )
  }
}