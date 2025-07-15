/* sw.js – GPS·MQTT PWA Service Worker
 * - 설치(install) 시 정적 자산을 캐시에 저장
 * - 실행(fetch) 시:
 *     ① HTML·CSS·JS·아이콘 → 캐시 우선, 없으면 네트워크
 *     ② tile.openstreetmap.org 타일 → 네트워크 우선 후 캐싱
 */

const CACHE_NAME  = 'gps-mqtt-pwa-v1';
const PRECACHE = [
  '/',                // GitHub Pages root
  'index.html',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js'
];

/* ---------- Install & precache ---------- */
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(c =>
      c.addAll(PRECACHE)
    )
  );
  self.skipWaiting();
});

/* ---------- Activate: old cache cleanup ---------- */
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ---------- Fetch handler ---------- */
self.addEventListener('fetch', evt => {
  const { request } = evt;
  const url = new URL(request.url);

  /* 1) 지도 타일: 네트워크 우선, 실패 시 캐시 */
  if (url.hostname.includes('tile.openstreetmap.org')) {
    evt.respondWith(
      fetch(request)
        .then(resp => {
          const cloned = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, cloned));
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  /* 2) 기타 정적 파일: 캐시 우선, 없으면 네트워크 */
  evt.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request)
    )
  );
});
