'use strict';
/* HEX — Piet Hein (1942) ve John Nash (1948). Kırmızı üst-alt, mavi sol-sağ kenarı birleştirmeye çalışır.
   Beraberlik imkânsız. Yapay zeka: Monte Carlo (rastgele doldurma oyunları + UCB1). */
(() => {
  function kurallar() {
    const K = {};
    K.komsu = (n) => { const A = []; for (let i = 0; i < n * n; i++) { const r = Math.floor(i / n), c = i % n, l = []; for (const [dr, dc] of [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]]) { const a = r + dr, b = c + dc; if (a >= 0 && b >= 0 && a < n && b < n) l.push(a * n + b); } A.push(l); } return A; };
    // kazanan var mı? 1: kırmızı (üst→alt), 2: mavi (sol→sağ)
    K.baglandi = (t, n, oy, KM) => {
      const g = new Uint8Array(n * n), y = [];
      for (let k = 0; k < n; k++) { const i = oy === 1 ? k : k * n; if (t[i] === oy) { g[i] = 1; y.push(i); } }
      while (y.length) { const i = y.pop(); if (oy === 1 ? Math.floor(i / n) === n - 1 : i % n === n - 1) return true; for (const j of KM[i]) if (!g[j] && t[j] === oy) { g[j] = 1; y.push(j); } }
      return false;
    };
    return K;
  }
  function dusunKaynak() {
    function dusun(v) {
      const K = kurallar(); const { t, n, oy, sure } = v; const KM = K.komsu(n);
      const bos = []; for (let i = 0; i < n * n; i++) if (!t[i]) bos.push(i);
      // hemen kazandıran hamle varsa al
      for (const m of bos) { t[m] = oy; if (K.baglandi(t, n, oy, KM)) { t[m] = 0; return { m, oran: 1, oyun: 0, neden: 'kazan' }; } t[m] = 0; }
      const N = new Float64Array(n * n), W = new Float64Array(n * n);
      const bitis = Date.now() + sure; let toplam = 0; const tmp = new Uint8Array(n * n); const kalan = bos.slice();
      while (Date.now() < bitis || toplam < bos.length * 2) {
        for (let tur = 0; tur < 50; tur++) {
          // UCB1 ile kök hamlesi seç
          let en = -1, enD = -1; const lt = Math.log(toplam + 1);
          for (const m of bos) { const d = N[m] === 0 ? 1e9 : W[m] / N[m] + 0.9 * Math.sqrt(lt / N[m]); if (d > enD) { enD = d; en = m; } }
          tmp.set(t); tmp[en] = oy;
          // kalan boşları rastgele sırayla dönüşümlü doldur
          let k = 0; for (const b of bos) if (b !== en) kalan[k++] = b;
          for (let i = k - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const x = kalan[i]; kalan[i] = kalan[j]; kalan[j] = x; }
          let s = 3 - oy; for (let i = 0; i < k; i++) { tmp[kalan[i]] = s; s = 3 - s; }
          const kazandi = K.baglandi(tmp, n, oy, KM);
          N[en]++; if (kazandi) W[en]++; toplam++;
        }
      }
      let en = bos[0]; for (const m of bos) if (N[m] > N[en]) en = m;
      return { m: en, oran: W[en] / N[en], oyun: toplam };
    }
  }
  const kaynak = kurallar.toString() + '\n' + dusunKaynak.toString().replace(/^function dusunKaynak\(\) \{|\}$/g, '');
  const K = kurallar();

  // 0-1 BFS: oyuncunun bağlantı kurması için en az kaç boş hücre gerekli?
  function mesafe(t, n, oy, KM) {
    const D = new Array(n * n).fill(1e9), q = [];
    for (let k = 0; k < n; k++) { const i = oy === 1 ? k : k * n; if (t[i] === 3 - oy) continue; D[i] = t[i] ? 0 : 1; q.push(i); }
    q.sort((a, b) => D[a] - D[b]);
    const dq = q.slice(); let enIyi = 1e9;
    while (dq.length) {
      const i = dq.shift();
      if (oy === 1 ? Math.floor(i / n) === n - 1 : i % n === n - 1) enIyi = Math.min(enIyi, D[i]);
      for (const j of KM[i]) { if (t[j] === 3 - oy) continue; const d = D[i] + (t[j] ? 0 : 1); if (d < D[j]) { D[j] = d; if (t[j]) dq.unshift(j); else dq.push(j); } }
    }
    return enIyi;
  }
  function yol(t, n, oy, KM) { // kazanan zincir (BFS ile)
    const once = new Map(), y = [];
    for (let k = 0; k < n; k++) { const i = oy === 1 ? k : k * n; if (t[i] === oy) { once.set(i, -1); y.push(i); } }
    while (y.length) { const i = y.shift(); if (oy === 1 ? Math.floor(i / n) === n - 1 : i % n === n - 1) { const p = new Set(); let x = i; while (x !== -1) { p.add(x); x = once.get(x); } return p; } for (const j of KM[i]) if (!once.has(j) && t[j] === oy) { once.set(j, i); y.push(j); } }
    return new Set();
  }

  Salon.kaydet('hex', {
    baslik: 'Hex', alt: 'Kırmızı üstü alta, mavi solu sağa bağlar.',
    ozet: 'Beraberliği imkânsız olan oyun. Nash\'in "strateji çalma" kanıtını tahtada gör.',
    etiketler: ['Monte Carlo', 'Topoloji', '2 kişi'],
    dallanmaRef: '≈ 60 (11×11)', dallanmaSayi: 60, oyunUzunlugu: 50,
    secenekler: [
      { id: 'rakip', ad: 'Rakip', sec: [['bilgisayar', 'Bilgisayar'], ['insan', 'İki kişi']], v: 'bilgisayar' },
      { id: 'seviye', ad: 'Seviye', sec: [['kolay', 'Kolay'], ['orta', 'Orta'], ['zor', 'Zor']], v: 'orta', goster: (a) => a.rakip !== 'insan' },
      { id: 'boyut', ad: 'Tahta', sec: [['7', '7×7'], ['9', '9×9'], ['11', '11×11']], v: '9' },
    ],
    tur: [
      { baslik: 'Kenarları birleştir', metin: 'Kırmızı üst ve alt kırmızı kenarları, mavi sol ve sağ mavi kenarları kesintisiz bir zincirle bağlamaya çalışır. Sen kırmızısın.' },
      { baslik: 'Bir altıgene dokun', metin: 'Sırası gelen boş bir altıgene taş koyar. Taşlar hiç hareket etmez ve alınmaz; her taş kalıcıdır.', vurgu: '#tahta svg' },
      { baslik: 'Sağdaki sayılara bak', metin: '"Canlı matematik" kutusu, iki tarafın da bağlantı için kaç taşa daha ihtiyacı olduğunu her hamlede yeniden hesaplar. Rakibin sayısını büyütmek, kendi sayını küçültmek kadar değerli.', vurgu: '.kutu.mat' },
    ],
    kurallar: ['Oyuncular sırayla boş bir altıgene taş koyar. Kırmızı başlar.', 'Kırmızı üst ve alt kırmızı kenarları, mavi sol ve sağ mavi kenarları kesintisiz bir zincirle birleştirmeye çalışır.',
      'Tahta dolduğunda mutlaka biri kazanmıştır: beraberlik yoktur.', 'Bilgisayara karşı sen kırmızısın.'],
    onizleme: () => { let s = '<svg viewBox="0 0 170 100">'; const n = 6, w = 16, h = 18; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const x = 18 + c * w + r * w / 2, y = 14 + r * h * 0.78; const f = (r * 7 + c * 3) % 5 === 0 ? '#c8402f' : (r * 3 + c * 5) % 6 === 1 ? '#2f6fd0' : 'none'; s += `<polygon points="${[0, 1, 2, 3, 4, 5].map((k) => { const a = Math.PI / 3 * k + Math.PI / 6; return (x + 9 * Math.cos(a)).toFixed(1) + ',' + (y + 9 * Math.sin(a)).toFixed(1); }).join(' ')}" fill="${f}" stroke="currentColor" stroke-width=".8" opacity=".9"/>`; } return s + '</svg>'; },
    olustur(api) {
      const { el, svg, tr } = api;
      const isci = api.isciYap(kaynak);
      const SURE = { kolay: 250, orta: 1000, zor: 2600 };
      let st;
      function yeni() {
        const n = +api.ayar.boyut;
        st = { n, KM: K.komsu(n), t: new Uint8Array(n * n), sira: 1, gecmis: [], kazanan: 0, son: -1, bekle: false, gen: (st?.gen || 0) + 1, yukleniyor: false };
        api.konum(''); api.geriAlAktif(false); ciz(); durumYaz();
      }
      const insanMi = (oy) => api.ayar.rakip === 'insan' || oy === 1;
      function oyna(i) {
        if (st.kazanan || st.t[i]) return;
        if (!st.yukleniyor) api.dallanma(st.t.filter((x) => !x).length);
        st.gecmis.push(i); st.t[i] = st.sira; st.son = i;
        api.konum(st.gecmis.join('.'));
        api.duyur(`${st.sira === 1 ? 'Kırmızı' : 'Mavi'} ${Math.floor(i / st.n) + 1}. satır ${i % st.n + 1}. sütun`);
        if (K.baglandi(st.t, st.n, st.sira, st.KM)) {
          st.kazanan = st.sira;
          api.bitti(api.ayar.rakip === 'insan' ? `${st.sira === 1 ? 'Kırmızı' : 'Mavi'} kazandı!` : st.sira === 1 ? 'Kazandın!' : 'Bilgisayar kazandı.', api.ayar.rakip !== 'insan' && st.sira === 2);
        }
        st.sira = 3 - st.sira;
        if (st.yukleniyor) return;
        api.geriAlAktif(st.gecmis.length > 0);
        ciz(); durumYaz();
        if (!st.kazanan && !insanMi(st.sira)) bilgisayar();
      }
      function bilgisayar() {
        st.bekle = true; const gen = st.gen; durumYaz();
        isci.sor({ t: Array.from(st.t), n: st.n, oy: st.sira, sure: SURE[api.ayar.seviye] }).then((c) => {
          if (gen !== st.gen) return;
          st.bekle = false;
          api.neden(c.neden === 'kazan' ? 'Bu taş zinciri tamamlıyor; doğrudan kazanıyorum.'
            : `${tr(c.oyun)} rastgele oyunu sonuna kadar oynadım. Bu hamleyle başlayanların <b>%${tr(c.oran * 100, 0)}</b>'ini kazandım; en çok denediğim ve en güvendiğim hamle bu.`);
          oyna(c.m);
        });
      }
      function durumYaz() {
        if (st.kazanan) { api.durum('Oyun bitti.'); return; }
        const ad = st.sira === 1 ? 'Kırmızı' : 'Mavi';
        if (st.bekle) api.durum('Bilgisayar düşünüyor…', { dusunuyor: true });
        else api.durum(`<span class="nokta" style="background:${st.sira === 1 ? 'var(--kirmizi)' : 'var(--mavi)'}"></span> Sıra: ${ad}`);
      }
      function ciz() {
        const { n, t } = st; const T = api.tahta; T.innerHTML = '';
        const R = 20, w = R * Math.sqrt(3), h = R * 1.5;
        const W = w * n + w * (n - 1) / 2 + 2 * R + 10, H = h * (n - 1) + 2 * R + 26;
        const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, style: 'width:100%;max-width:640px;touch-action:manipulation', role: 'img', 'aria-label': 'Hex tahtası' });
        const merkez = (i) => { const r = Math.floor(i / n), c = i % n; return [R + 14 + c * w + r * w / 2, R + 13 + r * h]; };
        const kose = (x, y, k, rr = R) => { const a = Math.PI / 3 * k + Math.PI / 6; return [x + rr * Math.cos(a), y + rr * Math.sin(a)]; };
        // kenar şeritleri
        const kenar = (a, b, renk) => s.append(svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: renk, 'stroke-width': 7, 'stroke-linecap': 'round' }));
        const [x0, y0] = merkez(0), [x1, y1] = merkez(n - 1), [x2, y2] = merkez(n * (n - 1)), [x3, y3] = merkez(n * n - 1);
        kenar([x0 - w / 2, y0 - R - 4], [x1 + w / 2, y1 - R - 4], 'var(--kirmizi)'); kenar([x2 - w / 2, y2 + R + 4], [x3 + w / 2, y3 + R + 4], 'var(--kirmizi)');
        kenar([x0 - w / 2 - 6, y0 - R / 2], [x2 - w / 2 - 6, y2 + R / 2], 'var(--mavi)'); kenar([x1 + w / 2 + 6, y1 - R / 2], [x3 + w / 2 + 6, y3 + R / 2], 'var(--mavi)');
        const zincir = st.kazanan ? yol(t, n, st.kazanan, st.KM) : new Set();
        const zincirSira = [...zincir].reverse(); // kenardan kenara: kazanan yol bir dalga gibi yanar
        for (let i = 0; i < n * n; i++) {
          const [x, y] = merkez(i);
          const p = svg('polygon', { points: [0, 1, 2, 3, 4, 5].map((k) => kose(x, y, k).join(',')).join(' '),
            fill: t[i] === 1 ? 'var(--kirmizi)' : t[i] === 2 ? 'var(--mavi)' : 'var(--yuzey2)', stroke: 'var(--cizgi)', 'stroke-width': 1.5,
            style: `cursor:${t[i] || st.kazanan ? 'default' : 'pointer'};transition:fill .15s${zincir.has(i) ? `;animation:dalga .5s ${zincirSira.indexOf(i) * 70}ms both` : ''}`, opacity: st.kazanan && t[i] && !zincir.has(i) ? 0.45 : 1,
            'data-r': Math.floor(i / n), 'data-c': i % n, role: 'button', 'aria-label': `${Math.floor(i / n) + 1}. satır ${i % n + 1}. sütun: ${t[i] === 1 ? 'kırmızı' : t[i] === 2 ? 'mavi' : 'boş'}`, class: i === st.son && !st.kazanan ? 'otur' : '' });
          if (!t[i] && !st.kazanan) {
            p.addEventListener('click', () => { if (!st.bekle && insanMi(st.sira)) oyna(i); });
            p.addEventListener('mouseenter', () => p.setAttribute('fill', `color-mix(in srgb,${st.sira === 1 ? 'var(--kirmizi)' : 'var(--mavi)'} 30%,var(--yuzey2))`));
            p.addEventListener('mouseleave', () => p.setAttribute('fill', 'var(--yuzey2)'));
          }
          s.append(p);
          if (i === st.son) s.append(svg('circle', { cx: x, cy: y, r: 4, fill: '#fff', 'pointer-events': 'none' }));
        }
        T.append(s);
        // canlı matematik
        const dk = mesafe(t, n, 1, st.KM), dm = mesafe(t, n, 2, st.KM);
        api.mat(`<p>Bağlantıyı tamamlamak için gereken en az taş (0-1 en kısa yol araması):</p>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 10px;margin:6px 0;font-family:var(--f-sayi);font-size:18px">
          <span style="color:var(--kirmizi)">Kırmızı</span><b>${dk >= 1e9 ? 'yolu kapalı' : dk}</b><span style="color:var(--mavi)">Mavi</span><b>${dm >= 1e9 ? 'yolu kapalı' : dm}</b></div>
          <p>İkisi aynı anda "yolu kapalı" olamaz: biri tıkanırsa öbürü bağlanmıştır. Bu yüzden Hex'te <b>beraberlik yoktur</b>. Nash ayrıca ilk oyuncunun kusursuz oyunla hep kazanacağını kanıtladı ("strateji çalma"), ama o stratejinin ne olduğunu kimse bilmiyor.</p>
          <code class="formul">${n}×${n} tahta: ${n * n} hücre · 3^${n * n} ≈ 10^${tr(n * n * Math.log10(3), 0)} renklendirme</code>`);
      }
      return {
        yeni,
        geriAl() {
          if (!st.gecmis.length) return;
          st.gen++; st.bekle = false;
          const geri = api.ayar.rakip === 'insan' ? 1 : (st.sira === 1 ? 2 : 1);
          for (let k = 0; k < geri && st.gecmis.length; k++) { const i = st.gecmis.pop(); st.t[i] = 0; st.sira = 3 - st.sira; }
          if (!insanMi(st.sira) && st.gecmis.length === 0) st.sira = 1;
          st.kazanan = 0; st.son = st.gecmis.at(-1) ?? -1; api.konum(st.gecmis.join('.')); api.geriAlAktif(st.gecmis.length > 0); api.neden(''); ciz(); durumYaz();
        },
        yukle(kod) {
          st.yukleniyor = true;
          for (const x of kod.split('.').filter(Boolean)) { const i = +x; if (st.kazanan || !(i >= 0 && i < st.n * st.n) || st.t[i]) throw new Error('yasa dışı'); oyna(i); }
          st.yukleniyor = false; api.geriAlAktif(st.gecmis.length > 0); ciz(); durumYaz();
          if (!st.kazanan && !insanMi(st.sira)) bilgisayar();
        },
        yokEt() { isci.iptal(); },
      };
    },
  });
})();
