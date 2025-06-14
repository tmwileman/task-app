'use client'

export function SidebarSkeleton() {
  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      {/* User section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>

      {/* Quick filters */}
      <div className="mb-8">
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
              </div>
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Lists section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SidebarItemSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-2 animate-pulse">
      <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
      </div>
      <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  )
}