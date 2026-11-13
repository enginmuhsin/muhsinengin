/* =====================================================================
   ODA 2 · KASA SOYGUNU — kriptoloji/kasa/kasa.js
   Serbest şifre alanı YOK: kilitler hazır listeden seçilir.
   Bütün sayılar cekirdek/entropi.js ile hesaplanır; tek gerçek ölçüm Web Crypto SHA-256'dır.
   ===================================================================== */
import { KILITLER, SALDIRGANLAR, bit, uzay, tumSure, ortalamaSure, sureYaz, sayiYaz, bilimsel, OLCEK } from '../cekirdek/entropi.js';
import { yilKasasi, kasayiKir, hizOlc } from '../cekirdek/kaba-kuvvet.js';
import { gorevBagla } from '../bilesenler/gorev.js';
import { seviyeBaslat } from '../bilesenler/seviye.js';
import { sunumBaslat } from '../bilesenler/sunum.js';
import { baglantilariGuncelle } from '../bilesenler/durum.js';
import { cal } from '../bilesenler/ses.js';

const $ = (s) => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const el = (ad, oz = {}, ust) => { const e = document.createElementNS(NS, ad); for (const [k, v] of Object.entries(oz)) e.setAttribute(k, v); if (ust) ust.appendChild(e); return e; };

const saldirganlar = SALDIRGANLAR.map((s) => ({ ...s }));
let kilit = KILITLER.find((k) => k.id === 'yil');
let saldirgan = saldirganlar.find((s) => s.id === 'gpu');
let olculenHiz = null;
let sonDeneme = null;

/* ---------- Seçiciler ---------- */
function seciciDoldur(kap, liste, secili, sec) {
  kap.querySelectorAll('button').forEach((b) => b.remove());
  for (const x of liste) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(x.id === secili.id));
    b.innerHTML = '<span></span>';
    b.firstChild.textContent = x.ad;
    if (x.aciklamaKisa || x.aciklama) { const s = document.createElement('small'); s.textContent = x.aciklamaKisa || x.aciklama; b.appendChild(s); }
    b.addEventListener('click', () => { kap.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', String(y === b))); sec(x); });
    kap.appendChild(b);
  }
}
const kilitKap = $('#kilitSec'), saldirganKap = $('#saldirganSec');
seciciDoldur(kilitKap, KILITLER, kilit, (x) => { kilit = x; ciz(); cal('surgu'); });   // kilit değişince sürgüler sürülür
function saldirganlariCiz() {
  const liste = saldirganlar.map((s) => ({ ...s, aciklamaKisa: '≈ ' + bilimsel(s.hiz) + ' deneme/sn' }));
  seciciDoldur(saldirganKap, liste, saldirgan, (x) => { saldirgan = saldirganlar.find((s) => s.id === x.id); ciz(); cal('tik'); });
}
saldirganlariCiz();

/* ---------- Kasa çizimi: her 8 bit için bir sürgü ---------- */
function kasaCiz(b) {
  const svg = $('#kasaCizim');
  svg.querySelectorAll(':scope > :not(title)').forEach((x) => x.remove());
  el('rect', { x: 20, y: 14, width: 200, height: 186, rx: 10, class: 'kasa-govde' }, svg);
  el('rect', { x: 36, y: 30, width: 168, height: 154, rx: 6, class: 'kasa-kapak' }, svg);
  el('circle', { cx: 120, cy: 107, r: 34, class: 'kasa-kadran' }, svg);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    el('line', { x1: 120 + 28 * Math.sin(a), y1: 107 - 28 * Math.cos(a), x2: 120 + 34 * Math.sin(a), y2: 107 - 34 * Math.cos(a), class: 'kasa-centik' }, svg);
  }
  el('circle', { cx: 120, cy: 107, r: 6, class: 'kasa-centik' }, svg);
  const surgu = Math.min(16, Math.max(1, Math.round(b / 8)));
  for (let i = 0; i < surgu; i++) {
    const sag = i % 2 === 0, sira = Math.floor(i / 2);
    const y = 40 + sira * 18;
    el('rect', { x: sag ? 204 : 6, y, width: 30, height: 8, rx: 3, class: 'kasa-surgu' }, svg);
  }
  $('#kasaBaslik').textContent = 'Kasa: ' + surgu + ' sürgü (her sürgü yaklaşık 8 bit)';
}

