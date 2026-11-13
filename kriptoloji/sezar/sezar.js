/* =====================================================================
   ODA 1 · SEZAR ÇARKI — kriptoloji/sezar/sezar.js
   Görev mesajlarının AÇIK hâli bu dosyada yoktur: öğrencinin cevabı şifrelenip
   şifreli metinle karşılaştırılır. (Sayfa kaynağına bakan cevabı göremez.)
   ===================================================================== */
import { sezar, sezarCoz, kabaKuvvet } from '../cekirdek/sezar.js';
import { yabanciHarfler, buyukHarf, mod, sira, normalle } from '../cekirdek/turkce-alfabe.js';
import { cizCark } from '../bilesenler/cark.js';
import { gorevBagla, sadele } from '../bilesenler/gorev.js';
import { seviyeBaslat } from '../bilesenler/seviye.js';
import { sunumBaslat } from '../bilesenler/sunum.js';
import { baglantilariGuncelle } from '../bilesenler/durum.js';

const $ = (s, k = document) => k.querySelector(s);

/* ---------- Görev verileri (yalnız şifreli) ---------- */
const M1 = { sifreli: 'FAJBS VEEZ BĞZI EÜYNCHI FAPAYEPMR', k: 5 };
const M2 = { sifreli: 'UGEGBRİYNYŞY UİBSÇS İLSU', k: 11 };
const M3 = { acik: 'KALEM', k: 7 };
const M5 = { sifreli: 'ÇPİP JBÜIUİB ŞGÇ ÖPOAÜ', k: 19 };

/* ---------- Simülasyon ---------- */
const cark = cizCark($('#cark'), { baslangic: 3 });
const acik = $('#acik'), sifreli = $('#sifreli'), kGoster = $('#kGoster'), yabanciNot = $('#yabanciNot');
let sonYazilan = 'acik';

function guncelle() {
  const k = cark.k();
  kGoster.textContent = 'k = ' + k;
  if (sonYazilan === 'acik') sifreli.value = sezar(acik.value, k);
  else acik.value = sezarCoz(sifreli.value, k);
  const yab = yabanciHarfler(acik.value + sifreli.value);
  yabanciNot.hidden = yab.length === 0;
  if (yab.length) yabanciNot.textContent = yab.join(', ') + ' Türk alfabesinde yok; bu harfler olduğu gibi bırakıldı.';
}
/** Son yazılan alfabe harfinin çarktaki yolunu göster (iç disk = açık harf). */
function sonHarf(metin) { const h = [...normalle(metin)].reverse().find((c) => sira(c) >= 0); return h ? sira(h) : -1; }
acik.addEventListener('input', () => { sonYazilan = 'acik'; guncelle(); cark.vurgula(sonHarf(acik.value)); });
sifreli.addEventListener('input', () => { sonYazilan = 'sifreli'; guncelle(); const j = sonHarf(sifreli.value); cark.vurgula(j < 0 ? -1 : mod(j - cark.k(), 29)); });
cark.dinle(guncelle);
$('#kEksi').addEventListener('click', () => cark.kAyarla(cark.k() - 1));
$('#kArti').addEventListener('click', () => cark.kAyarla(cark.k() + 1));
guncelle();

/* ---------- Görevler ---------- */
$('#m1').textContent = M1.sifreli;
$('#m2').textContent = M2.sifreli;
$('#m5').textContent = M5.sifreli;

const bolum = (bit) => document.querySelector(`[data-dosya="${bit}"]`);

gorevBagla(bolum(1), (g) => {
  const dogru = sadele(sezar(g, M1.k)) === sadele(M1.sifreli);
  if (dogru) return { dogru, mesaj: 'Doğru çözdün. Buluşma yeri ve saati artık sende.' };
  if (sadele(sezar(g, -M1.k)) === sadele(M1.sifreli)) return { dogru: false, mesaj: 'Ters yöne döndürdün: çözmek için harfleri 5 sıra GERİ saymalısın.' };
  return { dogru: false, mesaj: 'Henüz değil. Çarkı 5\'e getirip mesajı şifreli kutuya yapıştırmayı dene.' };
});

gorevBagla(bolum(2), (g) => {
  const n = Number(String(g).trim());
  if (!Number.isInteger(n)) return { dogru: false, mesaj: 'Anahtar bir sayı olmalı (0 ile 28 arası).' };
  if (mod(n, 29) === M2.k) return { dogru: true, mesaj: 'Anahtar ' + M2.k + '. Bulman için gizli olmasının yetmediğini fark ettin mi?' };
  return { dogru: false, mesaj: 'Bu anahtarla anlamlı bir cümle çıkmıyor. Çarkı çevirmeye devam et.' };
});

