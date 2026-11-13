/* =====================================================================
   SİTE MÜZİĞİ — muzik/muzik.js
   Her temanın kayıtlı bir müzik döngüsü vardır (muzik/<tema>.mp3, ~45 sn, ölçü çizgisinden kesilip başı sonuna
   karıştırılmış: döngü dikişsiz). Dosya yalnız ziyaretçi müziği açınca indirilir. İnemezse (bağlantı yok, başka
   alan adından yüklenmiş sayfa vb.) eski yol devreye girer: her nota Web Audio ile o an sentezlenir.
   Müzikler (Pixabay, Pixabay İçerik Lisansı):
     uzay        "Piano Background" — atlasaudio
     muhendislik "Technology" — nastelbom
     odak        "Study Lofi Music" — Alex Morgan

   Kullanım (sayfanın <head> kısmına):
     <script src="/muzik/muzik.js" data-tema="uzay" defer></script>
   Temalar:
     uzay        Ana sayfa. Belgesel / uzay bilim kurgusu: geniş akorlar, dip sesi, yıldız çanları, ostinato, kalp atışı, kabarma.
     muhendislik Dron ve PID sayfaları. "Uçuş": nabız gibi atan bas, yumuşak davul, arpej, rüzgâr süpürmesi, radar sinyali.
     odak        Zekâ Oyunları ve Teşhis Defteri. Sakin lo-fi çalışma müziği: elektrik piyano, yumuşak bas, fırça davul, plak cızırtısı.
     dedektif    Şifre Dairesi (kriptoloji). Özgün, sinsi bir casus cazı: parmak şıklatma, adım adım yürüyen kontrbas,
                 fırçalı davul, boğuk saksofon ve vibrafon. Dosyası yok: her nota tarayıcıda üretilir (internetsiz de çalar).
                 Odak gibi yalnız düğmeyle açılır ya da önceki sayfada çalıyorsa sürer.
                 Zekâ Oyunları'nda yalnız önceki sayfada müzik çalıyorsa sürer; Teşhis'te yalnız düğmeyle açılır.

   Düğme: sayfada id="muzikDugme" varsa o kullanılır; yoksa sol altta küçük bir düğme eklenir.

   NEDEN İLK DOKUNUŞU BEKLİYOR? Bütün tarayıcılar (WhatsApp'ın içindeki tarayıcı dahil) bir sayfanın
   ziyaretçi dokunmadan ses çalmasını engeller. Telefonda yalnızca gerçek bir "dokunup bırakma"
   (touchend / click) ya da tuş basımı sayılır; ekrana ilk değme anı (pointerdown) sayılmaz.
   Bu yüzden müzik açıksa ziyaretçinin ilk dokunuşunda yavaşça yükselerek başlar ve
   sayfa açılınca kısa bir "Müziği aç" daveti görünür. İlk ziyarette ses asla kendiliğinden başlamaz (WCAG 1.4.2).

   SAYFA GEÇİŞİ: Bağlantıya tıklanınca ses 0,6 sn'de kısılır, gezinme o kadar bekletilir. "Çalıyordu" bilgisi ve her
   parçanın (uzay, muhendislik, odak) ayrı ayrı kaldığı yer sessionStorage'a yazılır. Yeni sayfada parça bu sekmede
   daha önce çaldıysa kendi kaldığı yerden, ilk kez çalıyorsa baştan başlar; ikisi de 2,5 sn'lik yavaş yükselişle.
   Süreler dosyanın başındaki SURE sabitinde.
   Chrome bunu dokunmadan yapar; Safari ilk dokunuşu bekler ("Müziği sürdürmek için dokun").
   Ziyaretçi düğmeyle kapattıysa (localStorage 'site-muzik' = '0') hiçbir sayfada kendiliğinden açılmaz.
   ===================================================================== */
