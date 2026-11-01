/* =====================================================================
   SİTE TEMASI — tema.js (bütün sayfalarda <head> içinde, CSS'ten önce yüklenir)
   Dört seçenek: Otomatik (cihaza uyar) · Açık · Koyu · Saate göre (19:00–07:00 koyu).
   Tercih, muhsinengin.com'un bütün alt alanlarında geçerli bir çerezde saklanır
   (masterclass., ders., sekmeolcer. de aynı tercihi okuyabilsin diye). Çerez yoksa
   ya da sayfa dosyadan açıldıysa tarayıcı deposuna (localStorage) düşer.
   Tema değişince sayfaya "temadegisti" olayı gönderilir; grafikler bununla yeniden çizilir.
   Düğme: data-tema-dugme özniteliği ya da id="temaDugme" olan her düğme bağlanır.
   ===================================================================== */
(function () {
  'use strict';
  var SECENEK = ['otomatik', 'acik', 'koyu', 'saat'];
  var ETIKET = { otomatik: 'Otomatik', acik: 'Açık', koyu: 'Koyu', saat: 'Saate göre' };
  var IKON = { otomatik: '◐', acik: '☀', koyu: '☾', saat: '◷' };
  var kok = document.documentElement;

  function oku() {
    var v = null;
    var m = document.cookie.match(/(?:^|;\s*)tema=([^;]+)/);
    if (m) v = decodeURIComponent(m[1]);
    if (!v) {
      try {
        v = localStorage.getItem('tema');
        if (!v) { var eski = localStorage.getItem('site-tema'); v = eski === 'dark' ? 'koyu' : eski === 'light' ? 'acik' : null; }
      } catch (e) { /* depo kapalıysa sessizce geç */ }
    }
    return SECENEK.indexOf(v) >= 0 ? v : 'otomatik';
  }
  function yaz(v) {
    var alan = /(^|\.)muhsinengin\.com$/.test(location.hostname) ? '; domain=.muhsinengin.com' : '';
    var guvenli = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = 'tema=' + v + '; path=/; max-age=31536000; SameSite=Lax' + alan + guvenli;
    try { localStorage.setItem('tema', v); localStorage.removeItem('site-tema'); } catch (e) { /* sessizce geç */ }
  }
  function koyuMu(v) {
    if (v === 'koyu') return true;
    if (v === 'acik') return false;
    if (v === 'saat') { var s = new Date().getHours(); return s >= 19 || s < 7; }
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }
  var secim = oku();
  function uygula(bildir) {
    if (secim === 'otomatik') kok.removeAttribute('data-theme');
    else kok.setAttribute('data-theme', koyuMu(secim) ? 'dark' : 'light');
    kok.setAttribute('data-tema-secim', secim);
    if (bildir) document.dispatchEvent(new CustomEvent('temadegisti', { detail: { secim: secim, koyu: koyuMu(secim) } }));
  }
  uygula(false);

  // Saate göre: dakikada bir kontrol; Otomatik: cihaz teması değişince grafikler de yenilensin
  setInterval(function () { if (secim === 'saat') { var once = kok.getAttribute('data-theme'); uygula(false); if (once !== kok.getAttribute('data-theme')) uygula(true); } }, 60000);
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (secim === 'otomatik') uygula(true); }); } catch (e) { /* eski tarayıcı */ }

  function dugmeYaz(b) {
    var y = b.querySelector('.tema-yazi'), i = b.querySelector('.tema-ikon');
    if (y) y.textContent = ETIKET[secim]; else b.textContent = IKON[secim] + ' ' + ETIKET[secim];
    if (i) i.textContent = IKON[secim];
    b.setAttribute('aria-label', 'Tema: ' + ETIKET[secim] + '. Değiştirmek için tıkla.');
    b.title = 'Tema: ' + ETIKET[secim] + ' (sırayla: Otomatik → Açık → Koyu → Saate göre)';
  }
  function bagla() {
    var dugmeler = document.querySelectorAll('[data-tema-dugme], #temaDugme');
    Array.prototype.forEach.call(dugmeler, function (b) {
      if (b.getAttribute('data-tema-bagli')) return;
      b.setAttribute('data-tema-bagli', '1');
      dugmeYaz(b);
      b.addEventListener('click', function () {
        secim = SECENEK[(SECENEK.indexOf(secim) + 1) % SECENEK.length];
        yaz(secim); uygula(true);
        Array.prototype.forEach.call(document.querySelectorAll('[data-tema-bagli]'), dugmeYaz);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bagla); else bagla();

  window.SiteTema = { secim: function () { return secim; }, koyu: function () { return koyuMu(secim); }, ETIKET: ETIKET };
})();
