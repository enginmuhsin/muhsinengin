/* =====================================================================
   LOBİ — kriptoloji/lobi.js
   Giriş dosyası (akrostiş), sicil mührü, şube sayaçları, rütbeler, kayıt kodu.
   Ağ isteği yok, depo yok: her şey bellekte (bilesenler/durum.js).
   ===================================================================== */
import { buyukHarf, mod } from './cekirdek/turkce-alfabe.js';
import { sezarCoz } from './cekirdek/sezar.js';
import { DOSYALAR, ODALAR, RUTBELER, BIT_SAYISI, rutbeSirasi, sayim } from './cekirdek/dosyalar.js';
import { kodCoz, hataMetni } from './cekirdek/kayit-kodu.js';
import { coz, cozulduMu, dinle, kod, maskeKoy, maskeAl, baglantilariGuncelle } from './bilesenler/durum.js';
import { seviyeBaslat } from './bilesenler/seviye.js';
import { sunumBaslat } from './bilesenler/sunum.js';
import { damgala } from './bilesenler/damga.js';
import { geriBildir } from './bilesenler/gorev.js';
import { cal } from './bilesenler/ses.js';
import { odaSimgesi, rozet } from './bilesenler/cizimler.js';

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

/* ---------- Rütbe basamakları ve rozetler ---------- */
const basamaklar = $('#basamaklar');
RUTBELER.forEach((r) => {
  const li = document.createElement('li');
  li.dataset.rutbe = r.id;
  li.innerHTML = '<span class="rozet-yeri"></span><strong></strong><p></p>';
  li.querySelector('strong').textContent = r.ad;
  li.querySelector('p').textContent = r.kosul;
  basamaklar.appendChild(li);
});
function rozetleriCiz(r, yeniMi) {
  basamaklar.querySelectorAll('li').forEach((li, i) => {
    li.querySelector('.rozet-yeri').innerHTML = rozet(li.dataset.rutbe, i <= r);
    li.classList.toggle('yeni', yeniMi && i === r);
  });
}

