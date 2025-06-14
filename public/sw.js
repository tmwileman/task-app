// Service Worker for Task App - Web Push Notifications
const CACHE_NAME = 'task-app-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/calendar',
  '/offline'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Claim all clients immediately
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/offline')
        }
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event)
  
  const options = {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Task',
        icon: '/icon-view.png'
      },
      {
        action: 'complete',
        title: 'Mark Complete',
        icon: '/icon-complete.png'
      },
      {
        action: 'snooze',
        title: 'Snooze 15min',
        icon: '/icon-snooze.png'
      }
    ]
  }

  let notificationData = {
    title: 'Task Reminder',
    body: 'You have a task due soon',
    ...options
  }

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        ...options,
        data: {
          ...options.data,
          taskId: data.taskId,
          taskTitle: data.taskTitle,
          dueDate: data.dueDate,
          reminderType: data.reminderType
        }
      }
    } catch (e) {
      console.error('Error parsing push data:', e)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  )
})

// Notification click event - handle user interactions
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  const action = event.action
  const data = event.notification.data
  
  if (action === 'view') {
    // Open task in dashboard
    event.waitUntil(
      clients.openWindow(`/dashboard?task=${data.taskId}`)
    )
  } else if (action === 'complete') {
    // Mark task as complete via API
    event.waitUntil(
      fetch(`/api/tasks/${data.taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true })
      }).then(() => {
        // Show confirmation notification
        self.registration.showNotification('Task Completed', {
          body: `"${data.taskTitle}" has been marked as complete`,
          icon: '/icon-192x192.png',
          tag: 'task-completed'
        })
      }).catch(error => {
        console.error('Error completing task:', error)
        self.registration.showNotification('Error', {
          body: 'Failed to complete task. Please try again.',
          icon: '/icon-192x192.png',
          tag: 'task-error'
        })
      })
    )
  } else if (action === 'snooze') {
    // Snooze reminder for 15 minutes
    event.waitUntil(
      scheduleSnoozeReminder(data.taskId, 15)
    )
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// Background sync for offline task operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-tasks') {
    event.waitUntil(syncTasks())
  }
})

// Helper function to schedule snooze reminder
async function scheduleSnoozeReminder(taskId, minutes) {
  try {
    const response = await fetch('/api/notifications/snooze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId: taskId,
        snoozeMinutes: minutes
      })
    })

    if (response.ok) {
      self.registration.showNotification('Reminder Snoozed', {
        body: `Reminder scheduled for ${minutes} minutes from now`,
        icon: '/icon-192x192.png',
        tag: 'snooze-confirmation'
      })
    } else {
      throw new Error('Failed to snooze reminder')
    }
  } catch (error) {
    console.error('Error snoozing reminder:', error)
    self.registration.showNotification('Error', {
      body: 'Failed to snooze reminder. Please try again.',
      icon: '/icon-192x192.png',
      tag: 'snooze-error'
    })
  }
}

// Helper function to sync tasks when online
async function syncTasks() {
  try {
    // Get pending offline tasks from IndexedDB
    const pendingTasks = await getPendingOfflineTasks()
    
    for (const task of pendingTasks) {
      try {
        await fetch('/api/tasks', {
          method: task.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task.data)
        })
        
        // Remove from offline storage after successful sync
        await removePendingOfflineTask(task.id)
      } catch (error) {
        console.error('Error syncing task:', error)
      }
    }
  } catch (error) {
    console.error('Error during background sync:', error)
  }
}

// IndexedDB helpers for offline task storage
async function getPendingOfflineTasks() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskAppOffline', 1)
    
    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['pendingTasks'], 'readonly')
      const store = transaction.objectStore('pendingTasks')
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result)
      }
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error)
      }
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

async function removePendingOfflineTask(taskId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskAppOffline', 1)
    
    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['pendingTasks'], 'readwrite')
      const store = transaction.objectStore('pendingTasks')
      const deleteRequest = store.delete(taskId)
      
      deleteRequest.onsuccess = () => {
        resolve()
      }
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error)
      }
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}