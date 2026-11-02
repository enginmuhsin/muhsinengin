/* MEDAR çevrimdışı önbellek
   - Sayfalar (HTML) önce internetten istenir: yeni sürüm yüklendiğinde herkes hemen görür.
     İnternet yoksa önbellekteki kopya açılır.
   - Simgeler ve yazı tipleri önce önbellekten gelir (değişmezler, hızlı açılır).
   Oyunu güncellediğinde bu sayıyı bir artır (medar-v2, medar-v3 ...): eski önbellek silinir. */
const V = 'medar-v2';
const DOSYALAR = [
  './', './oyun/', './antrenman/',
  './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-48.png', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  '../tema.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('medar-') && k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const sayfaMi = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (sayfaMi) {
    e.respondWith(
      fetch(req)
        .then((res) => { const kopya = res.clone(); caches.open(V).then((c) => c.put(req, kopya)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res.ok) { const kopya = res.clone(); caches.open(V).then((c) => c.put(req, kopya)); }
      return res;
    }))
  );
});
