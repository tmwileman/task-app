'use client'

import { useState } from 'react'
import { TaskWithRelations } from '@/types'
import { Priority } from '@prisma/client'

interface TaskItemProps {
  task: TaskWithRelations
  onUpdate: (taskId: string, data: any) => void
  onDelete: (taskId: string) => void
  showList?: boolean
}

export function TaskItem({ task, onUpdate, onDelete, showList = false }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT:
        return 'text-red-600 bg-red-50 border-red-200'
      case Priority.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case Priority.MEDIUM:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case Priority.LOW:
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const handleToggleComplete = () => {
    onUpdate(task.id, { completed: !task.completed })
  }

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      onUpdate(task.id, { title: editTitle.trim() })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setIsEditing(false)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
      task.completed ? 'opacity-75' : ''
    }`}>
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="text-xs text-green-600 hover:text-green-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-xs text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <h3
                  className={`font-medium text-gray-900 cursor-pointer hover:text-blue-600 ${
                    task.completed ? 'line-through text-gray-500' : ''
                  }`}
                  onClick={() => setIsEditing(true)}
                >
                  {task.title}
                </h3>
                
                {/* Priority Badge */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority.toLowerCase()}
                </span>
              </div>

              {task.description && (
                <p className="mt-1 text-sm text-gray-600">{task.description}</p>
              )}

              {/* Metadata */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                {task.dueDate && (
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    Due: {formatDate(task.dueDate)}
                  </span>
                )}
                
                {showList && task.list && (
                  <span>List: {task.list.name}</span>
                )}
                
                {task.subtasks && task.subtasks.length > 0 && (
                  <span>
                    Subtasks: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="text-gray-400 hover:text-red-600 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}