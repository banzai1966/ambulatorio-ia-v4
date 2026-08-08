// Service Worker para Ambulatório IA - Prontuário Médico Offline
const CACHE_NAME = 'ambulatorio-ia-v4.5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
];

// Instalação do Service Worker e Caches de Recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Caching non-critical asset error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Fetch: Network-First com Fallback de Cache para o App Shell
self.addEventListener('fetch', (event) => {
  // Ignora requisições de API / Supabase do cache direto (tradas via localStorage/IndexedDB)
  if (event.request.url.includes('/rest/v1/') || event.request.url.includes('/api/')) {
    return;
  }

  // Apenas métodos GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a requisição de rede responder com sucesso, atualiza o cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar (ex: offline), busca no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Para requisições de navegação HTML, retorna a index.html em cache
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
