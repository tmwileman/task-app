import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { healthMonitoring } from '@/lib/monitoring'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connectivity
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStart
    
    // Get memory usage (server-side)
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    
    // Get uptime
    const uptime = process.uptime()
    
    // Check overall health
    const healthCheck = await healthMonitoring.checkHealth()
    
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: 'connected',
          responseTime: `${dbResponseTime}ms`,
        },
        memory: {
          status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
          usage: `${Math.round(memoryUsagePercent)}%`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
        system: {
          uptime: `${Math.round(uptime)}s`,
          responseTime: `${responseTime}ms`,
        },
      },
      overall: healthCheck,
    }
    
    // Set response headers for monitoring
    const response = NextResponse.json(healthData)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-Response-Time', `${responseTime}ms`)
    response.headers.set('X-Health-Check', 'passed')
    
    return response
  } catch (error) {
    console.error('Health check failed:', error)
    
    const responseTime = Date.now() - startTime
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : 'System unavailable',
      responseTime: `${responseTime}ms`,
    }
    
    const response = NextResponse.json(errorData, { status: 503 })
    response.headers.set('X-Response-Time', `${responseTime}ms`)
    response.headers.set('X-Health-Check', 'failed')
    
    return response
  }
}