import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period, 10)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Basic task statistics
    const totalTasks = await db.task.count({
      where: { userId: session.user.id, archived: false }
    })

    const completedTasks = await db.task.count({
      where: { userId: session.user.id, completed: true, archived: false }
    })

    const overdueTasks = await db.task.count({
      where: {
        userId: session.user.id,
        completed: false,
        archived: false,
        dueDate: { lt: new Date() }
      }
    })

    const todayTasks = await db.task.count({
      where: {
        userId: session.user.id,
        archived: false,
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    })

    // Priority distribution
    const priorityStats = await db.task.groupBy({
      by: ['priority'],
      where: { userId: session.user.id, archived: false },
      _count: true
    })

    // List statistics
    const listStats = await db.task.groupBy({
      by: ['listId'],
      where: { userId: session.user.id, archived: false },
      _count: true
    })

    const lists = await db.taskList.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true }
    })

    const listStatsWithNames = listStats.map(stat => {
      const list = lists.find(l => l.id === stat.listId)
      return {
        listId: stat.listId,
        listName: list?.name || 'No List',
        count: stat._count
      }
    })

    // Completion trend (last 30 days)
    const completionTrend = await db.task.findMany({
      where: {
        userId: session.user.id,
        completed: true,
        completedAt: { gte: startDate }
      },
      select: { completedAt: true },
      orderBy: { completedAt: 'asc' }
    })

    // Group by day
    const trendData: { [key: string]: number } = {}
    const last30Days = Array.from({ length: periodDays }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (periodDays - 1 - i))
      return date.toISOString().split('T')[0]
    })

    last30Days.forEach(date => {
      trendData[date] = 0
    })

    completionTrend.forEach(task => {
      if (task.completedAt) {
        const date = task.completedAt.toISOString().split('T')[0]
        if (trendData[date] !== undefined) {
          trendData[date]++
        }
      }
    })

    // Productivity metrics
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)

    const thisWeekCompleted = await db.task.count({
      where: {
        userId: session.user.id,
        completed: true,
        completedAt: { gte: thisWeekStart }
      }
    })

    const lastWeekStart = new Date()
    lastWeekStart.setDate(lastWeekStart.getDate() - 14)
    const lastWeekEnd = new Date()
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

    const lastWeekCompleted = await db.task.count({
      where: {
        userId: session.user.id,
        completed: true,
        completedAt: { gte: lastWeekStart, lt: lastWeekEnd }
      }
    })

    const productivityTrend = lastWeekCompleted > 0 
      ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
      : thisWeekCompleted > 0 ? 100 : 0

    // Response
    return NextResponse.json({
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
        todayTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      productivity: {
        thisWeekCompleted,
        lastWeekCompleted,
        trend: productivityTrend,
        avgTasksPerDay: Math.round(thisWeekCompleted / 7)
      },
      distribution: {
        byPriority: priorityStats.map(stat => ({
          priority: stat.priority,
          count: stat._count
        })),
        byList: listStatsWithNames
      },
      completion: {
        trend: Object.entries(trendData).map(([date, count]) => ({
          date,
          count
        })),
        period: periodDays
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}