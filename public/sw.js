const CACHE_NAME = 'agentspark-v1';
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/globals.css',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API calls: Network-first
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match(request))
        );
        return;
    }

    // Static assets: Cache-first
    event.respondWith(
        caches.match(request).then((response) => {
            return response || fetch(request).catch(() => {
                if (request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
            });
        })
    );
});
