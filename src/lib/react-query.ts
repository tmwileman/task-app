'use client'

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
})

// Query keys for consistency
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tasks.lists(), filters] as const,
    infinite: (filters: Record<string, unknown>) => [...queryKeys.tasks.all, 'infinite', filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
  },
  lists: {
    all: ['lists'] as const,
    detail: (id: string) => [...queryKeys.lists.all, 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
    history: () => [...queryKeys.notifications.all, 'history'] as const,
  },
} as const

// API client with error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    throw new ApiError(
      `API Error: ${response.statusText}`,
      response.status,
      response.statusText
    )
  }

  return response.json()
}

// Optimistic update helpers
export function createOptimisticUpdate<T>(
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T
) {
  return {
    queryKey,
    updater,
  }
}

// Cache invalidation helpers
export function invalidateTaskQueries() {
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
}

export function invalidateListQueries() {
  queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
}