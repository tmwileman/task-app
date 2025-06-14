// Enhanced notification system with Web Push API and reminder scheduling
export interface ReminderSettings {
  enabled: boolean
  intervals: number[] // minutes before due date
  types: ('browser' | 'push' | 'email')[]
  sound: boolean
  vibrate: boolean
}

export interface NotificationPreferences {
  deadlineReminders: ReminderSettings
  dailyDigest: boolean
  weeklyReview: boolean
  quietHours: {
    enabled: boolean
    start: string // HH:MM format
    end: string   // HH:MM format
  }
}

export class NotificationManager {
  private static instance: NotificationManager
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private pushSubscription: PushSubscription | null = null
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  async initialize(): Promise<void> {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', this.serviceWorkerRegistration)
        
        // Set up push subscription if supported
        await this.setupPushNotifications()
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)
  }

  showTaskDeadlineNotification(taskTitle: string, timeUntilDue: string): void {
    this.showNotification(`Task Due ${timeUntilDue}`, {
      body: `"${taskTitle}" is due ${timeUntilDue}`,
      tag: 'task-deadline',
      requireInteraction: true,
    })
  }

  showOverdueTaskNotification(taskTitle: string): void {
    this.showNotification('Overdue Task', {
      body: `"${taskTitle}" is now overdue`,
      tag: 'task-overdue',
      requireInteraction: true,
    })
  }

  scheduleTaskReminder(taskId: string, taskTitle: string, dueDate: Date): void {
    const now = new Date().getTime()
    const due = dueDate.getTime()
    const timeUntilDue = due - now

    // Schedule notifications for different time intervals
    const intervals = [
      { time: 24 * 60 * 60 * 1000, message: 'tomorrow' }, // 1 day before
      { time: 2 * 60 * 60 * 1000, message: 'in 2 hours' }, // 2 hours before
      { time: 30 * 60 * 1000, message: 'in 30 minutes' }, // 30 minutes before
    ]

    intervals.forEach(({ time, message }) => {
      const notificationTime = timeUntilDue - time
      
      if (notificationTime > 0) {
        setTimeout(() => {
          this.showTaskDeadlineNotification(taskTitle, message)
        }, notificationTime)
      }
    })

    // Schedule overdue notification
    if (timeUntilDue > 0) {
      setTimeout(() => {
        this.showOverdueTaskNotification(taskTitle)
      }, timeUntilDue + 60000) // 1 minute after due time
    }
  }

  async setupPushNotifications(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service Worker not registered')
      return
    }

    try {
      // Check for existing subscription
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      
      if (!this.pushSubscription) {
        // Create new subscription with VAPID keys (you'll need to generate these)
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (vapidPublicKey) {
          this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
          })
          
          // Send subscription to server
          await this.sendSubscriptionToServer(this.pushSubscription)
        }
      }
    } catch (error) {
      console.error('Failed to set up push notifications:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  async scheduleReminder(taskId: string, taskTitle: string, dueDate: Date, reminderMinutes: number[]): Promise<void> {
    const now = new Date().getTime()
    const due = dueDate.getTime()

    for (const minutes of reminderMinutes) {
      const reminderTime = due - (minutes * 60 * 1000)
      
      if (reminderTime > now) {
        // Schedule browser notification
        setTimeout(() => {
          this.showTaskDeadlineNotification(taskTitle, this.formatTimeUntilDue(minutes))
        }, reminderTime - now)

        // Schedule push notification via server
        try {
          await fetch('/api/notifications/schedule', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              taskId,
              taskTitle,
              dueDate: dueDate.toISOString(),
              reminderTime: new Date(reminderTime).toISOString(),
              type: 'reminder'
            })
          })
        } catch (error) {
          console.error('Failed to schedule push notification:', error)
        }
      }
    }
  }

  private formatTimeUntilDue(minutes: number): string {
    if (minutes < 60) {
      return `in ${minutes} minutes`
    } else if (minutes < 1440) { // less than 24 hours
      const hours = Math.floor(minutes / 60)
      return `in ${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      const days = Math.floor(minutes / 1440)
      return `in ${days} day${days > 1 ? 's' : ''}`
    }
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
    }

    // Return default preferences
    return {
      deadlineReminders: {
        enabled: true,
        intervals: [1440, 120, 30], // 1 day, 2 hours, 30 minutes
        types: ['browser', 'push'],
        sound: true,
        vibrate: true
      },
      dailyDigest: true,
      weeklyReview: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    }
  }

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      })
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
    }
  }

  isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { start, end } = preferences.quietHours
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end
    } else {
      return currentTime >= start && currentTime <= end
    }
  }

  checkForUpcomingDeadlines(tasks: Array<{ id: string; title: string; dueDate: Date | null; completed: boolean }>): void {
    const now = new Date()
    
    tasks
      .filter(task => task.dueDate && !task.completed)
      .forEach(task => {
        const dueDate = new Date(task.dueDate!)
        const timeDiff = dueDate.getTime() - now.getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)
        
        // Notify for tasks due within 2 hours
        if (hoursDiff > 0 && hoursDiff <= 2) {
          const hoursText = Math.ceil(hoursDiff) === 1 ? 'hour' : 'hours'
          this.showTaskDeadlineNotification(task.title, `in ${Math.ceil(hoursDiff)} ${hoursText}`)
        }
        
        // Notify for overdue tasks
        if (timeDiff < 0) {
          this.showOverdueTaskNotification(task.title)
        }
      })
  }

  // Enhanced notification methods with service worker support
  async showPushNotification(title: string, body: string, data?: any): Promise<void> {
    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.showNotification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data,
        actions: [
          {
            action: 'view',
            title: 'View Task'
          },
          {
            action: 'complete',
            title: 'Complete'
          }
        ]
      })
    } else {
      // Fallback to browser notification
      this.showNotification(title, { body })
    }
  }
}

export default NotificationManager.getInstance()