'use client'

import { useState, useEffect, useRef } from 'react'
import { TaskListWithRelations } from '@/types'
import { Priority } from '@prisma/client'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskData: any) => Promise<void>
  lists: TaskListWithRelations[]
}

export function QuickAddModal({ isOpen, onClose, onSubmit, lists }: QuickAddModalProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM)
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSubmit(e)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, title])

  // Set default list when modal opens
  useEffect(() => {
    if (isOpen && lists.length > 0 && !selectedListId) {
      // Use the first non-default list, or the first list if all are default
      const defaultList = lists.find(list => !list.isDefault) || lists[0]
      setSelectedListId(defaultList.id)
    }
  }, [isOpen, lists, selectedListId])

  const handleClose = () => {
    setTitle('')
    setPriority(Priority.MEDIUM)
    setDueDate('')
    setIsSubmitting(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      inputRef.current?.focus()
      return
    }

    try {
      setIsSubmitting(true)
      
      const taskData = {
        title: title.trim(),
        priority,
        listId: selectedListId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      }

      await onSubmit(taskData)
      handleClose()
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickAction = (action: string) => {
    const now = new Date()
    switch (action) {
      case 'today':
        const today = new Date(now)
        today.setHours(17, 0, 0, 0) // 5 PM today
        setDueDate(today.toISOString().slice(0, 16))
        break
      case 'tomorrow':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0) // 9 AM tomorrow
        setDueDate(tomorrow.toISOString().slice(0, 16))
        break
      case 'next-week':
        const nextWeek = new Date(now)
        nextWeek.setDate(nextWeek.getDate() + 7)
        nextWeek.setHours(9, 0, 0, 0) // 9 AM next week
        setDueDate(nextWeek.toISOString().slice(0, 16))
        break
      case 'urgent':
        setPriority(Priority.URGENT)
        break
      case 'high':
        setPriority(Priority.HIGH)
        break
      case 'medium':
        setPriority(Priority.MEDIUM)
        break
      case 'low':
        setPriority(Priority.LOW)
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-32 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              ⚡ Quick Add Task
            </h2>
            <button
              onClick={handleClose}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full text-lg px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSubmitting}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Quick:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAction('today')}
                  className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Today 5PM
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('tomorrow')}
                  className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  Tomorrow 9AM
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('next-week')}
                  className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  Next Week
                </button>
              </div>
            </div>

            {/* Priority Actions */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Priority:</span>
                {[
                  { value: Priority.URGENT, label: 'Urgent', color: 'red' },
                  { value: Priority.HIGH, label: 'High', color: 'orange' },
                  { value: Priority.MEDIUM, label: 'Medium', color: 'blue' },
                  { value: Priority.LOW, label: 'Low', color: 'gray' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      priority === value
                        ? `bg-${color}-500 text-white`
                        : `bg-${color}-100 dark:bg-${color}-900 text-${color}-800 dark:text-${color}-200 hover:bg-${color}-200 dark:hover:bg-${color}-800`
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* List Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  List
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>⌘+Enter to save</span>
              <span>Esc to cancel</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}