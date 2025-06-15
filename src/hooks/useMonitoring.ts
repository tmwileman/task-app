'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { performance, userTracking, appMonitoring } from '@/lib/monitoring'

interface MonitoringOptions {
  trackPageViews?: boolean
  trackPerformance?: boolean
  trackUserInteractions?: boolean
}

export function useMonitoring(options: MonitoringOptions = {}) {
  const {
    trackPageViews = true,
    trackPerformance = true,
    trackUserInteractions = true,
  } = options
  
  const router = useRouter()
  
  // Track page views
  useEffect(() => {
    if (!trackPageViews) return
    
    const handleRouteChange = (url: string) => {
      appMonitoring.trackEvent('page_view', { url })
    }
    
    // Track initial page load
    handleRouteChange(window.location.pathname)
    
    // Note: Next.js App Router doesn't have router events like Pages Router
    // We'll track page views manually when this hook is used on each page
  }, [trackPageViews])
  
  // Track page performance
  useEffect(() => {
    if (!trackPerformance || typeof window === 'undefined') return
    
    const trackPagePerformance = () => {
      // Wait for page to be fully loaded
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (perfData) {
          const loadTime = perfData.loadEventEnd - perfData.navigationStart
          const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart
          const firstByte = perfData.responseStart - perfData.navigationStart
          
          performance.trackPageLoad(window.location.pathname, loadTime)
          
          // Track additional metrics
          if (loadTime > 0) {
            appMonitoring.trackBusinessMetric('page_load_time', loadTime, 'millisecond')
          }
          if (domReady > 0) {
            appMonitoring.trackBusinessMetric('dom_ready_time', domReady, 'millisecond')
          }
          if (firstByte > 0) {
            appMonitoring.trackBusinessMetric('time_to_first_byte', firstByte, 'millisecond')
          }
        }
        
        // Track Core Web Vitals if available
        if ('web-vitals' in window) {
          // This would require installing web-vitals package
          // import { getLCP, getFID, getCLS } from 'web-vitals'
        }
      }, 1000)
    }
    
    if (document.readyState === 'complete') {
      trackPagePerformance()
    } else {
      window.addEventListener('load', trackPagePerformance)
      return () => window.removeEventListener('load', trackPagePerformance)
    }
  }, [trackPerformance])
  
  // Track user interactions
  const trackClick = useCallback((element: string, data?: Record<string, any>) => {
    if (!trackUserInteractions) return
    
    userTracking.trackUserAction('click', { element, ...data })
  }, [trackUserInteractions])
  
  const trackFormSubmit = useCallback((form: string, data?: Record<string, any>) => {
    if (!trackUserInteractions) return
    
    userTracking.trackUserAction('form_submit', { form, ...data })
  }, [trackUserInteractions])
  
  const trackFeatureUse = useCallback((feature: string, data?: Record<string, any>) => {
    appMonitoring.trackFeatureUsage(feature, data)
  }, [])
  
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    console.error('Client error:', error)
    // Error will be automatically captured by Sentry
  }, [])
  
  return {
    trackClick,
    trackFormSubmit,
    trackFeatureUse,
    trackError,
  }
}

// Hook for API call monitoring
export function useApiMonitoring() {
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> => {
    const startTime = Date.now()
    
    try {
      const result = await apiCall()
      const duration = Date.now() - startTime
      
      performance.trackApiCall(endpoint, method, duration, true)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      performance.trackApiCall(endpoint, method, duration, false)
      
      throw error
    }
  }, [])
  
  return { trackApiCall }
}

// Hook for error boundary monitoring
export function useErrorBoundary() {
  const trackError = useCallback((error: Error, errorInfo: any) => {
    console.error('Error boundary caught:', error, errorInfo)
    
    // Additional context will be automatically captured by Sentry
    appMonitoring.trackEvent('error_boundary_triggered', {
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
    })
  }, [])
  
  return { trackError }
}