/* ---------- Kat planı ---------- */
const PLAN = [
  { id: 'sezar', x: 20, y: 20, g: 286, y2: 280, kapi: 'alt' },
  { id: 'kasa', x: 306, y: 20, g: 288, y2: 280, kapi: 'alt' },
  { id: 'murekkep', x: 594, y: 20, g: 286, y2: 280, kapi: 'alt' },
  { id: 'ogretmen', x: 20, y: 360, g: 286, y2: 620, kapi: 'ust', ad: 'Öğretmen Masası', yol: 'ogretmen/' },
  { id: 'lobi', x: 306, y: 360, g: 288, y2: 620, kapi: 'ust', ad: 'Lobi' },
  { id: 'arsiv', x: 594, y: 360, g: 286, y2: 620, kapi: 'ust', ad: 'Arşiv' },
];
const planSvg = $('#katPlani');
function planCiz(maske) {
  const odaBilgi = (id) => ODALAR.find((o) => o.id === id);
  let s = '<defs><pattern id="tarama" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" class="tarama-cizgi"/></pattern></defs>';
  s += '<text class="plan-kunye" x="450" y="322" text-anchor="middle">KORİDOR</text>';
  for (const o of PLAN) {
    const oda = odaBilgi(o.id);
    const ad = o.ad || oda.ad, h = o.y2 - o.y, cx = o.x + o.g / 2;
    const dosyalar = DOSYALAR.filter((d) => d.oda === o.id);
    const cozulen = dosyalar.filter((d) => maske & (1 << d.bit)).length;
    const kapanis = dosyalar.find((d) => d.tur === 'kapanis');
    const kapali = kapanis && (maske & (1 << kapanis.bit));
    const kilitli = o.id === 'arsiv' && !arsivAcik;
    let ic = `<rect class="oda-zemin${kilitli ? ' kilitli' : ''}" x="${o.x}" y="${o.y}" width="${o.g}" height="${h}"/>`;
    if (kilitli) ic += `<rect x="${o.x}" y="${o.y}" width="${o.g}" height="${h}" fill="url(#tarama)"/>`;
    ic += odaSimgesi(o.id, cx, o.y + 86, 1);
    ic += `<text class="oda-ad" x="${cx}" y="${o.y + 166}" text-anchor="middle">${ad}</text>`;
    if (oda) ic += `<text class="oda-no" x="${o.x + 16}" y="${o.y + 32}">ŞUBE ${oda.no}</text><text class="oda-ilerleme" x="${cx}" y="${o.y + 200}" text-anchor="middle">${cozulen} / ${dosyalar.length} dosya</text>`;
    if (o.id === 'ogretmen') ic += `<text class="oda-ilerleme" x="${cx}" y="${o.y + 200}" text-anchor="middle">ders akışları · föyler</text>`;
    if (o.id === 'lobi') ic += `<circle class="buradasin" cx="${o.x + 46}" cy="${o.y + 96}" r="9"/><text class="buradasin-yazi" x="${o.x + 46}" y="${o.y + 70}" text-anchor="middle">buradasın</text><text class="oda-ilerleme" x="${cx}" y="${o.y + 200}" text-anchor="middle">${(maske & 1) ? 'giriş dosyası çözüldü' : 'giriş dosyası açık'}</text>`;
    if (o.id === 'arsiv') ic += `<text class="oda-ilerleme" x="${cx}" y="${o.y + 200}" text-anchor="middle">${kilitli ? 'kilitli · 4 oda bekliyor' : 'açıldı · aşağıdaki nota bak'}</text>`;
    if (kapali) ic += `<g class="plan-damga" transform="rotate(-10 ${o.x + o.g - 70} ${o.y + 40})"><rect x="${o.x + o.g - 132}" y="${o.y + 22}" width="124" height="38" rx="5"/><rect x="${o.x + o.g - 127}" y="${o.y + 27}" width="114" height="28" rx="3"/><text x="${o.x + o.g - 70}" y="${o.y + 49}" text-anchor="middle">ÇÖZÜLDÜ</text></g>`;
    const etiket = ad + (oda ? ': ' + cozulen + ' / ' + dosyalar.length + ' dosya çözüldü' + (kapali ? ', şube kapatıldı' : '') : '') + (kilitli ? ': kilitli' : '');
    const yol = o.yol || (oda && oda.yol) || (o.id === 'arsiv' ? '#arsiv-notu' : null);
    s += yol && o.id !== 'lobi' ? `<a class="oda-bag-svg" href="${yol}"${yol.startsWith('#') ? '' : ' data-daire'} aria-label="${etiket}">${ic}</a>` : `<g aria-label="${etiket}" role="img">${ic}</g>`;
  }
  // Duvarlar: dış çerçeve, ara duvarlar, kapı boşlukları
  s += '<rect class="duvar" x="20" y="20" width="860" height="600"/>';
  s += '<path class="duvar" d="M306 20 V280 M594 20 V280 M306 360 V620 M594 360 V620"/>';
  const kapilar = [256, 543, 830];   // kapılar odaların sağ kenarına yakın: yazıların üstüne binmesin
  let ust = 'M20 280', alt = 'M20 360';
  for (const k of kapilar) { ust += ` H${k - 34} M${k + 34} 280`; alt += ` H${k - 34} M${k + 34} 360`; }
  s += `<path class="duvar" d="${ust} H880"/><path class="duvar" d="${alt} H880"/>`;
  for (const k of kapilar) {   // kapı kanatları: çeyrek yay
    s += `<path class="kapi" d="M${k - 34} 280 l0 -60 M${k - 34} 220 A60 60 0 0 1 ${k + 26} 280"/>`;
    s += `<path class="kapi" d="M${k + 34} 360 l0 60 M${k + 34} 420 A60 60 0 0 1 ${k - 26} 360"/>`;
  }
  s += '<rect class="giris-bosluk" x="416" y="612" width="68" height="16"/><path class="ck kalin" d="M450 672 V636 M440 648 l10 -12 l10 12"/><text class="plan-kunye" x="472" y="664">GİRİŞ</text>';
  planSvg.querySelectorAll(':scope > :not(title)').forEach((x) => x.remove());
  planSvg.insertAdjacentHTML('beforeend', s);
  baglantilariGuncelle();
}
let arsivAcik = false;

