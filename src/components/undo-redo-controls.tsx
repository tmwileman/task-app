'use client'

import { useState, useEffect } from 'react'
import UndoRedoManager from '@/lib/undo-redo-manager'

interface UndoRedoControlsProps {
  className?: string
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function UndoRedoControls({ 
  className = '', 
  showLabels = false, 
  size = 'md' 
}: UndoRedoControlsProps) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [undoDescription, setUndoDescription] = useState<string | null>(null)
  const [redoDescription, setRedoDescription] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const updateState = () => {
      setCanUndo(UndoRedoManager.canUndo())
      setCanRedo(UndoRedoManager.canRedo())
      setUndoDescription(UndoRedoManager.getUndoDescription())
      setRedoDescription(UndoRedoManager.getRedoDescription())
    }

    updateState()
    const unsubscribe = UndoRedoManager.subscribe(updateState)
    
    return unsubscribe
  }, [])

  const handleUndo = async () => {
    if (!canUndo || isProcessing) return

    try {
      setIsProcessing(true)
      await UndoRedoManager.undo()
    } catch (error) {
      console.error('Undo failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRedo = async () => {
    if (!canRedo || isProcessing) return

    try {
      setIsProcessing(true)
      await UndoRedoManager.redo()
    } catch (error) {
      console.error('Redo failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo || isProcessing}
        className={`
          ${sizeClasses[size]} 
          inline-flex items-center justify-center rounded-md
          text-gray-600 hover:text-gray-900 hover:bg-gray-100
          dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        title={undoDescription ? `Undo: ${undoDescription}` : 'Nothing to undo'}
      >
        {isProcessing ? (
          <div className={`${iconSizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
        ) : (
          <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )}
        {showLabels && (
          <span className={`ml-2 ${textSizeClasses[size]} font-medium`}>
            Undo
          </span>
        )}
      </button>

      {/* Redo Button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo || isProcessing}
        className={`
          ${sizeClasses[size]} 
          inline-flex items-center justify-center rounded-md
          text-gray-600 hover:text-gray-900 hover:bg-gray-100
          dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        title={redoDescription ? `Redo: ${redoDescription}` : 'Nothing to redo'}
      >
        {isProcessing ? (
          <div className={`${iconSizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
        ) : (
          <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        )}
        {showLabels && (
          <span className={`ml-2 ${textSizeClasses[size]} font-medium`}>
            Redo
          </span>
        )}
      </button>

      {/* Action Description */}
      {showLabels && (canUndo || canRedo) && (
        <div className="ml-3 text-xs text-gray-500 dark:text-gray-400 max-w-32 truncate">
          {canUndo && undoDescription && `Next: ${undoDescription}`}
        </div>
      )}
    </div>
  )
}

// Action History Component (for advanced users)
interface ActionHistoryProps {
  isOpen: boolean
  onClose: () => void
  maxItems?: number
}

export function ActionHistory({ isOpen, onClose, maxItems = 20 }: ActionHistoryProps) {
  const [recentActions, setRecentActions] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      setRecentActions(UndoRedoManager.getRecentActions(maxItems))
    }
  }, [isOpen, maxItems])

  useEffect(() => {
    if (isOpen) {
      const updateActions = () => {
        setRecentActions(UndoRedoManager.getRecentActions(maxItems))
      }

      const unsubscribe = UndoRedoManager.subscribe(updateActions)
      return unsubscribe
    }
  }, [isOpen, maxItems])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Action History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96">
          {recentActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No recent actions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActions.map((action, index) => (
                <div
                  key={action.id}
                  className="flex items-center space-x-3 p-2 rounded-md bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex-shrink-0">
                    {action.type === 'create' && (
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    )}
                    {action.type === 'update' && (
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    )}
                    {action.type === 'delete' && (
                      <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                    )}
                    {action.type === 'bulk' && (
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {action.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    #{recentActions.length - index}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}