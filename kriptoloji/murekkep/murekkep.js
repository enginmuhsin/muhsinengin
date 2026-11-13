/* =====================================================================
   ODA 3 · GÖRÜNMEZ MÜREKKEP — kriptoloji/murekkep/murekkep.js
   Görseller yalnız bu tarayıcıda, <canvas> üzerinde işlenir. Ağ isteği yok, depo yok.
   Gizleme/çözme cekirdek/steg.js ile yapılır (saf, test edilmiş).
   ===================================================================== */
import { metinGizle, metinCoz, bitDuzlemi, kapasiteBayt, kapasiteBit, enBuyukFark, degisenKanal, ikili, KapasiteHatasi } from '../cekirdek/steg.js';
import { sezar } from '../cekirdek/sezar.js';
import { buyukHarf } from '../cekirdek/turkce-alfabe.js';
import { sayiYaz } from '../cekirdek/entropi.js';
import { ozet } from '../cekirdek/kaba-kuvvet.js';
import { gorevBagla } from '../bilesenler/gorev.js';
import { seviyeBaslat } from '../bilesenler/seviye.js';
import { sunumBaslat } from '../bilesenler/sunum.js';
import { baglantilariGuncelle } from '../bilesenler/durum.js';

const $ = (s) => document.querySelector(s);
const ENBUYUK = 1200;   // eski bilgisayarlar için: daha büyük görseller küçültülür

/* ---------- Tuval yardımcıları ---------- */
const baglam = (tuval) => tuval.getContext('2d', { willReadFrequently: true });

function goster(tuval, veri, g, y) {
  tuval.width = g; tuval.height = y;
  baglam(tuval).putImageData(new ImageData(new Uint8ClampedArray(veri), g, y), 0, 0);
}

/** Bir görsel kaynağını (Image, ImageBitmap) opak RGBA'ya çevirir; çok büyükse küçültür. */
function pikselAl(kaynak) {
  let g = kaynak.naturalWidth || kaynak.width, y = kaynak.naturalHeight || kaynak.height;
  const olcek = Math.min(1, ENBUYUK / Math.max(g, y));
  g = Math.max(1, Math.round(g * olcek)); y = Math.max(1, Math.round(y * olcek));
  const t = document.createElement('canvas'); t.width = g; t.height = y;
  const c = baglam(t);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, g, y);     // saydam görseller beyaz zemine oturur (alfa = 255)
  c.drawImage(kaynak, 0, 0, g, y);
  return { veri: c.getImageData(0, 0, g, y).data, g, y, kucultuldu: olcek < 1 };
}

const resimYukle = (yol) => new Promise((ok, hata) => { const r = new Image(); r.onload = () => ok(r); r.onerror = hata; r.src = yol; });

/* ---------- Tuval öz testi (brief 8: parmak izi korumalı tarayıcılar) ---------- */
function tuvalOzTesti() {
  try {
    const g = 8, y = 4, veri = new Uint8ClampedArray(g * y * 4);
    for (let i = 0; i < veri.length; i++) veri[i] = i % 4 === 3 ? 255 : (i * 37 + 11) % 256;
    const t = document.createElement('canvas'); t.width = g; t.height = y;
    const c = baglam(t);
    c.putImageData(new ImageData(veri, g, y), 0, 0);
    const geri = c.getImageData(0, 0, g, y).data;
    for (let i = 0; i < veri.length; i++) if (geri[i] !== veri[i]) return false;
    return true;
  } catch { return false; }
}
const tuvalSaglam = tuvalOzTesti();
if (!tuvalSaglam) {
  const u = $('#tuvalUyari');
  u.hidden = false;
  u.textContent = 'Uyarı: Bu tarayıcı görsel piksellerini gizlilik için hafifçe değiştiriyor (örneğin parmak izi korumalı Firefox ya da Brave). Bu yüzden burada gizlenen mesajlar bozulabilir. Odayı başka bir tarayıcıda açmayı ya da bu site için korumayı kapatmayı dene.';
}

