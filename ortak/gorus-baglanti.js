/* =====================================================================
   GÖRÜŞ BAĞLANTISI — ortak/gorus-baglanti.js
   Sayfanın altına küçük bir "Görüş ve öneriler" bağlantısı ekler.
   Bu betik hiçbir şey göndermez: yalnızca /gorus/ sayfasına giden bir bağlantıdır.
   Hangi sayfadan gelindiği adreste taşınır (?sayfa=/kriptoloji/sezar/); form orada doldurulur.
   Sayfaya eklemek: <script src="…/ortak/gorus-baglanti.js" defer></script>
   ===================================================================== */
(function () {
  'use strict';
  if (/^\/(gorus|sayac)\//.test(location.pathname)) return;
  var yol = location.pathname.replace(/index\.html$/, '');
  var p = document.createElement('p');
  p.className = 'gorus-baglanti';
  p.style.cssText = 'margin:1.2rem auto 1.6rem;text-align:center;font-size:.95rem;';
  var a = document.createElement('a');
  a.href = '/gorus/?sayfa=' + encodeURIComponent(yol);
  a.textContent = 'Görüş ve öneriler: bu sayfa hakkında ne düşünüyorsun?';
  a.style.cssText = 'color:var(--murekkep,#1f3a8a);font-weight:600;text-underline-offset:.3em;display:inline-flex;align-items:center;min-height:44px;';
  p.appendChild(a);
  var footer = document.querySelector('body > footer, main + footer, footer.alt-bilgi');
  (footer || document.body).appendChild(p);

  // Yenilikler: ana sayfada son duyurular, ilgili sayfalarda tek seferlik "yeni" notu (ortak/yenilikler.js)
  var y = document.createElement('script');
  y.src = '/ortak/yenilikler.js';
  y.defer = true;
  document.head.appendChild(y);
})();
