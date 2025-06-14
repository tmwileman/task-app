'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TaskForm } from '@/components/task-form'
import { TaskList } from '@/components/task-list'
import { TaskListSidebar } from '@/components/task-list-sidebar'
import { TaskWithRelations, TaskListWithRelations } from '@/types'
import NotificationManager from '@/lib/notifications'
import ReminderScheduler from '@/lib/reminder-scheduler'
import { NotificationPreferencesModal } from '@/components/notification-preferences'
import { NotificationHistoryModal } from '@/components/notification-history'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [lists, setLists] = useState<TaskListWithRelations[]>([])
  const [selectedListId, setSelectedListId] = useState<string | undefined>()
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [listsLoading, setListsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false)
  const [showNotificationHistory, setShowNotificationHistory] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks()
      fetchLists()
      
      // Initialize enhanced notifications system
      const initializeNotifications = async () => {
        await NotificationManager.initialize()
        await NotificationManager.requestPermission()
        
        // Load pending reminders
        await ReminderScheduler.loadPendingReminders()
        
        // Schedule daily digest and weekly review
        await ReminderScheduler.scheduleDailyDigest()
        await ReminderScheduler.scheduleWeeklyReview()
      }
      
      initializeNotifications()
      
      // Set up periodic deadline checking (every 5 minutes)
      const deadlineCheckInterval = setInterval(() => {
        if (tasks.length > 0) {
          NotificationManager.checkForUpcomingDeadlines(tasks)
        }
      }, 5 * 60 * 1000)
      
      return () => clearInterval(deadlineCheckInterval)
    }
  }, [session])

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks(searchQuery, selectedListId, selectedFilter)
    }
  }, [session, selectedListId, selectedFilter])

  const fetchTasks = async (search?: string, listId?: string, filter?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) {
        params.set('search', search)
      }
      if (listId) {
        params.set('listId', listId)
      }
      if (filter) {
        params.set('filter', filter)
      }
      const response = await fetch(`/api/tasks?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
        
        // Check for upcoming deadlines
        NotificationManager.checkForUpcomingDeadlines(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLists = async () => {
    try {
      setListsLoading(true)
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists)
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setListsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    fetchTasks(query, selectedListId, selectedFilter)
  }

  const handleSelectList = (listId?: string) => {
    setSelectedListId(listId)
  }

  const handleSelectFilter = (filter?: string) => {
    setSelectedFilter(filter)
  }

  const handleCreateTask = async (taskData: any) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          listId: selectedListId || taskData.listId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(prev => [data.task, ...prev])
        setShowForm(false)
        fetchLists() // Refresh list counts
        
        // Schedule reminders for the new task
        if (data.task.dueDate) {
          await ReminderScheduler.scheduleTaskReminders(data.task)
        }
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateList = async (listData: any) => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listData),
      })

      if (response.ok) {
        const data = await response.json()
        setLists(prev => [...prev, data.list])
      }
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  const handleUpdateList = async (listId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        setLists(prev => prev.map(list => list.id === listId ? data.list : list))
      }
    } catch (error) {
      console.error('Error updating list:', error)
    }
  }

  const handleDeleteList = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLists(prev => prev.filter(list => list.id !== listId))
        if (selectedListId === listId) {
          setSelectedListId(undefined)
        }
        fetchTasks(searchQuery, undefined, selectedFilter) // Refresh tasks
      }
    } catch (error) {
      console.error('Error deleting list:', error)
    }
  }

  const handleUpdateTask = async (taskId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(prev => prev.map(task => {
          if (task.id === taskId) {
            return data.task
          }
          // Update parent task if this was a subtask
          if (task.subtasks?.some(subtask => subtask.id === taskId)) {
            const updatedSubtasks = task.subtasks.map(subtask => 
              subtask.id === taskId ? { ...subtask, ...updateData } : subtask
            )
            
            // Subtask completion cascading logic
            let updatedTask = { ...task, subtasks: updatedSubtasks }
            if (updateData.completed !== undefined && updatedSubtasks.length > 0) {
              const allSubtasksCompleted = updatedSubtasks.every(st => st.completed)
              const someSubtasksCompleted = updatedSubtasks.some(st => st.completed)
              
              // Auto-complete parent when all subtasks are completed
              if (allSubtasksCompleted && !task.completed) {
                handleUpdateTask(task.id, { completed: true })
              }
              // Auto-uncomplete parent when any subtask is uncompleted and parent is completed
              else if (!allSubtasksCompleted && task.completed) {
                handleUpdateTask(task.id, { completed: false })
              }
            }
            
            return updatedTask
          }
          return task
        }))
        fetchLists() // Update task counts
        
        // Reschedule reminders if due date changed
        if (updateData.dueDate !== undefined) {
          await ReminderScheduler.rescheduleTaskReminders(data.task)
        }
        
        // Cancel reminders if task is completed
        if (updateData.completed === true) {
          ReminderScheduler.cancelTaskReminders(taskId)
        }
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        fetchLists() // Update task counts
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleCreateSubtask = async (parentId: string, subtaskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subtaskData,
          parentId,
        }),
      })

      if (response.ok) {
        // Refresh tasks to get updated subtasks
        fetchTasks(searchQuery, selectedListId, selectedFilter)
        fetchLists() // Update task counts
      }
    } catch (error) {
      console.error('Error creating subtask:', error)
    }
  }

  const handleBulkSubtaskAction = async (parentId: string, action: 'complete' | 'delete') => {
    try {
      const parentTask = tasks.find(task => task.id === parentId)
      if (!parentTask?.subtasks) return

      if (action === 'complete') {
        // Complete all incomplete subtasks
        const incompleteSubtasks = parentTask.subtasks.filter(st => !st.completed)
        await Promise.all(
          incompleteSubtasks.map(subtask =>
            handleUpdateTask(subtask.id, { completed: true })
          )
        )
      } else if (action === 'delete') {
        // Delete all subtasks
        await Promise.all(
          parentTask.subtasks.map(subtask =>
            fetch(`/api/tasks/${subtask.id}`, { method: 'DELETE' })
          )
        )
      }

      // Refresh tasks and lists
      fetchTasks(searchQuery, selectedListId, selectedFilter)
      fetchLists()
    } catch (error) {
      console.error('Error with bulk subtask action:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <TaskListSidebar
        lists={lists}
        selectedListId={selectedListId}
        selectedFilter={selectedFilter}
        onSelectList={handleSelectList}
        onSelectFilter={handleSelectFilter}
        onCreateList={handleCreateList}
        onUpdateList={handleUpdateList}
        onDeleteList={handleDeleteList}
        loading={listsLoading}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold text-gray-900">Task App</h1>
                <div className="flex space-x-4">
                  <a
                    href="/dashboard"
                    className="bg-blue-100 text-blue-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/calendar"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Calendar
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Notification Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowNotificationHistory(true)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-md transition-colors"
                    title="Notification History"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowNotificationPreferences(true)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-md transition-colors"
                    title="Notification Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  {session.user?.image && (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full">
          <div className="py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedFilter === 'today' ? 'Today\'s Tasks' :
                   selectedFilter === 'tomorrow' ? 'Tomorrow\'s Tasks' :
                   selectedFilter === 'week' ? 'This Week\'s Tasks' :
                   selectedFilter === 'overdue' ? 'Overdue Tasks' :
                   selectedListId 
                    ? lists.find(l => l.id === selectedListId)?.name || 'Tasks'
                    : 'All Tasks'
                  }
                </h1>
                <p className="text-gray-600">
                  {selectedFilter === 'today' ? 'Tasks due today' :
                   selectedFilter === 'tomorrow' ? 'Tasks due tomorrow' :
                   selectedFilter === 'week' ? 'Tasks due this week' :
                   selectedFilter === 'overdue' ? 'Tasks that are past their due date' :
                   selectedListId 
                    ? `Tasks in ${lists.find(l => l.id === selectedListId)?.name || 'this list'}`
                    : 'All your tasks across all lists'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {showForm ? 'Cancel' : 'Add Task'}
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Task Form */}
          {showForm && (
            <div className="mb-6">
              <TaskForm
                onSubmit={handleCreateTask}
                onCancel={() => setShowForm(false)}
                isSubmitting={isSubmitting}
                lists={lists}
                selectedListId={selectedListId}
              />
            </div>
          )}

          {/* Task List */}
          <TaskList
            tasks={tasks}
            loading={loading}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onCreateSubtask={handleCreateSubtask}
            onBulkSubtaskAction={handleBulkSubtaskAction}
            showList={false}
          />
          </div>
        </main>
      </div>

      {/* Notification Modals */}
      {showNotificationPreferences && (
        <NotificationPreferencesModal
          onClose={() => setShowNotificationPreferences(false)}
        />
      )}

      {showNotificationHistory && (
        <NotificationHistoryModal
          onClose={() => setShowNotificationHistory(false)}
        />
      )}
    </div>
  )
}