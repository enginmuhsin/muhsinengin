/* =====================================================================
   DURUM — kriptoloji/bilesenler/durum.js
   Öğrencinin ilerlemesi (çözülen dosyaların bit maskesi) yalnızca BELLEKTE tutulur.
   Sayfalar arası taşımak için adres çubuğunun # kısmı kullanılır: …/sezar/#k=KRT-6JTJ7-D
   # sonrası tarayıcıdan sunucuya HİÇ gönderilmez; çerez/localStorage gerekmez.
   Seviye (?seviye=uzman) ve sunum (?sunum=1) sorgu kısmında durur; öğretmen link paylaşabilsin diye.
   ===================================================================== */
import { kodUret, kodCoz } from '../cekirdek/kayit-kodu.js';

let maske = 0;
const dinleyiciler = new Set();

function hashtenOku() {
  const m = /(?:^#|&)k=([^&]+)/.exec(location.hash);
  if (!m) return 0;
  const s = kodCoz(decodeURIComponent(m[1]));
  return s.tamam ? s.maske : 0;
}
maske = hashtenOku();

export function maskeAl() { return maske; }
export function cozulduMu(bit) { return (maske & (1 << bit)) !== 0; }
export function kod() { return kodUret(maske); }

/** Bir dosyayı çözülmüş işaretler. Yeni çözüldüyse true döner. */
export function coz(bit) {
  if (cozulduMu(bit)) return false;
  maskeKoy(maske | (1 << bit));
  return true;
}

/** Kayıt kodundan gelen maskeyi yükler (eskisinin üstüne yazar). */
export function maskeKoy(yeni) {
  maske = yeni >>> 0;
  adresiGuncelle();
  dinleyiciler.forEach((f) => f(maske));
}

export function dinle(f) { dinleyiciler.add(f); f(maske); return () => dinleyiciler.delete(f); }

/** Adres çubuğu ve daire içi bağlantılar güncel ilerlemeyi + seviyeyi taşısın. */
export function adresiGuncelle() {
  const u = new URL(location.href);
  u.hash = maske ? 'k=' + kodUret(maske) : '';
  if (u.href !== location.href) history.replaceState(history.state, '', u.href.replace(/#$/, ''));
  baglantilariGuncelle();
}

export function baglantilariGuncelle() {
  const burada = new URL(location.href);
  document.querySelectorAll('a[data-daire]').forEach((a) => {
    const hedef = new URL(a.getAttribute('href'), location.href);
    for (const p of ['seviye', 'sunum']) {
      const d = burada.searchParams.get(p);
      if (d && !a.hasAttribute('data-' + p + '-sabit')) hedef.searchParams.set(p, d); else if (!a.hasAttribute('data-' + p + '-sabit')) hedef.searchParams.delete(p);
    }
    hedef.hash = maske ? 'k=' + kodUret(maske) : '';
    a.href = hedef.href.replace(/#$/, '');
  });
}

addEventListener('hashchange', () => { const y = hashtenOku(); if (y !== maske) maskeKoy(y); });
