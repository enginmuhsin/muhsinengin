/* =====================================================================
   SEVİYE — kriptoloji/bilesenler/seviye.js
   Çırak (ortaokul) / Uzman (lise). Simülasyon aynı; Uzman'da [data-uzman] öğeleri görünür.
   Seviye adreste tutulur: ?seviye=uzman  (depo API'si yok)
   Kullanım: <fieldset class="secici" data-seviye-secici> içinde
             <button data-seviye="cirak"> ve <button data-seviye="uzman">
   ===================================================================== */
import { baglantilariGuncelle } from './durum.js';

export function seviye() {
  return new URLSearchParams(location.search).get('seviye') === 'uzman' ? 'uzman' : 'cirak';
}

function uygula(s) {
  document.documentElement.dataset.seviye = s;
  document.querySelectorAll('[data-seviye-secici] button[data-seviye]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.seviye === s));
  });
}

export function seviyeKoy(s) {
  const u = new URL(location.href);
  if (s === 'uzman') u.searchParams.set('seviye', 'uzman'); else u.searchParams.delete('seviye');
  history.replaceState(history.state, '', u.href);
  uygula(s);
  baglantilariGuncelle();
  const duyuru = document.getElementById('duyuru');
  if (duyuru) duyuru.textContent = s === 'uzman' ? 'Uzman seviyesi açık: formüller ve ek görevler göründü.' : 'Çırak seviyesi açık.';
}

export function seviyeBaslat() {
  uygula(seviye());
  document.querySelectorAll('[data-seviye-secici] button[data-seviye]').forEach((b) => {
    b.addEventListener('click', () => seviyeKoy(b.dataset.seviye));
  });
}
