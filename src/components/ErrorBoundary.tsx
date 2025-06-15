'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import { useErrorBoundary } from '@/hooks/useMonitoring'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorId?: string; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture error in Sentry
    const errorId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        error_boundary: true,
      },
    })

    this.setState({ errorId })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    console.error('Error Boundary caught:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          errorId={this.state.errorId}
          retry={this.retry}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ 
  error, 
  errorId, 
  retry 
}: { 
  error: Error
  errorId?: string
  retry: () => void 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've been notified about this error and are working to fix it.
          </p>
          {errorId && (
            <p className="mt-2 text-xs text-gray-500">
              Error ID: {errorId}
            </p>
          )}
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={retry}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reload Page
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <summary className="cursor-pointer text-sm font-medium text-red-800">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Error boundary hook for functional components
export function ErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  const { trackError } = useErrorBoundary()
  
  return (
    <ErrorBoundaryClass {...props} onError={trackError}>
      {children}
    </ErrorBoundaryClass>
  )
}

export default ErrorBoundary