/* Oyun Salonu çevrimdışı önbelleği. Okul ağı kopsa da oyunlar açılır.
   Sayfa: önce ağ, yoksa önbellek. Betik/stil: önbellekten hemen ver, arkada güncelle. */
const SURUM = 'salon-v11';
const DOSYALAR = ['./', 'index.html', 'salon.css', 'cekirdek.js', 'manifest.webmanifest',
  'oyunlar/gizli-kod.js', 'oyunlar/sudoku.js', 'oyunlar/hex.js', 'oyunlar/mangala.js', 'oyunlar/reversi.js', 'oyunlar/go.js', 'oyunlar/satranc.js', 'oyunlar/turnuva.js',
  '../../tema.js', '../../ortak/ana-sayfa.js', '../../simge.svg', '../../ortak/oyun-ikonlari.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(SURUM).then((c) => c.addAll(DOSYALAR.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x.startsWith('salon-') && x !== SURUM).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then((r) => { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))); return; }
  e.respondWith(caches.match(e.request).then((onbellek) => { const ag = fetch(new Request(e.request, { cache: 'no-cache' })).then((r) => { if (r.ok) { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); } return r; }).catch(() => onbellek); return onbellek || ag; }));
});
