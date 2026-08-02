// Custom Service Worker for NESTOS
// Handles push notifications and offline caching

// Precache manifest injected by Workbox at build time
self.__WB_MANIFEST;


self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Nest', body: event.data.text(), url: '/' };
  }

  const title = payload.title || 'Nest';
  const options = {
    body: payload.body || '',
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler - opens the app to the correct page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  const fullUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
