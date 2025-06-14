'use client'

import { TaskWithRelations } from '@/types'
import { TaskItem } from './task-item'

interface TaskListProps {
  tasks: TaskWithRelations[]
  loading?: boolean
  onTaskUpdate: (taskId: string, data: any) => void
  onTaskDelete: (taskId: string) => void
  onCreateSubtask?: (parentId: string, subtaskData: any) => void
  onBulkSubtaskAction?: (parentId: string, action: 'complete' | 'delete') => void
  showList?: boolean
}

export function TaskList({ 
  tasks, 
  loading = false, 
  onTaskUpdate, 
  onTaskDelete, 
  onCreateSubtask,
  onBulkSubtaskAction,
  showList = false 
}: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first task.
        </p>
      </div>
    )
  }

  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter(task => !task.completed)
  const completedTasks = tasks.filter(task => task.completed)

  return (
    <div className="space-y-6">
      {/* Incomplete Tasks */}
      {incompleteTasks.length > 0 && (
        <div className="space-y-3">
          {incompleteTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
              onCreateSubtask={onCreateSubtask}
              onBulkSubtaskAction={onBulkSubtaskAction}
              showList={showList}
            />
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-gray-500">
              Completed ({completedTasks.length})
            </h3>
            <div className="flex-1 ml-4 border-t border-gray-200"></div>
          </div>
          {completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
              onCreateSubtask={onCreateSubtask}
              onBulkSubtaskAction={onBulkSubtaskAction}
              showList={showList}
            />
          ))}
        </div>
      )}
    </div>
  )
}