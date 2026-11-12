/* =====================================================================
   ZİYARETÇİ SAYACI — ortak/sayac.js (bütün sayfalarda <head> içinde, defer ile)
   Benzetme: kapıdaki yoklama defteri. Aynı öğrenci gün içinde kaç kez girip çıksa da
   "bugün geldi" diye bir kez işaretlenir; kim olduğu yazılmaz, yalnızca çentik atılır.

   • Her sayfa (sekme) ayrı sayılır; ayrıca o gün siteye gelen toplam farklı ziyaretçi tutulur.
   • Tarayıcıya yalnızca "bugün bu sayfada sayıldım" notu bırakılır (localStorage). IP, ad, çerez yok.
   • Botlar, otomatik tarayıcılar, önizleme açılışları ve yerel dosya/localhost sayılmaz.
   • Rapor: muhsinengin.com/sayac/ (gizli panel, giriş ister). Orada "bu cihazı sayma" düğmesi var.
   • Veri Supabase'te: sayac/kurulum.sql
   ===================================================================== */
(function () {
  'use strict';
  var URL_ = 'https://kfpziysmsajqidkzaawh.supabase.co/rest/v1/rpc/sayac_artir';
  var ANAHTAR = 'sb_publishable_jzoa489kAPGEComqCF2JSQ_N8gjKPjC'; // herkese açık anahtar; güvenlik veritabanında

  try {
    var h = location.hostname;
    if (location.protocol !== 'https:' || !/(^|\.)muhsinengin\.com$/.test(h)) return;
    if (navigator.webdriver) return;
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|telegram/i.test(navigator.userAgent || '')) return;
    if (localStorage.getItem('sayac:haric') === '1') return;
  } catch (e) { return; }

  function sayfaYolu() {
    var p = (location.pathname || '/').toLowerCase().replace(/\/index\.html$/, '/').replace(/\/{2,}/g, '/');
    if (!/\.html$/.test(p) && p.slice(-1) !== '/') p += '/';
    return p;
  }

  function bugun() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }

  function eskileriTemizle(gun) {
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sayac:g:') === 0 && k.slice(8, 18) !== gun) localStorage.removeItem(k);
      }
    } catch (e) { /* sessizce geç */ }
  }

  var gonderildi = false;
  function say() {
    if (gonderildi || document.visibilityState !== 'visible') return;
    gonderildi = true;
    var gun = bugun(), sayfa = sayfaYolu();
    var kSayfa = 'sayac:g:' + gun + ':' + sayfa, kSite = 'sayac:g:' + gun + ':__site__';
    var tekil = true, siteTekil = true;
    try {
      tekil = !localStorage.getItem(kSayfa);
      siteTekil = !localStorage.getItem(kSite);
      localStorage.setItem(kSayfa, '1');
      localStorage.setItem(kSite, '1');
      eskileriTemizle(gun);
    } catch (e) { /* depo kapalıysa her açılış tekil sayılır; sorun değil */ }

    try {
      fetch(URL_, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'apikey': ANAHTAR },
        body: JSON.stringify({ p_sayfa: sayfa, p_tekil: tekil, p_site_tekil: siteTekil })
      }).catch(function () {});
    } catch (e) { /* ağ yoksa sessizce geç */ }
  }

  // Sayfa gerçekten görünür olsun ve en az 1,5 saniye açık kalsın (önizleme/anlık açılışlar sayılmasın).
  function bekle() { setTimeout(say, 1500); }
  if (document.visibilityState === 'visible') bekle();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') bekle(); });
})();
