/* =====================================================================
   KÂŞİF DEFTERİ — ortak/kasif.js
   Sitenin bölümlerini birbirine bağlayan hazine avı. Her sayfaya
   ortak/gorus-baglanti.js üzerinden yüklenir; kendi başına hiçbir şey göndermez.

   Benzetme: bir pul defteri. Her bölümde (Şifre Dairesi, Dron Uçuş, Dron Lab,
   Zekâ Oyunları) bir görevi bitirince o bölümün pulu (parola + kasa rakamı)
   defterine yapışır. Beş pul tamamlanınca defterin son sayfasındaki kasa açılır.

   Sayfalar olay yayar, bu betik dinler:
     kasif-olay {olay:'kurtarma-bulundu'}  → dron-ucus/kurtarma.js
     kasif-olay {olay:'tasima-pamuk'}      → dron-ucus/tasima.js
     kasif-olay {olay:'gizlikod-cozuldu', tahmin} → zeka-oyunlari/salon/oyunlar/gizli-kod.js
     tasarim-degisti {tasarim, s}          → dron-lab/app.js
   Defterin durumu yalnız bu tarayıcıda (localStorage) tutulur.

   Modlar: bireysel · takım kaptanı · takım üyesi.
     Bireysel: bütün pulları kendisi kazanır (yalnız ilk parolayı defterde çözer).
     Kaptan  : süreyi tutan cihaz. Takım arkadaşlarının söylediği parolaları da yazabilir.
     Üye     : görevleri kendi cihazında yapar, kazandığı parolayı kaptana söyler.
   ===================================================================== */
