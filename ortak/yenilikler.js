/* =====================================================================
   YENİLİKLER — ortak/yenilikler.js
   Sitede yapılan güncellemeleri ziyaretçiye duyurur. Üç yerde çalışır:
     1) /yenilikler/ sayfası  → bütün duyuruların listesi (#yenilikListesi)
     2) Ana sayfa             → son 3 duyuru (#sonYenilikler) ve menüde "yeni" sayısı
     3) Diğer sayfalar        → o sayfayla ilgili, henüz görülmemiş bir duyuru varsa
                                 köşede BİR KEZ küçük bir not çıkar.
   Ziyaretçinin gördüğü duyurular yalnızca kendi tarayıcısına yazılır
   (localStorage). Hiçbir şey sunucuya gönderilmez.

   YENİ DUYURU EKLEMEK: aşağıdaki listenin EN ÜSTÜNE bir satır ekle.
     id      : benzersiz kısa ad (bir kez yazılır, sonra değiştirilmez)
     tarih   : 'YYYY-AA-GG'
     baslik  : kısa başlık
     metin   : bir iki cümle; ne değişti, ziyaretçi ne yapabilir
     adres   : "Git" bağlantısı (site içi yol)
     sayfalar: not hangi sayfalarda çıksın (yol başlangıçları)
     oneri   : true → "Öğrenci önerisiyle" etiketi (görüş kutusundan gelen fikir)
   Sayfa betiği bu dosyayı ortak/gorus-baglanti.js üzerinden yükler; ayrıca eklemeye gerek yok.
   ===================================================================== */
