import { TaskWithRelations } from '@/types'
import NotificationManager from './notifications'

export interface ScheduledReminder {
  id: string
  taskId: string
  taskTitle: string
  dueDate: Date
  reminderDate: Date
  type: 'deadline' | 'overdue' | 'daily_digest' | 'weekly_review'
  status: 'pending' | 'sent' | 'cancelled'
  notificationTypes: ('browser' | 'push' | 'email')[]
}

export class ReminderScheduler {
  private static instance: ReminderScheduler
  private scheduledReminders: Map<string, NodeJS.Timeout> = new Map()
  private notificationManager: typeof NotificationManager

  static getInstance(): ReminderScheduler {
    if (!ReminderScheduler.instance) {
      ReminderScheduler.instance = new ReminderScheduler()
    }
    return ReminderScheduler.instance
  }

  constructor() {
    this.notificationManager = NotificationManager
  }

  /**
   * Schedule reminders for a task based on user preferences
   */
  async scheduleTaskReminders(task: TaskWithRelations): Promise<void> {
    if (!task.dueDate || task.completed) {
      return
    }

    // Get user notification preferences
    const preferences = await this.notificationManager.getNotificationPreferences()
    
    if (!preferences.deadlineReminders.enabled) {
      return
    }

    const dueDate = new Date(task.dueDate)
    const now = new Date()

    // Schedule reminders for each configured interval
    for (const intervalMinutes of preferences.deadlineReminders.intervals) {
      const reminderTime = new Date(dueDate.getTime() - (intervalMinutes * 60 * 1000))
      
      // Only schedule future reminders
      if (reminderTime > now) {
        const reminderId = `${task.id}-${intervalMinutes}`
        await this.scheduleReminder({
          id: reminderId,
          taskId: task.id,
          taskTitle: task.title,
          dueDate,
          reminderDate: reminderTime,
          type: 'deadline',
          status: 'pending',
          notificationTypes: preferences.deadlineReminders.types
        })
      }
    }

    // Schedule overdue reminder
    const overdueTime = new Date(dueDate.getTime() + (15 * 60 * 1000)) // 15 minutes after due
    if (overdueTime > now) {
      const overdueReminderId = `${task.id}-overdue`
      await this.scheduleReminder({
        id: overdueReminderId,
        taskId: task.id,
        taskTitle: task.title,
        dueDate,
        reminderDate: overdueTime,
        type: 'overdue',
        status: 'pending',
        notificationTypes: preferences.deadlineReminders.types
      })
    }
  }

