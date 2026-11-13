/* Mürekkep föyü: "çift = 0, tek = 1" etkinliği. Sayılar sabit tohumla üretilir: her baskı aynı olur. */
import { baglantilariGuncelle } from '../bilesenler/durum.js';

const bitler = (metin) => [...new TextEncoder().encode(metin)].flatMap((b) => [7, 6, 5, 4, 3, 2, 1, 0].map((i) => (b >> i) & 1));
let tohum = 2026;
const rastgele = () => { tohum = (tohum * 1103515245 + 12345) % 2147483648; return tohum / 2147483648; };
/** İstenen tek/çift durumda 40–220 arası bir sayı */
const sayi = (bit) => { const x = 40 + Math.floor(rastgele() * 180); return x % 2 === bit ? x : x + 1; };

function tablo(id, degerler, grup = 8) {
  const t = document.getElementById(id);
  for (let i = 0; i < degerler.length; i += grup) {
    const ust = t.insertRow(), alt = t.insertRow();
    degerler.slice(i, i + grup).forEach((d) => { ust.insertCell().textContent = d; alt.insertCell().textContent = ''; });
  }
}

document.getElementById('harfTablo').textContent =
  ['A', 'E', 'K', 'L', 'M', 'S', 'T'].map((h) => h + ' ' + bitler(h).join('')).join(' · ');

const KELIME = 'KEK';
const oku = bitler(KELIME).map(sayi);
tablo('okuTablo', oku);

const gizleSayilari = [137, 92, 201, 64, 118, 75, 150, 33];
tablo('gizleTablo', gizleSayilari);
const hedef = bitler('S');
const gizleCevap = gizleSayilari.map((x, i) => (x % 2 === hedef[i] ? x : x + 1));

const cevaplar = [
  'Bitler: ' + oku.map((x) => x % 2).join('').replace(/(.{8})/g, '$1 ').trim() + ' → ' + KELIME + '. (Mesaj kekin içinde!)',
  'Bir doğru çözüm: ' + gizleCevap.join(', ') + ' (değişenler ' + gizleSayilari.map((x, i) => (x === gizleCevap[i] ? null : x + '→' + gizleCevap[i])).filter(Boolean).join(', ') + '). Her sayı en fazla 1 değişmeli; −1 de kabul.',
  'Okuyabilir: yöntemi bilen tek/çiftlere bakar. Önce güçlü bir şifreyle şifreleyip sonra gizlemek gerekir.',
  '800 × 600 × 3 = 1 440 000 bit = 180 000 bayt (32 bitlik başlık bundan düşülür).',
  '11001001 = 201. Fark 1: 256 tonluk ölçekte göz ayırt edemez.',
  'JPEG kayıplıdır: dosyayı küçültürken göze önemsiz görünen ayrıntıları, yani en düşük bitleri değiştirir. PNG kayıpsızdır: her sayıyı aynen saklar.',
  '40 × 2 bayt = 80 bayt = 640 bit; başlıkla 672 bit (= 224 piksel).',
];
const ol = document.getElementById('cevaplar');
cevaplar.forEach((c) => { const li = document.createElement('li'); li.textContent = c; ol.appendChild(li); });
document.getElementById('yazdir').addEventListener('click', () => window.print());
baglantilariGuncelle();