(function () {
  'use strict';

  var YENILIKLER = [
    {
      id: 'dron-senin-tasarimin', tarih: '2026-11-13', oneri: true,
      baslik: 'Laboratuvarda tasarladığın dron artık simülatörde',
      metin: 'Tasarım Laboratuvarı\'ndaki "Bu tasarımı Uçuş Simülatörü\'nde uçur" bağlantısıyla dronun simülatöre "★ Senin tasarımın" olarak gelir. Laboratuvar artık fizik kurallarıyla bağdaşmayan tasarımları da yakalıyor: 5 gramlık bir bataryaya 12000 mAh sığmaz!',
      adres: '/dron-lab/', sayfalar: ['/dron-lab/', '/dron-ucus/', '/dron/']
    },
    {
      id: 'yenilikler-acildi', tarih: '2026-11-13',
      baslik: 'Yenilikler sayfası açıldı',
      metin: 'Sitede ne değiştiğini buradan takip edebilirsin. Önerilerinle yapılan değişiklikler "Öğrenci önerisiyle" etiketiyle yazılır.',
      adres: '/yenilikler/', sayfalar: []
    },
    {
      id: 'gorus-kutusu', tarih: '2026-11-13',
      baslik: 'Görüş ve öneriler kutusu',
      metin: 'Her sayfanın altında bir "Görüş ve öneriler" bağlantısı var. Bulduğun hatayı ya da "şu da olsa" dediğin fikri yaz; ad ve e-posta istenmez.',
      adres: '/gorus/', sayfalar: []
    },
    {
      id: 'sifre-dairesi', tarih: '2026-11-13',
      baslik: 'Şifre Dairesi açıldı',
      metin: 'Oynayarak kriptoloji: Sezar Çarkı, Kasa Soygunu ve Görünmez Mürekkep odaları. Üç odanın sonunda dairenin sırrını çözebilir misin?',
      adres: '/kriptoloji/', sayfalar: ['/kriptoloji/']
    }
  ];

  var ANAHTAR = 'me.yenilik.gorulen';
  var TAZE_GUN = 30;   // bu kadar günden eski duyurular "yeni" sayılmaz, not da çıkmaz
  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  function gorulenler() { try { return JSON.parse(localStorage.getItem(ANAHTAR)) || []; } catch (e) { return []; } }
  function gorulduYap(idler) {
    try { var g = gorulenler(); idler.forEach(function (i) { if (g.indexOf(i) < 0) g.push(i); }); localStorage.setItem(ANAHTAR, JSON.stringify(g)); } catch (e) { /* gizli sekme vb. */ }
  }
  function tarihYaz(t) { var p = t.split('-'); return (+p[2]) + ' ' + AYLAR[+p[1] - 1] + ' ' + p[0]; }
  function taze(y) { return (Date.now() - new Date(y.tarih + 'T00:00:00+03:00').getTime()) / 864e5 <= TAZE_GUN; }
  function yeniMi(y, g) { return taze(y) && g.indexOf(y.id) < 0; }
  function el(ad, sinif, metin) { var e = document.createElement(ad); if (sinif) e.className = sinif; if (metin != null) e.textContent = metin; return e; }

  function maddeYap(y, yeni) {
    var li = el('li', 'yn-madde');
    var ust = el('p', 'yn-ust');
    ust.appendChild(el('time', null, tarihYaz(y.tarih))).setAttribute('datetime', y.tarih);
    if (yeni) ust.appendChild(el('span', 'yn-yeni', 'yeni'));
    if (y.oneri) ust.appendChild(el('span', 'yn-oneri', 'Öğrenci önerisiyle'));
    li.appendChild(ust);
    var h = el('h3', 'yn-baslik');
    var a = el('a', null, y.baslik); a.href = y.adres; h.appendChild(a);
    li.appendChild(h);
    li.appendChild(el('p', 'yn-metin', y.metin));
    return li;
  }

  var STIL = '.yn-liste{list-style:none;margin:0;padding:0}' +
    '.yn-madde{padding:.9rem 0;border-top:1px solid var(--cetvel,#c9d2dc)}' +
    '.yn-ust{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem .8rem;margin:0 0 .2rem;font:600 .74rem/1.4 var(--mono,monospace);letter-spacing:.08em;text-transform:uppercase;color:var(--kursun,#5b6673)}' +
    '.yn-yeni{color:var(--kirmizi,#c0392b)}.yn-yeni::before{content:"● "}' +
    '.yn-oneri{color:var(--yesil,#2e7d4f)}.yn-oneri::before{content:"✎ "}' +
    '.yn-baslik{margin:0 0 .2rem;font:600 1.12rem/1.3 var(--serif,serif)}.yn-baslik a{color:inherit;text-decoration-thickness:1px;text-underline-offset:.2em}' +
    '.yn-metin{margin:0;max-width:64ch;color:var(--metin,#1d2733)}' +
    '.yn-sayi{display:inline-block;min-width:1.2em;margin-left:.35em;padding:0 .3em;border-radius:1em;background:var(--kirmizi,#c0392b);color:#fff;font:700 .7rem/1.45 var(--mono,monospace);text-align:center;vertical-align:.15em}' +
    '.yn-not{position:fixed;z-index:9999;right:16px;bottom:16px;max-width:min(360px,calc(100vw - 32px));padding:.8rem 2.6rem .85rem 1rem;background:var(--kagit,#f5f7fa);color:var(--metin,#1d2733);border:2px solid var(--murekkep,#1f3a8a);border-radius:6px;font:15px/1.45 var(--yazi,system-ui,sans-serif);transform:translateY(12px);opacity:0;transition:transform .35s ease-out,opacity .35s ease-out}' +
    '.yn-not.acik{transform:none;opacity:1}' +
    '.yn-not b{display:block;margin-bottom:.15rem;font-family:var(--serif,serif);font-size:1.02rem}' +
    '.yn-not .yn-ust{margin-bottom:.25rem}' +
    '.yn-not a{color:var(--murekkep,#1f3a8a);font-weight:600}' +
    '.yn-kapat{position:absolute;top:2px;right:2px;width:44px;height:44px;border:0;background:none;color:inherit;font-size:1.3rem;cursor:pointer}' +
    '@media (prefers-reduced-motion:reduce){.yn-not{transition:none}}';
  function stilEkle() { if (document.getElementById('ynStil')) return; var s = el('style'); s.id = 'ynStil'; s.textContent = STIL; document.head.appendChild(s); }

  var yol = location.pathname.replace(/index\.html$/, '');
  var g = gorulenler();

  // 1) Yenilikler sayfası: hepsini listele, sonra hepsini "görüldü" say
  var tam = document.getElementById('yenilikListesi');
  if (tam) {
    stilEkle();
    var ul = el('ul', 'yn-liste');
    YENILIKLER.forEach(function (y) { ul.appendChild(maddeYap(y, yeniMi(y, g))); });
    tam.appendChild(ul);
    gorulduYap(YENILIKLER.map(function (y) { return y.id; }));
    return;
  }

  // 2) Ana sayfa: son üç duyuru + menüdeki "Yenilikler" bağlantısına yeni sayısı
  var kisa = document.getElementById('sonYenilikler');
  var yeniSayi = YENILIKLER.filter(function (y) { return yeniMi(y, g); }).length;
  if (kisa || document.querySelector('[data-yenilik-sayi]')) {
    stilEkle();
    if (kisa) { var u2 = el('ul', 'yn-liste'); YENILIKLER.slice(0, 3).forEach(function (y) { u2.appendChild(maddeYap(y, yeniMi(y, g))); }); kisa.appendChild(u2); }
    if (yeniSayi) document.querySelectorAll('[data-yenilik-sayi]').forEach(function (a) {
      var s = el('span', 'yn-sayi', String(yeniSayi)); s.setAttribute('aria-label', yeniSayi + ' yeni'); a.appendChild(s);
    });
    return;
  }

  // 3) Diğer sayfalar: bu sayfayla ilgili görülmemiş en yeni duyuru için tek seferlik not
  var ilgili = YENILIKLER.filter(function (y) {
    return yeniMi(y, g) && (y.sayfalar || []).some(function (s) { return yol.indexOf(s) === 0; });
  })[0];
  if (!ilgili) return;
  stilEkle();
  var not = el('aside', 'yn-not'); not.setAttribute('role', 'status'); not.setAttribute('aria-label', 'Yenilik');
  var ust = el('p', 'yn-ust'); ust.appendChild(el('span', 'yn-yeni', 'yeni'));
  if (ilgili.oneri) ust.appendChild(el('span', 'yn-oneri', 'Öğrenci önerisiyle'));
  not.appendChild(ust);
  not.appendChild(el('b', null, ilgili.baslik));
  not.appendChild(document.createTextNode(ilgili.metin + ' '));
  var tum = el('a', null, 'Bütün yenilikler →'); tum.href = '/yenilikler/'; not.appendChild(tum);
  var kapat = el('button', 'yn-kapat', '×'); kapat.type = 'button'; kapat.setAttribute('aria-label', 'Notu kapat');
  function kapa() { not.classList.remove('acik'); setTimeout(function () { not.remove(); }, 400); }
  kapat.addEventListener('click', kapa);
  not.appendChild(kapat);
  document.body.appendChild(not);
  requestAnimationFrame(function () { requestAnimationFrame(function () { not.classList.add('acik'); }); });
  gorulduYap([ilgili.id]);         // bir kez gösterilir; tekrar açılınca çıkmaz
  setTimeout(kapa, 15000);
})();
