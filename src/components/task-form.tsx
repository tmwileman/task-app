'use client'

import { useState } from 'react'
import { Priority, RecurringType } from '@prisma/client'

interface TaskFormProps {
  onSubmit: (taskData: {
    title: string
    description?: string
    priority: Priority
    dueDate?: string
    listId?: string
    parentId?: string
    isRecurring?: boolean
    recurringType?: RecurringType
    recurringInterval?: number
    recurringUntil?: string
  }) => void
  onCancel?: () => void
  isSubmitting?: boolean
  lists?: Array<{ id: string; name: string; color?: string }>
  selectedListId?: string
  parentId?: string
  parentTask?: { title: string }
}

export function TaskForm({ 
  onSubmit, 
  onCancel, 
  isSubmitting = false, 
  lists = [], 
  selectedListId,
  parentId,
  parentTask
}: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM)
  const [dueDate, setDueDate] = useState('')
  const [listId, setListId] = useState(selectedListId || '')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  // Recurring task state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringType, setRecurringType] = useState<RecurringType>(RecurringType.WEEKLY)
  const [recurringInterval, setRecurringInterval] = useState(1)
  const [recurringUntil, setRecurringUntil] = useState('')

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!title.trim()) {
      newErrors.title = 'Task title is required'
    }
    
    if (dueDate && new Date(dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      listId: listId || undefined,
      parentId: parentId || undefined,
      isRecurring: isRecurring && !parentId, // Don't allow recurring subtasks
      recurringType: isRecurring ? recurringType : undefined,
      recurringInterval: isRecurring ? recurringInterval : undefined,
      recurringUntil: isRecurring && recurringUntil ? recurringUntil : undefined,
    })

    // Reset form
    setTitle('')
    setDescription('')
    setPriority(Priority.MEDIUM)
    setDueDate('')
    setListId(selectedListId || '')
    setIsRecurring(false)
    setRecurringType(RecurringType.WEEKLY)
    setRecurringInterval(1)
    setRecurringUntil('')
    setErrors({})
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {parentTask ? `Add Subtask to "${parentTask.title}"` : 'Create New Task'}
      </h3>
      {parentTask && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Parent Task:</span> {parentTask.title}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter task title..."
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add task description..."
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value={Priority.LOW}>Low</option>
              <option value={Priority.MEDIUM}>Medium</option>
              <option value={Priority.HIGH}>High</option>
              <option value={Priority.URGENT}>Urgent</option>
            </select>
          </div>

          <div>
            <label htmlFor="listId" className="block text-sm font-medium text-gray-700 mb-1">
              List
            </label>
            <select
              id="listId"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="">No List</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            
            {/* Quick Date Options */}
            <div className="mb-2 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  today.setHours(17, 0, 0, 0) // 5 PM today
                  setDueDate(today.toISOString().slice(0, 16))
                }}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                disabled={isSubmitting}
              >
                Today 5PM
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  tomorrow.setHours(9, 0, 0, 0) // 9 AM tomorrow
                  setDueDate(tomorrow.toISOString().slice(0, 16))
                }}
                className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                disabled={isSubmitting}
              >
                Tomorrow 9AM
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextWeek = new Date()
                  nextWeek.setDate(nextWeek.getDate() + 7)
                  nextWeek.setHours(9, 0, 0, 0)
                  setDueDate(nextWeek.toISOString().slice(0, 16))
                }}
                className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
                disabled={isSubmitting}
              >
                Next Week
              </button>
              <button
                type="button"
                onClick={() => {
                  // Smart scheduling based on priority
                  const now = new Date()
                  let daysToAdd = 7
                  
                  switch (priority) {
                    case Priority.URGENT: daysToAdd = 1; break
                    case Priority.HIGH: daysToAdd = 3; break
                    case Priority.MEDIUM: daysToAdd = 7; break
                    case Priority.LOW: daysToAdd = 14; break
                  }
                  
                  const suggested = new Date(now)
                  suggested.setDate(now.getDate() + daysToAdd)
                  suggested.setHours(9, 0, 0, 0)
                  setDueDate(suggested.toISOString().slice(0, 16))
                }}
                className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                disabled={isSubmitting}
              >
                Smart
              </button>
              <button
                type="button"
                onClick={() => setDueDate('')}
                className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Clear
              </button>
            </div>
            
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.dueDate ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
            )}
          </div>
        </div>

        {/* Recurring Task Options - Only show for main tasks, not subtasks */}
        {!parentId && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                Make this a recurring task
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-3 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="recurringType" className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat
                    </label>
                    <select
                      id="recurringType"
                      value={recurringType}
                      onChange={(e) => setRecurringType(e.target.value as RecurringType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value={RecurringType.DAILY}>Daily</option>
                      <option value={RecurringType.WEEKLY}>Weekly</option>
                      <option value={RecurringType.MONTHLY}>Monthly</option>
                      <option value={RecurringType.YEARLY}>Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="recurringInterval" className="block text-sm font-medium text-gray-700 mb-1">
                      Every
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        id="recurringInterval"
                        min="1"
                        max="30"
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-600">
                        {recurringType === RecurringType.DAILY && (recurringInterval === 1 ? 'day' : 'days')}
                        {recurringType === RecurringType.WEEKLY && (recurringInterval === 1 ? 'week' : 'weeks')}
                        {recurringType === RecurringType.MONTHLY && (recurringInterval === 1 ? 'month' : 'months')}
                        {recurringType === RecurringType.YEARLY && (recurringInterval === 1 ? 'year' : 'years')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="recurringUntil" className="block text-sm font-medium text-gray-700 mb-1">
                    Until (optional)
                  </label>
                  <input
                    type="date"
                    id="recurringUntil"
                    value={recurringUntil}
                    onChange={(e) => setRecurringUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  )
}