gorevBagla(bolum(3), (g) => {
  const beklenen = sezar(M3.acik, M3.k);
  if (sadele(g) === beklenen) return { dogru: true, mesaj: 'Doğru: ' + beklenen + '. Şimdi kendi mesajını şifreleyip arkadaşına ver.' };
  if (sadele(g) === sezar(M3.acik, -M3.k)) return { dogru: false, mesaj: 'Ters yöne kaydırdın; şifrelerken harfler İLERİ kayar.' };
  return { dogru: false, mesaj: 'Tutmadı. İpucu: K harfinden 7 sıra ileri say: L, M, N, O, Ö, P, R.' };
});

gorevBagla(bolum(4), (g) => {
  const s = buyukHarf(String(g).trim());
  if (s === 'Ç' || s === '3') return { dogru: true, mesaj: '22 + 10 = 32 ve 32 mod 29 = 3. Sıra 3 → Ç.' };
  if (s === 'C' || s === '2') return { dogru: false, mesaj: 'Çok yakın! Türk alfabesinde C\'den sonra Ç gelir; A = 0 diye saymayı unutma.' };
  if (s === '32') return { dogru: false, mesaj: '32 doğru ama alfabede 29 harf var. 29\'a bölümden kalanı al.' };
  return { dogru: false, mesaj: 'Tutmadı. Önce 22 + 10\'u hesapla, sonra 29\'a bölümden kalanı bul.' };
});

// Kaba kuvvet tablosu
const liste = $('#kabaTablo .kaba-liste');
kabaKuvvet(M5.sifreli).forEach(({ k, metin }) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button'; b.dataset.secenek = String(k); b.setAttribute('aria-pressed', 'false');
  b.innerHTML = '<span class="k-etiket"></span><span class="satir-metin"></span>';
  b.querySelector('.k-etiket').textContent = 'k = ' + k;
  b.querySelector('.satir-metin').textContent = metin;
  li.appendChild(b); liste.appendChild(li);
});
const tabloAc = $('#tabloAc');
tabloAc.addEventListener('click', () => {
  const t = $('#kabaTablo'); t.hidden = !t.hidden;
  tabloAc.setAttribute('aria-expanded', String(!t.hidden));
  tabloAc.textContent = t.hidden ? '28 anahtarın hepsini dene' : 'Tabloyu gizle';
});
gorevBagla(bolum(5), (s) => Number(s) === M5.k
  ? { dogru: true, mesaj: 'k = ' + M5.k + '. 28 satırın yalnız biri anlamlı; casus onu bir bakışta seçer.' }
  : { dogru: false, mesaj: 'Bu satır anlamlı bir Türkçe cümle değil. Tabloyu yeniden tara.' });

gorevBagla(bolum(6), (s) => ({
  a: { dogru: false, mesaj: '12, İngiliz alfabesinin (mod 26) cevabı. 29 asal olunca ne değişir?' },
  b: { dogru: false, mesaj: 'Yalnız tek sayılar mı? 29 asal; hiçbir sayıyla ortak böleni yok.' },
  c: { dogru: true, mesaj: '28. 29 asal olduğu için 1–28 arasındaki her sayı 29 ile aralarında asaldır ve bir tersi vardır.' },
  d: { dogru: false, mesaj: 'a = 0 her harfi aynı harfe götürür; çözülemez. 0 hariç kaç sayı kalır?' },
}[s]));

gorevBagla(bolum(7), (s) => ({
  a: { dogru: false, mesaj: 'Anahtar gizli ama yalnız 28 olasılık var. Casus hepsini dener; gizlilik onu durdurmaz.' },
  b: { dogru: true, mesaj: 'Evet. Az sayıda anahtar, hepsinin denenebilmesi demektir. Güçlü bir şifrede anahtar sayısı denenemeyecek kadar büyük olmalı.' },
  c: { dogru: false, mesaj: '28 deneme kâğıt kalemle de birkaç dakika sürer. Bilgisayar yalnız işi hızlandırır.' },
  d: { dogru: false, mesaj: 'Dosya 105\'teki tabloya bak: 28 satırın yalnız biri anlamlı Türkçe; doğru satır göze batar.' },
}[s]));

seviyeBaslat();
sunumBaslat();
baglantilariGuncelle();
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
