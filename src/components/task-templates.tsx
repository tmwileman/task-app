'use client'

import { useState } from 'react'
import { Priority } from '@prisma/client'

export interface TaskTemplate {
  id: string
  name: string
  title: string
  description?: string
  priority: Priority
  category: string
  estimatedDuration?: number // in minutes
  subtasks?: string[]
  tags?: string[]
  icon?: string
}

interface TaskTemplatesProps {
  onSelectTemplate: (template: TaskTemplate) => void
  onClose: () => void
}

// Default templates
const defaultTemplates: TaskTemplate[] = [
  {
    id: 'meeting-prep',
    name: 'Meeting Preparation',
    title: 'Prepare for {{meeting_name}}',
    description: 'Prepare agenda and materials for the upcoming meeting',
    priority: Priority.HIGH,
    category: 'Work',
    estimatedDuration: 30,
    subtasks: [
      'Review previous meeting notes',
      'Prepare agenda items',
      'Gather necessary documents',
      'Send calendar invite'
    ],
    icon: '📋'
  },
  {
    id: 'code-review',
    name: 'Code Review',
    title: 'Review {{feature_name}} PR',
    description: 'Review code changes and provide feedback',
    priority: Priority.MEDIUM,
    category: 'Development',
    estimatedDuration: 45,
    subtasks: [
      'Check code style and conventions',
      'Test functionality',
      'Review security considerations',
      'Provide constructive feedback'
    ],
    icon: '💻'
  },
  {
    id: 'weekly-planning',
    name: 'Weekly Planning',
    title: 'Plan week of {{week_date}}',
    description: 'Review and plan tasks for the upcoming week',
    priority: Priority.MEDIUM,
    category: 'Planning',
    estimatedDuration: 20,
    subtasks: [
      'Review previous week accomplishments',
      'Identify priority tasks',
      'Schedule important meetings',
      'Set weekly goals'
    ],
    icon: '📅'
  },
  {
    id: 'project-kickoff',
    name: 'Project Kickoff',
    title: 'Kickoff {{project_name}} project',
    description: 'Initialize and set up a new project',
    priority: Priority.HIGH,
    category: 'Project Management',
    estimatedDuration: 120,
    subtasks: [
      'Define project scope and objectives',
      'Identify team members and roles',
      'Set up project workspace',
      'Create initial timeline',
      'Schedule kickoff meeting'
    ],
    icon: '🚀'
  },
  {
    id: 'bug-fix',
    name: 'Bug Fix',
    title: 'Fix: {{bug_description}}',
    description: 'Investigate and resolve reported bug',
    priority: Priority.HIGH,
    category: 'Development',
    estimatedDuration: 60,
    subtasks: [
      'Reproduce the issue',
      'Investigate root cause',
      'Implement fix',
      'Test solution',
      'Update documentation'
    ],
    icon: '🐛'
  },
  {
    id: 'exercise-routine',
    name: 'Exercise Routine',
    title: '{{workout_type}} workout',
    description: 'Complete daily exercise routine',
    priority: Priority.MEDIUM,
    category: 'Health',
    estimatedDuration: 45,
    subtasks: [
      'Warm up (5 min)',
      'Main workout (30 min)',
      'Cool down (5 min)',
      'Log workout details'
    ],
    icon: '💪'
  },
  {
    id: 'grocery-shopping',
    name: 'Grocery Shopping',
    title: 'Weekly grocery shopping',
    description: 'Buy groceries for the week',
    priority: Priority.LOW,
    category: 'Personal',
    estimatedDuration: 60,
    subtasks: [
      'Check pantry and fridge',
      'Make shopping list',
      'Visit grocery store',
      'Put away groceries'
    ],
    icon: '🛒'
  },
  {
    id: 'learning-session',
    name: 'Learning Session',
    title: 'Learn {{topic}}',
    description: 'Dedicated time for learning new skills',
    priority: Priority.MEDIUM,
    category: 'Education',
    estimatedDuration: 90,
    subtasks: [
      'Find quality learning resources',
      'Take notes on key concepts',
      'Practice what you learned',
      'Reflect on progress'
    ],
    icon: '📚'
  }
]

export function TaskTemplatesModal({ onSelectTemplate, onClose }: TaskTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [customValues, setCustomValues] = useState<{ [key: string]: string }>({})

  const categories = ['All', ...Array.from(new Set(defaultTemplates.map(t => t.category)))]
  
  const filteredTemplates = selectedCategory === 'All' 
    ? defaultTemplates 
    : defaultTemplates.filter(t => t.category === selectedCategory)

  const handleSelectTemplate = (template: TaskTemplate) => {
    // Process template with custom values
    const processedTemplate = { ...template }
    
    // Replace placeholders in title and description
    let processedTitle = template.title
    let processedDescription = template.description || ''
    
    Object.entries(customValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      processedTitle = processedTitle.replace(new RegExp(placeholder, 'g'), value)
      processedDescription = processedDescription.replace(new RegExp(placeholder, 'g'), value)
    })
    
    processedTemplate.title = processedTitle
    processedTemplate.description = processedDescription
    
    onSelectTemplate(processedTemplate)
    onClose()
  }

  const getPlaceholders = (template: TaskTemplate): string[] => {
    const text = `${template.title} ${template.description || ''}`
    const matches = text.match(/\{\{([^}]+)\}\}/g)
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : []
  }

  const updateCustomValue = (key: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Task Templates
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a template to quickly create common tasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const placeholders = getPlaceholders(template)
              
              return (
                <div
                  key={template.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {template.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            template.priority === Priority.URGENT ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                            template.priority === Priority.HIGH ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                            template.priority === Priority.MEDIUM ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {template.priority}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {template.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>

                  {template.estimatedDuration && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {template.estimatedDuration} min
                    </div>
                  )}

                  {template.subtasks && template.subtasks.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Includes {template.subtasks.length} subtasks
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {template.subtasks.slice(0, 3).map((subtask, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {subtask}
                          </li>
                        ))}
                        {template.subtasks.length > 3 && (
                          <li className="text-gray-500 dark:text-gray-500">
                            +{template.subtasks.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Custom Placeholders */}
                  {placeholders.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Customize:
                      </p>
                      {placeholders.map(placeholder => (
                        <input
                          key={placeholder}
                          type="text"
                          placeholder={placeholder.replace(/_/g, ' ')}
                          value={customValues[placeholder] || ''}
                          onChange={(e) => updateCustomValue(placeholder, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Templates help you create consistent, well-structured tasks
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to use templates
export function useTaskTemplates() {
  const [showTemplates, setShowTemplates] = useState(false)

  const openTemplates = () => setShowTemplates(true)
  const closeTemplates = () => setShowTemplates(false)

  return {
    showTemplates,
    openTemplates,
    closeTemplates
  }
}