(function () {
  'use strict';
  if (window.KASIF) return;
  var ANAHTAR = 'me.kasif.b1', BOLUM = 'b1';
  var c = function (a) { return String.fromCharCode.apply(null, a.map(function (x) { return x - 7; })); };   // cevaplar kodda düz yazılmasın

  var ISTASYON = [
    { id: 's1', no: 1, ad: 'Şifreli not', yer: 'Şifre Dairesi', adres: '/kriptoloji/sezar/', ikon: '🔐',
      gorev: 'Pamuk\'un sahibinin bıraktığı notu Sezar Çarkı\'yla çöz. Notun sonundaki parolayı deftere yaz.',
      ipucu: 'Anahtar: sekiz motorlu bir dronun motor sayısı. Sezar Çarkı\'nda "çöz" yönünü seç.',
      kelime: c([93, 72, 85]), rakam: c([59]), elle: true },
    { id: 's2', no: 2, ad: 'Gece araması', yer: 'Dron Uçuş Simülatörü', adres: '/dron-ucus/', ikon: '🔦',
      gorev: 'Gece arama-kurtarma görevinde Pamuk\'u bul (herhangi bir seviye). Tasmasındaki parola deftere işlenir.',
      ipucu: 'Önce yüksekten geniş tara, ışıkta bir şey görünce alçal. Gürültün kediyi ürkütebilir.',
      kelime: c([77, 76, 85, 76, 89]), rakam: c([62]) },
    { id: 's3', no: 3, ad: 'Kargo dronu tasarla', yer: 'Dron Tasarım Laboratuvarı', adres: '/dron-lab/', ikon: '🛠️',
      gorev: 'Pamuk taşıma kutusuyla 3 kg. Laboratuvarda ek yükü en az 3000 g olan, itki/ağırlığı en az 1,8 ve uçuş süresi en az 5 dakika olan bir dron tasarla.',
      ipucu: '"Yük taşıyıcı 10 inç" şablonundan başla. Motor KV\'si, batarya kapasitesi ve pervane çapıyla oyna; her değişiklik başka bir şeyi bozar.',
      kelime: c([82, 72, 85, 72, 91]), rakam: c([57]) },
    { id: 's4', no: 4, ad: 'Veterinere götür', yer: 'Dron Uçuş Simülatörü', adres: '/dron-ucus/', ikon: '🚁',
      gorev: '"Kargo dronu: taşıma turu" görevinde Pamuk\'u taşıma kutusunda veteriner kliniğine götür.',
      ipucu: 'Küçük dronlar Pamuk\'u kaldıramaz. Yük taşıyıcı dronu ya da laboratuvardaki kendi tasarımını kullan.',
      kelime: c([357, 311, 77, 72]), rakam: c([64]) },
    { id: 's5', no: 5, ad: 'Veterinerin şifresi', yer: 'Zekâ Oyunları · Gizli Kod', adres: '/zeka-oyunlari/salon/#gizlikod', ikon: '🎯',
      gorev: 'Veteriner, Pamuk\'un aşı kartını renk şifreli bir dolapta tutuyor. Oyun Salonu\'nda Gizli Kod\'u en fazla 7 tahminde çöz.',
      ipucu: 'Her tahminden sonra kalan olasılık sayısına bak: iyi bir tahmin onu en çok küçültendir.',
      kelime: c([84, 72, 85, 91, 80, 82]), rakam: c([60]) },
  ];
  var SIFRELI_NOT = 'YĞTÇS SĞFHÜŞJÇ. MKIK LKUKZŞK ĞZĞ. YĞZÜŞĞ: EĞU';
  var LAB_SART = { ekYuk: 3000, twr: 1.8, dk: 5 };

  function oku() { try { return JSON.parse(localStorage.getItem(ANAHTAR)); } catch (e) { return null; } }
  function yaz(st) { try { localStorage.setItem(ANAHTAR, JSON.stringify(st)); } catch (e) { /* gizli sekme */ } document.dispatchEvent(new CustomEvent('kasif-degisti')); }
  var buyuk = function (s) { return String(s || '').replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase().replace(/[^A-ZÇĞİÖŞÜ]/g, ''); };
  function kacTane(st) { return st ? ISTASYON.filter(function (i) { return st.parcalar[i.id]; }).length : 0; }

  function basla(mod, ad, takim, uyeler) {
    var st = { bolum: BOLUM, mod: mod, ad: ad || '', takim: takim || '', uyeler: uyeler || [], basla: Date.now(), parcalar: {}, bitti: null, gonderildi: false };
    yaz(st); return st;
  }
  function parcaVer(id, kaynak) {
    var st = oku(); if (!st || st.bitti || st.parcalar[id]) return false;
    st.parcalar[id] = { t: Date.now(), kaynak: kaynak }; yaz(st);
    var i = ISTASYON.filter(function (x) { return x.id === id; })[0];
    bildir(i, st);
    return true;
  }
  // Defterde parola yazılınca: hangi istasyonun parolası? Bireyselde yalnız elle çözülen istasyon kabul edilir.
  function kelimeDene(k) {
    var st = oku(); if (!st) return { durum: 'yok' };
    var b = buyuk(k), i = ISTASYON.filter(function (x) { return buyuk(x.kelime) === b; })[0];
    if (!i) return { durum: 'yanlis' };
    if (st.parcalar[i.id]) return { durum: 'zaten', ist: i };
    if (st.mod === 'bireysel' && !i.elle) return { durum: 'kendin', ist: i };
    st.parcalar[i.id] = { t: Date.now(), kaynak: i.elle ? 'cozdu' : 'takim' }; yaz(st);
    return { durum: 'tamam', ist: i };
  }
  function kasaDene(kod) {
    var st = oku(); if (!st || st.mod === 'uye' || kacTane(st) < ISTASYON.length) return false;
    var dogru = ISTASYON.map(function (i) { return i.rakam; }).join('');
    if (String(kod).replace(/\D/g, '') !== dogru) return false;
    st.bitti = Date.now(); yaz(st); return true;
  }

  /* ---------- istasyon dinleyicileri ---------- */
  addEventListener('kasif-olay', function (e) {
    var d = e.detail || {};
    if (d.olay === 'kurtarma-bulundu') parcaVer('s2', 'kurtarma-' + (d.seviye || ''));
    if (d.olay === 'tasima-pamuk') parcaVer('s4', 'tasima');
    if (d.olay === 'gizlikod-cozuldu' && d.tahmin <= 7) parcaVer('s5', 'gizlikod-' + d.tahmin);
    if (d.olay === 'gizlikod-cozuldu' && d.tahmin > 7) { var st = oku(); if (st && !st.parcalar.s5 && !st.bitti) bildirMetin('Gizli Kod çözüldü ama ' + d.tahmin + ' tahminde. Kâşif Defteri için en fazla 7 tahmin gerek: bir daha dene!'); }
  });
  addEventListener('tasarim-degisti', function (e) { labKontrol(e.detail); });
  function labKontrol(d) {
    var st = oku(); if (!d || !st || st.bitti || st.parcalar.s3) { labKutu(null); return; }
    var t = d.tasarim, s = d.s;
    var sart = [
      ['Ek yük en az ' + LAB_SART.ekYuk + ' g', +t.ekYukG >= LAB_SART.ekYuk, Math.round(+t.ekYukG) + ' g'],
      ['İtki/ağırlık en az 1,8', s.ucabilir && s.TWR >= LAB_SART.twr, s.TWR.toFixed(2).replace('.', ',')],
      ['Uçuş süresi en az 5 dk', s.ucabilir && s.ucusDk >= LAB_SART.dk, s.ucusDk.toFixed(1).replace('.', ',') + ' dk'],
    ];
    labKutu(sart);
    if (sart.every(function (x) { return x[1]; })) parcaVer('s3', 'lab');
  }

  /* ---------- görünüm: yüzen defter düğmesi, bildirim, laboratuvar kontrol listesi ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.kasif-dugme{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));z-index:60;display:inline-flex;align-items:center;gap:.45rem;padding:.55rem .8rem;border-radius:10px;border:2px solid var(--murekkep,#1d3b8b);background:var(--kagit,#f5f7fa);color:var(--murekkep,#1d3b8b);font:700 .9rem/1.2 var(--yazi,system-ui);text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.18)}',
    '.kasif-dugme b{font-variant-numeric:tabular-nums}',
    'body:has(#hud:not([hidden])) .kasif-dugme,body:has(#kasifSayfa) .kasif-dugme{display:none}',
    '.kasif-not{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:70;width:min(460px,calc(100% - 24px));padding:14px 16px;border-radius:12px;background:#10202a;color:#fff;border:2px solid #ffd23f;box-shadow:0 10px 30px rgba(0,0,0,.35);font:15px/1.45 var(--yazi,system-ui)}',
    '.kasif-not .k-ust{font:700 .72rem/1 var(--mono,monospace);letter-spacing:.12em;color:#ffd23f;text-transform:uppercase}',
    '.kasif-not .k-parca{display:flex;gap:10px;align-items:baseline;margin:.45rem 0 .2rem;font-size:1.35rem;font-weight:800;letter-spacing:.06em}',
    '.kasif-not .k-parca span{font-size:.9rem;font-weight:600;letter-spacing:0;color:#cfe0ee}',
    '.kasif-not a{color:#ffd23f;font-weight:700}',
    '.kasif-not button{position:absolute;right:8px;top:6px;background:none;border:0;color:#fff;font-size:20px;cursor:pointer}',
    '.kasif-lab{margin:.6rem 0 1rem;padding:.7rem .9rem;border:2px dashed var(--accent,#1d3b8b);border-radius:10px;font-size:.92rem}',
    '.kasif-lab ul{margin:.35rem 0 0;padding:0;list-style:none;display:grid;gap:.2rem}',
    '.kasif-lab li::before{content:"○ ";font-weight:800}.kasif-lab li.ok::before{content:"✓ ";color:var(--ok,#1f8a5b)}',
  ].join('\n');
  document.head.appendChild(css);

  function dugme() {
    var st = oku(), a = document.querySelector('.kasif-dugme');
    if (!st || /^\/kasif\//.test(location.pathname)) { if (a) a.remove(); return; }
    if (!a) { a = document.createElement('a'); a.className = 'kasif-dugme'; a.href = '/kasif/'; document.body.appendChild(a); }
    a.innerHTML = '📓 Kâşif Defteri <b>' + (st.bitti ? 'tamam' : kacTane(st) + '/' + ISTASYON.length) + '</b>';
    a.setAttribute('aria-label', 'Kâşif Defteri: ' + kacTane(st) + ' parça bulundu');
  }
  var notZaman = null;
  function bildirMetin(html) {
    var n = document.querySelector('.kasif-not'); if (n) n.remove();
    n = document.createElement('div'); n.className = 'kasif-not'; n.setAttribute('role', 'status');
    n.innerHTML = html + '<button type="button" aria-label="Kapat">×</button>';
    n.querySelector('button').onclick = function () { n.remove(); };
    document.body.appendChild(n); clearTimeout(notZaman); notZaman = setTimeout(function () { n.remove(); }, 12000);
  }
  function bildir(i, st) {
    var takim = st.mod !== 'bireysel';
    bildirMetin('<div class="k-ust">Kâşif Defteri · ' + kacTane(st) + '/' + ISTASYON.length + ' parça</div>' +
      '<div class="k-parca">' + i.ikon + ' ' + i.kelime + ' <span>kasa rakamı: ' + i.rakam + '</span></div>' +
      '<div>' + i.ad + ' tamam! Parola ve rakam defterine işlendi.' + (st.mod === 'uye' ? ' <b>Parolayı takım kaptanına söyle.</b>' : '') +
      (takim && st.mod === 'kaptan' ? '' : '') + ' <a href="/kasif/">Deftere git →</a></div>');
  }
  function labKutu(sart) {
    if (!/^\/dron-lab\//.test(location.pathname)) return;
    var k = document.getElementById('kasifLab');
    if (!sart) { if (k) k.remove(); return; }
    if (!k) {
      k = document.createElement('section'); k.id = 'kasifLab'; k.className = 'kart kasif-lab';
      var yer = document.getElementById('degBaslik'); yer = yer && yer.closest('section');
      if (yer) yer.before(k); else return;
    }
    k.innerHTML = '<b>📓 Kâşif görevi: Pamuk\'u taşıyacak kargo dronu</b><ul>' +
      sart.map(function (x) { return '<li class="' + (x[1] ? 'ok' : '') + '">' + x[0] + ' · şu an <b>' + x[2] + '</b></li>'; }).join('') + '</ul>';
  }

  document.addEventListener('kasif-degisti', dugme);
  function ilk() { dugme(); if (window.sonTasarim) labKontrol(window.sonTasarim); }   // laboratuvar ilk hesabı bu betikten önce yapmış olabilir
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ilk); else ilk();
  document.addEventListener('kasif-degisti', function () { if (window.sonTasarim) labKontrol(window.sonTasarim); });
  addEventListener('storage', function (e) { if (e.key === ANAHTAR) dugme(); });

  window.KASIF = { BOLUM: BOLUM, ISTASYON: ISTASYON, SIFRELI_NOT: SIFRELI_NOT, LAB_SART: LAB_SART, oku: oku, yaz: yaz, basla: basla, kelimeDene: kelimeDene, kasaDene: kasaDene, kacTane: kacTane,
    sifirla: function () { try { localStorage.removeItem(ANAHTAR); } catch (e) {} document.dispatchEvent(new CustomEvent('kasif-degisti')); } };
})();
