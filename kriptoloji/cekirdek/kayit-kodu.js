/* =====================================================================
   KAYIT KODU — kriptoloji/cekirdek/kayit-kodu.js
   Biçim: KRT-XXXXX-C  (5 veri karakteri + 1 kontrol karakteri)

   ALFABE (31 karakter): 2 3 4 5 6 7 8 9 A B C D E F G H J K M N P Q R S T U V W X Y Z
   Karışabilen 0/O, 1/I/L ve Türkçe I/İ hiç yok. Koda yalnızca bu Latin harfler girer.

   VERİ: n = sürüm · 2²² + maske   (sürüm = 1, maske = çözülen dosyaların bitleri, 22 bit)
         n, 31 tabanında 5 basamakla yazılır (31⁵ = 28 629 151 > 6 · 2²²; sürüm en fazla 6 olabilir).

   KONTROL: c = (1·d₁ + 2·d₂ + 3·d₃ + 4·d₄ + 5·d₅) mod 31
     • 31 asal olduğundan ve ağırlıklar 1–5 sıfır olmadığından TEK karakter hatası hep yakalanır:
       bir basamak Δ kadar değişirse toplam w·Δ değişir; 31 asal, w ve Δ 31'e bölünmez → w·Δ ≢ 0.
     • İki veri karakterinin yer değiştirmesi de hep yakalanır: fark (wᵢ − wⱼ)(dᵢ − dⱼ), iki çarpan da
       31'e bölünmez.
     • Sahteciliği ENGELLEMEZ: formülü bilen herkes geçerli kod üretebilir. Bunun için dijital imza gerekir.
   ===================================================================== */
import { BIT_SAYISI } from './dosyalar.js';

export const ALFABE = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const TABAN = 31;
export const SURUM = 1;
const BASAMAK = 5;
const MASKE_TAVAN = 2 ** BIT_SAYISI;   // 4 194 304

/** Kontrol karakterinin sırası (0–30). basamaklar: 5 sayı. */
export function kontrolDegeri(basamaklar) {
  let t = 0;
  basamaklar.forEach((d, i) => { t += (i + 1) * d; });
  return t % TABAN;
}

/** Maskeden kod üretir. */
export function kodUret(maske, surum = SURUM) {
  if (!Number.isInteger(maske) || maske < 0 || maske >= MASKE_TAVAN) throw new RangeError('maske 0 ile 2^22 − 1 arasında olmalı');
  let n = surum * MASKE_TAVAN + maske;
  const b = new Array(BASAMAK);
  for (let i = BASAMAK - 1; i >= 0; i--) { b[i] = n % TABAN; n = Math.floor(n / TABAN); }
  if (n !== 0) throw new RangeError('sürüm çok büyük');
  const veri = b.map((d) => ALFABE[d]).join('');
  return 'KRT-' + veri + '-' + ALFABE[kontrolDegeri(b)];
}

/**
 * Kodu çözer. Dönen: { tamam: true, maske, surum } ya da { tamam: false, hata }.
 * Kullanıcıya kibar davranır: küçük harf, boşluk, eksik/fazla tire, "KRT" yazılmamış olması sorun değil.
 */
export function kodCoz(girdi) {
  let s = String(girdi ?? '').normalize('NFC');
  // Türkçe klavyede yazılmış olabilecek harfleri Latin karşılığına çevir (ı, i, ş... koda hiç girmez)
  s = s.replace(/[ıiİI]/g, 'I').toUpperCase().replace(/[\s\-–—_.]/g, '');
  if (s.startsWith('KRT')) s = s.slice(3);
  if (s.length === 0) return { tamam: false, hata: 'bos' };
  if (s.length !== BASAMAK + 1) return { tamam: false, hata: 'uzunluk' };
  const yanlis = [...s].filter((c) => !ALFABE.includes(c));
  if (yanlis.length) return { tamam: false, hata: 'karakter', karakterler: [...new Set(yanlis)] };
  const b = [...s.slice(0, BASAMAK)].map((c) => ALFABE.indexOf(c));
  if (ALFABE.indexOf(s[BASAMAK]) !== kontrolDegeri(b)) return { tamam: false, hata: 'kontrol' };
  let n = 0;
  for (const d of b) n = n * TABAN + d;
  const surum = Math.floor(n / MASKE_TAVAN);
  const maske = n % MASKE_TAVAN;
  if (surum !== SURUM) return { tamam: false, hata: 'surum', surum };
  return { tamam: true, maske, surum };
}

/** Hata kodunu kullanıcıya gösterilecek kibar cümleye çevirir. */
export function hataMetni(sonuc) {
  switch (sonuc.hata) {
    case 'bos': return 'Kod alanı boş. Kodunu yazıp yeniden dene.';
    case 'uzunluk': return 'Kod biraz eksik ya da fazla görünüyor. Biçim: KRT-XXXXX-X (5 + 1 karakter).';
    case 'karakter': return 'Kodda olmayan bir karakter var: ' + sonuc.karakterler.join(', ') + '. Kodda 0, 1, O, I ve L hiç kullanılmaz.';
    case 'kontrol': return 'Kontrol karakteri tutmadı; büyük olasılıkla bir harf yanlış yazıldı. Kodu yeniden kontrol eder misin?';
    case 'surum': return 'Bu kod dairenin başka bir sürümüne ait.';
    default: return 'Kod okunamadı.';
  }
}
