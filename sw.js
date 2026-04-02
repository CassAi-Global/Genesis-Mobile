/* Genesis Mobile Service Worker — Sovereign Shield Offline Cache */
const CACHE_NAME = 'genesis-mobile-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

/* Background Sync — Offline Ledger flush */
self.addEventListener('sync', event => {
  if (event.tag === 'ledger-sync') {
    event.waitUntil(flushPendingLedger());
  }
});

async function flushPendingLedger() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'LEDGER_SYNC_TRIGGER' }));
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
