'use client'

export function CalendarSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        
        <div className="flex space-x-2">
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Calendar grid header */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="p-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
          </div>
        ))}
      </div>

      {/* Calendar grid body */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className="min-h-[120px] p-2 border border-gray-100 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-6 mb-2"></div>
            
            {/* Random events */}
            {index % 4 === 0 && (
              <div className="space-y-1">
                <div className="h-6 bg-blue-200 dark:bg-blue-800 rounded text-xs"></div>
                {index % 8 === 0 && (
                  <div className="h-6 bg-green-200 dark:bg-green-800 rounded text-xs"></div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CalendarEventSkeleton() {
  return (
    <div className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 mb-1 animate-pulse">
      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
    </div>
  )
}