/* ---------- Logaritmik zaman çizgisi ---------- */
const ZMIN = -3, ZMAX = 19;   // 10⁻³ s … 10¹⁹ s
const zx = (sn) => 40 + (Math.log10(Math.max(sn, 10 ** ZMIN)) - ZMIN) / (ZMAX - ZMIN) * 920;
const isaretler = [
  { sn: OLCEK.GOZ, ad: 'göz açıp kapayıncaya', ust: true },
  { sn: OLCEK.GUN, ad: 'bir gün' },
  { sn: OLCEK.YIL, ad: 'bir yıl', ust: true },
  { sn: OLCEK.OMUR, ad: 'bir insan ömrü' },
  { sn: OLCEK.EVREN, ad: 'evrenin yaşı', ust: true },
];
function zamanCiz(sn) {
  const svg = $('#zamanCizgisi');
  svg.querySelectorAll(':scope > :not(title)').forEach((x) => x.remove());
  el('line', { x1: 40, y1: 70, x2: 960, y2: 70, class: 'zc-eksen' }, svg);
  for (let u = ZMIN; u <= ZMAX; u++) el('line', { x1: zx(10 ** u), y1: 66, x2: zx(10 ** u), y2: 74, class: 'zc-kucuk' }, svg);
  for (const m of isaretler) {
    const x = zx(m.sn);
    el('line', { x1: x, y1: m.ust ? 50 : 70, x2: x, y2: m.ust ? 70 : 90, class: 'zc-buyuk' }, svg);
    el('text', { x, y: m.ust ? 42 : 106, 'text-anchor': 'middle', class: 'zc-yazi' }, svg).textContent = m.ad;
  }
  const tasti = sn > 10 ** ZMAX;
  const x = Math.min(zx(sn), 966);
  el('path', { d: `M${x} 70 l-9 -22 h18 Z`, class: 'zc-isaret' }, svg);
  el('text', { x: Math.min(Math.max(x, 70), 930), y: 18, 'text-anchor': 'middle', class: 'zc-isaret-yazi' }, svg)
    .textContent = tasti ? 'çizginin dışında: evrenin yaşından çok daha uzun' : sureYaz(sn);
}

/* ---------- Sonuç ---------- */
function ciz() {
  const b = bit(kilit), U = uzay(kilit);
  $('#sUzay').textContent = U < 1e6 ? sayiYaz(U) : '≈ ' + bilimsel(U);
  $('#sBit').textContent = '≈ ' + sayiYaz(b, 1) + ' bit';
  $('#sTum').textContent = sureYaz(tumSure(kilit, saldirgan.hiz));
  $('#sOrt').textContent = sureYaz(ortalamaSure(kilit, saldirgan.hiz));
  $('#saldirganAciklama').textContent = saldirgan.aciklama;
  kasaCiz(b);
  zamanCiz(tumSure(kilit, saldirgan.hiz));
}
ciz();

/* ---------- Gerçek ölçüm ---------- */
/** Kasa çok hızlı açılır (milisaniyeler); öğrenci görebilsin diye denenen yıllar sayaç gibi yeniden oynatılır.
    "Hareketi azalt" açıksa doğrudan sonuç gösterilir. */
function yilSayaci(s) {
  const kutu = $('#sayacKutu'), pencere = $('#yilSayac'), damga = $('#sayacDamga');
  kutu.hidden = false; damga.hidden = true;
  const son = Number(s.bulunan);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { pencere.textContent = son; damga.hidden = false; cal('acildi'); return Promise.resolve(); }
  const sure = Math.min(1600, 300 + s.deneme * 12), t0 = performance.now();
  return new Promise((bitti) => {
    const adim = (t) => {
      const o = Math.min(1, (t - t0) / sure);
      const yil = 1900 + Math.round((son - 1900) * (1 - (1 - o) ** 2));
      if (String(yil) !== pencere.textContent) cal('tik');      // şifre çarkı gibi her yılda bir tık
      pencere.textContent = yil;
      if (o < 1) requestAnimationFrame(adim); else { damga.hidden = false; cal('acildi'); bitti(); }
    };
    requestAnimationFrame(adim);
  });
}
const olcBasla = $('#olcBasla'), olcDurum = $('#olcDurum'), olcHedef = $('#olcHedef'), olcSonuc = $('#olcSonuc');
olcBasla.addEventListener('click', async () => {
  if (!(globalThis.crypto && crypto.subtle)) {
    olcDurum.textContent = 'Bu tarayıcı ölçüm için gereken Web Crypto özelliğini sunmuyor (sayfa güvenli bağlantıyla açılmamış olabilir).';
    return;
  }
  olcBasla.disabled = true;
  olcSonuc.hidden = true;
  olcDurum.textContent = '1/3 · Daire rastgele bir yıl seçip özetini kasaya yazıyor…';
  const kasa = await yilKasasi();
  olcHedef.hidden = false;
  olcHedef.textContent = 'Kasadaki özet: ' + kasa.hedef.slice(0, 32) + '…';
  olcDurum.textContent = '2/3 · 1900\'den başlayarak her yılın özeti hesaplanıyor…';
  const s = await kasayiKir(kasa, { ilerleme: (d, y) => { olcDurum.textContent = '2/3 · Denenen: ' + y + ' (' + d + '. deneme)'; } });
  await yilSayaci(s);
  olcDurum.textContent = '3/3 · Cihazının hızı bir saniye boyunca ölçülüyor…';
  const hiz = await hizOlc(1000);
  olculenHiz = hiz;
  sonDeneme = s.deneme;
  olcSonuc.hidden = false;
  olcSonuc.innerHTML = '';
  const satir = (metin) => { const p = document.createElement('span'); p.textContent = metin; olcSonuc.appendChild(p); };
  satir('Kasa açıldı: yıl ' + s.bulunan + ', ' + s.deneme + '. denemede (' + sayiYaz(s.ms, 1) + ' ms).');
  satir('Senin cihazın: ≈ ' + sayiYaz(Math.round(hiz)) + ' deneme/saniye.');
  olcDurum.textContent = 'Ölçüm bitti. Yeniden denersen daire başka bir yıl seçer.';
  const ben = saldirganlar.find((x) => x.id === 'cihaz');
  if (ben) ben.hiz = hiz;
  else saldirganlar.push({ id: 'cihaz', ad: 'Senin cihazın (ölçüldü)', hiz, aciklama: 'Bu tarayıcıda az önce ölçülen gerçek hız. Ekran kartlı saldırgan bundan çok daha hızlıdır.' });
  saldirganlariCiz();
  ciz();
  olcBasla.disabled = false;
  olcBasla.textContent = 'Yeniden ölç';
});

