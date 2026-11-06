'use strict';
/* SINIF TURNUVASI — öğretmen için eleme tablosu. Kişisel veri yok: yalnızca takım takma adları, yalnızca bu cihazda.
   Akıllı tahtada açılır; maç sonucu kazanan takıma dokunarak girilir. */
(() => {
  const OYUNLAR = [['satranc', 'Satranç'], ['go', 'Go'], ['mangala', 'Mangala'], ['reversi', 'Reversi'], ['hex', 'Hex'], ['pentago', 'Pentago'], ['mastermind', 'Mastermind'], ['sudoku', 'Sudoku']];
  const TEK = new Set(['mastermind', 'sudoku']); // tek kişilik oyunlar: maçı "daha az tahmin / daha kısa süre" kazanır
  const TUR_AD = { 8: ['Çeyrek final', 'Yarı final', 'Final'], 4: ['Yarı final', 'Final'], 2: ['Final'] };

  Salon.kaydet('turnuva', {
    arac: true,
    baslik: 'Sınıf turnuvası', alt: 'Eleme tablosu, akıllı tahtada.',
    ozet: 'Öğretmen için: 4 ya da 8 takım, bir oyun seç, eşleştir, kazananı işaretle. Ad soyad değil, takım adı.',
    etiketler: ['Öğretmen aracı', 'Eleme ağacı', 'Sınıf'],
    secenekler: [
      { id: 'oyun', ad: 'Oyun', sec: OYUNLAR, v: 'mangala' },
      { id: 'boyut', ad: 'Takım', sec: [['4', '4 takım'], ['8', '8 takım']], v: '8' },
    ],
    tur: [
      { baslik: 'Takımları yaz', metin: 'Takma adlar kullan (ör. "Asallar", "Fibonacciler"); öğrenci adı gerekmez. Liste yalnızca bu cihazda saklanır.' },
      { baslik: 'Eşleştir ve oyna', metin: '"Kura çek" eşleşmeleri karıştırır. Her maçın yanındaki "Oyna" tahtayı açar; bitince bu sayfaya dön.' },
      { baslik: 'Kazananı işaretle', metin: 'Maçı kazanan takımın adına dokun; bir sonraki tura geçer. Final kazananı şampiyon olur.' },
    ],
    kurallar: ['Takım sayısını ve oyunu seç; takım adlarını yaz.', '"Kura çek" eşleşmeleri rastgele yapar.', 'Kazanan takımın adına dokun; yanlış işaretlediysen aynı maça yeniden dokunarak değiştir.',
      'Mastermind ve Sudoku tek kişilik: iki takım aynı bulmacayı çözer, daha az tahmin ya da daha kısa süre kazanır.', 'Her şey bu tarayıcıda kalır; "Turnuvayı sıfırla" ile temizlenir.'],
    onizleme: () => `<svg viewBox="0 0 160 100" fill="none" stroke="currentColor" stroke-width="2">${[12, 32, 56, 76].map((y) => `<rect x="6" y="${y - 6}" width="40" height="12" rx="3"/>`).join('')}<path d="M46 12h12v20H46M46 56h12v20H46M58 22h14M58 66h14"/><rect x="72" y="16" width="40" height="12" rx="3"/><rect x="72" y="60" width="40" height="12" rx="3"/><path d="M112 22h12v44h-12M124 44h10"/><rect x="134" y="37" width="20" height="14" rx="3" fill="currentColor" opacity=".25"/></svg>`,
    olustur(api) {
      const { el } = api;
      let st;
      const varsayilan = (n) => ({ n, takim: [...Array(n)].map((_, i) => `Takım ${i + 1}`), tur: null });
      function kaydet() { api.yaz('turnuva', st); }
      function yeni() {
        const n = +api.ayar.boyut; const k = api.oku('turnuva', null);
        st = k && k.n === n ? k : varsayilan(n);
        ciz();
      }
      function kura() {
        const t = api.karistir(st.takim.slice());
        st.tur = [t]; while (st.tur[st.tur.length - 1].length > 1) st.tur.push(Array(st.tur[st.tur.length - 1].length / 2).fill(null));
        kaydet(); ciz();
      }
      function kazandi(tur, mac, kim) {
        const ad = st.tur[tur][mac * 2 + kim]; if (!ad) return;
        st.tur[tur + 1][mac] = ad;
        // sonraki turlarda bu dalın eski sonuçlarını temizle (yanlış işaret düzeltilince)
        let m = mac; for (let t = tur + 2; t < st.tur.length; t++) { m = Math.floor(m / 2); st.tur[t][m] = null; }
        kaydet(); ciz();
        if (tur + 1 === st.tur.length - 1) api.bitti(`Şampiyon: ${ad}!`);
      }
      function ciz() {
        const T = api.tahta; T.innerHTML = '';
        const oyun = api.ayar.oyun, oyunAd = OYUNLAR.find((x) => x[0] === oyun)[1];
        if (!st.tur) {
          const liste = el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;width:100%' });
          st.takim.forEach((ad, i) => liste.append(el('label', { style: 'display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--soluk)' }, `${i + 1}. takım`,
            el('input', { value: ad, maxlength: 24, style: 'font:inherit;font-size:16px;padding:8px 10px;border:1.5px solid var(--cizgi);border-radius:10px;background:var(--yuzey2);color:var(--metin)',
              oninput: (e) => { st.takim[i] = e.target.value.trim() || `Takım ${i + 1}`; kaydet(); } }))));
          T.append(el('p', { style: 'margin:0;max-width:60ch' }, `${st.n} takım, oyun: ${oyunAd}. Takım adlarını yaz, sonra kura çek.`), liste,
            el('button', { type: 'button', class: 'dug ana', style: 'font-size:17px;padding:12px 22px', onclick: kura }, 'Kura çek'));
          api.durum('Takımları hazırla.');
        } else {
          const agac = el('div', { style: `display:grid;grid-template-columns:repeat(${st.tur.length},minmax(0,1fr));gap:12px;width:100%;align-items:stretch` });
          st.tur.forEach((tur, ti) => {
            const sutun = el('div', { style: 'display:flex;flex-direction:column;justify-content:space-around;gap:10px' },
              el('div', { class: 'kas', style: 'text-align:center' }, ti < st.tur.length - 1 ? TUR_AD[st.n][ti] : 'Şampiyon'));
            if (ti === st.tur.length - 1) {
              sutun.append(el('div', { style: 'padding:16px;border-radius:14px;border:2px solid var(--turuncu);text-align:center;font-family:var(--f-baslik);font-size:22px' }, tur[0] || '?'));
            } else for (let m = 0; m < tur.length / 2; m++) {
              const kazanan = st.tur[ti + 1][m];
              const takimBtn = (k) => { const ad = tur[m * 2 + k];
                return el('button', { type: 'button', disabled: !ad, onclick: () => kazandi(ti, m, k),
                  style: `text-align:left;padding:10px 12px;border-radius:10px;font-size:16px;border:1.5px solid ${kazanan && kazanan === ad ? 'var(--yesil)' : 'var(--cizgi)'};background:${kazanan && kazanan === ad ? 'color-mix(in srgb,var(--yesil) 18%,var(--yuzey))' : 'var(--yuzey2)'};${kazanan && kazanan !== ad ? 'opacity:.5;text-decoration:line-through' : ''}` }, ad || '—'); };
              const kutu = el('div', { style: 'display:flex;flex-direction:column;gap:4px;padding:8px;border-radius:12px;border:1px dashed var(--cizgi)' }, takimBtn(0), takimBtn(1));
              if (tur[m * 2] && tur[m * 2 + 1] && !kazanan) kutu.append(el('a', { href: `#${oyun}${TEK.has(oyun) ? '' : '-insan'}`, class: 'cip', style: 'text-align:center;text-decoration:none;color:inherit' }, `${oyunAd} tahtasını aç`));
              sutun.append(kutu);
            }
            agac.append(sutun);
          });
          T.append(el('div', { style: 'width:100%;overflow-x:auto' }, agac),
            el('div', { class: 'dugmeler' }, el('button', { type: 'button', class: 'dug', onclick: () => { st.tur = null; kaydet(); ciz(); api.durum('Takımlar düzenlenebilir.'); } }, 'Takımlara dön'),
              el('button', { type: 'button', class: 'dug', onclick: () => { st = varsayilan(st.n); kaydet(); ciz(); } }, 'Turnuvayı sıfırla')));
          const sampiyon = st.tur[st.tur.length - 1][0];
          api.durum(sampiyon ? `Şampiyon: <b>${sampiyon}</b>` : 'Kazanan takımın adına dokun.');
        }
        api.mat(`<p>Eleme turnuvasında her maç tam bir takımı eler. Şampiyon dışında herkes bir kez elenir, bu yüzden <b>${st.n} takım için ${st.n - 1} maç</b> gerekir; hesap yapmadan bilinir.</p>
          <p style="margin-top:6px">Tur sayısı <b>log₂ ${st.n} = ${Math.log2(st.n)}</b>: her turda takım sayısı yarıya iner. 64 takım olsaydı 6 tur yeterdi.</p>
          <code class="formul">maç = n − 1 · tur = log₂ n · ilk tur eşleşme sayısı = n! / (2^(n/2) · (n/2)!)</code>`);
      }
      return { yeni };
    },
  });
})();
