const CACHE_NAME  = 'gps-mqtt-pwa-v1';
const PRECACHE = [
  './', 'index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js'
];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  const req = evt.request;
  const url = new URL(req.url);

  if (url.hostname.includes('tile.openstreetmap.org')) {
    evt.respondWith(
      fetch(req).then(resp => {
        const cloned = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, cloned));
        return resp;
      }).catch(() => caches.match(req))
    );
    return;
  }

  evt.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