/* ---------- Görevler ---------- */
const bolum = (bit) => document.querySelector(`[data-dosya="${bit}"]`);
const sayi = (g) => Number(String(g).trim().replace(',', '.'));

gorevBagla(bolum(8), (s) => ({
  a: { dogru: false, mesaj: '3 haneli kilitte 1000 olasılık var. Doğum yılında kaç tane var?' },
  b: { dogru: true, mesaj: 'Doğru: yalnız 126 olasılık. 3 haneli kilitten (1000) bile zayıf. “Gizli” olması onu güçlü yapmaz.' },
  c: { dogru: false, mesaj: '4 haneli PIN 10 000 olasılık. Daha azı var mı?' },
}[s]));

gorevBagla(bolum(9), (g) => {
  if (sonDeneme === null) return { dogru: false, mesaj: 'Önce laboratuvardaki “Kasayı kır ve hızımı ölç” düğmesine bas.' };
  return sayi(g) === sonDeneme
    ? { dogru: true, mesaj: sonDeneme + ' deneme. 126 yılın hepsi bir saniyenin çok altında bitti.' }
    : { dogru: false, mesaj: 'Ölçüm sonucuna yeniden bak: “… denemede” yazan sayı.' };
});

gorevBagla(bolum(10), (s) => ({
  a: { dogru: false, mesaj: 'PIN, ekran kartlı hırsıza anında açılır.' },
  b: { dogru: false, mesaj: '8 rastgele harf yaklaşık 50 saniye dayanır.' },
  c: { dogru: false, mesaj: 'Sembol 32 kat güç katar: 50 saniye → yaklaşık 27 dakika. Bir yıla çok uzak.' },
  d: { dogru: true, mesaj: '5 rastgele kelime ≈ 90 yıl dayanır. Uzun ve rastgele: ikisi birlikte gerekir.' },
}[s]));

gorevBagla(bolum(11), (g) => {
  const x = sayi(g);
  if (Math.abs(x - 38.9) <= 0.15) return { dogru: true, mesaj: '8 × 4,858 ≈ 38,9 bit.' };
  if (Math.abs(x - 4.86) < 0.1) return { dogru: false, mesaj: 'Bu, tek harfin entropisi. 8 harf var: L = 8.' };
  return { dogru: false, mesaj: 'Tutmadı. L = 8 ve N = 29: 8 · log₂ 29.' };
});

gorevBagla(bolum(12), (g) => {
  const x = sayi(g);
  if (Math.round(x) === 20) return { dogru: true, mesaj: 'log₂(10⁶) ≈ 19,9 ≈ 20 bit. Yavaşlatma, şifreye 20 bit eklemek kadar güç katar.' };
  if (x === 6) return { dogru: false, mesaj: '6, 10\'un üssü. Soru 2\'nin kaçıncı kuvveti olduğunu soruyor.' };
  return { dogru: false, mesaj: 'İpucuya bak: 10⁶ = (10³)² ≈ (2¹⁰)².' };
});

gorevBagla(bolum(13), (g) => {
  const x = sayi(g);
  if (x === 45) return { dogru: true, mesaj: 'Ortalama yarısı: 45 yıl. Hırsız şanslıysa ilk günde, şanssızsa 90 yılda bulur.' };
  return { dogru: false, mesaj: 'Hırsız doğru anahtara ortalama yolun yarısında rastlar.' };
});

gorevBagla(bolum(14), (s) => ({
  a: { dogru: false, mesaj: 'Tahmin zorluğu değil, olasılık sayısı belirler: 32 sembol yalnız 32 kat (≈ 5 bit) ekler.' },
  b: { dogru: true, mesaj: 'Evet. Bir kelime ≈ 12,9 bit (7776 kat), bir sembol ≈ 5 bit (32 kat) ekler. Uzunluk + rastgelelik kazanır.' },
  c: { dogru: false, mesaj: 'Uzunluk aynı artsa da her birimin kaç olasılıktan seçildiği farklı: 7776 ile 32.' },
  d: { dogru: false, mesaj: '“Kırılamaz” şifre yoktur; yalnız denenmesi çok uzun süren şifre vardır.' },
}[s]));

seviyeBaslat();
sunumBaslat();
baglantilariGuncelle();
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
