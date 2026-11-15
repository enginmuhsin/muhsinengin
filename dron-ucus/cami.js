/* =====================================================================
   SELATİN CAMİİ — Uçuş Simülatörü (şehir merkezi, Gençlik Parkı'nın batısı)
   Öğretmen isteği (Kasım 2026): "Şehre Ayasofya ya da Süleymaniye gibi büyük, bütün
   detayları olan bir cami ekle. Minareleri arasında mahya olsun; mahyada
   'İLİM İLİM BİLMEKTİR, İLİM KENDİN BİLMEKTİR' yazsın."  (Yunus Emre)

   Klasik Osmanlı selatin camisi planı (Süleymaniye örnek alındı, ölçek küçültüldü):
     • harim (ibadet mekânı): 24 × 24 m, merkezî kubbe Ø12,8 m, kasnağında 24 pencere
     • kıble ekseninde iki yarım kubbe, köşelerde eksedra kubbecikleri,
       yan galerilerde küçük kubbe dizileri, dört ağırlık kulesi (kubbecikli)
     • taş cephe: sıra sıra sivri kemerli pencereler, alt sırada dikdörtgen pencereler,
       payandalar, kurşun kaplı kubbeler, altın âlemler
     • avlu (21 × 24 m): üç yanında kubbeli revaklar, harim önünde son cemaat yeri,
       ortada sekizgen şadırvan, doğu duvarında taçkapı (dronla içinden geçilebilir)
     • 4 minare: harime bitişik ikisi 3 şerefeli (38 m), avlu köşelerindeki ikisi 2 şerefeli (31 m)
     • iki mahya: üstte (uzun minareler arasında) "İLİM İLİM BİLMEKTİR",
       altta (kısa minareler arasında) "İLİM KENDİN BİLMEKTİR" — doğudan, avlu kapısından okunur
     • bahçe duvarı, servi ağaçları; gece taş cephe ve şerefeler projektörle aydınlanır

   Yüzlerce parça malzemeye göre birkaç ağda birleştirilir (az çizim çağrısı).
   Gövde, kubbeler, revaklar, minareler KUTULAR/DIREKLER'e eklenir: çarpılır, kubbeye,
   revak çatısına, şadırvan çatısına inilebilir. Ana betikten ÖNCE yüklenir;
   SEHIR.kur() çağırır (şehir bloğu ayrılır).
   ===================================================================== */
