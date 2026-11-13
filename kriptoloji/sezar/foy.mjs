/* Sezar föyü: kâğıt diskler, görev mesajları ve ayrı sayfada cevap anahtarı. */
import { sezarCoz, sezar } from '../cekirdek/sezar.mjs';
import { BUYUK } from '../cekirdek/turkce-alfabe.mjs';
import { cizKagitDisk } from '../bilesenler/cark.mjs';
import { baglantilariGuncelle } from '../bilesenler/durum.mjs';

const M1 = { sifreli: 'FAJBS VEEZ BĞZI EÜYNCHI FAPAYEPMR', k: 5 };
const M2 = { sifreli: 'UGEGBRİYNYŞY UİBSÇS İLSU', k: 11 };
const M5 = { sifreli: 'ÇPİP JBÜIUİB ŞGÇ ÖPOAÜ', k: 19 };

cizKagitDisk(document.getElementById('diskDis'), 'dis');
cizKagitDisk(document.getElementById('diskIc'), 'ic');
document.getElementById('fm1').textContent = M1.sifreli;
document.getElementById('fm2').textContent = M2.sifreli;
document.getElementById('fm5').textContent = M5.sifreli;
document.getElementById('fAlfabe').textContent = BUYUK.map((h, i) => h + '=' + i).join('  ');

const cevaplar = [
  sezarCoz(M1.sifreli, M1.k),
  'k = ' + M2.k + ' → ' + sezarCoz(M2.sifreli, M2.k),
  sezar('KALEM', 7),
  'Öğrenciye bağlı. Kontrol: arkadaşı doğru anahtarla çözebildi mi?',
  'Mesajı mutlaka bulur. Yalnız 28 anahtar olduğu için hepsi denenebilir; anahtarın gizli olması mesajı korumaz.',
  '(22 + 10) mod 29 = 32 mod 29 = 3 → Ç',
  'k = ' + M5.k + ' → ' + sezarCoz(M5.sifreli, M5.k) + ' (en fazla 28 deneme)',
  'Mod 29: 28 seçenek (29 asal, 1–28 hepsi tersinir) → 28 × 29 = 812 anahtar. Mod 26: 12 seçenek (26 ile ortak böleni olmayanlar) → 12 × 26 = 312 anahtar.',
];
const ol = document.getElementById('cevaplar');
cevaplar.forEach((c) => { const li = document.createElement('li'); li.textContent = c; ol.appendChild(li); });

document.getElementById('yazdir').addEventListener('click', () => window.print());
baglantilariGuncelle();
