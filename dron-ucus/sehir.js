/* =====================================================================
   ŞEHİR MERKEZİ — Uçuş Simülatörü
   Öğrenci ve öğretmen önerisi (Kasım 2026): "sadece okul ve etrafındaki evler
   olmasın; arabalar çok ilkel; içinde kaybolunabilecek metropol gibi bir şehir."

   Okulun kuzeyinde, ızgara düzeninde bir şehir merkezi:
     • 4 cadde (doğu-batı) ve 5 bulvar (kuzey-güney), kaldırımlar, yaya geçitleri
     • merkeze doğru yükselen gökdelenler, ofis blokları, renkli apartmanlar;
       bloklar arasında dar ara sokaklar (kaybolmak serbest!)
     • zemin katlarda tabelalı dükkânlar (eczane, fırın, kırtasiye…)
     • Gençlik Parkı (gölet, ağaçlar), Cumhuriyet Meydanı (fıskiye),
       çatısında helikopter pisti olan hastane, televizyon kulesi
     • park etmiş ve caddelerde akan arabalar (sedan, SUV, hatchback, taksi, minibüs)
     • gece: pencereler, tabelalar, farlar, sokak lambaları ve uçak ikaz ışıkları yanar

   Okuldaki akıllı tahtalar yavaş olabilir: binalar malzemeye göre birleştirilir
   (birkaç çizim çağrısı), arabalar ve lambalar InstancedMesh ile çizilir.
   Binalar KUTULAR'a eklenir: çarpılabilir, çatılarına inilebilir.
   Ana betikten ÖNCE yüklenir; SEHIR.kur() kasabadan sonra çağrılır.
   ===================================================================== */