  /**
   * Schedule a specific reminder
   */
  private async scheduleReminder(reminder: ScheduledReminder): Promise<void> {
    const now = new Date()
    const timeUntilReminder = reminder.reminderDate.getTime() - now.getTime()

    if (timeUntilReminder <= 0) {
      // Reminder time has passed, send immediately
      await this.sendReminder(reminder)
      return
    }

    // Schedule the reminder
    const timeoutId = setTimeout(async () => {
      await this.sendReminder(reminder)
      this.scheduledReminders.delete(reminder.id)
    }, timeUntilReminder)

    this.scheduledReminders.set(reminder.id, timeoutId)

    // Save reminder to database for persistence across app restarts
    try {
      await fetch('/api/notifications/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminder)
      })
    } catch (error) {
      console.error('Failed to save reminder to database:', error)
    }
  }

  /**
   * Send a reminder notification
   */
  private async sendReminder(reminder: ScheduledReminder): Promise<void> {
    const preferences = await this.notificationManager.getNotificationPreferences()
    
    // Check quiet hours
    if (this.notificationManager.isInQuietHours(preferences)) {
      // Reschedule for after quiet hours
      await this.rescheduleAfterQuietHours(reminder, preferences)
      return
    }

    const { taskTitle, type, dueDate } = reminder
    let title: string
    let body: string

    switch (type) {
      case 'deadline':
        const timeUntilDue = this.formatTimeUntilDue(dueDate)
        title = `Task Due ${timeUntilDue}`
        body = `"${taskTitle}" is due ${timeUntilDue}`
        break
      case 'overdue':
        title = 'Overdue Task'
        body = `"${taskTitle}" is now overdue`
        break
      case 'daily_digest':
        title = 'Daily Task Summary'
        body = 'Here\'s your task summary for today'
        break
      case 'weekly_review':
        title = 'Weekly Task Review'
        body = 'Time to review your tasks for the week'
        break
      default:
        title = 'Task Reminder'
        body = `Reminder for "${taskTitle}"`
    }

    // Send notifications based on user preferences
    for (const notificationType of reminder.notificationTypes) {
      try {
        switch (notificationType) {
          case 'browser':
            if (preferences.deadlineReminders.sound || preferences.deadlineReminders.vibrate) {
              await this.notificationManager.showPushNotification(title, body, {
                taskId: reminder.taskId,
                taskTitle: reminder.taskTitle,
                dueDate: reminder.dueDate.toISOString(),
                reminderType: type
              })
            } else {
              this.notificationManager.showNotification(title, { body })
            }
            break
          case 'push':
            await this.sendPushNotification(reminder, title, body)
            break
          case 'email':
            await this.sendEmailNotification(reminder, title, body)
            break
        }
      } catch (error) {
        console.error(`Failed to send ${notificationType} notification:`, error)
      }
    }

    // Mark reminder as sent
    await this.markReminderAsSent(reminder.id)
  }

  /**
   * Send push notification via server
   */
  private async sendPushNotification(reminder: ScheduledReminder, title: string, body: string): Promise<void> {
    try {
      await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          data: {
            taskId: reminder.taskId,
            taskTitle: reminder.taskTitle,
            dueDate: reminder.dueDate.toISOString(),
            reminderType: reminder.type
          }
        })
      })
    } catch (error) {
      console.error('Failed to send push notification:', error)
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(reminder: ScheduledReminder, title: string, body: string): Promise<void> {
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: title,
          body,
          taskId: reminder.taskId,
          taskTitle: reminder.taskTitle,
          dueDate: reminder.dueDate.toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  }

  /**
   * Reschedule reminder after quiet hours
   */
  private async rescheduleAfterQuietHours(reminder: ScheduledReminder, preferences: any): Promise<void> {
    const now = new Date()
    const endOfQuietHours = new Date()
    const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number)
    
    endOfQuietHours.setHours(endHour, endMinute, 0, 0)
    
    // If end time is next day (overnight quiet hours)
    if (preferences.quietHours.start > preferences.quietHours.end) {
      if (now.getHours() >= parseInt(preferences.quietHours.start.split(':')[0])) {
        endOfQuietHours.setDate(endOfQuietHours.getDate() + 1)
      }
    }

    const newReminder = {
      ...reminder,
      id: `${reminder.id}-rescheduled`,
      reminderDate: endOfQuietHours
    }

    await this.scheduleReminder(newReminder)
  }

  /**
   * Cancel all reminders for a task
   */
  cancelTaskReminders(taskId: string): void {
    for (const [reminderId, timeoutId] of this.scheduledReminders.entries()) {
      if (reminderId.startsWith(taskId)) {
        clearTimeout(timeoutId)
        this.scheduledReminders.delete(reminderId)
      }
    }

    // Cancel in database
    fetch(`/api/notifications/reminders/${taskId}`, {
      method: 'DELETE'
    }).catch(error => {
      console.error('Failed to cancel reminders in database:', error)
    })
  }

  /**
   * Reschedule reminders when task due date changes
   */
  async rescheduleTaskReminders(task: TaskWithRelations): Promise<void> {
    // Cancel existing reminders
    this.cancelTaskReminders(task.id)
    
    // Schedule new reminders
    await this.scheduleTaskReminders(task)
  }

  /**
   * Schedule daily digest notification
   */
  async scheduleDailyDigest(): Promise<void> {
    const preferences = await this.notificationManager.getNotificationPreferences()
    
    if (!preferences.dailyDigest) {
      return
    }

    // Schedule for 8 AM daily
    const now = new Date()
    const nextDigest = new Date()
    nextDigest.setHours(8, 0, 0, 0)
    
    if (nextDigest <= now) {
      nextDigest.setDate(nextDigest.getDate() + 1)
    }

    const digestReminder: ScheduledReminder = {
      id: `daily-digest-${nextDigest.toISOString()}`,
      taskId: 'digest',
      taskTitle: 'Daily Task Summary',
      dueDate: nextDigest,
      reminderDate: nextDigest,
      type: 'daily_digest',
      status: 'pending',
      notificationTypes: ['browser', 'push']
    }

    await this.scheduleReminder(digestReminder)
  }

  /**
   * Schedule weekly review notification
   */
  async scheduleWeeklyReview(): Promise<void> {
    const preferences = await this.notificationManager.getNotificationPreferences()
    
    if (!preferences.weeklyReview) {
      return
    }

    // Schedule for Sunday at 7 PM
    const now = new Date()
    const nextReview = new Date()
    const daysUntilSunday = (7 - now.getDay()) % 7
    
    nextReview.setDate(now.getDate() + daysUntilSunday)
    nextReview.setHours(19, 0, 0, 0)
    
    if (nextReview <= now) {
      nextReview.setDate(nextReview.getDate() + 7)
    }

    const reviewReminder: ScheduledReminder = {
      id: `weekly-review-${nextReview.toISOString()}`,
      taskId: 'review',
      taskTitle: 'Weekly Task Review',
      dueDate: nextReview,
      reminderDate: nextReview,
      type: 'weekly_review',
      status: 'pending',
      notificationTypes: ['browser', 'push']
    }

    await this.scheduleReminder(reviewReminder)
  }

  /**
   * Load and reschedule pending reminders on app startup
   */
  async loadPendingReminders(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/reminders')
      if (response.ok) {
        const reminders: ScheduledReminder[] = await response.json()
        
        for (const reminder of reminders) {
          if (reminder.status === 'pending') {
            reminder.reminderDate = new Date(reminder.reminderDate)
            reminder.dueDate = new Date(reminder.dueDate)
            await this.scheduleReminder(reminder)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load pending reminders:', error)
    }
  }

  /**
   * Mark reminder as sent in database
   */
  private async markReminderAsSent(reminderId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/reminders/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'sent' })
      })
    } catch (error) {
      console.error('Failed to mark reminder as sent:', error)
    }
  }

  /**
   * Format time until due date for display
   */
  private formatTimeUntilDue(dueDate: Date): string {
    const now = new Date()
    const timeDiff = dueDate.getTime() - now.getTime()
    const minutesDiff = Math.floor(timeDiff / (1000 * 60))

    if (minutesDiff < 60) {
      return `in ${minutesDiff} minutes`
    } else if (minutesDiff < 1440) { // less than 24 hours
      const hours = Math.floor(minutesDiff / 60)
      return `in ${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      const days = Math.floor(minutesDiff / 1440)
      return `in ${days} day${days > 1 ? 's' : ''}`
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats(): Promise<{
    pending: number
    sent: number
    cancelled: number
  }> {
    try {
      const response = await fetch('/api/notifications/reminders/stats')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to get reminder stats:', error)
    }

    return { pending: 0, sent: 0, cancelled: 0 }
  }
}

export default ReminderScheduler.getInstance()