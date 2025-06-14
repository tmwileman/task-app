'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense, lazy } from 'react'
import { TaskForm } from '@/components/task-form'
import { TaskWithRelations, TaskListWithRelations } from '@/types'
import { createTaskForDate } from '@/lib/calendar-utils'
import { downloadICalFile } from '@/lib/ical-export'
import { CalendarSkeleton } from '@/components/skeleton/calendar-skeleton'

// Lazy load the calendar component for better performance
const TaskCalendar = lazy(() => import('@/components/task-calendar').then(module => ({ default: module.TaskCalendar })))

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [lists, setLists] = useState<TaskListWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks()
      fetchLists()
    }
  }, [session])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists)
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    }
  }

  const handleTaskUpdate = async (taskId: string, updateData: any) => {
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
        setTasks(prev => prev.map(task => 
          task.id === taskId ? data.task : task
        ))
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleTaskSelect = (task: TaskWithRelations) => {
    setSelectedTask(task)
    // Could open a task detail modal here
    // For now, just log the selection
    console.log('Selected task:', task.title)
  }

  const handleDateSelect = (date: Date) => {
    setNewTaskDate(date)
    setShowTaskForm(true)
  }

  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          dueDate: newTaskDate ? newTaskDate.toISOString() : taskData.dueDate,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(prev => [data.task, ...prev])
        setShowTaskForm(false)
        setNewTaskDate(null)
      }
    } catch (error) {
      console.error('Error creating task:', error)
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">Task App</h1>
              <div className="flex space-x-4">
                <a
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="/calendar"
                  className="bg-blue-100 text-blue-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Calendar
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600">
                View and schedule your tasks in calendar format
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => downloadICalFile(tasks, 'my-tasks.ics')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Export Calendar
              </button>
              <button
                onClick={() => {
                  setNewTaskDate(new Date())
                  setShowTaskForm(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {newTaskDate ? `Create Task for ${newTaskDate.toLocaleDateString()}` : 'Create Task'}
                </h2>
                <button
                  onClick={() => {
                    setShowTaskForm(false)
                    setNewTaskDate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TaskForm
                onSubmit={handleCreateTask}
                onCancel={() => {
                  setShowTaskForm(false)
                  setNewTaskDate(null)
                }}
                lists={lists}
              />
            </div>
          </div>
        )}

        {/* Calendar */}
        <Suspense fallback={<CalendarSkeleton />}>
          <TaskCalendar
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskSelect={handleTaskSelect}
            onDateSelect={handleDateSelect}
            loading={loading}
          />
        </Suspense>
      </main>
    </div>
  )
}