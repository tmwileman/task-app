'use client'

import { useState } from 'react'

interface TaskListFormProps {
  onSubmit: (listData: {
    name: string
    description?: string
    color: string
  }) => void
  onCancel?: () => void
  isSubmitting?: boolean
}

const colorOptions = [
  { value: '#3b82f6', name: 'Blue', class: 'bg-blue-500' },
  { value: '#10b981', name: 'Green', class: 'bg-green-500' },
  { value: '#8b5cf6', name: 'Purple', class: 'bg-purple-500' },
  { value: '#f59e0b', name: 'Orange', class: 'bg-orange-500' },
  { value: '#ef4444', name: 'Red', class: 'bg-red-500' },
  { value: '#06b6d4', name: 'Cyan', class: 'bg-cyan-500' },
  { value: '#84cc16', name: 'Lime', class: 'bg-lime-500' },
  { value: '#f97316', name: 'Amber', class: 'bg-amber-500' },
]

export function TaskListForm({ onSubmit, onCancel, isSubmitting = false }: TaskListFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!name.trim()) {
      newErrors.name = 'List name is required'
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
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    })

    // Reset form
    setName('')
    setDescription('')
    setColor('#3b82f6')
    setErrors({})
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New List</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter list name..."
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
            placeholder="Add list description..."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((colorOption) => (
              <button
                key={colorOption.value}
                type="button"
                onClick={() => setColor(colorOption.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === colorOption.value
                    ? 'border-gray-800 scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                } ${colorOption.class}`}
                disabled={isSubmitting}
                title={colorOption.name}
              />
            ))}
          </div>
        </div>

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
            {isSubmitting ? 'Creating...' : 'Create List'}
          </button>
        </div>
      </form>
    </div>
  )
}