// Sepalis Service Worker v1.0
const CACHE_NAME = 'sepalis-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/assets/images/icon.png',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache ouvert');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('[SW] Certains fichiers non mis en cache:', err);
        });
      })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie Network First avec fallback sur cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes API (toujours réseau)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cloner la réponse pour le cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur cache si hors ligne
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Page offline par défaut
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu');
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification Sepalis',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'Voir', icon: '/assets/images/icon-192.png' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Sepalis', options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic notification');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
