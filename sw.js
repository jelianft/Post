// ─── JELIAN FT POSTS · Service Worker ─────────────────────────────────────
// Sube BUILD cuando publiques cambios; aun sin subirlo, index.html se pide
// primero a la red (network-first), así que la app siempre abre la última versión.
const BUILD = '20261109f';
const CACHE = 'jft-posts-v' + BUILD;
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png', './favicon-16.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(u => c.add(new Request(u, {cache: 'reload'}))))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;   // la función de portadas siempre va directo a la red
  const isPage = req.mode === 'navigate' || (url.origin === location.origin && /(\/|index\.html)$/.test(url.pathname));
  if (isPage){
    // Network-first: siempre la versión más nueva; sin conexión usa la guardada.
    e.respondWith(
      fetch(req, {cache: 'no-cache'}).then(res => {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // Resto (iconos, fuentes, JSZip): sirve lo guardado y se actualiza por detrás.
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
