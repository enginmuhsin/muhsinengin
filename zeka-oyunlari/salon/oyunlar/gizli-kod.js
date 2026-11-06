'use strict';
/* GİZLİ KOD — 6 renk, 4 yuva, tekrar serbest: 6⁴ = 1296 olası kod.
   Canlı matematik: her geri bildirimden sonra hâlâ mümkün olan kodlar (36×36 nokta),
   elenen oran ve kazanılan bilgi (bit). Bilgisayar modunda Knuth'un minimax stratejisi. */
(() => {
  const RENK = ['#d8432f', '#2f6fd0', '#1d9566', '#e3b21b', '#8e4fc6', '#ef7d22'];
  const AD = ['kırmızı', 'mavi', 'yeşil', 'sarı', 'mor', 'turuncu'];
  const KODLAR = []; for (let i = 0; i < 1296; i++) KODLAR.push([Math.floor(i / 216) % 6, Math.floor(i / 36) % 6, Math.floor(i / 6) % 6, i % 6]);
  const kodNo = (k) => k[0] * 216 + k[1] * 36 + k[2] * 6 + k[3];
  function geri(a, b) { // siyah: doğru renk doğru yer, beyaz: doğru renk yanlış yer
    let s = 0; const ca = [0, 0, 0, 0, 0, 0], cb = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 4; i++) { if (a[i] === b[i]) s++; else { ca[a[i]]++; cb[b[i]]++; } }
    let w = 0; for (let c = 0; c < 6; c++) w += Math.min(ca[c], cb[c]);
    return s * 10 + w;
  }
  function knuth(S) { // en kötü durumda en az kod bırakan tahmin
    if (S.length === 1296) return { g: kodNo([0, 0, 1, 1]), enKotu: 256 };
    if (S.length <= 2) return { g: S[0], enKotu: 1 };
    const Sset = new Set(S); let en = null, enKotu = 1e9;
    for (let g = 0; g < 1296; g++) {
      const say = {}; let kotu = 0;
      for (const s of S) { const f = geri(KODLAR[g], KODLAR[s]); const n = (say[f] = (say[f] || 0) + 1); if (n > kotu) kotu = n; if (kotu >= enKotu) break; }
      if (kotu < enKotu || (kotu === enKotu && !Sset.has(en) && Sset.has(g))) { enKotu = kotu; en = g; }
    }
    return { g: en, enKotu };
  }

  Salon.kaydet('gizlikod', {
    baslik: 'Gizli Kod', alt: '1296 gizli kod, en fazla 10 tahmin.',
    ozet: 'Gizli renk kodunu ipuçlarıyla bul. Her tahminde olasılıkların nasıl eridiğini gör.',
    etiketler: ['Knuth minimax', 'Bilgi kuramı', '1 kişi'],
    dallanmaRef: '1296', dallanmaSayi: 1296,
    secenekler: [{ id: 'mod', ad: 'Mod', sec: [['gunluk', 'Günün kodu'], ['sen', 'Sen çöz'], ['bilgisayar', 'Bilgisayar çözsün']], v: 'sen' }],
    tur: [
      { baslik: 'Gizli kodu bul', metin: 'Bilgisayar 6 renkten 4\'lü bir kod seçti; renkler tekrar edebilir. Alttaki renklere dokunarak tahminini kur, sonra "Tahmin et"e bas.' },
      { baslik: 'Çivileri oku', metin: 'Siyah çivi: doğru renk, doğru yerde. Beyaz çivi: doğru renk, yanlış yerde. Hangi rengin hangisi olduğunu söylemez; bulmacanın tadı burada.' },
      { baslik: 'Noktaların eriyişini izle', metin: 'Sağdaki 1296 nokta bütün olası kodlar. Her ipucundan sonra uymayanlar söner. Kaç "bit" bilgi kazandığın da yazıyor.', vurgu: '.kutu.mat' },
    ],
    kurallar: ['Gizli kod 4 yuvadan oluşur; her yuva 6 renkten biridir, renkler tekrar edebilir.',
      'Her tahminden sonra <b>siyah</b> çivi: doğru renk doğru yerde; <b>beyaz</b> çivi: doğru renk yanlış yerde.',
      'En fazla 10 tahminde kodu bulmaya çalış.', 'Donald Knuth 1977\'de her kodun en fazla 5 tahminde bulunabileceğini gösterdi.'],
    onizleme: () => `<svg viewBox="0 0 160 100">${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${22 + c * 26}" cy="${22 + r * 28}" r="10" fill="${RENK[(r * 2 + c * 3) % 6]}"/>`).join('') + `<circle cx="128" cy="${17 + r * 28}" r="3.5" fill="#222"/><circle cx="140" cy="${17 + r * 28}" r="3.5" fill="#fff" stroke="#999"/><circle cx="128" cy="${28 + r * 28}" r="3.5" fill="#fff" stroke="#999"/>`).join('')}</svg>`,
    olustur(api) {
      const { el, tr } = api;
      let st, zaman = null;
      const tuval = el('canvas', { width: 216, height: 216, style: 'width:180px;height:180px;image-rendering:pixelated;border-radius:6px;background:var(--yuzey2)' });

      function yeni() {
        clearTimeout(zaman);
        st = { mod: api.ayar.mod, gizli: null, satir: [], taslak: [null, null, null, null], S: KODLAR.map((_, i) => i), bitti: false, onayli: api.ayar.mod !== 'bilgisayar' };
        if (st.mod === 'sen') st.gizli = KODLAR[Math.floor(Math.random() * 1296)];
        if (st.mod === 'gunluk') {
          // herkese aynı kod: tohum = Türkiye saatine göre bugünün tarihi
          st.gun = api.gunAnahtari();
          st.gizli = KODLAR[Math.floor(api.tohumlu('mastermind-' + st.gun)() * 1296)];
          const kayit = api.oku('mm.gunluk', null);
          if (kayit && kayit.gun === st.gun) for (const k of kayit.tahminler) { tahminEt(k, true); }
        }
        ciz(); matCiz(null);
        api.durum(st.mod === 'gunluk' ? (st.bitti ? 'Bugünün kodunu çözdün; yarın yeni kod.' : `Günün kodu · ${api.gunAdi()} · herkes aynı kodu çözüyor.`) : st.mod === 'sen' ? 'Renklere dokunarak ilk tahminini kur.' : 'Gizli kodunu seç; bilgisayar görmeden çözecek.');
      }
      function tahminEt(k, sessiz) {
        const onceki = st.S.length;
        const f = geri(k, st.gizli);
        st.satir.push({ k, f });
        api.dallanma(1296);
        st.S = st.S.filter((s) => geri(k, KODLAR[s]) === f);
        matCiz({ onceki, sonra: st.S.length });
        if (f === 40) { st.bitti = true; api.bitti(st.mod === 'bilgisayar' ? `Bilgisayar ${st.satir.length} tahminde buldu.` : `Buldun! ${st.satir.length} tahmin.`); }
        else if (st.satir.length >= 10) { st.bitti = true; api.bitti('10 tahmin bitti. Kod: ' + st.gizli.map((c) => AD[c]).join(', '), true); }
        if (st.mod === 'gunluk') api.yaz('mm.gunluk', { gun: st.gun, tahminler: st.satir.map((x) => x.k) });
        if (!sessiz) ciz();
      }
      function bilgisayarAdim() {
        if (st.bitti) return;
        api.durum('Bilgisayar düşünüyor…', { dusunuyor: true });
        zaman = setTimeout(() => {
          const { g, enKotu } = knuth(st.S);
          api.neden(st.satir.length === 0
            ? `İlk tahmin <b>1122</b> düzeni (iki renk, ikişer kez). Knuth bunun, hangi cevap gelirse gelsin en fazla <b>256</b> kod bıraktığını hesapladı.`
            : `Hâlâ <b>${st.S.length}</b> kod mümkün. 1296 tahminin hepsini denedim; bu tahmin en kötü cevapta bile en fazla <b>${enKotu}</b> kod bırakıyor. Buna minimax denir: en kötüyü en aza indirmek.`);
          tahminEt(KODLAR[g]);
          if (!st.bitti) { api.durum(`Tahmin ${st.satir.length} yapıldı.`); zaman = setTimeout(bilgisayarAdim, 1100); }
          else api.durum('Oyun bitti.');
        }, 450);
      }
      function cizRenkSec() {
        return el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center' }, RENK.map((r, c) => el('button', {
          type: 'button', class: 'hucre-btn', 'aria-label': AD[c], style: `width:42px;height:42px;border-radius:50%;background:${r};box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);color:#fff;font-weight:700`,
          onclick: () => { const i = st.taslak.indexOf(null); if (i >= 0 && !st.bitti) { st.taslak[i] = c; ciz(); } },
        }, String(c + 1))));
      }
      function cubuk(c, boyut = 30) {
        return el('span', { style: `display:inline-grid;place-items:center;width:${boyut}px;height:${boyut}px;border-radius:50%;font-size:11px;font-weight:700;color:#fff;${c == null ? 'background:var(--yuzey2);border:2px dashed var(--cizgi)' : `background:${RENK[c]};box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)`}` }, c == null ? '' : String(c + 1));
      }
      function geriCiz(f) {
        const s = Math.floor(f / 10), w = f % 10; const p = [];
        for (let i = 0; i < 4; i++) p.push(el('i', { style: `width:9px;height:9px;border-radius:50%;display:block;${i < s ? 'background:var(--metin)' : i < s + w ? 'background:var(--yuzey);border:1.5px solid var(--metin)' : 'background:var(--cizgi)'}` }));
        return el('span', { style: 'display:grid;grid-template-columns:9px 9px;gap:3px', title: `${s} siyah, ${w} beyaz` }, p);
      }
      function ciz() {
        const T = api.tahta; T.innerHTML = '';
        T.append(el('div', { class: 'ust-bilgi' }, el('span', {}, 'Tahmin ', el('b', {}, `${st.satir.length}/10`)), el('span', {}, 'Mümkün kod ', el('b', {}, String(st.S.length)))));
        const tablo = el('div', { style: 'display:flex;flex-direction:column;gap:6px;background:var(--yuzey2);padding:12px;border-radius:14px' });
        for (let r = 0; r < 10; r++) {
          const s = st.satir[r]; const aktifSatir = !s && r === st.satir.length && !st.bitti && st.onayli && st.mod !== 'bilgisayar';
          const satir = el('div', { style: `display:flex;align-items:center;gap:8px;padding:3px 6px;border-radius:8px;${aktifSatir ? 'background:var(--yuzey);outline:2px solid var(--kirmizi)' : ''}` },
            el('span', { class: 'num', style: 'width:18px;font-size:12px;color:var(--soluk)' }, String(r + 1)));
          const kod = s ? s.k : aktifSatir ? st.taslak : [null, null, null, null];
          kod.forEach((c, i) => {
            const b = cubuk(c); if (aktifSatir && c != null) { b.style.cursor = 'pointer'; b.onclick = () => { st.taslak[i] = null; ciz(); }; b.title = 'Kaldır'; }
            satir.append(b);
          });
          satir.append(el('span', { style: 'width:12px' }), s ? geriCiz(s.f) : el('span', { style: 'width:21px' }));
          tablo.append(satir);
        }
        T.append(tablo);
        if (st.mod === 'gunluk' && st.bitti) {
          const sonuc = st.satir.at(-1).f === 40 ? `${st.satir.length}/10` : 'X/10';
          const metin = `Günün Gizli Kodu · ${api.gunAdi()} · ${sonuc}\n` + st.satir.map((x) => { const s = Math.floor(x.f / 10), w = x.f % 10; return '●'.repeat(s) + '○'.repeat(w) + '·'.repeat(4 - s - w); }).join('\n') + '\nmuhsinengin.com/zeka-oyunlari/salon/#gizlikod-gunluk';
          const kutu = el('div', { style: 'width:min(100%,360px);display:flex;flex-direction:column;gap:8px' },
            el('pre', { style: 'margin:0;padding:10px 12px;border-radius:10px;background:var(--yuzey2);font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;white-space:pre-wrap;user-select:text' }, metin),
            el('button', { class: 'dug ana', type: 'button', onclick: async (e) => { const ok = await api.kopyala(metin); e.target.textContent = ok ? 'Kopyalandı' : 'Metni seçip kopyala'; } }, 'Sonucu kopyala'),
            el('small', { style: 'color:var(--soluk)' }, 'Renkleri değil yalnızca ipuçlarını paylaşır; kodu kimseye söylemez.'));
          T.append(kutu);
        }
        if (st.mod !== 'bilgisayar' && !st.bitti) {
          T.append(cizRenkSec());
          T.append(el('div', { class: 'dugmeler' },
            el('button', { class: 'dug ana', type: 'button', disabled: st.taslak.includes(null), onclick: () => { const k = st.taslak.slice(); st.taslak = [null, null, null, null]; tahminEt(k); api.durum(st.bitti ? 'Oyun bitti.' : 'Sıradaki tahmin.'); } }, 'Tahmin et'),
            st.mod === 'gunluk' ? null : el('button', { class: 'dug', type: 'button', onclick: () => { const { g, enKotu } = knuth(st.S); st.taslak = KODLAR[g].slice(); ciz(); api.neden(`Knuth'un önerisi: en kötü cevapta bile en fazla <b>${enKotu}</b> kod bırakır.`); } }, 'Knuth ne derdi?')));
        }
        if (st.mod === 'bilgisayar' && !st.onayli) {
          T.append(el('div', { style: 'display:flex;gap:8px' }, st.taslak.map((c) => cubuk(c, 40))));
          T.append(cizRenkSec());
          T.append(el('div', { class: 'dugmeler' },
            el('button', { class: 'dug', type: 'button', onclick: () => { st.taslak = [null, null, null, null]; ciz(); } }, 'Temizle'),
            el('button', { class: 'dug ana', type: 'button', disabled: st.taslak.includes(null), onclick: () => { st.gizli = st.taslak.slice(); st.onayli = true; st.taslak = [null, null, null, null]; ciz(); bilgisayarAdim(); } }, 'Gizli kodu onayla')));
        }
        if (st.mod === 'bilgisayar' && st.onayli && st.gizli) T.append(el('div', { class: 'ust-bilgi' }, 'Senin gizli kodun: ', el('span', { style: 'display:flex;gap:4px' }, st.gizli.map((c) => cubuk(c, 22)))));
      }
      function matCiz(son) {
        const x = tuval.getContext('2d'); x.clearRect(0, 0, 216, 216);
        const acik = new Set(st.S); const stil = getComputedStyle(document.body);
        const renkA = stil.getPropertyValue('--kirmizi').trim(), renkB = stil.getPropertyValue('--cizgi').trim();
        for (let i = 0; i < 1296; i++) { x.fillStyle = acik.has(i) ? renkA : renkB; x.fillRect((i % 36) * 6 + 1, Math.floor(i / 36) * 6 + 1, 4, 4); }
        const kutu = el('div', {});
        kutu.append(el('div', { style: 'display:flex;gap:12px;align-items:center;flex-wrap:wrap' }, tuval,
          el('div', { style: 'flex:1;min-width:120px' }, el('div', { style: 'font-family:var(--f-sayi);font-size:30px;line-height:1' }, tr(st.S.length)), el('div', { style: 'color:var(--soluk);font-size:12.5px' }, '/ 1296 kod hâlâ mümkün'))));
        let metin = 'Her nokta bir olası kod. Kırmızılar şu ana kadarki bütün ipuçlarıyla hâlâ uyumlu.';
        if (son) {
          const bit = Math.log2(son.onceki / Math.max(son.sonra, 1));
          metin = `Son ipucu olasılıkların <b>%${tr(100 * (1 - son.sonra / son.onceki), 0)}</b>'ini eledi: ${son.onceki} → ${son.sonra}. Kazanılan bilgi <b>${tr(bit, 2)} bit</b>. Kodu tam bilmek için toplam log₂1296 ≈ <b>10,34 bit</b> gerekir.`;
        }
        kutu.append(el('p', { style: 'margin-top:8px' }));
        kutu.lastChild.innerHTML = metin;
        kutu.append(el('code', { class: 'formul' }, 'bilgi = log₂(önceki / sonraki)  bit'));
        $mat(kutu);
      }
      const $mat = (n) => { const m = document.getElementById('mat'); m.innerHTML = ''; m.append(n); };
      return { yeni, yokEt() { clearTimeout(zaman); } };
    },
  });
})();
