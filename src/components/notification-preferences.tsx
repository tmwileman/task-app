'use client'

import { useState, useEffect } from 'react'
import { NotificationPreferences, ReminderSettings } from '@/lib/notifications'

interface NotificationPreferencesProps {
  onClose: () => void
}

export function NotificationPreferencesModal({ onClose }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateReminderSettings = (updates: Partial<ReminderSettings>) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      deadlineReminders: {
        ...preferences.deadlineReminders,
        ...updates
      }
    })
  }

  const addReminderInterval = () => {
    if (!preferences) return

    const newInterval = 60 // Default to 1 hour
    updateReminderSettings({
      intervals: [...preferences.deadlineReminders.intervals, newInterval]
    })
  }

  const removeReminderInterval = (index: number) => {
    if (!preferences) return

    const newIntervals = preferences.deadlineReminders.intervals.filter((_, i) => i !== index)
    updateReminderSettings({ intervals: newIntervals })
  }

  const updateReminderInterval = (index: number, value: number) => {
    if (!preferences) return

    const newIntervals = [...preferences.deadlineReminders.intervals]
    newIntervals[index] = value
    updateReminderSettings({ intervals: newIntervals })
  }

  const formatIntervalDisplay = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      const days = Math.floor(minutes / 1440)
      return `${days} day${days > 1 ? 's' : ''}`
    }
  }

  const intervalOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 360, label: '6 hours' },
    { value: 720, label: '12 hours' },
    { value: 1440, label: '1 day' },
    { value: 2880, label: '2 days' },
    { value: 10080, label: '1 week' }
  ]

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading preferences...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Deadline Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Deadline Reminders</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.deadlineReminders.enabled}
                  onChange={(e) => updateReminderSettings({ enabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable reminders</span>
              </label>
            </div>

            {preferences.deadlineReminders.enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                {/* Reminder Intervals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remind me before due date:
                  </label>
                  <div className="space-y-2">
                    {preferences.deadlineReminders.intervals.map((interval, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <select
                          value={interval}
                          onChange={(e) => updateReminderInterval(index, parseInt(e.target.value))}
                          className="rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          {intervalOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeReminderInterval(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addReminderInterval}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add another reminder
                    </button>
                  </div>
                </div>

                {/* Notification Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification methods:
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'browser', label: 'Browser notifications' },
                      { key: 'push', label: 'Push notifications' },
                      { key: 'email', label: 'Email notifications' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.deadlineReminders.types.includes(key as any)}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...preferences.deadlineReminders.types, key as any]
                              : preferences.deadlineReminders.types.filter(t => t !== key)
                            updateReminderSettings({ types })
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sound and Vibration */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.deadlineReminders.sound}
                      onChange={(e) => updateReminderSettings({ sound: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sound alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.deadlineReminders.vibrate}
                      onChange={(e) => updateReminderSettings({ vibrate: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Vibration</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Daily Digest */}
          <div>
            <label className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Daily Digest</h3>
                <p className="text-sm text-gray-600">Daily summary of your tasks at 8:00 AM</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.dailyDigest}
                onChange={(e) => setPreferences({ ...preferences, dailyDigest: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Weekly Review */}
          <div>
            <label className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Weekly Review</h3>
                <p className="text-sm text-gray-600">Weekly task review every Sunday at 7:00 PM</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklyReview}
                onChange={(e) => setPreferences({ ...preferences, weeklyReview: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Quiet Hours</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.quietHours.enabled}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    quietHours: { ...preferences.quietHours, enabled: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable quiet hours</span>
              </label>
            </div>

            {preferences.quietHours.enabled && (
              <div className="pl-4 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start time
                    </label>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, start: e.target.value }
                      })}
                      className="w-full rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End time
                    </label>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, end: e.target.value }
                      })}
                      className="w-full rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  No notifications will be sent during quiet hours
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}