import * as Sentry from '@sentry/nextjs'

// Performance monitoring utilities
export const performance = {
  // Track page load performance
  trackPageLoad: (page: string, loadTime: number) => {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `Page loaded: ${page}`,
      level: 'info',
      data: { loadTime, page },
    })
    
    // Send performance metric
    Sentry.setMeasurement('page_load_time', loadTime, 'millisecond')
  },
  
  // Track API response times
  trackApiCall: (endpoint: string, method: string, duration: number, success: boolean) => {
    Sentry.addBreadcrumb({
      category: 'api',
      message: `API call: ${method} ${endpoint}`,
      level: success ? 'info' : 'error',
      data: { endpoint, method, duration, success },
    })
    
    Sentry.setMeasurement(`api_${method.toLowerCase()}_time`, duration, 'millisecond')
  },
  
  // Track database query performance
  trackDbQuery: (query: string, duration: number, success: boolean) => {
    Sentry.addBreadcrumb({
      category: 'database',
      message: `DB query executed`,
      level: success ? 'info' : 'error',
      data: { query: query.substring(0, 100), duration, success },
    })
    
    Sentry.setMeasurement('db_query_time', duration, 'millisecond')
  },
}

// Error tracking utilities
export const errorTracking = {
  // Capture user action errors
  captureUserError: (error: Error, context: Record<string, any> = {}) => {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'user_action')
      scope.setContext('user_action', context)
      Sentry.captureException(error)
    })
  },
  
  // Capture API errors
  captureApiError: (error: Error, endpoint: string, method: string, statusCode?: number) => {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'api_error')
      scope.setTag('endpoint', endpoint)
      scope.setTag('method', method)
      if (statusCode) scope.setTag('status_code', statusCode.toString())
      Sentry.captureException(error)
    })
  },
  
  // Capture database errors
  captureDbError: (error: Error, operation: string, table?: string) => {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'database_error')
      scope.setTag('operation', operation)
      if (table) scope.setTag('table', table)
      Sentry.captureException(error)
    })
  },
}

// User tracking utilities
export const userTracking = {
  // Set user context
  setUser: (userId: string, email?: string, name?: string) => {
    Sentry.setUser({
      id: userId,
      email,
      username: name,
    })
  },
  
  // Clear user context (on logout)
  clearUser: () => {
    Sentry.setUser(null)
  },
  
  // Track user actions
  trackUserAction: (action: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      category: 'user',
      message: `User action: ${action}`,
      level: 'info',
      data,
    })
  },
}

// Application monitoring utilities
export const appMonitoring = {
  // Track feature usage
  trackFeatureUsage: (feature: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      category: 'feature',
      message: `Feature used: ${feature}`,
      level: 'info',
      data,
    })
  },
  
  // Track business metrics
  trackBusinessMetric: (metric: string, value: number, unit?: string) => {
    Sentry.setMeasurement(metric, value, unit)
  },
  
  // Custom event tracking
  trackEvent: (event: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      category: 'custom',
      message: event,
      level: 'info',
      data,
    })
  },
}

// Health monitoring utilities
export const healthMonitoring = {
  // Check application health
  checkHealth: async (): Promise<{
    status: 'healthy' | 'unhealthy'
    checks: Record<string, boolean>
    timestamp: string
  }> => {
    const checks = {
      database: false,
      memory: false,
      disk: false,
    }
    
    try {
      // Database check (would be imported from db utility)
      // checks.database = await checkDatabaseConnection()
      checks.database = true // Placeholder
      
      // Memory check
      if (typeof process !== 'undefined') {
        const memUsage = process.memoryUsage()
        checks.memory = memUsage.heapUsed < memUsage.heapTotal * 0.9
      } else {
        checks.memory = true // Browser environment
      }
      
      // Disk check (server-side only)
      checks.disk = true // Placeholder
      
      const allHealthy = Object.values(checks).every(Boolean)
      
      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      errorTracking.captureApiError(error as Error, '/healthcheck', 'GET')
      return {
        status: 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
      }
    }
  },
}