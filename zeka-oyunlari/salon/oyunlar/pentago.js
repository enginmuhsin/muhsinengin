'use strict';
/* PENTAGO — 6×6, dört döner çeyrek. Hamle = bir bilye koy + bir çeyreği 90° döndür.
   İlk hamlede 36 × 8 = 288 seçenek. 2014'te çözüldü: ilk oyuncu kazanır. */
(() => {
  function kurallar() {
    const K = {};
    K.CIZGI = [];
    for (let r = 0; r < 6; r++) for (let s = 0; s < 2; s++) { K.CIZGI.push([0, 1, 2, 3, 4].map((k) => r * 6 + s + k)); K.CIZGI.push([0, 1, 2, 3, 4].map((k) => (s + k) * 6 + r)); }
    for (const [r, c] of [[0, 0], [0, 1], [1, 0], [1, 1]]) K.CIZGI.push([0, 1, 2, 3, 4].map((k) => (r + k) * 6 + c + k));
    for (const [r, c] of [[0, 5], [0, 4], [1, 5], [1, 4]]) K.CIZGI.push([0, 1, 2, 3, 4].map((k) => (r + k) * 6 + c - k));
    K.dondur = (t, q, yon) => { // yon: 1 saat yönü, -1 tersi
      const a = t.slice(), r0 = q >> 1 ? 3 : 0, c0 = q & 1 ? 3 : 0;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const kaynak = yon === 1 ? (2 - c) * 6 + r : c * 6 + (2 - r);
        a[(r0 + r) * 6 + c0 + c] = t[(r0 + Math.floor(kaynak / 6)) * 6 + c0 + kaynak % 6];
      }
      return a;
    };
    K.kazanan = (t) => { let a = false, b = false; for (const L of K.CIZGI) { const x = t[L[0]]; if (x && t[L[1]] === x && t[L[2]] === x && t[L[3]] === x && t[L[4]] === x) { if (x === 1) a = true; else b = true; } } return a && b ? 3 : a ? 1 : b ? 2 : 0; };
    K.hamleler = (t) => { const l = []; for (let i = 0; i < 36; i++) if (!t[i]) for (let q = 0; q < 4; q++) { l.push([i, q, 1]); l.push([i, q, -1]); } return l; };
    K.uygula = (t, h, p) => { const a = t.slice(); a[h[0]] = p; if (K.kazanan(a) === p) return { a, erken: true }; return { a: K.dondur(a, h[1], h[2]), erken: false }; };
    K.deger = (t, p) => { let s = 0; for (const L of K.CIZGI) { let x = 0, y = 0; for (const i of L) { if (t[i] === p) x++; else if (t[i]) y++; } if (!y && x) s += [0, 1, 6, 40, 400, 1e5][x]; if (!x && y) s -= [0, 1, 7, 60, 900, 1e5][y]; } return s; };
    return K;
  }
  function dusun(v) {
    const K = kurallar(); const { t, p, derin, demet, gurultu } = v; let dugum = 0;
    function sonuc(a, sira) { const w = K.kazanan(a); if (w === 3) return 0; if (w === p) return 1e7; if (w) return -1e7; return null; }
    function ara(a, sira, d, al, be) {
      dugum++;
      const w = sonuc(a); if (w !== null) return w * (1 + d * 0.01);
      if (d === 0) return K.deger(a, p);
      let l = K.hamleler(a); if (!l.length) return 0;
      const ad = l.map((h) => { const u = K.uygula(a, h, sira); return { u, s: K.deger(u.a, p) }; });
      ad.sort((x, y) => (sira === p ? y.s - x.s : x.s - y.s));
      const liste = ad.slice(0, demet);
      if (sira === p) { let en = -1e9; for (const { u } of liste) { en = Math.max(en, ara(u.a, 3 - sira, d - 1, al, be)); al = Math.max(al, en); if (al >= be) break; } return en; }
      let en = 1e9; for (const { u } of liste) { en = Math.min(en, ara(u.a, 3 - sira, d - 1, al, be)); be = Math.min(be, en); if (al >= be) break; } return en;
    }
    const l = K.hamleler(t).map((h) => { const u = K.uygula(t, h, p); return { h, u, s: K.deger(u.a, p) }; }).sort((x, y) => y.s - x.s);
    let en = l[0], enX = -1e10;
    for (const x of l.slice(0, Math.max(demet * 2, 40))) { let val = ara(x.u.a, 3 - p, derin - 1, enX, 1e10) + (gurultu ? Math.random() * gurultu : 0); if (val > enX) { enX = val; en = x; } }
    return { h: en.h, puan: enX, dugum, toplam: l.length };
  }
  const kaynak = kurallar.toString() + '\n' + dusun.toString();
  const K = kurallar();

  Salon.kaydet('pentago', {
    baslik: 'Pentago', alt: 'Koy, döndür, beşle.',
    ozet: 'Her hamlede tahtanın dörtte biri döner. 288 ilk hamlenin içinde kaybolma.',
    etiketler: ['Alfa-beta (demet)', 'Dönme simetrisi', '2 kişi'],
    dallanmaRef: '≈ 150', dallanmaSayi: 150, oyunUzunlugu: 20,
    kurallar: ['Sırası gelen oyuncu boş bir yuvaya bilye koyar, sonra dört çeyrekten birini 90° saat yönünde veya tersine döndürür.',
      'Yatay, dikey ya da çapraz 5 bilyeyi yan yana getiren kazanır. Bilyeyi koyar koymaz 5 olursa döndürmeye gerek kalmaz.',
      'Döndürme sonunda iki oyuncu birden 5 yaparsa berabere. Tahta dolarsa da berabere.', 'Önce boş bir yuvaya dokun, sonra bir çeyreğin oklarından birine.'],
    onizleme: () => { let s = '<svg viewBox="0 0 100 100">'; for (let q = 0; q < 4; q++) { const x = (q & 1) * 51 + 2, y = (q >> 1) * 51 + 2; s += `<rect x="${x}" y="${y}" width="46" height="46" rx="7" fill="#b8423a"/>`; for (let k = 0; k < 9; k++) { const v = (q * 5 + k * 7) % 6; s += `<circle cx="${x + 8 + (k % 3) * 15}" cy="${y + 8 + Math.floor(k / 3) * 15}" r="5.5" fill="${v === 0 ? '#1b1b1b' : v === 1 ? '#f4f1e8' : '#8f2f29'}"/>`; } } return s + '</svg>'; },
    olustur(api) {
      const { el, tr } = api;
      const isci = api.isciYap(kaynak);
      const AYAR = { kolay: { derin: 1, demet: 288, gurultu: 60 }, orta: { derin: 2, demet: 40, gurultu: 0 }, zor: { derin: 3, demet: 18, gurultu: 0 } };
      let st;
      function yeni() { st = { t: new Array(36).fill(0), sira: 1, bekleyen: -1, gecmis: [], bitti: false, gen: (st?.gen || 0) + 1, bekle: false, son: -1, donen: null }; api.geriAlAktif(false); ciz(); durumYaz(); }
      const insanMi = (p) => api.ayar.rakip === 'insan' || p === 1;
      function tamamla(h, p) {
        api.dallanma(K.hamleler(st.t).length);
        st.gecmis.push({ t: st.t.slice(), sira: p });
        const ara = st.t.slice(); ara[h[0]] = p;
        const u = K.uygula(st.t, h, p);
        st.son = h[0]; st.bekleyen = -1;
        if (u.erken) { st.t = u.a; return bitir(); }
        // dönme animasyonu: önce bilye görünsün, sonra çeyrek dönsün
        st.t = ara; st.donen = { q: h[1], yon: h[2] }; ciz();
        setTimeout(() => { st.t = u.a; st.donen = null; st.son = K.dondur([...Array(36).keys()], h[1], h[2]).indexOf(h[0]); bitir(); }, 420);
      }
      function bitir() {
        const w = K.kazanan(st.t);
        if (w || st.t.every(Boolean)) {
          st.bitti = true;
          const m = w === 3 || !w ? 'Berabere.' : api.ayar.rakip === 'insan' ? `${w === 1 ? 'Siyah' : 'Beyaz'} kazandı!` : w === 1 ? 'Kazandın!' : 'Bilgisayar kazandı.';
          api.bitti(m, api.ayar.rakip !== 'insan' && w === 2);
        } else st.sira = 3 - st.sira;
        api.geriAlAktif(st.gecmis.length > 0); ciz(); durumYaz();
        if (!st.bitti && !insanMi(st.sira)) bilgisayar();
      }
      function bilgisayar() {
        st.bekle = true; durumYaz(); const gen = st.gen, a = AYAR[api.ayar.seviye];
        isci.sor({ t: st.t, p: st.sira, ...a }).then((c) => {
          if (gen !== st.gen) return; st.bekle = false;
          const ceyrek = ['sol üst', 'sağ üst', 'sol alt', 'sağ alt'][c.h[1]];
          api.neden(`${c.toplam} olası hamleden (boş yuva × 4 çeyrek × 2 yön) en umutlu olanlara ${a.derin} hamle derinlikte baktım: ${tr(c.dugum)} konum. Bilyeyi koyup <b>${ceyrek}</b> çeyreği ${c.h[2] === 1 ? 'saat yönünde' : 'saat yönünün tersine'} döndürdüm. ${c.puan > 1e6 ? 'Bu hamleyle kazanmayı garantiledim.' : c.puan < -1e6 ? 'Ne yapsam kaybediyorum gibi görünüyor.' : ''}`);
          tamamla(c.h, st.sira);
        });
      }
      function durumYaz() {
        if (st.bitti) return api.durum('Oyun bitti.');
        if (st.bekle) return api.durum('Bilgisayar düşünüyor…', { dusunuyor: true });
        api.durum(`<span class="nokta" style="background:${st.sira === 1 ? '#1b1b1b' : '#f4f1e8'}"></span> ${st.sira === 1 ? 'Siyah' : 'Beyaz'}: ${st.bekleyen < 0 ? 'boş bir yuvaya dokun' : 'şimdi bir çeyreği döndür'}`);
      }
      function ciz() {
        const T = api.tahta; T.innerHTML = '';
        const oynar = !st.bitti && !st.bekle && insanMi(st.sira) && !st.donen;
        const tahta = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;width:min(100%,500px);aspect-ratio:1;padding:10px;box-sizing:border-box' });
        for (let q = 0; q < 4; q++) {
          const r0 = q >> 1 ? 3 : 0, c0 = q & 1 ? 3 : 0;
          const kap = el('div', { style: 'position:relative' });
          const kutu = el('div', { style: `display:grid;grid-template-columns:repeat(3,1fr);gap:6%;padding:8%;height:100%;box-sizing:border-box;border-radius:14px;background:linear-gradient(145deg,#c64a40,#9c3530);box-shadow:var(--golge);transition:transform .4s cubic-bezier(.3,.7,.3,1)${st.donen && st.donen.q === q ? `;transform:rotate(${st.donen.yon * 90}deg)` : ''}` });
          for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
            const i = (r0 + r) * 6 + c0 + c, v = st.t[i] || (st.bekleyen === i ? st.sira : 0);
            const b = el('button', { type: 'button', class: 'hucre-btn', 'aria-label': `yuva ${r0 + r + 1}-${c0 + c + 1}: ${v === 1 ? 'siyah' : v === 2 ? 'beyaz' : 'boş'}`,
              style: `border-radius:50%;background:${v === 1 ? 'radial-gradient(circle at 35% 30%,#555,#111)' : v === 2 ? 'radial-gradient(circle at 35% 30%,#fff,#d6d1c3)' : '#7f2a25'};box-shadow:${v ? '0 2px 3px rgba(0,0,0,.4)' : 'inset 0 3px 5px rgba(0,0,0,.45)'};${i === st.son || i === st.bekleyen ? 'outline:2px solid var(--sari);outline-offset:2px;' : ''}cursor:${oynar && (!st.t[i]) ? 'pointer' : 'default'}` });
            if (oynar && !st.t[i]) b.onclick = () => { st.bekleyen = st.bekleyen === i ? -1 : i; ciz(); durumYaz(); };
            kutu.append(b);
          }
          kap.append(kutu);
          if (oynar && st.bekleyen >= 0) {
            const ok = (yon, yer) => el('button', { type: 'button', 'aria-label': `${['Sol üst', 'Sağ üst', 'Sol alt', 'Sağ alt'][q]} çeyreği ${yon === 1 ? 'saat yönünde' : 'saat yönünün tersine'} döndür`,
              style: `position:absolute;${yer};width:36px;height:36px;border-radius:50%;border:2px solid var(--yuzey);background:var(--murekkep);color:var(--kagit);font-size:18px;z-index:2;box-shadow:var(--golge)`,
              onclick: () => tamamla([st.bekleyen, q, yon], st.sira) }, yon === 1 ? '↻' : '↺');
            const dikey = q >> 1 ? 'bottom:-14px' : 'top:-14px', sol = q & 1 ? 'right:-14px' : 'left:-14px';
            kap.append(ok(1, `${dikey};${q & 1 ? 'left:calc(50% - 18px)' : 'left:calc(50% - 18px)'}`), ok(-1, `${sol};top:calc(50% - 18px)`));
          }
          tahta.append(kap);
        }
        T.append(tahta);
        const bos = st.t.filter((x) => !x).length;
        const enUzun = (p) => { let m = 0; for (const L of K.CIZGI) { let x = 0, y = 0; for (const i of L) { if (st.t[i] === p) x++; else if (st.t[i]) y++; } if (!y) m = Math.max(m, x); } return m; };
        api.mat(`<p>Şu an olası hamle: <b>${bos} boş yuva × 4 çeyrek × 2 yön = ${bos * 8}</b>. İlk hamlede bu sayı 36 × 8 = 288.</p>
          <p style="margin-top:6px">Açık (rakipçe kesilmemiş) en iyi dizi: siyah <b>${enUzun(1)}/5</b>, beyaz <b>${enUzun(2)}/5</b>. Tahtada 32 farklı beşli çizgi var.</p>
          <p style="margin-top:6px;color:var(--soluk)">Geoffrey Irving 2014'te 3 × 10¹⁵ konumu inceleyerek oyunu çözdü: kusursuz oynayan ilk oyuncu kazanır.</p>
          <code class="formul">dönme: (r, c) → (c, 2 − r)  ·  4 dönüş = başa dönüş</code>`);
      }
      return {
        yeni,
        geriAl() {
          if (!st.gecmis.length) return; st.gen++; st.bekle = false;
          let h = st.gecmis.pop(); if (api.ayar.rakip !== 'insan') while (h.sira !== 1 && st.gecmis.length) h = st.gecmis.pop();
          st.t = h.t; st.sira = h.sira; st.bitti = false; st.bekleyen = -1; st.son = -1; st.donen = null;
          api.geriAlAktif(st.gecmis.length > 0); api.neden(''); ciz(); durumYaz();
        },
        yokEt() { isci.iptal(); },
      };
    },
  });
})();
