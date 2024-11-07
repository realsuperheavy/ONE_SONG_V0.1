import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();
self.skipWaiting();

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Cache Spotify previews
registerRoute(
  ({ url }) => url.hostname.includes('spotify'),
  new StaleWhileRevalidate({
    cacheName: 'spotify-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

// Background sync for offline requests
const bgSyncPlugin = new BackgroundSyncPlugin('offlineQueue', {
  maxRetentionTime: 24 * 60 // 24 hours in minutes
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/requests'),
  new NetworkFirst({
    cacheName: 'requests-cache',
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    actions: data.actions
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action button clicks
    event.waitUntil(handleNotificationAction(event.action, event.notification.data));
  } else {
    // Handle notification click
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
        } else {
          clients.openWindow('/');
        }
      })
    );
  }
});

async function handleNotificationAction(action: string, data: any): Promise<void> {
  switch (action) {
    case 'approve':
      await fetch('/api/requests/approve', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      break;
    case 'reject':
      await fetch('/api/requests/reject', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      break;
  }
}

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 