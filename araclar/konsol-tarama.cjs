// Konsol taraması: sitedeki her sayfayı gerçek bir tarayıcıda (Chromium) açar ve
//  - yakalanmamış JavaScript hatalarını,
//  - console.error iletilerini,
//  - site içinden 400+ dönen istekleri (kırık resim, betik, stil),
//  - telefonda (390 px) yatay taşmayı
// raporlar. Hata varsa çıkış kodu 1 olur (GitHub'da kırmızı çarpı).
// Kullanım: python3 -m http.server 8765 &  ;  node araclar/konsol-tarama.cjs
const { chromium } = require('playwright');
const { execSync } = require('node:child_process');

(async () => {

const KOK = process.env.SITE_ADRES || 'http://localhost:8765/';
const sayfalar = execSync("git ls-files '*.html'").toString().trim().split('\n').filter((f) => !f.startsWith('fonts/'));
// Dış servislere bağlı ya da bilerek ağ isteyen sayfalarda yalnızca site içi hatalar sayılır.
const disHataYoksay = (metin) => /net::ERR_|Failed to load resource|supabase|googleapis|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/i.test(metin);

const tarayici = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let toplamHata = 0, toplamUyari = 0;
for (const yol of sayfalar) {
  const url = KOK + yol.replace(/index\.html$/, '');
  for (const ekran of [{ ad: 'masaüstü', width: 1280, height: 800 }, { ad: 'telefon', width: 390, height: 844, mobil: true }]) {
    const ctx = await tarayici.newContext({ viewport: { width: ekran.width, height: ekran.height }, isMobile: !!ekran.mobil, hasTouch: !!ekran.mobil });
    const s = await ctx.newPage();
    const hatalar = [];
    s.on('pageerror', (e) => hatalar.push('JS hatası: ' + e.message));
    s.on('console', (m) => { if (m.type() === 'error' && !disHataYoksay(m.text())) hatalar.push('console.error: ' + m.text().slice(0, 200)); });
    s.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(KOK) && !r.url().endsWith('favicon.ico')) hatalar.push(`${r.status()} ${r.url().replace(KOK, '/')}`); });
    try { await s.goto(url, { waitUntil: 'load', timeout: 30000 }); await s.waitForTimeout(1500); }
    catch (e) { hatalar.push('Açılmadı: ' + e.message.split('\n')[0]); }
    const tasma = ekran.mobil ? await s.evaluate(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0) : 0;
    const benzersiz = [...new Set(hatalar)];
    if (benzersiz.length) { toplamHata += benzersiz.length; console.log(`✗ ${yol} (${ekran.ad})`); benzersiz.forEach((h) => console.log('    ' + h)); if (process.env.GITHUB_ACTIONS) console.log(`::error file=${yol}::${benzersiz[0].replace(/\n/g, ' ')}`); }
    if (tasma > 1) { toplamUyari++; console.log(`△ ${yol} (telefon): sayfa ${tasma} px yatay taşıyor`); if (process.env.GITHUB_ACTIONS) console.log(`::warning file=${yol}::Telefonda ${tasma} px yatay taşma`); }
    await ctx.close();
  }
}
await tarayici.close();
console.log(`\n${sayfalar.length} sayfa × 2 ekran tarandı: ${toplamHata} hata, ${toplamUyari} uyarı.`);
process.exit(toplamHata ? 1 : 0);
})();