(function () {
  'use strict';
  const S = {};
  const ALAN = { x0: -158, x1: 122, z0: 36, z1: 230 };
  const EW = [44, 100, 156, 212];               // caddeler (z)
  const NS = [-130, -66, -10, 50, 110];         // bulvarlar (x)
  const YG = 12, KALD = 3;                      // yol genişliği, kaldırım
  const MERKEZ = { x: 20, z: 170 };
  S.icinde = (x, z, p = 0) => x > ALAN.x0 - p && x < ALAN.x1 + p && z > ALAN.z0 - p && z < ALAN.z1 + p;
  let tohum = 20261115; const rnd = () => (tohum = (tohum * 16807) % 2147483647) / 2147483647;
  const sec = (a) => a[Math.floor(rnd() * a.length)];

  /* ---------- dokular ---------- */
  function doku(w, h, ciz) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); ciz(x, w, h);
    const d = new THREE.CanvasTexture(c); d.encoding = THREE.sRGBEncoding; d.wrapS = d.wrapT = THREE.RepeatWrapping;
    d.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return d;
  }
  // 8 bölme × 8 kat; her hücre 3 m × 3 m. emis: gece yanan pencereler
  function cephe(tur, renk) {
    const N = 8, C = 32, isik = [];
    for (let i = 0; i < N * N; i++) isik.push(rnd() < (tur === 'kule' ? 0.26 : 0.22) ? (rnd() < 0.7 ? '#ffd9a0' : '#d9e8ff') : null);
    const pencere = (x, i, j, gx, gy, gw, gh) => {
      if (tur === 'kule') {
        const gr = x.createLinearGradient(0, j * C, 0, j * C + C); gr.addColorStop(0, '#5f88ab'); gr.addColorStop(1, '#2b4b69');
        x.fillStyle = gr; x.fillRect(i * C, j * C, C, C);
        x.fillStyle = '#c9d3dc'; x.fillRect(i * C, j * C, 2, C); x.fillRect(i * C, j * C + C - 3, C, 3);
        if (j % 4 === 3) { x.fillStyle = 'rgba(30,40,50,.35)'; x.fillRect(i * C, j * C + C - 7, C, 4); }
      } else if (tur === 'ofis') {
        x.fillStyle = '#cfcbc3'; x.fillRect(i * C, j * C, C, C);
        x.fillStyle = '#34414e'; x.fillRect(i * C, j * C + 8, C, 17);
        x.fillStyle = '#e6e2da'; x.fillRect(i * C + C - 3, j * C, 3, C);
      } else {
        x.fillStyle = renk; x.fillRect(i * C, j * C, C, C);
        x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(i * C, j * C + C - 2, C, 2);
        x.fillStyle = '#f4f1ea'; x.fillRect(i * C + gx - 2, j * C + gy - 2, gw + 4, gh + 4);
        x.fillStyle = '#3b4a5c'; x.fillRect(i * C + gx, j * C + gy, gw, gh);
        x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(i * C + gx + 1, j * C + gy + 1, gw / 2 - 1, gh - 2);
        if ((i + (j >> 1)) % 3 === 0) {   // balkon: döşeme + korkuluk
          x.fillStyle = 'rgba(70,60,50,.35)'; x.fillRect(i * C + 2, j * C + gy + gh - 2, C - 4, 5);
          x.fillStyle = '#7d858f'; for (let k = 3; k < C - 3; k += 3) x.fillRect(i * C + k, j * C + gy + gh - 8, 1, 7);
          x.fillRect(i * C + 2, j * C + gy + gh - 9, C - 4, 1);
        }
        if ((i * 7 + j * 3) % 11 === 0) { x.fillStyle = '#e9ecef'; x.fillRect(i * C + gx + gw - 7, j * C + gy + gh + 3, 8, 5); }   // klima
      }
    };
    const map = doku(N * C, N * C, (x) => { for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) pencere(x, i, j, 9, 7, 14, 16); });
    const emis = doku(N * C, N * C, (x) => {
      x.fillStyle = '#000'; x.fillRect(0, 0, N * C, N * C);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const r = isik[i * N + j]; if (!r) continue; x.fillStyle = r;
        if (tur === 'kule') x.fillRect(i * C + 3, j * C + 2, C - 4, C - 6);
        else if (tur === 'ofis') x.fillRect(i * C, j * C + 9, C - 3, 15);
        else x.fillRect(i * C + 9, j * C + 7, 14, 16);
      }
    });
    return { map, emis };
  }
  const TABELALAR = [['ECZANE', '#1f8a5b'], ['FIRIN', '#8a5a2b'], ['MARKET', '#c8323b'], ['KAFE', '#2b2f36'], ['KIRTASİYE', '#2f5bd0'], ['BERBER', '#5a3fa8'],
    ['LOKANTA', '#b8461e'], ['ÇİÇEKÇİ', '#d0457a'], ['KİTABEVİ', '#1d3b8b'], ['OPTİK', '#3a7d8c'], ['OYUNCAK', '#e08a1e'], ['BANKA', '#26445c'],
    ['POSTANE', '#c9a227'], ['SİMİTÇİ', '#a8682a'], ['DONDURMA', '#e0607a'], ['SPOR', '#2e9a8a']];
  function tabelaDokusu() {
    return doku(1024, 256, (x) => {
      TABELALAR.forEach(([ad, r], k) => {
        const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64;
        x.fillStyle = r; x.fillRect(cx + 2, cy + 2, 252, 60);
        x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 3; x.strokeRect(cx + 6, cy + 6, 244, 52);
        x.fillStyle = '#fff'; x.font = '800 34px Onest, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ad, cx + 128, cy + 34);
      });
    });
  }
  function dukkanDokusu() {
    return doku(256, 64, (x) => {
      const tente = ['#c8323b', '#1d3b8b', '#2f7a4f', '#e08a1e'];
      for (let i = 0; i < 4; i++) {
        x.fillStyle = '#3a3f46'; x.fillRect(i * 64, 0, 64, 64);
        x.fillStyle = '#2b3a48'; x.fillRect(i * 64 + 6, 22, 52, 40);
        x.fillStyle = 'rgba(255,230,180,.35)'; x.fillRect(i * 64 + 8, 26, 22, 34);
        x.fillStyle = '#d8dde3'; x.fillRect(i * 64 + 31, 22, 2, 40);
        for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? '#f4f1ea' : tente[i]; x.fillRect(i * 64 + k * 8, 6, 8, 14); }
      }
    });
  }
  function asfaltDokusu() {   // 16 m uzunluk × 12 m genişlik: 4 şerit, ortada çift sarı çizgi
    return doku(256, 192, (x, w, h) => {
      x.fillStyle = '#3a3d42'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) { const v = 48 + Math.random() * 30; x.fillStyle = `rgba(${v},${v},${v + 4},.5)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      x.fillStyle = '#e9c43a'; x.fillRect(0, h / 2 - 4, w, 3); x.fillRect(0, h / 2 + 1, w, 3);
      x.fillStyle = '#ecebe4'; for (let i = 0; i < w; i += 64) { x.fillRect(i + 8, h * 0.25 - 1, 34, 3); x.fillRect(i + 8, h * 0.75 - 1, 34, 3); }
      x.fillRect(0, 4, w, 3); x.fillRect(0, h - 7, w, 3);
    });
  }

  /* ---------- geometri birleştirici: aynı malzemeli kutuları tek ağa toplar ---------- */
  function Birlesik() { this.p = []; this.n = []; this.u = []; this.i = []; }
  Birlesik.prototype.dortgen = function (a, b, c, d, nor, uv) {
    const k = this.p.length / 3;
    for (const v of [a, b, c, d]) this.p.push(v[0], v[1], v[2]);
    for (let q = 0; q < 4; q++) this.n.push(nor[0], nor[1], nor[2]);
    this.u.push(...uv); this.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  };
  // yan yüzler: u = genişlik / su, v = yükseklik / sv (doku 8 kat ve 8 bölmede bir tekrarlar)
  Birlesik.prototype.kutuYan = function (cx, cz, y0, w, h, d, su, sv, uOff) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h, o = uOff || 0, V = h / sv;
    const q = (A, B, len, nor) => { const U = len / su; this.dortgen([A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], nor, [o, 0, o + U, 0, o + U, V, o, V]); };
    q([x1, z1], [x1, z0], d, [1, 0, 0]); q([x0, z0], [x0, z1], d, [-1, 0, 0]);
    q([x0, z1], [x1, z1], w, [0, 0, 1]); q([x1, z0], [x0, z0], w, [0, 0, -1]);
  };
  Birlesik.prototype.ust = function (x0, x1, z0, z1, y, us, vs) {   // yatay dörtgen (çatı, zemin, yol); us/vs: metre başına doku tekrarı
    const U = us ? (x1 - x0) / us : 1, V = vs ? (z1 - z0) / vs : 1;
    this.dortgen([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], [0, 0, U, 0, U, V, 0, V]);
  };
  Birlesik.prototype.yolEW = function (x0, x1, zc, gen, y) { const L = (x1 - x0) / 16; this.dortgen([x0, y, zc + gen / 2], [x1, y, zc + gen / 2], [x1, y, zc - gen / 2], [x0, y, zc - gen / 2], [0, 1, 0], [0, 0, L, 0, L, 1, 0, 1]); };
  Birlesik.prototype.yolNS = function (z0, z1, xc, gen, y) { const L = (z1 - z0) / 16; this.dortgen([xc - gen / 2, y, z1], [xc + gen / 2, y, z1], [xc + gen / 2, y, z0], [xc - gen / 2, y, z0], [0, 1, 0], [L, 0, L, 1, 0, 1, 0, 0]); };
  Birlesik.prototype.mesh = function (mat, golge) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setIndex(this.i); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.castShadow = !!golge; m.receiveShadow = true; return m;
  };

  /* ---------- arabalar: parça başına bir InstancedMesh ---------- */
  // az üçgenli yuvarlatılmış kutu (yuvarlakKutu'nun hafif sürümü): 100'den fazla araba için
  function hafifKutu(w, h, d, rk, bv) {
    const a = w / 2 - bv, b = d / 2 - bv, k = Math.min(rk, a * 0.99, b * 0.99), sh = new THREE.Shape();
    sh.moveTo(-a + k, -b); sh.lineTo(a - k, -b); sh.quadraticCurveTo(a, -b, a, -b + k); sh.lineTo(a, b - k); sh.quadraticCurveTo(a, b, a - k, b);
    sh.lineTo(-a + k, b); sh.quadraticCurveTo(-a, b, -a, b - k); sh.lineTo(-a, -b + k); sh.quadraticCurveTo(-a, -b, -a + k, -b);
    const der = Math.max(1e-4, h - 2 * bv), g = new THREE.ExtrudeGeometry(sh, { depth: der, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 1, curveSegments: 3 });
    g.translate(0, 0, -der / 2); g.rotateX(-Math.PI / 2); return g;
  }
  const TIP = { sedan: [1, 1, 1], hatch: [0.86, 1.03, 0.98], suv: [1.06, 1.2, 1.06], taksi: [1, 1, 1], minibus: [1.32, 1.5, 1.12] };
  const RENKLER = ['#f2f3f5', '#c9cdd3', '#1f2329', '#b8262e', '#2d4f8f', '#4a5059', '#d8c9a8', '#7a1f2a', '#3d6e57', '#f2f3f5', '#c9cdd3'];
  const araclar = [];   // { x, z, aci, renk, tip }
  S.araba = (x, z, aci, renk, tip) => { araclar.push({ x, z, aci, renk: new THREE.Color(renk || sec(RENKLER)), tip: tip || sec(['sedan', 'sedan', 'hatch', 'suv']) }); return araclar.length - 1; };
  let parcalar = null, taksiler = null;
  const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0);
  function filoKur(grup) {
    const n = araclar.length, M = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.5 }, o));
    const cam = new THREE.MeshStandardMaterial({ color: '#18222e', roughness: 0.08, metalness: 0.6 });
    const kauc = M({ color: '#141619', roughness: 0.9 }), jant = M({ color: '#b9c0c8', metalness: 0.9, roughness: 0.3 }), plas = M({ color: '#24272c', roughness: 0.8 });
    const far = new THREE.MeshStandardMaterial({ color: '#fffbe8', emissive: '#fff4cf', emissiveIntensity: 0.15 }); far.userData.gunduz = 0.15; GECE.malz.push([far, 2.4]);
    const stop = new THREE.MeshStandardMaterial({ color: '#8a1414', emissive: '#ff2a2a', emissiveIntensity: 0.05 }); GECE.malz.push([stop, 1.6]);
    const boya = M({ color: '#ffffff', metalness: 0.55, roughness: 0.32 });
    const tekG = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10); tekG.rotateX(Math.PI / 2);
    const janG = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8); janG.rotateX(Math.PI / 2);
    const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
    // kabin: yandan bakınca yamuk (eğik ön ve arka cam), sonra yana doğru uzatılır
    const kp = new THREE.Shape(); kp.moveTo(-1.3, 0); kp.lineTo(1.05, 0); kp.lineTo(0.42, 0.6); kp.lineTo(-0.95, 0.6); kp.closePath();
    const kabG = new THREE.ExtrudeGeometry(kp, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 }); kabG.translate(0, 0, -0.75);
    const tanim = [   // [geometri, malzeme, renkli mi, yerel konumlar]
      [hafifKutu(4.3, 0.7, 1.78, 0.32, 0.1), boya, true, [T(0, 0.72, 0)]],
      [kabG, cam, false, [T(-0.1, 1.04, 0)]],
      [hafifKutu(1.42, 0.07, 1.54, 0.2, 0.03), boya, true, [T(-0.37, 1.67, 0)]],
      [tekG, kauc, false, [T(1.35, 0.34, 0.82), T(1.35, 0.34, -0.82), T(-1.35, 0.34, 0.82), T(-1.35, 0.34, -0.82)]],
      [janG, jant, false, [T(1.35, 0.34, 0.82), T(1.35, 0.34, -0.82), T(-1.35, 0.34, 0.82), T(-1.35, 0.34, -0.82)]],
      [new THREE.BoxGeometry(0.06, 0.12, 0.4), far, false, [T(2.15, 0.86, 0.56), T(2.15, 0.86, -0.56)]],
      [new THREE.BoxGeometry(0.06, 0.12, 0.42), stop, false, [T(-2.16, 0.9, 0.56), T(-2.16, 0.9, -0.56)]],
      [new THREE.BoxGeometry(0.2, 0.22, 1.84), plas, false, [T(2.12, 0.5, 0), T(-2.12, 0.5, 0)]],
      [new THREE.BoxGeometry(0.12, 0.1, 0.24), plas, false, [T(0.55, 1.12, 0.95), T(0.55, 1.12, -0.95)]],
      [new THREE.BoxGeometry(0.03, 0.1, 1.3), cam, false, [T(2.14, 0.72, 0)]],   // ızgara
    ];
    parcalar = tanim.map(([g, mat, renkli, yer]) => {
      const im = new THREE.InstancedMesh(g, mat, n * yer.length); im.castShadow = true; im.receiveShadow = true;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grup.add(im); return { im, renkli, yer };
    });
    const tIdx = araclar.map((a, i) => (a.tip === 'taksi' ? i : -1)).filter((i) => i >= 0);
    taksiler = { im: new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.2, 0.72), new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#ffb000', emissiveIntensity: 0.2 }), Math.max(1, tIdx.length)), sira: {} };
    GECE.malz.push([taksiler.im.material, 1.2]); taksiler.im.material.userData.gunduz = 0.2;
    tIdx.forEach((ai, k) => { taksiler.sira[ai] = k; }); taksiler.im.count = tIdx.length; grup.add(taksiler.im);
    araclar.forEach((a, i) => {
      if (a.tip === 'taksi') a.renk.set('#f2c018');
      parcalar.forEach((p) => { if (p.renkli) for (let k = 0; k < p.yer.length; k++) p.im.setColorAt(i * p.yer.length + k, a.renk); });
      yerlestir(i);
    });
    parcalar.forEach((p) => { if (p.im.instanceColor) p.im.instanceColor.needsUpdate = true; });
  }
  function yerlestir(i) {
    const a = araclar[i], s = TIP[a.tip] || TIP.sedan;
    _q.setFromAxisAngle(_y, a.aci); _s.set(s[0], s[1], s[2]); _p.set(a.x, 0, a.z); _m.compose(_p, _q, _s);
    for (const p of parcalar) for (let k = 0; k < p.yer.length; k++) { _m2.multiplyMatrices(_m, p.yer[k]); p.im.setMatrixAt(i * p.yer.length + k, _m2); }
    if (a.tip === 'taksi' && taksiler) { _m2.multiplyMatrices(_m, new THREE.Matrix4().makeTranslation(-0.25, 1.8, 0)); taksiler.im.setMatrixAt(taksiler.sira[i], _m2); }
  }
  function filoGuncelle() { for (const p of parcalar) p.im.instanceMatrix.needsUpdate = true; if (taksiler) taksiler.im.instanceMatrix.needsUpdate = true; }

  /* ---------- trafik: caddelerde akan arabalar (sağdan gider) ---------- */
  const akan = [];   // { i, eksen, sabit, a0, a1, yon, s, v }
  function serit(eksen, sabit, a0, a1, yon, adet) {
    for (let k = 0; k < adet; k++) {
      const L = a1 - a0, s = (k + rnd() * 0.6) / adet * L;
      const aci = eksen === 'x' ? (yon > 0 ? 0 : Math.PI) : (yon > 0 ? -Math.PI / 2 : Math.PI / 2);
      const i = S.araba(0, 0, aci, null, rnd() < 0.18 ? 'taksi' : rnd() < 0.08 ? 'minibus' : null);
      akan.push({ i, eksen, sabit, a0, a1, yon, s, v: 7 + rnd() * 4 });
    }
  }
  function trafikAdim(dt) {
    for (const t of akan) {
      t.s += t.v * dt; const L = t.a1 - t.a0; if (t.s > L) t.s -= L;
      const k = t.yon > 0 ? t.a0 + t.s : t.a1 - t.s, a = araclar[t.i];
      if (t.eksen === 'x') { a.x = k; a.z = t.sabit; } else { a.z = k; a.x = t.sabit; }
      yerlestir(t.i);
    }
  }

  /* ---------- şehir kurulumu ---------- */
  S.kur = function () {
    const grup = new THREE.Group(); grup.name = 'sehir'; sahne.add(grup);
    const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85 }, o));
    const KAT = 3, SU = 24, SV = 24;
    // malzemeler
    const kat = {};
    const bina = (anahtar, tur, renk) => {
      if (kat[anahtar]) return kat[anahtar];
      const d = cephe(tur, renk), m = std({ map: d.map, emissiveMap: d.emis, emissive: '#ffffff', emissiveIntensity: 0, roughness: tur === 'kule' ? 0.25 : 0.85, metalness: tur === 'kule' ? 0.35 : 0 });
      GECE.malz.push([m, 0.85]); return (kat[anahtar] = { m, b: new Birlesik() });
    };
    const APT = ['#e9d6b5', '#d9957a', '#cfe0ea', '#d5e8d4', '#f0e6cc', '#e8c8c8'];
    const cati = new Birlesik(), plaza = new Birlesik(), kald = new Birlesik(), cim = new Birlesik(), yolEW = new Birlesik(), yolNS = new Birlesik(), kavsak = new Birlesik(), zebra = new Birlesik(), dukkan = new Birlesik(), tabela = new Birlesik();
    const yollarX = [ALAN.x0, ...NS, ALAN.x1], yollarZ = [ALAN.z0 + 2, ...EW, ALAN.z1];
    // yollar: bloklar arası parçalar + kavşaklar (şerit çizgileri kavşakta kesilir)
    for (const z of EW) {
      const sinir = [ALAN.x0, ...NS.flatMap((x) => [x - YG / 2, x + YG / 2]), ALAN.x1];
      for (let k = 0; k < sinir.length; k += 2) yolEW.yolEW(sinir[k], sinir[k + 1], z, YG, 0.02);
      for (const x of NS) { kavsak.ust(x - YG / 2, x + YG / 2, z - YG / 2, z + YG / 2, 0.021, 8, 8);
        for (const [dx, dz, ew] of [[YG / 2 + 1.6, 0, false], [-YG / 2 - 1.6, 0, false], [0, YG / 2 + 1.6, true], [0, -YG / 2 - 1.6, true]]) {
          if (ew) zebra.dortgen([x - YG / 2, 0.025, z + dz + 1.4], [x + YG / 2, 0.025, z + dz + 1.4], [x + YG / 2, 0.025, z + dz - 1.4], [x - YG / 2, 0.025, z + dz - 1.4], [0, 1, 0], [0, 0, 6, 0, 6, 1, 0, 1]);
          else zebra.dortgen([x + dx - 1.4, 0.025, z + YG / 2], [x + dx + 1.4, 0.025, z + YG / 2], [x + dx + 1.4, 0.025, z - YG / 2], [x + dx - 1.4, 0.025, z - YG / 2], [0, 1, 0], [6, 0, 6, 1, 0, 1, 0, 0]);
        }
      }
    }
    for (const x of NS) {
      const sinir = [EW[0] + YG / 2, ...EW.slice(1).flatMap((z) => [z - YG / 2, z + YG / 2]), ALAN.z1];
      for (let k = 0; k < sinir.length; k += 2) yolNS.yolNS(sinir[k], sinir[k + 1], x, YG, 0.02);
    }
    // kasabadaki sokak (x = -66) şehre bağlanır
    kavsak.ust(-69.5, -62.5, 29, EW[0] - YG / 2, 0.02, 8, 8);
    // bloklar
    const bloklar = [];
    for (let a = 0; a < yollarX.length - 1; a++) for (let b = 0; b < yollarZ.length - 1; b++) {
      const xa = yollarX[a], xb = yollarX[a + 1], za = yollarZ[b], zb = yollarZ[b + 1];
      const yolA = NS.includes(xa), yolB = NS.includes(xb), yolC = EW.includes(za), yolD = EW.includes(zb);
      const x0 = xa + (yolA ? YG / 2 : 0), x1 = xb - (yolB ? YG / 2 : 0), z0 = za + (yolC ? YG / 2 : 0), z1 = zb - (yolD ? YG / 2 : 0);
      if (x1 - x0 < 6 || z1 - z0 < 6) continue;
      // kaldırım (yola bakan kenarlarda, 15 cm yüksek)
      if (yolA) kald.kutuYan((x0 + x0 + KALD) / 2, (z0 + z1) / 2, 0, KALD, 0.15, z1 - z0, 4, 4);
      if (yolB) kald.kutuYan((x1 - KALD + x1) / 2, (z0 + z1) / 2, 0, KALD, 0.15, z1 - z0, 4, 4);
      if (yolC) kald.kutuYan((x0 + x1) / 2, (z0 + z0 + KALD) / 2, 0, x1 - x0, 0.15, KALD, 4, 4);
      if (yolD) kald.kutuYan((x0 + x1) / 2, (z1 - KALD + z1) / 2, 0, x1 - x0, 0.15, KALD, 4, 4);
      kald.ust(x0, x1, z0, z1, 0.15, 4, 4);
      bloklar.push({ x0: x0 + (yolA ? KALD : 1), x1: x1 - (yolB ? KALD : 1), z0: z0 + (yolC ? KALD : 1), z1: z1 - (yolD ? KALD : 1), yol: { A: yolA, B: yolB, C: yolC, D: yolD } });
    }
    const ozel = (b, x, z) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1;
    const kuleler = [], ikaz = [];
    const binaEkle = (x0, x1, z0, z1, h, tur, renk, b) => {
      const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y0 = 0.15;
      const anahtar = tur === 'apt' ? 'apt' + renk : tur, M = bina(anahtar, tur, tur === 'apt' ? APT[renk] : null);
      const dk = tur !== 'kule' && h > 7 && b;   // zemin katı dükkân
      if (dk) {
        M.b.kutuYan(cx, cz, y0 + 4, w, h - 4, d, SU, SV, Math.floor(rnd() * 8) / 8);
        dukkan.kutuYan(cx, cz, y0, w + 0.3, 4, d + 0.3, 16, 4);
        // tabela: yola bakan yüze
        const yuz = b.yol.C && z0 - b.z0 < 2 ? 'C' : b.yol.D && b.z1 - z1 < 2 ? 'D' : b.yol.A && x0 - b.x0 < 2 ? 'A' : b.yol.B && b.x1 - x1 < 2 ? 'B' : null;
        if (yuz) {
          const k = Math.floor(rnd() * TABELALAR.length), u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 4, u1 = u0 + 0.25, v0 = v1 - 0.25, tw = Math.min(5, (yuz === 'A' || yuz === 'B' ? d : w) * 0.6), ty = y0 + 4.3;
          if (yuz === 'C') tabela.dortgen([cx - tw / 2, ty, z0 - 0.2], [cx + tw / 2, ty, z0 - 0.2], [cx + tw / 2, ty + 1.1, z0 - 0.2], [cx - tw / 2, ty + 1.1, z0 - 0.2], [0, 0, -1], [u1, v0, u0, v0, u0, v1, u1, v1].map((v, i) => v));
          if (yuz === 'D') tabela.dortgen([cx - tw / 2, ty, z1 + 0.2], [cx + tw / 2, ty, z1 + 0.2], [cx + tw / 2, ty + 1.1, z1 + 0.2], [cx - tw / 2, ty + 1.1, z1 + 0.2], [0, 0, 1], [u0, v0, u1, v0, u1, v1, u0, v1]);
          if (yuz === 'A') tabela.dortgen([x0 - 0.2, ty, cz - tw / 2], [x0 - 0.2, ty, cz + tw / 2], [x0 - 0.2, ty + 1.1, cz + tw / 2], [x0 - 0.2, ty + 1.1, cz - tw / 2], [-1, 0, 0], [u0, v0, u1, v0, u1, v1, u0, v1]);
          if (yuz === 'B') tabela.dortgen([x1 + 0.2, ty, cz + tw / 2], [x1 + 0.2, ty, cz - tw / 2], [x1 + 0.2, ty + 1.1, cz - tw / 2], [x1 + 0.2, ty + 1.1, cz + tw / 2], [1, 0, 0], [u0, v0, u1, v0, u1, v1, u0, v1]);
        }
      } else M.b.kutuYan(cx, cz, y0, w, h, d, SU, SV, Math.floor(rnd() * 8) / 8);
      cati.ust(x0, x1, z0, z1, y0 + h, 6, 6);
      KUTULAR.push({ x0, x1, z0, z1, y0: 0, ust: y0 + h, ad: 'ev' });
      if (h > 38) { ikaz.push([cx, y0 + h + 0.6, cz]); kuleler.push({ cx, cz, h: y0 + h, w, d }); }
      return { cx, cz, w, d, h: y0 + h };
    };
    const catiEsya = [];   // çatı klimaları ve su depoları
    const PARK = (b) => ozel(b, -38, 128), MEYDAN = (b) => ozel(b, 20, 72), HASTANE = (b) => ozel(b, 80, 72), KULE = (b) => ozel(b, 80, 184);
    let hastaneB = null, kuleB = null, parkB = null, meydanB = null;
    for (const b of bloklar) {
      if (PARK(b)) { parkB = b; continue; } if (MEYDAN(b)) { meydanB = b; continue; } if (HASTANE(b)) { hastaneB = b; continue; } if (KULE(b)) { kuleB = b; continue; }
      plaza.ust(b.x0, b.x1, b.z0, b.z1, 0.155, 4, 4);
      const W = b.x1 - b.x0, D = b.z1 - b.z0, nx = Math.max(1, Math.round(W / 22)), nz = Math.max(1, Math.round(D / 19)), ara = 3;
      const lw = (W - ara * (nx - 1)) / nx, ld = (D - ara * (nz - 1)) / nz;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const lx0 = b.x0 + i * (lw + ara), lz0 = b.z0 + j * (ld + ara);
        const geri = 0.5 + rnd() * 1.2;
        const x0 = lx0 + geri, x1 = lx0 + lw - geri, z0 = lz0 + geri, z1 = lz0 + ld - geri;
        if (x1 - x0 < 5 || z1 - z0 < 5) continue;
        const dm = Math.hypot((x0 + x1) / 2 - MERKEZ.x, (z0 + z1) / 2 - MERKEZ.z);
        let tur, h;
        if (dm < 75 && rnd() < 0.75) { tur = 'kule'; h = KAT * Math.round((30 + rnd() * 52) * (1 - dm / 160) / KAT); }
        else if (dm < 130 && rnd() < 0.35) { tur = 'ofis'; h = KAT * Math.round((15 + rnd() * 18) / KAT); }
        else { tur = 'apt'; h = KAT * (4 + Math.floor(rnd() * (dm < 130 ? 7 : 4))); }
        const r = binaEkle(x0, x1, z0, z1, Math.max(9, h), tur, Math.floor(rnd() * APT.length), b);
        if (tur !== 'kule') for (let k = 0; k < 1 + Math.floor(rnd() * 3); k++) catiEsya.push([x0 + 1 + rnd() * (x1 - x0 - 2), r.h, z0 + 1 + rnd() * (z1 - z0 - 2), rnd() < 0.35]);
      }
    }
    // Hastane: tek büyük bina, kırmızı haç tabelası, çatıda helikopter pisti
    if (hastaneB) {
      plaza.ust(hastaneB.x0, hastaneB.x1, hastaneB.z0, hastaneB.z1, 0.155, 4, 4);
      const cx = (hastaneB.x0 + hastaneB.x1) / 2, cz = (hastaneB.z0 + hastaneB.z1) / 2;
      const r = binaEkle(cx - 20, cx + 20, cz - 11, cz + 11, 21, 'apt', 4, null);
      const pad = new THREE.Mesh(new THREE.CircleGeometry(4.5, 40), std({ map: doku(256, 256, (x) => {
        x.fillStyle = '#2b2f36'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#f2f2f2'; x.lineWidth = 12; x.beginPath(); x.arc(128, 128, 110, 0, 7); x.stroke();
        x.fillStyle = '#f2f2f2'; x.font = '900 150px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('H', 128, 138);
      }), polygonOffset: true, polygonOffsetFactor: -2 }));
      pad.rotation.x = -Math.PI / 2; pad.position.set(cx + 8, r.h + 0.02, cz); grup.add(pad);
      const lev = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.2), std({ map: doku(512, 128, (x) => {
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#d62a2a'; x.fillRect(30, 50, 60, 28); x.fillRect(46, 34, 28, 60);
        x.fillStyle = '#c8323b'; x.font = '800 70px Onest, Arial'; x.textBaseline = 'middle'; x.fillText('HASTANE', 120, 68);
      }), emissive: '#ffffff', emissiveIntensity: 0 }));
      lev.material.emissiveMap = lev.material.map; GECE.malz.push([lev.material, 0.8]);
      lev.position.set(cx, r.h - 2.2, cz - 11.05); lev.rotation.y = Math.PI; grup.add(lev);
      S.hastanePisti = { x: cx + 8, z: cz, y: r.h };
    }
    // Gençlik Parkı: çim, yürüyüş yolu, gölet, ağaçlar
    const parkAgac = [];
    if (parkB) {
      cim.ust(parkB.x0, parkB.x1, parkB.z0, parkB.z1, 0.16, 6, 6);
      const cx = (parkB.x0 + parkB.x1) / 2, cz = (parkB.z0 + parkB.z1) / 2;
      const gol = new THREE.Mesh(new THREE.CircleGeometry(9, 48), std({ color: '#3f7fa6', roughness: 0.1, metalness: 0.3 })); gol.rotation.x = -Math.PI / 2; gol.scale.set(1.4, 1, 1); gol.position.set(cx + 4, 0.18, cz + 2); grup.add(gol);
      const yolM = new THREE.Mesh(new THREE.RingGeometry(12.5, 14.5, 56), std({ color: '#c9b48c', roughness: 1 })); yolM.rotation.x = -Math.PI / 2; yolM.scale.set(1.4, 1, 1); yolM.position.set(cx + 4, 0.175, cz + 2); grup.add(yolM);
      for (let k = 0; k < 36; k++) {
        const x = parkB.x0 + 2 + rnd() * (parkB.x1 - parkB.x0 - 4), z = parkB.z0 + 2 + rnd() * (parkB.z1 - parkB.z0 - 4);
        if (Math.hypot((x - cx - 4) / 1.4, z - cz - 2) < 15.5) continue;
        parkAgac.push([x, z, 0.8 + rnd() * 0.6]);
      }
    }
    // Cumhuriyet Meydanı: taş döşeme ve fıskiye
    if (meydanB) {
      plaza.ust(meydanB.x0, meydanB.x1, meydanB.z0, meydanB.z1, 0.155, 2, 2);
      const cx = (meydanB.x0 + meydanB.x1) / 2, cz = (meydanB.z0 + meydanB.z1) / 2;
      const hav = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.3, 0.7, 40), std({ color: '#d8d2c4' })); hav.position.set(cx, 0.5, cz); grup.add(hav);
      const su = new THREE.Mesh(new THREE.CircleGeometry(5.6, 40), std({ color: '#5aa0c8', roughness: 0.1, metalness: 0.3 })); su.rotation.x = -Math.PI / 2; su.position.set(cx, 0.86, cz); grup.add(su);
      const fs = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.6, 3.2, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#dff1ff', transparent: true, opacity: 0.55, depthWrite: false })); fs.position.set(cx, 2.4, cz); grup.add(fs); S.fiskiye = fs;
      DIREKLER.push({ x: cx, z: cz, h: 4, R: 0.6 });
      for (const [dx, dz] of [[-14, -10], [14, -10], [-14, 10], [14, 10]]) parkAgac.push([cx + dx, cz + dz, 1.1]);
    }
    // Televizyon kulesi: gövde, seyir katı, anten, ikaz ışıkları
    if (kuleB) {
      plaza.ust(kuleB.x0, kuleB.x1, kuleB.z0, kuleB.z1, 0.155, 4, 4);
      const cx = (kuleB.x0 + kuleB.x1) / 2, cz = (kuleB.z0 + kuleB.z1) / 2, beton = std({ color: '#d9dde2', roughness: 0.7 });
      const gov = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.6, 92, 24), beton); gov.position.set(cx, 46, cz); gov.castShadow = true; grup.add(gov);
      const kat2 = new THREE.Mesh(new THREE.CylinderGeometry(7, 5, 9, 32), std({ color: '#7e9bb5', roughness: 0.2, metalness: 0.5 })); kat2.position.set(cx, 76, cz); grup.add(kat2);
      const kapak = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 2.2, 32), beton); kapak.position.set(cx, 81.6, cz); grup.add(kapak);
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.6, 30, 10), std({ color: '#c8323b' })); ant.position.set(cx, 107, cz); grup.add(ant);
      DIREKLER.push({ x: cx, z: cz, h: 122, R: 2.4 });
      KUTULAR.push({ x0: cx - 6.5, x1: cx + 6.5, z0: cz - 6.5, z1: cz + 6.5, y0: 71.5, ust: 82.7, ad: 'ev' });
      ikaz.push([cx, 122.4, cz], [cx, 83.2, cz + 5]);
      for (const [dx, dz] of [[-12, -12], [12, -12], [-12, 12], [12, 12], [0, -16], [0, 16]]) parkAgac.push([cx + dx, cz + dz, 1]);
      S.kule = { x: cx, z: cz };
    }
    // çatı eşyası (klima kutusu ya da su deposu), tek InstancedMesh her biri
    {
      const kl = catiEsya.filter((e) => !e[3]), dp = catiEsya.filter((e) => e[3]), o = new THREE.Object3D();
      const a = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.9, 1), std({ color: '#c9ced4', metalness: 0.4 }), kl.length);
      kl.forEach(([x, y, z], i) => { o.position.set(x, y + 0.45, z); o.rotation.y = rnd() * 3; o.updateMatrix(); a.setMatrixAt(i, o.matrix); });
      const d = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 14), std({ color: '#e3e6e9', metalness: 0.5, roughness: 0.4 }), dp.length);
      dp.forEach(([x, y, z], i) => { o.position.set(x, y + 0.8, z); o.rotation.set(0, 0, Math.PI / 2); o.updateMatrix(); d.setMatrixAt(i, o.matrix); o.rotation.set(0, 0, 0); });
      grup.add(a, d);
    }
    // ağaçlar: park, meydan, kule çevresi + bulvar kenarları
    for (const x of NS) for (let z = EW[0] + 12; z < ALAN.z1 - 4; z += 16) if (!EW.some((e) => Math.abs(e - z) < 9)) { parkAgac.push([x - YG / 2 - 1.5, z, 0.75]); parkAgac.push([x + YG / 2 + 1.5, z + 8, 0.75]); }
    {
      const n = parkAgac.length, o = new THREE.Object3D(), RNK = ['#4f7f3a', '#6a8f3a', '#5d8a46', '#3f6b35', '#b5832a', '#7a9a3a'];
      const g = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.22, 2.4, 7), std({ color: '#6b4a2f' }), n);
      const t = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std({ color: '#ffffff', flatShading: true }), n);
      const c = new THREE.Color();
      parkAgac.forEach(([x, z, s], i) => {
        o.position.set(x, 1.2 * s + 0.15, z); o.scale.setScalar(s); o.updateMatrix(); g.setMatrixAt(i, o.matrix);
        o.position.y = 3.4 * s + 0.15; o.scale.set(1.7 * s, 1.5 * s, 1.7 * s); o.rotation.y = i; o.updateMatrix(); t.setMatrixAt(i, o.matrix); o.rotation.y = 0;
        t.setColorAt(i, c.set(RNK[i % RNK.length]));
        yuvarlakAgaclarSehir.push({ x, z, s });
      });
      g.castShadow = t.castShadow = true; grup.add(g, t);
    }
    // sokak lambaları (direk + kol + yanan baş) ve gece ışık havuzları
    {
      const yer = [];
      for (const z of EW) for (let x = ALAN.x0 + 10; x < ALAN.x1 - 4; x += 26) if (!NS.some((n) => Math.abs(n - x) < 9)) { yer.push([x, z - YG / 2 - 0.6, 1]); yer.push([x + 13, z + YG / 2 + 0.6, -1]); }
      for (const x of NS) for (let z = EW[0] + 14; z < ALAN.z1 - 4; z += 26) if (!EW.some((e) => Math.abs(e - z) < 9)) { yer.push([x - YG / 2 - 0.6, z, 2]); yer.push([x + YG / 2 + 0.6, z + 13, -2]); }
      const n = yer.length, o = new THREE.Object3D();
      const dir = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.11, 6, 8), std({ color: '#3a3f47', metalness: 0.6, roughness: 0.4 }), n);
      const bas = new THREE.MeshStandardMaterial({ color: '#fff1d0', emissive: '#ffd99a', emissiveIntensity: 0 }); GECE.malz.push([bas, 1.8]);
      const bs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.14, 0.32), bas, n);
      const hv = new THREE.InstancedMesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ map: doku(128, 128, (x, w, h) => {
        const gr = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,205,140,.55)'); gr.addColorStop(0.5, 'rgba(255,190,120,.16)'); gr.addColorStop(1, 'rgba(255,180,110,0)');
        x.fillStyle = gr; x.fillRect(0, 0, w, h);
      }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6 }), n);
      yer.forEach(([x, z, k], i) => {
        const dx = Math.abs(k) === 2 ? Math.sign(k) * 0.9 : 0, dz = Math.abs(k) === 1 ? Math.sign(k) * 0.9 : 0;
        o.position.set(x, 3.15, z); o.updateMatrix(); dir.setMatrixAt(i, o.matrix);
        o.position.set(x + dx, 6.1, z + dz); o.rotation.y = Math.abs(k) === 2 ? 0 : Math.PI / 2; o.updateMatrix(); bs.setMatrixAt(i, o.matrix); o.rotation.y = 0;
        o.position.set(x + dx * 2, 0.2, z + dz * 2); o.rotation.x = -Math.PI / 2; o.updateMatrix(); hv.setMatrixAt(i, o.matrix); o.rotation.x = 0;
        DIREKLER.push({ x, z, h: 6.2, R: 0.12 });
      });
      dir.castShadow = true; grup.add(dir, bs, hv); GECE.nesne.push(hv); hv.visible = false;
    }
    // uçak ikaz ışıkları (yüksek binalar ve kule): yanıp söner
    {
      const m = new THREE.MeshBasicMaterial({ color: '#ff2a2a' }), im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 10, 8), m, ikaz.length), o = new THREE.Object3D();
      ikaz.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      grup.add(im); S.ikaz = m;
    }
    // park etmiş arabalar (cadde kenarındaki park şeritleri) ve akan trafik
    for (const z of EW) for (let x = ALAN.x0 + 8; x < ALAN.x1 - 6; x += 7 + rnd() * 9) {
      if (NS.some((n) => Math.abs(n - x) < 11) || rnd() < 0.45) continue;
      S.araba(x, rnd() < 0.5 ? z - 4.5 : z + 4.5, rnd() < 0.5 ? 0 : Math.PI, null, rnd() < 0.08 ? 'taksi' : rnd() < 0.06 ? 'minibus' : null);
    }
    for (const x of NS) for (let z = EW[0] + 10; z < ALAN.z1 - 6; z += 7 + rnd() * 9) {
      if (EW.some((e) => Math.abs(e - z) < 11) || rnd() < 0.5) continue;
      S.araba(rnd() < 0.5 ? x - 4.5 : x + 4.5, z, rnd() < 0.5 ? Math.PI / 2 : -Math.PI / 2, null);
    }
    for (const z of EW) { serit('x', z + 1.8, ALAN.x0, ALAN.x1, 1, 3); serit('x', z - 1.8, ALAN.x0, ALAN.x1, -1, 3); }
    for (const x of [-66, -10, 50]) { serit('z', x - 1.8, EW[0] - YG / 2, ALAN.z1, 1, 2); serit('z', x + 1.8, EW[0] - YG / 2, ALAN.z1, -1, 2); }
    for (const t of akan) {   // ilk konum
      const k = t.yon > 0 ? t.a0 + t.s : t.a1 - t.s, a = araclar[t.i];
      if (t.eksen === 'x') { a.x = k; a.z = t.sabit; } else { a.z = k; a.x = t.sabit; }
    }
    filoKur(grup);
    // birleşik ağları sahneye ekle
    const as = asfaltDokusu();
    grup.add(yolEW.mesh(std({ map: as, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })));
    grup.add(yolNS.mesh(std({ map: as, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })));
    grup.add(kavsak.mesh(std({ map: doku(64, 64, (x) => { x.fillStyle = '#3a3d42'; x.fillRect(0, 0, 64, 64); for (let i = 0; i < 160; i++) { const v = 48 + Math.random() * 30; x.fillStyle = `rgba(${v},${v},${v},.5)`; x.fillRect(Math.random() * 64, Math.random() * 64, 2, 2); } }), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })));
    grup.add(zebra.mesh(std({ map: doku(64, 16, (x) => { x.clearRect(0, 0, 64, 16); x.fillStyle = '#f2f1ea'; x.fillRect(0, 0, 32, 16); }), transparent: true, polygonOffset: true, polygonOffsetFactor: -4 })));
    grup.add(kald.mesh(std({ color: '#b9b3a7' })));
    grup.add(plaza.mesh(std({ map: doku(64, 64, (x) => { x.fillStyle = '#c9c4ba'; x.fillRect(0, 0, 64, 64); x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 2; x.strokeRect(0, 0, 32, 32); x.strokeRect(32, 32, 32, 32); x.strokeRect(32, 0, 32, 32); x.strokeRect(0, 32, 32, 32); }), polygonOffset: true, polygonOffsetFactor: -1 })));
    grup.add(cim.mesh(std({ color: '#5f9a45' })));
    grup.add(cati.mesh(std({ color: '#6c7178', roughness: 0.95 })));
    const dkD = dukkanDokusu(), dkM = std({ map: dkD, emissiveMap: dkD, emissive: '#ffffff', emissiveIntensity: 0 }); GECE.malz.push([dkM, 0.55]);
    grup.add(dukkan.mesh(dkM, true));
    const tbD = tabelaDokusu(), tbM = std({ map: tbD, emissiveMap: tbD, emissive: '#ffffff', emissiveIntensity: 0.05, side: THREE.DoubleSide }); tbM.userData.gunduz = 0.05; GECE.malz.push([tbM, 1.1]);
    grup.add(tabela.mesh(tbM));
    for (const k in kat) grup.add(kat[k].b.mesh(kat[k].m, true));
    S.grup = grup;
  };

  const yuvarlakAgaclarSehir = [];
  S.agaclar = yuvarlakAgaclarSehir;
  S.adim = function (dt, t) {
    if (!parcalar) return;
    trafikAdim(dt); filoGuncelle();
    if (S.ikaz) S.ikaz.color.setRGB(Math.sin(t * 3) > 0.2 ? 1 : 0.18, 0.06, 0.06);
    if (S.fiskiye) S.fiskiye.scale.y = 1 + 0.08 * Math.sin(t * 9);
  };
  window.SEHIR = S;
})();
