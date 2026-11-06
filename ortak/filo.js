/* =====================================================================
   FİLO — ana sayfadaki "dron gezintisi" için ayrıntılı dron çizicisi
   Kütüphanesiz, Canvas 2D. Dron3D'den ayrı tutuldu: dron3d.js'nin
   dron-lab/ kopyası etkilenmesin.

   Üç tip (hepsi Uçuş Simülatörü'ndeki marka diliyle):
     gezgin  : kameralı gezi dronu. İnci beyazı kabuk, karbon şasi,
               turuncu yan şerit, logolu akıllı batarya, gimbal kamera, kızak.
     yarisci : FPV yarış dronu. Açık karbon X çerçeve, üç kanatlı turuncu
               pervane, üstte aksiyon kamerası, V anten, gece alt LED'i.
     kargo   : altı rotorlu teslimat dronu. Geniş kabuk, mürekkep mavisi
               şerit, ipte sallanan logolu koli.

   Ciz(g, tip, d) → çizer ve ekrandaki sınır kutusunu döndürür.
     d = { x, y          : ekrandaki merkez (px)
           olcek         : model biriminin piksel karşılığı
           yaw, pitch, roll
           t             : zaman (s), pervane ve ip salınımı için
           kamPitch      : bakış eğimi (rad, + = yukarıdan)
           isik          : [x,y,z] ışık yönü (dünya), ton: [r,g,b] 0..1 ışık rengi
           gece          : 0..1 (seyir ışıkları ve parıltı)
           logo          : yüklenmiş logo görseli (yoksa çıkartma çizilmez) }
   ===================================================================== */
