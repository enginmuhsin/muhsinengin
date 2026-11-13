/* =====================================================================
   DOSYA SİCİLİ — kriptoloji/cekirdek/dosyalar.js
   Faz 1'deki bütün dosyalar (görevler) ve kayıt kodundaki bit sıraları.
   KURAL: Bir dosyanın bit numarası yayından sonra ASLA değişmez (eski kodlar bozulur).
   Yeni dosya eklenecekse sona eklenir; sığmazsa kayıt kodu sürümü artırılır.
   ===================================================================== */

// tur: 'cirak' | 'uzman' | 'kapanis' | 'giris'
export const DOSYALAR = Object.freeze([
  { bit: 0, oda: 'lobi', tur: 'giris', ad: 'Giriş dosyası: kapıdaki not' },
  // Oda 1 · Sezar Çarkı
  { bit: 1, oda: 'sezar', tur: 'cirak', ad: 'Daireden gelen mesaj' },
  { bit: 2, oda: 'sezar', tur: 'cirak', ad: 'Kayıp anahtar' },
  { bit: 3, oda: 'sezar', tur: 'cirak', ad: 'Arkadaşına şifreli not' },
  { bit: 4, oda: 'sezar', tur: 'uzman', ad: 'Formül defteri' },
  { bit: 5, oda: 'sezar', tur: 'uzman', ad: 'Kaba kuvvet tablosu' },
  { bit: 6, oda: 'sezar', tur: 'uzman', ad: 'Neden 29?' },
  { bit: 7, oda: 'sezar', tur: 'kapanis', ad: 'Sezar dosyasını kapat' },
  // Oda 2 · Kasa Soygunu
  { bit: 8, oda: 'kasa', tur: 'cirak', ad: 'En zayıf kilit' },
  { bit: 9, oda: 'kasa', tur: 'cirak', ad: 'Cihazının hızı' },
  { bit: 10, oda: 'kasa', tur: 'cirak', ad: 'Kelime mi sembol mü' },
  { bit: 11, oda: 'kasa', tur: 'uzman', ad: 'Entropi hesabı' },
  { bit: 12, oda: 'kasa', tur: 'uzman', ad: 'Yavaş anahtar türetme' },
  { bit: 13, oda: 'kasa', tur: 'uzman', ad: 'Ortalama süre' },
  { bit: 14, oda: 'kasa', tur: 'kapanis', ad: 'Kasa dosyasını kapat' },
  // Oda 3 · Görünmez Mürekkep
  { bit: 15, oda: 'murekkep', tur: 'cirak', ad: 'Görseldeki gizli mesaj' },
  { bit: 16, oda: 'murekkep', tur: 'cirak', ad: 'Kendi mesajını gizle' },
  { bit: 17, oda: 'murekkep', tur: 'cirak', ad: 'JPEG deneyi' },
  { bit: 18, oda: 'murekkep', tur: 'uzman', ad: 'Kapasite hesabı' },
  { bit: 19, oda: 'murekkep', tur: 'uzman', ad: 'Bit düzlemi' },
  { bit: 20, oda: 'murekkep', tur: 'uzman', ad: 'İki katmanlı koruma' },
  { bit: 21, oda: 'murekkep', tur: 'kapanis', ad: 'Mürekkep dosyasını kapat' },
]);

export const BIT_SAYISI = 22;

export const ODALAR = Object.freeze([
  { id: 'sezar', no: 1, ad: 'Sezar Çarkı', yol: 'sezar/' },
  { id: 'kasa', no: 2, ad: 'Kasa Soygunu', yol: 'kasa/' },
  { id: 'murekkep', no: 3, ad: 'Görünmez Mürekkep', yol: 'murekkep/' },
]);

export const RUTBELER = Object.freeze([
  { id: 'stajyer', ad: 'Stajyer', kosul: 'Daireye giriş yaptın.' },
  { id: 'kod-kirici', ad: 'Kod Kırıcı', kosul: 'Bir odanın kapanış dosyasını çöz.' },
  { id: 'analist', ad: 'Analist', kosul: 'Üç odanın da kapanış dosyasını çöz.' },
  { id: 'bas-kriptograf', ad: 'Baş Kriptograf', kosul: 'Üç kapanış dosyası ve en az 6 Uzman dosyası.' },
]);

/** Bit maskesinde kaç dosya çözülmüş, tür türüne. */
export function sayim(maske) {
  const s = { toplam: 0, kapanis: 0, uzman: 0, cirak: 0, giris: 0 };
  for (const d of DOSYALAR) if (maske & (1 << d.bit)) { s.toplam++; s[d.tur]++; }
  return s;
}

/** Bit maskesinden rütbe (RUTBELER içindeki sıra 0–3). */
export function rutbeSirasi(maske) {
  const s = sayim(maske);
  if (s.kapanis >= 3 && s.uzman >= 6) return 3;
  if (s.kapanis >= 3) return 2;
  if (s.kapanis >= 1) return 1;
  return 0;
}

export function rutbe(maske) { return RUTBELER[rutbeSirasi(maske)]; }
