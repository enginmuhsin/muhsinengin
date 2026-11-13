/* Şifre Dairesi çevrimdışı önbelleği (zeka-oyunlari/sw.js ile aynı yöntem).
   Sayfa: önce ağ, yoksa önbellek. Diğer dosyalar: önbellekten hemen, arkada güncelle.
   Bir dosya değişince SURUM'u bir artır. Başka sitelere giden istekler (ziyaretçi sayacı) hiç ele alınmaz.
   NOT: İleride gelecek Anahtar Atölyesi (şifre üretici) bu klasörün DIŞINDA durmalı; bu çalışan ona karışmasın. */
const SURUM = 'kripto-v9';
const DOSYALAR = ['./', 'index.html', 'daire.css', 'lobi.js',
  'cekirdek/turkce-alfabe.js', 'cekirdek/sezar.js', 'cekirdek/dosyalar.js', 'cekirdek/kayit-kodu.js',
  'sezar/', 'ogretmen/', 'ogretmen/index.html', 'ogretmen/ogretmen.js', 'murekkep/', 'murekkep/index.html', 'murekkep/murekkep.js', 'murekkep/foy.html', 'murekkep/foy.js', 'murekkep/ornekler/kek.png', 'murekkep/ornekler/kek-mektup.png', 'cekirdek/steg.js', 'kasa/', 'kasa/index.html', 'kasa/kasa.js', 'kasa/foy.html', 'kasa/foy.js', 'cekirdek/entropi.js', 'cekirdek/kaba-kuvvet.js', 'sezar/index.html', 'sezar/sezar.js', 'sezar/foy.html', 'sezar/foy.js', 'foy.css',
  'bilesenler/cark.js', 'bilesenler/cizimler.js', 'bilesenler/gorev.js', 'bilesenler/durum.js', 'bilesenler/seviye.js', 'bilesenler/sunum.js', 'bilesenler/damga.js',
  '../ortak/tokenlar.css', '../ortak/matematik.css', '../ortak/ana-sayfa.js', '../ortak/sayac.js', '../tema.js', '../muzik/muzik.js', '../simge.svg',
  "../fonts/bricolage-grotesque-latin-700-normal.woff2","../fonts/bricolage-grotesque-latin-800-normal.woff2","../fonts/bricolage-grotesque-latin-ext-700-normal.woff2","../fonts/bricolage-grotesque-latin-ext-800-normal.woff2","../fonts/fraunces-latin-500-italic.woff2","../fonts/fraunces-latin-600-normal.woff2","../fonts/fraunces-latin-ext-500-italic.woff2","../fonts/fraunces-latin-ext-600-normal.woff2","../fonts/onest-latin-400-normal.woff2","../fonts/onest-latin-700-normal.woff2","../fonts/onest-latin-ext-400-normal.woff2","../fonts/onest-latin-ext-700-normal.woff2"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(SURUM).then((c) => Promise.all(DOSYALAR.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x.startsWith('kripto-') && x !== SURUM).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then((r) => { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))); return; }
  e.respondWith(caches.match(e.request).then((onbellek) => { const ag = fetch(new Request(e.request, { cache: 'no-cache' })).then((r) => { if (r.ok) { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); } return r; }).catch(() => onbellek); return onbellek || ag; }));
});