(function () {
  'use strict';
  const C = {};
  C.blok = { x: -98, z: 128 };        // sehir.js bu noktayı içeren bloğu camiye ayırır

  // ---- parçaları malzemeye göre biriktirip tek ağda birleştiren yardımcı ----
  function Yigin() { this.m = new Map(); this._o = new THREE.Object3D(); }
  Yigin.prototype.ekle = function (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const o = this._o; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix();
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(o.matrix);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(g);
  };
  Yigin.prototype.kur = function (grup, golge = true) {
    for (const [mat, liste] of this.m) {
      let n = 0; for (const g of liste) n += g.attributes.position.count;
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let k = 0;
      for (const g of liste) { P.set(g.attributes.position.array, k * 3); N.set(g.attributes.normal.array, k * 3); U.set(g.attributes.uv.array, k * 2); k += g.attributes.position.count; g.dispose(); }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(P, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(N, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(U, 2));
      bg.computeBoundingSphere();
      const me = new THREE.Mesh(bg, mat); me.castShadow = golge; me.receiveShadow = true; grup.add(me);
    }
  };

  // ---- dokular ----
  function doku(w, h, ciz) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); ciz(x, w, h);
    const d = new THREE.CanvasTexture(c); d.encoding = THREE.sRGBEncoding; d.wrapS = d.wrapT = THREE.RepeatWrapping;
    d.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return d;
  }
  const TAS = '#e9dfcc', TAS2 = '#d8ccb4', DERZ = 'rgba(120,100,75,0.28)';
  function tasZemin(x, w, h, sira) {
    x.fillStyle = TAS; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${150 + Math.random() * 60},${130 + Math.random() * 50},${100 + Math.random() * 40},0.08)`; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 1 + Math.random() * 2); }
    x.strokeStyle = DERZ; x.lineWidth = 1;
    for (let y = 0; y < h; y += sira) { x.beginPath(); x.moveTo(0, y + 0.5); x.lineTo(w, y + 0.5); x.stroke(); const o = (y / sira) % 2 ? sira : 0; for (let xx = o; xx < w; xx += sira * 2) { x.beginPath(); x.moveTo(xx + 0.5, y); x.lineTo(xx + 0.5, y + sira); x.stroke(); } }
  }
  // sivri kemerli pencere (alt kenar orta noktası cx,y1; genişlik w, yükseklik h)
  function sivriKemer(x, cx, y1, w, h, dolgu, kenar) {
    const r = w * 0.62, yk = y1 - h + w * 0.55;
    x.beginPath(); x.moveTo(cx - w / 2, y1); x.lineTo(cx - w / 2, yk);
    x.arc(cx - w / 2 + r, yk, r, Math.PI, Math.PI + Math.acos((r - w / 2) / r) * 1.0 + 0.0001, false);
    x.lineTo(cx, y1 - h);
    x.arc(cx + w / 2 - r, yk, r, -Math.acos((r - w / 2) / r), 0, false);
    x.lineTo(cx + w / 2, y1); x.closePath();
    if (kenar) { x.lineWidth = kenar[1]; x.strokeStyle = kenar[0]; x.stroke(); }
    x.fillStyle = dolgu; x.fill();
  }
  function camDolgu(x, cx, y1, w, h) {      // pencere camı: koyu mavi-yeşil, kurşun çubuklar
    sivriKemer(x, cx, y1, w + 10, h + 10, '#cdbfa5', null);                      // söve
    sivriKemer(x, cx, y1, w, h, '#2c3c46', null);
    x.strokeStyle = 'rgba(200,190,160,0.55)'; x.lineWidth = 2;
    for (let i = 1; i < 3; i++) { x.beginPath(); x.moveTo(cx - w / 2 + (w * i) / 3, y1); x.lineTo(cx - w / 2 + (w * i) / 3, y1 - h + w * 0.4); x.stroke(); }
    for (let j = 1; j < 4; j++) { const yy = y1 - (h * j) / 4.5; x.beginPath(); x.moveTo(cx - w / 2, yy); x.lineTo(cx + w / 2, yy); x.stroke(); }
  }
  // harim cephesi: 1 bölme = 4 m genişlik × 10 m yükseklik; altta dikdörtgen pencere + üstünde kemer alınlığı, üstte iki sivri kemerli pencere
  function cepheDokusu(gece) {
    return doku(256, 640, (x, w, h) => {
      if (gece) { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); } else tasZemin(x, w, h, 32);
      const g = (cx, y1, ww, hh) => { if (gece) sivriKemer(x, cx, y1, ww, hh, '#ffcf7a', null); else camDolgu(x, cx, y1, ww, hh); };
      // alt sıra: dikdörtgen pencere (y 1,2..3,4 m) + kemerli alınlık
      if (!gece) { x.fillStyle = '#cdbfa5'; x.fillRect(78, 410, 100, 168); sivriKemer(x, 128, 410, 104, 70, '#cdbfa5', null); sivriKemer(x, 128, 404, 86, 56, '#b7442f', null); }
      if (gece) { x.fillStyle = '#ffcf7a'; x.fillRect(86, 418, 84, 152); }
      else { x.fillStyle = '#2c3c46'; x.fillRect(86, 418, 84, 152); x.strokeStyle = '#3d3d3d'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(86, 430 + i * 24); x.lineTo(170, 430 + i * 24); x.stroke(); } }
      // orta kuşak silmesi
      if (!gece) { x.fillStyle = TAS2; x.fillRect(0, 336, w, 12); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 348, w, 3); }
      // üst sıra: iki sivri kemerli pencere ve üstte yuvarlak (öküzgözü) pencere
      g(84, 300, 52, 130); g(172, 300, 52, 130);
      if (gece) { x.fillStyle = '#ffcf7a'; x.beginPath(); x.arc(128, 110, 20, 0, 7); x.fill(); }
      else { x.fillStyle = '#cdbfa5'; x.beginPath(); x.arc(128, 110, 26, 0, 7); x.fill(); x.fillStyle = '#2c3c46'; x.beginPath(); x.arc(128, 110, 20, 0, 7); x.fill(); }
      // saçak: mukarnaslı korniş
      if (!gece) { x.fillStyle = TAS2; x.fillRect(0, 0, w, 22); for (let i = 0; i < w; i += 16) { x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(i + 2, 22, 12, 8); } }
    });
  }
  function kasnakDokusu(gece) {   // kasnak: 24 kemerli pencere (doku 4 kez sarar: 6 pencere)
    return doku(512, 128, (x, w, h) => {
      if (gece) { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); } else tasZemin(x, w, h, 24);
      for (let i = 0; i < 6; i++) { const cx = (i + 0.5) * (w / 6); if (gece) sivriKemer(x, cx, 112, 40, 86, '#ffd88f', null); else camDolgu(x, cx, 112, 40, 86); if (!gece) { x.fillStyle = TAS2; x.fillRect(i * (w / 6) - 6, 0, 12, h); } }
    });
  }
  function kubbeDokusu() {      // kurşun levhalar: meridyen çizgileri
    return doku(512, 256, (x, w, h) => {
      x.fillStyle = '#8d979f'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(${90 + Math.random() * 60},${100 + Math.random() * 60},${110 + Math.random() * 60},0.12)`; x.fillRect(Math.random() * w, Math.random() * h, 6, 3); }
      x.strokeStyle = 'rgba(60,66,72,0.45)'; x.lineWidth = 2;
      for (let i = 0; i < 48; i++) { const xx = (i / 48) * w; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, h); x.stroke(); }
      for (let j = 1; j < 10; j++) { x.strokeStyle = 'rgba(60,66,72,0.18)'; x.beginPath(); x.moveTo(0, (j / 10) * h); x.lineTo(w, (j / 10) * h); x.stroke(); }
    });
  }
  function revakDokusu() {      // avlu revağı iç yüzü / son cemaat cephesi: sivri kemerler (1 bölme = 3 m)
    return doku(256, 256, (x, w, h) => {
      tasZemin(x, w, h, 32);
      sivriKemer(x, 128, 256, 200, 220, '#cdbfa5', null);
      sivriKemer(x, 128, 256, 180, 205, '#ffffff00', null);
      x.globalCompositeOperation = 'destination-out'; sivriKemer(x, 128, 256, 176, 200, '#000', null); x.globalCompositeOperation = 'source-over';
      // kemer taşları: beyaz-kırmızı (almaşık)
      for (let i = 0; i < 11; i++) { const a = Math.PI + (i / 10) * Math.PI; x.fillStyle = i % 2 ? '#b7442f' : '#efe6d6'; x.beginPath(); x.arc(128, 128, 96, a, a + Math.PI / 10); x.arc(128, 128, 84, a + Math.PI / 10, a, true); x.fill(); }
    });
  }
  function tackapiDokusu() {    // taçkapı: dikdörtgen çerçeve, mukarnas kavsara, kitabe
    return doku(256, 512, (x, w, h) => {
      tasZemin(x, w, h, 32);
      x.fillStyle = '#d3c6ac'; x.fillRect(20, 20, w - 40, h - 20);
      x.fillStyle = TAS; x.fillRect(34, 34, w - 68, h - 34);
      // kitabe
      x.fillStyle = '#1d4a3a'; x.fillRect(48, 48, w - 96, 50); x.fillStyle = '#e8c766'; x.font = '700 22px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('بسم الله الرحمن الرحيم', 128, 74);
      // mukarnas: kademeli küçük nişler
      for (let r = 0; r < 6; r++) for (let i = 0; i <= r + 2; i++) { const cx = 128 + (i - (r + 2) / 2) * 22, y1 = 130 + r * 26 + 22; x.fillStyle = r % 2 ? '#c9b994' : '#dccfb2'; sivriKemer(x, cx, y1, 18, 22, x.fillStyle, ['rgba(0,0,0,0.25)', 1]); }
      // kapı boşluğu (alfa ile delinir)
      x.globalCompositeOperation = 'destination-out'; sivriKemer(x, 128, h, 120, 250, '#000', null); x.globalCompositeOperation = 'source-over';
    });
  }
  function korkulukDokusu() {   // şerefe korkuluğu: delikli taş şebeke
    return doku(256, 64, (x, w, h) => {
      x.fillStyle = TAS; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 8; i++) { const cx = (i + 0.5) * 32; x.beginPath(); x.moveTo(cx, 12); x.lineTo(cx + 10, 32); x.lineTo(cx, 52); x.lineTo(cx - 10, 32); x.closePath(); x.fill(); }
      x.globalCompositeOperation = 'source-over';
    });
  }
  function mermerDokusu() {
    return doku(256, 256, (x, w, h) => {
      x.fillStyle = '#e7e4dd'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(150,150,160,${0.08 + Math.random() * 0.1})`; x.lineWidth = 1 + Math.random(); x.beginPath(); let px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (Math.random() - 0.3) * 40; py += (Math.random() - 0.5) * 30; x.lineTo(px, py); } x.stroke(); }
      x.strokeStyle = 'rgba(110,100,90,0.35)'; x.lineWidth = 2; x.strokeRect(0, 0, w, h);
    });
  }

  // ---- 5×7 nokta vuruşlu mahya yazısı (yalnızca gereken harfler) ----
  const HARF = {
    'İ': ['00100', '', '01110', '00100', '00100', '00100', '00100', '00100', '01110'],
    'L': ['', '', '10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    'M': ['', '', '10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    'B': ['', '', '11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    'E': ['', '', '11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    'K': ['', '', '10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    'T': ['', '', '11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    'R': ['', '', '11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    'N': ['', '', '10001', '11001', '11001', '10101', '10011', '10011', '10001'],
    'D': ['', '', '11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  };
  // metni noktalara çevir: [sütun, satır] (satır 0 = üst, İ'nin noktası)
  function mahyaNoktalari(metin) {
    const N = []; let sut = 0;
    for (const ch of metin) {
      if (ch === ' ') { sut += 3; continue; }
      const h = HARF[ch]; if (!h) continue;
      h.forEach((s, r) => { for (let c = 0; c < s.length; c++) if (s[c] === '1') N.push([sut + c, r]); });
      sut += 6;
    }
    return { N, gen: sut - 1 };
  }
  let isikDoku = null;
  function ampulDokusu() {
    if (isikDoku) return isikDoku;
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.45, 'rgba(255,214,120,0.95)'); g.addColorStop(0.7, 'rgba(255,170,60,0.4)'); g.addColorStop(1, 'rgba(255,150,40,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); isikDoku = new THREE.CanvasTexture(c); return isikDoku;
  }
  // mahya: iki minare (A, B) arasında, x = sabit düzlemde; doğudan (+x) bakana soldan sağa okunur (sağ = -z)
  function mahyaKur(grup, metin, x, zA, zB, yUst) {
    const { N, gen } = mahyaNoktalari(metin);
    const L = Math.abs(zB - zA) - 3.2, dx = L / gen, dy = 0.36, zBas = Math.max(zA, zB) - 1.6;
    const P = [];
    for (const [c, r] of N) P.push(x, yUst - 0.9 - r * dy, zBas - c * dx);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const ampul = new THREE.Points(geo, new THREE.PointsMaterial({ map: ampulDokusu(), size: 0.55, sizeAttenuation: true, transparent: true, depthWrite: false, color: '#ffffff' }));
    grup.add(ampul);
    const hale = new THREE.Points(geo, new THREE.PointsMaterial({ map: ampulDokusu(), size: 1.25, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffc46a' }));
    hale.visible = false; GECE.nesne.push(hale); grup.add(hale);
    // taşıyıcı halat: hafif sarkan (zincir eğrisi), ve harflerin asıldığı ince teller
    const H = [], T = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40, z = zA + (zB - zA) * t; H.push(x, yUst + 0.15 - 0.55 * (1 - Math.pow(2 * t - 1, 2)), z); }
    for (let c = 0; c <= gen; c += 6) { const z = zBas - c * dx, t = (z - zA) / (zB - zA); T.push(x, yUst + 0.15 - 0.55 * (1 - Math.pow(2 * t - 1, 2)), z, x, yUst - 0.9 - 8 * dy, z); }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(H, 3));
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(T, 3));
    const hm = new THREE.LineBasicMaterial({ color: '#5a5048', transparent: true, opacity: 0.6 });
    grup.add(new THREE.Line(hg, hm), new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: '#5a5048', transparent: true, opacity: 0.25 })));
    return ampul;
  }

  C.yap = function (grup, b) {
    const cz = (b.z0 + b.z1) / 2;
    const HX0 = b.x0 + 0.5, HX1 = HX0 + 24, HC = HX0 + 12, AX1 = HX1 + 21;     // harim [HX0,HX1], avlu [HX1,AX1]
    const ZY = 12;                                                             // yarı genişlik (z)
    const BODY = 10, KARE = 16, KASNAK = 2.4, R = 6.4;                          // harim duvarı, kubbe kaidesi, kasnak, kubbe yarıçapı
    const Y = new Yigin();
    const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85 }, o));
    // malzemeler (gece taş cephe ve kubbe projektörle sıcak ışık alır)
    const cep = cepheDokusu(false), cepG = cepheDokusu(true);
    const tas = std({ map: cep, emissiveMap: cepG, emissive: '#ffffff', emissiveIntensity: 0 }); GECE.malz.push([tas, 0.85]);
    const duzTasDoku = doku(256, 256, (x, w, h) => tasZemin(x, w, h, 32));
    const duzTas = std({ map: duzTasDoku, emissive: '#ffb860', emissiveIntensity: 0 }); GECE.malz.push([duzTas, 0.16]);
    const kasnakM = std({ map: kasnakDokusu(false), emissiveMap: kasnakDokusu(true), emissive: '#ffffff', emissiveIntensity: 0 }); GECE.malz.push([kasnakM, 1.0]);
    const kd = kubbeDokusu();
    const kursun = std({ map: kd, roughness: 0.45, metalness: 0.55, emissive: '#3a4a60', emissiveIntensity: 0 }); GECE.malz.push([kursun, 0.35]);
    const altin = std({ color: '#e2b23a', roughness: 0.25, metalness: 0.9, emissive: '#7a5a10', emissiveIntensity: 0 }); GECE.malz.push([altin, 0.6]);
    const revakM = std({ map: revakDokusu(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: '#ffb860', emissiveIntensity: 0 }); GECE.malz.push([revakM, 0.16]);
    const tackapiM = std({ map: tackapiDokusu(), alphaTest: 0.5, side: THREE.DoubleSide, emissive: '#ffb860', emissiveIntensity: 0 }); GECE.malz.push([tackapiM, 0.2]);
    const korkulukM = std({ map: korkulukDokusu(), alphaTest: 0.5, side: THREE.DoubleSide });
    const mermer = std({ map: mermerDokusu(), roughness: 0.35 });
    mermer.map.repeat.set(1, 1);
    const sutunM = std({ color: '#efe9de', roughness: 0.4 }), kirmizi = std({ color: '#a33a2a' }), yesil = std({ color: '#1f5a46', roughness: 0.6 });
    const seref = std({ color: '#ffe2a8', emissive: '#ffcf7a', emissiveIntensity: 0 }); seref.userData.gunduz = 0; GECE.malz.push([seref, 1.6]);
    const kutu = (x0, x1, y0, y1, z0, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    const KUT = (x0, x1, z0, z1, y0, ust, ad = 'ev') => KUTULAR.push({ x0, x1, z0, z1, y0, ust, ad });

    // geometri kalıpları (bir kez yaratılır, Yığın kopyalar)
    const G = {
      kure: new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      kureK: new THREE.SphereGeometry(1, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      yarim: new THREE.SphereGeometry(1, 20, 8, 0, Math.PI, 0, Math.PI / 2),      // yarım kubbe (çeyrek küre)
      sil: new THREE.CylinderGeometry(1, 1, 1, 32, 1, true),
      sil4: (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 4); return g; })(),
      sil16: new THREE.CylinderGeometry(1, 1, 1, 16, 1, false),
      sil8: new THREE.CylinderGeometry(1, 1, 1, 8, 1, false),
      kon16: new THREE.ConeGeometry(1, 1, 16, 1, true),
      kutu: new THREE.BoxGeometry(1, 1, 1),
    };
    // dokunun dikey tekrarını kutunun boyuna göre ayarlayan duvar: yan yüzler cephe dokusu (4 m × 10 m bölme)
    function duvar(x0, x1, z0, z1, y0, y1, mat, bolme = 4, kat = 10) {
      const w = x1 - x0, d = z1 - z0, h = y1 - y0, geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
      // BoxGeometry yüz sırası: +x, -x, +y, -y, +z, -z (her biri 4 köşe)
      const boy = [d, d, w, w, w, w], yuk = [h, h, d, d, h, h];
      for (let f = 0; f < 6; f++) for (let q = 0; q < 4; q++) { const i = f * 4 + q; uv.setXY(i, uv.getX(i) * boy[f] / bolme, uv.getY(i) * yuk[f] / kat); }
      Y.ekle(geo, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    }
    function alem(x, y, z, s = 1) {           // kubbe/minare âlemi: çubuk, üç top, hilal
      Y.ekle(G.sil16, altin, x, y + 0.5 * s, z, 0, 0, 0, 0.05 * s, 1 * s, 0.05 * s);
      for (const [h, r] of [[0.25, 0.16], [0.55, 0.12], [0.8, 0.09]]) Y.ekle(new THREE.SphereGeometry(1, 10, 8), altin, x, y + h * s, z, 0, 0, 0, r * s, r * s, r * s);
      Y.ekle(new THREE.TorusGeometry(0.28 * s, 0.05 * s, 6, 16, Math.PI * 1.45), altin, x, y + 1.25 * s, z, 0, Math.PI / 2, Math.PI * 0.27);
    }
    function kubbe(x, y, z, r, kasnakH, kasnakM2, alemS) {   // kasnaklı kubbe
      if (kasnakH > 0) { Y.ekle(r > 3 ? G.sil4 : G.sil, kasnakM2 || duzTas, x, y + kasnakH / 2, z, 0, 0, 0, r * 1.02, kasnakH, r * 1.02); Y.ekle(new THREE.CircleGeometry(1, 24), duzTas, x, y + kasnakH, z, -Math.PI / 2, 0, 0, r, r, 1); }
      Y.ekle(r > 3 ? G.kure : G.kureK, kursun, x, y + kasnakH, z, 0, 0, 0, r, r * 0.92, r);
      if (alemS) alem(x, y + kasnakH + r * 0.92 - 0.05, z, alemS);
    }

    /* ===================== HARİM ===================== */
    // zemin, kaide (subasman)
    Y.ekle(G.kutu, duzTas, (HX0 + AX1) / 2, 0.2, cz, 0, 0, 0, AX1 - HX0 + 1.2, 0.4, 2 * ZY + 1.2);
    // ana gövde (yan galeriler dahil) 10 m
    duvar(HX0, HX1, cz - ZY, cz + ZY, 0.4, BODY, tas);
    KUT(HX0, HX1, cz - ZY, cz + ZY, 0, BODY + 0.3, 'cami');
    KUT(HX1, AX1, cz - ZY, cz + ZY, 0, 0.42, 'avlu');
    // gövde üstü çatı döşemesi (kurşun) ve saçak silmesi
    Y.ekle(G.kutu, kursun, HC, BODY + 0.15, cz, 0, 0, 0, 24.6, 0.3, 2 * ZY + 0.6);
    // payandalar (kuzey ve güney cephe): dışa taşan kalın taş ayaklar
    for (const s of [-1, 1]) for (const px of [HX0 + 2, HC - 6, HC + 6, HX1 - 2]) {
      const z0 = cz + s * ZY, z1 = z0 + s * 1.2;
      duvar(px - 0.7, px + 0.7, Math.min(z0, z1), Math.max(z0, z1), 0.4, BODY - 0.5, duzTas, 2, 2);
      Y.ekle(new THREE.CylinderGeometry(0.05, 1, 1.4, 4, 1), kursun, px, BODY - 0.5 + 0.35, z0 + s * 0.6, 0, Math.PI / 4, 0, 0.75, 0.5, 0.75);
      KUT(px - 0.7, px + 0.7, Math.min(z0, z1), Math.max(z0, z1), 0, BODY - 0.5);
    }
    // merkezî kare (kubbe kaidesi, kemer alınlıkları): 13 × 13 m, 10 → 16 m
    const KX0 = HC - 6.5, KX1 = HC + 6.5;
    duvar(KX0, KX1, cz - 6.5, cz + 6.5, BODY, KARE, tas, 4.33, 10);
    KUT(KX0, KX1, cz - 6.5, cz + 6.5, BODY, KARE, 'cami');
    // kemer alınlıklarındaki büyük pencereler: kuzey ve güney yüzlerde yarım daire kemer (tympanum)
    for (const s of [-1, 1]) {
      Y.ekle(new THREE.CircleGeometry(5.6, 24, 0, Math.PI), kasnakM, HC, BODY + 0.2, cz + s * 6.52, 0, s > 0 ? 0 : Math.PI, 0);
    }
    // kubbe: kasnak (24 pencere) + kurşun kubbe + âlem
    kubbe(HC, KARE, cz, R, KASNAK, kasnakM, 1.6);
    // kasnak payandaları (kubbe eteğinde 24 küçük destek)
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + Math.PI / 24; Y.ekle(G.kutu, duzTas, HC + Math.cos(a) * (R + 0.25), KARE + KASNAK / 2, cz + Math.sin(a) * (R + 0.25), 0, -a, 0, 0.5, KASNAK, 0.4); }
    // çarpışma: kubbeyi kademeli kutularla yaklaşıkla (kubbeye inilebilir)
    {
      const y0 = KARE + KASNAK, rr = R * 0.97;
      KUT(HC - rr * 0.92, HC + rr * 0.92, cz - rr * 0.92, cz + rr * 0.92, KARE, y0, 'ev');
      for (const [a, b2] of [[0, 0.35], [0.35, 0.62], [0.62, 0.82], [0.82, 0.95], [0.95, 1]]) {
        const yh = y0 + R * 0.92 * b2, w = rr * Math.sqrt(1 - a * a) * 0.85;
        KUT(HC - w, HC + w, cz - w, cz + w, y0 + R * 0.92 * a, yh, 'kubbe');
      }
    }
    // yarım kubbeler: kıble ekseninde (batı ve doğu), merkez karenin kenarına yaslanır
    for (const s of [-1, 1]) {
      const x = HC + s * 6.5;
      Y.ekle(G.yarim, kursun, x, BODY, cz, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 5.8, 5.6, 5.8);
      // yarım kubbenin pencereli eteği
      Y.ekle(new THREE.CylinderGeometry(5.85, 5.85, 0.9, 20, 1, true, s > 0 ? 0 : Math.PI, Math.PI), kasnakM, x, BODY + 0.45, cz, 0, 0, 0);
      for (const [a, b2] of [[0, 0.5], [0.5, 0.85], [0.85, 1]]) { const w = 5.6 * Math.sqrt(1 - a * a) * 0.9, yh = BODY + 5.6 * b2; KUT(s > 0 ? x : x - w, s > 0 ? x + w : x, cz - w, cz + w, BODY + 5.6 * a, yh, 'kubbe'); }
      // eksedra kubbecikleri (yarım kubbenin iki yanında)
      for (const t of [-1, 1]) { const ex = x + s * 3.2, ez = cz + t * 7.6; kubbe(ex, BODY, ez, 2.6, 0.6, kasnakM, 0.6); KUT(ex - 2, ex + 2, ez - 2, ez + 2, BODY, BODY + 2.9, 'kubbe'); }
    }
    // yan galeriler: kuzey ve güneyde 4'er küçük kubbe
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const gx = HX0 + 3 + i * 6, gz = cz + s * 9.4;
      if (Math.abs(gx - HC) < 4) { kubbe(gx, BODY, gz, 2.3, 0.5, kasnakM, 0.55); KUT(gx - 1.8, gx + 1.8, gz - 1.8, gz + 1.8, BODY, BODY + 2.6, 'kubbe'); }
      else { kubbe(gx, BODY, gz, 2.0, 0.4, kasnakM, 0.5); KUT(gx - 1.6, gx + 1.6, gz - 1.6, gz + 1.6, BODY, BODY + 2.2, 'kubbe'); }
    }
    // ağırlık kuleleri: merkez karenin dört köşesinde sekizgen kulecikler ve kubbecikleri
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = HC + sx * 6.5, z = cz + sz * 6.5;
      Y.ekle(G.sil8, duzTas, x, KARE + 1.3, z, 0, Math.PI / 8, 0, 1.25, 2.6, 1.25);
      Y.ekle(G.sil8, kasnakM, x, KARE + 2.9, z, 0, Math.PI / 8, 0, 1.0, 0.6, 1.0);
      kubbe(x, KARE + 3.2, z, 1.0, 0, null, 0.45);
      DIREKLER.push({ x, z, h: KARE + 4.4, R: 1.25 });
    }
    // mihrap duvarı tarafında (batı) çıkıntılı mihrap nişi
    duvar(HX0 - 1.4, HX0, cz - 3, cz + 3, 0.4, 7, duzTas, 2, 2);
    Y.ekle(new THREE.CylinderGeometry(3.1, 3.1, 0.4, 16, 1, false, Math.PI, Math.PI), kursun, HX0 - 0.1, 7.2, cz, 0, 0, 0);
    KUT(HX0 - 1.4, HX0, cz - 3, cz + 3, 0, 7.4, 'cami');

    /* ===================== AVLU ===================== */
    const AX0 = HX1, IX0 = AX0 + 4, IX1 = AX1 - 3, IZ0 = cz - ZY + 3, IZ1 = cz + ZY - 3;   // açık avlu iç alanı
    // avlu zemini: mermer
    { const g = new THREE.PlaneGeometry(AX1 - AX0, 2 * ZY); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (AX1 - AX0) / 3, uv.getY(i) * (2 * ZY) / 3); Y.ekle(g, mermer, (AX0 + AX1) / 2, 0.42, cz, -Math.PI / 2, 0, 0); }
    // dış duvarlar (kuzey, güney, doğu); doğu duvarında taçkapı boşluğu
    const DT = 0.7, DH = 6;
    for (const s of [-1, 1]) { const z0 = s < 0 ? cz - ZY : cz + ZY - DT, z1 = z0 + DT; duvar(AX0, AX1, z0, z1, 0.4, DH, tas, 4, 10); KUT(AX0, AX1, z0, z1, 0, DH); }
    for (const [z0, z1] of [[cz - ZY, cz - 2], [cz + 2, cz + ZY]]) { duvar(AX1 - DT, AX1, z0, z1, 0.4, DH, tas, 4, 10); KUT(AX1 - DT, AX1, z0, z1, 0, DH); }
    // taçkapı: dışa taşan yüksek portal, sivri kemerli giriş (4 m genişlik, 5 m yükseklik boşluk)
    {
      const x0 = AX1 - DT - 0.3, x1 = AX1 + 1.4, H = 9.5;
      for (const [z0, z1] of [[cz - 3.2, cz - 2], [cz + 2, cz + 3.2]]) { duvar(x0, x1, z0, z1, 0.4, H, duzTas, 2, 2); KUT(x0, x1, z0, z1, 0, H); }
      duvar(x0, x1, cz - 2, cz + 2, 5.2, H, duzTas, 2, 2); KUT(x0, x1, cz - 2, cz + 2, 5.2, H, 'cami');
      const on = new THREE.PlaneGeometry(6.4, H - 0.4); Y.ekle(on, tackapiM, x1 + 0.02, 0.4 + (H - 0.4) / 2, cz, 0, Math.PI / 2, 0);
      Y.ekle(on, tackapiM, x0 - 0.02, 0.4 + (H - 0.4) / 2, cz, 0, -Math.PI / 2, 0);
      Y.ekle(G.kutu, kursun, (x0 + x1) / 2, H + 0.1, cz, 0, 0, 0, x1 - x0 + 0.3, 0.2, 6.7);
      // basamaklar
      for (let i = 0; i < 3; i++) Y.ekle(G.kutu, mermer, x1 + 0.5 + i * 0.4, 0.3 - i * 0.1, cz, 0, 0, 0, 1.2 - i * 0.4 + 0.4, 0.2, 4.2 + i * 0.4);
    }
    // revaklar: kuzey, güney, doğu (3 m derin, 4,6 m'ye kadar sütunlu, kubbeli); batıda son cemaat yeri (4 m, 6,6 m)
    // revak: açık kenarı (acik) avluya bakan, sütunlu, kubbeli galeri. Sütunlar açık kenarda bölme sınırlarında,
    // her bölmenin üstünde bir kubbe; açık kenar beyaz-kırmızı almaşık sivri kemerli (dokuda alfa ile oyulmuş).
    const revak = (x0, x1, z0, z1, H, acik) => {
      const eksX = acik[0] === 'z', L = eksX ? x1 - x0 : z1 - z0, D = eksX ? z1 - z0 : x1 - x0;
      const n = Math.max(1, Math.round(L / 3.2)), bay = L / n, r = Math.min(bay, D) / 2 - 0.08;
      const kx = acik === 'x0' ? x0 : acik === 'x1' ? x1 : 0, kz = acik === 'z0' ? z0 : acik === 'z1' ? z1 : 0;
      Y.ekle(G.kutu, duzTas, (x0 + x1) / 2, H + 0.25, (z0 + z1) / 2, 0, 0, 0, x1 - x0, 0.5, z1 - z0);
      KUT(x0, x1, z0, z1, H, H + 0.5, 'cami');
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) * bay, x = eksX ? x0 + t : (x0 + x1) / 2, z = eksX ? (z0 + z1) / 2 : z0 + t;
        kubbe(x, H + 0.5, z, r, 0.3, duzTas, 0.35);
      }
      KUT(x0 + (eksX ? 0 : 0.4), x1 - (eksX ? 0 : 0.4), z0 + (eksX ? 0.4 : 0), z1 - (eksX ? 0.4 : 0), H + 0.5, H + 0.5 + r * 0.8, 'kubbe');
      for (let i = 0; i <= n; i++) {
        const cx2 = eksX ? x0 + i * bay : kx + (acik === 'x0' ? 0.3 : -0.3), cz2 = eksX ? kz + (acik === 'z0' ? 0.3 : -0.3) : z0 + i * bay;
        Y.ekle(G.sil16, sutunM, cx2, 0.4 + (H - 0.4) / 2, cz2, 0, 0, 0, 0.24, H - 0.4, 0.24);
        Y.ekle(G.kutu, duzTas, cx2, H - 0.2, cz2, 0, 0, 0, 0.6, 0.4, 0.6);
        Y.ekle(G.kutu, duzTas, cx2, 0.55, cz2, 0, 0, 0, 0.55, 0.3, 0.55);
        DIREKLER.push({ x: cx2, z: cz2, h: H, R: 0.3 });
      }
      // kemer dizisi (açık kenarın düzleminde, sütunların hemen içinde)
      const g = new THREE.PlaneGeometry(L, H - 0.4), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * n);
      if (eksX) Y.ekle(g, revakM, (x0 + x1) / 2, 0.4 + (H - 0.4) / 2, kz + (acik === 'z0' ? 0.3 : -0.3), 0, 0, 0);
      else Y.ekle(g, revakM, kx + (acik === 'x0' ? 0.3 : -0.3), 0.4 + (H - 0.4) / 2, (z0 + z1) / 2, 0, Math.PI / 2, 0);
    };
    const RZ0 = cz - ZY + DT, RZ1 = cz + ZY - DT, RX1 = AX1 - DT;
    revak(AX0 + 4, IX1, RZ0, IZ0, 4.6, 'z1');            // güney
    revak(AX0 + 4, IX1, IZ1, RZ1, 4.6, 'z0');            // kuzey
    revak(IX1, RX1, IZ0, IZ1, 4.6, 'x0');                // doğu
    revak(AX0, AX0 + 4, RZ0, RZ1, 6.6, 'x1');            // son cemaat yeri (daha yüksek, daha büyük kubbeler)
    // köşe bölmeleri (doğu revağı ile kuzey/güney revaklarının birleştiği kareler)
    for (const [z0, z1] of [[RZ0, IZ0], [IZ1, RZ1]]) {
      Y.ekle(G.kutu, duzTas, (IX1 + RX1) / 2, 4.85, (z0 + z1) / 2, 0, 0, 0, RX1 - IX1, 0.5, z1 - z0);
      KUT(IX1, RX1, z0, z1, 4.6, 5.1, 'cami'); kubbe((IX1 + RX1) / 2, 5.1, (z0 + z1) / 2, Math.min(RX1 - IX1, z1 - z0) / 2 - 0.08, 0.3, duzTas, 0.35);
    }
    // harim kapısı (son cemaat yerinin arkasında)
    Y.ekle(new THREE.PlaneGeometry(3, 4.6), yesil, HX1 + 0.03, 2.7, cz, 0, Math.PI / 2, 0);
    // şadırvan: sekizgen havuz, musluklar, sütunlu çardak, kurşun saçaklı kubbe ve âlem
    {
      const sx = (IX0 + IX1) / 2, sz = cz;
      Y.ekle(G.sil8, mermer, sx, 0.75, sz, 0, Math.PI / 8, 0, 2.1, 0.7, 2.1);
      Y.ekle(G.sil8, std({ color: '#4d93b6', roughness: 0.1, metalness: 0.3 }), sx, 1.11, sz, 0, Math.PI / 8, 0, 1.75, 0.02, 1.75);
      Y.ekle(G.sil8, mermer, sx, 1.6, sz, 0, Math.PI / 8, 0, 0.9, 1.2, 0.9);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        Y.ekle(G.sil16, sutunM, sx + Math.cos(a) * 2.25, 0.4 + 1.6, sz + Math.sin(a) * 2.25, 0, 0, 0, 0.13, 3.2, 0.13);
        Y.ekle(G.kutu, altin, sx + Math.cos(a) * 0.95, 1.55, sz + Math.sin(a) * 0.95, 0, -a, 0, 0.18, 0.05, 0.05);
      }
      Y.ekle(G.sil8, duzTas, sx, 3.7, sz, 0, Math.PI / 8, 0, 2.7, 0.3, 2.7);
      Y.ekle(new THREE.ConeGeometry(3.2, 0.9, 8, 1, true), kursun, sx, 4.2, sz, 0, Math.PI / 8, 0);
      kubbe(sx, 4.4, sz, 1.4, 0.3, duzTas, 0.5);
      DIREKLER.push({ x: sx, z: sz, h: 3.6, R: 2.3 });
      KUT(sx - 2.3, sx + 2.3, sz - 2.3, sz + 2.3, 3.6, 4.6, 'sadirvan');
      C.sadirvan = { x: sx, z: sz };
    }

    /* ===================== MİNARELER ===================== */
    const minareler = [];
    const minare = (x, z, H, serefeler) => {
      // kaide (kürsü): sekizgen, 4 m
      Y.ekle(G.sil8, duzTas, x, 2.4, z, 0, Math.PI / 8, 0, 1.55, 4, 1.55);
      Y.ekle(new THREE.CylinderGeometry(1.05, 1.55, 1.2, 16, 1), duzTas, x, 5.0, z);           // pabuç
      let y = 5.6;
      for (const ys of serefeler) {
        Y.ekle(G.sil16, duzTas, x, (y + ys) / 2, z, 0, 0, 0, 1.0, ys - y, 1.0);                // gövde (16 yüzlü)
        Y.ekle(new THREE.CylinderGeometry(1.55, 1.0, 0.9, 16, 1), duzTas, x, ys + 0.45, z);    // mukarnaslı şerefe altı
        Y.ekle(G.sil16, duzTas, x, ys + 0.95, z, 0, 0, 0, 1.6, 0.1, 1.6);                      // şerefe döşemesi
        const kg = new THREE.CylinderGeometry(1.6, 1.6, 0.9, 32, 1, true), uv = kg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 4);
        Y.ekle(kg, korkulukM, x, ys + 1.45, z);                                                // korkuluk
        Y.ekle(new THREE.TorusGeometry(1.6, 0.05, 4, 32), seref, x, ys + 1.92, z, Math.PI / 2, 0, 0);   // şerefe kandilleri (gece yanar)
        y = ys + 1.0;
      }
      const petek = y + 2.8;
      Y.ekle(G.sil16, duzTas, x, (y + petek) / 2, z, 0, 0, 0, 0.78, petek - y, 0.78);          // petek
      Y.ekle(G.sil16, duzTas, x, petek + 0.15, z, 0, 0, 0, 0.98, 0.3, 0.98);                  // külah saçağı
      Y.ekle(new THREE.ConeGeometry(0.95, H - petek - 1.5, 16, 1), kursun, x, petek + 0.3 + (H - petek - 1.5) / 2, z);   // külah (kurşun)
      alem(x, H - 1.25, z, 1.0);
      DIREKLER.push({ x, z, h: H - 1.2, R: 1.6 });
      KUT(x - 1.6, x + 1.6, z - 1.6, z + 1.6, 0, 4.4);
      minareler.push({ x, z, H, ust: serefeler[serefeler.length - 1] + 1 });
    };
    minare(HX1, cz - ZY - 2, 38, [17, 23, 28.5]);
    minare(HX1, cz + ZY + 2, 38, [17, 23, 28.5]);
    minare(AX1, cz - ZY - 2, 31, [16, 22]);
    minare(AX1, cz + ZY + 2, 31, [16, 22]);

    /* ===================== BAHÇE ===================== */
    // alçak bahçe duvarı (bloğun kenarında), girişlerde boşluk
    const bt = std({ map: duzTasDoku });
    const bduvar = (x0, x1, z0, z1) => { duvar(x0, x1, z0, z1, 0.15, 1.4, bt, 2, 2); Y.ekle(G.kutu, kursun, (x0 + x1) / 2, 1.45, (z0 + z1) / 2, 0, 0, 0, x1 - x0 + 0.1, 0.1, z1 - z0 + 0.1); KUT(x0, x1, z0, z1, 0, 1.5); };
    const BX0 = b.x0 - 1.5, BX1 = b.x1 + 1.5, BZ0 = b.z0 - 1.5, BZ1 = b.z1 + 1.5;
    bduvar(BX0, BX0 + 0.4, BZ0, BZ1);
    bduvar(BX1 - 0.4, BX1, BZ0, cz - 4); bduvar(BX1 - 0.4, BX1, cz + 4, BZ1);
    for (const [z0, z1] of [[BZ0, BZ0 + 0.4], [BZ1 - 0.4, BZ1]]) { bduvar(BX0, (BX0 + BX1) / 2 - 3, z0, z1); bduvar((BX0 + BX1) / 2 + 3, BX1, z0, z1); }
    // bahçe çimi
    { const g = new THREE.PlaneGeometry(BX1 - BX0 - 0.8, BZ1 - BZ0 - 0.8); Y.ekle(g, std({ color: '#5f8f45', roughness: 1 }), (BX0 + BX1) / 2, 0.165, (BZ0 + BZ1) / 2, -Math.PI / 2, 0, 0); }
    // taş yollar: doğu kapısından taçkapıya
    { const g = new THREE.PlaneGeometry(BX1 - AX1, 4); Y.ekle(g, mermer, (AX1 + BX1) / 2, 0.18, cz, -Math.PI / 2, 0, 0); }
    Y.kur(grup);

    // servi ağaçları (ince uzun koyu yeşil), tek InstancedMesh
    {
      const yer = [];
      for (let x = HX0 + 1; x < AX1; x += 4.2) for (const s of [-1, 1]) { const z = cz + s * (ZY + 4.6); if (minareler.some((m) => Math.hypot(m.x - x, m.z - z) < 3)) continue; if (Math.abs(z - cz) + 0.5 < b.z1 - cz + 1) yer.push([x, z]); }
      for (let z = cz - ZY; z <= cz + ZY; z += 4.5) yer.push([BX0 + 1.6, z]);
      const n = yer.length, o = new THREE.Object3D();
      const tac = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.75, 1, 8, 3), std({ color: '#2b4a2c', flatShading: true }), n);
      yer.forEach(([x, z], i) => { const h = 6 + ((i * 7) % 5) * 0.6; o.position.set(x, 0.15 + h / 2 + 0.4, z); o.scale.set(1, h, 1); o.updateMatrix(); tac.setMatrixAt(i, o.matrix); DIREKLER.push({ x, z, h: h + 0.5, R: 0.6 }); });
      tac.castShadow = true; grup.add(tac);
    }

    // mahyalar: üstte uzun minareler, altta kısa minareler (doğudan, avlu kapısı tarafından okunur)
    const m1 = minareler[0], m2 = minareler[1], m3 = minareler[2], m4 = minareler[3];
    mahyaKur(grup, 'İLİM İLİM BİLMEKTİR', m1.x, m2.z - 1.0, m1.z + 1.0, m1.ust + 1.6);
    mahyaKur(grup, 'İLİM KENDİN BİLMEKTİR', m3.x, m4.z - 1.0, m3.z + 1.0, m3.ust + 1.6);

    C.harim = { x0: HX0, x1: HX1, z0: cz - ZY, z1: cz + ZY, cx: HC, cz };
    C.avlu = { x0: IX0, x1: IX1, z0: IZ0, z1: IZ1, x: (IX0 + IX1) / 2, z: cz };
    C.kubbe = { x: HC, z: cz, y: KARE + KASNAK + R * 0.92 };
    C.minareler = minareler;
    C.giris = { x: AX1 + 6, z: cz };
    return C;
  };

  // kurtarma görevi için camide saklanma yerleri
  C.saklanma = function () {
    if (!C.avlu) return [];
    const a = C.avlu, Y = [];
    Y.push({ x: a.x + 3.2, z: a.z + 0.4, y: 0.42, tur: 'acik', ad: 'cami avlusunda, şadırvanın yanında' });
    Y.push({ x: a.x0 - 2, z: a.z - 5, y: 0.42, tur: 'acik', ad: 'caminin son cemaat yerinde' });
    Y.push({ x: a.x1 + 1.5, z: a.z + 7.5, y: 0.42, tur: 'alti', ad: 'cami revağının bir köşesinde' });
    Y.push({ x: C.sadirvan.x + 0.5, z: C.sadirvan.z + 0.6, y: 4.6, tur: 'cati', ad: 'şadırvanın kubbesinde' });
    Y.push({ x: C.harim.x0 + 6, z: C.harim.z0 + 1.0, y: 10.3, tur: 'cati', ad: 'caminin çatısında, küçük kubbelerin arasında' });
    return Y;
  };
  window.CAMI = C;
})();
