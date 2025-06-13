'use client'

import { useState } from 'react'
import { TaskListWithRelations } from '@/types'

interface TaskListSidebarProps {
  lists: TaskListWithRelations[]
  selectedListId?: string
  onSelectList: (listId?: string) => void
  onCreateList: (listData: any) => void
  onUpdateList: (listId: string, data: any) => void
  onDeleteList: (listId: string) => void
  loading?: boolean
}

export function TaskListSidebar({
  lists,
  selectedListId,
  onSelectList,
  onCreateList,
  onUpdateList,
  onDeleteList,
  loading = false
}: TaskListSidebarProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingList, setEditingList] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleEditList = (list: TaskListWithRelations) => {
    setEditingList(list.id)
    setEditName(list.name)
  }

  const handleSaveEdit = (listId: string) => {
    if (editName.trim() && editName.trim() !== lists.find(l => l.id === listId)?.name) {
      onUpdateList(listId, { name: editName.trim() })
    }
    setEditingList(null)
    setEditName('')
  }

  const handleCancelEdit = () => {
    setEditingList(null)
    setEditName('')
  }

  const handleDeleteList = (list: TaskListWithRelations) => {
    if (list.isDefault) return
    
    if (confirm(`Are you sure you want to delete "${list.name}"? Tasks will be moved to your default list.`)) {
      onDeleteList(list.id)
    }
  }

  if (loading) {
    return (
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Lists</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-blue-600 hover:text-blue-700 p-1"
            title="Add new list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* All Tasks Option */}
        <button
          onClick={() => onSelectList(undefined)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors mb-2 ${
            !selectedListId
              ? 'bg-blue-100 text-blue-900 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-400 mr-3"></div>
            <span>All Tasks</span>
          </div>
          <span className="text-xs text-gray-500">
            {lists.reduce((total, list) => total + (list._count?.tasks || 0), 0)}
          </span>
        </button>

        {/* Task Lists */}
        <div className="space-y-1">
          {lists.map((list) => (
            <div key={list.id} className="group">
              {editingList === list.id ? (
                <div className="px-3 py-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(list.id)
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    onBlur={() => handleSaveEdit(list.id)}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => onSelectList(list.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedListId === list.id
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                      style={{ backgroundColor: list.color || '#3b82f6' }}
                    ></div>
                    <span className="truncate">{list.name}</span>
                    {list.isDefault && (
                      <span className="ml-1 text-xs text-gray-500">(default)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">
                      {list._count?.tasks || 0}
                    </span>
                    {!list.isDefault && (
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditList(list)
                          }}
                          className="text-gray-400 hover:text-gray-600 p-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteList(list)
                          }}
                          className="text-gray-400 hover:text-red-600 p-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create List Form */}
      {showForm && (
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="List name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement
                  if (input.value.trim()) {
                    onCreateList({ 
                      name: input.value.trim(),
                      color: '#3b82f6' 
                    })
                    input.value = ''
                    setShowForm(false)
                  }
                }
                if (e.key === 'Escape') {
                  setShowForm(false)
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}