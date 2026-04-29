// Service worker — network-first em tudo (assets podem mudar), cache só como fallback offline
const CACHE = 'sindi-hub-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))  // limpa TUDO de versões antigas
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Nunca cacheia API
  if (url.pathname.startsWith('/api/')) return;
  // Network-first pra tudo (com fallback de cache só se offline)
  e.respondWith(
    fetch(e.request).then(resp => {
      // Salva cópia em cache pra fallback offline
      if (resp.ok && e.request.method === 'GET') {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
