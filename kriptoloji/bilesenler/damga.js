/* =====================================================================
   DAMGA — kriptoloji/bilesenler/damga.js
   Çözülen dosyaya kırmızı "ÇÖZÜLDÜ" damgası. Animasyon CSS'te (daire.css → .damga);
   "hareketi azalt" açıksa animasyonsuz basılır.
   ===================================================================== */

/** dosyaEl: .damga-yeri sınıflı öğe. Damga zaten varsa yenisini basmaz. */
export function damgala(dosyaEl, { duyur = true } = {}) {
  if (!dosyaEl || dosyaEl.querySelector(':scope > .damga')) return;
  const d = document.createElement('span');
  d.className = 'damga';
  d.setAttribute('aria-hidden', 'true');
  d.textContent = 'ÇÖZÜLDÜ';
  dosyaEl.appendChild(d);
  dosyaEl.dataset.cozuldu = 'evet';
  if (duyur) {
    const duyuru = document.getElementById('duyuru');
    const baslik = dosyaEl.querySelector('h2, h3');
    if (duyuru) duyuru.textContent = (baslik ? baslik.textContent.trim() + ': ' : '') + 'dosya çözüldü, damga basıldı.';
  }
}
