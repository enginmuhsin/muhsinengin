/* =====================================================================
   DRON 3B — dron3d.js
   Kütüphanesiz, küçük bir 3B dron çizicisi (Canvas 2D).
   - model(p)   : dronu kutu/silindir/kanat yüzeylerinden kurar
   - ciz(...)   : yüzeyleri döndürür, ışıklandırır, uzaktan yakına sıralar
   - Sahne(...) : sürükleyerek çevrilen, kendi kendine dönen etkileşimli sahne
   Bu dosyanın bir kopyası dron-lab/ klasöründe de vardır; değiştirirsen ikisini de güncelle.
   ===================================================================== */
(function (kok) {
  'use strict';
  const PI = Math.PI;

  /* ---------- Renk yardımcıları ---------- */
  const onbellek = {};
  function rgb(c) {
    c = String(c || '#888').trim();
    if (onbellek[c]) return onbellek[c];
    let r = 128, g = 128, b = 128;
    if (c[0] === '#') {
      let h = c.slice(1); if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else { const m = c.match(/[\d.]+/g); if (m) { r = +m[0]; g = +m[1]; b = +m[2]; } }
    return (onbellek[c] = [r, g, b]);
  }
  /* k < 1 koyulaştırır, k > 1 beyaza doğru açar */
  function ton(c, k, a) {
    const [r, g, b] = rgb(c);
    const f = (v) => Math.max(0, Math.min(255, Math.round(k <= 1 ? v * k : v + (255 - v) * (k - 1))));
    return a == null ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${a})`;
  }

  /* ---------- Geometri yapı taşları ---------- */
  function kutu(L, parca, renk, c, s, aci, ek) {
    const ca = Math.cos(aci || 0), sa = Math.sin(aci || 0), v = [];
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) for (const dz of [-1, 1]) {
      const x = dx * s[0], z = dz * s[2];
      v.push([c[0] + x * ca + z * sa, c[1] + dy * s[1], c[2] - x * sa + z * ca]);
    }
    [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]]
      .forEach((f) => L.push(Object.assign({ tip: 'yuz', parca, renk, p: f.map((i) => v[i]) }, ek)));
  }
  function silindir(L, parca, renk, c, r, h, n, ek) {
    n = n || 12; const alt = [], ust = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * PI;
      alt.push([c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)]);
      ust.push([c[0] + r * Math.cos(a), c[1] + h, c[2] + r * Math.sin(a)]);
    }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; L.push(Object.assign({ tip: 'yuz', parca, renk, p: [alt[i], alt[j], ust[j], ust[i]] }, ek)); }
    L.push(Object.assign({ tip: 'yuz', parca, renk: ek && ek.kapak || renk, p: ust }, ek));
    L.push(Object.assign({ tip: 'yuz', parca, renk, p: alt.slice().reverse() }, ek));
  }
  function daire(c, r, n, eksen) {
    const p = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * PI, u = r * Math.cos(a), v = r * Math.sin(a);
      p.push(eksen === 'z' ? [c[0] + u, c[1] + v, c[2]] : [c[0] + u, c[1], c[2] + v]);
    }
    return p;
  }

  /* ---------- Dron modeli ----------
     p.kol     : motor sayısı (4, 6, 8)
     p.L       : merkezden motora uzaklık (birim)
     p.pervane : pervane yarıçapı (birim)
     p.kanat   : kanat sayısı (2, 3)
     p.batarya : batarya boyut çarpanı (≈1)
     p.t       : pervane açısı (her karede artar)
     p.patlat  : 0…1 parçaları dikey ayırır (patlatılmış görünüm)
     r         : renkler { cerceve, plaka, motor, motorUst, pervane, pcb, vtx, batarya, kamera, lens, anten } */
  function model(p, r) {
    const L = [], n = p.kol || 4, kolU = p.L || 1, pr = p.pervane || .5, kn = p.kanat || 2;
    const bs = p.batarya || 1, t = p.t || 0, e = p.patlat || 0, ekP = { parca: 'pervane' };
    const mr = .07 + .05 * Math.min(1.4, pr);
    // Kollar, motorlar ve pervaneler
    for (let i = 0; i < n; i++) {
      const a = PI / n + i * 2 * PI / n, ca = Math.cos(a), sa = Math.sin(a);
      kutu(L, 'cerceve', r.cerceve, [ca * kolU / 2, 0, sa * kolU / 2], [kolU / 2, .022, .045], -a);
      // Motor (gövde + çan)
      const my = .02 + .12 * e;
      silindir(L, 'motor', r.motor, [ca * kolU, my, sa * kolU], mr, .09, 12, { kapak: r.motorUst });
      // Pervane: soluk dönen disk + kanatlar
      const py = my + .13 + .3 * e, c = [ca * kolU, py, sa * kolU], yon = i % 2 ? -1 : 1;
      L.push({ tip: 'disk', parca: 'pervane', renk: r.pervane, p: daire(c, pr, 24), alfa: .1 });
      for (let k = 0; k < kn; k++) {
        const b = t * yon + k * 2 * PI / kn + i, cb = Math.cos(b), sb = Math.sin(b);
        const px = -sb, pz = cb, w0 = .035, w1 = .022, uc = pr * .97, kok = mr * .5;
        L.push(Object.assign({ tip: 'yuz', renk: r.pervane, p: [
          [c[0] + cb * kok + px * w0, c[1] + .012 * yon, c[2] + sb * kok + pz * w0],
          [c[0] + cb * uc + px * w1, c[1] + .006 * yon, c[2] + sb * uc + pz * w1],
          [c[0] + cb * uc - px * w1, c[1] - .006 * yon, c[2] + sb * uc - pz * w1],
          [c[0] + cb * kok - px * w0, c[1] - .012 * yon, c[2] + sb * kok - pz * w0]] }, ekP));
      }
      silindir(L, 'pervane', r.motorUst, [c[0], c[1] - .02, c[2]], .03, .04, 8);
    }
    // Gövde parçaları ayrı listede kurulur, sonra p.govde çarpanıyla ölçeklenir
    const kollar = L.length;
    kutu(L, 'cerceve', r.plaka, [0, 0, 0], [.2, .018, .3]);
    // Ara direkler (alt ve üst plaka arası)
    const ustY = .2 + .55 * e;
    for (const [x, z] of [[-.16, -.24], [.16, -.24], [-.16, .24], [.16, .24]]) L.push({ tip: 'cizgi', parca: 'cerceve', renk: r.cerceve, p: [[x, .02, z], [x, ustY - .015, z]], kalin: 2 });
    // Uçuş kontrol kartı (FC) ve video verici (VTX)
    kutu(L, 'fc', r.pcb, [0, .07 + .22 * e, -.02], [.12, .008, .12]);
    kutu(L, 'fc', r.lens, [0, .085 + .22 * e, -.02], [.035, .008, .035]);
    kutu(L, 'vtx', r.vtx, [0, .13 + .4 * e, -.13], [.09, .007, .08]);
    // Üst plaka
    kutu(L, 'cerceve', r.plaka, [0, ustY, 0], [.17, .015, .27]);
    // Batarya (üstte, kayışla)
    const byk = ustY + .015 + .09 * bs + .4 * e;
    kutu(L, 'batarya', r.batarya, [0, byk, -.01], [.12 * bs, .09 * bs, .23 * bs]);
    kutu(L, 'batarya', r.cerceve, [0, byk, -.01], [.125 * bs, .092 * bs, .03]);
    // Kamera (önde, plakaların arasında) ve lens
    const kz = .29 + .25 * e;
    kutu(L, 'kamera', r.kamera, [0, .11, kz], [.075, .07, .06]);
    L.push({ tip: 'yuz', parca: 'kamera', renk: r.lens, p: daire([0, .11, kz + .061], .045, 14, 'z') });
    L.push({ tip: 'yuz', parca: 'kamera', renk: r.motorUst, p: daire([0, .118, kz + .063], .014, 8, 'z'), parlak: true });
    // Anten (arkada)
    const ay = .2 + .45 * e;
    L.push({ tip: 'cizgi', parca: 'anten', renk: r.anten, p: [[0, ay, -.3], [0, ay + .2, -.44]], kalin: 2.4 });
    silindir(L, 'anten', r.anten, [0, ay + .2, -.44], .035, .07, 8);
    const gv = p.govde || 1;
    if (gv !== 1) for (let i = kollar; i < L.length; i++) L[i].p = L[i].p.map(([x, y, z]) => [x * gv, y * gv, z * gv]);
    return L;
  }

  /* ---------- Tasarım Laboratuvarı girdilerinden ölçekli model ----------
     Birim: 5 inç sınıfında merkezden motora uzaklık (≈110 mm) = 1.
     Kol ≈ 22 mm × sınıf, pervane yarıçapı = çap(inç) × 12,7 mm. Çok motorlu
     tasarımlarda pervaneler çakışmasın diye kol gerekirse uzatılır. */
  function tasarimdan(t) {
    const n = +t.motorSayisi || 4, sinif = +t.cerceveSinif || 5;
    const pr = (+t.pervaneCap || 5) * 12.7 / 110;
    let L = sinif * 22 / 110;
    L = Math.max(L, pr * 1.08 / Math.sin(PI / n), .3);
    const govde = Math.min(1.25, .45 + .11 * sinif);
    const batarya = Math.max(.5, Math.min(1.6, Math.cbrt((+t.bataryaG || 200) / 200) / govde));
    return { kol: n, L, pervane: pr, kanat: +t.kanat || 2, govde, batarya };
  }

  /* ---------- Çizim ---------- */
  function don(p, poz, kam) {
    let [x, y, z] = p; const s = poz.olcek || 1;
    x *= s; y *= s; z *= s;
    if (poz.roll) { const c = Math.cos(poz.roll), n = Math.sin(poz.roll); [x, y] = [x * c - y * n, x * n + y * c]; }
    if (poz.pitch) { const c = Math.cos(poz.pitch), n = Math.sin(poz.pitch); [y, z] = [y * c - z * n, y * n + z * c]; }
    if (poz.yaw) { const c = Math.cos(poz.yaw), n = Math.sin(poz.yaw); [x, z] = [x * c + z * n, -x * n + z * c]; }
    x += poz.x || 0; y += poz.y || 0; z += poz.z || 0;
    { const c = Math.cos(kam.yaw), n = Math.sin(kam.yaw); [x, z] = [x * c + z * n, -x * n + z * c]; }
    { const c = Math.cos(kam.pitch), n = Math.sin(kam.pitch); [y, z] = [y * c - z * n, y * n + z * c]; }
    return [x, y, z];
  }
  const isik = (() => { const v = [-.35, .85, .45], m = Math.hypot(...v); return v.map((x) => x / m); })();

  function ciz(g, prim, kam, poz, sec) {
    sec = sec || {};
    const mes = kam.mesafe || 7, f = kam.f, cx = kam.cx, cy = kam.cy;
    const izd = (q) => { const d = mes - q[2]; return [cx + q[0] * f / d, cy - q[1] * f / d, d]; };
    const liste = [];
    for (const pr of prim) {
      const q = pr.p.map((v) => don(v, poz, kam)), s = q.map(izd);
      let d = 0; s.forEach((v) => { d += v[2]; }); d /= s.length;
      let isikK = 1;
      if (pr.tip === 'yuz' && q.length >= 3) {
        const a = q[0], b = q[1], c = q[2];
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0];
        const m = Math.hypot(nx, ny, nz) || 1; nx /= m; ny /= m; nz /= m;
        const vx = -a[0], vy = -a[1], vz = mes - a[2];
        if (nx * vx + ny * vy + nz * vz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        isikK = .52 + .62 * Math.max(0, nx * isik[0] + ny * isik[1] + nz * isik[2]);
      }
      liste.push({ pr, s, d, isikK });
    }
    liste.sort((a, b) => b.d - a.d);
    const vurgu = sec.vurgu, vRenk = sec.vurguRenk || '#e8562a', nabiz = sec.nabiz == null ? 1 : sec.nabiz;
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const { pr, s, isikK } of liste) {
      const sec2 = vurgu && pr.parca === vurgu, soluk = vurgu && !sec2;
      const renk = sec2 ? vRenk : pr.renk;
      const a0 = sec.alfa == null ? 1 : sec.alfa;
      g.globalAlpha = a0 * (soluk ? .22 : 1) * (pr.alfa == null ? 1 : (sec2 ? Math.max(.35, pr.alfa) : pr.alfa));
      g.beginPath(); s.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])));
      if (pr.tip === 'cizgi') {
        g.strokeStyle = ton(renk, sec2 ? 1.1 : .9); g.lineWidth = (pr.kalin || 1.5) * f / 520; g.stroke();
      } else {
        g.closePath();
        g.fillStyle = pr.parlak ? ton(renk, 1.5) : ton(renk, isikK * (sec2 ? (1 + .12 * nabiz) : 1));
        g.fill();
        if (pr.tip === 'yuz') { g.strokeStyle = ton(renk, isikK * .7, .55); g.lineWidth = .6; g.stroke(); }
        if (sec2 && pr.tip === 'yuz') { g.strokeStyle = ton(vRenk, 1.35, .5 * nabiz); g.lineWidth = 2; g.stroke(); }
      }
    }
    g.globalAlpha = 1;
  }

  /* Zemindeki gölge ve kareli zemin */
  function zeminCiz(g, kam, poz, sec) {
    const mes = kam.mesafe || 7, f = kam.f;
    const izd = (p) => { const q = don(p, { olcek: 1 }, kam), d = mes - q[2]; return [kam.cx + q[0] * f / d, kam.cy - q[1] * f / d, d]; };
    const zy = sec.zeminY;
    if (sec.izgara) {
      g.strokeStyle = sec.izgaraRenk; g.lineWidth = 1;
      for (let i = -6; i <= 6; i++) {
        for (const [a, b] of [[[i * .5, zy, -3], [i * .5, zy, 3]], [[-3, zy, i * .5], [3, zy, i * .5]]]) {
          const A = izd(a), B = izd(b);
          g.globalAlpha = .55 * (1 - Math.abs(i) / 7); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
        }
      }
    }
    // Yumuşak gölge: iç içe, giderek koyulaşan elipsler
    const yuk = Math.max(0, (poz.y || 0) - zy), r0 = (sec.golgeR || 1.2) * (1 + yuk * .2);
    g.fillStyle = sec.golgeRenk || '#000';
    for (const [k, a] of [[1, .035], [.78, .045], [.56, .06], [.36, .07]]) {
      const pts = daire([poz.x || 0, zy, poz.z || 0], r0 * k, 28).map(izd);
      g.globalAlpha = a * Math.max(.35, 1 - yuk * .35);
      g.beginPath(); pts.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
  }

  /* ---------- CSS değişkenlerinden renk paleti ---------- */
  function cssRenk(ad, yedek) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(ad).trim();
    return v || yedek;
  }
  function palet(ozel) {
    const koyu = (() => { const c = rgb(cssRenk('--bg', cssRenk('--kagit', '#f5f7fa'))); return c[0] + c[1] + c[2] < 300; })();
    return Object.assign({
      cerceve: koyu ? '#3a4352' : '#2b313b', plaka: koyu ? '#4a5466' : '#353c48',
      motor: '#7d8794', motorUst: '#c9d0d8', pervane: cssRenk('--c2', '#d1450b'),
      pcb: '#1f8a4c', vtx: '#2c5aa0', batarya: cssRenk('--c4', '#6c45e0'),
      kamera: '#1c1f24', lens: '#0b0d10', anten: '#b23a2e',
      izgara: cssRenk('--grid', '#d0d6de'), vurgu: cssRenk('--accent', '#0a5cc7'),
    }, ozel || {});
  }

  /* ---------- Etkileşimli sahne ---------- */
  function Sahne(tuval, ayar) {
    ayar = ayar || {};
    const g = tuval.getContext('2d');
    const az = matchMedia('(prefers-reduced-motion: reduce)');
    const d = {
      yaw: ayar.yaw == null ? .7 : ayar.yaw, pitch: ayar.pitch == null ? .42 : ayar.pitch,
      vYaw: 0, surukle: null, t: 0, zaman: 0,
      model: Object.assign({ kol: 4, L: 1, pervane: .5, kanat: 2, batarya: 1 }, ayar.model),
      vurgu: null, patlat: 0, hedefPatlat: 0, ucuyor: ayar.ucuyor !== false, hiz: 1,
      gorunur: true, W: 0, H: 0, oran: 1, renkOzel: ayar.renkler || null,
    };
    function boyut() {
      const r = tuval.getBoundingClientRect(); d.oran = Math.min(devicePixelRatio || 1, 2);
      d.W = r.width; d.H = r.height; tuval.width = d.W * d.oran; tuval.height = d.H * d.oran;
      g.setTransform(d.oran, 0, 0, d.oran, 0, 0);
    }
    function kare() {
      if (!d.W) return;
      g.clearRect(0, 0, d.W, d.H);
      const r = palet(d.renkOzel), m = d.model;
      const kapsam = (m.L + m.pervane) + .3, olcek = (ayar.olcek || 2.3) / kapsam;
      const kam = { yaw: d.yaw, pitch: d.pitch, mesafe: 7, f: Math.min(d.W, d.H * 1.25) * (ayar.yakinlik || 1.35), cx: d.W / 2, cy: d.H * (ayar.merkezY || .55) };
      const zy = -.55;
      const poz = { olcek, y: d.ucuyor ? .18 + .06 * Math.sin(d.zaman * 1.7) : zy + .03, roll: d.ucuyor ? .04 * Math.sin(d.zaman * .9) : 0, pitch: d.ucuyor ? .03 * Math.sin(d.zaman * 1.3) : 0 };
      zeminCiz(g, kam, poz, { zeminY: zy, izgara: ayar.izgara !== false, izgaraRenk: r.izgara, golgeR: kapsam * olcek * .62, golgeRenk: '#000' });
      const prim = model(Object.assign({}, m, { t: d.t, patlat: d.patlat }), r);
      ciz(g, prim, kam, poz, { vurgu: d.vurgu, vurguRenk: r.vurgu, nabiz: .5 + .5 * Math.sin(d.zaman * 5) });
    }
    let son = 0;
    function dongu(zm) {
      const dt = Math.min(.05, (zm - (son || zm)) / 1000); son = zm;
      if (d.gorunur) {
        d.zaman += dt;
        const hareket = !az.matches;
        if (!d.surukle) { d.yaw += d.vYaw; d.vYaw *= .94; if (hareket && Math.abs(d.vYaw) < .002 && ayar.otomatik !== false) d.yaw += .25 * dt; }
        if (hareket) d.t += dt * (d.ucuyor ? 38 : 6) * d.hiz;
        d.patlat += (d.hedefPatlat - d.patlat) * Math.min(1, dt * 6);
        kare();
      }
      requestAnimationFrame(dongu);
    }
    tuval.style.touchAction = 'pan-y'; tuval.style.cursor = 'grab';
    tuval.addEventListener('pointerdown', (e) => { d.surukle = { x: e.clientX, y: e.clientY }; tuval.setPointerCapture(e.pointerId); tuval.style.cursor = 'grabbing'; });
    tuval.addEventListener('pointermove', (e) => {
      if (!d.surukle) return;
      const dx = e.clientX - d.surukle.x, dy = e.clientY - d.surukle.y;
      d.yaw += dx * .01; d.pitch = Math.max(.05, Math.min(1.25, d.pitch + dy * .006)); d.vYaw = dx * .002;
      d.surukle = { x: e.clientX, y: e.clientY };
    });
    const birak = () => { d.surukle = null; tuval.style.cursor = 'grab'; };
    tuval.addEventListener('pointerup', birak); tuval.addEventListener('pointercancel', birak);
    new ResizeObserver(() => { boyut(); kare(); }).observe(tuval);
    if ('IntersectionObserver' in window) new IntersectionObserver((g2) => { d.gorunur = g2[0].isIntersecting; }).observe(tuval);
    boyut(); requestAnimationFrame(dongu);
    return {
      ayarla(m) { Object.assign(d.model, m); },
      vurgula(ad) { d.vurgu = ad || null; },
      patlat(v) { d.hedefPatlat = v; },
      ucus(v) { d.ucuyor = !!v; },
      hiz(v) { d.hiz = v; },
      renkler(r) { d.renkOzel = r; },
    };
  }

  kok.Dron3D = { model, ciz, zeminCiz, palet, Sahne, ton, tasarimdan };
})(window);
