'use client'

import { lazy, Suspense } from 'react'
import { TaskSkeleton } from '@/components/skeleton/task-skeleton'
import { CalendarSkeleton } from '@/components/skeleton/calendar-skeleton'

// Lazy load heavy components for better performance
export const LazyTaskCalendar = lazy(() => 
  import('@/components/task-calendar').then(module => ({ default: module.TaskCalendar }))
)

export const LazyNotificationPreferences = lazy(() => 
  import('@/components/notification-preferences').then(module => ({ default: module.NotificationPreferencesModal }))
)

export const LazyNotificationHistory = lazy(() => 
  import('@/components/notification-history').then(module => ({ default: module.NotificationHistoryModal }))
)

export const LazyKeyboardShortcutsHelp = lazy(() => 
  import('@/components/keyboard-shortcuts-help').then(module => ({ default: module.KeyboardShortcutsHelp }))
)

export const LazyTaskTemplatesModal = lazy(() => 
  import('@/components/task-templates').then(module => ({ default: module.TaskTemplatesModal }))
)

export const LazyQuickAddModal = lazy(() => 
  import('@/components/quick-add-modal').then(module => ({ default: module.QuickAddModal }))
)

// Wrapped components with Suspense
export function TaskCalendarWithSuspense(props: any) {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <LazyTaskCalendar {...props} />
    </Suspense>
  )
}

export function NotificationPreferencesWithSuspense(props: any) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <LazyNotificationPreferences {...props} />
    </Suspense>
  )
}

export function NotificationHistoryWithSuspense(props: any) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <LazyNotificationHistory {...props} />
    </Suspense>
  )
}

export function KeyboardShortcutsHelpWithSuspense(props: any) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <LazyKeyboardShortcutsHelp {...props} />
    </Suspense>
  )
}

export function TaskTemplatesModalWithSuspense(props: any) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <LazyTaskTemplatesModal {...props} />
    </Suspense>
  )
}

export function QuickAddModalWithSuspense(props: any) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LazyQuickAddModal {...props} />
    </Suspense>
  )
}