/* ---------- Durum değişince her şeyi yeniden çiz ---------- */
let oncekiRutbe = null;
dinle((maske) => {
  const s = sayim(maske);
  const r = rutbeSirasi(maske);
  $('#muhurRutbe').textContent = RUTBELER[r].ad;
  $('#muhurSayi').textContent = s.toplam + ' / ' + BIT_SAYISI + ' DOSYA';
  $('#muhur').setAttribute('aria-label', 'Sicil mührü: rütbe ' + RUTBELER[r].ad + ', ' + s.toplam + ' dosya çözüldü');
  basamaklar.querySelectorAll('li').forEach((li, i) => li.setAttribute('aria-current', String(i === r)));
  const yukseldi = oncekiRutbe !== null && r > oncekiRutbe;
  if (yukseldi) { const d = $('#duyuru'); if (d) d.textContent = 'Tebrikler, yeni rütben: ' + RUTBELER[r].ad + '.'; }
  rozetleriCiz(r, yukseldi);
  oncekiRutbe = r;
  planCiz(maske);

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
    geriBildir(parolaSonuc, { dogru: true, mesaj: 'Doğru! Kapı açıldı. Her satırın ilk harfi: Ş-İ-F-R-E.' }, { girdi: parola });
    if (!cozulduMu(0)) { damgala($('#giris-dosyasi')); coz(0); }
  } else if (g.replace(/Ş/g, 'S').replace(/[İ]/g, 'I') === 'SIFRE') {
    geriBildir(parolaSonuc, { dogru: false, mesaj: 'Çok yaklaştın. Türk alfabesinde Ş ve İ ayrı harflerdir; notun ilk harflerine yeniden bak.' }, { girdi: parola });
  } else {
    geriBildir(parolaSonuc, { dogru: false, mesaj: 'Kapı açılmadı. Notu bir kez daha oku; parola göz önünde ama dikkat çekmiyor.' }, { girdi: parola });
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
  if (!s.tamam) { geriBildir(kodSonuc, { dogru: false, mesaj: hataMetni(s) }, { girdi: kodGirdi }); return; }
  maskeKoy(s.maske);
  const n = sayim(s.maske).toplam;
  geriBildir(kodSonuc, { dogru: true, mesaj: 'Hoş geldin! Sicilin yüklendi: ' + n + ' dosya, rütben ' + RUTBELER[rutbeSirasi(s.maske)].ad + '.' }, { girdi: kodGirdi });
}
$('#kodYukle').addEventListener('click', kodYukle);
kodGirdi.addEventListener('keydown', (e) => { if (e.key === 'Enter') kodYukle(); });

/* ---------- Dairenin sırrı: arşiv notu ----------
   Not sayfada yalnız şifreli hâliyle durur; anahtar doğruysa çarkla aynı modülle çözülür.
   Anahtarın parçaları: Sezar (> 10), Kasa (tek ve < 15), Mürekkep (asal ve 11 değil) → 13. */
const ARSIV_K = 13;
function arsivDene() {
  const g = $('#arsivK').value.trim(), sonuc = $('#arsivSonuc');
  const k = Number(g);
  sonuc.className = 'geri-bildirim';
  if (!g || !Number.isInteger(k)) { sonuc.textContent = 'Anahtar bir tam sayı olmalı.'; return; }
  if (mod(k, 29) !== ARSIV_K) {
    const deneme = sezarCoz($('#arsivSifreli').textContent, k).slice(0, 28);
    geriBildir(sonuc, { dogru: false, mesaj: 'Kilit açılmadı. Bu anahtarla not şöyle başlıyor: “' + deneme + '…” Anlamlı mı?' }, { girdi: $('#arsivK') });
    return;
  }
  geriBildir(sonuc, { dogru: true, mesaj: 'Klik! Anahtar ' + ARSIV_K + '. Arşivin kapısı açıldı.' }, { girdi: $('#arsivK') });
  setTimeout(() => cal('acildi'), 350);
  $('#arsivMetin').textContent = sezarCoz($('#arsivSifreli').textContent, ARSIV_K);
  $('#arsivAcik').hidden = false;
  damgala($('#arsiv-notu'));
  arsivAcik = true;
  planCiz(maskeAl());
}
$('#arsivDene').addEventListener('click', arsivDene);
$('#arsivK').addEventListener('keydown', (e) => { if (e.key === 'Enter') arsivDene(); });

seviyeBaslat();
sunumBaslat();
baglantilariGuncelle();

// Odadan "Lobideki nota git" ile gelindiyse arşiv notuna kaydır (?git=arsiv; ilerleme # içinde kalır)
if (new URLSearchParams(location.search).get('git') === 'arsiv') {
  // adresi sayfa geçiş efekti bittikten sonra temizle (efekt sırasında adres değişirse tarayıcı efekti iptal eder)
  setTimeout(() => { const u = new URL(location.href); u.searchParams.delete('git'); history.replaceState(history.state, '', u.href); }, 700);
  requestAnimationFrame(() => { $('#arsiv-notu').scrollIntoView({ block: 'start' }); $('#arsivK').focus({ preventScroll: true }); });
}

/* ---------- Çevrimdışı çalışma: bir kez yüklenince internetsiz açılır ---------- */
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});
