/* =====================================================================
   ENTROPİ — kriptoloji/cekirdek/entropi.js
   H = L · log₂(N)   (L sembol, her biri N olasılıktan rastgele ve bağımsız seçilirse)
   Bütün hesaplar burada; sayfadaki tablo ELLE yazılmaz, bu fonksiyonlarla üretilir.
   Büyük sayılar için log₂ kullanılır: 7776⁵ ≈ 2,8·10¹⁹ Number'a sığar ama tam değil; süre ve bit için yeterli.
   ===================================================================== */

/** Kilit türleri. uzay = olası anahtar sayısı (Number). */
export const KILITLER = Object.freeze([
  { id: 'rakam3', ad: '3 haneli rakam kilidi', N: 10, L: 3, aciklama: '000–999' },
  { id: 'yil', ad: 'Doğum yılı', N: 126, L: 1, aciklama: '1900–2025 arası bir yıl' },
  { id: 'pin4', ad: '4 haneli PIN', N: 10, L: 4, aciklama: '0000–9999' },
  { id: 'harf8', ad: '8 küçük Türkçe harf', N: 29, L: 8, aciklama: 'rastgele seçilmiş, örneğin “çkeğzıbu”' },
  { id: 'harf8s', ad: '8 harf + 1 sembol', N: null, L: null, aciklama: '8 rastgele harfin sonuna 32 sembolden biri' },
  { id: 'kelime5', ad: '5 rastgele kelime', N: 7776, L: 5, aciklama: '7776 kelimelik listeden zarla seçilmiş' },
  { id: 'kelime6', ad: '6 rastgele kelime', N: 7776, L: 6, aciklama: 'bir kelime daha' },
]);

/** Kilidin olası anahtar sayısının log₂'si (= entropi, bit). */
export function bit(kilit) {
  if (kilit.id === 'harf8s') return 8 * Math.log2(29) + Math.log2(32);
  return kilit.L * Math.log2(kilit.N);
}

/** Olası anahtar sayısı (yaklaşık, Number). */
export function uzay(kilit) {
  if (kilit.id === 'harf8s') return 29 ** 8 * 32;
  return kilit.N ** kilit.L;   // doğrudan üs: 2^(log₂ x) yuvarlama hatası yapar (10⁴ → 9999,99…)
}

/** H = L · log₂(N) */
export function entropi(N, L) { return L * Math.log2(N); }

/** Saldırgan modelleri. Hızlar VARSAYIMDIR (deneme/saniye) — sayfada öyle yazılır. [doğrula] */
export const SALDIRGANLAR = Object.freeze([
  { id: 'cevrimici', ad: 'Çevrim içi, yavaşlatılmış', hiz: 10, aciklama: 'Kapıdaki görevli her yanlış denemeden sonra bekletir; saniyede yaklaşık 10 deneme.' },
  { id: 'kdf', ad: 'Çevrim dışı, yavaş anahtar türetme', hiz: 1e4, aciklama: 'Şifre özeti çalınmış ama özet bilerek yavaş hesaplanıyor (yavaş KDF); saniyede yaklaşık 10⁴ deneme.' },
  { id: 'gpu', ad: 'Çevrim dışı, hızlı özet + GPU', hiz: 1e10, aciklama: 'Şifre özeti çalınmış, özet hızlı (ör. tek SHA-256), ekran kartıyla saniyede yaklaşık 10¹⁰ deneme.' },
]);

/** Tüm uzayın taranma süresi (saniye). Ortalama bunun yarısıdır. */
export function tumSure(kilit, hiz) { return uzay(kilit) / hiz; }
export function ortalamaSure(kilit, hiz) { return tumSure(kilit, hiz) / 2; }

const YIL = 365.25 * 24 * 3600;
export const OLCEK = Object.freeze({ YIL, GUN: 86400, OMUR: 80 * YIL, EVREN: 13.8e9 * YIL, GOZ: 0.3 });

/** Türkçe sayı biçimi: 1234567 → "1 234 567", 3.25 → "3,25". */
export function sayiYaz(x, basamak = 0) {
  if (!Number.isFinite(x)) return '∞';
  const s = x.toFixed(basamak).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return s.join(',');
}

/** Bilimsel yazım: 5.0e11 → "5,0·10¹¹" */
export function bilimsel(x, basamak = 1) {
  if (x < 1e6) return sayiYaz(x, 0);
  const us = Math.floor(Math.log10(x));
  const m = x / 10 ** us;
  const ust = String(us).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]).join('');
  return m.toFixed(basamak).replace('.', ',') + '·10' + ust;
}

/** Süreyi insanca yazar. */
export function sureYaz(sn) {
  if (sn < 0.001) return 'anında';
  if (sn < 1) return '1 saniyeden kısa';
  if (sn < 90) return '≈ ' + sayiYaz(sn, sn < 10 ? 1 : 0) + ' saniye';
  if (sn < 5400) return '≈ ' + sayiYaz(sn / 60, 0) + ' dakika';
  if (sn < 2 * 86400) return '≈ ' + sayiYaz(sn / 3600, 0) + ' saat';
  if (sn < 60 * 86400) return '≈ ' + sayiYaz(sn / 86400, 0) + ' gün';
  const y = sn / YIL;
  if (y < 1) return '≈ ' + sayiYaz(sn / (30.44 * 86400), 0) + ' ay';
  if (y < 1e6) return '≈ ' + sayiYaz(y, y < 10 ? 1 : 0) + ' yıl';
  if (y < 1e9) return '≈ ' + sayiYaz(y / 1e6, 0) + ' milyon yıl';
  if (y < 1e12) return '≈ ' + sayiYaz(y / 1e9, 1) + ' milyar yıl';
  return '≈ ' + bilimsel(y) + ' yıl';
}
