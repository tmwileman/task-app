'use client'

import { useState, useEffect } from 'react'
import { EXPORT_FORMATS, downloadFile, type ExportOptions } from '@/lib/data-export'

interface ExportMetadata {
  formats: typeof EXPORT_FORMATS
  lists: Array<{
    id: string
    name: string
    taskCount: number
  }>
  stats: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    totalLists: number
    tasksWithDueDates: number
    recurringTasks: number
  }
  dateRange: {
    earliest: number
    latest: number
  }
}

interface DataExportModalProps {
  onClose: () => void
}

export function DataExportModal({ onClose }: DataExportModalProps) {
  const [metadata, setMetadata] = useState<ExportMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'ical'>('json')
  const [includeCompleted, setIncludeCompleted] = useState(true)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{
    enabled: boolean
    start: string
    end: string
  }>({
    enabled: false,
    start: '',
    end: ''
  })

  useEffect(() => {
    fetchExportMetadata()
  }, [])

  const fetchExportMetadata = async () => {
    try {
      const response = await fetch('/api/export')
      if (response.ok) {
        const data = await response.json()
        setMetadata(data)
        
        // Set default date range
        setDateRange(prev => ({
          ...prev,
          start: new Date(data.dateRange.earliest).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }))
      }
    } catch (error) {
      console.error('Error fetching export metadata:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!metadata) return

    setExporting(true)
    try {
      const options: ExportOptions = {
        format: selectedFormat,
        includeCompleted,
        includeArchived,
        listIds: selectedLists.length > 0 ? selectedLists : undefined,
        dateRange: dateRange.enabled ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : undefined
      }

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ options })
      })

      if (response.ok) {
        const content = await response.text()
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition?.match(/filename="([^"]*)"/))?.[1] || 
          `task-export.${selectedFormat}`
        
        downloadFile(content, filename, metadata.formats[selectedFormat].mimeType)
        onClose()
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const toggleListSelection = (listId: string) => {
    setSelectedLists(prev => 
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!metadata) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load Export Options
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to fetch export metadata. Please try again.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Export Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Download your tasks and lists in various formats
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Export Statistics */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Your Data Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Total Tasks:</span>
                <span className="ml-2 font-medium">{metadata.stats.totalTasks}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Completed:</span>
                <span className="ml-2 font-medium">{metadata.stats.completedTasks}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Lists:</span>
                <span className="ml-2 font-medium">{metadata.stats.totalLists}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">With Due Dates:</span>
                <span className="ml-2 font-medium">{metadata.stats.tasksWithDueDates}</span>
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(metadata.formats).map(([key, format]) => (
                <label
                  key={key}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={key}
                    checked={selectedFormat === key}
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {format.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {format.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Include Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Include in Export
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeCompleted}
                  onChange={(e) => setIncludeCompleted(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Completed tasks ({metadata.stats.completedTasks})
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  className="mr-3"
                  disabled
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Archived tasks (coming soon)
                </span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={dateRange.enabled}
                onChange={(e) => setDateRange(prev => ({ ...prev, enabled: e.target.checked }))}
                className="mr-3"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by date range
              </span>
            </label>
            
            {dateRange.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* List Selection */}
          {metadata.lists.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Export Specific Lists (optional)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {metadata.lists.map(list => (
                  <label key={list.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedLists.includes(list.id)}
                      onChange={() => toggleListSelection(list.id)}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {list.name} ({list.taskCount} tasks)
                    </span>
                  </label>
                ))}
              </div>
              {selectedLists.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedLists.length} list(s) selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Export includes all selected data in {metadata.formats[selectedFormat].name} format
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}