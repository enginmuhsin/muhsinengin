/* =====================================================================
   TÜRK ALFABESİ — kriptoloji/cekirdek/turkce-alfabe.mjs
   Şifre Dairesi'nin bütün odaları bu modülü kullanır. Saf fonksiyonlar; DOM'a dokunmaz.
   Test: node --test testler/kriptoloji/

   • 29 harf, 0'dan 28'e: A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z
   • Büyük/küçük dönüşümü açık eşlemeyle yapılır (i ↔ İ, ı ↔ I). toUpperCase()/toLowerCase()
     kullanılmaz: tarayıcının diline göre İ/ı'yı bozabilir.
   • Girdi önce NFC'ye getirilir. "i" + birleşik nokta (U+0307) tek "i" olur; "I" + U+0307 → "İ".
   • Alfabe dışı karakterler (boşluk, rakam, noktalama, Q/W/X, emoji) olduğu gibi geçer.
   ===================================================================== */

export const BUYUK = Object.freeze(['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H', 'I', 'İ', 'J', 'K', 'L',
  'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z']);
export const KUCUK = Object.freeze(['a', 'b', 'c', 'ç', 'd', 'e', 'f', 'g', 'ğ', 'h', 'ı', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'ö', 'p', 'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z']);
export const N = 29;

const SIRA = new Map();
BUYUK.forEach((h, i) => SIRA.set(h, { i, buyuk: true }));
KUCUK.forEach((h, i) => SIRA.set(h, { i, buyuk: false }));

/** Metni NFC'ye getirir; ayrık noktalı i'leri düzeltir. */
export function normalle(metin) {
  return String(metin ?? '')
    .normalize('NFC')
    .replace(/İ/g, 'İ')     // büyük I + birleşik nokta → İ
    .replace(/i̇/g, 'i');    // küçük i + fazladan nokta → i
}

/** Tek karakterin alfabe sırası (0–28) ya da -1. */
export function sira(harf) {
  const k = SIRA.get(harf);
  return k ? k.i : -1;
}

/** Karakter Türk alfabesinde mi? */
export function alfabedeMi(harf) { return SIRA.has(harf); }

/** Karakter büyük harf mi? Alfabe dışıysa null. */
export function buyukMu(harf) {
  const k = SIRA.get(harf);
  return k ? k.buyuk : null;
}

/** Sıradan harf: buyuk=true ise büyük, değilse küçük. Sıra mod 29 alınır. */
export function harf(i, buyuk = true) {
  const j = mod(i, N);
  return buyuk ? BUYUK[j] : KUCUK[j];
}

/** Türkçe büyük harf (alfabe dışı karakterler değişmez; q/w/x için basit Latin eşlemesi). */
export function buyukHarf(metin) {
  return [...normalle(metin)].map((c) => {
    const k = SIRA.get(c);
    if (k) return BUYUK[k.i];
    return LATIN_BUYUK[c] || c;
  }).join('');
}

/** Türkçe küçük harf. */
export function kucukHarf(metin) {
  return [...normalle(metin)].map((c) => {
    const k = SIRA.get(c);
    if (k) return KUCUK[k.i];
    return LATIN_KUCUK[c] || c;
  }).join('');
}

const LATIN_BUYUK = { q: 'Q', w: 'W', x: 'X' };
const LATIN_KUCUK = { Q: 'q', W: 'w', X: 'x' };

/** Matematikteki mod: sonuç her zaman 0 ≤ r < m (JavaScript'in % işlemi negatifte eksi verir). */
export function mod(a, m) { return ((a % m) + m) % m; }

/**
 * Her alfabe harfine f(sira) uygular; büyük/küçük korunur, diğer karakterler geçer.
 * Sezar, afin, Vigenère gibi bütün yer değiştirme şifreleri bunun üstüne kurulur.
 * f(i, konum) — konum: alfabe harfleri arasında kaçıncı (Vigenère için).
 */
export function harfHarfDonustur(metin, f) {
  let konum = 0;
  return [...normalle(metin)].map((c) => {
    const k = SIRA.get(c);
    if (!k) return c;
    return harf(f(k.i, konum++), k.buyuk);
  }).join('');
}

/** Metindeki alfabe dışı harfler (Q, W, X gibi) — arayüzde not göstermek için. */
export function yabanciHarfler(metin) {
  const s = new Set();
  for (const c of normalle(metin)) if (/[qwxQWX]/.test(c)) s.add(c.toUpperCase());
  return [...s];
}
