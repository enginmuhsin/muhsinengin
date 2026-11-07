/* PID Ayar Oyunu çevrimdışı önbelleği (Oyun Salonu ve Uçuş Simülatörü ile aynı yöntem).
   Sayfa: önce ağ, yoksa önbellek. Diğer dosyalar: önbellekten hemen, arkada güncelle.
   Bir dosya değişince SURUM'u bir artır. */
const SURUM = 'pid-v2';
const DOSYALAR = ['./', 'index.html', 'style.css', 'app.js', 'dron3d.js', 'fizik.js', '../tema.js', '../ortak/ana-sayfa.js', '../ortak/matematik.css', '../simge.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(SURUM).then((c) => Promise.all(DOSYALAR.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x.startsWith('pid-') && x !== SURUM).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then((r) => { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('./')))); return; }
  e.respondWith(caches.match(e.request).then((onbellek) => { const ag = fetch(new Request(e.request, { cache: 'no-cache' })).then((r) => { if (r.ok) { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); } return r; }).catch(() => onbellek); return onbellek || ag; }));
});
