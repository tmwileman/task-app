'use client'

import { useState } from 'react'
import { TaskWithRelations } from '@/types'
import { Priority } from '@prisma/client'

interface TaskItemProps {
  task: TaskWithRelations
  onUpdate: (taskId: string, data: any) => void
  onDelete: (taskId: string) => void
  onCreateSubtask?: (parentId: string, subtaskData: any) => void
  onBulkSubtaskAction?: (parentId: string, action: 'complete' | 'delete') => void
  showList?: boolean
}

export function TaskItem({ task, onUpdate, onDelete, onCreateSubtask, onBulkSubtaskAction, showList = false }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

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

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !onCreateSubtask) return
    
    onCreateSubtask(task.id, {
      title: newSubtaskTitle.trim(),
      priority: 'MEDIUM',
    })
    
    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
  }

  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    onUpdate(subtaskId, { completed })
  }

  const handleBulkSubtaskAction = (action: 'complete' | 'delete') => {
    if (!onBulkSubtaskAction) return
    
    if (action === 'delete') {
      if (!confirm('Are you sure you want to delete all subtasks?')) {
        return
      }
    }
    
    onBulkSubtaskAction(task.id, action)
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

  const getDueDateStatus = () => {
    if (!task.dueDate || task.completed) return null
    
    const now = new Date()
    const dueDate = new Date(task.dueDate)
    const timeDiff = dueDate.getTime() - now.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    const hoursDiff = Math.ceil(timeDiff / (1000 * 3600))
    
    if (timeDiff < 0) {
      return { status: 'overdue', text: 'Overdue', class: 'text-red-600 bg-red-50 border-red-200' }
    } else if (hoursDiff <= 2) {
      return { status: 'urgent', text: 'Due soon', class: 'text-orange-600 bg-orange-50 border-orange-200' }
    } else if (daysDiff <= 1) {
      return { status: 'today', text: 'Due today', class: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
    } else if (daysDiff <= 7) {
      return { status: 'week', text: `${daysDiff} days`, class: 'text-blue-600 bg-blue-50 border-blue-200' }
    }
    
    return null
  }

  const dueDateStatus = getDueDateStatus()
  const isOverdue = dueDateStatus?.status === 'overdue'

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
      task.completed ? 'opacity-75' : ''
    } ${
      isOverdue ? 'border-l-4 border-l-red-500 bg-red-50/30' : 
      dueDateStatus?.status === 'urgent' ? 'border-l-4 border-l-orange-500 bg-orange-50/30' :
      dueDateStatus?.status === 'today' ? 'border-l-4 border-l-yellow-500 bg-yellow-50/30' : ''
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
                  <div className="flex items-center space-x-2">
                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      Due: {formatDate(task.dueDate)}
                    </span>
                    {dueDateStatus && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${dueDateStatus.class}`}>
                        {dueDateStatus.text}
                      </span>
                    )}
                  </div>
                )}
                
                {showList && task.list && (
                  <span>List: {task.list.name}</span>
                )}
                
                {task.isRecurring && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border text-purple-600 bg-purple-50 border-purple-200">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recurring
                  </span>
                )}
                
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSubtasks(!showSubtasks)}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <span>
                        Subtasks: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                      </span>
                      <svg 
                        className={`w-3 h-3 transition-transform ${showSubtasks ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Progress Bar */}
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ 
                          width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Add Subtask Button */}
                {!task.parentId && (
                  <button
                    onClick={() => setIsAddingSubtask(true)}
                    className="text-gray-500 hover:text-blue-600 flex items-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add subtask</span>
                  </button>
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
      
      {/* Subtasks Section */}
      {(showSubtasks || isAddingSubtask) && (
        <div className="mt-3 ml-7 space-y-2">
          {/* Bulk Actions */}
          {showSubtasks && task.subtasks && task.subtasks.length > 0 && (
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Bulk actions:</span>
              <button
                onClick={() => handleBulkSubtaskAction('complete')}
                className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                disabled={task.subtasks.every(st => st.completed)}
              >
                Complete all
              </button>
              <button
                onClick={() => handleBulkSubtaskAction('delete')}
                className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                Delete all
              </button>
            </div>
          )}
          {/* Existing Subtasks */}
          {showSubtasks && task.subtasks && task.subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded border-l-2 border-gray-200">
              <button
                onClick={() => handleSubtaskToggle(subtask.id, !subtask.completed)}
                className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                  subtask.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {subtask.completed && (
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                {subtask.title}
              </span>
              <button
                onClick={() => onDelete(subtask.id)}
                className="text-gray-400 hover:text-red-600 p-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          {/* Add Subtask Form */}
          {isAddingSubtask && (
            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded border-l-2 border-blue-200">
              <div className="w-3 h-3 rounded border border-gray-300"></div>
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Enter subtask title..."
                className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask()
                  if (e.key === 'Escape') {
                    setIsAddingSubtask(false)
                    setNewSubtaskTitle('')
                  }
                }}
                autoFocus
              />
              <button
                onClick={handleAddSubtask}
                className="text-green-600 hover:text-green-700 p-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsAddingSubtask(false)
                  setNewSubtaskTitle('')
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}