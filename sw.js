
const CACHE = 'courierpilot-pwa-v3';
const FILES = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(
      FILES.map(async file => {
        try {
          const response = await fetch(file, { cache: 'reload' });
          if (response.ok) await cache.put(file, response);
        } catch (error) {
          // Le cache reste utilisable même si un fichier est indisponible.
        }
      })
    );
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key.startsWith('courierpilot-pwa-') && key !== CACHE)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (error) {
        return await caches.match('./index.html') ||
          await caches.match('./') ||
          Response.error();
      }
    })());
  }
});
