'use strict';
/* REVERSİ / OTHELLO — 8×8, rakip taşları iki taşın arasına sıkıştırıp çevir.
   Yapay zeka: alfa-beta + konum ağırlıkları + hareketlilik; son 10 boşta kusursuz hesap. */
(() => {
  function kurallar() {
    const K = {}; const Y = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    K.cevrilen = (t, i, p) => { if (t[i]) return []; const r0 = i >> 3, c0 = i & 7, q = 3 - p, out = [];
      for (const [dr, dc] of Y) { let r = r0 + dr, c = c0 + dc; const ara = []; while (r >= 0 && r < 8 && c >= 0 && c < 8 && t[r * 8 + c] === q) { ara.push(r * 8 + c); r += dr; c += dc; } if (ara.length && r >= 0 && r < 8 && c >= 0 && c < 8 && t[r * 8 + c] === p) out.push(...ara); }
      return out; };
    K.yasal = (t, p) => { const l = []; for (let i = 0; i < 64; i++) if (!t[i] && K.cevrilen(t, i, p).length) l.push(i); return l; };
    K.oyna = (t, i, p) => { const a = t.slice(); const c = K.cevrilen(t, i, p); a[i] = p; for (const j of c) a[j] = p; return a; };
    K.AGIRLIK = [100, -20, 10, 5, 5, 10, -20, 100, -20, -50, -2, -2, -2, -2, -50, -20, 10, -2, 1, 1, 1, 1, -2, 10, 5, -2, 1, 0, 0, 1, -2, 5, 5, -2, 1, 0, 0, 1, -2, 5, 10, -2, 1, 1, 1, 1, -2, 10, -20, -50, -2, -2, -2, -2, -50, -20, 100, -20, 10, 5, 5, 10, -20, 100];
    return K;
  }
  function dusun(v) {
    const K = kurallar(); const { t, p, derin, gurultu } = v; let dugum = 0;
    const bos = t.filter((x) => !x).length; const tam = bos <= 9;
    function deger(a) {
      let s = 0, ta = 0, tb = 0;
      for (let i = 0; i < 64; i++) { if (a[i] === p) { s += K.AGIRLIK[i]; ta++; } else if (a[i]) { s -= K.AGIRLIK[i]; tb++; } }
      const ma = K.yasal(a, p).length, mb = K.yasal(a, 3 - p).length;
      return s + 8 * (ma - mb) + (ta + tb > 54 ? 2 * (ta - tb) : 0);
    }
    function sonuc(a) { let x = 0; for (const c of a) if (c === p) x++; else if (c) x--; return x * 1000; }
    function ara(a, sira, d, al, be, pas) {
      dugum++;
      const l = K.yasal(a, sira);
      if (!l.length) { if (pas) return sonuc(a); return ara(a, 3 - sira, d, al, be, true); }
      if (d === 0 && !tam) return deger(a);
      if (sira === p) { let en = -1e9; for (const i of l) { en = Math.max(en, ara(K.oyna(a, i, sira), 3 - sira, d - 1, al, be, false)); al = Math.max(al, en); if (al >= be) break; } return en; }
      let en = 1e9; for (const i of l) { en = Math.min(en, ara(K.oyna(a, i, sira), 3 - sira, d - 1, al, be, false)); be = Math.min(be, en); if (al >= be) break; } return en;
    }
    const l = K.yasal(t, p).sort((x, y) => K.AGIRLIK[y] - K.AGIRLIK[x]);
    let en = l[0], enX = -1e9;
    for (const i of l) { let x = ara(K.oyna(t, i, p), 3 - p, derin - 1, enX, 1e9, false) + (gurultu ? Math.random() * gurultu : 0); if (x > enX) { enX = x; en = i; } }
    return { m: en, puan: enX, dugum, tam };
  }
  const kaynak = kurallar.toString() + '\n' + dusun.toString();
  const K = kurallar();
  const kare = (i) => 'abcdefgh'[i & 7] + (8 - (i >> 3));

  Salon.kaydet('reversi', {
    baslik: 'Reversi', alt: 'Sıkıştır ve çevir.',
    ozet: 'Bir dakikada öğrenilir, bir ömür sürer. Köşelerin neden altın değerinde olduğunu ısı haritasında gör.',
    etiketler: ['Alfa-beta', 'Konum değeri', '2 kişi'],
    dallanmaRef: '≈ 10', dallanmaSayi: 10, oyunUzunlugu: 60,
    tur: [
      { baslik: 'Sıkıştır ve çevir', metin: 'Taşını, rakip taşları kendi iki taşının arasına sıkıştıracak bir kareye koy. Arada kalan bütün rakip taşlar senin rengine döner.' },
      { baslik: 'Noktalar yasal hamleler', metin: 'Tahtadaki küçük noktalar, şu an oynayabileceğin kareler. Birine dokun ya da ok tuşlarıyla gelip Enter\'a bas.', vurgu: '#tahta [aria-label$="oynanabilir"]' },
      { baslik: 'Köşeler altın değerinde', metin: '"Köşe değeri haritası"nı aç: köşe taşı hiç çevrilemez. Köşenin yanındaki kareler ise tehlikeli; rakibe köşeyi açabilir.' },
    ],
    kurallar: ['Siyah başlar. Taşını, arada kalan rakip taşları sıkıştıracak bir kareye koymalısın (yatay, dikey veya çapraz).', 'Sıkışan bütün rakip taşlar senin rengine döner.',
      'Yasal hamlen yoksa pas geçersin. İki oyuncunun da hamlesi kalmayınca en çok taşı olan kazanır.', 'Bilgisayara karşı sen siyahsın.'],
    onizleme: () => { let s = '<svg viewBox="0 0 80 80"><rect width="80" height="80" rx="4" fill="#2f7d55"/>'; for (let k = 1; k < 8; k++) s += `<path d="M${k * 10} 0V80M0 ${k * 10}H80" stroke="#1d5a3c" stroke-width=".6"/>`; [[27, 1], [28, 2], [35, 2], [36, 1], [19, 1], [44, 2], [26, 2]].forEach(([i, p]) => { s += `<circle cx="${(i % 8) * 10 + 5}" cy="${Math.floor(i / 8) * 10 + 5}" r="4" fill="${p === 1 ? '#1b1b1b' : '#f5f3ec'}"/>`; }); return s + '</svg>'; },
    olustur(api) {
      const { el, tr } = api;
      const isci = api.isciYap(kaynak);
      const DERIN = { kolay: 1, orta: 3, zor: 5 };
      let st, harita = false;
      if (!document.getElementById('reversiStil')) document.head.append(el('style', { id: 'reversiStil' }, '@keyframes cevir{0%{transform:rotateY(90deg)}100%{transform:rotateY(0)}}.cevrildi{animation:cevir .35s ease-out}'));
      function yeni() {
        const t = new Array(64).fill(0); t[27] = t[36] = 2; t[28] = t[35] = 1;
        st = { t, sira: 1, gecmis: [], hamleler: [], bitti: false, son: -1, yeniCevrilen: new Set(), gen: (st?.gen || 0) + 1, bekle: false, yukleniyor: false };
        api.konum('');
        api.geriAlAktif(false); ciz(); durumYaz();
      }
      const insanMi = (p) => api.ayar.rakip === 'insan' || p === 1;
      function say(t) { let a = 0, b = 0; for (const c of t) if (c === 1) a++; else if (c === 2) b++; return [a, b]; }
      function oyna(i) {
        const p = st.sira; if (!st.yukleniyor) api.dallanma(K.yasal(st.t, p).length);
        const c = K.cevrilen(st.t, i, p);
        st.hamleler.push(i); api.konum(st.hamleler.join('.'));
        api.duyur(`${p === 1 ? 'Siyah' : 'Beyaz'} ${kare(i)}; ${c.length} taş çevrildi.`);
        st.gecmis.push({ t: st.t.slice(), sira: p });
        st.t = K.oyna(st.t, i, p); st.son = i; st.yeniCevrilen = new Set(c);
        sirayiIlerlet();
      }
      function sirayiIlerlet() {
        const q = 3 - st.sira;
        if (K.yasal(st.t, q).length) st.sira = q;
        else if (K.yasal(st.t, st.sira).length) api.bildir(`${q === 1 ? 'Siyah' : 'Beyaz'} pas geçmek zorunda: yasal hamlesi yok.`);
        else {
          st.bitti = true; const [a, b] = say(st.t);
          const m = a === b ? `Berabere: ${a}–${b}` : api.ayar.rakip === 'insan' ? `${a > b ? 'Siyah' : 'Beyaz'} kazandı: ${Math.max(a, b)}–${Math.min(a, b)}` : a > b ? `Kazandın! ${a}–${b}` : `Bilgisayar kazandı: ${b}–${a}`;
          api.bitti(m, api.ayar.rakip !== 'insan' && b > a);
        }
        if (st.yukleniyor) return;
        api.geriAlAktif(st.gecmis.length > 0); ciz(); durumYaz();
        if (!st.bitti && !insanMi(st.sira)) bilgisayar();
      }
      function bilgisayar() {
        st.bekle = true; durumYaz(); const gen = st.gen, sv = api.ayar.seviye;
        const bas = Date.now();
        isci.sor({ t: st.t, p: st.sira, derin: DERIN[sv], gurultu: sv === 'kolay' ? 40 : 0 }).then((c) => {
          if (gen !== st.gen) return;
          setTimeout(() => {
            if (gen !== st.gen) return; st.bekle = false;
            const w = K.AGIRLIK[c.m];
            api.neden(c.tam ? `Tahtada ${st.t.filter((x) => !x).length} boş kare kaldı; oyunu sonuna kadar kusursuz hesapladım (${tr(c.dugum)} konum). <b>${kare(c.m)}</b> en iyi sonucu veriyor.`
              : `${DERIN[sv]} hamle derinliğinde ${tr(c.dugum)} konuma baktım. <b>${kare(c.m)}</b> karesinin konum değeri ${w > 0 ? '+' : ''}${w}${w >= 100 ? ': köşe, bir daha asla çevrilemez' : w <= -20 ? ': riskli ama hesaba göre buna değer' : ''}. Hareketlilik de hesaba katıldı: rakibin seçeneklerini azaltmak önemli.`);
            oyna(c.m);
          }, Math.max(0, 450 - (Date.now() - bas)));
        });
      }
      function durumYaz() {
        if (st.bitti) return api.durum('Oyun bitti.');
        if (st.bekle) return api.durum('Bilgisayar düşünüyor…', { dusunuyor: true });
        api.durum(`<span class="nokta" style="background:${st.sira === 1 ? '#1b1b1b' : '#f5f3ec'}"></span> Sıra: ${st.sira === 1 ? 'Siyah' : 'Beyaz'}`);
      }
      function ciz() {
        const T = api.tahta; T.innerHTML = '';
        const [a, b] = say(st.t);
        T.append(el('div', { class: 'ust-bilgi' }, el('span', {}, 'Siyah ', el('b', {}, String(a))), el('span', {}, 'Beyaz ', el('b', {}, String(b))),
          el('button', { type: 'button', class: 'cip', 'aria-pressed': String(harita), onclick: () => { harita = !harita; ciz(); } }, 'Köşe değeri haritası')));
        const yasal = new Set(!st.bitti && insanMi(st.sira) && !st.bekle ? K.yasal(st.t, st.sira) : []);
        const tahta = el('div', { role: 'grid', 'aria-label': 'Reversi tahtası', style: 'display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);gap:2px;padding:8px;background:#1d5a3c;border-radius:12px;width:min(100%,520px);aspect-ratio:1;box-sizing:border-box;box-shadow:var(--golge)' });
        for (let i = 0; i < 64; i++) {
          const w = K.AGIRLIK[i];
          let bg = '#2f7d55';
          if (harita) bg = w > 0 ? `color-mix(in srgb,#3ddc97 ${Math.min(90, 20 + w * 0.7)}%,#2f7d55)` : w < 0 ? `color-mix(in srgb,#ff5d6c ${Math.min(90, 20 - w * 1.4)}%,#2f7d55)` : '#2f7d55';
          const h = el('button', { type: 'button', role: 'gridcell', class: 'hucre-btn', 'data-r': i >> 3, 'data-c': i & 7, 'aria-label': `${kare(i)} ${st.t[i] === 1 ? 'siyah' : st.t[i] === 2 ? 'beyaz' : yasal.has(i) ? 'oynanabilir' : 'boş'}`,
            style: `background:${bg};border-radius:3px;display:grid;place-items:center;position:relative;min-width:0;${yasal.has(i) ? 'cursor:pointer' : 'cursor:default'}` });
          if (st.t[i]) h.append(el('i', { class: st.yeniCevrilen.has(i) ? 'cevrildi' : i === st.son ? 'otur' : '', style: `width:82%;height:82%;border-radius:50%;background:${st.t[i] === 1 ? 'radial-gradient(circle at 35% 30%,#555,#111)' : 'radial-gradient(circle at 35% 30%,#fff,#d8d4c8)'};box-shadow:0 2px 3px rgba(0,0,0,.4);${i === st.son ? 'outline:2px solid var(--sari);outline-offset:1px' : ''}` }));
          else if (yasal.has(i)) h.append(el('i', { style: `width:26%;height:26%;border-radius:50%;background:${st.sira === 1 ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.55)'}` }));
          if (harita) h.append(el('span', { style: 'position:absolute;bottom:1px;right:3px;font-size:9px;color:#fff;opacity:.85' }, String(w)));
          if (yasal.has(i)) {
            h.onclick = () => oyna(i);
            h.onmouseenter = () => matCiz(i); h.onmouseleave = () => matCiz(-1);
          }
          tahta.append(h);
        }
        T.append(tahta);
        matCiz(-1);
      }
      function matCiz(i) {
        const ma = K.yasal(st.t, 1).length, mb = K.yasal(st.t, 2).length;
        let m = `<p><b>Hareketlilik</b> (yasal hamle sayısı): siyah <b>${ma}</b>, beyaz <b>${mb}</b>. Usta oyuncular taş sayısından çok bunu izler: az seçeneği olan oyuncu kötü karelere zorlanır.</p>`;
        if (i >= 0) {
          const c = K.cevrilen(st.t, i, st.sira).length, w = K.AGIRLIK[i];
          m += `<p style="margin-top:6px"><b>${kare(i)}</b>: ${c} taş çevirir, konum değeri <b>${w}</b>. ${w >= 100 ? 'Köşe taşı hiçbir yönden sıkıştırılamaz: kalıcıdır.' : w <= -20 ? 'Köşeye komşu "X/C karesi": rakibe köşeyi açabilir.' : ''}</p>`;
        }
        m += `<p style="margin-top:6px;color:var(--soluk)">8 × 8 Reversi 2023'te bilgisayarla çözüldü: iki taraf da kusursuz oynarsa oyun <b>berabere</b> biter.</p><code class="formul">konum sayısı ≈ 10^28 · oyun ağacı ≈ 10^58</code>`;
        api.mat(m);
      }
      return {
        yeni,
        geriAl() {
          if (!st.gecmis.length) return; st.gen++; st.bekle = false;
          let h = st.gecmis.pop(); if (api.ayar.rakip !== 'insan') while (h.sira !== 1 && st.gecmis.length) h = st.gecmis.pop();
          st.t = h.t; st.sira = h.sira; st.bitti = false; st.son = -1; st.yeniCevrilen = new Set();
          st.hamleler = st.hamleler.slice(0, st.gecmis.length); api.konum(st.hamleler.join('.'));
          if (!insanMi(st.sira)) return yeni();
          api.geriAlAktif(st.gecmis.length > 0); api.neden(''); ciz(); durumYaz();
        },
        yukle(kod) { // "19.18.17" gibi kare numaraları; bilgisayar karşısındaysa sıra ona geçtiyse oynar
          st.yukleniyor = true;
          for (const x of kod.split('.').filter(Boolean)) { const i = +x; if (st.bitti || !K.yasal(st.t, st.sira).includes(i)) throw new Error('yasa dışı'); oyna(i); }
          st.yukleniyor = false; api.geriAlAktif(st.gecmis.length > 0); ciz(); durumYaz();
          if (!st.bitti && !insanMi(st.sira)) bilgisayar();
        },
        yokEt() { isci.iptal(); },
      };
    },
  });
})();
