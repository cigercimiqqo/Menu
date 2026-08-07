const CACHE = 'miqqo-menu-v16';
const CORE = ['./', './index.html', './styles.css', './app.js', './reviews.js', './assets/brand/miqqo-logo.png', './assets/brand/miqqo-icon-512.png'];
const MENU_ASSETS = [
  './assets/menu/menu-01.webp', './assets/menu/menu-01-1200.webp',
  './assets/menu/menu-02.webp', './assets/menu/menu-02-1200.webp',
  './assets/menu/menu-05.webp', './assets/menu/menu-05-1200.webp',
  './assets/menu/menu-06.webp', './assets/menu/menu-06-1200.webp',
  './assets/menu/menu-07.webp', './assets/menu/menu-07-1200.webp',
  './assets/menu/menu-08.webp', './assets/menu/menu-08-1200.webp',
  './assets/menu/menu-09.webp', './assets/menu/menu-09-1200.webp',
  './assets/menu/menu-10.webp', './assets/menu/menu-10-1200.webp',
];
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE)
    .then(cache => cache.addAll([...CORE, ...MENU_ASSETS]))
    .catch(() => caches.open(CACHE).then(cache => Promise.all([...CORE, ...MENU_ASSETS].map(url => cache.add(url).catch(() => {})))))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
    if (!response || response.status !== 200 || response.type === 'opaque') return response;
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
