'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { TaskWithRelations } from '@/types'
import { apiClient, queryKeys } from '@/lib/react-query'

interface TasksResponse {
  tasks: TaskWithRelations[]
  nextCursor?: string
  hasNextPage: boolean
  totalCount: number
}

interface UseInfiniteTasksOptions {
  search?: string
  listId?: string
  filter?: string
  limit?: number
  enabled?: boolean
}

export function useInfiniteTasks(options: UseInfiniteTasksOptions = {}) {
  const {
    search = '',
    listId,
    filter,
    limit = 20,
    enabled = true,
  } = options

  // Intersection observer for infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const queryKey = queryKeys.tasks.infinite({
    search,
    listId,
    filter,
    limit,
  })

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      
      if (search) params.set('search', search)
      if (listId) params.set('listId', listId)
      if (filter) params.set('filter', filter)
      if (pageParam) params.set('cursor', pageParam)
      
      params.set('limit', limit.toString())

      return apiClient<TasksResponse>(`/tasks?${params}`)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes for task lists
  })

  // Auto-fetch next page when scrolling near bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten all pages into a single array
  const tasks = data?.pages.flatMap(page => page.tasks) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  // Loading states
  const isLoading = status === 'pending'
  const isError = status === 'error'
  const isEmpty = tasks.length === 0 && !isLoading
  const isLoadingMore = isFetchingNextPage

  return {
    tasks,
    totalCount,
    isLoading,
    isError,
    isEmpty,
    isLoadingMore,
    hasNextPage,
    isFetching,
    error,
    loadMoreRef,
    refetch,
    fetchNextPage,
  }
}

// Hook for managing task mutations with optimistic updates
export function useTaskMutations() {
  const { invalidateTaskQueries } = require('@/lib/react-query')

  return {
    invalidateTaskQueries,
  }
}

// Prefetch next page for better UX
export function usePrefetchNextTasks(
  options: UseInfiniteTasksOptions,
  shouldPrefetch: boolean = true
) {
  const { queryClient } = require('@/lib/react-query')

  useEffect(() => {
    if (!shouldPrefetch || !queryClient) return

    const queryKey = queryKeys.tasks.infinite(options)
    
    // Prefetch first page if not already cached
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams()
        
        if (options.search) params.set('search', options.search)
        if (options.listId) params.set('listId', options.listId)
        if (options.filter) params.set('filter', options.filter)
        
        params.set('limit', (options.limit || 20).toString())

        return apiClient<TasksResponse>(`/tasks?${params}`)
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    })
  }, [shouldPrefetch, queryClient, options])
}