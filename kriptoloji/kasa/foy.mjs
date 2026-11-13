/* Kasa föyü: cevap tablosu cekirdek/entropi.mjs ile üretilir (elle yazılmaz). */
import { KILITLER, bit, uzay, tumSure, sureYaz, sayiYaz, bilimsel } from '../cekirdek/entropi.mjs';
import { baglantilariGuncelle } from '../bilesenler/durum.mjs';

const tb = document.querySelector('#cevapTablo tbody');
for (const id of ['rakam3', 'yil', 'pin4', 'harf8', 'kelime5']) {
  const k = KILITLER.find((x) => x.id === id);
  const tr = document.createElement('tr');
  for (const h of [k.ad, uzay(k) < 1e6 ? sayiYaz(uzay(k)) : bilimsel(uzay(k)), sayiYaz(bit(k), 1) + ' bit', sureYaz(tumSure(k, 1e4)), sureYaz(tumSure(k, 1e10))]) {
    const td = document.createElement('td'); td.textContent = h; tr.appendChild(td);
  }
  tb.appendChild(tr);
}
const cevaplar = [
  'Doğum yılı: yalnız 126 olasılık (3 haneli kilitten bile az). Gizlilik değil, olasılık sayısı korur; yıl çoğu zaman tahmin edilebilir ya da bilinir.',
  '6⁵ = 7776.',
  'Kelime: 7776 kat (≈ 12,9 bit); sembol: 32 kat (5 bit).',
  'Tablodaki “Entropi” sütunu.',
  'log₂(10⁶) ≈ 19,9 ≈ 20 bit.',
  '45 yıl: hırsız doğru anahtara ortalama yolun yarısında rastlar.',
  'Formül her karakterin rastgele ve bağımsız seçildiğini varsayar. “ankara” bir sözlük kelimesi, “1923” bilinen bir yıl: saldırgan bunları ilk dener.',
];
const ol = document.getElementById('cevaplar');
cevaplar.forEach((c) => { const li = document.createElement('li'); li.textContent = c; ol.appendChild(li); });
document.getElementById('yazdir').addEventListener('click', () => window.print());
baglantilariGuncelle();
