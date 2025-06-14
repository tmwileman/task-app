'use client'

import { useState } from 'react'
import { DataExportModal } from '@/components/data-export-modal'
import { DataImportModal } from '@/components/data-import-modal'
import { TaskArchive } from '@/components/task-archive'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'

interface DataManagementHubProps {
  onClose: () => void
}

type ActiveModal = 'export' | 'import' | 'archive' | 'analytics' | null

export function DataManagementHub({ onClose }: DataManagementHubProps) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  const dataManagementFeatures = [
    {
      id: 'export' as const,
      title: 'Export Data',
      description: 'Download your tasks and lists in various formats (JSON, CSV, iCal)',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'blue',
      available: true
    },
    {
      id: 'import' as const,
      title: 'Import Data',
      description: 'Import tasks from other apps (CSV, JSON, Todoist, Any.do)',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      color: 'green',
      available: true
    },
    {
      id: 'archive' as const,
      title: 'Archive Management',
      description: 'View, restore, or permanently delete archived tasks',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4 4-4M5 16l4-4 4 4" />
        </svg>
      ),
      color: 'orange',
      available: true
    },
    {
      id: 'analytics' as const,
      title: 'Analytics & Insights',
      description: 'View productivity statistics and task completion trends',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'purple',
      available: true
    },
    {
      id: 'backup' as const,
      title: 'Backup & Restore',
      description: 'Create full data backups and restore from previous versions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      color: 'indigo',
      available: false
    },
    {
      id: 'sharing' as const,
      title: 'Task Sharing',
      description: 'Share tasks and lists with other users or via public links',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      color: 'pink',
      available: false
    }
  ]

  const getColorClasses = (color: string, available: boolean) => {
    if (!available) {
      return {
        card: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        icon: 'text-gray-400 dark:text-gray-500',
        title: 'text-gray-500 dark:text-gray-400',
        button: 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
      }
    }

    const colorMap = {
      blue: {
        card: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-900 dark:text-blue-100',
        button: 'bg-blue-600 hover:bg-blue-700 text-white'
      },
      green: {
        card: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        title: 'text-green-900 dark:text-green-100',
        button: 'bg-green-600 hover:bg-green-700 text-white'
      },
      orange: {
        card: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700',
        icon: 'text-orange-600 dark:text-orange-400',
        title: 'text-orange-900 dark:text-orange-100',
        button: 'bg-orange-600 hover:bg-orange-700 text-white'
      },
      purple: {
        card: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
        icon: 'text-purple-600 dark:text-purple-400',
        title: 'text-purple-900 dark:text-purple-100',
        button: 'bg-purple-600 hover:bg-purple-700 text-white'
      },
      indigo: {
        card: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700',
        icon: 'text-indigo-600 dark:text-indigo-400',
        title: 'text-indigo-900 dark:text-indigo-100',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white'
      },
      pink: {
        card: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700',
        icon: 'text-pink-600 dark:text-pink-400',
        title: 'text-pink-900 dark:text-pink-100',
        button: 'bg-pink-600 hover:bg-pink-700 text-white'
      }
    }

    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const handleFeatureClick = (featureId: string, available: boolean) => {
    if (!available) return
    setActiveModal(featureId as ActiveModal)
  }

  const handleModalClose = () => {
    setActiveModal(null)
  }

  const handleImportComplete = () => {
    // Refresh data after import
    window.location.reload()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Data Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your task data with export, import, archive, and analytics tools
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

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dataManagementFeatures.map(feature => {
                const colors = getColorClasses(feature.color, feature.available)
                
                return (
                  <div
                    key={feature.id}
                    className={`border rounded-lg p-6 transition-colors ${colors.card}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${colors.icon}`}>
                        {feature.icon}
                      </div>
                      {!feature.available && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`text-lg font-medium mb-2 ${colors.title}`}>
                      {feature.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {feature.description}
                    </p>
                    
                    <button
                      onClick={() => handleFeatureClick(feature.id, feature.available)}
                      disabled={!feature.available}
                      className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${colors.button}`}
                    >
                      {feature.available ? `Open ${feature.title}` : 'Coming Soon'}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <button
                  onClick={() => setActiveModal('export')}
                  className="p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  <div className="text-2xl">📤</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Export</div>
                </button>
                <button
                  onClick={() => setActiveModal('import')}
                  className="p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  <div className="text-2xl">📥</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Import</div>
                </button>
                <button
                  onClick={() => setActiveModal('archive')}
                  className="p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  <div className="text-2xl">🗃️</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Archive</div>
                </button>
                <button
                  onClick={() => setActiveModal('analytics')}
                  className="p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  <div className="text-2xl">📊</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Analytics</div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use these tools to manage your task data effectively and maintain your productivity workflow.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'export' && (
        <DataExportModal onClose={handleModalClose} />
      )}
      
      {activeModal === 'import' && (
        <DataImportModal 
          onClose={handleModalClose} 
          onImportComplete={handleImportComplete}
        />
      )}
      
      {activeModal === 'archive' && (
        <TaskArchive onClose={handleModalClose} />
      )}
      
      {activeModal === 'analytics' && (
        <AnalyticsDashboard onClose={handleModalClose} />
      )}
    </>
  )
}