/* =====================================================================
   GECE ARAMA-KURTARMA 2.0 — kayıp kedi Pamuk
   Öğrenci görüşlerinden (Kasım 2026): "kedi hep aynı 3-4 yere saklanıyor,
   sesinden yerini buluyorum, rastgele ve ipuçlu olsun, rekor olsun."

   • Saklanma yerleri sabit liste değil: kasabanın kendisinden üretilir
     (ev duvar dipleri, düz çatılar, araba altları ve tavanları, durak bankı,
     ağaç dipleri ve dalları, kale fileleri, çimenlik). 150'den fazla aday.
   • Kedinin davranışı var: pervane gürültüsü kediye ulaşınca (desibel)
     ürker ve başka yere kaçar; ağaçtakiler mahsurdur, kaçamaz.
     Ses düzeyi: L = L₁ − 20·log₁₀(d)  (uzaklık iki katına çıkınca −6 dB)
   • Komşu ihbarı: haritada belirsizlik çemberi. Zamanla daralır, ama
     kedinin tam yerini hiçbir zaman söylemez.
   • Termal kamera (G tuşu): sıcak cisimler beyaz görünür. Kirpiler de
     sıcaktır, kafa karıştırır. Kamera pilden ek güç çeker.
   • Seviyeler: Kolay / Orta / Zor / Günün Kedisi (o gün herkes için aynı).
   • Rekorlar bu cihazda saklanır; fizik dışı hareket algılanırsa sayılmaz.

   Ana betikten ÖNCE yüklenir; ana betiğin değişkenlerine (THREE, uc, gorevD,
   KUTULAR, zeminY, gorevGrubu, bildir, kediYap …) yalnızca çağrı anında erişir.
   ===================================================================== */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const sakla = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const getir = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const say = (x, b = 1) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b });
  const log10 = Math.log10;

  const SEVIYE = {
    kolay: { ad: 'Kolay', kacis: 0, esik: Infinity, miyavOrt: 5, miyavMenzil: 45, yonlu: true, ihbar: [[0, 22], [45, 12]], kirpi: 0, gizli: 0.15,
      not: 'Pamuk yerinden kımıldamaz, sık ve yönlü miyavlar (kulaklıkla sağ-sol duyulur). Komşu ihbarı hemen gelir.' },
    orta: { ad: 'Orta', kacis: 1, esik: 62, miyavOrt: 9, miyavMenzil: 40, yonlu: true, ihbar: [[15, 35], [75, 20]], kirpi: 2, gizli: 0.35,
      not: 'Pervane gürültüsü kediye 62 dB\'i aşarsa bir kez ürküp kaçar. Bazen araba altına ya da ağaca saklanır. İki kirpi de dolaşıyor.' },
    zor: { ad: 'Zor', kacis: 2, esik: 58, miyavOrt: 15, miyavMenzil: 30, yonlu: false, ihbar: [[40, 45], [110, 28]], kirpi: 3, gizli: 0.5,
      not: '58 dB\'de ürker, iki kez kaçabilir. Nadiren miyavlar, sesin yönü anlaşılmaz. İhbar geç gelir. Üç kirpi termalde kafa karıştırır.' },
    gun: { ad: 'Günün Kedisi', gun: true, kacis: 2, esik: 58, miyavOrt: 15, miyavMenzil: 30, yonlu: false, ihbar: [[40, 45], [110, 28]], kirpi: 3, gizli: 0.5,
      not: 'Zor kuralları. Bugün herkes için Pamuk aynı yerde saklanıyor: sınıfça yarışın!' },
  };
  const TERMAL_W = 9;          // termal kamera + görüntü vericinin çektiği güç (W)
  const KOSU_HIZ = 6;          // kaçan kedinin hızı (m/s); gerçek kediler kısa mesafede 10 m/s'yi aşar

  const bugun = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function tohumlu(s) {   // mulberry32: aynı tohum → aynı sayı dizisi
    return function () { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const tarihTohum = () => +bugun().replace(/-/g, '');

  /* ---------- saklanma yerleri: kasabanın kendisinden ---------- */
  let YERLER = null;
  function yerleriUret() {
    const Y = [], kasabada = (x, z) => x > -144 && x < -18 && z > -82 && z < 28;
    const icerde = (x, z, p = 0.3) => KUTULAR.some((k) => x > k.x0 - p && x < k.x1 + p && z > k.z0 - p && z < k.z1 + p);
    const ekle = (x, z, y, tur, ad) => { if (kasabada(x, z)) Y.push({ x, z, y, tur, ad }); };
    for (const k of KUTULAR) {
      const cx = (k.x0 + k.x1) / 2, cz = (k.z0 + k.z1) / 2, w = k.x1 - k.x0, d = k.z1 - k.z0;
      if (k.ad === 'ev') {
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const x = cx + sx * (w / 2 + 0.55), z = cz + sz * (d / 2 + 0.55);
          if (!icerde(x, z, 0.1)) ekle(x, z, 0, 'acik', 'bir evin duvar dibinde');
        }
        if (Math.abs((k.ust % 3) - 0.5) < 0.05) {   // düz çatılı apartman: çatıya çıkmış olabilir
          ekle(cx + w * 0.25, cz - d * 0.25, k.ust, 'cati', 'bir apartmanın çatısında');
          ekle(cx - w * 0.3, cz + d * 0.3, k.ust, 'cati', 'bir apartmanın çatısında');
        }
      } else if (k.ad === 'araba') {
        ekle(cx, cz, 0, 'alti', 'park etmiş bir arabanın altında');
        ekle(cx + (w > d ? 0.6 : 0), cz + (w > d ? 0 : 0.6), k.ust, 'acik', 'bir arabanın tavanında');
        const x = cx + (w > d ? 0 : w / 2 + 0.5), z = cz + (w > d ? d / 2 + 0.5 : 0);
        ekle(x, z, 0, 'acik', 'bir arabanın yanında');
      } else if (k.ad === 'durak') {
        ekle(cx, cz - 0.4, 0, 'alti', 'durağın bankının altında');
        ekle(cx + 3, cz + 1.2, 0, 'acik', 'otobüs durağının yanında');
      } else if (k.ad === 'cati') {
        for (const [x, z] of [[k.x0 + 2, k.z0 + 2], [k.x1 - 2, k.z1 - 2], [k.x1 - 3, k.z0 + 2], [k.x0 + 14, k.z1 - 2]]) {
          if (Math.abs(zeminY(x, z) - k.ust) < 0.01) ekle(x, z, k.ust, 'cati', 'okulun çatısında');
        }
      }
    }
    for (const a of yuvarlakAgaclar) {
      ekle(a.x + 0.55, a.z + 0.2, 0, 'acik', 'bir ağacın dibinde');
      ekle(a.x + 0.38 * a.s, a.z - 0.15, 2.05 * a.s, 'agac', 'bir ağacın dallarında');
    }
    for (const s of [-1, 1]) ekle(-38 + s * 17.9, -59 + 0.8, 0, 'acik', 'futbol kalesinin filesinde');
    const r = tohumlu(4242);
    for (let i = 0, n = 0; i < 400 && n < 45; i++) {     // çimenlik ve kaldırımlarda gelişigüzel noktalar
      const x = -142 + r() * 122, z = -80 + r() * 106;
      if (icerde(x, z, 0.8) || Math.hypot(x + 38, z + 59) < 12 && Math.abs(z + 59) < 10) continue;
      if (yuvarlakAgaclar.some((a) => Math.hypot(a.x - x, a.z - z) < 1.2)) continue;
      ekle(x, z, 0, 'acik', 'açıkta'); n++;
    }
    return Y;
  }

  /* ---------- modeller ---------- */
  const sicaklar = [];   // termal kamerada parlayan ağlar: { m, mat }
  const sicakMat = (renk) => new THREE.MeshBasicMaterial({ color: renk, fog: false });
  function sicakYap(grup, renk) {
    const mat = sicakMat(renk);
    grup.traverse((o) => { if (o.isMesh && o !== grup.userData.halka) { o.layers.enable(1); sicaklar.push({ m: o, mat }); } });
  }
  function kirpiYap(x, y, z) {
    const k = new THREE.Group();
    const govde = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5b4733', roughness: 1, flatShading: true }));
    govde.scale.set(1, 0.85, 1.35); k.add(govde);
    const burun = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), new THREE.MeshStandardMaterial({ color: '#8a6e52' }));
    burun.rotation.x = -Math.PI / 2; burun.position.set(0, 0.05, -0.24); k.add(burun);
    k.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    k.position.set(x, y, z); k.rotation.y = Math.random() * 6; gorevGrubu.add(k);
    sicakYap(k, '#c9c9c9');
    return k;
  }
  function cemberYap(R) {
    const m = new THREE.Mesh(new THREE.RingGeometry(R - 0.5, R, 72), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 3; gorevGrubu.add(m); return m;
  }


  /* ---------- Van kedisi ----------
     Bembeyaz, yarı uzun tüylü; başında ve kulak diplerinde kızıl lekeler, kuyruğu kızıl halkalı.
     Gözler farklı renkte (biri mavi, biri kehribar). Gece ışık gelince kehribar göz yeşilimsi parlar;
     mavi gözün arkasındaki yansıtıcı tabakada pigment az olduğundan o göz kırmızımsı parlar. */
  function vanKedisi() {
    const k = new THREE.Group(), ic = new THREE.Group(); k.add(ic);
    const M = (renk, o) => new THREE.MeshStandardMaterial(Object.assign({ color: renk, roughness: 0.95 }, o));
    const beyaz = M('#f3efe6'), kizil = M('#c56a2c'), pembe = M('#e9a3a6'), koyu = M('#2a2220');
    const kure = (r, m, x, y, z, sx = 1, sy = 1, sz = 1, ana = ic) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); ana.add(o); return o; };
    // gövde: göğüs, karın, kalça
    const govde = new THREE.Group(); ic.add(govde);
    kure(0.1, beyaz, 0, 0.205, 0.015, 1.02, 0.98, 2.25, govde);
    kure(0.092, beyaz, 0, 0.215, -0.1, 1.0, 1.06, 1.0, govde);
    kure(0.09, beyaz, 0, 0.21, 0.13, 1.08, 1.0, 1.0, govde);
    // bacaklar: kalçadan dönen gruplar (koşarken salınır)
    const bacaklar = [];
    for (const [x, z, on] of [[-0.055, -0.13, 1], [0.055, -0.13, 1], [-0.058, 0.15, 0], [0.058, 0.15, 0]]) {
      const kalca = new THREE.Group(); kalca.position.set(x, 0.18, z); ic.add(kalca);
      const ust = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.1, 8), beyaz); ust.position.y = -0.05; kalca.add(ust);
      const alt = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.017, 0.09, 8), beyaz); alt.position.set(0, -0.12, on ? 0 : 0.008); kalca.add(alt);
      kure(0.024, beyaz, 0, -0.165, on ? -0.01 : 0.004, 1, 0.65, 1.3, kalca);   // pati
      bacaklar.push(kalca);
    }
    // baş: boyun, kafa, ağız, burun, kulaklar, lekeler
    const bas = new THREE.Group(); bas.position.set(0, 0.3, -0.2); ic.add(bas);
    kure(0.06, beyaz, 0, -0.04, 0.05, 1, 1, 1.2, bas);                                 // boyun
    kure(0.068, beyaz, 0, 0, 0, 1.1, 0.95, 1, bas);                                     // kafa
    kure(0.042, beyaz, 0, -0.03, -0.058, 1.15, 0.8, 0.9, bas);                          // ağız
    kure(0.012, pembe, 0, -0.012, -0.096, 1.2, 0.8, 0.8, bas);                          // burun
    kure(0.034, kizil, -0.03, 0.045, 0.002, 1.1, 0.42, 1.15, bas); kure(0.034, kizil, 0.03, 0.045, 0.002, 1.1, 0.42, 1.15, bas);   // Van lekeleri (kulak dibinde)
    for (const s of [-1, 1]) {
      const kulak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.065, 4), kizil); kulak.position.set(s * 0.045, 0.085, 0.005); kulak.rotation.set(-0.15, Math.PI / 4, s * -0.28); bas.add(kulak);
      const icKulak = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 4), pembe); icKulak.position.set(s * 0.044, 0.08, -0.008); icKulak.rotation.set(-0.15, Math.PI / 4, s * -0.28); bas.add(icKulak);
    }
    const gozler = [];
    for (const [s, taban, parilti] of [[-1, [0.29, 0.6, 1], [1, 0.25, 0.18]], [1, [0.92, 0.66, 0.2], [0.45, 1, 0.3]]]) {
      const goz = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(...taban) }));
      goz.position.set(s * 0.031, 0.012, -0.068); goz.scale.set(1, 0.8, 0.6); bas.add(goz);
      const bebek = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: '#111' })); bebek.position.set(s * 0.031, 0.012, -0.076); bebek.scale.set(0.5, 1, 0.5); bas.add(bebek);
      goz.userData.taban = taban; goz.userData.parilti = parilti; gozler.push(goz);
    }
    // bıyıklar
    const bp = []; for (const s of [-1, 1]) for (const a of [-0.12, 0, 0.12]) bp.push(s * 0.025, -0.035, -0.08, s * 0.11, -0.03 + a * 0.2, -0.09 + a * 0.1);
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    bas.add(new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })));
    // kuyruk: kızıl halkalı, gür; zincir halinde (her halka bir öncekine bağlı, kıvrılabilir)
    const kuyruk = new THREE.Group(); kuyruk.position.set(0, 0.24, 0.24); ic.add(kuyruk);
    let ana = kuyruk; const halkalar = [];
    for (let i = 0; i < 9; i++) {
      const p = new THREE.Group(); p.position.set(0, i ? 0.03 : 0, 0); p.rotation.x = i ? 0.09 : 1.0; ana.add(p);
      kure(0.029 - i * 0.0012, i < 3 ? beyaz : (i >> 1) % 2 ? kizil : beyaz, 0, 0.018, 0, 1, 1.3, 1, p);
      halkalar.push(p); ana = p;
    }
    k.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const halka = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.3, 40), new THREE.MeshBasicMaterial({ color: '#3ddc97', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    halka.rotation.x = -Math.PI / 2; halka.position.y = 0.05; halka.visible = false; k.add(halka);
    Object.assign(k.userData, { ic, bas, bacaklar, kuyruk: halkalar, gozler, halka, faz: Math.random() * 6 });
    return k;
  }
  // her kare: nefes, kuyruk sallama, baş çevirme; koşarken bacaklar salınır
  function kediCanlandir(k, dt, kosuyor, sinme) {
    const d = k.userData; if (!d.ic) return;
    d.faz += dt * (kosuyor ? 14 : 1);
    const f = d.faz;
    d.bacaklar.forEach((b, i) => { b.rotation.x = kosuyor ? Math.sin(f + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.7 : 0; });
    d.kuyruk.forEach((h, i) => { h.rotation.z = Math.sin(f * (kosuyor ? 0.3 : 1.6) - i * 0.5) * (kosuyor ? 0.05 : 0.12); });
    d.bas.rotation.y = kosuyor ? 0 : Math.sin(f * 0.37) * 0.5;
    d.ic.scale.y = (sinme ? 0.78 : 1) * (1 + Math.sin(f * 2.2) * (kosuyor ? 0 : 0.015));
  }

  /* ---------- sesler ---------- */
  function sesBaglam() { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; return miyav.c || (miyav.c = new AC()); }
  function kediSesi(guc, pan) {
    if (!sesAcik) return;
    try {
      const c = sesBaglam(); if (!c) return; const t = c.currentTime;
      const o = c.createOscillator(), f = c.createBiquadFilter(), k = c.createGain();
      const p = c.createStereoPanner ? c.createStereoPanner() : null;
      const ust = 760 + Math.random() * 160;
      o.type = 'sawtooth'; f.type = 'bandpass'; f.Q.value = 3;
      o.frequency.setValueAtTime(500, t); o.frequency.linearRampToValueAtTime(ust, t + 0.18); o.frequency.linearRampToValueAtTime(540, t + 0.62);
      f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1600, t + 0.2); f.frequency.linearRampToValueAtTime(800, t + 0.6);
      k.gain.setValueAtTime(0, t); k.gain.linearRampToValueAtTime(0.18 * guc, t + 0.06); k.gain.linearRampToValueAtTime(0, t + 0.66);
      o.connect(f); f.connect(k);
      if (p) { p.pan.value = Math.max(-1, Math.min(1, pan || 0)); k.connect(p); p.connect(c.destination); } else k.connect(c.destination);
      o.start(t); o.stop(t + 0.7);
    } catch (e) {}
  }
  function tisla(guc) {     // ürken kedinin tıslaması: süzgeçten geçmiş beyaz gürültü
    if (!sesAcik) return;
    try {
      const c = sesBaglam(); if (!c) return; const t = c.currentTime, n = Math.floor(c.sampleRate * 0.5);
      const b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), k = c.createGain();
      s.buffer = b; f.type = 'highpass'; f.frequency.value = 2500; k.gain.value = 0.12 * guc;
      s.connect(f); f.connect(k); k.connect(c.destination); s.start(t);
    } catch (e) {}
  }

  /* ---------- seviye paneli ---------- */
  function rekorAnahtar(sev) { return sev === 'gun' ? 'dronSim.kurtarma.gun.' + bugun() : 'dronSim.kurtarma.' + sev; }
  function rekorYazi(sev) { const r = getir(rekorAnahtar(sev)); return r ? `${sev === 'gun' ? 'Bugünün en iyisi' : 'Rekor'}: ${say(r.t, 1)} s` : 'Henüz rekor yok'; }
  function panelGoster(g) {
    let p = $('kurtarmaP');
    if (!p) {
      p = document.createElement('div'); p.id = 'kurtarmaP'; p.className = 'panel ek-panel'; p.style.width = 'min(640px,calc(100% - 24px))';
      p.setAttribute('role', 'dialog'); p.setAttribute('aria-labelledby', 'kurtarmaBaslik'); $('hud').append(p);
      p.addEventListener('click', (e) => { const b = e.target.closest('[data-sev]'); if (b) secildi(b.dataset.sev); });
    }
    p.innerHTML = `<h3 id="kurtarmaBaslik">Gece arama-kurtarma: seviye seç</h3>
      <p>Pamuk akşam kaybolmuş. Kasabanın <b>150'den fazla</b> köşesinden birinde saklanıyor ve her uçuşta yeri değişiyor. İniş fenerinle ara, miyavına kulak ver, komşu ihbarlarının <b style="color:#ffd23f">sarı çemberine</b> bak.</p>
      <div class="kurtar-sev">${Object.entries(SEVIYE).map(([k, s], i) => `<button class="dg" data-sev="${k}"><b>${i + 1}. ${s.ad}</b><small>${s.not}</small><small class="rek">${rekorYazi(k)}</small></button>`).join('')}</div>
      <p class="ek-not"><b>Termal kamera:</b> G tuşu ya da üstteki Termal düğmesi. Sıcak cisimler beyaz görünür; pilden ${TERMAL_W} W ek güç çeker. <b>Sessiz yaklaş:</b> gazı kıstıkça pervane gürültüsü azalır.</p>
      <p class="ek-not"><b>Fener:</b> Q/E sağa-sola, Z/X aşağı-yukarı, N demeti daraltır (uzağa vurur), M genişletir, B odak, 0 ortalar. Dokunmatikte sağdaki FENER paneli.</p>`;
    p.hidden = false; g.bekle = true;
    setTimeout(() => { const b = p.querySelector('[data-sev]'); if (b) b.focus(); }, 50);
  }
  function secildi(sev) {
    const g = gorevD; if (!g || g.tip !== 'kurtarma' || !g.bekle) return;
    $('kurtarmaP').hidden = true;
    basla(g, sev);
  }
  addEventListener('keydown', (e) => {
    const g = gorevD;
    if (typeof durum === 'undefined' || durum !== 'ucus' || !g || g.tip !== 'kurtarma') return;
    if (g.bekle && /^Digit[1-4]$/.test(e.code)) { secildi(Object.keys(SEVIYE)[+e.code.slice(5) - 1]); e.preventDefault(); }
    else if (!g.bekle && e.code === 'KeyG') termalDegis();
  });

  /* ---------- görev ---------- */
  function basla(g, sev) {
    const S = SEVIYE[sev];
    if (!YERLER) YERLER = yerleriUret();
    sicaklar.length = 0;
    g.sev = sev; g.S = S; g.rnd = S.gun ? tohumlu(tarihTohum()) : Math.random;
    const r = g.rnd;
    // gizli yer (araba altı, ağaç, çatı) mı açık yer mi?
    const gizliler = YERLER.filter((y) => y.tur !== 'acik'), aciklar = YERLER.filter((y) => y.tur === 'acik');
    const havuz = r() < S.gizli ? gizliler : aciklar;
    g.yer = havuz[Math.floor(r() * havuz.length)];
    g.kedi = kediYap(g.yer.x, g.yer.z); g.kedi.position.y = g.yer.y;
    sicakYap(g.kedi, '#ffffff');
    g.kediPoz = g.kedi.position.clone();
    g.kirpiler = [];
    for (let i = 0; i < S.kirpi; i++) {
      let y = null;
      for (let j = 0; j < 30 && !y; j++) { const a = aciklar[Math.floor(r() * aciklar.length)]; if (Math.hypot(a.x - g.yer.x, a.z - g.yer.z) > 20) y = a; }
      if (y) g.kirpiler.push({ m: kirpiYap(y.x, 0, y.z), faz: r() * 6, gorme: 0, tanindi: false, x0: y.x, z0: y.z });
    }
    g.bulundu = false; g.gorme = 0; g.urkme = 0; g.kacisSay = 0; g.kosu = null; g.sessizT = 0; g.Lmaks = 0;
    g.miyavT = 2 + Math.random() * S.miyavOrt; g.ipucuSay = 0; g.cember = null; g.termalSure = 0;
    g.ihbarlar = S.ihbar.map(([t, R]) => ({ t, R }));
    g.bekle = false;
    $('bTermal').hidden = false;
    bildir(`${S.ad}: fenerin aşağı bakıyor. ${dokunmatik ? 'Kalkış için iki kolu içe-aşağı indir' : 'T ile otomatik kalkış'}`, 2400);
  }

  function ihbarVer(g, R, kacti) {
    const r = g.rnd, a = r() * Math.PI * 2, u = Math.sqrt(r()) * R * 0.55;   // çemberin merkezi kediden en çok 0,55R uzakta
    const cx = g.kediPoz.x + Math.cos(a) * u, cz = g.kediPoz.z + Math.sin(a) * u;
    if (g.cember) gorevGrubu.remove(g.cember);
    g.cember = cemberYap(R); g.cember.position.set(cx, 0.35, cz); g.cemberR = R;
    g.hedef = new THREE.Vector3(cx, 0.5, cz);
    const en = ISARETLER.reduce((p, q) => Math.hypot(q[1] - cx, q[2] - cz) < Math.hypot(p[1] - cx, p[2] - cz) ? q : p);
    g.ipucuSay++;
    bildir(kacti ? `İhbar: Pamuk ${en[0]} tarafına koşarken görülmüş (sarı çember, ${R} m)` : `Komşu ihbarı: Pamuk ${en[0]} yakınlarında görülmüş (sarı çember, ${R} m)`, 3600);
  }

  // Fener demeti (fener.js) kediye ulaşıyor mu? Demetin içinde olmak ve yeterli aydınlık şart.
  // Araba altı: ancak alçaktan ve yandan bakan ışık girer. Ağaç: dalların hizasından bakmak gerekir.
  const _hp = new THREE.Vector3();
  function bakis(u, p, tur) {
    const dx = u.poz.x - p.x, dz = u.poz.z - p.z, yatay = Math.hypot(dx, dz), dy = u.poz.y - p.y;
    const f = FENER.isik(u, _hp.set(p.x, p.y + 0.15, p.z)), dk = f.d, E = f.E;
    let isikta = f.ic, engel = false;
    if (tur === 'alti') { const ok = dy > 0.2 && dy < 3.2 && yatay > 0.8 && yatay < 6; engel = isikta && !ok; isikta = isikta && ok; }
    if (tur === 'agac') { const ok = dy < 1.2 && yatay < 8; engel = isikta && !ok; isikta = isikta && ok; }
    return { isikta, engel, E, dk, yatay };
  }
  const gurultu1m = (u) => u.gaz < 0.02 ? 0 : 78 + 20 * log10(Math.max(u.gaz, 0.05) / 0.5);   // pervane gürültüsü, 1 m'de (dB)

  function kac(g, L) {
    const r = g.rnd, p = g.kediPoz;
    const adaylar = YERLER.filter((y) => y.tur !== 'cati' && y !== g.yer && (d => d > 15 && d < 40)(Math.hypot(y.x - p.x, y.z - p.z)));
    const hedef = adaylar[Math.floor(r() * adaylar.length)] || g.yer;
    const d = Math.hypot(hedef.x - p.x, hedef.z - p.z);
    g.kosu = { x0: p.x, z0: p.z, y0: p.y, hedef, t: 0, T: Math.max(1, d / KOSU_HIZ) };
    g.kacisSay++; g.urkme = 0; g.gorme = 0; g.sessizT = 25; g.sonKacisL = L;
    g.kedi.rotation.y = Math.atan2(-(hedef.x - p.x), -(hedef.z - p.z));
    tisla(1);
    bildir(`Pamuk pervane gürültüsünden ürktü ve kaçtı! (kedide ${say(L, 0)} dB)`, 3000);
    g.ihbarlar.push({ t: g.sure + 12, R: g.S.ihbar[1][1], kacti: true });
    g.ihbarlar.sort((a, b) => a.t - b.t);
  }

  function adim(g, dt) {
    if (!g.S) return;
    const u = uc, S = g.S, yer = zeminY(u.poz.x, u.poz.z, u.poz.y), h = Math.max(0.3, u.poz.y - yer);
    const zf = FENER.zemin(u, h); g.E0 = zf.E; g.izR = zf.r;
    if (K.termal) g.termalSure += dt;
    // komşu ihbarları
    while (!g.bulundu && g.ihbarlar.length && g.ihbarlar[0].t <= g.sure) { const i = g.ihbarlar.shift(); ihbarVer(g, i.R, i.kacti); }
    if (g.cember) g.cember.material.opacity = 0.35 + 0.2 * Math.sin(u.zaman * 2.5);
    // kaçan kedi
    if (g.kosu) {
      const k = g.kosu; k.t += dt; const s = Math.min(1, k.t / k.T), ag = k.hedef.tur === 'agac' ? Math.max(0, (s - 0.75) / 0.25) : s;
      g.kedi.position.set(k.x0 + (k.hedef.x - k.x0) * s, k.y0 + (k.hedef.y - k.y0) * ag + Math.abs(Math.sin(k.t * 14)) * 0.06, k.z0 + (k.hedef.z - k.z0) * s);
      if (s >= 1) { g.yer = k.hedef; g.kosu = null; g.kedi.position.y = g.yer.y; }
      g.kediPoz.copy(g.kedi.position);
    }
    const tur = g.kosu ? 'acik' : g.yer.tur;
    const b = bakis(u, g.kediPoz, tur); g.yatay = b.yatay;
    const parlak = b.isikta ? Math.min(1, b.E / 25) : 0;   // tapetum lucidum: ışık gelirse gözler geri yansıtır
    g.kedi.userData.gozler.forEach((m) => { const a = m.userData.taban, b = m.userData.parilti, k = parlak; m.material.color.setRGB(a[0] * (1 - k) * 0.35 + b[0] * k, a[1] * (1 - k) * 0.35 + b[1] * k, a[2] * (1 - k) * 0.35 + b[2] * k); });
    kediCanlandir(g.kedi, dt, !!g.kosu, !g.kosu && g.yer.tur === 'alti');
    // kirpiler: yavaşça dolaşır; ışıkta görülünce tanınır
    for (const kp of g.kirpiler) {
      kp.faz += dt * 0.3; kp.m.position.set(kp.x0 + Math.sin(kp.faz) * 1.5, 0, kp.z0 + Math.cos(kp.faz * 0.7) * 1.5); kp.m.rotation.y = -kp.faz;
      if (!kp.tanindi && !g.bulundu) {
        const bk = bakis(u, kp.m.position, 'acik');
        kp.gorme = bk.isikta && bk.E >= E_ESIK ? kp.gorme + dt : 0;
        if (kp.gorme > 0.6) { kp.tanindi = true; bildir('Bu bir kirpi, Pamuk değil! Kirpiler de sıcakkanlıdır: termalde kedi gibi parlar.', 2600); }
      }
    }
    if (g.bulundu) {
      g.kedi.userData.halka.material.opacity = 0.5 + 0.4 * Math.sin(u.zaman * 5);
      if (u.yerde && u.gaz < 0.12 && b.yatay < 4 && Math.abs(u.poz.y - g.kediPoz.y) < 2 && u.zaman > 2) bitir(true);
      return;
    }
    // görme
    g.gorme = b.isikta && b.E >= E_ESIK ? g.gorme + dt : Math.max(0, g.gorme - dt * 0.5);
    if (g.gorme > 0.8) {
      g.bulundu = true; g.bulY = h; g.bulE = b.E; g.bulD = b.dk; g.bulT = g.sure; g.bulTur = tur; g.bulYari = FENER.yari; g.bulI = FENER.I(); g.bulEgim = FENER.egim;
      if (g.kosu) { g.yer = { x: g.kediPoz.x, z: g.kediPoz.z, y: g.kedi.position.y, tur: 'acik', ad: 'kaçarken' }; g.kosu = null; g.kedi.position.y = zeminY(g.kediPoz.x, g.kediPoz.z, g.kediPoz.y + 0.5); g.kediPoz.copy(g.kedi.position); }
      g.hedef = g.kediPoz.clone().setY(g.kediPoz.y + 0.5);
      if (g.cember) g.cember.visible = false;
      g.kedi.userData.halka.visible = true; kediSesi(1, 0);
      dispatchEvent(new CustomEvent('kasif-olay', { detail: { olay: 'kurtarma-bulundu', seviye: g.sev } }));
      const nerede = { alti: ' Arabanın altından çıkardın.', agac: ' Ağaçta mahsur kalmış.', cati: ' Çatıya çıkmış!' }[g.yer.tur] || '';
      bildir(`Pamuk bulundu!${nerede} Yanına in (4 m içinde)`, 3000);
      return;
    }
    if (b.engel && !g.engelUyari) { g.engelUyari = true; bildir(g.yer.tur === 'alti' ? 'Işık bir şeye çarpıyor ama araba örtüyor: 3 m\'nin altına in, yandan bak' : 'Dallarda bir şey kıpırdadı: ağacın hizasına in, yandan yaklaş', 2800); }
    else if (b.isikta && b.E < E_ESIK && !g.sonukUyari) { g.sonukUyari = true; bildir('Bir şey var ama ışık çok sönük: alçal', 2000); }
    // ürkme: pervane gürültüsü kediye ulaşıyor (ağaçtaki ve çatıdaki kedi kaçamaz)
    const L = gurultu1m(u) - 20 * log10(Math.max(1, b.dk)); g.Lmaks = Math.max(g.Lmaks, L);
    if (!g.kosu && g.kacisSay < S.kacis && g.yer.tur !== 'agac' && g.yer.tur !== 'cati') {
      g.urkme = L > S.esik ? g.urkme + dt : Math.max(0, g.urkme - dt);
      if (g.urkme > 0.6) kac(g, L);
    }
    // miyav: rastgele aralıklarla; kaçtıktan sonra bir süre susar
    g.sessizT -= dt; g.miyavT -= dt;
    if (g.miyavT <= 0) {
      g.miyavT = S.miyavOrt * (0.4 + 1.2 * Math.random());
      if (g.sessizT <= 0 && b.dk < S.miyavMenzil) {
        const vx = g.kediPoz.x - u.poz.x, vz = g.kediPoz.z - u.poz.z, n = Math.hypot(vx, vz) || 1;
        const pan = S.yonlu ? (vx * Math.cos(u.yaw) - vz * Math.sin(u.yaw)) / n : 0;
        kediSesi(Math.min(1, Math.max(0.12, 6 / b.dk)), pan);
      }
    }
  }

  function hud(g) {
    if (!g.S) return { hedef: 'Önce seviye seç (1-4).', ek: '' };
    if (g.bulundu) return { hedef: 'Pamuk bulundu! Yeşil halkanın içine yumuşak in.', ek: `Uzaklık <b>${say(g.yatay || 0, 0)} m</b>` };
    const u = uc, L1 = gurultu1m(u);
    return {
      hedef: g.cember ? 'Sarı çember komşu ihbarı: Pamuk o civarda. Işık izinle tara, miyava kulak ver.' : 'Kayıp kedi Pamuk kasabada bir yerde. Işık izinle tara; miyav sesine kulak ver.',
      ek: `${g.S.ad} · Demet ${Math.round(2 * FENER.yari * 180 / Math.PI)}° · <b>${say(FENER.I(), 0)} cd</b> · Zeminde <b>${say(g.E0 || 0, 0)} lx</b> (≥ ${E_ESIK}) · İz çapı <b>${say(2 * (g.izR || 0), 1)} m</b>`
        + (g.S.kacis ? ` · Gürültün <b>${say(L1, 0)} dB</b> (1 m)` : '') + (K.termal ? ' · <b>TERMAL</b>' : ''),
    };
  }

  function bitirSonuc(g, olcum) {
    const S = g.S, sev = g.sev, anahtar = rekorAnahtar(sev), eski = getir(anahtar);
    const yeni = !g.hile && (!eski || g.sure < eski.t);
    if (yeni) sakla(anahtar, { t: Math.round(g.sure * 10) / 10, dron: (ayar.tasarim && ayar.tasarim.ad) || ayar.sablon });
    const yerAd = g.yer.ad;
    let metin = `Pamuk'u <b>${yerAd}</b>, yerden <b>${say(g.bulY, 1)} m</b> yükseklikteyken fenerin ışığı kediye <b>${say(g.bulE, 0)} lx</b> ulaştığı anda buldun. Fener ışığı uzaklığın karesiyle zayıflar: 5 m'den 10 m'ye çıkınca zemindeki aydınlık dörtte bire iner, ama ışık izinin alanı dört kat büyür. Arama pilotları bu yüzden önce yüksekten geniş tarar, bir şey görünce alçalır.`;
    if (g.kacisSay) metin += ` Pamuk <b>${g.kacisSay} kez</b> kaçtı: pervane gürültüsü ona <b>${say(g.sonKacisL, 0)} dB</b> ulaşmıştı. Ses de uzaklıkla zayıflar: uzaklık iki katına çıkınca düzey <b>6 dB</b> düşer. Gazı kısıp yüksekten yaklaşan pilot kediyi ürkütmez.`;
    else if (S.kacis) metin += ` Pamuk hiç ürkmedi: kediye ulaşan en yüksek gürültü <b>${say(g.Lmaks, 0)} dB</b> idi (ürkme eşiği ${S.esik} dB).`;
    if (g.termalSure > 1) metin += ` Termal kamerayı <b>${say(g.termalSure, 0)} s</b> kullandın: kedinin vücudu (~38 °C) gece soğumuş zeminden (~8 °C) daha çok kızılötesi ışır. Işınım mutlak sıcaklığın 4. kuvvetiyle büyür: (311 K / 281 K)⁴ ≈ <b>1,5 kat</b>.`;
    { const dm = Math.round(2 * g.bulYari * 180 / Math.PI), eg = Math.round(g.bulEgim * 180 / Math.PI);
      metin += ` Bulduğun anda fener <b>${eg}°</b> eğimle, <b>${dm}°</b> genişliğinde bir demetle bakıyordu ve ışık şiddeti <b>${say(g.bulI, 0)} cd</b> idi. Fenerin ışık akısı hep aynıdır; demeti daraltınca aynı ışık daha küçük bir koniye toplanır ve şiddet artar (I = Φ/Ω). Dar demet uzağı aydınlatır ama küçük bir yeri gösterir, geniş demet çok yeri görür ama sönüktür.`; }
    metin += ' Kedinin gözlerinin parlaması da fizik: gözün arkasındaki yansıtıcı tabaka (tapetum lucidum) ışığı geldiği yöne geri yollar.';
    olcum.push(['Seviye', S.ad], ['Bulma yüksekliği', say(g.bulY, 1) + ' m'], ['Bulma anı', say(g.bulT, 1) + ' s'], ['Kaçış', g.kacisSay + ' kez'], ['İhbar', g.ipucuSay + ' kez']);
    if (g.termalSure > 1) olcum.push(['Termal', say(g.termalSure, 0) + ' s']);
    olcum.push([sev === 'gun' ? 'Bugünün en iyisi' : 'Rekor', yeni ? 'YENİ: ' + say(g.sure, 1) + ' s' : eski ? say(eski.t, 1) + ' s' : '—']);
    return {
      baslik: yeni ? (sev === 'gun' ? 'Günün Kedisi: yeni en iyi süre!' : `Yeni rekor (${S.ad})! Pamuk kurtarıldı`) : 'Pamuk kurtarıldı',
      metin,
      formul: `I = Φ / Ω = ${say(FENER.I(), 0)} cd   ·   E = I / d² = ${say(FENER.I(), 0)} / (${say(g.bulD, 1)} m)² ≈ ${say(g.bulE, 0)} lx   ·   L = L₁ − 20·log₁₀ d`,
    };
  }

  /* ---------- termal kamera ---------- */
  const termalZemin = new THREE.MeshLambertMaterial({ color: '#3c3c3c' });
  function termalDegis(acik) {
    K.termal = typeof acik === 'boolean' ? acik : !K.termal;
    document.body.classList.toggle('termal', K.termal);
    const b = $('bTermal'); if (b) { b.textContent = 'Termal: ' + (K.termal ? 'açık' : 'kapalı'); b.setAttribute('aria-pressed', K.termal); }
    if (K.termal && gorevD && gorevD.tip === 'kurtarma') bildir('Termal kamera: sıcak cisimler beyaz. Bulduğunu fenerle doğrula.', 2200);
  }
  function ciz() {
    if (!K.termal || !gorevD || gorevD.tip !== 'kurtarma') return false;
    const gizle = GECE.nesne.filter((o) => o.visible); gizle.forEach((o) => { o.visible = false; });
    const fc = sahne.fog.color.clone(); sahne.fog.color.set('#060606');
    sahne.overrideMaterial = termalZemin; renderer.render(sahne, kamera); sahne.overrideMaterial = null;
    sahne.fog.color.copy(fc); gizle.forEach((o) => { o.visible = true; });
    const ac = renderer.autoClear; renderer.autoClear = false;
    for (const s of sicaklar) { s.asil = s.m.material; s.m.material = s.mat; }
    kamera.layers.set(1); renderer.render(sahne, kamera); kamera.layers.set(0);
    for (const s of sicaklar) s.m.material = s.asil;
    renderer.autoClear = ac;
    return true;
  }

  /* ---------- stil ve düğme ---------- */
  const css = document.createElement('style');
  css.textContent = `
.kurtar-sev{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media (max-width:620px){.kurtar-sev{grid-template-columns:1fr}}
.kurtar-sev .dg{display:flex;flex-direction:column;gap:4px;text-align:left;padding:10px 12px}
.kurtar-sev .dg small{font-weight:400;font-size:12.5px;line-height:1.4;color:var(--soluk)}
.kurtar-sev .dg small.rek{color:var(--iyi);font-weight:600}
.kurtar-sev .dg:focus-visible,.kurtar-sev .dg:hover{border-color:var(--itki)}
body.termal #sahne{filter:contrast(1.35) brightness(1.08)}
body.termal #hud::before{content:'TERMAL · beyaz-sıcak';position:absolute;left:50%;top:calc(62px + env(safe-area-inset-top,0px));transform:translateX(-50%);font:700 12px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;color:#fff;background:rgba(0,0,0,.55);padding:5px 9px;border-radius:6px}
`;
  document.head.append(css);
  addEventListener('DOMContentLoaded', () => {
    const dg = document.querySelector('#hud .dugmeler'); if (!dg || $('bTermal')) return;
    const b = document.createElement('button'); b.id = 'bTermal'; b.type = 'button'; b.hidden = true; b.textContent = 'Termal: kapalı';
    b.title = 'Termal kamera (G tuşu): sıcak cisimleri beyaz gösterir, pilden ek güç çeker';
    b.addEventListener('click', () => termalDegis()); dg.prepend(b);
  });

  /* ---------- ana betiğe açılan yüz ---------- */
  const K = window.KURTARMA = {
    termal: false,
    kur(g) { g.ruzgarHiz = 1; g.bulundu = false; g.S = null; panelGoster(g); },
    adim, hud, bitir: bitirSonuc, ciz,
    ekGuc() { return K.termal && gorevD && gorevD.tip === 'kurtarma' ? TERMAL_W : 0; },
    kapat() { const p = $('kurtarmaP'); if (p) p.hidden = true; termalDegis(false); const b = $('bTermal'); if (b) b.hidden = true; },
    menuRekor() { const t = ['kolay', 'orta', 'zor'].map((k) => { const r = getir(rekorAnahtar(k)); return r ? `${SEVIYE[k].ad} ${say(r.t, 0)} s` : null; }).filter(Boolean); return t.length ? 'Rekorlar: ' + t.join(' · ') : ''; },
    kediModel(x, z) {
      const k = vanKedisi(); k.position.set(x, zeminY(x, z), z); k.rotation.y = Math.random() * 6; gorevGrubu.add(k); return k;
    },
    vanKedisi, kediCanlandir,
    yerSayisi() { if (!YERLER) YERLER = yerleriUret(); return YERLER.length; },
  };
})();
