// Service Worker for Task App - Enhanced Offline Support
const CACHE_NAME = 'task-app-v2'
const STATIC_CACHE = 'task-app-static-v2'
const API_CACHE = 'task-app-api-v2'
const IMAGE_CACHE = 'task-app-images-v2'

// Static resources to cache
const staticAssets = [
  '/',
  '/dashboard',
  '/calendar',
  '/offline',
  '/manifest.json'
]

// API endpoints to cache
const apiEndpoints = [
  '/api/tasks',
  '/api/lists',
  '/api/notifications/preferences'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(staticAssets)),
      // Initialize offline database
      initializeOfflineDB()
    ])
  )
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE, API_CACHE, IMAGE_CACHE]
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Claim all clients immediately
  self.clients.claim()
})

// Fetch event - enhanced caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request))
    return
  }

  // Handle images
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request))
    return
  }

  // Default strategy - cache first
  event.respondWith(
    caches.match(request)
      .then(response => response || fetch(request))
      .catch(() => {
        if (request.destination === 'document') {
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

// Enhanced caching strategies
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // For GET requests, try cache first, then network
  if (request.method === 'GET') {
    try {
      const cachedResponse = await caches.match(request)
      
      // Return cached version immediately if available
      if (cachedResponse) {
        // Update cache in background
        fetch(request)
          .then(response => {
            if (response.ok) {
              const responseClone = response.clone()
              caches.open(API_CACHE).then(cache => {
                cache.put(request, responseClone)
              })
            }
          })
          .catch(() => {})
        
        return cachedResponse
      }

      // If not cached, fetch from network
      const networkResponse = await fetch(request)
      
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone()
        const cache = await caches.open(API_CACHE)
        cache.put(request, responseClone)
      }
      
      return networkResponse
    } catch (error) {
      // If network fails, try to return cached version
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
      throw error
    }
  }

  // For POST/PUT/DELETE requests, try network first
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    try {
      const response = await fetch(request)
      
      // Invalidate related caches on successful mutations
      if (response.ok) {
        await invalidateApiCache(url.pathname)
      }
      
      return response
    } catch (error) {
      // Store for background sync if offline
      if (url.pathname.startsWith('/api/tasks')) {
        await storeOfflineRequest(request)
        
        // Return a synthetic response
        return new Response(
          JSON.stringify({ message: 'Saved for background sync' }),
          {
            status: 202,
            statusText: 'Accepted - Will sync when online',
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      throw error
    }
  }

  // Default to network for other methods
  return fetch(request)
}

async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || caches.match('/offline')
  }
}

async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      const cache = await caches.open(IMAGE_CACHE)
      cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

async function invalidateApiCache(pathname) {
  const cache = await caches.open(API_CACHE)
  const keys = await cache.keys()
  
  const relatedKeys = keys.filter(request => {
    const url = new URL(request.url)
    return url.pathname.startsWith('/api/tasks') || url.pathname.startsWith('/api/lists')
  })
  
  await Promise.all(relatedKeys.map(key => cache.delete(key)))
}

async function storeOfflineRequest(request) {
  try {
    const db = await openOfflineDB()
    const transaction = db.transaction(['pendingRequests'], 'readwrite')
    const store = transaction.objectStore('pendingRequests')
    
    const requestData = {
      id: Date.now() + Math.random(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    }
    
    await store.add(requestData)
  } catch (error) {
    console.error('Error storing offline request:', error)
  }
}

// Initialize offline database
async function initializeOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskAppOffline', 2)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create pending tasks store (legacy)
      if (!db.objectStoreNames.contains('pendingTasks')) {
        db.createObjectStore('pendingTasks', { keyPath: 'id' })
      }
      
      // Create pending requests store (new)
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const store = db.createObjectStore('pendingRequests', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
      
      // Create offline data store
      if (!db.objectStoreNames.contains('offlineData')) {
        const store = db.createObjectStore('offlineData', { keyPath: 'key' })
        store.createIndex('type', 'type', { unique: false })
      }
    }
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskAppOffline', 2)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
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