// =====================================================================
// Service Worker — multi-strategy
// =====================================================================
// Estratégias por tipo de recurso:
//
// • API (/api/*) — bypass total (nunca cacheia)
// • HTML (.html, /, navegação) — network-first com fallback offline
// • Assets internos (/assets/*, sw.js, manifest) — network-first com fallback
// • CDN imutáveis (fonts.googleapis, jsdelivr, unpkg) — stale-while-revalidate
// • Imagens (.png/.jpg/.svg/.webp/.ico) — cache-first (raramente mudam)
//
// Pre-cache no install: HTML core + shared.css + shared.js + ícones críticos.
// =====================================================================

const VERSION = 'sindi-hub-v4';
const CACHE_CORE   = `${VERSION}-core`;
const CACHE_CDN    = `${VERSION}-cdn`;
const CACHE_IMG    = `${VERSION}-img`;
const ALL_CACHES   = [CACHE_CORE, CACHE_CDN, CACHE_IMG];

// Recursos críticos pra pré-cachear (latência zero na 2ª visita)
const PRECACHE_CORE = [
  '/',
  '/hub.html',
  '/login.html',
  '/index.html',
  '/dashboard.html',
  '/perfil.html',
  '/tools/sindi.html',
  '/assets/shared.css',
  '/assets/shared.js',
  '/manifest.webmanifest',
  '/assets/brand/icon-color.png',
];

// Limite de itens no cache de imagens pra não estourar storage
const IMG_CACHE_MAX = 60;

// ---------------------- INSTALL ----------------------
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE_CORE);
    // Pre-cache best-effort: nem tudo precisa estar online no install
    await Promise.allSettled(PRECACHE_CORE.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

// ---------------------- ACTIVATE ---------------------
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => !ALL_CACHES.includes(k))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// ---------------------- FETCH ------------------------
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) API — nunca cacheia
  if (url.pathname.startsWith('/api/')) return;

  // 2) CDN imutáveis — stale-while-revalidate
  const isCdn = /(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)/.test(url.host);
  if (isCdn) {
    event.respondWith(staleWhileRevalidate(req, CACHE_CDN));
    return;
  }

  // 3) Imagens — cache-first com LRU light
  const isImg = /\.(png|jpg|jpeg|webp|svg|ico|gif)(\?|$)/i.test(url.pathname);
  if (isImg) {
    event.respondWith(cacheFirstWithLru(req, CACHE_IMG, IMG_CACHE_MAX));
    return;
  }

  // 4) HTML/Documento — network-first com fallback offline
  const isDocument = req.mode === 'navigate' ||
                     (req.headers.get('accept') || '').includes('text/html') ||
                     url.pathname.endsWith('.html');
  if (isDocument) {
    event.respondWith(networkFirstHtml(req));
    return;
  }

  // 5) Assets internos (CSS/JS/fontes locais) — network-first com cache fallback
  event.respondWith(networkFirst(req, CACHE_CORE));
});

// ---------------------- STRATEGIES ------------------

async function networkFirst(req, cacheName) {
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      const copy = resp.clone();
      caches.open(cacheName).then(c => c.put(req, copy)).catch(() => {});
    }
    return resp;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirstHtml(req) {
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      const copy = resp.clone();
      caches.open(CACHE_CORE).then(c => c.put(req, copy)).catch(() => {});
    }
    return resp;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    // Último fallback: hub.html cached
    const hub = await caches.match('/hub.html');
    if (hub) return hub;
    return new Response('Offline. Sem cache disponível.', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then(resp => {
      if (resp.ok) cache.put(req, resp.clone()).catch(() => {});
      return resp;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function cacheFirstWithLru(req, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      const copy = resp.clone();
      cache.put(req, copy).then(() => trimCache(cacheName, max)).catch(() => {});
    }
    return resp;
  } catch {
    return cached || new Response('', { status: 404 });
  }
}

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    // Remove os mais antigos (LRU light: ordem de inserção)
    const toRemove = keys.length - max;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(keys[i]).catch(() => {});
    }
  }
}