/* ---------- Atölye 1: çöz ---------- */
const cozSonuc = $('#cozSonuc');
function cozVeGoster(p, kaynakAdi) {
  goster($('#cozTuval'), p.veri, p.g, p.y);
  goster($('#cozDuzlem'), bitDuzlemi(p.veri), p.g, p.y);
  const s = metinCoz(p.veri);
  cozSonuc.hidden = false;
  cozSonuc.innerHTML = '';
  const baslik = document.createElement('p'); baslik.className = 'mektup-baslik';
  const govde = document.createElement('p'); govde.className = 'mektup-govde';
  if (s.tamam && s.bayt > 0) {
    baslik.textContent = kaynakAdi + ' içinden ' + s.bayt + ' baytlık bir mektup çıktı:';
    govde.textContent = s.metin;
  } else if (s.tamam) {
    baslik.textContent = 'Bu görselde boş bir mesaj gizlenmiş.';
  } else {
    baslik.textContent = s.neden === 'utf8'
      ? 'Bir şeyler var ama okunamıyor: bitler bozulmuş (görsel JPEG\'e çevrilmiş ya da düzenlenmiş olabilir).'
      : 'Bu görselde bu yöntemle gizlenmiş bir mesaj bulunamadı.';
  }
  cozSonuc.append(baslik, govde);
  return s;
}
let ornekMektup = null;
async function ornekYukle() {
  const p = pikselAl(await resimYukle('ornekler/kek-mektup.png'));
  ornekMektup = p;
  goster($('#cozTuval'), p.veri, p.g, p.y);
  goster($('#cozDuzlem'), bitDuzlemi(p.veri), p.g, p.y);
}
$('#cozOrnek').addEventListener('click', async () => {
  if (!ornekMektup) await ornekYukle();
  cozVeGoster(ornekMektup, 'Kek');
});
$('#cozDosya').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { cozVeGoster(pikselAl(await createImageBitmap(f)), 'Görsel'); }
  catch { cozSonuc.hidden = false; cozSonuc.textContent = 'Bu dosya bir görsel olarak açılamadı.'; }
  e.target.value = '';
});

/* ---------- Atölye 2: gizle ---------- */
let kaynak = null;      // { veri, g, y }
let sonGizli = null;    // { veri, g, y, metin }
let indirUrl = null;
const mesaj = $('#mesaj'), kapasite = $('#kapasite'), gizleSonuc = $('#gizleSonuc'), indir = $('#indir');

function kapasiteYaz() {
  if (!kaynak) { kapasite.textContent = ''; return; }
  const bayt = new TextEncoder().encode(mesaj.value.normalize('NFC')).length;
  const kap = kapasiteBayt(kaynak.g, kaynak.y);
  kapasite.textContent = 'Mesaj ' + sayiYaz(bayt) + ' bayt · Bu görsel en çok ' + sayiYaz(kap) + ' bayt saklar (' +
    kaynak.g + ' × ' + kaynak.y + ' × 3 = ' + sayiYaz(kapasiteBit(kaynak.g, kaynak.y)) + ' bit).' + (bayt > kap ? ' Mesaj sığmıyor!' : '');
  kapasite.classList.toggle('olumsuz', bayt > kap);
}
mesaj.addEventListener('input', kapasiteYaz);

function kaynakKoy(p, not) {
  kaynak = p; sonGizli = null;
  goster($('#onceTuval'), p.veri, p.g, p.y);
  goster($('#onceDuzlem'), bitDuzlemi(p.veri), p.g, p.y);
  for (const id of ['#sonraTuval', '#sonraDuzlem']) { const t = $(id); t.width = p.g; t.height = p.y; baglam(t).clearRect(0, 0, p.g, p.y); }
  indir.hidden = true; $('#jpegDugme').disabled = true; $('#jpegKap').hidden = true; $('#jpegSonuc').textContent = '';
  $('#pikselTablo').querySelectorAll('thead, tbody').forEach((x) => x.remove());
  gizleSonuc.className = 'geri-bildirim'; gizleSonuc.textContent = not || '';
  kapasiteYaz();
}
async function temizKek() { kaynakKoy(pikselAl(await resimYukle('ornekler/kek.png'))); }
$('#kekSec').addEventListener('click', temizKek);
$('#gizleDosya').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const p = pikselAl(await createImageBitmap(f));
    kaynakKoy(p, p.kucultuldu ? 'Görsel bu cihaz için ' + p.g + ' × ' + p.y + ' piksele küçültüldü. Yalnız bu tarayıcıda işlenir.' : 'Görsel yalnız bu tarayıcıda işlenir.');
  } catch { gizleSonuc.className = 'geri-bildirim olumsuz'; gizleSonuc.textContent = 'Bu dosya bir görsel olarak açılamadı.'; }
  e.target.value = '';
});

