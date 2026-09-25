// Service Worker para Ambulatório IA - Prontuário Médico Offline & PWA
const CACHE_NAME = 'ambulatorio-ia-v4.7-pwa';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/icon.svg'
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

// Listener para comando de atualização imediata da interface
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
  const url = event.request.url;

  // Ignora chamadas de API, Supabase e arquivos internos de desenvolvimento/Vite
  if (
    url.includes('/rest/v1/') || 
    url.includes('/api/') ||
    url.includes('/@vite') ||
    url.includes('/@react-refresh') ||
    url.includes('/node_modules/') ||
    url.includes('/src/') ||
    url.includes('chrome-extension')
  ) {
    return;
  }

  // Apenas métodos GET e esquemas http/https
  if (event.request.method !== 'GET' || (!url.startsWith('http://') && !url.startsWith('https://'))) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a requisição de rede responder com sucesso, atualiza o cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, responseToCache).catch(() => {});
            } catch (_) {}
          }).catch(() => {});
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
