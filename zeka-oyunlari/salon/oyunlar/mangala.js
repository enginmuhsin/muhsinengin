'use strict';
/* MANGALA — Türk zeka ve strateji oyunu (MEB turnuva kuralları).
   Dizilim: 0–5 senin kuyuların, 6 senin hazinen, 7–12 rakibin kuyuları, 13 rakibin hazinesi.
   Taşlar saat yönünün tersine dağılır; rakibin hazinesi atlanır → 13'lük bir saat aritmetiği. */
(() => {
  function kurallar() {
    const K = {};
    K.hazine = (p) => (p === 0 ? 6 : 13);
    K.kendi = (p, i) => (p === 0 ? i >= 0 && i <= 5 : i >= 7 && i <= 12);
    K.sonraki = (p, i) => { i = (i + 1) % 14; if (i === K.hazine(1 - p)) i = (i + 1) % 14; return i; };
    K.yasal = (a, p) => { const l = []; for (let k = 0; k < 6; k++) { const i = p === 0 ? k : 7 + k; if (a[i] > 0) l.push(i); } return l; };
    // hamle: yeni dizi, sıradaki oyuncu, olaylar
    K.oyna = (a0, p, i) => {
      const a = a0.slice(); const yol = []; let n = a[i]; a[i] = 0; let pos;
      if (n === 1) { pos = K.sonraki(p, i); a[pos]++; yol.push(pos); }
      else { a[i] = 1; yol.push(i); n--; pos = i; while (n > 0) { pos = K.sonraki(p, pos); a[pos]++; yol.push(pos); n--; } }
      let sira = 1 - p, olay = '';
      if (pos === K.hazine(p)) { sira = p; olay = 'tekrar'; }
      else if (!K.kendi(p, pos) && pos !== K.hazine(1 - p) && a[pos] % 2 === 0) { a[K.hazine(p)] += a[pos]; olay = 'cift:' + a[pos]; a[pos] = 0; }
      else if (K.kendi(p, pos) && a[pos] === 1 && a[12 - pos] > 0) { const t = a[pos] + a[12 - pos]; a[K.hazine(p)] += t; olay = 'bos:' + t; a[pos] = 0; a[12 - pos] = 0; }
      // bitiş: kuyuları boşalan oyuncu rakibin kuyularındaki taşları alır
      let bitti = false;
      for (const q of [0, 1]) {
        let s = 0; for (let k = 0; k < 6; k++) s += a[q === 0 ? k : 7 + k];
        if (s === 0) { let r = 0; for (let k = 0; k < 6; k++) { const j = q === 0 ? 7 + k : k; r += a[j]; a[j] = 0; } a[K.hazine(q)] += r; bitti = true; break; }
      }
      return { a, sira, olay, yol, bitti, son: pos };
    };
    return K;
  }
  function dusun(v) {
    const K = kurallar(); const { a, p, derin, rastgele } = v; let dugum = 0;
    function deger(a) { return (a[K.hazine(p)] - a[K.hazine(1 - p)]); }
    function ara(a, sira, d, al, be) {
      dugum++;
      const l = K.yasal(a, sira);
      if (d === 0 || l.length === 0) return deger(a);
      if (sira === p) { let en = -1e9; for (const i of l) { const s = K.oyna(a, sira, i); const x = s.bitti ? deger(s.a) * 100 : ara(s.a, s.sira, d - 1, al, be); if (x > en) en = x; if (en > al) al = en; if (al >= be) break; } return en; }
      let en = 1e9; for (const i of l) { const s = K.oyna(a, sira, i); const x = s.bitti ? deger(s.a) * 100 : ara(s.a, s.sira, d - 1, al, be); if (x < en) en = x; if (en < be) be = en; if (al >= be) break; } return en;
    }
    const l = K.yasal(a, p); let en = l[0], enX = -1e9; const puan = {};
    for (const i of l) { const s = K.oyna(a, p, i); let x = s.bitti ? deger(s.a) * 100 : ara(s.a, s.sira, derin - 1, -1e9, 1e9); if (rastgele) x += Math.random() * rastgele; puan[i] = x; if (x > enX) { enX = x; en = i; } }
    return { m: en, puan, dugum };
  }
  const kaynak = kurallar.toString() + '\n' + dusun.toString();
  const K = kurallar();

  Salon.kaydet('mangala', {
    baslik: 'Mangala', alt: '12 kuyu, 2 hazine, 48 taş.',
    ozet: 'Taşı bırakmadan önce nereye düşeceğini gör: 13\'lük saat aritmetiği tahtanın üstünde.',
    etiketler: ['Minimax + alfa-beta', 'Modüler aritmetik', '2 kişi'],
    dallanmaRef: '≈ 4–5', dallanmaSayi: 4.5, oyunUzunlugu: 40,
    kurallar: ['Her kuyuda 4 taş ile başlanır. Sen alttaki sıradasın; hazinen sağda.',
      'Kendi kuyundan tüm taşları al; ilkini aynı kuyuya bırak, kalanları saat yönünün tersine birer birer dağıt. Kuyuda tek taş varsa yan kuyuya geçer.',
      'Son taş kendi hazinene düşerse bir tur daha oynarsın.', 'Son taş rakip kuyuyu çift sayıya tamamlarsa o kuyudaki taşların hepsi senin.',
      'Son taş kendi boş kuyuna düşer ve karşıdaki rakip kuyuda taş varsa, ikisini birden hazinene alırsın.',
      'Kuyuları ilk boşalan oyuncu, rakibin kuyularındaki taşları da alır. Hazinesinde çok taş olan kazanır.'],
    onizleme: () => { let s = '<svg viewBox="0 0 180 90"><rect x="2" y="8" width="176" height="74" rx="16" fill="#c99a63"/>'; s += '<rect x="9" y="18" width="18" height="54" rx="9" fill="#a8773f"/><rect x="153" y="18" width="18" height="54" rx="9" fill="#a8773f"/>'; for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const x = 40 + c * 20, y = 32 + r * 26; s += `<circle cx="${x}" cy="${y}" r="8.5" fill="#a8773f"/>`; for (let k = 0; k < 4; k++) s += `<circle cx="${x - 3 + (k % 2) * 6}" cy="${y - 3 + Math.floor(k / 2) * 6}" r="2.4" fill="${['#e7e2d6', '#7c8ea3', '#d8c27a', '#9f6a55'][(k + c) % 4]}"/>`; } return s + '</svg>'; },
    olustur(api) {
      const { el, tr } = api;
      const isci = api.isciYap(kaynak);
      const DERIN = { kolay: 1, orta: 5, zor: 9 };
      let st, anim = null, onizle = -1;
      function yeni() {
        clearTimeout(anim);
        st = { a: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0], sira: 0, gecmis: [], bitti: false, gen: (st?.gen || 0) + 1, bekle: false, gosterim: null, son: -1 };
        api.geriAlAktif(false); ciz(); durumYaz();
      }
      const insanMi = (p) => api.ayar.rakip === 'insan' || p === 0;
      function olayMetni(o, p) {
        if (o === 'tekrar') return 'Son taş hazineye düştü: bir tur daha!';
        if (o.startsWith('cift:')) return `Çift sayı: ${o.slice(5)} taş ${p === 0 ? (api.ayar.rakip === 'insan' ? 'alt oyuncunun' : 'senin') : 'üst oyuncunun'} hazinesine.`;
        if (o.startsWith('bos:')) return `Boş kuyu yakalaması: ${o.slice(4)} taş hazineye.`;
        return '';
      }
      function oyna(i) {
        if (st.bitti || st.bekle) return;
        const p = st.sira; api.dallanma(K.yasal(st.a, p).length);
        const s = K.oyna(st.a, p, i);
        st.gecmis.push({ a: st.a.slice(), sira: p });
        // dağıtma animasyonu: taşlar birer birer düşer
        const goster = st.a.slice(); goster[i] = 0; st.gosterim = goster; st.bekle = true; onizle = -1;
        let k = 0; const adim = () => {
          if (k < s.yol.length) { goster[s.yol[k]]++; st.son = s.yol[k]; k++; ciz(); anim = setTimeout(adim, s.yol.length > 12 ? 90 : 160); return; }
          st.a = s.a; st.sira = s.sira; st.gosterim = null; st.bekle = false;
          const m = olayMetni(s.olay, p); if (m) api.bildir(m);
          if (s.bitti) {
            st.bitti = true; const A = st.a[6], B = st.a[13];
            const metin = A === B ? `Berabere: ${A}–${B}` : api.ayar.rakip === 'insan' ? `${A > B ? 'Alt' : 'Üst'} oyuncu kazandı: ${Math.max(A, B)}–${Math.min(A, B)}` : A > B ? `Kazandın! ${A}–${B}` : `Bilgisayar kazandı: ${B}–${A}`;
            api.bitti(metin, api.ayar.rakip !== 'insan' && B > A);
          }
          api.geriAlAktif(st.gecmis.length > 0);
          ciz(); durumYaz();
          if (!st.bitti && !insanMi(st.sira)) bilgisayar();
        };
        adim();
      }
      function bilgisayar() {
        st.bekle = true; durumYaz(); const gen = st.gen;
        const sv = api.ayar.seviye;
        isci.sor({ a: st.a, p: 1, derin: DERIN[sv], rastgele: sv === 'kolay' ? 6 : 0 }).then((c) => {
          if (gen !== st.gen) return;
          setTimeout(() => {
            if (gen !== st.gen) return;
            st.bekle = false;
            const sirali = Object.entries(c.puan).sort((x, y) => y[1] - x[1]);
            api.neden(`${DERIN[sv]} hamle ileriye kadar ${tr(c.dugum)} konuma baktım (minimax). ${sirali.length > 1 ? `Seçtiğim kuyunun puanı <b>${tr(sirali[0][1], 0)}</b>, ikinci en iyisi ${tr(sirali[1][1], 0)}.` : 'Tek seçeneğim vardı.'} Puan = benim hazinem − senin hazinen, en kötü senaryoya göre.`);
            oyna(c.m);
          }, 350);
        });
      }
      function durumYaz() {
        if (st.bitti) return api.durum('Oyun bitti.');
        if (st.bekle && !insanMi(st.sira) && !st.gosterim) return api.durum('Bilgisayar düşünüyor…', { dusunuyor: true });
        api.durum(`Sıra: <b>${st.sira === 0 ? (api.ayar.rakip === 'insan' ? 'Alt oyuncu' : 'Sen') : (api.ayar.rakip === 'insan' ? 'Üst oyuncu' : 'Bilgisayar')}</b>`);
      }
      const TASRENK = ['#e9e4d8', '#7d90a6', '#d9c27a', '#a0705b', '#8bb08a'];
      function kuyu(i, buyuk) {
        const a = st.gosterim || st.a, n = a[i];
        const tiklanir = !buyuk && !st.bitti && !st.bekle && insanMi(st.sira) && K.kendi(st.sira, i) && n > 0;
        const tas = el('div', { style: `position:absolute;inset:14% 14% ${buyuk ? '22%' : '26%'};display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:2px;pointer-events:none` });
        for (let k = 0; k < Math.min(n, buyuk ? 30 : 14); k++) tas.append(el('i', { style: `width:${buyuk ? 9 : 10}px;height:${buyuk ? 9 : 10}px;border-radius:50%;background:${TASRENK[(k * 7 + i) % 5]};box-shadow:inset 0 -2px 0 rgba(0,0,0,.25)` }));
        const vurgu = i === onizle ? 'outline:3px solid var(--sari);' : i === st.son ? 'outline:2px solid #fff;' : '';
        const b = el(tiklanir ? 'button' : 'div', {
          type: tiklanir ? 'button' : null, class: 'hucre-btn', 'aria-label': `${buyuk ? 'Hazine' : 'Kuyu'}: ${n} taş`,
          style: `position:relative;border-radius:${buyuk ? '40px' : '50%'};background:var(--ahsap2);box-shadow:inset 0 4px 10px rgba(0,0,0,.35);${buyuk ? 'grid-row:1/3;height:100%' : 'aspect-ratio:1'};${vurgu}${tiklanir ? 'cursor:pointer' : ''}`,
        }, tas, el('span', { class: 'num', style: 'position:absolute;bottom:4px;left:0;right:0;text-align:center;font-family:var(--f-sayi);font-size:13px;color:#fff;text-shadow:0 1px 2px #000' }, String(n)));
        if (tiklanir) {
          b.onclick = () => oyna(i);
          b.onmouseenter = b.onfocus = () => { onizle = K.oyna(st.a, st.sira, i).son; matCiz(i); kuyuVurgu(); };
          b.onmouseleave = b.onblur = () => { onizle = -1; matCiz(-1); kuyuVurgu(); };
        }
        b.dataset.i = i; return b;
      }
      function kuyuVurgu() { api.tahta.querySelectorAll('[data-i]').forEach((d) => { d.style.outline = +d.dataset.i === onizle ? '3px solid var(--sari)' : ''; }); }
      function ciz() {
        const T = api.tahta; T.innerHTML = '';
        const ustAd = api.ayar.rakip === 'insan' ? 'Üst oyuncu' : 'Bilgisayar', altAd = api.ayar.rakip === 'insan' ? 'Alt oyuncu' : 'Sen';
        T.append(el('div', { class: 'ust-bilgi' }, el('span', {}, `${ustAd} `, el('b', {}, String((st.gosterim || st.a)[13]))), el('span', {}, `${altAd} `, el('b', {}, String((st.gosterim || st.a)[6])))));
        const tahta = el('div', { style: 'display:grid;grid-template-columns:1fr repeat(6,1.1fr) 1fr;grid-template-rows:auto auto;gap:clamp(4px,1.2vw,10px);width:100%;max-width:640px;padding:clamp(10px,2vw,18px);border-radius:28px;background:linear-gradient(180deg,var(--ahsap),var(--ahsap2));box-shadow:var(--golge),inset 0 2px 0 rgba(255,255,255,.25);box-sizing:border-box' });
        tahta.append(kuyu(13, true));
        for (let k = 12; k >= 7; k--) tahta.append(kuyu(k));
        const sag = kuyu(6, true); sag.style.gridColumn = '8'; sag.style.gridRow = '1/3'; tahta.append(sag);
        for (let k = 0; k <= 5; k++) { const d = kuyu(k); d.style.gridRow = '2'; tahta.append(d); }
        T.append(tahta);
        T.append(el('div', { style: 'font-size:12.5px;color:var(--soluk)' }, `${ustAd} üstte, hazinesi solda · ${altAd} altta, hazinesi sağda · Kuyunun üstüne gel: taşın nereye düşeceğini gör.`));
        matCiz(-1);
      }
      function matCiz(i) {
        const toplam = st.a.reduce((x, y) => x + y, 0);
        let on = `<p>Taşlar dairesel bir yolda ilerler. Rakibin hazinesi atlandığı için yol <b>13 duraklı</b> bir saat gibidir: 6 kuyun + hazinen + rakibin 6 kuyusu.</p>`;
        if (i >= 0) {
          const n = st.a[i], s = K.oyna(st.a, st.sira, i);
          const yerAd = s.son === K.hazine(st.sira) ? 'hazinene' : K.kendi(st.sira, s.son) ? 'kendi kuyuna' : 'rakip kuyuya';
          on += `<p style="margin-top:6px">Bu kuyuda <b>${n}</b> taş var. ${n > 1 ? 'İlk taş aynı kuyuya döner, ' : 'Tek taş yan kuyuya geçer, '}son taş ${n > 1 ? `${n - 1}` : '1'} adım ötede, ${yerAd} düşer.</p>
            <code class="formul">son durak = (başlangıç + ${n > 1 ? 'n − 1' : '1'}) mod 13 = (${i % 7} + ${n > 1 ? n - 1 : 1}) mod 13 = ${(i % 7 + (n > 1 ? n - 1 : 1)) % 13}</code>
            ${s.olay ? `<p style="margin-top:6px"><b>${olayMetni(s.olay, st.sira)}</b></p>` : ''}`;
          if (n >= 13) on += `<p style="margin-top:6px">13 veya daha fazla taş tur atar: her 13 taşta tahtayı bir kez dolaşır.</p>`;
        } else on += '<code class="formul">son durak = (başlangıç + n − 1) mod 13</code>';
        on += `<p style="margin-top:6px;color:var(--soluk)">Korunum yasası: tahtadaki taş sayısı her an <b>${toplam}</b>.</p>`;
        api.mat(on);
      }
      return {
        yeni,
        geriAl() {
          if (!st.gecmis.length) return; clearTimeout(anim); st.gen++; st.bekle = false; st.gosterim = null;
          let h = st.gecmis.pop();
          if (api.ayar.rakip !== 'insan') while (h.sira !== 0 && st.gecmis.length) h = st.gecmis.pop();
          st.a = h.a; st.sira = h.sira; st.bitti = false; st.son = -1;
          if (!insanMi(st.sira)) { st.a = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]; st.sira = 0; st.gecmis = []; }
          api.geriAlAktif(st.gecmis.length > 0); api.neden(''); ciz(); durumYaz();
        },
        yokEt() { clearTimeout(anim); isci.iptal(); },
      };
    },
  });
})();