function pikselTablosu(once, sonra) {
  const tablo = $('#pikselTablo');
  tablo.querySelectorAll('thead, tbody').forEach((x) => x.remove());
  const thead = tablo.createTHead(); const tr = thead.insertRow();
  for (const h of ['Piksel', 'Kanal', 'Önce', 'Sonra', 'İkili (sonra)']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; tr.appendChild(th); }
  const tb = tablo.createTBody();
  for (let px = 0; px < 4; px++) for (let k = 0; k < 3; k++) {
    const i = px * 4 + k, r = tb.insertRow();
    const a = once[i], b = sonra[i];
    if (a !== b) r.className = 'degisti';
    r.insertCell().textContent = k === 0 ? String(px + 1) : '';
    r.insertCell().textContent = 'RGB'[k];
    r.insertCell().textContent = a;
    r.insertCell().textContent = b + (a !== b ? (b > a ? ' (+1)' : ' (−1)') : '');
    const td = r.insertCell(); td.className = 'mono';
    const bas = document.createElement('span'); bas.textContent = ikili(b).slice(0, 7);
    const son = document.createElement('b'); son.textContent = ikili(b).slice(7);
    td.append(bas, son);
  }
}

function gizle(metin) {
  if (!kaynak) { gizleSonuc.className = 'geri-bildirim olumsuz'; gizleSonuc.textContent = 'Önce bir görsel seç.'; return; }
  if (!metin) { gizleSonuc.className = 'geri-bildirim olumsuz'; gizleSonuc.textContent = 'Boş bir mesaj gizlemek bir şey saklamaz. Önce bir şey yaz.'; return; }
  const kYazi = $('#gizleK').value.trim();
  const k = kYazi === '' || document.documentElement.dataset.seviye !== 'uzman' ? null : Number(kYazi);
  if (k !== null && !Number.isInteger(k)) { gizleSonuc.className = 'geri-bildirim olumsuz'; gizleSonuc.textContent = 'Anahtar k bir tam sayı olmalı.'; return; }
  const yazilacak = k === null ? metin : sezar(metin, k);
  let veri;
  try { veri = metinGizle(kaynak.veri, yazilacak); }
  catch (h) {
    gizleSonuc.className = 'geri-bildirim olumsuz';
    gizleSonuc.textContent = h instanceof KapasiteHatasi ? 'Mesaj sığmıyor: ' + sayiYaz(h.gerekli) + ' bayt, ama görsel en çok ' + sayiYaz(h.kapasite) + ' bayt saklar. Mesajı kısalt ya da daha büyük bir görsel seç.' : 'Gizleme başarısız oldu.';
    return;
  }
  // Gidiş-dönüş: tuvale yaz, tuvalden geri oku, çöz, karşılaştır
  goster($('#sonraTuval'), veri, kaynak.g, kaynak.y);
  const geri = baglam($('#sonraTuval')).getImageData(0, 0, kaynak.g, kaynak.y).data;
  goster($('#sonraDuzlem'), bitDuzlemi(geri), kaynak.g, kaynak.y);
  const kontrol = metinCoz(geri);
  const tuttu = kontrol.tamam && kontrol.metin === yazilacak.normalize('NFC');
  sonGizli = { veri: geri, g: kaynak.g, y: kaynak.y, metin: yazilacak };
  pikselTablosu(kaynak.veri, geri);
  gizleSonuc.className = 'geri-bildirim ' + (tuttu ? 'olumlu' : 'olumsuz');
  gizleSonuc.textContent = tuttu
    ? 'Gizlendi ve geri okundu: ' + sayiYaz(degisenKanal(kaynak.veri, geri)) + ' kanal değeri değişti, en büyük fark ' + enBuyukFark(kaynak.veri, geri) + '.' + (k !== null ? ' Mesaj önce k = ' + k + ' ile Sezar şifrelendi.' : '')
    : 'Gizlendi ama geri okunamadı. Bu tarayıcı tuval piksellerini değiştiriyor olabilir (sayfanın başındaki uyarıya bak).';
  // İndirme bağlantısı (PNG kayıpsızdır)
  $('#sonraTuval').toBlob((b) => {
    if (indirUrl) URL.revokeObjectURL(indirUrl);
    indirUrl = URL.createObjectURL(b);
    indir.href = indirUrl; indir.hidden = false;
  }, 'image/png');
  $('#jpegDugme').disabled = false;
  if (tuttu && kendiGorev) kendiGorev.bildir({ dogru: true, mesaj: 'Mesajın gizlendi ve görselden aynen geri okundu. PNG\'yi indirip arkadaşına çözdür.' });
}
$('#gizleDugme').addEventListener('click', () => gizle(mesaj.value));

