/* =====================================================================
   SİTE MÜZİĞİ — muzik/uzay.js
   Belgesel / uzay bilim kurgusu havasında, tarayıcıda anlık üretilen müzik.
   Ses dosyası yoktur: her nota Web Audio ile o an sentezlenir, bu yüzden sayfa hiç ağırlaşmaz.

   Katmanlar (bir binanın katları gibi üst üste biner):
   1. Dip sesi: akorun kök notasında derin, sürekli bir uğultu.
   2. Pad: Re minör çevresinde yavaş değişen geniş akorlar (Dm9 → B♭maj7 → Fadd9 → C), çok uzun yankıyla.
   3. Ostinato: belgesel müziklerindeki gibi sabit akan, yumuşak tınlı sekizlik notalar (2. turdan sonra girer).
   4. Yıldızlar: rastgele aralıklarla, sağa sola dağılan ince çan sesleri.
   5. Nabız: her iki turdan birinde, uzaktan gelen kalp atışı gibi derin vuruşlar.
   6. Kabarma: her dördüncü turda filtresi yavaşça açılan, org/üfleme benzeri büyük bir akor.

   Tarayıcılar sesi ancak kullanıcı sayfaya dokunduktan sonra başlatmaya izin verir.
   Bu yüzden müzik açıksa ilk tıklamada/tuşta yavaşça (5 sn) yükselerek başlar.
   Tercih (açık/kapalı) bu cihazda hatırlanır. Düğme: id="muzikDugme".
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'site-muzik';
  var ac = null, out = null, rev = null, dlyL = null, dlyR = null, timer = null, running = false;
  var nextChord = 0, ci = 0, cycle = 0, say = 0, nextStar = 0, nextOst = 0, ostStep = 0, nextBeat = 0;
  var CHORD = 9.6;                               // her akor 9,6 sn
  var OST = 0.3;                                 // ostinato adımı (sekizlik, 100 vuruş/dk)
  var CH = [                                     // [kök (bas), akor notaları] — MIDI numaraları
    [38, [50, 57, 62, 65, 69]],                  // Dm9
    [34, [46, 53, 58, 62, 69]],                  // B♭maj7
    [41, [48, 53, 57, 60, 67]],                  // Fadd9
    [36, [48, 55, 60, 64, 67]]                   // C
  ];
  var PENT = [74, 77, 79, 81, 84, 86, 89, 91, 93]; // Re minör pentatonik, yüksek oktav (yıldızlar)
  var OSTP = [0, 2, 1, 3, 2, 4, 1, 3];

  function acik() { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } }
  function kaydet(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* sessizce geç */ } }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function kur(c) {
    if (out) return true;
    var K = window.AudioContext || window.webkitAudioContext;
    ac = c || (K ? new K() : null); if (!ac) return false;
    out = ac.createGain(); out.gain.value = 0;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    out.connect(comp); comp.connect(ac.destination);
    // geniş salon yankısı (6 sn), iki kanalda farklı gürültü: ses uzaya yayılır
    rev = ac.createConvolver();
    var len = ac.sampleRate * 6, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    rev.buffer = ir; var rg = ac.createGain(); rg.gain.value = 0.55; rev.connect(rg); rg.connect(out);
    // sağ-sol yankı (ping-pong)
    var merge = ac.createChannelMerger(2), fb = ac.createGain(), lp = ac.createBiquadFilter(), dg = ac.createGain();
    dlyL = ac.createDelay(2); dlyR = ac.createDelay(2); dlyL.delayTime.value = OST * 3; dlyR.delayTime.value = OST * 3;
    fb.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 2200; dg.gain.value = 0.5;
    dlyL.connect(dlyR); dlyR.connect(lp); lp.connect(fb); fb.connect(dlyL);
    dlyL.connect(merge, 0, 0); dlyR.connect(merge, 0, 1); merge.connect(dg); dg.connect(out); dg.connect(rev);
    return true;
  }
  function pan(node, p) { if (!ac.createStereoPanner) return node; var s = ac.createStereoPanner(); s.pan.value = p; node.connect(s); return s; }

  // 1-2. dip sesi ve pad
  function akor(t, c) {
    // akorlar birbirine bindirilir: yeni akor eskisi sönmeden 2,5 sn önce doğrusal olarak açılır, boşluk kalmaz
    var dur = CHORD, rel = 5, ts = Math.max(ac.currentTime, t - 2.5);
    var bo = ac.createOscillator(), bs = ac.createOscillator(), bf = ac.createBiquadFilter(), bg = ac.createGain();
    bo.type = 'sine'; bo.frequency.value = mtof(c[0]); bs.type = 'sawtooth'; bs.frequency.value = mtof(c[0] + 12);
    bf.type = 'lowpass'; bf.frequency.value = 240; bs.connect(bf); bo.connect(bg); bf.connect(bg); bg.connect(out); bg.connect(rev);
    bg.gain.setValueAtTime(0, ts); bg.gain.linearRampToValueAtTime(0.16, t + 0.5); bg.gain.setTargetAtTime(0, t + dur, 1.4);
    [bo, bs].forEach(function (o) { o.start(ts); o.stop(t + dur + rel + 0.1); });
    c[1].forEach(function (m, k) {
      var f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      f.type = 'lowpass'; f.Q.value = 0.8; f.frequency.value = 900; lfo.frequency.value = 0.05 + k * 0.013; lg.gain.value = 450; lfo.connect(lg); lg.connect(f.frequency);
      [-9, 9].forEach(function (dt) { var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt + (Math.random() * 4 - 2); o.connect(f); o.start(ts); o.stop(t + dur + rel + 0.1); });
      var tri = ac.createOscillator(), tg = ac.createGain(); tri.type = 'triangle'; tri.frequency.value = mtof(m + 12); tg.gain.value = 0.35; tri.connect(tg); tg.connect(f); tri.start(ts); tri.stop(t + dur + rel + 0.1);
      f.connect(g); pan(g, (k / (c[1].length - 1)) * 1.2 - 0.6).connect(out); g.connect(rev);
      var v = 0.032 - k * 0.003;
      g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(v, t + 1); g.gain.setTargetAtTime(0, t + dur, 1.6);
      lfo.start(ts); lfo.stop(t + dur + rel + 0.1);
    });
  }
  // 3. ostinato
  function ostinato(t, m, v) {
    var o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m + 12);
    f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.25);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(out); g.connect(dlyL); g.connect(rev);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.start(t); o2.start(t); o.stop(t + 0.75); o2.stop(t + 0.75);
  }
  // 4. yıldız çanı: temel ton + çan kısmisi (2,76 kat)
  function yildiz(t) {
    var m = PENT[Math.floor(Math.random() * PENT.length)], p = Math.random() * 1.6 - 0.8, g = ac.createGain(), pg = pan(g, p);
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(function (h) { var o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.value = mtof(m) * h[0]; og.gain.value = h[1]; o.connect(og); og.connect(g); o.start(t); o.stop(t + 4.2); });
    pg.connect(rev); pg.connect(dlyR); pg.connect(out);
    var v = 0.018 + Math.random() * 0.02;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
  }
  // 5. uzaktan kalp atışı gibi derin vuruş
  function nabiz(t, v) {
    var o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.5);
    o.connect(g); g.connect(out); g.connect(rev); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.start(t); o.stop(t + 1.7);
  }
  // 6. kabarma: filtresi yavaşça açılan büyük akor
  function kabarma(t, c) {
    var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.Q.value = 1.5;
    f.frequency.setValueAtTime(250, t); f.frequency.exponentialRampToValueAtTime(2800, t + CHORD * 0.75); f.frequency.exponentialRampToValueAtTime(400, t + CHORD * 1.3);
    f.connect(g); g.connect(out); g.connect(rev);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.055, t + CHORD * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + CHORD * 1.4);
    [c[0] + 12, c[1][0], c[1][1], c[1][2], c[1][0] + 12].forEach(function (m) {
      [-6, 6].forEach(function (dt) { var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + CHORD * 1.45); });
    });
  }

  function planla(ufuk) {
    while (nextChord < ufuk) {
      var c = CH[ci];
      akor(nextChord, c);
      if (cycle % 4 === 3 && ci === 0) kabarma(nextChord, c);
      say++; ci = (ci + 1) % 4; if (ci === 0) cycle++;
      nextChord += CHORD;
    }
    var ostOn = say >= 2 && cycle % 4 !== 3;            // ilk iki akordan sonra girer, kabarma turunda susar
    while (nextOst < ufuk) {
      if (ostOn) {
        var c2 = CH[(ci + 3) % 4][1], n = OSTP[ostStep % 8];
        ostinato(nextOst, c2[n % c2.length] + 12, ostStep % 8 === 0 ? 0.05 : 0.032);
      }
      ostStep++; nextOst += OST;
    }
    while (nextBeat < ufuk) { if (cycle % 2 === 1) nabiz(nextBeat, 0.22); nextBeat += OST * 8; }
    while (nextStar < ufuk) { yildiz(nextStar); nextStar += 1.1 + Math.random() * 2.6; }
  }
  function tik() { if (running) planla(ac.currentTime + 1.5); }

  function baslat() {
    if (running) return;
    if (!kur()) return;
    if (ac.state === 'suspended') ac.resume();
    running = true;
    var t = ac.currentTime + 0.1;
    nextChord = t; nextOst = t + CHORD * 0.5; nextBeat = t + CHORD; nextStar = t + 2; ostStep = 0;
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0.5, t + 5);
    planla(t + 1.5); timer = setInterval(tik, 250);
    arayuz();
  }
  function durdur() {
    if (!running) return;
    running = false; clearInterval(timer); timer = null;
    var t = ac.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + 1.5);
    // planlanmış notalar susmuş çıkışta biter; yeniden başlarken baştan planlanır
    setTimeout(function () { if (!running && ac) { ac.suspend && ac.suspend(); } }, 1700);
    arayuz();
  }

  var dugme = null;
  function arayuz() {
    if (!dugme) return;
    var on = acik();
    dugme.setAttribute('aria-pressed', String(on));
    dugme.classList.toggle('caliyor', running);
    var y = dugme.querySelector('.muzik-yazi'); if (y) y.textContent = on ? 'Müzik' : 'Müzik kapalı';
    dugme.title = on ? (running ? 'Müzik çalıyor. Kapatmak için tıkla.' : 'Müzik açık: sayfaya ilk dokunuşta başlar.') : 'Müzik kapalı. Açmak için tıkla.';
  }
  function bagla() {
    dugme = document.getElementById('muzikDugme');
    if (dugme) dugme.addEventListener('click', function (e) {
      e.stopPropagation();
      if (acik() && running) { kaydet(false); durdur(); }
      else { kaydet(true); if (ac && ac.state === 'suspended') ac.resume(); baslat(); }
    });
    arayuz();
    // ilk dokunuşta başla (müzik açıksa)
    var ilk = function (e) {
      if (dugme && dugme.contains(e.target)) return;
      document.removeEventListener('pointerdown', ilk, true); document.removeEventListener('keydown', ilk, true);
      if (acik()) baslat();
    };
    document.addEventListener('pointerdown', ilk, true); document.addEventListener('keydown', ilk, true);
    // sekme gizlenince sus, dönünce devam
    document.addEventListener('visibilitychange', function () {
      if (!ac || !running) return;
      if (document.hidden) ac.suspend && ac.suspend(); else { ac.resume && ac.resume(); planla(ac.currentTime + 1.5); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bagla); else bagla();

  // test ve dinleme için: müziği çevrimdışı bir ses bağlamında sn saniye boyunca üretir
  window.UZAY = { _bake: function (c, sn) { kur(c); out.gain.value = 0.5; nextChord = 0.05; nextOst = 0.05 + CHORD * 0.5; nextBeat = CHORD; nextStar = 2; planla(sn); } };
})();
