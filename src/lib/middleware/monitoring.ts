import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { performance, errorTracking } from '@/lib/monitoring'

export interface MonitoringOptions {
  trackPerformance?: boolean
  trackErrors?: boolean
  trackUserActions?: boolean
}

// API route monitoring wrapper
export function withMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  options: MonitoringOptions = {}
) {
  const {
    trackPerformance = true,
    trackErrors = true,
    trackUserActions = true,
  } = options

  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    const request = args[0] as NextRequest
    const endpoint = request.url || 'unknown'
    const method = request.method || 'unknown'

    try {
      // Add request context to Sentry
      Sentry.setContext('request', {
        url: endpoint,
        method,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString(),
      })

      // Execute the handler
      const result = await handler(...args)
      
      // Track successful performance
      if (trackPerformance) {
        const duration = Date.now() - startTime
        performance.trackApiCall(endpoint, method, duration, true)
      }

      return result
    } catch (error) {
      // Track error performance
      if (trackPerformance) {
        const duration = Date.now() - startTime
        performance.trackApiCall(endpoint, method, duration, false)
      }

      // Track the error
      if (trackErrors) {
        errorTracking.captureApiError(
          error as Error,
          endpoint,
          method,
          500
        )
      }

      // Re-throw the error
      throw error
    }
  }
}

// Database operation monitoring
export function withDbMonitoring<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string,
  tableName?: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()

    try {
      const result = await operation(...args)
      
      // Track successful database operation
      const duration = Date.now() - startTime
      performance.trackDbQuery(operationName, duration, true)
      
      return result
    } catch (error) {
      // Track failed database operation
      const duration = Date.now() - startTime
      performance.trackDbQuery(operationName, duration, false)
      
      // Capture database error
      errorTracking.captureDbError(
        error as Error,
        operationName,
        tableName
      )
      
      throw error
    }
  }
}

// Response time middleware
export function responseTimeMiddleware(request: NextRequest) {
  const startTime = Date.now()
  
  return {
    end: (response: NextResponse) => {
      const duration = Date.now() - startTime
      
      // Add response time header
      response.headers.set('X-Response-Time', `${duration}ms`)
      
      // Track in Sentry
      Sentry.setMeasurement('response_time', duration, 'millisecond')
      
      return response
    }
  }
}

// Error boundary for API routes
export function apiErrorBoundary<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)
      
      // Capture in Sentry
      Sentry.captureException(error)
      
      // Return error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' 
            ? (error as Error).message 
            : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
  }
}

// Rate limiting monitoring
export function trackRateLimit(
  request: NextRequest,
  remaining: number,
  total: number
) {
  Sentry.setContext('rate_limit', {
    remaining,
    total,
    percentage_used: ((total - remaining) / total) * 100,
    ip: request.ip || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  })
  
  // Alert if rate limit is close to being exceeded
  if (remaining < total * 0.1) {
    Sentry.addBreadcrumb({
      category: 'rate_limit',
      message: 'Rate limit nearly exceeded',
      level: 'warning',
      data: { remaining, total },
    })
  }
}