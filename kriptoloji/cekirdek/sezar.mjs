/* =====================================================================
   SEZAR ŞİFRESİ — kriptoloji/cekirdek/sezar.mjs
   E(x) = (x + k) mod 29   ·   D(x) = (x − k) mod 29   (Türk alfabesi, 29 harf)
   ===================================================================== */
import { harfHarfDonustur, N, mod } from './turkce-alfabe.mjs';

/** Şifrele: her harf k sıra ileri kayar. k negatif olabilir. */
export function sezar(metin, k) {
  const kk = Math.trunc(Number(k) || 0);
  return harfHarfDonustur(metin, (i) => i + kk);
}

/** Çöz: k sıra geri kaydırmak, −k ile şifrelemekle aynıdır. */
export function sezarCoz(metin, k) { return sezar(metin, -(Math.trunc(Number(k) || 0))); }

/** Anahtarı 0–28 aralığına getirir. */
export function anahtarNormal(k) { return mod(Math.trunc(Number(k) || 0), N); }

/**
 * Kaba kuvvet tablosu: 1'den 28'e her anahtarla çözüm.
 * (k = 0 metni değiştirmez; bu yüzden anlamlı anahtar sayısı 28.)
 */
export function kabaKuvvet(sifreli) {
  const satirlar = [];
  for (let k = 1; k < N; k++) satirlar.push({ k, metin: sezarCoz(sifreli, k) });
  return satirlar;
}
