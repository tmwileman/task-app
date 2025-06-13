'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TaskForm } from '@/components/task-form'
import { TaskList } from '@/components/task-list'
import { TaskListSidebar } from '@/components/task-list-sidebar'
import { TaskWithRelations, TaskListWithRelations } from '@/types'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [lists, setLists] = useState<TaskListWithRelations[]>([])
  const [selectedListId, setSelectedListId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [listsLoading, setListsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks(searchQuery, selectedListId)
    }
  }, [session, selectedListId])

  const fetchTasks = async (search?: string, listId?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) {
        params.set('search', search)
      }
      if (listId) {
        params.set('listId', listId)
      }
      const response = await fetch(`/api/tasks?${params}`)
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
    fetchTasks(query, selectedListId)
  }

  const handleSelectList = (listId?: string) => {
    setSelectedListId(listId)
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
        fetchTasks(searchQuery) // Refresh tasks
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
        setTasks(prev => prev.map(task => task.id === taskId ? data.task : task))
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
      }
    } catch (error) {
      console.error('Error deleting task:', error)
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
        onSelectList={handleSelectList}
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
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Task App</h1>
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
                  {selectedListId 
                    ? lists.find(l => l.id === selectedListId)?.name || 'Tasks'
                    : 'All Tasks'
                  }
                </h1>
                <p className="text-gray-600">
                  {selectedListId 
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
            showList={false}
          />
          </div>
        </main>
      </div>
    </div>
  )
}