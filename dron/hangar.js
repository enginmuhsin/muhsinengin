/* Dron Hangarı: yalnızca tema düğmesi (açık/koyu). Başka bir şey yapmaz. */
(function () {
  'use strict';
  var dugme = document.getElementById('temaDugme');
  if (!dugme) return;
  dugme.addEventListener('click', function () {
    var kok = document.documentElement;
    var suAnKoyu = kok.getAttribute('data-theme') === 'dark' ||
      (!kok.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var yeni = suAnKoyu ? 'light' : 'dark';
    kok.setAttribute('data-theme', yeni);
    try { localStorage.setItem('site-tema', yeni); } catch (e) { /* sessizce geç */ }
  });
})();
