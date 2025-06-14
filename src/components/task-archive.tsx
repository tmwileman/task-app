'use client'

import { useState, useEffect } from 'react'
import { TaskWithRelations } from '@/types'

interface ArchiveData {
  tasks: TaskWithRelations[]
  nextCursor?: string
  hasNextPage: boolean
  stats: {
    totalArchived: number
    totalActive: number
  }
}

interface TaskArchiveProps {
  onClose: () => void
}

export function TaskArchive({ onClose }: TaskArchiveProps) {
  const [archiveData, setArchiveData] = useState<ArchiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchArchivedTasks()
  }, [])

  const fetchArchivedTasks = async () => {
    try {
      const response = await fetch('/api/tasks/archive')
      if (response.ok) {
        const data = await response.json()
        setArchiveData(data)
      }
    } catch (error) {
      console.error('Error fetching archived tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'unarchive' | 'delete') => {
    if (selectedTasks.length === 0) return

    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to permanently delete ${selectedTasks.length} task(s)? This cannot be undone.`
      : `Restore ${selectedTasks.length} task(s) from archive?`

    if (!confirm(confirmMessage)) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/tasks/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: selectedTasks,
          action
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        setSelectedTasks([])
        fetchArchivedTasks() // Refresh the list
      }
    } catch (error) {
      console.error(`Error ${action}ing tasks:`, error)
      alert(`Failed to ${action} tasks. Please try again.`)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const selectAll = () => {
    if (!archiveData) return
    setSelectedTasks(archiveData.tasks.map(t => t.id))
  }

  const clearSelection = () => {
    setSelectedTasks([])
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!archiveData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load Archive
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to fetch archived tasks. Please try again.
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Task Archive
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {archiveData.stats.totalArchived} archived tasks • {archiveData.stats.totalActive} active tasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        {archiveData.tasks.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  >
                    Select All
                  </button>
                  {selectedTasks.length > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-500"
                    >
                      Clear ({selectedTasks.length})
                    </button>
                  )}
                </div>
              </div>
              
              {selectedTasks.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAction('unarchive')}
                    disabled={actionLoading}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    disabled={actionLoading}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete Forever
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {archiveData.tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8l4 4 4-4M5 16l4-4 4 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Archived Tasks
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tasks you archive will appear here for easy restoration or cleanup.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archiveData.tasks.map(task => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedTasks.includes(task.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        {task.completed && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                            Completed
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'URGENT' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                          task.priority === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                          task.priority === 'MEDIUM' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        {task.list && (
                          <span>List: {task.list.name}</span>
                        )}
                        {task.archivedAt && (
                          <span>Archived: {new Date(task.archivedAt).toLocaleDateString()}</span>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span>{task.subtasks.length} subtasks</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Archived tasks are kept for easy restoration. You can permanently delete them if needed.
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