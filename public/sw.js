const CACHE_NAME = 'kalambaz-pwa-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for HTML navigations so users always get fresh daily app updates
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// Handle real background Web Push notifications even when Chrome/PWA is closed
self.addEventListener('push', (event) => {
  let payload = {
    title: '🥦 کلمه جدید امروز کلمباز آماده است!',
    body: 'معماهای ۴، ۵ و ۶ حرفی امروز منتشر شدند — وارد شوید و استریک خود را حفظ کنید!',
    url: '/',
    tag: 'kalambaz-daily-push',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed && typeof parsed === 'object') {
        payload = {
          title: typeof parsed.title === 'string' && parsed.title ? parsed.title : payload.title,
          body: typeof parsed.body === 'string' && parsed.body ? parsed.body : payload.body,
          url:
            typeof parsed.url === 'string' &&
            parsed.url.startsWith('/') &&
            !parsed.url.startsWith('//')
              ? parsed.url
              : '/',
          tag: typeof parsed.tag === 'string' && parsed.tag ? parsed.tag : payload.tag,
        };
      }
    } catch {
      try {
        const text = event.data.text();
        if (text) payload.body = text;
      } catch {}
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/favicon-96x96.png',
      dir: 'rtl',
      lang: 'fa-IR',
      tag: payload.tag,
      renotify: true,
      data: { url: payload.url },
    })
  );
});

// Focus or open Kalambaz when the user taps a daily reminder notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl =
    event.notification.data && typeof event.notification.data.url === 'string'
      ? event.notification.data.url
      : '/';
  const targetUrl = rawUrl.startsWith('/') && !rawUrl.startsWith('//') ? rawUrl : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
