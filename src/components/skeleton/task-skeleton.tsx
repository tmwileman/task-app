'use client'

interface TaskSkeletonProps {
  count?: number
  showSubtasks?: boolean
}

export function TaskSkeleton({ count = 5, showSubtasks = false }: TaskSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          {/* Priority indicator */}
          <div className="flex items-start space-x-3">
            <div className="w-1 h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
            
            <div className="flex-1 space-y-3">
              {/* Task header */}
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>

              {/* Task metadata */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>

              {/* Subtasks (if enabled) */}
              {showSubtasks && index % 3 === 0 && (
                <div className="ml-4 pt-2 space-y-2 border-l border-gray-200 dark:border-gray-700 pl-4">
                  {Array.from({ length: 2 }).map((_, subIndex) => (
                    <div key={subIndex} className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TaskItemSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="w-1 h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
            </div>
            <div className="flex space-x-1">
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>

      {/* Search skeleton */}
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>

      {/* Tasks skeleton */}
      <TaskSkeleton count={8} showSubtasks={true} />
    </div>
  )
}