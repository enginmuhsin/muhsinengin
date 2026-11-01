/* =====================================================================
   FPV REHBERİ — fpv.js
   1) Gözlük görüntüsü: kapılardan geçen sanal bir FPV uçuşu (dijital / analog)
   2) 3B parça gezgini: parçaya dokun, dronda parlasın ve ayrışsın
   3) Gecikme deneyi: gözlükte gördüğün, dronun gerçek yerinden ne kadar geride?
   Hiçbir kütüphane yok; hiçbir veri dışarı gönderilmez.
   ===================================================================== */
(function () {
  'use strict';
  const az = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const css = (ad, y) => (getComputedStyle(document.documentElement).getPropertyValue(ad).trim() || y);

  /* ------------------------------------------------------------------
     1) GÖZLÜK GÖRÜNTÜSÜ
     Dünya: z ileri, x sağ, y yukarı (metre). Kamera, kıvrımlı bir rota
     üzerinde ilerler; rotanın eğriliği dronu yana yatırır (roll).
     ------------------------------------------------------------------ */
  (function gozluk() {
    const tv = $('gozluk'); if (!tv) return;
    const g = tv.getContext('2d'), kucuk = document.createElement('canvas'), kg = kucuk.getContext('2d', { willReadFrequently: true });
    let W = 0, H = 0, oran = 1, mod = 'dijital', calis = !az, t = 6, son = 0, gorunur = true;
    const HIZ = 17, ARA = 34;                                 // m/s, kapılar arası mesafe (m)
    const yol = (z) => 3.4 * Math.sin(z * .042) + 1.6 * Math.sin(z * .105 + 1.3);
    const yolY = (z) => 2.1 + .9 * Math.sin(z * .055 + 2);
    function boyut() {
      const r = tv.getBoundingClientRect(); oran = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; tv.width = W * oran; tv.height = H * oran;
    }
    function sahne(c, w, h, t, olc) {
      const z0 = t * HIZ, kx = yol(z0), ky = yolY(z0);
      const egim = (yol(z0 + 6) - kx) / 6;
      const egrilik = yol(z0 + 14) - 2 * yol(z0 + 7) + kx;
      const roll = Math.max(-.7, Math.min(.7, -egrilik * .55));
      const f = w * .62, ufuk = -h * .12 + (yolY(z0 + 8) - ky) * 4;
      const P = (x, y, z) => { const rz = z - z0; const rx = x - kx - egim * rz; return [rx * f / rz, ufuk + (ky - y) * f / rz, rz]; };
      olc = olc || 1; c.save(); c.setTransform(olc, 0, 0, olc, 0, 0); c.clearRect(0, 0, w, h);
      c.translate(w / 2, h / 2); c.rotate(roll);
      const R = Math.hypot(w, h);
      // Gökyüzü
      const gk = c.createLinearGradient(0, ufuk - h, 0, ufuk);
      gk.addColorStop(0, '#3d7cc9'); gk.addColorStop(.7, '#8fc0ec'); gk.addColorStop(1, '#d9ecfa');
      c.fillStyle = gk; c.fillRect(-R, ufuk - 2 * R, 2 * R, 2 * R);
      // Uzak tepeler
      c.fillStyle = '#7d9fb4';
      c.beginPath(); c.moveTo(-R, ufuk);
      for (let x = -R; x <= R; x += 18) c.lineTo(x, ufuk - 10 - 9 * Math.sin((x + z0 * .6) * .012) - 6 * Math.sin((x - z0) * .031));
      c.lineTo(R, ufuk); c.closePath(); c.fill();
      // Zemin: ileri doğru akan tarla şeritleri
      c.fillStyle = '#5f8f3e'; c.fillRect(-R, ufuk, 2 * R, 2 * R);
      const adim = 6, bas = Math.ceil(z0 / adim) * adim;
      for (let z = bas + 70 * adim; z > bas; z -= adim) {
        const k = Math.round(z / adim);
        const y1 = P(0, 0, z)[1], y2 = P(0, 0, z + adim)[1];
        c.fillStyle = k % 2 ? '#6c9c47' : '#5a8a39';
        c.fillRect(-R, y2, 2 * R, y1 - y2 + 1);
      }
      // Rotayı belli eden toprak patika
      c.fillStyle = 'rgba(176,146,98,.55)'; c.beginPath();
      for (let z = z0 + 1.5; z < z0 + 260; z += 3) { const p = P(yol(z) - 1.1, 0, z); z === z0 + 1.5 ? c.moveTo(p[0], p[1]) : c.lineTo(p[0], p[1]); }
      for (let z = z0 + 258; z > z0 + 1.5; z -= 3) { const p = P(yol(z) + 1.1, 0, z); c.lineTo(p[0], p[1]); }
      c.closePath(); c.fill();
      // Ağaçlar (rotanın iki yanında) ve kapılar: uzaktan yakına sıralı
      const nesne = [];
      for (let z = Math.ceil(z0 / 11) * 11; z < z0 + 230; z += 11) {
        const i = Math.round(z / 11);
        for (const yan of [-1, 1]) nesne.push({ tip: 'agac', x: yol(z) + yan * (7 + 3 * Math.abs(Math.sin(i * 1.7 + yan))), z: z + (yan > 0 ? 4 : 0), s: .8 + .5 * Math.abs(Math.sin(i * 2.3 + yan)) });
      }
      for (let z = Math.ceil((z0 + 2) / ARA) * ARA; z < z0 + 260; z += ARA) nesne.push({ tip: 'kapi', x: yol(z), y: yolY(z), z });
      nesne.sort((a, b) => b.z - a.z);
      for (const n of nesne) {
        if (n.z - z0 < 1.2) continue;
        if (n.tip === 'agac') {
          const a = P(n.x, 0, n.z), b = P(n.x, 5.5 * n.s, n.z), r = 1.6 * n.s * f / (n.z - z0);
          c.fillStyle = '#5b4632'; c.fillRect(a[0] - r * .12, b[1] + r, r * .24, a[1] - b[1] - r);
          c.fillStyle = '#2f6b33'; c.beginPath(); c.moveTo(b[0], b[1] - r * .3); c.lineTo(b[0] + r, a[1] - (a[1] - b[1]) * .3); c.lineTo(b[0] - r, a[1] - (a[1] - b[1]) * .3); c.closePath(); c.fill();
          c.fillStyle = '#3a7d3c'; c.beginPath(); c.moveTo(b[0], b[1] - r * .6); c.lineTo(b[0] + r * .7, b[1] + r * .8); c.lineTo(b[0] - r * .7, b[1] + r * .8); c.closePath(); c.fill();
        } else {
          const s = 1.7, a = P(n.x - s, n.y + s, n.z), b = P(n.x + s, n.y - s, n.z), ay1 = P(n.x - s, 0, n.z), ay2 = P(n.x + s, 0, n.z);
          const k = Math.max(2, .32 * f / (n.z - z0));
          c.strokeStyle = '#3b3b3b'; c.lineWidth = k * .45;
          c.beginPath(); c.moveTo(a[0], b[1]); c.lineTo(ay1[0], ay1[1]); c.moveTo(b[0], b[1]); c.lineTo(ay2[0], ay2[1]); c.stroke();
          c.lineWidth = k; c.strokeStyle = '#ff6a1a'; c.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
          c.lineWidth = k * .35; c.strokeStyle = '#fff2e0'; c.setLineDash([k * 1.6, k * 1.6]); c.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); c.setLineDash([]);
        }
      }
      c.restore();
      return { roll, hiz: HIZ * 3.6 * (1 + .08 * Math.sin(t * .7)), irtifa: ky };
    }
    function osd(c, w, h, t, d, analog) {
      const s = Math.max(10, Math.min(15, w / 42)), j = analog ? (Math.random() - .5) * 1.2 : 0;
      c.save(); c.setTransform(oran, 0, 0, oran, 0, 0);
      c.font = `700 ${s}px ui-monospace, "Cascadia Mono", Consolas, monospace`; c.textBaseline = 'middle';
      const yaz = (m, x, y, hiz) => { c.textAlign = hiz || 'left'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText(m, x + j, y); c.fillStyle = '#fff'; c.fillText(m, x + j, y); };
      const p = s * 1.4, v = 16.6 - ((t * .05) % 1.8);
      // Batarya simgesi + gerilim
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(p + j, p - s * .45, s * 1.6, s * .9); c.fillStyle = '#fff'; c.fillRect(p + s * 1.6 + j, p - s * .2, s * .18, s * .4);
      c.fillStyle = v > 15.4 ? '#7CFC8A' : '#ffd24a'; c.fillRect(p + 2 + j, p - s * .45 + 2, (s * 1.6 - 4) * (v - 14.4) / 2.2, s * .9 - 4);
      yaz('4S ' + v.toFixed(1) + 'V', p + s * 2.2, p);
      const sn = Math.floor(t), dk = Math.floor(sn / 60);
      yaz(String(dk).padStart(2, '0') + ':' + String(sn % 60).padStart(2, '0'), w - p, p, 'right');
      yaz('ACRO', w / 2, p, 'center');
      yaz('İRT ' + Math.round(d.irtifa * 4) + 'm', p, h - p);
      yaz(Math.round(d.hiz) + ' km/s', w - p, h - p, 'right');
      if (analog) yaz('RSSI ' + (90 + Math.floor(Math.random() * 9)), w / 2, h - p, 'center');
      else { yaz('1080p', w / 2 - s * .6, h - p, 'right'); if (Math.floor(t * 2) % 2) { c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(w / 2 + s * .2, h - p, s * .32, 0, 7); c.fill(); } yaz('REC', w / 2 + s * .7, h - p); }
      // Ortadaki nişangâh
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; const m = s * 1.1;
      c.beginPath(); c.moveTo(w / 2 - m * 2, h / 2); c.lineTo(w / 2 - m * .6, h / 2); c.moveTo(w / 2 + m * .6, h / 2); c.lineTo(w / 2 + m * 2, h / 2); c.stroke();
      c.beginPath(); c.arc(w / 2, h / 2, m * .35, 0, 7); c.stroke();
      c.restore();
    }
    function kare() {
      if (!W) return;
      let d;
      if (mod === 'analog') {
        const kw = Math.max(120, Math.round(W / 3.4)), kh = Math.max(68, Math.round(H / 3.4));
        if (kucuk.width !== kw) { kucuk.width = kw; kucuk.height = kh; }
        d = sahne(kg, kw, kh, t);
        const id = kg.getImageData(0, 0, kw, kh), px = id.data;
        const kayma = Math.random() < .12 ? Math.floor(Math.random() * kh) : -1;
        for (let i = 0; i < px.length; i += 4) {
          const n = (Math.random() - .5) * 70;
          px[i] = px[i] * .92 + n + 10; px[i + 1] = px[i + 1] * .9 + n; px[i + 2] = px[i + 2] * .95 + n + 6;
        }
        if (kayma >= 0) for (let y = kayma; y < Math.min(kh, kayma + 3); y++) for (let x = 0; x < kw; x++) { const i = (y * kw + x) * 4; px[i] = px[i + 1] = px[i + 2] = 200 + Math.random() * 55; }
        kg.putImageData(id, 0, 0);
        g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(kucuk, 0, 0, tv.width, tv.height);
        g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < tv.height; y += 4 * oran) g.fillRect(0, y, tv.width, oran);
      } else {
        d = sahne(g, W, H, t, oran);
        g.setTransform(1, 0, 0, 1, 0, 0);
      }
      osd(g, W, H, t, d, mod === 'analog');
      // Gözlük kenarı karartması
      g.setTransform(1, 0, 0, 1, 0, 0);
      const vg = g.createRadialGradient(tv.width / 2, tv.height / 2, Math.min(tv.width, tv.height) * .35, tv.width / 2, tv.height / 2, Math.hypot(tv.width, tv.height) * .55);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, tv.width, tv.height);
    }
    function dongu(zm) {
      const dt = Math.min(.05, (zm - (son || zm)) / 1000); son = zm;
      if (calis && gorunur) { t += dt; kare(); }
      requestAnimationFrame(dongu);
    }
    const not = $('gozlukNot');
    const notlar = {
      dijital: 'Dijital: görüntü net ve renkler canlı. Bedeli, gözle zor fark edilen küçük bir gecikme ve daha yüksek fiyat.',
      analog: 'Analog: görüntü karlı ve bulanık; sinyal zayıflayınca parazit artar. Buna karşılık görüntü neredeyse anında gelir ve ekipman ucuzdur.',
    };
    document.querySelectorAll('[data-gozluk]').forEach((b) => b.addEventListener('click', () => {
      mod = b.dataset.gozluk;
      document.querySelectorAll('[data-gozluk]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (not) not.textContent = notlar[mod];
      if (!calis) kare();
    }));
    const dd = $('gozlukDur');
    const durumYaz = () => { if (dd) { dd.textContent = calis ? '❚❚ Duraklat' : '▶ Oynat'; dd.setAttribute('aria-pressed', String(!calis)); } };
    if (dd) dd.addEventListener('click', () => { calis = !calis; durumYaz(); });
    durumYaz(); if (not) not.textContent = notlar[mod];
    new ResizeObserver(() => { boyut(); kare(); }).observe(tv);
    if ('IntersectionObserver' in window) new IntersectionObserver((e) => { gorunur = e[0].isIntersecting; }).observe(tv);
    boyut(); kare(); requestAnimationFrame(dongu);
  })();

  /* ------------------------------------------------------------------
     2) 3B PARÇA GEZGİNİ
     ------------------------------------------------------------------ */
  (function parcalar() {
    const tv = $('parca3b'); if (!tv || !window.Dron3D) return;
    const sahne = Dron3D.Sahne(tv, { yakinlik: 1.55, model: { kol: 4, L: 1, pervane: .55, kanat: 3 } });
    const P = {
      cerceve: ['Çerçeve', 'Dronun iskeleti. Çoğunlukla karbon fiberdir: hafif ama çok sert. Bir kaza sonrası çoğu zaman yalnızca kırılan kol değiştirilir.', 'Arabanın şasisi.'],
      motor: ['Fırçasız motorlar', 'Her motor dakikada on binlerce tur atar. Komşu motorlar ters yönlere döner; böylece dönme etkileri birbirini sıfırlar ve dron kendi etrafında fırıl fırıl dönmez.', 'Aynı kayıkta karşılıklı kürek çeken dört kişi: biri durursa kayık döner.'],
      pervane: ['Pervaneler', 'Havayı aşağı iterek itki üretir. Çap ve hatve büyüdükçe itki artar ama motor daha çok akım çeker. Kanat sayısı arttıkça tutuş iyileşir, verim biraz düşer.', 'Kürek: suyu ne kadar çok ve hızlı iterseniz tekne o kadar hızlı gider.'],
      fc: ['Uçuş kontrol kartı (FC)', 'İçindeki jiroskop dronun eğimini saniyede binlerce kez ölçer, PID hesabını yapar ve motorlara yeni hız gönderir. Betaflight bu kartta çalışır. Motor sürücüleri (ESC) genellikle hemen altındaki ikinci karttadır.', 'Beyin ve iç kulak birlikte.'],
      vtx: ['Video verici (VTX)', 'Kameranın görüntüsünü radyo dalgasıyla gözlüğe gönderir. Analog ya da dijital olabilir; gözlükle aynı sistemden olmak zorundadır.', 'Avucuna sığan bir canlı yayın istasyonu.'],
      kamera: ['FPV kamerası', 'Gözlükte gördüğün görüntü buradan gelir. Hızlı uçan dron öne eğik gittiği için kamera genellikle yukarı doğru eğik takılır.', 'Pilotun gözleri.'],
      anten: ['Antenler', 'Video sinyalini yayar; alıcı antenleri de kumandanın komutlarını toplar. Kırık ya da ters takılmış bir anten, karlı görüntünün en sık nedenidir.', 'Telsizin kulağı ve ağzı.'],
      batarya: ['LiPo batarya', 'Bütün enerji buradan gelir. Hücre sayısı (S) gerilimi, kapasite (mAh) uçuş süresini, C değeri ise ne kadar hızlı akım verebileceğini belirler.', 'Yakıt deposu; C değeri de musluğun kalınlığı.'],
    };
    const ic = new Set(['fc', 'vtx']);
    const baslik = $('parcaBaslik'), metin = $('parcaMetin'), benz = $('parcaBenzetme');
    function sec(ad) {
      document.querySelectorAll('[data-parca]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.parca === ad)));
      if (!ad || !P[ad]) {
        sahne.vurgula(null); sahne.patlat(0);
        baslik.textContent = 'Bir parçaya dokun'; metin.textContent = 'Soldaki dronu sürükleyerek çevirebilirsin. Bir parçaya dokununca dronda parlar; içeride kalan kartlar görünsün diye dron katlarına ayrılır.'; benz.textContent = '';
        return;
      }
      sahne.vurgula(ad); sahne.patlat(ic.has(ad) ? 1 : .45);
      baslik.textContent = P[ad][0]; metin.textContent = P[ad][1]; benz.innerHTML = '<strong>Benzetme:</strong> ' + P[ad][2];
    }
    document.querySelectorAll('[data-parca]').forEach((b) => b.addEventListener('click', () => sec(b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.parca)));
    sec(null);
  })();

  /* ------------------------------------------------------------------
     3) GECİKME DENEYİ
     İmleç (ya da parmak) gerçek dronun yeri; turuncu hayalet, seçilen gecikme
     kadar önceki konum, yani gözlükte gördüğün.
     ------------------------------------------------------------------ */
  (function gecikme() {
    const tv = $('gecikmeAlan'), sl = $('gecikmeMs'); if (!tv || !sl) return;
    const g = tv.getContext('2d'), etiket = $('gecikmeEtiket'), mesafe = $('gecikmeMesafe');
    let W = 0, H = 0, oran = 1, imlec = null, sonImlec = 0, gorunur = true;
    const gecmis = [];
    function boyut() { const r = tv.getBoundingClientRect(); oran = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; tv.width = W * oran; tv.height = H * oran; g.setTransform(oran, 0, 0, oran, 0, 0); }
    function yaz() {
      const ms = +sl.value, m = 100 / 3.6 * ms / 1000;
      etiket.textContent = ms + ' ms';
      mesafe.textContent = ms === 0 ? 'Gecikme yok: gördüğün ile gerçek aynı yerde.' :
        `100 km/s hızla uçan bir dron, ${ms} ms içinde yaklaşık ${m < 1 ? Math.round(m * 100) + ' cm' : m.toFixed(1).replace('.', ',') + ' m'} yol alır. Gözlükte gördüğün, dronun bu kadar gerisindedir.`;
    }
    function dron(x, y, renk, alfa, r) {
      g.globalAlpha = alfa; g.strokeStyle = renk; g.fillStyle = renk; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke();
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(x + a * r, y + b * r, r * .55, 0, 7); g.globalAlpha = alfa * .25; g.fill(); g.globalAlpha = alfa; g.stroke(); }
      g.beginPath(); g.arc(x, y, r * .35, 0, 7); g.fill(); g.globalAlpha = 1;
    }
    function kare(now) {
      if (!W) return;
      let p = imlec;
      if (!p || now - sonImlec > 2500) { const t = now / 1000; p = { x: W / 2 + W * .36 * Math.sin(t * 1.3), y: H / 2 + H * .3 * Math.sin(t * 2.1) }; }
      gecmis.push({ t: now, x: p.x, y: p.y }); while (gecmis.length && now - gecmis[0].t > 1200) gecmis.shift();
      const hedef = now - +sl.value; let q = gecmis[0];
      for (const h of gecmis) { if (h.t <= hedef) q = h; else break; }
      g.clearRect(0, 0, W, H);
      g.strokeStyle = css('--grid', '#ddd'); g.lineWidth = 1;
      for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      // iz
      g.strokeStyle = css('--c2', '#d1450b'); g.globalAlpha = .35; g.setLineDash([3, 5]); g.beginPath();
      gecmis.forEach((h, i) => (i ? g.lineTo(h.x, h.y) : g.moveTo(h.x, h.y))); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      if (q && (Math.abs(q.x - p.x) + Math.abs(q.y - p.y) > 2)) { g.strokeStyle = css('--muted', '#666'); g.lineWidth = 1.5; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(p.x, p.y); g.stroke(); g.setLineDash([]); }
      if (q) dron(q.x, q.y, css('--c2', '#d1450b'), .9, 13);
      dron(p.x, p.y, css('--accent', '#0a5cc7'), 1, 13);
    }
    function dongu(now) { if (gorunur) kare(now); requestAnimationFrame(dongu); }
    const konum = (e) => { const r = tv.getBoundingClientRect(); imlec = { x: e.clientX - r.left, y: e.clientY - r.top }; sonImlec = performance.now(); };
    tv.addEventListener('pointermove', konum); tv.addEventListener('pointerdown', konum);
    tv.style.touchAction = 'none';
    sl.addEventListener('input', yaz);
    new ResizeObserver(boyut).observe(tv);
    if ('IntersectionObserver' in window) new IntersectionObserver((e) => { gorunur = e[0].isIntersecting; }).observe(tv);
    boyut(); yaz(); requestAnimationFrame(dongu);
  })();

  /* Kontrol döngüsü animasyonu: hareket azaltma tercihinde dursun */
  if (az) document.querySelectorAll('svg.dongu-svg').forEach((s) => s.pauseAnimations && s.pauseAnimations());
})();
