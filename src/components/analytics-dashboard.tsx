'use client'

import { useState, useEffect } from 'react'

interface Analytics {
  overview: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    overdueTasks: number
    todayTasks: number
    completionRate: number
  }
  productivity: {
    thisWeekCompleted: number
    lastWeekCompleted: number
    trend: number
    avgTasksPerDay: number
  }
  distribution: {
    byPriority: Array<{ priority: string; count: number }>
    byList: Array<{ listId: string | null; listName: string; count: number }>
  }
  completion: {
    trend: Array<{ date: string; count: number }>
    period: number
  }
}

interface AnalyticsDashboardProps {
  onClose: () => void
}

export function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to fetch analytics data. Please try again.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { overview, productivity, distribution } = analytics

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Task Analytics
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Insights into your productivity and task management
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
            </select>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {overview.totalTasks}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Tasks</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {overview.completedTasks}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {overview.pendingTasks}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Pending</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {overview.overdueTasks}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Overdue</div>
            </div>
          </div>

          {/* Productivity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Completion Rate */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Completion Rate
              </h3>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {overview.completionRate}%
                </div>
                <div className="ml-4 flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${overview.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Productivity */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Weekly Productivity
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {productivity.thisWeekCompleted}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tasks this week
                  </div>
                </div>
                <div className={`flex items-center text-sm ${
                  productivity.trend >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {productivity.trend >= 0 ? '↗' : '↘'}
                  {Math.abs(productivity.trend)}%
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority Distribution */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Tasks by Priority
              </h3>
              <div className="space-y-3">
                {distribution.byPriority.map(item => {
                  const percentage = overview.totalTasks > 0 
                    ? Math.round((item.count / overview.totalTasks) * 100)
                    : 0
                  
                  return (
                    <div key={item.priority} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          item.priority === 'URGENT' ? 'bg-red-500' :
                          item.priority === 'HIGH' ? 'bg-orange-500' :
                          item.priority === 'MEDIUM' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {item.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.count}
                        </span>
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.priority === 'URGENT' ? 'bg-red-500' :
                              item.priority === 'HIGH' ? 'bg-orange-500' :
                              item.priority === 'MEDIUM' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* List Distribution */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Tasks by List
              </h3>
              <div className="space-y-3">
                {distribution.byList.slice(0, 5).map(item => {
                  const percentage = overview.totalTasks > 0 
                    ? Math.round((item.count / overview.totalTasks) * 100)
                    : 0
                  
                  return (
                    <div key={item.listId || 'no-list'} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3 bg-blue-500"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {item.listName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.count}
                        </span>
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {distribution.byList.length > 5 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ... and {distribution.byList.length - 5} more lists
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Analytics help you understand your productivity patterns and optimize your workflow.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}