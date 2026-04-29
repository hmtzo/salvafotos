// Service worker simples — cache-first pra assets estáticos, network-first pra API/HTML
const CACHE = 'sindi-hub-v1';
const ASSETS = [
  '/assets/shared.css',
  '/assets/shared.js',
  '/assets/brand/icon-color.png',
  '/assets/brand/icon-white.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Não interfere em API
  if (url.pathname.startsWith('/api/')) return;
  // HTML e tools: network-first
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('/hub.html')))
    );
    return;
  }
  // Assets: cache-first
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return resp;
        });
      })
    );
  }
});
