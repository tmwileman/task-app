'use client'

import { useState, useEffect, useRef } from 'react'
import { DEFAULT_IMPORT_OPTIONS, type ImportOptions, type ImportResult } from '@/lib/data-import'

interface ImportInfo {
  supportedFormats: Array<{
    id: string
    name: string
    description: string
    extensions: string[]
    examples: string[]
  }>
  defaultOptions: ImportOptions
  existingLists: Array<{
    id: string
    name: string
  }>
  csvTemplate: {
    headers: string[]
    example: string[]
  }
}

interface DataImportModalProps {
  onClose: () => void
  onImportComplete: () => void
}

export function DataImportModal({ onClose, onImportComplete }: DataImportModalProps) {
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [options, setOptions] = useState<ImportOptions>(DEFAULT_IMPORT_OPTIONS)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchImportInfo()
  }, [])

  const fetchImportInfo = async () => {
    try {
      const response = await fetch('/api/import')
      if (response.ok) {
        const data = await response.json()
        setImportInfo(data)
        setOptions({ ...DEFAULT_IMPORT_OPTIONS, ...data.defaultOptions })
      }
    } catch (error) {
      console.error('Error fetching import info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('options', JSON.stringify(options))

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      setImportResult(result)

      if (result.success && result.tasksImported > 0) {
        onImportComplete()
      }
    } catch (error) {
      console.error('Error importing data:', error)
      setImportResult({
        success: false,
        tasksImported: 0,
        listsCreated: 0,
        errors: ['Failed to import data. Please try again.'],
        warnings: []
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadCSVTemplate = () => {
    if (!importInfo) return

    const { headers, example } = importInfo.csvTemplate
    const csvContent = [headers.join(','), example.join(',')].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'task-import-template.csv'
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
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

  if (!importInfo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load Import Options
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to fetch import information. Please try again.
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
              Import Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Import tasks from other apps or CSV files
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
          {!importResult ? (
            <>
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select File to Import
                </label>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div>
                      <div className="text-green-500 dark:text-green-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-400 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Drag and drop your file here, or
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm font-medium"
                      >
                        browse files
                      </button>
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Supported Formats */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Supported Formats
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {importInfo.supportedFormats.map(format => (
                    <div key={format.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {format.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format.extensions.join(', ')}
                          </p>
                        </div>
                        {format.id === 'csv' && (
                          <button
                            onClick={downloadCSVTemplate}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
                          >
                            Download Template
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Import Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.createMissingLists}
                      onChange={(e) => setOptions(prev => ({ ...prev, createMissingLists: e.target.checked }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Create missing lists automatically
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.skipDuplicates}
                      onChange={(e) => setOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Skip duplicate tasks (based on title)
                    </span>
                  </label>

                  {importInfo.existingLists.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Default list for tasks without a list
                      </label>
                      <select
                        value={options.defaultList || ''}
                        onChange={(e) => setOptions(prev => ({ ...prev, defaultList: e.target.value || undefined }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">No default list</option>
                        {importInfo.existingLists.map(list => (
                          <option key={list.id} value={list.name}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Import Results */
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                importResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <h3 className={`font-medium ${
                  importResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                }`}>
                  {importResult.success ? 'Import Completed' : 'Import Failed'}
                </h3>
                <div className="mt-2 text-sm">
                  <p className={importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    Tasks imported: {importResult.tasksImported}
                  </p>
                  {importResult.listsCreated > 0 && (
                    <p className="text-green-700 dark:text-green-300">
                      Lists created: {importResult.listsCreated}
                    </p>
                  )}
                </div>
              </div>

              {importResult.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                    Warnings ({importResult.warnings.length})
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {importResult.warnings.slice(0, 5).map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                    {importResult.warnings.length > 5 && (
                      <li>• ... and {importResult.warnings.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Errors ({importResult.errors.length})
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>• ... and {importResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {importResult 
              ? 'Import completed. You can now close this dialog.'
              : 'Select a file and configure options to import your data'
            }
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              {importResult ? 'Close' : 'Cancel'}
            </button>
            {!importResult && (
              <button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importing...' : 'Import Data'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}