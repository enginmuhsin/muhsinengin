/* Dron Uçuş Simülatörü çevrimdışı önbelleği (Oyun Salonu ile aynı yöntem). */
const SURUM = 'ucus-v12';
const DOSYALAR = ['./', 'index.html', 'ek-gorevler.js', 'ornek-kayit.csv', 'manifest.webmanifest', '../dron-lab/hesap.js', '../ortak/kutuphane/three-r128.min.js', '../simge.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(SURUM).then((c) => c.addAll(DOSYALAR.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x.startsWith('ucus-') && x !== SURUM).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then((r) => { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))); return; }
  e.respondWith(caches.match(e.request).then((onbellek) => { const ag = fetch(new Request(e.request, { cache: 'no-cache' })).then((r) => { if (r.ok) { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); } return r; }).catch(() => onbellek); return onbellek || ag; }));
});
