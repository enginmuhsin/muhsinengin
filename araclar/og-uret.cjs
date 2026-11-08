// Paylaşım görselleri (ortak/og/*.jpg, 1200×630) üretici.
// Sol taraf (zemin, kırmızı marj, etiket, başlık, alt yazı, dip satırı) HTML şablonundan çizilir.
// Sağ taraf: oyun kartlarında ve sabit ekran görüntülü kartlarda mevcut görselin sağ bölümü aynen korunur;
// "ekran" alanı olan kartlarda sağdaki eğik çerçeveye sitenin o anki ekran görüntüsü yerleştirilir.
// Kullanım: python -m http.server 8765 &  ;  node araclar/og-uret.cjs [ad ...]   (ad yoksa hepsi)
//           --cikti <klasör> verilirse ortak/og yerine oraya yazar (karşılaştırma için).
const fs = require('node:fs');
const path = require('node:path');

const KOK = path.resolve(__dirname, '..');
const OG = path.join(KOK, 'ortak', 'og');
const SITE = process.env.SITE_ADRES || 'http://localhost:8765/';
const dosyaUrl = (p) => 'file:///' + path.join(KOK, p).replace(/\\/g, '/');

// ---------- Kart tanımları ----------
// tip "oyun": 24 px ızgara, simgeli etiket, tek satır başlık. tip "sayfa": 30 px ızgara, iki satır başlık.
const OYUN_DIP = 'Tarihi, kuralları ve arkasındaki matematik · ücretsiz, reklamsız';
const SAYFA_DIP = 'Ücretsiz · reklamsız · öğrenciden kişisel bilgi istemez';
// Alan adı ASCII büyük harfle (noktasız I); Türkçe şapka yalnız "ZEKÂ"da. text-transform kullanılmaz.
const ALAN = 'MUHSINENGIN.COM';
const OYUN_ETIKET = ALAN + ' · ZEKÂ OYUNLARI';
const KARTLAR = {
  'oyun-satranc': { tip: 'oyun', simge: 'ik-satranc', baslik: 'Satranç', alt: ['At neden hep renk değiştirir, 64', 'kare ne kadar büyüktür?'] },
  'oyun-go': { tip: 'oyun', simge: 'ik-go', baslik: 'Go', alt: ['361 kesişimde kaç farklı tahta', 'mümkün?'] },
  'oyun-mangala': { tip: 'oyun', simge: 'ik-mangala', baslik: 'Mangala', alt: ['Son taşın nereye düşeceğini', 'dağıtmadan nasıl bilirsin?'] },
  'oyun-reversi': { tip: 'oyun', simge: 'ik-reversi', baslik: 'Reversi', alt: ['Köşeler neden altın değerinde?'] },
  'oyun-hex': { tip: 'oyun', simge: 'ik-hex', baslik: 'Hex', alt: ['Kazanan stratejinin var olduğunu', 'bil, ama kendisini bilme'] },
  'oyun-gizli-kod': { tip: 'oyun', simge: 'ik-gizlikod', baslik: 'Gizli Kod', alt: ['1296 koddan birini 5 soruda bulmak'],
    olc: { baslikBoy: 106, baslikSatir: 106, baslikUst: 202, altUst: 330.5 } }, // iki kelimelik başlık eskisinde daha küçük
  'oyun-sudoku': { tip: 'oyun', simge: 'ik-sudoku', baslik: 'Sudoku', alt: ['Aslında bir harita boyama sorusu'] },
  'zeka-oyunlari': { tip: 'sayfa', baslik: ['Zekâ', 'Oyunları'], alt: ['MEDAR ve yedi klasik oyun,', 'arkalarındaki matematikle.'] },
  'oyun-salonu': { tip: 'sayfa', baslik: ['Oyun', 'Salonu'], alt: ['7 zekâ oyununu bilgisayara karşı', 'oyna. Her gün yeni bulmaca.'],
    olc: { etiketUst: 137, baslikUst: 180, baslikBoy: 105, baslikSatir: 101, altUst: 409 } },
  ana: { tip: 'sayfa', baslik: ['Muhsin', 'ENGİN'], ekran: '',
    alt: ['Matematiği keşfedilen, oynanan ve', 'üretilen bir şeye dönüştürüyorum:', 'projelerle, oyunlarla, yazılımlarla', 've araştırmalarla.'],
    olc: { izgara: 30, izgaraRenk: '#e3e4e8', marjSaydam: 0.6, sol: 120, etiketUst: 164, etiketAra: 0.16,
      baslikUst: 205, baslikBoy: 84, baslikSatir: 84, altUst: 393, altBoy: 29, altSatir: 38, dipUst: 566, dipBoy: 20 } },
};

