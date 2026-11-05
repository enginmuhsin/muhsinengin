'use strict';
/* SATRANÇ — tam kurallar: rok, geçerken alma, terfi (vezir), mat, pat, 50 hamle, üç tekrar, yetersiz malzeme.
   Yapay zeka: yinelemeli derinleştirme + negamax alfa-beta + sessizlik araması + konum tabloları. */
(() => {
  function kurallar() {
    const K = {};
    const AT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]], SAH = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    const FIL = [[-1, -1], [-1, 1], [1, -1], [1, 1]], KALE = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    K.renk = (x) => (x ? (x === x.toUpperCase() ? 'w' : 'b') : null);
    const ic = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
    K.saldiriAltinda = (b, kare, kim) => {
      const r0 = kare >> 3, c0 = kare & 7, u = kim === 'w';
      const pr = u ? r0 + 1 : r0 - 1; for (const dc of [-1, 1]) if (ic(pr, c0 + dc) && b[pr * 8 + c0 + dc] === (u ? 'P' : 'p')) return true;
      for (const [dr, dc] of AT) if (ic(r0 + dr, c0 + dc) && b[(r0 + dr) * 8 + c0 + dc] === (u ? 'N' : 'n')) return true;
      for (const [dr, dc] of SAH) if (ic(r0 + dr, c0 + dc) && b[(r0 + dr) * 8 + c0 + dc] === (u ? 'K' : 'k')) return true;
      for (const [Y, tas] of [[FIL, 'BQ'], [KALE, 'RQ']]) for (const [dr, dc] of Y) { let r = r0 + dr, c = c0 + dc; while (ic(r, c)) { const x = b[r * 8 + c]; if (x) { if (K.renk(x) === kim && tas.includes(x.toUpperCase())) return true; break; } r += dr; c += dc; } }
      return false;
    };
    K.sahKaresi = (b, s) => b.indexOf(s === 'w' ? 'K' : 'k');
    K.sahta = (d, s) => K.saldiriAltinda(d.b, K.sahKaresi(d.b, s), s === 'w' ? 'b' : 'w');
    K.sozde = (d) => {
      const b = d.b, s = d.s, l = [], dus = s === 'w' ? 'b' : 'w';
      for (let i = 0; i < 64; i++) {
        const x = b[i]; if (!x || K.renk(x) !== s) continue; const r = i >> 3, c = i & 7, t = x.toUpperCase();
        const ekle = (j, ek = {}) => l.push({ f: i, t: j, x: b[j], ...ek });
        if (t === 'P') {
          const y = s === 'w' ? -1 : 1, bas = s === 'w' ? 6 : 1, son = s === 'w' ? 0 : 7; const ir = r + y;
          if (ic(ir, c) && !b[ir * 8 + c]) { ekle(ir * 8 + c, ir === son ? { p: 'q' } : {}); if (r === bas && !b[(r + 2 * y) * 8 + c]) ekle((r + 2 * y) * 8 + c, { cift: true }); }
          for (const dc of [-1, 1]) if (ic(ir, c + dc)) { const j = ir * 8 + c + dc; if (b[j] && K.renk(b[j]) === dus) ekle(j, ir === son ? { p: 'q' } : {}); else if (j === d.ep) l.push({ f: i, t: j, x: s === 'w' ? 'p' : 'P', ep: true }); }
        } else if (t === 'N' || t === 'K') {
          for (const [dr, dc] of t === 'N' ? AT : SAH) if (ic(r + dr, c + dc)) { const j = (r + dr) * 8 + c + dc; if (!b[j] || K.renk(b[j]) === dus) ekle(j); }
          if (t === 'K') {
            const sat = s === 'w' ? 7 : 0, k = d.rok;
            if (i === sat * 8 + 4 && !K.saldiriAltinda(b, i, dus)) {
              if (k[s === 'w' ? 'K' : 'k'] && !b[i + 1] && !b[i + 2] && b[i + 3] === (s === 'w' ? 'R' : 'r') && !K.saldiriAltinda(b, i + 1, dus) && !K.saldiriAltinda(b, i + 2, dus)) ekle(i + 2, { rok: 'kisa' });
              if (k[s === 'w' ? 'Q' : 'q'] && !b[i - 1] && !b[i - 2] && !b[i - 3] && b[i - 4] === (s === 'w' ? 'R' : 'r') && !K.saldiriAltinda(b, i - 1, dus) && !K.saldiriAltinda(b, i - 2, dus)) ekle(i - 2, { rok: 'uzun' });
            }
          }
        } else {
          const Y = t === 'B' ? FIL : t === 'R' ? KALE : FIL.concat(KALE);
          for (const [dr, dc] of Y) { let a = r + dr, e = c + dc; while (ic(a, e)) { const j = a * 8 + e; if (b[j]) { if (K.renk(b[j]) === dus) ekle(j); break; } ekle(j); a += dr; e += dc; } }
        }
      }
      return l;
    };
    K.uygula = (d, m) => {
      const b = d.b.slice(), x = b[m.f]; const s = d.s; const rok = { ...d.rok };
      b[m.t] = m.p ? (s === 'w' ? 'Q' : 'q') : x; b[m.f] = '';
      if (m.ep) b[m.t + (s === 'w' ? 8 : -8)] = '';
      if (m.rok === 'kisa') { b[m.t - 1] = b[m.t + 1]; b[m.t + 1] = ''; }
      if (m.rok === 'uzun') { b[m.t + 1] = b[m.t - 2]; b[m.t - 2] = ''; }
      if (x === 'K') rok.K = rok.Q = false; if (x === 'k') rok.k = rok.q = false;
      for (const [k, sq] of [['K', 63], ['Q', 56], ['k', 7], ['q', 0]]) if (m.f === sq || m.t === sq) rok[k] = false;
      return { b, s: s === 'w' ? 'b' : 'w', rok, ep: m.cift ? (m.f + m.t) / 2 : -1, yarim: x.toUpperCase() === 'P' || m.x ? 0 : d.yarim + 1 };
    };
    K.yasal = (d) => K.sozde(d).filter((m) => !K.sahta(K.uygula(d, m), d.s));
    K.DEGER = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
    K.PST = {
      P: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
      N: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
      B: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
      R: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
      Q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
      K: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    };
    K.degerlendir = (b) => { // beyaz açısından santipiyon
      let s = 0; for (let i = 0; i < 64; i++) { const x = b[i]; if (!x) continue; const t = x.toUpperCase(); if (x === t) s += K.DEGER[t] + K.PST[t][i]; else s -= K.DEGER[t] + K.PST[t][(7 - (i >> 3)) * 8 + (i & 7)]; } return s;
    };
    return K;
  }
  function dusun(v) {
    const K = kurallar(); const { d, sure, maksDerin, gurultu } = v; const bitis = Date.now() + sure; let dugum = 0, kesildi = false;
    const sira = (m) => (m.x ? 10 * K.DEGER[m.x.toUpperCase()] - K.DEGER[d.b[m.f] ? d.b[m.f].toUpperCase() : 'P'] / 10 + 10000 : 0) + (m.p ? 8000 : 0);
    function sessiz(d, al, be, k) {
      dugum++; const sd = K.degerlendir(d.b) * (d.s === 'w' ? 1 : -1);
      if (sd >= be) return be; if (sd > al) al = sd; if (k === 0) return al;
      const l = K.sozde(d).filter((m) => m.x).sort((a, b) => sira(b) - sira(a));
      for (const m of l) { const y = K.uygula(d, m); if (K.sahta(y, d.s)) continue; const x = -sessiz(y, -be, -al, k - 1); if (x >= be) return be; if (x > al) al = x; }
      return al;
    }
    function negamax(d, derin, al, be, kok) {
      if ((dugum & 1023) === 0 && Date.now() > bitis) kesildi = true;
      if (kesildi) return 0;
      dugum++;
      if (derin === 0) return sessiz(d, al, be, 4);
      const l = K.sozde(d).sort((a, b) => sira(b) - sira(a)); let yasalVar = false, en = -1e9;
      for (const m of l) {
        const y = K.uygula(d, m); if (K.sahta(y, d.s)) continue; yasalVar = true;
        const x = -negamax(y, derin - 1, -be, -al, false);
        if (x > en) en = x; if (x > al) al = x; if (al >= be) break;
      }
      if (!yasalVar) return K.sahta(d, d.s) ? -100000 - derin : 0;
      return en;
    }
    const kokL = K.yasal(d).sort((a, b) => sira(b) - sira(a)); let enM = kokL[0], enX = 0, ulasilan = 0;
    for (let derin = 1; derin <= maksDerin; derin++) {
      let al = -1e9, buM = null, buX = -1e9;
      for (const m of kokL) {
        let x = -negamax(K.uygula(d, m), derin - 1, -1e9, -al, false); if (gurultu) x += Math.random() * gurultu;
        if (kesildi) break; if (x > buX) { buX = x; buM = m; } if (x > al) al = x;
      }
      if (kesildi) break;
      enM = buM; enX = buX; ulasilan = derin;
      kokL.sort((a, b) => (a === buM ? -1 : b === buM ? 1 : 0));
      if (Math.abs(enX) > 90000) break;
    }
    return { m: enM, puan: enX, derin: ulasilan, dugum };
  }
  const kaynak = kurallar.toString() + '\n' + dusun.toString();
  const K = kurallar();
  const kareAd = (i) => 'abcdefgh'[i & 7] + (8 - (i >> 3));
  const GLIF = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
  const TASAD = { K: 'Şah', Q: 'Vezir', R: 'Kale', B: 'Fil', N: 'At', P: 'Piyon' };
  const BASLANGIC = 'rnbqkbnrpppppppp' + ''.padEnd(32, '.') + 'PPPPPPPPRNBQKBNR';

  Salon.kaydet('satranc', {
    baslik: 'Satranç', alt: '64 kare, 32 taş, 10¹²⁰ olası oyun.',
    ozet: 'Bilgisayara karşı ya da iki kişi. Atın renk paritesini ve bir hamlede kaç seçeneğin olduğunu canlı izle.',
    etiketler: ['Alfa-beta + sessizlik', 'Parite', '2 kişi'],
    dallanmaRef: '≈ 35', dallanmaSayi: 35, oyunUzunlugu: 80,
    kurallar: ['Taşa dokun, gidebileceği kareler işaretlenir; kareye dokunarak oyna.', 'Rok, geçerken alma ve terfi desteklenir. Son sıraya ulaşan piyon otomatik olarak vezir olur.',
      'Şahı tehdit altında bırakan hamle yapılamaz. Şah çekilen ve kaçacak hamlesi olmayan oyuncu mat olur.', 'Pat, 50 hamle kuralı, üç kez tekrar ve yetersiz malzeme beraberliktir.', 'Bilgisayara karşı sen beyazsın.'],
    onizleme: () => { let s = '<svg viewBox="0 0 80 80">'; for (let i = 0; i < 64; i++) s += `<rect x="${(i & 7) * 10}" y="${(i >> 3) * 10}" width="10" height="10" fill="${(i + (i >> 3)) % 2 ? '#b58863' : '#f0d9b5'}"/>`; [['♜', 0, 0], ['♚', 4, 0], ['♟', 3, 1], ['♞', 5, 2], ['♟', 4, 4], ['♙', 4, 5], ['♘', 2, 5], ['♖', 0, 7], ['♔', 6, 7]].forEach(([g, c, r]) => { s += `<text x="${c * 10 + 5}" y="${r * 10 + 8.5}" font-size="9" text-anchor="middle" fill="#111">${g}</text>`; }); return s + '</svg>'; },
    olustur(api) {
      const { el, tr } = api;
      const isci = api.isciYap(kaynak);
      const AYAR = { kolay: { sure: 400, maksDerin: 1, gurultu: 90 }, orta: { sure: 900, maksDerin: 3, gurultu: 0 }, zor: { sure: 2600, maksDerin: 7, gurultu: 0 } };
      let st, secili = -1, atHaritasi = true;
      function yeni() {
        st = { d: { b: BASLANGIC.split('').map((x) => (x === '.' ? '' : x)), s: 'w', rok: { K: true, Q: true, k: true, q: true }, ep: -1, yarim: 0 }, gecmis: [], konumlar: {}, bitti: false, son: null, gen: (st?.gen || 0) + 1, bekle: false, alinan: { w: [], b: [] } };
        secili = -1; konumSay(); api.geriAlAktif(false); ciz(); durumYaz();
      }
      const anahtar = (d) => d.b.map((x) => x || '.').join('') + d.s + Object.values(d.rok).map(Number).join('') + d.ep;
      function konumSay() { const k = anahtar(st.d); st.konumlar[k] = (st.konumlar[k] || 0) + 1; return st.konumlar[k]; }
      const insanMi = (s) => api.ayar.rakip === 'insan' || s === 'w';
      function oyna(m) {
        const l = K.yasal(st.d); api.dallanma(l.length);
        st.gecmis.push({ d: st.d, konumlar: { ...st.konumlar }, alinan: { w: st.alinan.w.slice(), b: st.alinan.b.slice() } });
        if (m.x) st.alinan[st.d.s].push(m.x);
        st.d = K.uygula(st.d, m); st.son = m; secili = -1;
        const tekrar = konumSay();
        const yasal = K.yasal(st.d), sah = K.sahta(st.d, st.d.s);
        const kim = st.d.s === 'w' ? 'Beyaz' : 'Siyah', digeri = st.d.s === 'w' ? 'Siyah' : 'Beyaz';
        if (!yasal.length) {
          st.bitti = true;
          if (sah) api.bitti(api.ayar.rakip === 'insan' ? `Mat! ${digeri} kazandı.` : st.d.s === 'b' ? 'Mat! Kazandın.' : 'Mat. Bilgisayar kazandı.', api.ayar.rakip !== 'insan' && st.d.s === 'w');
          else api.bitti('Pat: hamle yok ama şah tehdit altında değil. Berabere.');
        } else if (st.d.yarim >= 100) { st.bitti = true; api.bitti('50 hamle boyunca alma ya da piyon hamlesi olmadı: berabere.'); }
        else if (tekrar >= 3) { st.bitti = true; api.bitti('Aynı konum üç kez tekrarlandı: berabere.'); }
        else if (st.d.b.every((x) => !x || x.toUpperCase() === 'K')) { st.bitti = true; api.bitti('Yalnızca şahlar kaldı: berabere.'); }
        else if (sah) api.bildir(`${kim} şahı tehdit altında!`);
        api.geriAlAktif(st.gecmis.length > 0); ciz(); durumYaz();
        if (!st.bitti && !insanMi(st.d.s)) bilgisayar();
      }
      function bilgisayar() {
        st.bekle = true; durumYaz(); const gen = st.gen, a = AYAR[api.ayar.seviye], bas = Date.now();
        isci.sor({ d: st.d, ...a }).then((c) => {
          if (gen !== st.gen) return;
          setTimeout(() => {
            if (gen !== st.gen) return; st.bekle = false;
            const m = c.m, tas = TASAD[st.d.b[m.f].toUpperCase()];
            const puan = c.puan * (st.d.s === 'b' ? -1 : 1) / 100;
            api.neden(`${c.derin} hamle derinliğe kadar ${tr(c.dugum)} konum inceledim (alfa-beta budaması gereksiz dalları kesti). <b>${tas} ${kareAd(m.f)}–${kareAd(m.t)}</b>${m.x ? `, ${TASAD[m.x.toUpperCase()].toLowerCase()} alıyor` : ''}. ${Math.abs(c.puan) > 90000 ? (c.puan > 0 ? 'Zorlayıcı bir mat görüyorum.' : 'Ne yapsam mat oluyorum.') : `Değerlendirmem: beyaz açısından <b>${puan > 0 ? '+' : ''}${tr(puan, 2)}</b> piyon.`}`);
            oyna(m);
          }, Math.max(0, 300 - (Date.now() - bas)));
        });
      }
      function durumYaz() {
        if (st.bitti) return api.durum('Oyun bitti.');
        if (st.bekle) return api.durum('Bilgisayar düşünüyor…', { dusunuyor: true });
        api.durum(`<span class="nokta" style="background:${st.d.s === 'w' ? '#fff' : '#111'}"></span> Sıra: ${st.d.s === 'w' ? 'Beyaz' : 'Siyah'}${K.sahta(st.d, st.d.s) ? ' · <span style="color:var(--kirmizi)">Şah!</span>' : ''}`);
      }
      function atMesafe(bas) { const D = new Array(64).fill(-1); D[bas] = 0; const q = [bas]; while (q.length) { const i = q.shift(); for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) { const r = (i >> 3) + dr, c = (i & 7) + dc; if (r >= 0 && r < 8 && c >= 0 && c < 8 && D[r * 8 + c] < 0) { D[r * 8 + c] = D[i] + 1; q.push(r * 8 + c); } } } return D; }
      function ciz() {
        const T = api.tahta; T.innerHTML = '';
        const b = st.d.b, oynar = !st.bitti && !st.bekle && insanMi(st.d.s);
        const yasal = oynar && secili >= 0 ? K.yasal(st.d).filter((m) => m.f === secili) : [];
        const hedef = new Map(yasal.map((m) => [m.t, m]));
        const atSecili = secili >= 0 && b[secili] && b[secili].toUpperCase() === 'N';
        const D = atSecili && atHaritasi ? atMesafe(secili) : null;
        const sahK = K.sahta(st.d, st.d.s) ? K.sahKaresi(b, st.d.s) : -1;
        const alinanCiz = (renk) => el('div', { style: 'min-height:22px;font-size:20px;letter-spacing:-2px;color:' + (renk === 'w' ? '#111' : '#fff') + ';text-shadow:' + (renk === 'w' ? 'none' : '0 0 1px #000,0 0 1px #000') }, st.alinan[renk].map((x) => GLIF[x.toUpperCase()]).join(''));
        T.append(alinanCiz('b'));
        const tahta = el('div', { role: 'grid', 'aria-label': 'Satranç tahtası', style: 'display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);width:min(100%,540px);aspect-ratio:1;border-radius:8px;overflow:hidden;box-shadow:var(--golge);border:6px solid #6b4a2f;box-sizing:border-box' });
        for (let i = 0; i < 64; i++) {
          const acik = ((i >> 3) + (i & 7)) % 2 === 0, x = b[i];
          let bg = acik ? '#f0d9b5' : '#b58863';
          if (st.son && (i === st.son.f || i === st.son.t)) bg = acik ? '#f6eb72' : '#dcc34b';
          if (i === secili) bg = '#8fbf5a';
          if (i === sahK) bg = 'radial-gradient(circle,#ff4d4d 30%,' + bg + ' 80%)';
          const h = el('button', { type: 'button', role: 'gridcell', class: 'hucre-btn', 'aria-label': `${kareAd(i)} ${x ? (K.renk(x) === 'w' ? 'beyaz ' : 'siyah ') + TASAD[x.toUpperCase()].toLowerCase() : 'boş'}`,
            style: `position:relative;background:${bg};display:grid;place-items:center;min-width:0;font-size:clamp(22px,6.4vw,46px);line-height:1;cursor:${oynar ? 'pointer' : 'default'}` });
          if (x) h.append(el('span', { style: `color:${K.renk(x) === 'w' ? '#fff' : '#161616'};text-shadow:${K.renk(x) === 'w' ? '0 0 2px #000,0 0 1px #000,0 1px 1px #000' : '0 1px 0 rgba(255,255,255,.25)'};pointer-events:none` }, GLIF[x.toUpperCase()]));
          if (hedef.has(i)) h.append(el('i', { style: `position:absolute;${x ? 'inset:4%;border:4px solid rgba(20,60,20,.45);border-radius:50%' : 'width:28%;height:28%;border-radius:50%;background:rgba(20,60,20,.38)'};pointer-events:none` }));
          if (D && D[i] > 0) h.append(el('span', { style: `position:absolute;top:2px;left:4px;font-size:11px;font-weight:700;font-family:var(--f-sayi);color:${D[i] % 2 ? '#c8402f' : '#2f6fd0'}` }, String(D[i])));
          if ((i & 7) === 0) h.append(el('span', { style: `position:absolute;top:1px;right:3px;font-size:10px;color:${acik ? '#b58863' : '#f0d9b5'}` }, String(8 - (i >> 3))));
          if (i >> 3 === 7) h.append(el('span', { style: `position:absolute;bottom:1px;right:3px;font-size:10px;color:${acik ? '#b58863' : '#f0d9b5'}` }, 'abcdefgh'[i & 7]));
          h.onclick = () => {
            if (!oynar) return;
            if (hedef.has(i)) return oyna(hedef.get(i));
            secili = x && K.renk(x) === st.d.s && secili !== i ? i : -1; ciz();
          };
          tahta.append(h);
        }
        T.append(tahta, alinanCiz('w'));
        matCiz(atSecili);
      }
      function matCiz(atSecili) {
        const n = K.yasal(st.d).length;
        const mal = (renk) => st.d.b.reduce((s, x) => s + (x && K.renk(x) === renk ? K.DEGER[x.toUpperCase()] / 100 : 0), 0);
        let m = `<p>Şu an <b>${n}</b> yasal hamle var. Ortalama bir konumda yaklaşık 35; Claude Shannon bundan oyun ağacının 10¹²⁰ dolayında olduğunu tahmin etti.</p>
          <p style="margin-top:6px">Malzeme (piyon=1, at=3, fil=3, kale=5, vezir=9): beyaz <b>${tr(mal('w'), 0)}</b> · siyah <b>${tr(mal('b'), 0)}</b>${secili >= 0 ? ` · seçili taşın <b>${K.yasal(st.d).filter((x) => x.f === secili).length}</b> hamlesi var` : ''}.</p>`;
        if (atSecili) m += `<p style="margin-top:6px"><b>At paritesi:</b> karelerdeki sayılar, atın oraya en az kaç hamlede gidebileceği. <span style="color:#c8402f">Tek</span> sayılar hep atın şu anki renginin tersindeki karelerde, <span style="color:#2f6fd0">çift</span> sayılar aynı renkte: at her hamlede kare rengini değiştirir.</p>
          <label style="display:flex;gap:6px;align-items:center;margin-top:6px;font-size:13px"><input type="checkbox" id="atHar" ${atHaritasi ? 'checked' : ''}> Mesafe haritasını göster</label>`;
        else m += '<p style="margin-top:6px;color:var(--soluk)">İpucu: bir ata dokun, mesafe haritasını gör.</p>';
        m += '<code class="formul">buğday efsanesi: 1 + 2 + 4 + … + 2⁶³ = 2⁶⁴ − 1 ≈ 1,8 × 10¹⁹ tane</code>';
        api.mat(m);
        const k = document.getElementById('atHar'); if (k) k.onchange = () => { atHaritasi = k.checked; ciz(); };
      }
      return {
        yeni,
        geriAl() {
          if (!st.gecmis.length) return; st.gen++; st.bekle = false;
          let h = st.gecmis.pop(); if (api.ayar.rakip !== 'insan') while (h.d.s !== 'w' && st.gecmis.length) h = st.gecmis.pop();
          st.d = h.d; st.konumlar = h.konumlar; st.alinan = h.alinan; st.bitti = false; st.son = null; secili = -1;
          api.geriAlAktif(st.gecmis.length > 0); api.neden(''); ciz(); durumYaz();
        },
        yokEt() { isci.iptal(); },
      };
    },
  });
})();
