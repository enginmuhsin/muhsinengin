/* =====================================================================
   GERÇEK KABA KUVVET — kriptoloji/cekirdek/kaba-kuvvet.js
   Web Crypto ile SHA-256. Tarayıcıda ve Node'da (globalThis.crypto) aynı çalışır; ağ yok.
   1) Rastgele bir doğum yılı seçilir, yalnız ÖZETİ (hash) tutulur — bir sitenin şifre özetini çaldırması gibi.
   2) 1900–2025 arasındaki her yılın özeti hesaplanıp karşılaştırılır; eşleşen yıl kasanın şifresidir.
   3) Ayrıca bir saniye boyunca özet hesaplanıp cihazın "deneme/saniye" hızı ölçülür.
   Not: Bu, tarayıcıda JavaScript ile yapılan bir ölçümdür. Özel yazılım ve ekran kartı kullanan bir saldırgan
   aynı özeti çok daha hızlı hesaplar; sayfadaki varsayılan hızlar bu yüzden ayrıca verilir.
   ===================================================================== */

const TUZ = 'sifre-dairesi-kasa:';   // örnek amaçlı sabit tuz
const kodla = new TextEncoder();

export async function ozet(metin) {
  const b = await crypto.subtle.digest('SHA-256', kodla.encode(TUZ + metin));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Bayt dizilerini karşılaştırmadan önce hex yerine ham özet kullanmak daha hızlıdır; ölçüm için ham sürüm. */
async function hamOzet(veri) { return crypto.subtle.digest('SHA-256', veri); }

export function rastgeleTam(min, max) {
  const a = new Uint32Array(1);
  const aralik = max - min + 1;
  const sinir = Math.floor(2 ** 32 / aralik) * aralik;   // eşit dağılım için reddetme örneklemesi
  do crypto.getRandomValues(a); while (a[0] >= sinir);
  return min + (a[0] % aralik);
}

/** Yeni bir doğum yılı kasası: yalnız özet dışarı verilir. */
export async function yilKasasi(min = 1900, max = 2025) {
  const yil = rastgeleTam(min, max);
  return { min, max, hedef: await ozet(String(yil)) };
}

/**
 * Kasayı kaba kuvvetle açar. ilerleme(deneme, aday) her grupta çağrılır.
 * Dönen: { bulunan: '1987', deneme: 88, ms: 3.2 }
 */
export async function kasayiKir(kasa, { grup = 16, ilerleme } = {}) {
  const t0 = performance.now();
  let deneme = 0;
  for (let y = kasa.min; y <= kasa.max; y += grup) {
    const adaylar = [];
    for (let i = y; i < Math.min(y + grup, kasa.max + 1); i++) adaylar.push(String(i));
    const ozetler = await Promise.all(adaylar.map(ozet));
    for (let i = 0; i < adaylar.length; i++) {
      deneme++;
      if (ozetler[i] === kasa.hedef) {
        if (ilerleme) ilerleme(deneme, adaylar[i]);
        return { bulunan: adaylar[i], deneme, ms: performance.now() - t0 };
      }
    }
    if (ilerleme) ilerleme(deneme, adaylar[adaylar.length - 1]);
  }
  return { bulunan: null, deneme, ms: performance.now() - t0 };
}

/** Cihazın SHA-256 hızını ölçer: süre (ms) boyunca özet hesaplar, deneme/saniye döndürür. */
export async function hizOlc(sure = 1000, grup = 64) {
  const veri = [];
  for (let i = 0; i < grup; i++) veri.push(kodla.encode(TUZ + (1900 + i)));
  let sayi = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < sure) {
    await Promise.all(veri.map(hamOzet));
    sayi += grup;
  }
  return sayi / ((performance.now() - t0) / 1000);
}
