/* =====================================================================
   STEGANOGRAFİ (LSB) — kriptoloji/cekirdek/steg.js
   Saf fonksiyonlar: RGBA piksel dizisi (Uint8ClampedArray / Uint8Array) üzerinde çalışır, DOM'a dokunmaz.

   Biçim:
   • Mesaj UTF-8 baytlara çevrilir.
   • Önce 32 bitlik UZUNLUK BAŞLIĞI (bayt sayısı, büyük basamak önce), ardından mesaj bitleri yazılır.
   • Bitler sırayla R, G, B kanallarının EN DÜŞÜK ANLAMLI BİTİNE (LSB) gider; alfa kanalı kullanılmaz.
   • Bir baytın bitleri soldan sağa (en anlamlı bit önce) yazılır.
   Kapasite: G × Y × 3 bit; bunun 32 biti başlığa gider.
   ===================================================================== */

const BASLIK = 32;

/** Görselin toplam bit kapasitesi (başlık dahil). */
export function kapasiteBit(genislik, yukseklik) { return genislik * yukseklik * 3; }

/** Mesaja ayrılabilecek en çok bayt. */
export function kapasiteBayt(genislik, yukseklik) { return Math.max(0, Math.floor((kapasiteBit(genislik, yukseklik) - BASLIK) / 8)); }

/** n. veri bitinin RGBA dizisindeki konumu (alfa atlanır). */
const konum = (n) => Math.floor(n / 3) * 4 + (n % 3);

export class KapasiteHatasi extends Error {
  constructor(gerekli, kapasite) { super(`Mesaj ${gerekli} bayt; görsel en çok ${kapasite} bayt saklayabilir.`); this.gerekli = gerekli; this.kapasite = kapasite; }
}

/**
 * Baytları gizler. Girdi dizisini DEĞİŞTİRMEZ; yeni bir dizi döndürür.
 * piksel: RGBA dizisi (uzunluk = 4·G·Y)
 */
export function baytGizle(piksel, bayt) {
  const pikselSayisi = piksel.length / 4;
  const kap = Math.max(0, Math.floor((pikselSayisi * 3 - BASLIK) / 8));
  if (bayt.length > kap) throw new KapasiteHatasi(bayt.length, kap);
  const cikti = new Uint8ClampedArray(piksel);
  let n = 0;
  const yaz = (bit) => { const i = konum(n++); cikti[i] = (cikti[i] & 0xFE) | bit; };
  for (let b = BASLIK - 1; b >= 0; b--) yaz(Math.floor(bayt.length / 2 ** b) & 1);
  for (const x of bayt) for (let b = 7; b >= 0; b--) yaz((x >> b) & 1);
  return cikti;
}

/** Gizli baytları okur. Başlık geçersizse (kapasiteyi aşıyorsa) null döner. */
export function baytCoz(piksel) {
  const pikselSayisi = piksel.length / 4;
  const toplam = pikselSayisi * 3;
  if (toplam < BASLIK) return null;
  let n = 0;
  const oku = () => piksel[konum(n++)] & 1;
  let uzunluk = 0;
  for (let b = 0; b < BASLIK; b++) uzunluk = uzunluk * 2 + oku();
  if (uzunluk > Math.floor((toplam - BASLIK) / 8)) return null;
  const bayt = new Uint8Array(uzunluk);
  for (let i = 0; i < uzunluk; i++) { let x = 0; for (let b = 0; b < 8; b++) x = (x << 1) | oku(); bayt[i] = x; }
  return bayt;
}

/** Metni gizler (UTF-8). */
export function metinGizle(piksel, metin) { return baytGizle(piksel, new TextEncoder().encode(String(metin).normalize('NFC'))); }

/**
 * Metni çözer. Dönen: { tamam: true, metin } ya da { tamam: false, neden: 'baslik' | 'utf8' }.
 * 'baslik': uzunluk başlığı anlamsız → büyük olasılıkla gizli mesaj yok (ya da görsel bozulmuş).
 * 'utf8'  : baytlar geçerli UTF-8 değil → mesaj bozulmuş (ör. JPEG'e çevrilmiş).
 */
export function metinCoz(piksel) {
  const b = baytCoz(piksel);
  if (!b) return { tamam: false, neden: 'baslik' };
  try { return { tamam: true, metin: new TextDecoder('utf-8', { fatal: true }).decode(b), bayt: b.length }; }
  catch { return { tamam: false, neden: 'utf8', bayt: b.length }; }
}

/**
 * Bit düzlemi: her pikselin R, G, B en düşük bitlerinden siyah-beyaz bir görüntü.
 * Üç LSB'nin toplamı 0–3 → 0, 85, 170, 255 gri tonu. Düz renkli bir çizimde bu düzlem sakin görünür;
 * gizli mesajın yazıldığı bölge "kar" gibi karışık belirir.
 */
export function bitDuzlemi(piksel) {
  const c = new Uint8ClampedArray(piksel.length);
  for (let i = 0; i < piksel.length; i += 4) {
    const v = ((piksel[i] & 1) + (piksel[i + 1] & 1) + (piksel[i + 2] & 1)) * 85;
    c[i] = c[i + 1] = c[i + 2] = v; c[i + 3] = 255;
  }
  return c;
}

/** İki piksel dizisi arasındaki en büyük kanal farkı (R, G, B). */
export function enBuyukFark(a, b) {
  let m = 0;
  for (let i = 0; i < a.length; i++) if (i % 4 !== 3) m = Math.max(m, Math.abs(a[i] - b[i]));
  return m;
}

/** Değişen kanal sayısı (R, G, B). */
export function degisenKanal(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) if (i % 4 !== 3 && a[i] !== b[i]) s++;
  return s;
}

/** Sayıyı 8 bitlik ikili yazıya çevirir: 200 → "11001000" */
export const ikili = (x) => x.toString(2).padStart(8, '0');
