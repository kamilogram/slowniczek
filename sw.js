// Service Worker dla Słówka Głosowe
const CACHE_NAME = 'slowka-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/allWords.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Obsługa powiadomień w tle
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Słówka Głosowe działa w tle',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Otwórz aplikację',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Zamknij',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Słówka Głosowe', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 