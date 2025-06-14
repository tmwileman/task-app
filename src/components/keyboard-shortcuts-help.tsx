'use client'

import { useState, useEffect } from 'react'
import KeyboardShortcutManager, { ShortcutGroup } from '@/lib/keyboard-shortcuts'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const [shortcutGroups, setShortcutGroups] = useState<ShortcutGroup[]>([])

  useEffect(() => {
    if (isOpen) {
      const groups = KeyboardShortcutManager.getAllShortcuts()
      setShortcutGroups(groups)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Press any of these key combinations to perform actions quickly
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcutGroups.map((group) => (
              <div key={group.name} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  {group.name === 'Global' ? '🌐 Global' : 
                   group.name === 'Dashboard' ? '📋 Dashboard' :
                   group.name === 'Calendar' ? '📅 Calendar' :
                   group.name === 'Form' ? '📝 Forms' : group.name}
                </h3>
                
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut) => (
                    <div key={shortcut.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {shortcut.description}
                      </span>
                      <div className="ml-4">
                        <ShortcutDisplay shortcut={shortcut} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips section */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">💡 Tips</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Shortcuts work differently based on your current context (dashboard, calendar, forms)</p>
              <p>• Most shortcuts are disabled when typing in text fields (except global ones)</p>
              <p>• Use <ShortcutDisplay shortcut={{ key: '/', id: 'search' }} inline /> to quickly search, then start typing</p>
              <p>• Press <ShortcutDisplay shortcut={{ key: 'Escape', id: 'escape' }} inline /> to close modals and cancel actions</p>
              <p>• Navigation shortcuts (<ShortcutDisplay shortcut={{ key: 'j', id: 'next' }} inline /> / <ShortcutDisplay shortcut={{ key: 'k', id: 'prev' }} inline />) help you move through tasks quickly</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Press <ShortcutDisplay shortcut={{ key: '?', shiftKey: true, id: 'help' }} inline /> anytime to open this help
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ShortcutDisplayProps {
  shortcut: {
    key: string
    ctrlKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
    metaKey?: boolean
    id: string
  }
  inline?: boolean
}

function ShortcutDisplay({ shortcut, inline = false }: ShortcutDisplayProps) {
  const displayText = KeyboardShortcutManager.getShortcutDisplay(shortcut)
  
  const baseClasses = "font-mono text-xs border rounded px-1.5 py-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
  const inlineClasses = inline ? "inline-block mx-1" : ""
  
  return (
    <span className={`${baseClasses} ${inlineClasses}`}>
      {displayText}
    </span>
  )
}