const SAYFA = 'Sevgili stajyer, bu mektup bir sayfa uzunluğunda. Görselin en düşük bitlerine sığdı ama bit düzleminde ' +
  'karlı bir bant olarak görünür. Düz renkli bir çizimde bu bitler sakindir; mesaj yazılınca karışık hâle gelir. ' +
  'Fotoğraflarda ise en düşük bitler zaten karışıktır, bu yüzden orada mesaj daha iyi saklanır. ';
$('#uzunMektup').addEventListener('click', async () => {
  if (!kaynak) await temizKek();
  const hedef = Math.floor(kapasiteBayt(kaynak.g, kaynak.y) * 0.4);
  let m = '';
  while (new TextEncoder().encode(m + SAYFA).length < hedef) m += SAYFA;
  mesaj.value = m; kapasiteYaz();
  gizle(m);
});

/* ---------- JPEG deneyi ---------- */
$('#jpegDugme').addEventListener('click', () => {
  if (!sonGizli) return;
  $('#sonraTuval').toBlob(async (b) => {
    const p = pikselAl(await createImageBitmap(b));
    goster($('#jpegTuval'), p.veri, p.g, p.y);
    goster($('#jpegDuzlem'), bitDuzlemi(p.veri), p.g, p.y);
    $('#jpegKap').hidden = false;
    const s = metinCoz(p.veri);
    const sonuc = $('#jpegSonuc');
    const ayni = s.tamam && s.metin === sonGizli.metin;
    sonuc.className = 'geri-bildirim ' + (ayni ? 'olumlu' : 'olumsuz');
    sonuc.textContent = ayni
      ? 'İlginç: mesaj bu kez korundu. Kaliteyi düşürüp yeniden dene; JPEG yine de güvenilir değildir.'
      : 'JPEG\'e çevrilen görsel göze aynı görünüyor ama mesaj ' + (s.neden === 'baslik' ? 'tamamen kayboldu' : 'bozuldu') +
        '. ' + sayiYaz(degisenKanal(sonGizli.veri, p.veri)) + ' kanal değeri değişti, en büyük fark ' + enBuyukFark(sonGizli.veri, p.veri) + '. Bit düzlemine bak.';
  }, 'image/jpeg', 0.92);
});

/* ---------- Büyüteç: görselin üstünde gezdir, pikselleri ve en düşük bitlerini gör ---------- */
function buyutecBagla(tuval) {
  const fig = tuval.closest('figure');
  const mercek = document.createElement('div');
  mercek.className = 'buyutec'; mercek.hidden = true; mercek.setAttribute('aria-hidden', 'true');
  mercek.innerHTML = '<canvas width="112" height="112"></canvas><span class="buyutec-yazi"></span>';
  fig.appendChild(mercek);
  const mc = mercek.querySelector('canvas').getContext('2d'), yazi = mercek.querySelector('.buyutec-yazi');
  mc.imageSmoothingEnabled = false;
  const goster = (e) => {
    const r = tuval.getBoundingClientRect();
    if (!tuval.width || !r.width) return;
    const px = Math.floor((e.clientX - r.left) / r.width * tuval.width), py = Math.floor((e.clientY - r.top) / r.height * tuval.height);
    if (px < 0 || py < 0 || px >= tuval.width || py >= tuval.height) { mercek.hidden = true; return; }
    mc.clearRect(0, 0, 112, 112);
    mc.drawImage(tuval, px - 3, py - 3, 7, 7, 0, 0, 112, 112);   // 7 × 7 piksel, 16 kat büyük
    mc.strokeStyle = '#c62828'; mc.lineWidth = 2; mc.strokeRect(48, 48, 16, 16);
    const [R, G, B] = baglam(tuval).getImageData(px, py, 1, 1).data;
    yazi.textContent = `R ${R} · G ${G} · B ${B}  |  son bitler ${R & 1}${G & 1}${B & 1}`;
    const fr = fig.getBoundingClientRect();
    let x = e.clientX - fr.left + 16, y = e.clientY - fr.top - 150;
    if (x + 150 > fr.width) x -= 182;
    mercek.style.left = Math.max(0, x) + 'px'; mercek.style.top = Math.max(0, y) + 'px';
    mercek.hidden = false;
  };
  tuval.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) goster(e); });
  tuval.addEventListener('pointerdown', goster);
  tuval.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') mercek.hidden = true; });
  document.addEventListener('pointerdown', (e) => { if (e.target !== tuval) mercek.hidden = true; });
}
['#cozTuval', '#onceTuval', '#sonraTuval', '#jpegTuval'].forEach((id) => buyutecBagla($(id)));

