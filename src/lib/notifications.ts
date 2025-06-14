// Basic notification system for deadline management
export class NotificationManager {
  private static instance: NotificationManager
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
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
}

export default NotificationManager.getInstance()