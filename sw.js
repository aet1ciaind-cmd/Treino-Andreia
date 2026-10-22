// Service Worker do Treino da Andreia (PWA)
// Estratégia: network-first — sempre tenta buscar a versão mais nova primeiro.
// Só usa o cache como reserva se estiver offline. Isso evita ficar preso numa
// versão antiga depois de atualizar o arquivo no GitHub.
const CACHE_PREFIX = 'treino-andreia-';
const CACHE_NAME = CACHE_PREFIX + 'v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // só mexe nos caches deste app (não apaga o de outros apps no mesmo domínio)
          if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, responseToCache);
      });
      return response;
    }).catch(() => {
      // Offline: cai pro que tiver salvo em cache
      return caches.match(event.request);
    })
  );
});