(function (kok) {
  'use strict';
  const PI = Math.PI, cos = Math.cos, sin = Math.sin;

  const onbellek = {};
  function rgb(c) {
    if (onbellek[c]) return onbellek[c];
    const n = parseInt(c.slice(1), 16);
    return (onbellek[c] = [n >> 16, (n >> 8) & 255, n & 255]);
  }

  /* ---------- Malzemeler: renk + parlaklık (spek) + sertlik ---------- */
  const M = {
    inci:    { renk: '#e7ecf2', spek: .55, sert: 26 },
    inciKoyu:{ renk: '#cfd6df', spek: .4, sert: 20 },
    karbon:  { renk: '#2b3038', spek: .38, sert: 40 },
    grafit:  { renk: '#1c2027', spek: .14, sert: 10 },
    metal:   { renk: '#b9c1cb', spek: .95, sert: 55 },
    turuncu: { renk: '#e8771a', spek: .55, sert: 30 },
    tpu:     { renk: '#f08a24', spek: .2, sert: 12 },
    lens:    { renk: '#0d1838', spek: 1, sert: 90 },
    murekkep:{ renk: '#1d3b8b', spek: .45, sert: 30 },
    karton:  { renk: '#c99c5f', spek: .05, sert: 6 },
    bant:    { renk: '#ece0c4', spek: .2, sert: 10 },
    pOn:     { renk: '#ea6a12', spek: .35, sert: 24 },
    pArka:   { renk: '#ccd3dc', spek: .35, sert: 24 },
    pYaris:  { renk: '#ff7a1a', spek: .45, sert: 30 },
    seritT:  { renk: '#ff9a3c', isik: 1 },
    seritM:  { renk: '#4f7fe8', isik: 1 },
    yesil:   { renk: '#3ddc97', isik: 1 },
    kirmizi: { renk: '#ff4d5e', isik: 1 },
    beyazLed:{ renk: '#e8f4ff', isik: 1 },
  };

  /* ---------- Geometri yapı taşları (model birimi: kol uzunluğu = 1, ön = +z) ---------- */
  const ekle = (L, p, m, ek) => L.push(Object.assign({ tip: 'yuz', p, m }, ek));
  const topla = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  function dik(d) {                // d'ye dik iki birim vektör
    const a = Math.abs(d[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
    let u = [d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]];
    const m = Math.hypot(...u); u = u.map((x) => x / m);
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    return [u, v];
  }
  // Eksen yönü d olan silindir (c taban merkezi). kapak: üst kapağın malzemesi
  function silindir(L, m, c, d, r, h, n, kapak, r2) {
    { const k = Math.hypot(d[0], d[1], d[2]); d = d.map((x) => x / k); }
    const [u, v] = dik(d), alt = [], ust = [], r1 = r, rU = r2 == null ? r : r2;
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * PI, ca = cos(a), sa = sin(a);
      alt.push(topla(c, [u[0] * ca + v[0] * sa, u[1] * ca + v[1] * sa, u[2] * ca + v[2] * sa], r1));
      ust.push(topla(topla(c, d, h), [u[0] * ca + v[0] * sa, u[1] * ca + v[1] * sa, u[2] * ca + v[2] * sa], rU));
    }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; ekle(L, [alt[i], alt[j], ust[j], ust[i]], m); }
    ekle(L, ust, kapak || m); ekle(L, alt.slice().reverse(), m);
  }
  // Köşeleri pahlı kutu (yukarıdan sekizgen)
  function prizma(L, m, c, s, pah, aci) {
    const ca = cos(aci || 0), sa = sin(aci || 0), x = s[0], z = s[2], p = Math.min(pah, x * .9, z * .9);
    const halka = [[-x + p, -z], [x - p, -z], [x, -z + p], [x, z - p], [x - p, z], [-x + p, z], [-x, z - p], [-x, -z + p]]
      .map(([a, b]) => [a * ca + b * sa, -a * sa + b * ca]);
    const ust = halka.map(([a, b]) => [c[0] + a, c[1] + s[1], c[2] + b]), alt = halka.map(([a, b]) => [c[0] + a, c[1] - s[1], c[2] + b]);
    for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; ekle(L, [alt[i], alt[j], ust[j], ust[i]], m); }
    ekle(L, ust, m); ekle(L, alt.slice().reverse(), m);
    return ust;
  }
  // Üst yarım elipsoit (kabuk)
  function kubbe(L, m, c, r, nU, nE) {
    const nokta = (i, j) => { const a = i / nU * 2 * PI, e = j / nE * PI / 2; return [c[0] + r[0] * cos(e) * sin(a), c[1] + r[1] * sin(e), c[2] + r[2] * cos(e) * cos(a)]; };
    for (let j = 0; j < nE; j++) for (let i = 0; i < nU; i++) {
      const p = [nokta(i, j), nokta(i + 1, j), nokta(i + 1, j + 1), nokta(i, j + 1)];
      if (j === nE - 1) p.pop();
      ekle(L, p, m);
    }
  }
  function kure(L, m, c, r, nU, nE) {
    const nokta = (i, j) => { const a = i / nU * 2 * PI, e = -PI / 2 + j / nE * PI; return [c[0] + r * cos(e) * sin(a), c[1] + r * sin(e), c[2] + r * cos(e) * cos(a)]; };
    for (let j = 0; j < nE; j++) for (let i = 0; i < nU; i++) ekle(L, [nokta(i, j), nokta(i + 1, j), nokta(i + 1, j + 1), nokta(i, j + 1)], m);
  }
  // A'dan B'ye incelen kol (y yüksekliğinde, w0 → w1 genişlik, kalınlık k)
  function kol(L, m, A, B, w0, w1, k) {
    const dx = B[0] - A[0], dz = B[2] - A[2], l = Math.hypot(dx, dz), px = -dz / l, pz = dx / l;
    const P = (Q, w, y) => [Q[0] + px * w, Q[1] + y, Q[2] + pz * w];
    const v = [P(A, -w0, -k), P(A, w0, -k), P(B, w1, -k), P(B, -w1, -k), P(A, -w0, k), P(A, w0, k), P(B, w1, k), P(B, -w1, k)];
    [[4, 5, 6, 7], [3, 2, 1, 0], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].forEach((f) => ekle(L, f.map((i) => v[i]), m));
  }
  const daire = (c, r, n) => Array.from({ length: n }, (_, i) => [c[0] + r * cos(i / n * 2 * PI), c[1], c[2] + r * sin(i / n * 2 * PI)]);
  // Motor + pervane. on: ön kol mu (renk ve seyir ışığı için)
  function rotor(L, I, c, r, kn, t, yon, mP, nav, tip) {
    const yaris = tip === 'yarisci';
    silindir(L, M.grafit, c, [0, 1, 0], yaris ? .085 : .08, .045, 14);
    silindir(L, M.metal, [c[0], c[1] + .045, c[2]], [0, 1, 0], yaris ? .08 : .074, .07, 16, M.metal);
    silindir(L, yaris ? M.turuncu : M.turuncu, [c[0], c[1] + .115, c[2]], [0, 1, 0], .045, .03, 12, M.turuncu, .03);
    if (nav) {
      L.push({ tip: 'halka', p: daire([c[0], c[1] + .004, c[2]], .09, 20), m: nav, kalin: 1.6 });
      I.push({ p: [c[0], c[1] + .01, c[2]], renk: nav.renk, r: .26 });
    }
    // pervane: dönen disk (bulanıklık) + kanatlar
    const py = c[1] + .155, m = [c[0], py, c[2]];
    L.push({ tip: 'disk', p: daire(m, r, 28), m: mP, alfa: .13 });
    L.push({ tip: 'halka', p: daire([m[0], py + .001, m[2]], r * .97, 28), m: mP, kalin: 1, alfa: .28 });
    for (let k = 0; k < kn; k++) {
      const b = t * yon * 31 + k * 2 * PI / kn, cb = cos(b), sb = sin(b), px = -sb, pz = cb;
      // hava folyosu: kökte dar, ortada geniş, uçta yuvarlak
      const o = [[.1, -.04], [.38, -.12], [.78, -.1], [.97, -.03], [.99, .02], [.72, .07], [.36, .065], [.1, .035]];
      ekle(L, o.map(([a, w]) => [m[0] + cb * a * r + px * w * r * (yaris ? 1.25 : 1), py + .01 * yon * (1 - a), m[2] + sb * a * r + pz * w * r * (yaris ? 1.25 : 1)]), mP, { alfa: .78 });
    }
    silindir(L, M.metal, [m[0], py - .005, m[2]], [0, 1, 0], .03, .035, 8, M.metal);
  }
  const resim = (L, p0, u, v, ek) => L.push(Object.assign({ tip: 'resim', p: [p0, topla(p0, u), topla(topla(p0, u), v), topla(p0, v)] }, ek));

  /* ---------- Modeller ---------- */
  function gezgin(t) {
    const L = [], I = [];
    prizma(L, M.karbon, [0, .09, 0], [.3, .06, .47], .1);                      // karbon alt şasi
    for (const s of [-1, 1]) prizma(L, M.seritT, [s * .3, .09, -.02], [.008, .008, .27], 0);   // yan ışık şeritleri
    kubbe(L, M.inci, [0, .145, 0], [.3, .13, .5], 16, 4);                         // inci beyazı kabuk
    const ust = prizma(L, M.grafit, [0, .3, -.04], [.18, .05, .25], .06);       // akıllı batarya
    resim(L, [-.15, .352, .12], [.3, 0, 0], [0, 0, -.3], { logo: 1 });           // logo çıkartması
    for (let i = 0; i < 4; i++) { prizma(L, M.beyazLed, [(i - 1.5) * .06, .3, -.292], [.02, .007, .004], 0); }
    I.push({ p: [0, .3, -.3], renk: '#e8f4ff', r: .28, led: 1 });
    // gimbal kamera
    prizma(L, M.grafit, [0, .1, .47], [.09, .016, .03], .01);
    kure(L, M.karbon, [0, .04, .52], .075, 10, 6);
    silindir(L, M.lens, [0, .04, .58], [0, 0, 1], .046, .025, 16, M.lens, .042);
    L.push({ tip: 'halka', p: Array.from({ length: 16 }, (_, i) => [.048 * cos(i / 16 * 2 * PI), .04 + .048 * sin(i / 16 * 2 * PI), .607]), m: M.turuncu, kalin: 1.6 });
    // kızaklar
    for (const s of [-1, 1]) {
      silindir(L, M.grafit, [s * .25, -.24, -.38], [0, 0, 1], .016, .76, 8);
      for (const z of [-.22, .22]) L.push({ tip: 'cizgi', p: [[s * .25, -.24, z], [s * .19, .06, z]], m: M.grafit, kalin: 2.2 });
    }
    // kollar ve rotorlar (X düzeni)
    for (let i = 0; i < 4; i++) {
      const a = (i + .5) / 4 * 2 * PI, x = sin(a), z = cos(a), on = z > 0;
      kol(L, M.karbon, [x * .17, .06, z * .17], [x, .06, z], .085, .05, .018);
      rotor(L, I, [x, .075, z], .5, 2, t, i % 2 ? 1 : -1, on ? M.pOn : M.pArka, on ? M.yesil : M.kirmizi);
    }
    I.push({ p: [0, -.02, 0], renk: '#ffffff', r: .55, flas: 1 });            // alt çakar
    return { L, I, yaricap: 1.55 };
  }

  function yarisci(t) {
    const L = [], I = [];
    prizma(L, M.karbon, [0, .03, 0], [.13, .012, .3], .05);                       // alt plaka
    prizma(L, M.karbon, [0, .17, -.01], [.11, .01, .24], .04);                    // üst plaka
    for (const [x, z] of [[-.09, -.2], [.09, -.2], [-.09, .17], [.09, .17]]) L.push({ tip: 'cizgi', p: [[x, .04, z], [x, .16, z]], m: M.metal, kalin: 1.6 });
    prizma(L, M.tpu, [-.11, .1, .24], [.012, .06, .05], .01); prizma(L, M.tpu, [.11, .1, .24], [.012, .06, .05], .01);
    prizma(L, M.grafit, [0, .1, .26], [.07, .055, .045], .015);                   // FPV kamera
    silindir(L, M.lens, [0, .1, .3], [0, -.35, 1], .036, .03, 14, M.lens, .032);
    prizma(L, M.grafit, [0, .29, -.03], [.09, .065, .2], .04);                    // batarya, kayışla
    prizma(L, M.tpu, [0, .29, -.03], [.095, .068, .018], 0);
    resim(L, [-.075, .357, .12], [.15, 0, 0], [0, 0, -.15], { logo: 1 });
    prizma(L, M.grafit, [0, .225, .2], [.06, .045, .05], .015);                  // aksiyon kamerası
    silindir(L, M.lens, [0, .225, .25], [0, 0, 1], .03, .02, 12, M.lens);
    for (const s of [-1, 1]) {                                                   // V anten
      L.push({ tip: 'cizgi', p: [[s * .03, .18, -.24], [s * .14, .34, -.36]], m: M.grafit, kalin: 1.6 });
      silindir(L, M.tpu, [s * .14, .34, -.36], [s * .55, .7, -.45], .02, .05, 6);
    }
    L.push({ tip: 'cizgi', p: [[.04, .22, -.2], [.1, .12, -.32]], m: { renk: '#e9c02a' }, kalin: 1.6 });   // XT60 kablosu
    for (let i = 0; i < 4; i++) {
      const a = (i + .5) / 4 * 2 * PI, x = sin(a) * .95, z = cos(a) * .95;
      kol(L, M.karbon, [0, .03, 0], [x, .03, z], .06, .055, .012);
      rotor(L, I, [x, .045, z], .44, 3, t * 1.4, i % 2 ? 1 : -1, M.pYaris, null, 'yarisci');
    }
    I.push({ p: [0, -.01, 0], renk: '#3fd8ff', r: .9, alt: 1 });                // alt LED şeridi
    I.push({ p: [0, .1, .32], renk: '#ff4d5e', r: .18, flas: 2 });               // kayıt ışığı
    return { L, I, yaricap: 1.4 };
  }

  function kargo(t) {
    const L = [], I = [];
    prizma(L, M.karbon, [0, .1, 0], [.36, .06, .36], .14);
    kubbe(L, M.inci, [0, .155, 0], [.38, .16, .38], 18, 4);
    L.push({ tip: 'halka', p: daire([0, .16, 0], .385, 24), m: M.murekkep, kalin: 3 });
    prizma(L, M.murekkep, [0, .33, 0], [.12, .02, .12], .05);
    resim(L, [-.1, .352, .1], [.2, 0, 0], [0, 0, -.2], { logo: 1 });
    I.push({ p: [0, .36, 0], renk: '#ffb04a', r: .35, flas: 3 });               // tepe çakarı
    // iniş ayakları
    for (const [x, z] of [[-.28, -.28], [.28, -.28], [-.28, .28], [.28, .28]]) L.push({ tip: 'cizgi', p: [[x * .8, .06, z * .8], [x * 1.25, -.32, z * 1.25]], m: M.inciKoyu, kalin: 2.6 });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * 2 * PI + PI / 6, x = sin(a), z = cos(a), on = z > .3;
      silindir(L, M.inciKoyu, [x * .3, .09, z * .3], [x * .7 / .7, 0, z], .028, .72, 8);
      rotor(L, I, [x, .075, z], .46, 2, t * .8, i % 2 ? 1 : -1, on ? M.pOn : M.pArka, on ? M.yesil : (z < -.3 ? M.kirmizi : null));
    }
    // vinç ipi ve koli: sarkaç gibi salınır
    const boy = .85, s = .16 * sin(t * 1.25) + .05 * sin(t * 3.1), s2 = .08 * sin(t * .9 + 1);
    const uc = [boy * sin(s), .04 - boy * cos(s) * cos(s2), boy * sin(s2)];
    L.push({ tip: 'cizgi', p: [[0, .04, 0], uc], m: { renk: '#d9dee5' }, kalin: 1.1 });
    const k = .16, c = [uc[0], uc[1] - k, uc[2]];
    prizma(L, M.karton, c, [k, k, k], .015);
    prizma(L, M.bant, [c[0], c[1] + k * .02, c[2]], [k * .2, k * 1.01, k * 1.01], 0);
    resim(L, [c[0] + k * .62, c[1] + k * .55, c[2] + k + .003], [-k * 1.24, 0, 0], [0, -k * 1.1, 0], { logo: 1 });   // ön yüz
    resim(L, [c[0] - k * .62, c[1] + k * .55, c[2] - k - .003], [k * 1.24, 0, 0], [0, -k * 1.1, 0], { logo: 1 });    // arka yüz
    return { L, I, yaricap: 1.5, sarkac: uc };
  }
  const MODEL = { gezgin, yarisci, kargo };

  /* ---------- Döndürme ve izdüşüm ---------- */
  function don(p, d) {
    let [x, y, z] = p;
    if (d.roll) { const c = cos(d.roll), n = sin(d.roll); [x, y] = [x * c - y * n, x * n + y * c]; }
    if (d.pitch) { const c = cos(d.pitch), n = sin(d.pitch); [y, z] = [y * c - z * n, y * n + z * c]; }
    if (d.yaw) { const c = cos(d.yaw), n = sin(d.yaw); [x, z] = [x * c + z * n, -x * n + z * c]; }
    const c = cos(d.kamPitch), n = sin(d.kamPitch); [y, z] = [y * c - z * n, y * n + z * c];
    return [x, y, z];
  }
  const MES = 7;   // bakış uzaklığı (model birimi): hafif perspektif
  const izd = (q, d) => { const k = MES / (MES - q[2]); return [d.x + q[0] * d.olcek * k, d.y - q[1] * d.olcek * k, MES - q[2]]; };

  function boya(m, isikK, spek, ton, ek) {
    const c = rgb(m.renk);
    if (m.isik) return `rgb(${c[0]},${c[1]},${c[2]})`;
    const f = (i) => Math.max(0, Math.min(255, Math.round(c[i] * isikK * ton[i] + 255 * spek * (.55 + .45 * ton[i]) + (ek || 0))));
    return `rgb(${f(0)},${f(1)},${f(2)})`;
  }

  function ciz(g, tip, d) {
    const mdl = MODEL[tip](d.t || 0), ton = d.ton || [1, 1, 1];
    // ışık yönü: dünya → bakış uzayı (yalnız kamera eğimi)
    let Lv = d.isik || [-.4, .85, .35]; { const m = Math.hypot(...Lv); Lv = Lv.map((v) => v / m); const c = cos(d.kamPitch), n = sin(d.kamPitch); Lv = [Lv[0], Lv[1] * c - Lv[2] * n, Lv[1] * n + Lv[2] * c]; }
    const H = [Lv[0], Lv[1], Lv[2] + 1].map((v, _, a) => v / Math.hypot(a[0], a[1], a[2]));
    const liste = [];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const pr of mdl.L) {
      const q = pr.p.map((v) => don(v, d)), s = q.map((v) => izd(v, d));
      let dd = 0; for (const v of s) { dd += v[2]; if (v[0] < x0) x0 = v[0]; if (v[0] > x1) x1 = v[0]; if (v[1] < y0) y0 = v[1]; if (v[1] > y1) y1 = v[1]; }
      dd /= s.length;
      let isikK = 1, spek = 0, onYuz = true;
      if (q.length >= 3) {
        const a = q[0], b = q[1], c = q[2], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0];
        const m = Math.hypot(nx, ny, nz) || 1; nx /= m; ny /= m; nz /= m;
        onYuz = nz >= 0;
        if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const nl = nx * Lv[0] + ny * Lv[1] + nz * Lv[2];
        isikK = .42 + .68 * Math.max(0, nl);
        if (pr.m && pr.m.spek) spek = pr.m.spek * Math.pow(Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]), pr.m.sert || 20) * (nl > 0 ? 1 : 0);
      }
      if (pr.tip === 'resim') dd -= .08;   // yüzeyin üstünde kalsın
      liste.push({ pr, s, dd, isikK, spek, onYuz });
    }
    liste.sort((a, b) => b.dd - a.dd);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const pikselK = d.olcek / 60;
    for (const { pr, s, isikK, spek, onYuz } of liste) {
      g.globalAlpha = pr.alfa == null ? 1 : pr.alfa;
      if (pr.tip === 'resim') {
        if (!d.logo || !onYuz) continue;
        let [A, B, , D] = s;
        // ekranda aynalanmışsa (arkadan bakış) görseli yatayda çevir: yazı her açıdan doğru okunur
        if ((B[0] - A[0]) * (D[1] - A[1]) - (B[1] - A[1]) * (D[0] - A[0]) < 0) { const C = s[2]; [A, B, D] = [B, A, C]; }
        g.save(); g.globalAlpha = .55 + .45 * Math.min(1, isikK);
        g.transform(B[0] - A[0], B[1] - A[1], D[0] - A[0], D[1] - A[1], A[0], A[1]);
        g.drawImage(d.logo, 0, 0, 1, 1); g.restore(); continue;
      }
      g.beginPath(); s.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])));
      if (pr.tip === 'cizgi') { g.strokeStyle = boya(pr.m, .8, 0, ton); g.lineWidth = Math.max(.6, (pr.kalin || 1.5) * pikselK); g.stroke(); continue; }
      if (pr.tip === 'halka') { g.closePath(); g.strokeStyle = boya(pr.m, 1, 0, ton); g.lineWidth = Math.max(.5, (pr.kalin || 1) * pikselK); g.stroke(); continue; }
      g.closePath();
      g.fillStyle = boya(pr.m, isikK, spek, ton); g.fill();
      if (pr.tip === 'yuz' && !pr.m.isik) { g.strokeStyle = g.fillStyle; g.lineWidth = .5; g.stroke(); }   // dikiş boşluklarını kapatır
    }
    g.globalAlpha = 1;
    // gece: seyir ışıkları, çakarlar ve LED parıltısı
    if (d.gece > .05) {
      g.globalCompositeOperation = 'lighter';
      for (const l of mdl.I) {
        if (l.flas === 1 && (d.t * 1.1) % 1 > .08) continue;
        if (l.flas === 2 && Math.floor(d.t * 2) % 2) continue;
        if (l.flas === 3 && (d.t * .8) % 1 > .12) continue;
        const q = izd(don(l.p, d), d), r = l.r * d.olcek * (l.alt ? 1 : .6), c = rgb(l.renk);
        const gl = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], r);
        const a = d.gece * (l.alt ? .3 : l.led ? .45 : .6);
        gl.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`); gl.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        g.fillStyle = gl;
        if (l.alt) { g.save(); g.translate(q[0], q[1]); g.scale(1, .35); g.translate(-q[0], -q[1]); g.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r); g.restore(); }
        else g.fillRect(q[0] - r, q[1] - r, 2 * r, 2 * r);
      }
      g.globalCompositeOperation = 'source-over';
    }
    return { x0, y0, x1, y1, sarkac: mdl.sarkac ? izd(don(mdl.sarkac, d), d) : null };
  }

  /* ---------- Logo: ortak/imza-koyu.svg (simülatördeki dronlarla aynı çıkartma) ---------- */
  let logo = null;
  function logoYukle(adres) {
    if (logo) return logo;
    logo = { hazir: false, img: null };
    fetch(adres).then((r) => (r.ok ? r.text() : Promise.reject())).then((t) => {
      const url = URL.createObjectURL(new Blob([t.replace('<svg ', '<svg width="256" height="256" ')], { type: 'image/svg+xml' }));
      const im = new Image();
      im.onload = () => {
        // kare tuvale, kenarda koruma boşluğu bırakarak çiz (çapraz dönüşümde netlik için)
        const c = document.createElement('canvas'); c.width = c.height = 256;
        c.getContext('2d').drawImage(im, 24, 24, 208, 208);
        logo.img = c; logo.hazir = true; URL.revokeObjectURL(url);
      };
      im.src = url;
    }).catch(() => {});
    return logo;
  }

  kok.Filo = { ciz, logoYukle, tipler: Object.keys(MODEL) };
})(window);
