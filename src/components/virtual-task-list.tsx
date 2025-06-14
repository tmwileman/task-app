'use client'

import { TaskItem } from '@/components/task-item'
import { TaskSkeleton, TaskItemSkeleton } from '@/components/skeleton/task-skeleton'
import { useInfiniteTasks } from '@/hooks/use-infinite-tasks'
import { TaskWithRelations } from '@/types'

interface VirtualTaskListProps {
  search?: string
  listId?: string
  filter?: string
  onTaskUpdate: (taskId: string, updateData: any) => Promise<void>
  onTaskDelete: (taskId: string) => Promise<void>
  onCreateSubtask: (parentId: string, subtaskData: any) => Promise<void>
  onBulkSubtaskAction: (parentId: string, action: 'complete' | 'delete') => Promise<void>
  showList?: boolean
}

export function VirtualTaskList({
  search,
  listId,
  filter,
  onTaskUpdate,
  onTaskDelete,
  onCreateSubtask,
  onBulkSubtaskAction,
  showList = true,
}: VirtualTaskListProps) {
  const {
    tasks,
    totalCount,
    isLoading,
    isError,
    isEmpty,
    isLoadingMore,
    hasNextPage,
    loadMoreRef,
    error,
  } = useInfiniteTasks({
    search,
    listId,
    filter,
    limit: 20,
  })

  // Loading state
  if (isLoading) {
    return <TaskSkeleton count={8} showSubtasks={true} />
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 dark:text-red-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error instanceof Error ? error.message : 'Something went wrong while loading your tasks.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (isEmpty) {
    const emptyMessage = search
      ? `No tasks found matching "${search}"`
      : filter === 'today'
      ? 'No tasks due today'
      : filter === 'tomorrow'
      ? 'No tasks due tomorrow'
      : filter === 'week'
      ? 'No tasks due this week'
      : filter === 'overdue'
      ? 'No overdue tasks'
      : listId
      ? 'No tasks in this list'
      : 'No tasks yet'

    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {search ? 'Try adjusting your search terms' : 'Create your first task to get started!'}
        </p>
      </div>
    )
  }

  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter(task => !task.completed)
  const completedTasks = tasks.filter(task => task.completed)

  return (
    <div className="space-y-6">
      {/* Stats */}
      {totalCount > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {tasks.length} of {totalCount} tasks
          {hasNextPage && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              • Scroll down for more
            </span>
          )}
        </div>
      )}

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
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Completed ({completedTasks.length})</span>
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

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="py-4">
          {isLoadingMore && (
            <div className="space-y-3">
              <TaskItemSkeleton />
              <TaskItemSkeleton />
              <TaskItemSkeleton />
            </div>
          )}
        </div>
      )}

      {/* Load more button fallback */}
      {hasNextPage && !isLoadingMore && (
        <div className="text-center py-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Scroll down to load more tasks
          </div>
        </div>
      )}
    </div>
  )
}

// Legacy wrapper for backward compatibility
export function TaskList(props: VirtualTaskListProps & { tasks?: TaskWithRelations[], loading?: boolean }) {
  // If tasks are passed directly, use the old implementation
  if (props.tasks !== undefined || props.loading !== undefined) {
    const { tasks = [], loading = false } = props

    if (loading) {
      return <TaskSkeleton count={5} showSubtasks={true} />
    }

    if (tasks.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tasks yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create your first task to get started!
          </p>
        </div>
      )
    }

    const incompleteTasks = tasks.filter(task => !task.completed)
    const completedTasks = tasks.filter(task => task.completed)

    return (
      <div className="space-y-6">
        {incompleteTasks.length > 0 && (
          <div className="space-y-3">
            {incompleteTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={props.onTaskUpdate}
                onDelete={props.onTaskDelete}
                onCreateSubtask={props.onCreateSubtask}
                onBulkSubtaskAction={props.onBulkSubtaskAction}
                showList={props.showList}
              />
            ))}
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Completed ({completedTasks.length})</span>
            </div>
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={props.onTaskUpdate}
                onDelete={props.onTaskDelete}
                onCreateSubtask={props.onCreateSubtask}
                onBulkSubtaskAction={props.onBulkSubtaskAction}
                showList={props.showList}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Use new virtual implementation
  return <VirtualTaskList {...props} />
}