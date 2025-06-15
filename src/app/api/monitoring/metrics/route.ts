import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow authenticated users to access metrics
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const startTime = Date.now()
    
    // Get system metrics
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()
    
    // Get database metrics
    const dbStart = Date.now()
    const [taskCount, userCount] = await Promise.all([
      db.task.count(),
      db.user.count(),
    ])
    const dbResponseTime = Date.now() - dbStart
    
    // Calculate derived metrics
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    const responseTime = Date.now() - startTime
    
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: Math.round(uptime),
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          usage: Math.round(memoryUsagePercent),
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        },
        performance: {
          responseTime,
          dbResponseTime,
        },
      },
      database: {
        status: 'connected',
        responseTime: dbResponseTime,
        metrics: {
          totalTasks: taskCount,
          totalUsers: userCount,
        },
      },
      application: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
      },
    }
    
    const response = NextResponse.json(metrics)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-Response-Time', `${responseTime}ms`)
    
    return response
  } catch (error) {
    console.error('Metrics endpoint error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}