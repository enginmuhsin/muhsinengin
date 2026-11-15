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
      id: 'fener-yatay', tarih: '2026-11-15',
      baslik: 'Telefon yan tutulunca rahat kumanda; fener aç/kapa ve katlanır fener paneli',
      metin: 'Simülatörde telefonu yan tuttuğunda fener paneli artık iki kolun arasına, ekranın altına yerleşiyor; sağ kol serbest. Fener panelini başlığına dokunarak gizleyip açabilirsin, "Işık" düğmesiyle (klavyede H) feneri tamamen kapatabilirsin. Fener kapalıyken Pamuk\'u termal kamerayla (G) arayabilirsin. Üst düğmeler, gaz göstergesi ve telemetri de yan ekrana göre küçüldü.',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/']
    },
    {
      id: 'sehir-cami', tarih: '2026-11-15',
      baslik: 'Şehre selatin camii ve mahya; Pamuk yenilendi',
      metin: 'Gençlik Parkı\'nın batısında Süleymaniye örnek alınarak yapılmış büyük bir cami var: 24 pencereli kasnağıyla ana kubbe, yarım kubbeler, dört minare (şerefeleri gece yanar), kubbeli revaklarıyla avlu, şadırvan ve taçkapı. Minareler arasındaki mahyada Yunus Emre\'nin sözü yazıyor: "İLİM İLİM BİLMEKTİR, İLİM KENDİN BİLMEKTİR". En güzel hâli gece, doğudan bakınca! Van kedisi Pamuk da yenilendi: bembeyaz, iri iki renkli gözlü, kırmızı tasmalı. Artık uzaktan kaplana benzemiyor.',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/', '/dron/']
    },
    {
      id: 'bilsem-ic', tarih: '2026-11-15',
      baslik: 'BİLSEM binasının içine gir: atölyeler, müdür odası, akıllı tahtalar',
      metin: 'Simülatördeki okul artık üç katlı gerçek bir bina. Zemin katta giriş holü, müdür ve müdür yardımcısı odası, öğretmenler odası, kütüphane, kantin ve Zekâ Oyunları Atölyesi; üst katlarda Matematik, Fen, Bilişim, Yapay Zekâ, Dron ve Robotik, İngilizce, Türk Dili ve Edebiyatı, Görsel Sanatlar, Müzik ve Proje atölyeleri var. Her sınıfta akıllı tahta ve sıralar. Yeni görev: "BİLSEM\'i gez", sekiz atölyedeki halkalardan geç, rekorunu kır!',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/', '/dron/']
    },
    {
      id: 'hastane-ic', tarih: '2026-11-15',
      baslik: 'Hastanenin içinde uç: acil ilaç görevi',
      metin: 'Şehirdeki hastane artık içine girilebilen gerçek bir bina: turuncu çerçeveli açık pencerelerden ya da kapıdan gir, koridorda oda numaralarını oku, merdiven boşluğundan kat değiştir. Görev: asansör bozuk, 208 numaralı odaya ilaç götür. Dikkat: kapalı pencerelerde cam var!',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/', '/dron/']
    },
    {
      id: 'sehir-gorevleri', tarih: '2026-11-15',
      baslik: 'Şehirde iki yeni görev',
      metin: 'Şehir yarışı: 14 kapılı parkurda caddelerden kavşaklarda dönerek gökdelenlerin arasından geç, 3 rakiple yarış. Şehirde gece araması: Pamuk bu kez şehir merkezinde, 336 farklı yerden birinde saklanıyor; ara sokaklar, park, çatılar, araba altları.',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/', '/dron/']
    },
    {
      id: 'sehir-merkezi', tarih: '2026-11-15', oneri: true,
      baslik: 'Simülatöre şehir merkezi ve yeni arabalar',
      metin: 'Okulun kuzeyinde artık bir şehir var: gökdelenler, renkli apartmanlar, dar ara sokaklar, tabelalı dükkânlar, Gençlik Parkı, fıskiyeli meydan, çatısında helikopter pisti olan hastane ve televizyon kulesi. Caddelerde arabalar akıyor; okulun önündeki arabalar da yenilendi. Gece pencereler ve tabelalar yanıyor. Kaybolmadan dönebilecek misin?',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/', '/dron/']
    },
    {
      id: 'yaris-rakipler', tarih: '2026-11-15',
      baslik: 'FPV yarış pistinde 3 rakip dron',
      metin: 'Pistte artık yalnız değilsin: Çaylak #12, Kaptan #7 ve Usta #1 seninle aynı anda kalkıyor. Virajda ne kadar yattıklarına bak: hız arttıkça yatış açısı da artar (tan φ = v·ω/g). Sonuçta kaçıncı olduğunu görürsün.',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/', '/dron/']
    },
    {
      id: 'dron-gorunum', tarih: '2026-11-15',
      baslik: 'Dronunu boya: yeni Görünüm bölümü ve Gezgin dronu',
      metin: 'Laboratuvarda gövde stili (açık karbon ya da kabuklu), kol düzeni (X, uzun X, ölü kedi), gövde, vurgu, LED ve pervane renkleri ve yarış numarası seçebilirsin; dronun simülatörde de böyle uçar. Görünüm fiziği değiştirmez. Yeni şablon: katlanır kollu, kameralı Gezgin.',
      adres: '/dron-lab/', sayfalar: ['/dron-lab/', '/dron-ucus/', '/dron/']
    },
    {
      id: 'fener-gimbal', tarih: '2026-11-15',
      baslik: 'Gece uçuşlarında yönlendirilebilir arama feneri',
      metin: 'Fener artık bir gimbalda: Q/E ile sağa-sola, Z/X ile aşağı-yukarı çevir; N ile demeti daralt (uzağa vurur), M ile genişlet, B ile odakla. Dokunmatikte sağdaki FENER paneli var. Dar demet daha parlaktır: I = Φ/Ω. Termal kamera artık G tuşunda.',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/']
    },
    {
      id: 'dron-sinir-adil-rekor', tarih: '2026-11-15', oneri: true,
      baslik: 'Simülatörde harita sınırı ve adil rekorlar',
      metin: 'Haritanın ucunda görünen o korkunç siyah boşluk gitti: gökyüzü artık her yerde, dronu da gerçek dronlardaki gibi bir coğrafi sınır (geofence) durduruyor. Konsoldan kod yazarak hızı değiştirmek artık işe yaramıyor; fizik dışı bir hareket olursa o uçuşun rekoru sayılmıyor.',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/']
    },
    {
      id: 'kasif-defteri-b1', tarih: '2026-11-15',
      baslik: 'Kâşif Defteri: Pamuk\'un yolculuğu',
      metin: 'Sitenin bölümlerini birbirine bağlayan hazine avı: Şifre Dairesi\'nde notu çöz, dronla Pamuk\'u bul, kargo dronu tasarla, veterinere taşı, Gizli Kod\'u kır. Tek başına ya da takımla; en hızlılar Kâşifler Duvarı\'na.',
      adres: '/kasif/', sayfalar: ['/kriptoloji/', '/dron-ucus/', '/dron-lab/', '/dron/', '/zeka-oyunlari/']
    },
    {
      id: 'kargo-van-kedisi', tarih: '2026-11-15', oneri: true,
      baslik: 'Kargo dronu görevi ve Van kedisi Pamuk',
      metin: 'Yeni görev: ilaç paketini, kitap kolisini ve taşıma kutusundaki Pamuk\'u yerlerine götür; her yük dronu ağırlaştırır. Pamuk artık bacaklı, kızıl kuyruklu, bir gözü mavi bir gözü kehribar bir Van kedisi.',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/', '/dron/']
    },
    {
      id: 'pamuk-2', tarih: '2026-11-15', oneri: true,
      baslik: 'Pamuk artık her yere saklanıyor',
      metin: 'Gece arama-kurtarmada kedi 185 farklı yerden birine saklanıyor: araba altı, ağaç dalı, apartman çatısı… Gürültüden ürküp kaçabiliyor. Komşu ihbarı çemberi, termal kamera (G tuşu), 4 seviye, Günün Kedisi ve rekorlar eklendi.',
      adres: '/dron-ucus/', sayfalar: ['/dron-ucus/', '/dron/']
    },
    {
      id: 'dusme-testi', tarih: '2026-11-15', oneri: true,
      baslik: 'Laboratuvarda düşme ve arıza testi',
      metin: 'Tasarımını uçurmadan önce düşür: batarya biterse, bir motor arızalanırsa ya da sert inersen çarpma hızı, enerjisi ve hasar tahmini. 4 motorlu ile 6 motorlu dronun farkını gör.',
      adres: '/dron-lab/', sayfalar: ['/dron-lab/']
    },
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
    '.yn-canli{position:relative}' +
    '.yn-imlec{display:inline-block;width:3px;height:1.05em;margin-left:.3em;vertical-align:-.15em;background:var(--kirmizi,#c0392b);border-radius:1px;animation:ynImlec 1s steps(1,end) infinite}' +
    '@keyframes ynImlec{50%{opacity:0}}' +
    '.yn-canli .yn-sayi{animation:ynNabiz 1.6s ease-out infinite}' +
    '@keyframes ynNabiz{0%{box-shadow:0 0 0 0 rgba(200,50,59,.65)}70%{box-shadow:0 0 0 9px rgba(200,50,59,0)}100%{box-shadow:0 0 0 0 rgba(200,50,59,0)}}' +
    '@media (prefers-reduced-motion:reduce){.yn-imlec,.yn-canli .yn-sayi{animation:none}}' +
    '.yn-sayi{display:inline-block;min-width:1.2em;margin-left:.35em;padding:0 .3em;border-radius:1em;background:var(--kirmizi,#c0392b);color:#fff;font:700 .7rem/1.45 var(--mono,monospace);text-align:center;vertical-align:.15em}' +
    '.yn-not{position:fixed;z-index:9999;right:16px;bottom:16px;max-width:min(360px,calc(100vw - 32px));padding:.8rem 2.6rem .85rem 1rem;background:var(--kagit,#f5f7fa);color:var(--metin,#1d2733);border:2px solid var(--murekkep,#1f3a8a);border-radius:6px;font:15px/1.45 var(--yazi,system-ui,sans-serif);transform:translateY(12px);opacity:0;transition:transform .35s ease-out,opacity .35s ease-out}' +
    '.yn-not.acik{transform:none;opacity:1}' +
    '.yn-not b{display:block;margin-bottom:.15rem;font-family:var(--serif,serif);font-size:1.02rem}' +
    '.yn-not .yn-ust{margin-bottom:.25rem}' +
    '.yn-not a{color:var(--murekkep,#1f3a8a);font-weight:600}' +
    '.yn-kapat{position:absolute;top:2px;right:2px;width:44px;height:44px;border:0;background:none;color:inherit;font-size:1.3rem;cursor:pointer}' +
    '@media (prefers-reduced-motion:reduce){.yn-not{transition:none}}' +
    /* telefon yan tutulunca (ör. simülatörde kollar varken) not ekranın üst ortasında küçük bir şerit olur */
    '@media (orientation:landscape) and (max-height:560px){.yn-not{left:50%;right:auto;top:calc(6px + env(safe-area-inset-top,0px));bottom:auto;max-width:min(420px,calc(100vw - 360px));padding:.4rem 2.4rem .45rem .75rem;font-size:12.5px;transform:translate(-50%,-10px)}.yn-not.acik{transform:translate(-50%,0)}.yn-not .yn-govde,.yn-not .yn-ust{display:none}.yn-not b{display:inline;font-size:.95rem;margin-right:.4em}.yn-kapat{width:36px;height:36px}}' +
    /* Yenilikler sekmesi: diğer sekmelerden ayrışan renk; yeni güncelleme varken yanıp söner */
    '.yn-sekme{background:linear-gradient(135deg,#d6303f,#f08a24)!important;color:#fff!important;font-weight:700!important;text-decoration:none!important;box-shadow:0 1px 4px rgba(214,48,63,.35)}' +
    '.yn-sekme:hover,.yn-sekme:focus-visible{filter:brightness(1.08);color:#fff!important}' +
    '.yn-sekme .yn-sayi{background:#fff;color:#c0392b}' +
    '.yn-sekme .yn-imlec{background:#fff}' +
    '.yn-sekme.yn-yanip{animation:ynSekme 1.1s ease-in-out infinite}' +
    '@keyframes ynSekme{0%,100%{box-shadow:0 0 0 0 rgba(240,138,36,.0);filter:none}50%{box-shadow:0 0 0 6px rgba(240,138,36,.45);filter:brightness(1.25)}}' +
    '.yn-nokta{position:absolute;top:4px;right:4px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#d6303f;color:#fff;font:700 10px/16px var(--mono,monospace);text-align:center;box-shadow:0 0 0 2px var(--kagit,#fff)}' +
    '.yn-yanip .yn-nokta,.yn-nokta.yn-yanip{animation:ynImlec 1s steps(1,end) infinite}' +
    '@media (prefers-reduced-motion:reduce){.yn-sekme.yn-yanip,.yn-nokta.yn-yanip{animation:none}}';
  function stilEkle() { if (document.getElementById('ynStil')) return; var s = el('style'); s.id = 'ynStil'; s.textContent = STIL; document.head.appendChild(s); }

  var yol = location.pathname.replace(/index\.html$/, '');
  var g = gorulenler();

  /* Yanıp sönme kuralı: yeni bir güncelleme yayımlanınca ziyaretçi sitesine her GELİŞİNDE (oturum başına bir kez
     sayılır) sekme yanıp söner. Ya Yenilikler sayfasını açınca ya da YANIP_ZIYARET kez geldikten sonra yanıp sönme
     durur; sekme yine renkli kalır ve "yeni" sayısını gösterir. Böylece haber kaçmaz ama sürekli göz de yormaz.
     Sayaç her yeni güncellemede sıfırlanır. Her şey ziyaretçinin kendi tarayıcısında tutulur. */
  var YANIP_ZIYARET = 5, ZANAHTAR = 'me.yenilik.ziyaret';
  var enYeni = (YENILIKLER.filter(function (y) { return yeniMi(y, g); })[0] || {}).id;
  var ziyaret = (function () {
    var z; try { z = JSON.parse(localStorage.getItem(ZANAHTAR)) || {}; } catch (e) { z = {}; }
    if (!enYeni) return z;
    if (z.son !== enYeni) { z = { son: enYeni, n: 0 }; }
    var yeniOturum = true; try { yeniOturum = !sessionStorage.getItem(ZANAHTAR); sessionStorage.setItem(ZANAHTAR, '1'); } catch (e) { /* */ }
    if (yeniOturum) z.n = (z.n || 0) + 1;
    try { localStorage.setItem(ZANAHTAR, JSON.stringify(z)); } catch (e) { /* */ }
    return z;
  })();
  var yanip = !!enYeni && (ziyaret.n || 0) <= YANIP_ZIYARET;

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
    if (kisa) { var u2 = el('ul', 'yn-liste'); var sonGun = YENILIKLER.filter(function (y) { return y.tarih === YENILIKLER[0].tarih; });   // en son günün hepsi, en az 3 duyuru
      (sonGun.length >= 3 ? sonGun : YENILIKLER.slice(0, 3)).forEach(function (y) { u2.appendChild(maddeYap(y, yeniMi(y, g))); }); kisa.appendChild(u2); }
    document.querySelectorAll('[data-yenilik-sayi]').forEach(function (a) {
      a.classList.add('yn-sekme');                        // her zaman ayrışan renk
      if (!yeniSayi) return;
      var s = el('span', 'yn-sayi', String(yeniSayi)); s.setAttribute('aria-label', yeniSayi + ' yeni'); a.appendChild(s);
      a.title = yeniSayi + ' yeni güncelleme var';
      if (yanip) {                                       // ilk ziyaretlerde yanıp söner, imleç atar
        var i = el('span', 'yn-imlec'); i.setAttribute('aria-hidden', 'true'); a.appendChild(i);
        a.classList.add('yn-canli', 'yn-yanip');
      }
    });
    // telefonda menü kapalıyken sekme görünmez: "Menü" düğmesine de sayı rozeti
    var mb = document.querySelector('.mc-menu');
    if (yeniSayi && mb && !mb.querySelector('.yn-nokta')) {
      if (getComputedStyle(mb).position === 'static') mb.style.position = 'relative';
      var n = el('span', 'yn-nokta' + (yanip ? ' yn-yanip' : ''), String(yeniSayi)); n.setAttribute('aria-label', yeniSayi + ' yeni güncelleme'); mb.appendChild(n);
    }
    // ana sayfadaki "Son yenilikler" başlığına da aynı imleç
    var bas = document.getElementById('yenilikBaslik');
    if (yeniSayi && yanip && bas && !bas.querySelector('.yn-imlec')) { var i2 = el('span', 'yn-imlec'); i2.setAttribute('aria-hidden', 'true'); bas.appendChild(i2); }
    return;
  }

  // 3) Diğer sayfalar: bu sayfayla ilgili görülmemiş en yeni duyuru için tek seferlik not
  var ilgili = YENILIKLER.filter(function (y) {
    return yeniMi(y, g) && (y.sayfalar || []).some(function (s) { return yol.indexOf(s) === 0; });
  })[0];
  if (!ilgili) return;
  stilEkle();
  var alcak = matchMedia('(orientation:landscape) and (max-height:560px)').matches;   // telefon yan: kısa not
  var not = el('aside', 'yn-not'); not.setAttribute('role', 'status'); not.setAttribute('aria-label', 'Yenilik');
  var ust = el('p', 'yn-ust'); ust.appendChild(el('span', 'yn-yeni', 'yeni'));
  if (ilgili.oneri) ust.appendChild(el('span', 'yn-oneri', 'Öğrenci önerisiyle'));
  not.appendChild(ust);
  not.appendChild(el('b', null, ilgili.baslik));
  not.appendChild(el('span', 'yn-govde', ilgili.metin + ' '));
  var tum = el('a', null, 'Bütün yenilikler →'); tum.href = '/yenilikler/'; not.appendChild(tum);
  var kapat = el('button', 'yn-kapat', '×'); kapat.type = 'button'; kapat.setAttribute('aria-label', 'Notu kapat');
  function kapa() { not.classList.remove('acik'); setTimeout(function () { not.remove(); }, 400); }
  kapat.addEventListener('click', kapa);
  not.appendChild(kapat);
  document.body.appendChild(not);
  requestAnimationFrame(function () { requestAnimationFrame(function () { not.classList.add('acik'); }); });
  gorulduYap([ilgili.id]);         // bir kez gösterilir; tekrar açılınca çıkmaz
  setTimeout(kapa, alcak ? 7000 : 15000);
})();
