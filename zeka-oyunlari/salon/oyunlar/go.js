'use strict';
/* GO 9×9 — taşları çevrele, alanı say. Kurallar: esir alma, intihar yasağı, basit ko, iki pas = bitiş,
   alan sayımı (taş + çevrilmiş boş alan), beyaza 6,5 komi.
   Yapay zeka: Monte Carlo + AMAF (bir hamlenin rastgele oyunların herhangi bir anında oynanmasından öğrenme). */
(() => {
  function kurallar() {
    const K = {}; const N = 9;
    K.N = N;
    K.KM = []; for (let i = 0; i < N * N; i++) { const r = Math.floor(i / N), c = i % N, l = []; if (r > 0) l.push(i - N); if (r < N - 1) l.push(i + N); if (c > 0) l.push(i - 1); if (c < N - 1) l.push(i + 1); K.KM.push(l); }
    K.grup = (t, i) => { const p = t[i], g = [i], gor = new Uint8Array(N * N); gor[i] = 1; let ozg = 0; const og = new Uint8Array(N * N);
      for (let k = 0; k < g.length; k++) for (const j of K.KM[g[k]]) { if (t[j] === p && !gor[j]) { gor[j] = 1; g.push(j); } else if (!t[j] && !og[j]) { og[j] = 1; ozg++; } }
      return { g, ozg }; };
    // hamle uygula: null → yasa dışı. {t, esir}
    K.oyna = (t0, i, p, yasakKo) => {
      if (t0[i] || i === yasakKo) return null;
      const t = t0.slice(); t[i] = p; let esir = 0; const q = 3 - p;
      for (const j of K.KM[i]) if (t[j] === q) { const G = K.grup(t, j); if (G.ozg === 0) { for (const x of G.g) t[x] = 0; esir += G.g.length; } }
      if (K.grup(t, i).ozg === 0) return null; // intihar
      return { t, esir };
    };
    K.goz = (t, i, p) => { for (const j of K.KM[i]) if (t[j] !== p) return false; return true; };
    K.alan = (t) => { // alan sayımı
      const s = [0, 0, 0], gor = new Uint8Array(N * N), sahip = new Int8Array(N * N);
      for (let i = 0; i < N * N; i++) { if (t[i]) { s[t[i]]++; sahip[i] = t[i]; continue; } if (gor[i]) continue;
        const bolge = [i]; gor[i] = 1; let siyah = false, beyaz = false;
        for (let k = 0; k < bolge.length; k++) for (const j of K.KM[bolge[k]]) { if (!t[j] && !gor[j]) { gor[j] = 1; bolge.push(j); } else if (t[j] === 1) siyah = true; else if (t[j] === 2) beyaz = true; }
        const o = siyah && !beyaz ? 1 : beyaz && !siyah ? 2 : 0; if (o) s[o] += bolge.length; for (const x of bolge) sahip[x] = o; }
      return { siyah: s[1], beyaz: s[2], sahip };
    };
    K.KOMI = 6.5;
    return K;
  }
  function dusun(v) {
    const K = kurallar(); const { t, p, sure, yasakKo } = v; const NN = 81;
    // açılışta birinci sıra (kenar) hamleleri neredeyse hiç iyi değildir; aramayı daraltır
    const tasSay = t.filter(Boolean).length;
    const kenar = (i) => { const r = Math.floor(i / 9), c = i % 9; return r === 0 || c === 0 || r === 8 || c === 8; };
    let adaylar = []; for (let i = 0; i < NN; i++) if (!t[i] && !K.goz(t, i, p) && K.oyna(t, i, p, yasakKo)) adaylar.push(i);
    if (tasSay < 14 && adaylar.some((i) => !kenar(i))) adaylar = adaylar.filter((i) => !kenar(i));
    if (!adaylar.length) return { m: -1, oran: 0, oyun: 0 };
    const N = new Float64Array(NN), W = new Float64Array(NN), AN = new Float64Array(NN), AW = new Float64Array(NN);
    const bitis = Date.now() + sure; let toplam = 0;
    // hızlı rastgele oyun: yerinde değişen dizi, damgalı taşma doldurma
    const KM = K.KM, damga = new Int32Array(NN), yigin = new Int16Array(NN), grupT = new Int16Array(NN); let dmg = 1;
    function nefesVar(t, i) { // i'nin grubunun en az bir özgürlüğü var mı? grubu grupT'ye yazar
      const p = t[i]; dmg++; let u = 0, g = 0; yigin[u++] = i; damga[i] = dmg;
      while (u) { const x = yigin[--u]; grupT[g++] = x; for (const j of KM[x]) { if (damga[j] === dmg) continue; if (!t[j]) return -1; if (t[j] === p) { damga[j] = dmg; yigin[u++] = j; } } }
      return g;
    }
    function hizliOyna(t, i, p) { // başarılıysa true; t yerinde değişir
      t[i] = p; const q = 3 - p; let aldi = false;
      for (const j of KM[i]) if (t[j] === q) { const g = nefesVar(t, j); if (g > 0) { for (let k = 0; k < g; k++) t[grupT[k]] = 0; aldi = true; } }
      if (!aldi && nefesVar(t, i) > 0) { t[i] = 0; return false; }
      return true;
    }
    const bosl = new Int16Array(NN);
    function oyunSonu(t0, sira) {
      const t = Int8Array.from(t0); let pas = 0; const oynananP = new Uint8Array(NN);
      for (let h = 0; h < 110 && pas < 2; h++) {
        let n = 0; for (let i = 0; i < NN; i++) if (!t[i]) bosl[n++] = i;
        let oldu = false;
        while (n) {
          const k = (Math.random() * n) | 0, i = bosl[k]; bosl[k] = bosl[--n];
          let goz = true; for (const j of KM[i]) if (t[j] !== sira) { goz = false; break; }
          if (goz) continue;
          if (hizliOyna(t, i, sira)) { if (sira === p) oynananP[i] = 1; oldu = true; break; }
        }
        pas = oldu ? 0 : pas + 1; sira = 3 - sira;
      }
      const a = K.alan(t); const fark = a.siyah - a.beyaz - K.KOMI;
      return { kazandi: p === 1 ? fark > 0 : fark < 0, oynananP };
    }
    while (Date.now() < bitis || toplam < adaylar.length * 3) {
      let en = -1, enD = -1; const lt = Math.log(toplam + 1);
      for (const m of adaylar) {
        if (N[m] === 0) { en = m; break; }
        const b = Math.sqrt(500 / (3 * N[m] + 500)); const mc = W[m] / N[m], am = AN[m] ? AW[m] / AN[m] : mc;
        const d = (1 - b) * mc + b * am + 0.4 * Math.sqrt(lt / N[m]); if (d > enD) { enD = d; en = m; }
      }
      const r = K.oyna(t, en, p, yasakKo); const s = oyunSonu(r.t, 3 - p);
      N[en]++; if (s.kazandi) W[en]++; toplam++;
      for (const m of adaylar) if (s.oynananP[m]) { AN[m]++; if (s.kazandi) AW[m]++; }
    }
    let en = adaylar[0]; for (const m of adaylar) if (N[m] > N[en]) en = m;
    return { m: en, oran: W[en] / N[en], oyun: toplam };
  }
  const kaynak = kurallar.toString() + '\n' + dusun.toString();
  const K = kurallar(); const N = 9;
  const ad = (i) => 'ABCDEFGHJ'[i % N] + (N - Math.floor(i / N));

  Salon.kaydet('go', {
    baslik: 'Go', alt: '9×9 tahtada alan savaşı.',
    ozet: 'Kuralları beş cümle, kombinasyonları evrendeki atomlardan fazla. Grupların nefesini say.',
    etiketler: ['Monte Carlo + AMAF', 'Kombinatorik', '2 kişi'],
    dallanmaRef: '≈ 40 (9×9) · 250 (19×19)', dallanmaSayi: 40, oyunUzunlugu: 60,
    tur: [
      { baslik: 'Kesişimlere taş koy', metin: 'Taşlar karelerin içine değil, çizgilerin kesiştiği noktalara konur ve bir daha hareket etmez. Sen siyahsın, ilk hamle senin.', vurgu: '#tahta svg' },
      { baslik: 'Nefes say', metin: 'Bir taşın üzerine gel: grubunun boş komşu noktaları (özgürlükleri) sarı yanar. Son nefesi kapanan grup tahtadan alınır.' },
      { baslik: 'Alanı çevrele', metin: 'Amaç alan kazanmak. İki taraf art arda pas geçince sayılır: taşların + yalnız senin taşlarınla çevrili boş noktalar. "Alan tahmini" düğmesi şu anki durumu gösterir.' },
    ],
    kurallar: ['Siyah başlar; oyuncular sırayla kesişimlere taş koyar. Taşlar hareket etmez.', 'Bir grubun boş komşu noktalarına "özgürlük" (nefes) denir. Son özgürlüğü kapanan grup tahtadan alınır.',
      'Kendi grubunu özgürlüksüz bırakan hamle yasaktır, rakibi yakalamıyorsa.', 'Ko: tahtayı bir önceki konuma geri döndüren hamle hemen yapılamaz.',
      'İki oyuncu art arda pas geçince oyun biter. Puan = taşların + yalnızca senin taşlarınla çevrili boş noktalar. Beyaz, ikinci oynadığı için 6,5 puan "komi" alır.'],
    onizleme: () => { let s = '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="6" fill="#d9b26f"/>'; for (let k = 0; k < 9; k++) s += `<path d="M${10 + k * 10} 10V90M10 ${10 + k * 10}H90" stroke="#5a4320" stroke-width=".7"/>`; [[2, 2, 1], [3, 2, 2], [2, 3, 1], [6, 6, 2], [5, 6, 1], [6, 5, 2], [4, 4, 1], [3, 3, 2], [6, 2, 1]].forEach(([c, r, p]) => { s += `<circle cx="${10 + c * 10}" cy="${10 + r * 10}" r="4.4" fill="${p === 1 ? '#151515' : '#f6f4ee'}"/>`; }); return s + '</svg>'; },
    olustur(api) {
      const { el, svg, tr } = api;
      const isci = api.isciYap(kaynak);
      const SURE = { kolay: 400, orta: 1300, zor: 3200 };
      let st, uzerinde = -1, alanGoster = false;
      function yeni() { st = { t: new Array(81).fill(0), sira: 1, gecmis: [], hamleler: [], esir: [0, 0, 0], pas: 0, bitti: false, son: -1, gen: (st?.gen || 0) + 1, bekle: false, yukleniyor: false }; api.konum(''); api.geriAlAktif(false); ciz(); durumYaz(); }
      const insanMi = (p) => api.ayar.rakip === 'insan' || p === 1;
      const koYasak = () => { // önceki konuma dönen tek nokta
        if (!st.gecmis.length) return -1; const once = st.gecmis[st.gecmis.length - 1].t;
        for (let i = 0; i < 81; i++) if (!st.t[i] && once[i] === st.sira) { const r = K.oyna(st.t, i, st.sira, -1); if (r && r.t.every((x, j) => x === once[j])) return i; }
        return -1;
      };
      function yasalSay() { const ko = koYasak(); let n = 1; for (let i = 0; i < 81; i++) if (K.oyna(st.t, i, st.sira, ko)) n++; return n; }
      function oyna(i) {
        if (st.bitti) return;
        if (!st.yukleniyor) api.dallanma(yasalSay());
        const p = st.sira;
        if (i < 0) {
          st.gecmis.push({ t: st.t.slice(), sira: p, esir: st.esir.slice(), pas: st.pas });
          st.pas++; if (!st.yukleniyor) api.bildir(`${p === 1 ? 'Siyah' : 'Beyaz'} pas geçti.`);
          st.hamleler.push('p'); api.konum(st.hamleler.join('.')); api.duyur(`${p === 1 ? 'Siyah' : 'Beyaz'} pas geçti.`);
          if (st.pas >= 2) return bitir();
        } else {
          const r = K.oyna(st.t, i, p, koYasak());
          if (!r) { if (st.yukleniyor) throw new Error('yasa dışı'); api.bildir(st.t[i] ? 'Bu nokta dolu.' : i === koYasak() ? 'Ko kuralı: bu hamle hemen yapılamaz, önce başka yere oyna.' : 'İntihar hamlesi: grubun nefessiz kalır.'); return; }
          st.gecmis.push({ t: st.t.slice(), sira: p, esir: st.esir.slice(), pas: st.pas });
          st.t = r.t; st.esir[p] += r.esir; st.pas = 0; st.son = i;
          if (r.esir && !st.yukleniyor) api.bildir(`${r.esir} taş esir alındı.`);
          st.hamleler.push(i); api.konum(st.hamleler.join('.')); api.duyur(`${p === 1 ? 'Siyah' : 'Beyaz'} ${ad(i)}${r.esir ? `, ${r.esir} taş esir` : ''}.`);
        }
        st.sira = 3 - p;
        if (st.yukleniyor) return;
        api.geriAlAktif(st.gecmis.length > 0); ciz(); durumYaz();
        if (!st.bitti && !insanMi(st.sira)) bilgisayar();
      }
      function bitir() {
        st.bitti = true; alanGoster = true;
        const a = K.alan(st.t); const B = a.beyaz + K.KOMI;
        const m = a.siyah > B ? 'Siyah' : 'Beyaz';
        api.bitti(`${api.ayar.rakip === 'insan' ? m + ' kazandı' : m === 'Siyah' ? 'Kazandın' : 'Bilgisayar kazandı'}: siyah ${a.siyah}, beyaz ${a.beyaz} + 6,5 = ${tr(B, 1)}`, api.ayar.rakip !== 'insan' && m === 'Beyaz');
        api.geriAlAktif(true); ciz(); durumYaz();
      }
      function bilgisayar() {
        // rakip pas geçtiyse ve sayım bilgisayardan yanaysa o da pas geçer
        const a = K.alan(st.t);
        if (st.pas === 1 && (st.sira === 2 ? a.beyaz + K.KOMI > a.siyah : a.siyah > a.beyaz + K.KOMI)) { api.neden('Sen pas geçtin ve şu anki sayım benden yana. Ben de pas geçiyorum; oyun bitti.'); return oyna(-1); }
        st.bekle = true; durumYaz(); const gen = st.gen;
        isci.sor({ t: st.t, p: st.sira, sure: SURE[api.ayar.seviye], yasakKo: koYasak() }).then((c) => {
          if (gen !== st.gen) return; st.bekle = false;
          if (c.m < 0 || c.oran < 0.04) { api.neden(c.m < 0 ? 'Kendi gözlerimi doldurmadan oynayabileceğim bir yer kalmadı; pas.' : `Hiçbir hamle %4'ten fazla kazandırmıyor: pas geçiyorum.`); return oyna(-1); }
          api.neden(`${tr(c.oyun)} rastgele oyunu sona kadar oynayıp alanı saydım. <b>${ad(c.m)}</b> ile başlayanları %${tr(c.oran * 100, 0)} kazandım. Ayrıca her hamlenin, bu oyunların herhangi bir anında oynandığındaki sonucunu da hesaba kattım (AMAF).`);
          oyna(c.m);
        });
      }
      function durumYaz() {
        if (st.bitti) return api.durum('Oyun bitti. Alan haritası tahtada.');
        if (st.bekle) return api.durum('Bilgisayar düşünüyor…', { dusunuyor: true });
        api.durum(`<span class="nokta" style="background:${st.sira === 1 ? '#151515' : '#f6f4ee'}"></span> Sıra: ${st.sira === 1 ? 'Siyah' : 'Beyaz'}`);
      }
      function ciz() {
        const T = api.tahta; T.innerHTML = '';
        T.append(el('div', { class: 'ust-bilgi' }, el('span', {}, 'Siyahın esiri ', el('b', {}, String(st.esir[1]))), el('span', {}, 'Beyazın esiri ', el('b', {}, String(st.esir[2]))),
          el('button', { type: 'button', class: 'cip', 'aria-pressed': String(alanGoster), onclick: () => { alanGoster = !alanGoster; ciz(); } }, 'Alan tahmini')));
        const A = 40, P = 28, S = P * 2 + A * 8;
        const s = svg('svg', { viewBox: `0 0 ${S} ${S}`, style: 'width:100%;max-width:540px;border-radius:12px;background:#d9b26f;box-shadow:var(--golge);touch-action:manipulation', role: 'img', 'aria-label': 'Go tahtası' });
        for (let k = 0; k < 9; k++) {
          s.append(svg('line', { x1: P, y1: P + k * A, x2: P + 8 * A, y2: P + k * A, stroke: '#5a4320', 'stroke-width': 1.2 }));
          s.append(svg('line', { x1: P + k * A, y1: P, x2: P + k * A, y2: P + 8 * A, stroke: '#5a4320', 'stroke-width': 1.2 }));
          const yz = svg('text', { x: P + k * A, y: S - 6, 'text-anchor': 'middle', 'font-size': 11, fill: '#5a4320' }); yz.textContent = 'ABCDEFGHJ'[k]; s.append(yz);
          const sy = svg('text', { x: 9, y: P + k * A + 4, 'text-anchor': 'middle', 'font-size': 11, fill: '#5a4320' }); sy.textContent = 9 - k; s.append(sy);
        }
        for (const i of [20, 24, 40, 56, 60]) s.append(svg('circle', { cx: P + (i % 9) * A, cy: P + Math.floor(i / 9) * A, r: 3.5, fill: '#5a4320' }));
        const alan = K.alan(st.t);
        const grup = uzerinde >= 0 && st.t[uzerinde] ? K.grup(st.t, uzerinde) : null; const grupSet = new Set(grup ? grup.g : []);
        for (let i = 0; i < 81; i++) {
          const x = P + (i % 9) * A, y = P + Math.floor(i / 9) * A;
          if (st.t[i]) {
            s.append(svg('circle', { cx: x + 1.5, cy: y + 2, r: A * 0.46, fill: 'rgba(0,0,0,.25)' }));
            s.append(svg('circle', { class: i === st.son ? 'otur' : '', cx: x, cy: y, r: A * 0.46, fill: st.t[i] === 1 ? '#151515' : '#f6f4ee', stroke: grupSet.has(i) ? '#e3b21b' : st.t[i] === 1 ? '#000' : '#bbb', 'stroke-width': grupSet.has(i) ? 3 : 1 }));
            if (i === st.son) s.append(svg('circle', { cx: x, cy: y, r: 6, fill: 'none', stroke: st.t[i] === 1 ? '#fff' : '#000', 'stroke-width': 2 }));
          } else if (alanGoster && alan.sahip[i]) s.append(svg('rect', { x: x - 7, y: y - 7, width: 14, height: 14, fill: alan.sahip[i] === 1 ? '#151515' : '#f6f4ee', opacity: 0.75 }));
          const hedef = svg('rect', { x: x - A / 2, y: y - A / 2, width: A, height: A, fill: 'transparent', style: 'cursor:pointer', 'data-r': Math.floor(i / 9), 'data-c': i % 9, role: 'button', 'aria-label': `${ad(i)}: ${st.t[i] === 1 ? 'siyah' : st.t[i] === 2 ? 'beyaz' : 'boş'}` });
          hedef.addEventListener('click', () => { if (!st.bekle && insanMi(st.sira) && !st.bitti) oyna(i); });
          hedef.addEventListener('mouseenter', () => { uzerinde = i; matCiz(); if (st.t[i]) ciz(); });
          s.append(hedef);
        }
        if (grup) for (const i of grup.g) for (const j of K.KM[i]) if (!st.t[j]) s.append(svg('circle', { cx: P + (j % 9) * A, cy: P + Math.floor(j / 9) * A, r: 6, fill: '#e3b21b', 'pointer-events': 'none' }));
        s.addEventListener('mouseleave', () => { uzerinde = -1; ciz(); });
        T.append(s);
        T.append(el('div', { class: 'dugmeler' }, el('button', { type: 'button', class: 'dug', disabled: st.bitti || st.bekle || !insanMi(st.sira), onclick: () => oyna(-1) }, 'Pas geç')));
        matCiz();
      }
      function matCiz() {
        const a = K.alan(st.t);
        let g = '<p>Bir taşın üzerine gel: grubu ve <b>özgürlükleri</b> (sarı noktalar) görünür.</p>';
        if (uzerinde >= 0 && st.t[uzerinde]) { const G = K.grup(st.t, uzerinde); g = `<p>Bu grup: <b>${G.g.length}</b> taş, <b>${G.ozg}</b> özgürlük. ${G.ozg === 1 ? '<b>Atari!</b> Tek nefesi kaldı, bir hamlede alınabilir.' : G.ozg === 2 ? 'İki nefesi var; dikkat.' : ''}</p>`; }
        api.mat(`${g}<p style="margin-top:6px">Şu anki alan sayımı: siyah <b>${a.siyah}</b>, beyaz <b>${a.beyaz}</b> + 6,5 komi = <b>${tr(a.beyaz + K.KOMI, 1)}</b>.</p>
          <p style="margin-top:6px;color:var(--soluk)">John Tromp'un hesabına göre 9×9 tahtada yaklaşık 1,04 × 10³⁸, 19×19'da 2,08 × 10¹⁷⁰ yasal konum var.</p>
          <code class="formul">her kesişim: boş, siyah ya da beyaz → üst sınır 3^81 ≈ 4,4 × 10³⁸</code>`);
      }
      return {
        yeni,
        geriAl() {
          if (!st.gecmis.length) return; st.gen++; st.bekle = false;
          let h = st.gecmis.pop(); if (api.ayar.rakip !== 'insan') while (h.sira !== 1 && st.gecmis.length) h = st.gecmis.pop();
          Object.assign(st, { t: h.t, sira: h.sira, esir: h.esir, pas: h.pas, bitti: false, son: -1 }); alanGoster = false;
          st.hamleler = st.hamleler.slice(0, st.gecmis.length); api.konum(st.hamleler.join('.'));
          api.geriAlAktif(st.gecmis.length > 0); api.neden(''); ciz(); durumYaz();
        },
        yukle(kod) {
          st.yukleniyor = true;
          for (const x of kod.split('.').filter(Boolean)) { if (st.bitti) break; oyna(x === 'p' ? -1 : +x); }
          st.yukleniyor = false; api.geriAlAktif(st.gecmis.length > 0); ciz(); durumYaz();
          if (!st.bitti && !insanMi(st.sira)) bilgisayar();
        },
        yokEt() { isci.iptal(); },
      };
    },
  });
})();
