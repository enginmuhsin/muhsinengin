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
     odak        Teşhis Defteri. Sakin lo-fi çalışma müziği: elektrik piyano, yumuşak bas, fırça davul, plak cızırtısı.
                 Ders çalışırken dikkat dağıtmasın diye bu temada müzik kendiliğinden açık gelmez; düğmeyle açılır.

   Düğme: sayfada id="muzikDugme" varsa o kullanılır; yoksa sol altta küçük bir düğme eklenir.

   NEDEN İLK DOKUNUŞU BEKLİYOR? Bütün tarayıcılar (WhatsApp'ın içindeki tarayıcı dahil) bir sayfanın
   ziyaretçi dokunmadan ses çalmasını engeller. Telefonda yalnızca gerçek bir "dokunup bırakma"
   (touchend / click) ya da tuş basımı sayılır; ekrana ilk değme anı (pointerdown) sayılmaz.
   Bu yüzden müzik açıksa ziyaretçinin ilk dokunuşunda yavaşça yükselerek başlar ve
   sayfa açılınca kısa bir "Müziği aç" daveti görünür.
   ===================================================================== */
(function () {
  'use strict';
  if (window.SiteMuzik) return;
  var betik = document.currentScript;
  var TEMA = (betik && betik.dataset.tema) || 'uzay';
  var VARSAYILAN_ACIK = TEMA !== 'odak';
  var KEY = TEMA === 'odak' ? 'site-muzik-odak' : 'site-muzik';

  var ac = null, out = null, rev = null, dlyL = null, timer = null, running = false, yukleniyor = false, nbuf = null;
  /* ---------------- süreler (saniye): bütün açılış ve kapanışlar buradan ---------------- */
  var SURE = { acilis: 1.2, devam: 0.8, kapanis: 0.6, cikis: 0.25 };
  /* ---------------- kayıtlı müzik döngüsü (dosya) ---------------- */
  var DOSYA_SEVIYE = { uzay: 0.42, muhendislik: 0.36, odak: 0.4 };
  var dosyaUrl = null; try { dosyaUrl = new URL(TEMA + '.mp3', (betik && betik.src) || location.href).href; } catch (e) { dosyaUrl = null; }
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
  function kaydir(g, hedef, sure) { var t = ac.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(hedef, t + sure); }
  // ofset: döngü içinde başlanacak yer (sn); geçersizse döngü başı
  function dosyaCal(ofset, sure) {
    var t = ac.currentTime + 0.03, s = ac.createBufferSource(), sinir = dosyaSinir;
    if (!(ofset >= sinir[0] && ofset < sinir[1])) ofset = sinir[0];
    s.buffer = dosyaTampon; s.loop = true; s.loopStart = sinir[0]; s.loopEnd = sinir[1];
    dosyaKazanc = ac.createGain(); dosyaKazanc.gain.setValueAtTime(0, t); dosyaKazanc.gain.linearRampToValueAtTime(DOSYA_SEVIYE[TEMA] || 0.4, t + sure);
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

  function acik() { try { var v = localStorage.getItem(KEY); return v === null ? VARSAYILAN_ACIK : v !== '0'; } catch (e) { return VARSAYILAN_ACIK; } }
  function kaydet(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* sessizce geç */ } }
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
    if (TEMA === 'odak') { var sicak = ac.createBiquadFilter(); sicak.type = 'lowpass'; sicak.frequency.value = 4200; comp.connect(sicak); son = sicak; }
    out.connect(comp); son.connect(ac.destination);
    var yankiSn = TEMA === 'uzay' ? 6 : TEMA === 'muhendislik' ? 3.5 : 2.2;
    rev = ac.createConvolver();
    var len = Math.floor(ac.sampleRate * yankiSn), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    rev.buffer = ir; var rg = ac.createGain(); rg.gain.value = TEMA === 'uzay' ? 0.55 : 0.35; rev.connect(rg); rg.connect(out);
    var merge = ac.createChannelMerger(2), fb = ac.createGain(), lp = ac.createBiquadFilter(), dg = ac.createGain(), dlyR = ac.createDelay(2);
    dlyL = ac.createDelay(2); var dt = TEMA === 'uzay' ? 0.9 : TEMA === 'muhendislik' ? 60 / 112 * 0.75 : 60 / 72 * 0.5;
    dlyL.delayTime.value = dt; dlyR.delayTime.value = dt;
    fb.gain.value = 0.4; lp.type = 'lowpass'; lp.frequency.value = 2400; dg.gain.value = TEMA === 'odak' ? 0.25 : 0.45;
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
    }
  };
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
  // secenek.konum: döngüde başlanacak yer (sn), secenek.sure: açılış süresi
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
      if (t) { mod = 'dosya'; dosyaCal(secenek.konum, sure); } else sentezBaslat(sure);
      yukleniyor = false;
      davetiGizle(); arayuz(); duyur(running ? 'Müzik çalıyor' : '');
    });
  }
  function durdur(sure) {
    if (!running) return;
    sure = sure || SURE.kapanis;
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
      '@media (prefers-reduced-motion:reduce){.caliyor .eq i,.yukleniyor .eq i,.sm-davet .not{animation:none}.caliyor .eq i{height:9px}}';
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
    var y = dugme.querySelector('.muzik-yazi'); if (y) y.textContent = yukleniyor ? 'Yükleniyor' : (running || acik()) ? 'Müzik' : 'Müzik kapalı';
    dugme.title = yukleniyor ? 'Müzik yükleniyor.' : running ? 'Müzik çalıyor. Kapatmak için tıkla.' : 'Müzik kapalı. Açmak için tıkla.';
  }
  var davetZamani = null;
  function davetGoster() {
    if (davet || running || !acik()) return;
    davet = document.createElement('button'); davet.type = 'button'; davet.className = 'sm-davet';
    davet.innerHTML = '<span class="not" aria-hidden="true">♪</span><span>Müziği açmak için dokun</span>';
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

  var OLAYLAR = ['touchend', 'click', 'pointerup', 'keydown'];
  function ilkDokunus(e) {
    if (dugme && e && dugme.contains(e.target)) return;      // düğmenin kendi işi var
    if (!acik()) return;
    baslat();
    if (ac && ac.state === 'running') OLAYLAR.forEach(function (o) { document.removeEventListener(o, ilkDokunus, true); });
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
      else { kaydet(true); baslat(); }
    });
    arayuz();
    OLAYLAR.forEach(function (o) { document.addEventListener(o, ilkDokunus, true); });
    if (acik()) setTimeout(davetGoster, 1200);
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