(function () {
  'use strict';
  if (window.SiteMuzik) return;
  var betik = document.currentScript;
  var TEMA = (betik && betik.dataset.tema) || 'uzay';
  // Tek tercih: '0' = ziyaretçi kapattı (her sayfada ve sonraki ziyaretlerde kapalı), '1' = düğmeyle açtı.
  var KEY = 'site-muzik';
  try {                                                             // eski ayrı odak tercihini bir kez taşı
    var eskiOdak = localStorage.getItem('site-muzik-odak');
    if (eskiOdak !== null) { if (eskiOdak === '1' && localStorage.getItem(KEY) === null) localStorage.setItem(KEY, '1'); localStorage.removeItem('site-muzik-odak'); }
  } catch (e) { /* depo yok */ }
  // uzay ve mühendislik: ilk ziyarette davet + ilk dokunuşta başlar. odak (Zekâ Oyunları): yalnız önceki sayfada çalıyorsa sürer.
  var VARSAYILAN_ACIK = TEMA !== 'odak' && TEMA !== 'dedektif';
  // Teşhis Defteri: müzik yalnız düğmeyle açılır; önceki sayfadan sürmez, davet çıkmaz (öğrenci ders çalışırken).
  var YALNIZ_DUGME = /\/teshis(\/|$)/.test(location.pathname);
  /* ---------------- SABİTLER: süreler (saniye) ve sayfa geçişi ----------------
     acilis  : ilk açılış (davet ya da düğme)
     gecis   : yeni sayfada açılış; aynı parça kaldığı yerden, farklı parça baştan, ikisi de bu yavaş yükselişle
     kapanis : düğmeyle kapatma
     cikis   : bağlantıya tıklanınca kısılma; gezinme bu süre kadar bekletilir */
  var SURE = { acilis: 1.2, gecis: 2.5, kapanis: 0.6, cikis: 0.6 };
  // sessionStorage: "çalıyordu" bilgisi + her parçanın ayrı ayrı kaldığı yer (uzay, muhendislik, odak)
  var OTURUM = 'site-muzik-oturum';
  var TAZE_MS = 30000;                                             // 30 sn'den eski "çalıyordu" bilgisi "önceki sayfa" sayılmaz
  var GERI_MS = 1500;                                              // gezinme gerçekleşmezse ses bu kadar sonra geri gelir

  var ac = null, out = null, rev = null, dlyL = null, timer = null, running = false, yukleniyor = false, nbuf = null;
  /* ---------------- kayıtlı müzik döngüsü (dosya) ---------------- */
  // Düzeyler ölçümle eşitlendi: her döngünün RMS'i (uzay 0,1014 · mühendislik 0,1118 · odak 0,1013) × düzey = 0,0411 (−27,7 dBFS)
  var DOSYA_SEVIYE = { uzay: 0.406, muhendislik: 0.368, odak: 0.406 };
  var DOSYASIZ = { dedektif: 1 };                                    // bu temaların kayıtlı dosyası yok: doğrudan sentez (boşuna istek yok)
  var dosyaUrl = null; try { if (!DOSYASIZ[TEMA]) dosyaUrl = new URL(TEMA + '.mp3', (betik && betik.src) || location.href).href; } catch (e) { dosyaUrl = null; }
  var dosyaTampon = null, dosyaSinir = null, dosyaSozu = null, dosyaKaynak = null, dosyaKazanc = null, dosyaBas = null;
  var mod = null;                                                    // 'dosya' | 'sentez'
  // Dosya bir kez indirilip çözülür. Süre sınırı yok: yavaş bağlantıda inen veri boşa gitmesin.
  // Yalnız gerçek hata (ağ yok, dosya yok, çözülemedi) olursa null döner ve sentez yedeği çalar.
  function dosyaHazirla() {
    if (dosyaTampon) return Promise.resolve(dosyaTampon);
    if (dosyaSozu) return dosyaSozu;
    if (!dosyaUrl || !window.fetch || !ac) return Promise.resolve(null);
    dosyaSozu = fetch(dosyaUrl).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (b) { return new Promise(function (ok, no) { var s = ac.decodeAudioData(b, ok, no); if (s && s.catch) s.catch(no); }); })
      .then(function (t) { dosyaTampon = t; dosyaSinir = donguSiniri(t); return t; })
      .catch(function () { dosyaSozu = null; return null; });
    return dosyaSozu;
  }
  // MP3 kodlayıcısının baştaki/sondaki sessiz dolgusunu döngüden çıkar (yoksa her turda küçük bir boşluk duyulur)
  function donguSiniri(t) {
    var d = t.getChannelData(0), n = d.length, max = Math.min(n, Math.floor(t.sampleRate * 0.15)), bas = 0, son = n - 1;
    while (bas < max && Math.abs(d[bas]) < 1e-4) bas++;
    while (son > n - max && Math.abs(d[son]) < 1e-4) son--;
    return [bas / t.sampleRate, (son + 1) / t.sampleRate];
  }
  // kazancı şu anki değerinden hedefe doğrusal götür
  // Kazancı şu anki değerinden hedefe eğriyle götür. Yükselişte v = a + (b − a)·x² (başta çok yavaş),
  // inişte v = b + (a − b)·(1 − x)² (önce hızlı, sona doğru yumuşak); x = 0…1, 64 nokta.
  function egri(a, b) {
    var n = 64, e = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / (n - 1); e[i] = b >= a ? a + (b - a) * x * x : b + (a - b) * (1 - x) * (1 - x); }
    return e;
  }
  function kaydir(g, hedef, sure, t) {
    t = t || ac.currentTime; var a = g.gain.value;
    g.gain.cancelScheduledValues(t);
    try { g.gain.setValueCurveAtTime(egri(a, hedef), t, sure); }
    catch (e) { g.gain.setValueAtTime(a, t); g.gain.linearRampToValueAtTime(hedef, t + sure); }
  }
  // ofset: döngü içinde başlanacak yer (sn); geçersizse döngü başı
  function dosyaCal(ofset, sure) {
    var t = ac.currentTime + 0.03, s = ac.createBufferSource(), sinir = dosyaSinir;
    if (!(ofset >= sinir[0] && ofset < sinir[1])) ofset = sinir[0];
    s.buffer = dosyaTampon; s.loop = true; s.loopStart = sinir[0]; s.loopEnd = sinir[1];
    dosyaKazanc = ac.createGain(); dosyaKazanc.gain.value = 0; kaydir(dosyaKazanc, DOSYA_SEVIYE[TEMA] || 0.4, sure, t);
    s.connect(dosyaKazanc); dosyaKazanc.connect(ac.destination); s.start(t, ofset);
    dosyaKaynak = s; dosyaBas = { t: t, ofset: ofset };
  }
  // döngüdeki şu anki yer (sn): ofset + geçen süre, döngü uzunluğuna göre başa sarılır
  function dosyaKonum() {
    if (!dosyaKaynak || !dosyaBas) return null;
    var a = dosyaSinir[0], b = dosyaSinir[1], k = dosyaBas.ofset + Math.max(0, ac.currentTime - dosyaBas.t);
    return k < b ? k : a + (k - a) % (b - a);
  }
  function dosyaDurdur(sure) {
    if (!dosyaKaynak) return;
    var s = dosyaKaynak; kaydir(dosyaKazanc, 0, sure); dosyaKaynak = null; dosyaBas = null;
    setTimeout(function () { try { s.stop(); } catch (e) { /* zaten durdu */ } }, sure * 1000 + 100);
  }
  var S = {};                                                   // temanın zaman sayaçları

  function kapatildi() { try { return localStorage.getItem(KEY) === '0'; } catch (e) { return false; } }
  function kaydet(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* sessizce geç */ } }
  // Oturum kaydı: { caliyor, zaman, konumlar: { uzay: sn, muhendislik: sn, odak: sn } }
  function oturumHam() { try { return JSON.parse(sessionStorage.getItem(OTURUM)) || {}; } catch (e) { return {}; } }
  function oncekiCaliyordu() { var o = oturumHam(); return !!o.caliyor && Date.now() - (o.zaman || 0) < TAZE_MS; }
  // bu parçanın bu sekmede en son kaldığı yer (yoksa null: ilk kez çalınıyor, baştan başlar)
  function kayitliKonum() { var k = (oturumHam().konumlar || {})[TEMA]; return typeof k === 'number' ? k : null; }
  function oturumYaz() {
    var o = oturumHam(), konumlar = o.konumlar || {};
    if (mod === 'dosya') { var k = dosyaKonum(); if (k !== null) konumlar[TEMA] = k; }   // öbür parçaların yeri korunur
    try { sessionStorage.setItem(OTURUM, JSON.stringify({ caliyor: running, zaman: Date.now(), konumlar: konumlar })); } catch (e) { /* sessizce geç */ }
  }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------------- ortak ses düzeni: çıkış, sıkıştırıcı, yankı, sağ-sol gecikme ---------------- */
  // yalnız ses bağlamı (kayıtlı müzik için yeterli)
  function baglam(c) {
    if (ac) return true;
    var K = window.AudioContext || window.webkitAudioContext;
    try { ac = c || (K ? new K() : null); } catch (e) { ac = null; }
    return !!ac;
  }
  // sentez düzeni: yalnız dosya inemezse kurulur (yavaş telefonda ~1,1 sn sürüyor; kayıtlı müzik bunu kullanmaz)
  function kur(c) {
    if (out) return true;
    if (!baglam(c)) return false;
    out = ac.createGain(); out.gain.value = 0;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    var son = comp;
    if (TEMA === 'odak' || TEMA === 'dedektif') { var sicak = ac.createBiquadFilter(); sicak.type = 'lowpass'; sicak.frequency.value = 4200; comp.connect(sicak); son = sicak; }
    out.connect(comp); son.connect(ac.destination);
    var yankiSn = TEMA === 'uzay' ? 6 : TEMA === 'muhendislik' ? 3.5 : 2.2;
    rev = ac.createConvolver();
    var len = Math.floor(ac.sampleRate * yankiSn), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    rev.buffer = ir; var rg = ac.createGain(); rg.gain.value = TEMA === 'uzay' ? 0.55 : 0.35; rev.connect(rg); rg.connect(out);
    var merge = ac.createChannelMerger(2), fb = ac.createGain(), lp = ac.createBiquadFilter(), dg = ac.createGain(), dlyR = ac.createDelay(2);
    dlyL = ac.createDelay(2); var dt = TEMA === 'uzay' ? 0.9 : TEMA === 'muhendislik' ? 60 / 112 * 0.75 : TEMA === 'dedektif' ? 60 / 100 * 0.75 : 60 / 72 * 0.5;
    dlyL.delayTime.value = dt; dlyR.delayTime.value = dt;
    fb.gain.value = 0.4; lp.type = 'lowpass'; lp.frequency.value = 2400; dg.gain.value = TEMA === 'odak' ? 0.25 : TEMA === 'dedektif' ? 0.18 : 0.45;
    dlyL.connect(dlyR); dlyR.connect(lp); lp.connect(fb); fb.connect(dlyL);
    dlyL.connect(merge, 0, 0); dlyR.connect(merge, 0, 1); merge.connect(dg); dg.connect(out); dg.connect(rev);
    var n = ac.sampleRate; nbuf = ac.createBuffer(1, n, n); var nd = nbuf.getChannelData(0); for (var j = 0; j < n; j++) nd[j] = Math.random() * 2 - 1;
    return true;
  }
  function pan(node, p) { if (!ac.createStereoPanner) return node; var s = ac.createStereoPanner(); s.pan.value = p; node.connect(s); return s; }
  function osc(type, f, t0, t1, dest, detune) { var o = ac.createOscillator(); o.type = type; o.frequency.value = f; if (detune) o.detune.value = detune; o.connect(dest); o.start(t0); o.stop(t1); return o; }
  function gurultu(t0, t1, dest) { var s = ac.createBufferSource(); s.buffer = nbuf; s.loop = true; s.connect(dest); s.start(t0, Math.random() * 0.8); s.stop(t1); return s; }

  /* ---------------- ortak çalgılar ---------------- */
  // geniş pad: her nota iki hafif akort dışı testere + üst oktav üçgen, yavaş açılan süzgeç; akorlar birbirine bindirilir
  function pad(t, notalar, dur, v, parlak) {
    var ts = Math.max(ac.currentTime, t - 2.5);
    notalar.forEach(function (m, k) {
      var f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      f.type = 'lowpass'; f.Q.value = 0.8; f.frequency.value = parlak || 900; lfo.frequency.value = 0.05 + k * 0.013; lg.gain.value = (parlak || 900) * 0.5; lfo.connect(lg); lg.connect(f.frequency);
      [-9, 9].forEach(function (d) { osc('sawtooth', mtof(m), ts, t + dur + 6, f, d + (Math.random() * 4 - 2)); });
      var tg = ac.createGain(); tg.gain.value = 0.35; tg.connect(f); osc('triangle', mtof(m + 12), ts, t + dur + 6, tg);
      f.connect(g); pan(g, notalar.length > 1 ? (k / (notalar.length - 1)) * 1.2 - 0.6 : 0).connect(out); g.connect(rev);
      var vv = v * (1 - k * 0.09);
      g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(vv, t + 1); g.gain.setTargetAtTime(0, t + dur, 1.6);
      lfo.start(ts); lfo.stop(t + dur + 6);
    });
  }
  function dip(t, m, dur, v) {
    var ts = Math.max(ac.currentTime, t - 2.5), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = 'lowpass'; f.frequency.value = 240; g.connect(out); g.connect(rev); f.connect(g);
    osc('sine', mtof(m), ts, t + dur + 6, g); osc('sawtooth', mtof(m + 12), ts, t + dur + 6, f);
    g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(v, t + 0.5); g.gain.setTargetAtTime(0, t + dur, 1.4);
  }
  function can(t, m, v, p) {           // çan: temel ton + 2,76 ve 5,4 kat kısmi
    var g = ac.createGain(), pg = pan(g, p === undefined ? Math.random() * 1.6 - 0.8 : p);
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(function (h) { var og = ac.createGain(); og.gain.value = h[1]; og.connect(g); osc('sine', mtof(m) * h[0], t, t + 4.2, og); });
    pg.connect(rev); pg.connect(dlyL); pg.connect(out);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
  }
  function pluck(t, m, v, tip, kuyruk, ac2) {
    var f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(ac2 || 2600, t); f.frequency.exponentialRampToValueAtTime(600, t + 0.25);
    f.connect(g); g.connect(out); g.connect(dlyL); g.connect(rev);
    osc(tip || 'triangle', mtof(m), t, t + (kuyruk || 0.7) + 0.05, f); osc('sine', mtof(m + 12), t, t + (kuyruk || 0.7) + 0.05, f);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (kuyruk || 0.7));
  }
  function vurus(t, v, f0, f1, sure) { var g = ac.createGain(), o = ac.createOscillator(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + sure * 0.35); o.connect(g); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + sure); o.start(t); o.stop(t + sure + 0.05); }
  function hisirti(t, v, tip, fq, sure, yankili) { var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = tip; f.frequency.value = fq; f.connect(g); g.connect(out); if (yankili) g.connect(rev); gurultu(t, t + sure + 0.05, f); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure); }

  /* =========================== TEMALAR =========================== */
  var TEMALAR = {
    /* ---- UZAY: belgesel / bilim kurgu (Re minör) ---- */
    uzay: {
      seviye: 0.5,
      CH: [[38, [50, 57, 62, 65, 69]], [34, [46, 53, 58, 62, 69]], [41, [48, 53, 57, 60, 67]], [36, [48, 55, 60, 64, 67]]],
      PENT: [74, 77, 79, 81, 84, 86, 89, 91, 93], OSTP: [0, 2, 1, 3, 2, 4, 1, 3], AKOR: 9.6, ADIM: 0.3,
      basla: function (t) { S.chord = t; S.ost = t + this.AKOR * 0.5; S.beat = t + this.AKOR; S.star = t + 2; S.ci = 0; S.cycle = 0; S.say = 0; S.step = 0; },
      planla: function (u) {
        var T = this;
        while (S.chord < u) {
          var c = T.CH[S.ci];
          dip(S.chord, c[0], T.AKOR, 0.16); pad(S.chord, c[1], T.AKOR, 0.032);
          if (S.cycle % 4 === 3 && S.ci === 0) kabarma(S.chord, c, T.AKOR);
          S.say++; S.ci = (S.ci + 1) % 4; if (S.ci === 0) S.cycle++; S.chord += T.AKOR;
        }
        var ostOn = S.say >= 2 && S.cycle % 4 !== 3;
        while (S.ost < u) { if (ostOn) { var c2 = T.CH[(S.ci + 3) % 4][1], n = T.OSTP[S.step % 8]; pluck(S.ost, c2[n % c2.length] + 12, S.step % 8 === 0 ? 0.05 : 0.032); } S.step++; S.ost += T.ADIM; }
        while (S.beat < u) { if (S.cycle % 2 === 1) vurus(S.beat, 0.22, 70, 36, 1.6); S.beat += T.ADIM * 8; }
        while (S.star < u) { can(S.star, rnd(T.PENT), 0.018 + Math.random() * 0.02); S.star += 1.1 + Math.random() * 2.6; }
      }
    },
    /* ---- MÜHENDİSLİK: "Uçuş" (Do minör, 112 vuruş/dk) ----
       Bir dronun pervaneleri gibi hiç durmayan 16'lık bas nabzı; dört akorluk turlarda katmanlar girip çıkar:
       0. tur pad + nabız, 1. tur + davul ve arpej, 2. tur + hi-hat, 3. tur sakinleşme (yalnız pad ve radar sinyali). */
    muhendislik: {
      seviye: 0.46,
      CH: [[36, [48, 55, 58, 62, 63]], [32, [44, 51, 55, 60, 63]], [39, [51, 55, 58, 63, 67]], [34, [46, 53, 58, 60, 65]]],
      ARP: [0, 1, 2, 3, 4, 3, 2, 1], BPM: 112,
      basla: function (t) { S.chord = t; S.step = 0; S.t16 = t; S.ci = 0; S.cycle = 0; S.ping = t + 3; },
      planla: function (u) {
        var T = this, s16 = 60 / T.BPM / 4, akor = s16 * 32;          // her akor 2 ölçü
        while (S.chord < u) {
          var c = T.CH[S.ci], tur = S.cycle % 4;
          dip(S.chord, c[0], akor, 0.12); pad(S.chord, c[1], akor, tur === 3 ? 0.034 : 0.026, 1300);
          if (S.ci === 3) ruzgar(S.chord + akor * 0.5, akor * 0.5);
          S.ci = (S.ci + 1) % 4; if (S.ci === 0) S.cycle++; S.chord += akor;
        }
        while (S.t16 < u) {
          var i = S.step, b = i % 16, ciNow = Math.floor(i / 32) % 4, cyc = Math.floor(i / 128) % 4, ch = T.CH[ciNow], t = S.t16;
          if (cyc !== 3) nabizBas(t, ch[0] + 12, b % 4 === 0 ? 0.075 : 0.05);
          if (cyc === 1 || cyc === 2) {
            if (b % 4 === 0) vurus(t, 0.5, 120, 45, 0.32);
            var a = T.ARP[i % 8], nota = ch[1][a % ch[1].length] + 12 + (a >= 4 ? 12 : 0);
            if (i % 2 === 0) pluck(t, nota, 0.03, 'sawtooth', 0.35, 3200);
          }
          if (cyc === 2 && b % 4 === 2) hisirti(t, 0.05, 'highpass', 8000, 0.05);
          if (cyc === 2 && (b === 4 || b === 12)) hisirti(t, 0.06, 'bandpass', 1800, 0.18, true);
          S.step++; S.t16 += s16;
        }
        while (S.ping < u) { can(S.ping, rnd([84, 87, 91, 96]), 0.016, Math.random() * 1.4 - 0.7); S.ping += s16 * 16 * (2 + Math.floor(Math.random() * 3)); }
      }
    },
    /* ---- ODAK: lo-fi çalışma (Fa majör, 72 vuruş/dk, hafif sallantılı) ---- */
    odak: {
      seviye: 0.5,
      CH: [[41, [53, 57, 60, 64]], [40, [52, 55, 59, 62]], [38, [50, 53, 57, 60, 64]], [36, [48, 52, 55, 59]]],
      PENT: [65, 67, 69, 72, 74, 77, 79], BPM: 72,
      basla: function (t) { S.step = 0; S.t8 = t; S.crack = t; },
      planla: function (u) {
        var T = this, s8 = 60 / T.BPM / 2;
        while (S.t8 < u) {
          var i = S.step, b = i % 8, ciNow = Math.floor(i / 8) % 4, ch = T.CH[ciNow], sal = (i % 2) ? s8 * 0.16 : 0, t = S.t8 + sal;
          if (b === 0) { elPiyano(t, ch[1], 0.05); pad(S.t8, ch[1], s8 * 8, 0.024, 650); }
          if (b === 5 && Math.random() < 0.7) elPiyano(t, [ch[1][1] + 12], 0.035);
          if (b === 3 || b === 6) { if (Math.random() < 0.55) elPiyano(t, [rnd(T.PENT) + 12], 0.03); }
          if (b === 0 || b === 5) bas(t, ch[0] + 12, s8 * (b === 0 ? 3.5 : 2.5), 0.12);
          if (b === 0 || b === 4) vurus(t, 0.32, 90, 42, 0.4);
          if (b === 2 || b === 6) hisirti(t, 0.05, 'bandpass', 1500, 0.22);
          hisirti(t, i % 2 ? 0.016 : 0.026, 'highpass', 6500, 0.06);
          S.step++; S.t8 += s8;
        }
        while (S.crack < u) { hisirti(S.crack, 0.012 + Math.random() * 0.02, 'highpass', 3000, 0.008); S.crack += 0.05 + Math.random() * 0.35; }
      }
    },
    /* ---- DEDEKTİF: Şifre Dairesi (Re minör, 100 vuruş/dk, sallantılı sekizlikler) ----
       Bu sayfa için yazılmış özgün bir casus cazı; bilinen bir filmin ya da çizgi filmin ezgisi değildir.
       8 ölçülük döngü: Dm7 | Dm7 | B♭7 | A7♭9 | Dm7 | Gm7 | E♭7 | A7♭9. Dört turda katmanlar değişir:
       0. tur giriş (kontrbas, parmak şıklatma, fırça), 1. tur + saksofon ezgisi, 2. tur vibrafon ezgiyi
       çalar ve "parmak ucu" bas adımları girer, 3. tur saksofon ve vibrafon akorları birlikte. */
    dedektif: {
      seviye: 0.52, BPM: 100,
      AKOR: [[38, [60, 65, 69, 74]], [38, [60, 65, 69, 74]], [34, [62, 65, 68, 70]], [33, [61, 64, 67, 70]],
             [38, [60, 65, 69, 74]], [31, [62, 65, 67, 70]], [39, [61, 63, 67, 70]], [33, [61, 64, 67, 70]]],
      // [sekizlik sırası (0–63), MIDI nota, süre (sekizlik)]
      EZGI: [[3, 57, 1], [4, 62, 1], [5, 65, 1], [6, 69, 2], [10, 67, 1], [11, 65, 1], [12, 62, 3],
             [19, 65, 1], [20, 68, 1], [21, 65, 1], [22, 62, 2], [26, 64, 1], [27, 67, 1], [28, 70, 1], [29, 69, 3],
             [35, 74, 1], [36, 72, 1], [37, 69, 1], [38, 72, 2], [43, 70, 1], [44, 67, 1], [45, 62, 1], [46, 65, 2],
             [50, 67, 1], [51, 70, 1], [52, 73, 1], [53, 70, 1], [54, 67, 2], [58, 64, 1], [59, 65, 1], [60, 67, 1], [61, 69, 3]],
      basla: function (t) {
        S.step = 0; S.t8 = t;
        if (!this.harita) { var h = this.harita = {}; this.EZGI.forEach(function (e) { h[e[0]] = e; }); }
      },
      planla: function (u) {
        var T = this, s8 = 60 / T.BPM / 2;
        while (S.t8 < u) {
          var i = S.step, b = i % 8, olcu = Math.floor(i / 8) % 8, tur = Math.floor(i / 64) % 4;
          var ch = T.AKOR[olcu], sonraki = T.AKOR[(olcu + 1) % 8][0];
          var t = S.t8 + (i % 2 ? s8 * 0.34 : 0);                       // sallantı (swing): ara sekizlik biraz geç
          // kontrbas: kök, aşağıdan beşli, oktav, beşli, bir sonraki köke yarım ses yaklaşma
          if (b === 0) kontrbas(t, ch[0], s8 * 1.7, 0.16);
          else if (b === 3) kontrbas(t, ch[0] + 7, s8 * 0.8, 0.11);
          else if (b === 4) kontrbas(t, ch[0] + 12, s8 * 1.5, 0.13);
          else if (b === 6) kontrbas(t, ch[0] + 7, s8 * 0.9, 0.11);
          else if (b === 7) kontrbas(t, sonraki + 1, s8 * 0.8, 0.1);
          // ritim: 2. ve 4. vuruşta parmak şıklatma + fırça, zil (ride) "ding, ding-ga, ding"
          if (b === 2 || b === 6) { parmak(t, 0.2, b === 2 ? 0.35 : 0.45); hisirti(t, 0.035, 'bandpass', 2600, 0.2); }
          if (b === 0 || b === 2 || b === 3 || b === 4 || b === 6 || b === 7) hisirti(t, b % 2 ? 0.012 : 0.02, 'highpass', 7500, b % 2 ? 0.08 : 0.16);
          // ezgi
          var e = T.harita[i % 64];
          if (e && (tur === 1 || tur === 3)) saksofon(t, e[1], s8 * (e[2] === 1 ? 0.75 : e[2] * 0.95), 0.11);
          if (e && tur === 2) vibrafon(t, [e[1] + 12], 0.07, 1.2);
          // vibrafon akorları ve parmak ucu adımlar
          if (tur >= 1 && b === 3 && olcu % 2 === 0) vibrafon(t, ch[1], tur === 3 ? 0.03 : 0.022, 1.6);
          if (tur === 0 && olcu === 7 && b === 5) vibrafon(t, ch[1], 0.03, 2);
          if (tur === 2 && (olcu === 0 || olcu === 4) && b >= 4) parmakUcu(t, 50 + [0, 3, 5, 6][b - 4], 0.06);
          S.step++; S.t8 += s8;
        }
      }
    }
  };
  // dedektif: parmakla çekilen kontrbas (kısa vuruş + yumuşak sönüm; üst oktav küçük hoparlörde duyulsun diye)
  function kontrbas(t, m, d, v) {
    var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(1100, t); f.frequency.exponentialRampToValueAtTime(380, t + 0.12);
    f.connect(g); g.connect(out); g.connect(rev);
    osc('triangle', mtof(m), t, t + d + 0.1, f); osc('sine', mtof(m), t, t + d + 0.1, g);
    var o2 = ac.createGain(); o2.gain.value = 0.25; o2.connect(f); osc('sawtooth', mtof(m + 12), t, t + d + 0.1, o2);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006);
    g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  }
  // dedektif: parmak şıklatma (kısa, parlak gürültü patlaması), hafif sağda
  function parmak(t, v, p) {
    var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 2300; f.Q.value = 1.6;
    f.connect(g); pan(g, p).connect(out); g.connect(rev); gurultu(t, t + 0.07, f);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  }
  // dedektif: boğuk (sürdinli) saksofon: iki testere, bant süzgeci, geç başlayan titreşim (vibrato)
  function saksofon(t, m, d, v) {
    var bp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 0.9; lp.type = 'lowpass'; lp.frequency.value = 2600;
    bp.connect(lp); lp.connect(g); pan(g, -0.2).connect(out); g.connect(rev); g.connect(dlyL);
    lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(d > 0.4 ? 14 : 0, t + Math.min(d, 0.5)); lfo.connect(lg);
    [-5, 5].forEach(function (dt) { var o = osc('sawtooth', mtof(m), t, t + d + 0.12, bp, dt); lg.connect(o.detune); });
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.035);
    g.gain.setValueAtTime(v, t + Math.max(0.04, d - 0.06)); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.1);
    lfo.start(t); lfo.stop(t + d + 0.12);
  }
  // dedektif: vibrafon (temel ton + 4 kat kısmi, dönen pervane titreşimi)
  function vibrafon(t, notalar, v, kuyruk) {
    var g = ac.createGain(), tr = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 5.5; lg.gain.value = 0.35; lfo.connect(lg); lg.connect(tr.gain); tr.gain.value = 0.65;
    g.connect(tr); pan(tr, 0.3).connect(out); tr.connect(rev); tr.connect(dlyL);
    notalar.forEach(function (m, k) {
      var tt = t + k * 0.012;
      osc('sine', mtof(m), tt, tt + kuyruk + 0.1, g);
      var ust = ac.createGain(); ust.gain.setValueAtTime(0.18, tt); ust.gain.exponentialRampToValueAtTime(0.001, tt + 0.25); ust.connect(g);
      osc('sine', mtof(m) * 4, tt, tt + 0.3, ust);
    });
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + kuyruk);
    lfo.start(t); lfo.stop(t + kuyruk + 0.15);
  }
  // dedektif: "parmak ucu" adımlar: kısa, boğuk, alçak kare dalga
  function parmakUcu(t, m, v) {
    var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 900; f.connect(g); g.connect(out); g.connect(rev);
    osc('square', mtof(m), t, t + 0.16, f);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  }
  // uzay: her dördüncü turda filtresi yavaşça açılan büyük akor
  function kabarma(t, c, AK) {
    var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.Q.value = 1.5;
    f.frequency.setValueAtTime(250, t); f.frequency.exponentialRampToValueAtTime(2800, t + AK * 0.75); f.frequency.exponentialRampToValueAtTime(400, t + AK * 1.3);
    f.connect(g); g.connect(out); g.connect(rev);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.055, t + AK * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + AK * 1.4);
    [c[0] + 12, c[1][0], c[1][1], c[1][2], c[1][0] + 12].forEach(function (m) { [-6, 6].forEach(function (d) { osc('sawtooth', mtof(m), t, t + AK * 1.45, f, d); }); });
  }
  // mühendislik: süzgeçten geçen, her vuruşta açılıp kapanan bas nabzı
  function nabizBas(t, m, v) {
    var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.Q.value = 5;
    f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.11);
    f.connect(g); g.connect(out); osc('sawtooth', mtof(m), t, t + 0.16, f); osc('square', mtof(m - 12), t, t + 0.16, f);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  }
  function ruzgar(t, d) {
    var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.Q.value = 2.5;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(5000, t + d); f.connect(g); g.connect(out); g.connect(rev);
    gurultu(t, t + d + 0.2, f); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + d * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.15);
  }
  // odak: FM elektrik piyano (taşıyıcı + kısa ömürlü değiştirici = Rhodes benzeri çan tınısı)
  function elPiyano(t, notalar, v) {
    notalar.forEach(function (m, k) {
      var tt = t + k * 0.018, g = ac.createGain(), car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), f = mtof(m);
      car.frequency.value = f; mod.frequency.value = f; mg.gain.setValueAtTime(f * 1.6, tt); mg.gain.exponentialRampToValueAtTime(f * 0.05, tt + 0.5);
      mod.connect(mg); mg.connect(car.frequency); car.connect(g); pan(g, (k % 2 ? 0.25 : -0.25)).connect(out); g.connect(rev); g.connect(dlyL);
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(v, tt + 0.008); g.gain.exponentialRampToValueAtTime(v * 0.35, tt + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, tt + 2.6);
      car.start(tt); mod.start(tt); car.stop(tt + 2.7); mod.stop(tt + 2.7);
    });
  }
  function bas(t, m, d, v) { var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 500; f.connect(g); g.connect(out); osc('sine', mtof(m), t, t + d + 0.1, g); osc('triangle', mtof(m), t, t + d + 0.1, f); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(v * 0.5, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d); }

  var T = TEMALAR[TEMA] || TEMALAR.uzay;
  function tik() { if (running) T.planla(ac.currentTime + 1.5); }

  /* ---------------- başlat / durdur ---------------- */
  // iPhone'da sessiz moddayken de çalsın; ilk dokunuşta 1 örneklik sessiz ses çalınarak ses kanalı açılır
  function kilidiAc() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* desteklenmiyor */ }
    try { var b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0); } catch (e) { /* sessizce geç */ }
    if (ac.state !== 'running' && ac.resume) ac.resume().catch(function () {});
  }
  function sentezBaslat(sure) {
    if (!kur()) { running = false; return; }
    mod = 'sentez';
    var t = ac.currentTime + 0.1;
    T.basla(t);
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(T.seviye, t + sure);
    T.planla(t + 1.5); timer = setInterval(tik, 250);
  }
  // secenek.sure: açılış süresi. Parça bu sekmede daha önce çaldıysa kaldığı yerden, yoksa baştan başlar.
  function baslat(secenek) {
    secenek = secenek || {};
    if (running) { if (ac && ac.state !== 'running') kilidiAc(); return; }
    if (!baglam()) return;
    kilidiAc();
    running = true; yukleniyor = true;
    davetYukleniyor(); arayuz(); duyur('Müzik yükleniyor');
    dosyaHazirla().then(function (t) {
      if (!running || mod) return;                    // bu arada kapatıldıysa ya da zaten başladıysa
      var sure = secenek.sure || SURE.acilis;
      if (t) { mod = 'dosya'; dosyaCal(kayitliKonum(), sure); } else sentezBaslat(sure);
      yukleniyor = false; bekliyor = false; devamSecenek = null;
      davetiGizle(); arayuz(); duyur(running ? 'Müzik çalıyor' : '');
    });
  }
  function durdur(sure) {
    if (!running) return;
    sure = sure || SURE.kapanis;
    oturumYaz();                                       // parçanın kaldığı yer saklansın
    running = false; yukleniyor = false; clearInterval(timer); timer = null;
    if (mod === 'dosya') dosyaDurdur(sure);
    if (mod === 'sentez' && out) kaydir(out, 0, sure);
    mod = null;
    setTimeout(function () { if (!running && ac && ac.suspend) ac.suspend(); }, sure * 1000 + 200);
    davetiGizle(); arayuz(); duyur('Müzik kapatıldı');
  }

  /* ---------------- arayüz: düğme, davet ---------------- */
  var dugme = null, davet = null;
  function stilEkle() {
    if (document.getElementById('site-muzik-stil')) return;
    var st = document.createElement('style'); st.id = 'site-muzik-stil';
    st.textContent =
      '.eq{display:inline-flex;align-items:flex-end;gap:2px;height:13px}.eq i{width:3px;height:4px;border-radius:1px;background:currentColor;opacity:.55}' +
      '[aria-pressed="false"] .eq i{height:2px;opacity:.35}.caliyor .eq i{opacity:1;animation:sm-eq 1.1s ease-in-out infinite}' +
      '.caliyor .eq i:nth-child(2){animation-delay:-.4s;animation-duration:.9s}.caliyor .eq i:nth-child(3){animation-delay:-.75s;animation-duration:1.3s}' +
      '@keyframes sm-eq{0%,100%{height:3px}50%{height:13px}}' +
      '.sm-yuzen{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:45;display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:999px;border:1px solid rgba(120,140,190,.45);background:rgba(255,255,255,.88);color:#1d3b8b;font:700 13px/1 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.15);cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
      '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .sm-yuzen{background:rgba(22,29,39,.88);color:#9bb3ff;border-color:rgba(155,179,255,.35)}}:root[data-theme="dark"] .sm-yuzen{background:rgba(22,29,39,.88);color:#9bb3ff;border-color:rgba(155,179,255,.35)}' +
      /* İki Kalem: degrade hap yerine kâğıt zemin üstünde mavi kalemle çizilmiş çerçeve, kırmızı nota.
         Renkler sitenin tokenlarından; tokenların yüklenmediği sayfada (Teşhis) yedek değerler devreye girer. */
      '.sm-davet{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);opacity:0;z-index:60;display:flex;align-items:center;gap:10px;min-height:44px;padding:0 18px;border-radius:0;border:var(--kalem,1.5px) solid var(--murekkep,#1d3b8b);background:var(--kagit,#f5f7fa);color:var(--murekkep,#1d3b8b);font:700 15px/1.2 var(--yazi,system-ui,sans-serif);cursor:pointer;transition:opacity .45s,transform .45s;white-space:nowrap}' +
      '.sm-davet span:last-child{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.3em}.sm-davet:hover span:last-child{text-decoration-thickness:2px}' +
      '.sm-davet .not{color:var(--kirmizi,#c8323b)}.sm-davet:focus-visible{outline:3px solid var(--kirmizi,#c8323b);outline-offset:3px}' +
      '.sm-davet.gor{opacity:1;transform:translate(-50%,0)}.sm-davet .not{font-size:18px;animation:sm-not 1.6s ease-in-out infinite}@keyframes sm-not{50%{transform:translateY(-3px) rotate(-8deg)}}' +
      /* yükleniyor: çubuklar yavaş ve soluk kıpırdar */
      '.yukleniyor .eq i{opacity:.7;animation:sm-eq 2.4s ease-in-out infinite}.yukleniyor .eq i:nth-child(2){animation-delay:-.8s}.yukleniyor .eq i:nth-child(3){animation-delay:-1.6s}' +
      '.sm-gizli{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}' +
      /* hareketi azalt: animasyon yok; davet kaymadan, yalnız soluklaşarak görünür (sayfanın kendi konum kuralı da kapsanır) */
      '@media (prefers-reduced-motion:reduce){.caliyor .eq i,.yukleniyor .eq i,.sm-davet .not{animation:none}.caliyor .eq i{height:9px}.sm-davet,body>.sm-davet{transition:opacity .2s}}';
    document.head.appendChild(st);
  }
  // ekran okuyucuya kısa durum bildirimi (görünmez canlı bölge)
  var canli = null;
  function duyur(metin) {
    if (!canli) { canli = document.createElement('p'); canli.className = 'sm-gizli'; canli.setAttribute('role', 'status'); canli.setAttribute('aria-live', 'polite'); document.body.appendChild(canli); }
    canli.textContent = metin;
  }
  // aria-pressed = müzik şu an açık mı (çalıyor ya da yükleniyor); aria-busy = yükleniyor
  function arayuz() {
    if (!dugme) return;
    dugme.setAttribute('aria-pressed', String(running));
    dugme.setAttribute('aria-busy', String(yukleniyor));
    dugme.classList.toggle('caliyor', running && !yukleniyor);
    dugme.classList.toggle('yukleniyor', yukleniyor);
    var y = dugme.querySelector('.muzik-yazi'); if (y) y.textContent = yukleniyor ? 'Yükleniyor' : (running || bekliyor) ? 'Müzik' : 'Müzik kapalı';
    dugme.title = yukleniyor ? 'Müzik yükleniyor.' : running ? 'Müzik çalıyor. Kapatmak için tıkla.' : 'Müzik kapalı. Açmak için tıkla.';
  }
  var davetZamani = null;
  function davetGoster(metin) {
    if (davet || running || !bekliyor) return;
    davet = document.createElement('button'); davet.type = 'button'; davet.className = 'sm-davet';
    davet.innerHTML = '<span class="not" aria-hidden="true">♪</span><span>' + (metin || 'Müziği açmak için dokun') + '</span>';
    document.body.appendChild(davet);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (davet) davet.classList.add('gor'); }); });
    davetZamani = setTimeout(davetiGizle, 9000);
  }
  // dokunuştan sonra davet kaybolmaz: ses başlayana kadar "Müzik yükleniyor…" yazar
  function davetYukleniyor() {
    if (!davet) return;
    clearTimeout(davetZamani);
    davet.lastChild.textContent = 'Müzik yükleniyor…';
  }
  function davetiGizle() { clearTimeout(davetZamani); if (!davet) return; var d = davet; davet = null; d.classList.remove('gor'); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 500); }

  /* ---------------- ilk dokunuş ve sayfalar arası devam ---------------- */
  // bekliyor: bu sayfada müzik ilk dokunuşta başlayacak (davet ya da önceki sayfadan devam); devamSecenek: kaldığı yer
  var bekliyor = false, devamSecenek = null;
  var OLAYLAR = ['touchend', 'click', 'pointerup', 'keydown'];
  function ilkDokunus(e) {
    if (dugme && e && dugme.contains(e.target)) return;      // düğmenin kendi işi var
    if (!bekliyor || kapatildi()) return;
    baslat(devamSecenek);
    if (ac && ac.state === 'running') { bekliyor = false; OLAYLAR.forEach(function (o) { document.removeEventListener(o, ilkDokunus, true); }); }
  }
  // Önceki sayfada müzik çalıyordu: dosya dokunuştan önce indirilip çözülür. Chrome aynı sitedeki geçişte
  // dokunmadan çalmaya izin verir: müzik hemen sürer. Safari izin vermez: ilk dokunuşta sürer.
  // Parça bu sekmede daha önce çaldıysa kendi kaldığı yerden, ilk kez çalıyorsa baştan; ikisi de SURE.gecis ile yükselir.
  function devamEt() {
    devamSecenek = { sure: SURE.gecis };
    if (!baglam()) return;
    dosyaHazirla();
    if (ac.state === 'running') { baslat(devamSecenek); return; }
    if (ac.resume) ac.resume().then(function () { if (ac.state === 'running' && bekliyor && !kapatildi()) baslat(devamSecenek); }, function () {});
    setTimeout(function () { if (!running) davetGoster('Müziği sürdürmek için dokun'); }, 400);
  }
  // Bağlantıya tıklanınca ses SURE.cikis (0,6 sn) içinde kısılır; gezinme bu süre kadar bekletilip sonra yapılır.
  // Gezinme gerçekleşmezse (indirme bağlantısı vb.) GERI_MS sonra ses geri gelir.
  var geriZamani = null, gidiliyor = false;
  function kazanc() { return mod === 'dosya' ? dosyaKazanc : mod === 'sentez' ? out : null; }
  function seviye() { return mod === 'dosya' ? (DOSYA_SEVIYE[TEMA] || 0.4) : T.seviye; }
  function geriAc() { gidiliyor = false; var g = kazanc(); if (running && g) kaydir(g, seviye(), SURE.gecis); }
  function bagTiklandi(e) {
    if (!running || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;   // dış site ya da aynı sayfa
    var g = kazanc(); if (!g) return;                 // müzik henüz yükleniyor: bekletmeden geç
    e.preventDefault();
    if (gidiliyor) return;                            // çift tıklama
    gidiliyor = true;
    kaydir(g, 0, SURE.cikis);
    setTimeout(function () { oturumYaz(); location.href = u.href; }, SURE.cikis * 1000);
    clearTimeout(geriZamani); geriZamani = setTimeout(geriAc, SURE.cikis * 1000 + GERI_MS);
  }
  function bagla() {
    stilEkle();
    dugme = document.getElementById('muzikDugme');
    if (!dugme) {
      dugme = document.createElement('button'); dugme.type = 'button'; dugme.id = 'muzikDugme'; dugme.className = 'sm-yuzen';
      dugme.setAttribute('aria-label', 'Müzik');
      dugme.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="muzik-yazi">Müzik</span>';
      document.body.appendChild(dugme);
    }
    dugme.addEventListener('click', function (e) {
      e.stopPropagation();
      if (yukleniyor) { kilidiAc(); duyur('Müzik yükleniyor'); return; }   // bekleme sırasındaki basış müziği kapatmaz
      if (running) { kaydet(false); durdur(); }
      else { kaydet(true); baslat(devamSecenek); }
    });
    var devam = !YALNIZ_DUGME && !kapatildi() && oncekiCaliyordu();
    var davetli = !YALNIZ_DUGME && !kapatildi() && !devam && VARSAYILAN_ACIK;
    bekliyor = devam || davetli;
    arayuz();
    if (bekliyor) OLAYLAR.forEach(function (o) { document.addEventListener(o, ilkDokunus, true); });
    if (devam) devamEt();
    else if (davetli) setTimeout(davetGoster, 1200);
    document.addEventListener('click', bagTiklandi);
    window.addEventListener('pagehide', oturumYaz);
    window.addEventListener('pageshow', function (e) { if (e.persisted && running && ac) { if (ac.resume) ac.resume(); geriAc(); } });   // geri düğmesiyle dönüş
    document.addEventListener('visibilitychange', function () {
      if (!ac || !running) return;
      if (document.hidden) { if (ac.suspend) ac.suspend(); }
      else { if (ac.resume) ac.resume(); if (mod === 'sentez') T.planla(ac.currentTime + 1.5); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bagla); else bagla();

  window.SiteMuzik = {
    tema: TEMA, baslat: baslat, durdur: durdur,
    durum: function () { return ac ? ac.state : 'yok'; },
    kaynak: function () { return mod || 'yok'; },                 // 'dosya' (kayıtlı müzik) | 'sentez' (yedek)
    // test ve dinleme için: müziği çevrimdışı bir ses bağlamında sn saniye boyunca üretir
    _bake: function (c, sn) { kur(c); out.gain.value = T.seviye; T.basla(0.05); T.planla(sn); }
  };
})();