/* ---------- Görevler ---------- */
const bolum = (bit) => document.querySelector(`[data-dosya="${bit}"]`);
const PAROLA_OZETI = '8dd5af750a3ff12d1fcc428321ffb836b4df0f1e5946874eddeb01b20c0a7586';   // parolanın SHA-256 özeti; parolanın kendisi sayfada yazılı değil

gorevBagla(bolum(15), async (g) => {
  const temiz = buyukHarf(String(g)).replace(/[^A-ZÇĞİÖŞÜ]/g, '');
  if (await ozet(temiz) === PAROLA_OZETI) return { dogru: true, mesaj: 'Doğru parola. Mektup kekin içindeydi; göz hiçbir şey fark etmedi.' };
  return { dogru: false, mesaj: 'Bu parola tutmadı. “Mektubu çıkar” düğmesine basıp mektubu sonuna kadar oku.' };
});

const kendiGorev = gorevBagla(bolum(16), () => null);

gorevBagla(bolum(17), (s) => ({
  a: { dogru: false, mesaj: 'Deneyi yap: JPEG\'den sonra mektup çıkıyor mu?' },
  b: { dogru: true, mesaj: 'Evet. JPEG “kayıplı” sıkıştırır: göze önemsiz görünen ayrıntıları atar. Mesaj tam o en düşük bitlerdeydi. Gizli mesaj için PNG gibi kayıpsız biçim gerekir.' },
  c: { dogru: false, mesaj: 'JPEG şifrelemez; yalnız dosyayı küçültmek için pikselleri yaklaşık saklar.' },
  d: { dogru: false, mesaj: 'Görsellere yan yana bak: göze aynı görünüyorlar. Değişen, görmediğimiz en düşük bitler.' },
}[s]));

gorevBagla(bolum(18), (g) => {
  const x = Number(String(g).replace(/[\s.,]/g, ''));
  if (x === 1440000) return { dogru: true, mesaj: '800 × 600 × 3 = 1 440 000 bit, yani yaklaşık 180 000 bayt.' };
  if (x === 480000) return { dogru: false, mesaj: 'Bu piksel sayısı. Her pikselde 3 kanal (R, G, B) var.' };
  if (x === 1920000) return { dogru: false, mesaj: 'Alfa kanalı kullanılmıyor: piksel başına 3 bit.' };
  return { dogru: false, mesaj: 'G × Y × 3 formülünü kullan.' };
});

gorevBagla(bolum(19), (g) => {
  const x = Number(String(g).trim());
  if (x === 201) return { dogru: true, mesaj: '11001001 = 201. Fark yalnız 1: göz ayırt edemez.' };
  if (x === 1) return { dogru: false, mesaj: 'Yalnız son bit değişir, diğer 7 bit aynı kalır.' };
  return { dogru: false, mesaj: '11001000 + 1 = 11001001. Bunu onluk sisteme çevir.' };
});

gorevBagla(bolum(20), (s) => ({
  a: { dogru: false, mesaj: 'İki katman işi zorlaştırır ama katmanların biri zayıfsa zinciri o kırar. Sezar 28 denemede açılır.' },
  b: { dogru: true, mesaj: 'Evet. Katmanlar birbirini tamamlar, ama her katman ancak kendisi kadar güçlüdür. Gerçek hayatta Sezar yerine güçlü bir şifre kullanılır.' },
  c: { dogru: false, mesaj: 'Atölyede k ile gizleyip “Mektubu çıkar” ile dene: çıkan metin şifreli hâldir.' },
}[s]));

gorevBagla(bolum(21), (s) => ({
  a: { dogru: false, mesaj: 'Atölyedeki mektup hiçbir anahtar olmadan okundu. Görünmemek, şifreli olmak demek değildir.' },
  b: { dogru: true, mesaj: 'Evet. Steganografi mesajı saklar, kriptografi okunamaz yapar. İkisi birlikte kullanılabilir.' },
  c: { dogru: false, mesaj: 'Büyük görsel daha çok yer açar ama mesaj yine aynı yöntemle okunur.' },
  d: { dogru: false, mesaj: 'Fark göze görünmez ama bilgisayar en düşük biti kolayca okur.' },
}[s]));

/* ---------- Başlat ---------- */
seviyeBaslat();
sunumBaslat();
baglantilariGuncelle();
ornekYukle().catch(() => {});
temizKek().catch(() => {});
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
