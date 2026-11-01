/* Tema düğmesi ../tema.js tarafından bağlanır. */

/* Hangar: 3B dron sahnesi ve şablonlar. Şablon değerleri Laboratuvar'ın hesap.js dosyasından gelir;
   "Laboratuvar'da aç" bağlantısı aynı değerleri adres çubuğuna (#...) yazarak tasarımı oraya taşır. */
(function () {
  'use strict';
  var tuval = document.getElementById('hangar3b');
  if (!tuval || !window.Dron3D) return;
  var sahne = Dron3D.Sahne(tuval, { yakinlik: 1.55, merkezY: .54 });
  var S = window.DronHesap ? DronHesap.SABLONLAR : null;
  var bilgi = document.getElementById('sablonBilgi'), lab = document.getElementById('labaAc');
  var aciklama = {
    mikro: 'Avuç içi kadar, pervane korumalı türlerin akrabası. Evde ve sınıfta güvenle uçar.',
    sinematik3: 'Yumuşak çekim için: küçük, sakin ve dengeli. Kanat sayısı fazla, pervane küçük.',
    yaris5: 'FPV dünyasının klasik ölçüsü: hafif, çok güçlü ve çevik.',
    uzun7: 'Büyük pervane, düşük KV: daha az enerjiyle daha uzun uçuş.',
    yuk10: 'Altı motorlu yük taşıyıcı: bir motor zorlansa da diğerleri dengeyi taşır.'
  };
  function sec(ad, kol) {
    var t = S ? Object.assign({}, S[ad]) : { cerceveSinif: 5, pervaneCap: 5, kanat: 3, motorSayisi: 4, bataryaG: 200 };
    if (kol) t.motorSayisi = kol;
    sahne.ayarla(Dron3D.tasarimdan(t));
    document.querySelectorAll('.sablon').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sablon === ad)); });
    if (bilgi) bilgi.textContent = (t.ad ? t.ad.replace('Yük taşıyıcı 10 inç', 'Hexa yük taşıyıcı 10 inç') + ': ' : '') + (aciklama[ad] || '');
    if (lab && S) {
      var p = new URLSearchParams();
      Object.keys(t).forEach(function (k) { if (k !== 'ad') p.set(k, t[k]); });
      lab.href = '../dron-lab/index.html#' + p.toString();
    }
  }
  document.querySelectorAll('.sablon').forEach(function (b) {
    b.addEventListener('click', function () { sec(b.dataset.sablon, b.dataset.kol ? +b.dataset.kol : 0); });
  });
  var pd = document.getElementById('patlatDugme');
  if (pd) pd.addEventListener('click', function () {
    var acik = pd.getAttribute('aria-pressed') !== 'true';
    pd.setAttribute('aria-pressed', String(acik)); pd.textContent = acik ? 'Parçaları birleştir' : 'Parçaları ayır';
    sahne.patlat(acik ? 1 : 0);
  });
  sec('yaris5');
})();

/* Kaydırınca beliren kartlar (hareket azaltma tercihine saygılı) */
(function () {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ogeler = document.querySelectorAll('.belir-kaydir');
  ogeler.forEach(function (o) { o.classList.add('gizli'); });
  var io = new IntersectionObserver(function (g) {
    g.forEach(function (x) { if (x.isIntersecting) { x.target.classList.remove('gizli'); io.unobserve(x.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  ogeler.forEach(function (o) { io.observe(o); });
})();
