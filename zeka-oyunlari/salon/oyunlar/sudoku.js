'use strict';
/* SUDOKU — bir graf boyama problemi: 81 düğüm, her düğümün 20 komşusu, 9 renk.
   Üretici: rastgele tam ızgara + tek çözüm kalacak şekilde hücre silme.
   İpucu: "tek aday" ve "gizli tek" kurallarını gerekçesiyle gösterir. */
(() => {
  const KOMSU = []; // her hücrenin 20 komşusu
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9), c = i % 9, s = new Set();
    for (let k = 0; k < 9; k++) { s.add(r * 9 + k); s.add(k * 9 + c); }
    const br = r - r % 3, bc = c - c % 3; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s.add((br + a) * 9 + bc + b);
    s.delete(i); KOMSU.push([...s]);
  }
  const BIRIM = []; // 27 birim: 9 satır, 9 sütun, 9 kutu
  for (let k = 0; k < 9; k++) {
    BIRIM.push({ ad: `${k + 1}. satır`, h: [...Array(9)].map((_, j) => k * 9 + j) });
    BIRIM.push({ ad: `${k + 1}. sütun`, h: [...Array(9)].map((_, j) => j * 9 + k) });
    const br = Math.floor(k / 3) * 3, bc = (k % 3) * 3;
    BIRIM.push({ ad: `${k + 1}. kutu`, h: [...Array(9)].map((_, j) => (br + Math.floor(j / 3)) * 9 + bc + j % 3) });
  }
  const adaylar = (g, i) => { let m = 0x3fe; for (const k of KOMSU[i]) if (g[k]) m &= ~(1 << g[k]); return m; };
  const bitSay = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
  function coz(g, sinir, rastgele) { // rastgele: false ya da rastgele sayı üreteci // çözüm sayısı (sinir'de durur); g yerinde doldurulur
    let en = -1, enM = 0, enN = 10;
    for (let i = 0; i < 81; i++) if (!g[i]) { const m = adaylar(g, i), n = bitSay(m); if (n < enN) { en = i; enM = m; enN = n; if (n <= 1) break; } }
    if (en < 0) return 1;
    if (enN === 0) return 0;
    const rakam = []; for (let d = 1; d <= 9; d++) if (enM & (1 << d)) rakam.push(d);
    if (rastgele) Salon.karistir(rakam, rastgele);
    let toplam = 0;
    for (const d of rakam) {
      g[en] = d; toplam += coz(g, sinir - toplam, rastgele);
      if (toplam >= sinir) { if (sinir === 1) return toplam; g[en] = 0; return toplam; }
      g[en] = 0;
    }
    return toplam;
  }
  function uret(ipucuHedef, rnd = Math.random) { // aynı rnd tohumu → her tarayıcıda aynı bulmaca
    const tam = new Array(81).fill(0); coz(tam, 1, rnd);
    const g = tam.slice(); const sira = Salon.karistir([...Array(81).keys()], rnd);
    let dolu = 81;
    for (const i of sira) {
      if (dolu <= ipucuHedef) break;
      const v = g[i]; g[i] = 0;
      if (coz(g.slice(), 2, false) !== 1) g[i] = v; else dolu--;
    }
    return { soru: g, cozum: tam };
  }
  const hucreAd = (i) => `${Math.floor(i / 9) + 1}. satır ${i % 9 + 1}. sütun`;

  Salon.kaydet('sudoku', {
    baslik: 'Sudoku', alt: '81 hücre, 27 birim, tek bir çözüm.',
    ozet: 'Her satır, sütun ve kutuya 1–9 bir kez. İpucu, cevabı değil nedenini söyler.',
    etiketler: ['Geri izleme', 'Graf boyama', '1 kişi'],
    dallanmaRef: 'hücreye göre 1–9',
    secenekler: [
      { id: 'bulmaca', ad: 'Bulmaca', sec: [['rastgele', 'Yeni'], ['gunluk', 'Günün Sudokusu']], v: 'rastgele' },
      { id: 'seviye', ad: 'Seviye', sec: [['kolay', 'Kolay'], ['orta', 'Orta'], ['zor', 'Zor']], v: 'kolay', goster: (a) => a.bulmaca !== 'gunluk' },
    ],
    kurallar: ['Her satıra, her sütuna ve her 3×3 kutuya 1\'den 9\'a kadar rakamlar birer kez yazılır.',
      'Hücre seç, rakama dokun. Klavyede 1–9, Sil ve ok tuşları da çalışır.',
      '"Not" modunda küçük aday rakamları yazarsın.', 'İpucu önce mantık kuralı arar; bulamazsa doğru rakamı açar.'],
    onizleme: () => { let s = '<svg viewBox="0 0 90 90">'; const o = [5, 0, 0, 0, 7, 0, 0, 0, 3, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 1, 0, 0, 0, 0, 6, 0, 2, 0, 0, 0, 0, 0, 8, 0, 6, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 7, 0, 0, 0, 9, 0, 0, 0, 5];
      for (let i = 0; i < 81; i++) if (o[i]) s += `<text x="${(i % 9) * 10 + 5}" y="${Math.floor(i / 9) * 10 + 8}" font-size="7.5" text-anchor="middle" fill="currentColor" font-family="sans-serif">${o[i]}</text>`;
      for (let k = 0; k <= 9; k++) s += `<path d="M${k * 10} 0V90M0 ${k * 10}H90" stroke="currentColor" stroke-width="${k % 3 ? 0.3 : 1.2}" opacity=".7"/>`;
      return s + '</svg>'; },
    olustur(api) {
      const { el, tr } = api;
      let st, secili = -1, notModu = false, saat = null;
      const sureYaz = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      const kaydetGunluk = () => api.yaz('su.gunluk', { gun: st.gun, g: st.g, not: st.not, hata: st.hata, ipucu: st.ipucu, sure: st.sure, bitti: st.bitti });
      const HEDEF = { kolay: 40, orta: 32, zor: 25 };

      function yeni() {
        api.durum('Bulmaca hazırlanıyor…', { dusunuyor: true });
        api.tahta.innerHTML = '';
        clearInterval(saat);
        setTimeout(() => {
          const gunluk = api.ayar.bulmaca === 'gunluk', gun = api.gunAnahtari();
          const { soru, cozum } = gunluk ? uret(HEDEF.orta, api.tohumlu('sudoku-' + gun)) : uret(HEDEF[api.ayar.seviye]);
          st = { soru, cozum, g: soru.slice(), not: new Array(81).fill(0), gecmis: [], hata: 0, ipucu: 0, bitti: false, ipucuHucre: -1, gunluk, gun, sure: 0 };
          if (gunluk) { const k = api.oku('su.gunluk', null); if (k && k.gun === gun) Object.assign(st, { g: k.g, not: k.not, hata: k.hata, ipucu: k.ipucu, sure: k.sure, bitti: k.bitti }); }
          secili = st.g.indexOf(0);
          api.durum(gunluk ? `Günün Sudokusu · ${api.gunAdi()} · herkes aynı bulmacayı çözüyor.` : `${soru.filter(Boolean).length} ipucu verildi. Başla!`);
          if (st.bitti) api.bitti('Bugünün Sudokusunu çözdün. Yarın yenisi gelir.');
          saat = setInterval(() => { if (st && !st.bitti && !document.hidden && !document.getElementById('oyunSayfa').hidden) { st.sure++; const e = document.getElementById('suSure'); if (e) e.textContent = sureYaz(st.sure); if (st.gunluk && st.sure % 5 === 0) kaydetGunluk(); } }, 1000);
          ciz();
        }, 30);
      }
      function yerlestir(i, d) {
        if (st.bitti || i < 0 || st.soru[i]) return;
        st.gecmis.push({ i, g: st.g[i], not: st.not[i] });
        if (notModu && d) { st.not[i] ^= 1 << d; }
        else {
          if (d) api.dallanma(bitSay(adaylar(Object.assign(st.g.slice(), { [i]: 0 }), i)) || 1);
          st.g[i] = st.g[i] === d ? 0 : d; st.not[i] = 0;
          if (d && st.g[i] && st.g[i] !== st.cozum[i] && KOMSU[i].some((k) => st.g[k] === d)) st.hata++;
          if (st.g[i]) for (const k of KOMSU[i]) st.not[k] &= ~(1 << st.g[i]);
        }
        st.ipucuHucre = -1;
        if (st.g.every((v, j) => v === st.cozum[j])) { st.bitti = true; api.bitti(`Çözdün! ${sureYaz(st.sure)} · ${st.ipucu} ipucu, ${st.hata} çakışma.`); api.durum('Tamamlandı.'); }
        if (st.gunluk) kaydetGunluk();
        api.geriAlAktif(st.gecmis.length > 0);
        ciz();
      }
      function ipucu() {
        if (st.bitti) return;
        st.ipucu++;
        // 1) tek aday
        for (let i = 0; i < 81; i++) if (!st.g[i]) {
          const m = adaylar(st.g, i);
          if (bitSay(m) === 1) {
            const d = Math.log2(m); const gor = [...new Set(KOMSU[i].map((k) => st.g[k]).filter(Boolean))].sort();
            secili = i; st.ipucuHucre = i;
            api.neden(`<b>Tek aday:</b> ${hucreAd(i)} hücresinin 20 komşusunda ${gor.join(', ')} rakamları var. Geriye yalnızca <b>${d}</b> kalıyor.`);
            ciz(); return;
          }
        }
        // 2) gizli tek
        for (const b of BIRIM) for (let d = 1; d <= 9; d++) {
          if (b.h.some((i) => st.g[i] === d)) continue;
          const yer = b.h.filter((i) => !st.g[i] && adaylar(st.g, i) & (1 << d));
          if (yer.length === 1) {
            secili = yer[0]; st.ipucuHucre = yer[0];
            api.neden(`<b>Gizli tek:</b> ${b.ad} içinde <b>${d}</b> rakamının girebileceği tek hücre ${hucreAd(yer[0])}. Diğer boş hücrelerin hepsi ${d}'yi bir komşusunda görüyor.`);
            ciz(); return;
          }
        }
        const bos = st.g.findIndex((v, i) => !v); secili = bos;
        api.neden('Basit bir kural bulamadım; bu konum daha ileri teknik ister (çiftler, X-wing). Bu hücrenin doğru rakamını açtım.');
        yerlestir(bos, st.cozum[bos]);
      }
      function ciz() {
        const T = api.tahta; T.innerHTML = '';
        const bos = st.g.filter((v) => !v).length;
        T.append(el('div', { class: 'ust-bilgi' }, el('span', {}, 'Süre ', el('b', { id: 'suSure' }, sureYaz(st.sure))), el('span', {}, 'Boş ', el('b', {}, String(bos))), el('span', {}, 'Çakışma ', el('b', {}, String(st.hata))), el('span', {}, 'İpucu ', el('b', {}, String(st.ipucu)))));
        const izgara = el('div', { role: 'grid', 'aria-label': 'Sudoku tahtası', style: 'display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(9,1fr);width:min(100%,460px);aspect-ratio:1;border:2.5px solid var(--metin);border-radius:6px;overflow:hidden;background:var(--yuzey)' });
        const sd = secili >= 0 ? st.g[secili] : 0;
        for (let i = 0; i < 81; i++) {
          const r = Math.floor(i / 9), c = i % 9, v = st.g[i];
          const komsu = secili >= 0 && KOMSU[secili].includes(i);
          const cakisma = v && KOMSU[i].some((k) => st.g[k] === v);
          let bg = 'transparent';
          if (komsu) bg = 'color-mix(in srgb,var(--mavi) 9%,transparent)';
          if (sd && v === sd) bg = 'color-mix(in srgb,var(--mavi) 22%,transparent)';
          if (i === secili) bg = 'color-mix(in srgb,var(--mavi) 34%,transparent)';
          if (i === st.ipucuHucre) bg = 'color-mix(in srgb,var(--sari) 45%,transparent)';
          const b = el('button', { type: 'button', role: 'gridcell', class: 'hucre-btn', 'aria-label': `${hucreAd(i)}: ${v || 'boş'}`,
            style: `position:relative;background:${bg};border-right:${c % 3 === 2 && c < 8 ? '2px solid var(--metin)' : '1px solid var(--cizgi)'};border-bottom:${r % 3 === 2 && r < 8 ? '2px solid var(--metin)' : '1px solid var(--cizgi)'};font-family:var(--f-sayi);font-size:clamp(16px,4.4vw,26px);color:${cakisma ? 'var(--kirmizi)' : st.soru[i] ? 'var(--metin)' : 'var(--mavi)'};font-weight:${st.soru[i] ? 700 : 500};display:grid;place-items:center;min-width:0`,
            onclick: () => { secili = i; ciz(); } });
          if (v) b.textContent = v;
          else if (st.not[i]) { const n = el('span', { style: 'display:grid;grid-template-columns:repeat(3,1fr);width:100%;height:100%;font-size:clamp(7px,1.6vw,10px);color:var(--soluk);font-family:var(--f-govde)' }); for (let d = 1; d <= 9; d++) n.append(el('span', { style: 'display:grid;place-items:center' }, st.not[i] & (1 << d) ? String(d) : '')); b.append(n); }
          izgara.append(b);
        }
        T.append(izgara);
        const tus = el('div', { style: 'display:grid;grid-template-columns:repeat(9,1fr);gap:6px;width:min(100%,460px)' });
        for (let d = 1; d <= 9; d++) {
          const kalan = 9 - st.g.filter((v) => v === d).length;
          tus.append(el('button', { type: 'button', class: 'dug', style: `padding:8px 0;font-family:var(--f-sayi);font-size:19px;${kalan ? '' : 'opacity:.35'}`, onclick: () => yerlestir(secili, d), title: `${kalan} tane kaldı` }, String(d)));
        }
        if (st.gunluk && st.bitti) {
          const metin = `Günün Sudokusu · ${api.gunAdi()} · ${sureYaz(st.sure)} · ${st.ipucu} ipucu · ${st.hata} çakışma\nmuhsinengin.com/zeka-oyunlari/salon/#sudoku-gunluk`;
          T.append(el('div', { style: 'width:min(100%,460px);display:flex;flex-direction:column;gap:8px' },
            el('pre', { style: 'margin:0;padding:10px 12px;border-radius:10px;background:var(--yuzey2);font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;white-space:pre-wrap;user-select:text' }, metin),
            el('button', { class: 'dug ana', type: 'button', onclick: async (e) => { const ok = await api.kopyala(metin); e.target.textContent = ok ? 'Kopyalandı' : 'Metni seçip kopyala'; } }, 'Sonucu kopyala')));
          matCiz(); return;
        }
        T.append(tus);
        T.append(el('div', { class: 'dugmeler' },
          el('button', { type: 'button', class: 'cip', 'aria-pressed': String(notModu), onclick: () => { notModu = !notModu; ciz(); } }, 'Not modu'),
          el('button', { type: 'button', class: 'dug', onclick: () => yerlestir(secili, 0) }, 'Sil'),
          el('button', { type: 'button', class: 'dug ana', onclick: ipucu }, 'İpucu')));
        matCiz();
      }
      function matCiz() {
        let tekler = 0; for (let i = 0; i < 81; i++) if (!st.g[i] && bitSay(adaylar(st.g, i)) === 1) tekler++;
        let ek = '';
        if (secili >= 0 && !st.g[secili]) {
          const m = adaylar(st.g, secili); const liste = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) liste.push(d);
          ek = `<p style="margin-top:6px">Seçili hücrenin adayları: <b>${liste.join(' · ') || 'yok!'}</b> (${liste.length} seçenek). Mavi gölgeli 20 hücre onun komşuları.</p>`;
        }
        api.mat(`<p>Sudoku bir <b>graf boyama</b>: 81 düğüm, her düğüm 20 komşusuna bağlı (toplam 810 kenar). Komşu iki düğüm aynı renge (rakama) boyanamaz; 9 renk yeter.</p>${ek}
          <p style="margin-top:6px">Şu an tek adaylı hücre sayısı: <b>${tekler}</b>. Bunlar mantıkla hemen dolar.</p>
          <code class="formul">Tamamlanmış Sudoku sayısı ≈ 6,67 × 10²¹</code>`);
      }
      addEventListener('keydown', tusIsle);
      function tusIsle(e) {
        if (!st || document.getElementById('oyunSayfa').hidden || e.target.tagName === 'INPUT') return;
        if (/^[1-9]$/.test(e.key)) { yerlestir(secili, +e.key); e.preventDefault(); }
        else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { yerlestir(secili, 0); e.preventDefault(); }
        else if (e.key.startsWith('Arrow') && secili >= 0) {
          const r = Math.floor(secili / 9), c = secili % 9;
          const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
          secili = ((r + dr + 9) % 9) * 9 + (c + dc + 9) % 9; ciz(); e.preventDefault();
        } else if (e.key === 'n' || e.key === 'N') { notModu = !notModu; ciz(); }
      }
      return {
        yeni,
        geriAl() { const h = st.gecmis.pop(); if (!h) return; st.g[h.i] = h.g; st.not[h.i] = h.not; st.bitti = false; secili = h.i; api.geriAlAktif(st.gecmis.length > 0); ciz(); },
        yokEt() { removeEventListener('keydown', tusIsle); clearInterval(saat); },
      };
    },
  });
})();
