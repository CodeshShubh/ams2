const CACHE_NAME = 'attendance-app-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html'
];

const API_CACHE_NAME = 'attendance-api-v1';
const ATTENDANCE_ENDPOINTS = [
  '/api/attendance',
  '/api/auth/me',
  '/api/users'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    // Cache successful GET requests for attendance data
    if (networkResponse.ok && request.method === 'GET' && 
        ATTENDANCE_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', request.url);
    
    // Fall back to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for failed requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Some features may be unavailable.' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for static asset', request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Background sync for attendance data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncAttendanceData());
  }
});

// Sync pending attendance data when online
async function syncAttendanceData() {
  try {
    // Get pending attendance data from IndexedDB
    const pendingData = await getPendingAttendanceData();
    
    for (const data of pendingData) {
      try {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        // Remove from pending queue on success
        await removePendingAttendanceData(data.id);
        console.log('Service Worker: Synced attendance data', data.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync attendance data', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// IndexedDB helpers for offline data storage
async function getPendingAttendanceData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('attendanceDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending'], 'readonly');
      const store = transaction.objectStore('pending');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingAttendanceData(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('attendanceDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending'], 'readwrite');
      const store = transaction.objectStore('pending');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New attendance notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'attendance-notification',
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Attendance App', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});