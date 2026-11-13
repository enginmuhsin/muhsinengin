/* =====================================================================
   LOBİ — kriptoloji/lobi.mjs
   Giriş dosyası (akrostiş), sicil mührü, şube sayaçları, rütbeler, kayıt kodu.
   Ağ isteği yok, depo yok: her şey bellekte (bilesenler/durum.mjs).
   ===================================================================== */
import { buyukHarf } from './cekirdek/turkce-alfabe.mjs';
import { DOSYALAR, ODALAR, RUTBELER, BIT_SAYISI, rutbeSirasi, sayim } from './cekirdek/dosyalar.mjs';
import { kodCoz, hataMetni } from './cekirdek/kayit-kodu.mjs';
import { coz, cozulduMu, dinle, kod, maskeKoy, maskeAl, baglantilariGuncelle } from './bilesenler/durum.mjs';
import { seviyeBaslat } from './bilesenler/seviye.mjs';
import { sunumBaslat } from './bilesenler/sunum.mjs';
import { damgala } from './bilesenler/damga.mjs';

const $ = (s) => document.querySelector(s);

/* ---------- Mühürdeki 29 çentik ---------- */
(function centikler() {
  const g = $('#muhurCentik');
  const ns = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 29; i++) {
    const a = (i / 29) * 2 * Math.PI - Math.PI / 2;
    const uzun = i % 29 === 0;
    const r1 = 95, r2 = uzun ? 80 : 87;
    const c = document.createElementNS(ns, 'line');
    c.setAttribute('x1', (150 + r1 * Math.cos(a)).toFixed(2)); c.setAttribute('y1', (150 + r1 * Math.sin(a)).toFixed(2));
    c.setAttribute('x2', (150 + r2 * Math.cos(a)).toFixed(2)); c.setAttribute('y2', (150 + r2 * Math.sin(a)).toFixed(2));
    g.appendChild(c);
  }
})();

/* ---------- Rütbe basamakları ---------- */
const basamaklar = $('#basamaklar');
RUTBELER.forEach((r) => {
  const li = document.createElement('li');
  li.dataset.rutbe = r.id;
  li.innerHTML = '<strong></strong><p></p>';
  li.querySelector('strong').textContent = r.ad;
  li.querySelector('p').textContent = r.kosul;
  basamaklar.appendChild(li);
});

/* ---------- Durum değişince her şeyi yeniden çiz ---------- */
let oncekiRutbe = null;
dinle((maske) => {
  const s = sayim(maske);
  const r = rutbeSirasi(maske);
  $('#muhurRutbe').textContent = RUTBELER[r].ad;
  $('#muhurSayi').textContent = s.toplam + ' / ' + BIT_SAYISI + ' DOSYA';
  $('#muhur').setAttribute('aria-label', 'Sicil mührü: rütbe ' + RUTBELER[r].ad + ', ' + s.toplam + ' dosya çözüldü');
  basamaklar.querySelectorAll('li').forEach((li, i) => li.setAttribute('aria-current', String(i === r)));
  if (oncekiRutbe !== null && r > oncekiRutbe) {
    const d = $('#duyuru'); if (d) d.textContent = 'Tebrikler, yeni rütben: ' + RUTBELER[r].ad + '.';
  }
  oncekiRutbe = r;

  for (const oda of ODALAR) {
    const toplam = DOSYALAR.filter((d) => d.oda === oda.id).length;
    const cozulen = DOSYALAR.filter((d) => d.oda === oda.id && (maske & (1 << d.bit))).length;
    const yer = document.querySelector('[data-oda="' + oda.id + '"] [data-sayac]');
    if (yer) yer.textContent = cozulen + ' / ' + toplam + ' dosya';
  }
  document.querySelectorAll('[data-dosya]').forEach((el) => {
    if (cozulduMu(Number(el.dataset.dosya))) damgala(el, { duyur: false });
  });
  const cikti = $('#kodCikti');
  if (cikti.textContent) cikti.textContent = kod();
});

/* ---------- Giriş dosyası: akrostiş ---------- */
const parola = $('#parola'), parolaSonuc = $('#parolaSonuc');
function parolaDene() {
  const g = buyukHarf(parola.value).replace(/[^A-ZÇĞİÖŞÜ]/g, '');
  parolaSonuc.className = 'geri-bildirim';
  if (!g) { parolaSonuc.textContent = 'Önce bir parola yaz.'; return; }
  if (g === 'ŞİFRE') {
    parolaSonuc.textContent = 'Doğru! Kapı açıldı. Her satırın ilk harfi: Ş-İ-F-R-E.';
    parolaSonuc.classList.add('olumlu');
    if (!cozulduMu(0)) { damgala($('#giris-dosyasi')); coz(0); }
  } else if (g.replace(/Ş/g, 'S').replace(/[İ]/g, 'I') === 'SIFRE') {
    parolaSonuc.textContent = 'Çok yaklaştın. Türk alfabesinde Ş ve İ ayrı harflerdir; notun ilk harflerine yeniden bak.';
    parolaSonuc.classList.add('olumsuz');
  } else {
    parolaSonuc.textContent = 'Kapı açılmadı. Notu bir kez daha oku; parola göz önünde ama dikkat çekmiyor.';
    parolaSonuc.classList.add('olumsuz');
  }
}
$('#parolaDene').addEventListener('click', parolaDene);
parola.addEventListener('keydown', (e) => { if (e.key === 'Enter') parolaDene(); });

/* ---------- Kayıt kodu ---------- */
const kodCikti = $('#kodCikti'), kopyala = $('#kodKopyala'), kodSonuc = $('#kodSonuc'), kodGirdi = $('#kodGirdi');
$('#kodAl').addEventListener('click', () => {
  kodCikti.textContent = kod();
  kopyala.hidden = !(navigator.clipboard && window.isSecureContext);
  kodSonuc.className = 'geri-bildirim';
  kodSonuc.textContent = maskeAl() ? 'Bu kodu bir kâğıda ya da defterine yaz.' : 'Henüz dosya çözmedin; bu kod boş bir sicili gösterir.';
});
kopyala.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(kodCikti.textContent); kodSonuc.textContent = 'Kod panoya kopyalandı.'; }
  catch { kodSonuc.textContent = 'Kopyalanamadı; kodu elle yazabilirsin.'; }
});
function kodYukle() {
  const s = kodCoz(kodGirdi.value);
  kodSonuc.className = 'geri-bildirim';
  if (!s.tamam) { kodSonuc.textContent = hataMetni(s); kodSonuc.classList.add('olumsuz'); return; }
  maskeKoy(s.maske);
  const n = sayim(s.maske).toplam;
  kodSonuc.textContent = 'Hoş geldin! Sicilin yüklendi: ' + n + ' dosya, rütben ' + RUTBELER[rutbeSirasi(s.maske)].ad + '.';
  kodSonuc.classList.add('olumlu');
}
$('#kodYukle').addEventListener('click', kodYukle);
kodGirdi.addEventListener('keydown', (e) => { if (e.key === 'Enter') kodYukle(); });

seviyeBaslat();
sunumBaslat();
baglantilariGuncelle();

/* ---------- Çevrimdışı çalışma: bir kez yüklenince internetsiz açılır ---------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