// ---------- Şablon ----------
function yaziTipleri() {
  const ff = (aile, agirlik, dosya) =>
    `@font-face{font-family:${aile};font-weight:${agirlik};src:url(${dosyaUrl('fonts/' + dosya + '-latin-ext-' + agirlik + '-normal.woff2')}) format("woff2");unicode-range:U+0100-024F,U+0259,U+1E00-1EFF}` +
    `@font-face{font-family:${aile};font-weight:${agirlik};src:url(${dosyaUrl('fonts/' + dosya + '-latin-' + agirlik + '-normal.woff2')}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+0302,U+0304,U+0308,U+2000-206F}`;
  return ff('Bri', 800, 'bricolage-grotesque') + ff('Ons', 400, 'onest') + ff('Ons', 700, 'onest');
}
function simgeler() {
  const svg = fs.readFileSync(path.join(KOK, 'ortak', 'oyun-ikonlari.svg'), 'utf8');
  return svg.replace(/<metadata>[\s\S]*?<\/metadata>/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">');
}
const kac = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function sablon(k, sagGorsel, olc) {
  const o = k.tip === 'oyun';
  const m = Object.assign({}, o ? OLCU_OYUN : OLCU_SAYFA, k.olc || {}, olc || {});
  const satirlar = (x) => (Array.isArray(x) ? x : [x]).map((t) => `<div>${kac(t)}</div>`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>${yaziTipleri()}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{position:relative;background-color:#f5f7fa;background-image:linear-gradient(${m.izgaraRenk} 1px,transparent 1px),linear-gradient(90deg,${m.izgaraRenk} 1px,transparent 1px);background-size:${m.izgara}px ${m.izgara}px}
.sag{position:absolute;inset:0;background:url(${sagGorsel}) 0 0/1200px 630px no-repeat;clip-path:polygon(${m.kesit}px 0,1200px 0,1200px 630px,${m.kesitAlt}px 630px,${m.kesitAlt}px 540px,${m.kesit}px 540px)}
.cerceve{position:absolute;left:${C.sol}px;top:${C.ust}px;width:${C.gen}px;height:${C.yuk}px;padding:${C.kenar}px;background:#fff;border-radius:${C.yaricap}px;
  box-shadow:0 2px 4px rgba(29,59,139,.06),0 24px 60px rgba(29,59,139,.16);transform-origin:0 50%;transform:${C.donus}}
.cerceve img{display:block;width:100%;height:100%;object-fit:cover;object-position:0 0;border-radius:${C.yaricap - C.kenar}px}
.marj{position:absolute;left:84px;top:0;bottom:0;width:2px;background:#c8323b;opacity:${m.marjSaydam}}
.e{position:absolute;left:${m.sol}px;white-space:nowrap}
.etiket{left:${m.sol + m.etiketSol}px;top:${m.etiketUst}px;font:700 ${m.etiketBoy}px/1 Ons;letter-spacing:${m.etiketAra}em;color:#c8323b;display:flex;align-items:center;gap:${m.simgeAra}px}
.etiket svg{width:${m.simgeBoy}px;height:${m.simgeBoy}px;color:#1d3b8b;flex:none}
.baslik{top:${m.baslikUst}px;font:800 ${m.baslikBoy}px/${m.baslikSatir}px Bri;letter-spacing:${m.baslikAra}em;color:#1d3b8b}
.alt{top:${m.altUst}px;font:400 ${m.altBoy}px/${m.altSatir}px Ons;color:#1b2433}
.alt{left:${m.sol + m.altSol}px}
.dip{left:${m.sol + m.dipSol}px;top:${m.dipUst}px;font:700 ${m.dipBoy}px/1 Ons;color:#5c6778}
</style></head><body>${o ? simgeler() : ''}${k.ekranGorsel ? `<div class="cerceve"><img src="${k.ekranGorsel}" alt=""></div>` : '<div class="sag"></div>'}<div class="marj"></div>
<div class="e etiket">${o ? `<svg aria-hidden="true"><use href="#${k.simge}"/></svg>${kac(k.etiket || OYUN_ETIKET)}` : ALAN}</div>
<div class="e baslik">${satirlar(k.baslik)}</div>
<div class="e alt">${satirlar(k.alt)}</div>
<div class="e dip">${kac(o ? OYUN_DIP : SAYFA_DIP)}</div>
</body></html>`;
}

// Ölçüler mevcut görsellerden piksel ölçümüyle çıkarıldı (eski metinle üretilen görsel orijinalle karşılaştırılarak).
const OLCU_OYUN = { izgara: 24, izgaraRenk: '#e2e4e9', marjSaydam: 0.9, kesit: 665, kesitAlt: 720, sol: 122,
  etiketSol: 0, etiketUst: 147, etiketBoy: 20, etiketAra: 0.18, simgeBoy: 39, simgeAra: 8,
  baslikUst: 202, baslikBoy: 130, baslikSatir: 130, baslikAra: -0.02,
  altSol: 0, altUst: 354.5, altBoy: 31, altSatir: 41.5, altGenislik: 500, dipSol: 0, dipUst: 569, dipBoy: 19 };
const OLCU_SAYFA = { izgara: 24, izgaraRenk: '#e2e4e9', marjSaydam: 0.9, kesit: 665, kesitAlt: 720, sol: 122,
  etiketSol: 0, altSol: 0, dipSol: 0, etiketUst: 123, etiketBoy: 20, etiketAra: 0.18, simgeBoy: 0, simgeAra: 0,
  baslikUst: 164, baslikBoy: 120, baslikSatir: 116, baslikAra: -0.016,
  altUst: 423, altBoy: 30, altSatir: 42, dipUst: 569, dipBoy: 19 };

// Sağdaki eğik ekran görüntüsü çerçevesi (yalnız "ekran" alanı olan kartlar)
const C = { sol: 688, ust: 86, gen: 690, yuk: 398, kenar: 10, yaricap: 26,
  donus: 'perspective(1600px) rotateY(-12deg) rotateX(3deg) rotate(-2.4deg)', sayfaGen: 1440, sayfaYuk: 830 };

// Sitenin ekran görüntüsü: açık tema, hareket azaltılmış, müzik daveti kaldırılmış
async function ekranAl(tarayici, adres) {
  const ctx = await tarayici.newContext({ viewport: { width: C.sayfaGen, height: C.sayfaYuk }, colorScheme: 'light', reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const s = await ctx.newPage();
  await s.goto(adres, { waitUntil: 'load' }); await s.waitForTimeout(3000);
  await s.evaluate(() => document.querySelectorAll('.sm-davet').forEach((e) => e.remove()));
  const png = await s.screenshot({ type: 'png' }); await ctx.close();
  return 'data:image/png;base64,' + png.toString('base64');
}

async function uret(adlar, ciktiKlasor) {
  const { chromium } = require('playwright');
  const tarayici = await chromium.launch(process.env.OG_KANAL ? { channel: process.env.OG_KANAL } : {});
  const sayfa = await tarayici.newPage({ viewport: { width: 1200, height: 630 } });
  const gecici = path.join(require('node:os').tmpdir(), 'og-uret.html');
  fs.mkdirSync(ciktiKlasor, { recursive: true });
  for (const ad of adlar) {
    const k = Object.assign({}, KARTLAR[ad]);
    if (!k.tip) throw new Error('Bilinmeyen kart: ' + ad);
    const kaynak = path.join(OG, ad + '.jpg');
    const sag = 'data:image/jpeg;base64,' + fs.readFileSync(kaynak).toString('base64'); // sağ bölüm mevcut görselden
    if ('ekran' in k) k.ekranGorsel = await ekranAl(tarayici, SITE + k.ekran);
    fs.writeFileSync(gecici, sablon(k, sag));
    await sayfa.goto('file:///' + gecici.split(path.sep).join('/'));
    await sayfa.evaluate(() => document.fonts.ready); await sayfa.waitForTimeout(150);
    const hedef = path.join(ciktiKlasor, ad + '.jpg');
    await sayfa.screenshot({ path: hedef, type: 'jpeg', quality: 90 });
    console.log('✓', path.relative(KOK, hedef) || hedef);
  }
  await tarayici.close();
}

if (require.main === module) {
  const argv = process.argv.slice(2); let cikti = OG; const adlar = [];
  for (let i = 0; i < argv.length; i++) { if (argv[i] === '--cikti') cikti = path.resolve(argv[++i]); else adlar.push(argv[i]); }
  uret(adlar.length ? adlar : Object.keys(KARTLAR), cikti).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { KARTLAR, sablon, OLCU_OYUN, OLCU_SAYFA, OG, uret };
