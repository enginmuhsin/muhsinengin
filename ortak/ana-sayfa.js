/* =====================================================================
   ORTAK BİLEŞENLER — ortak/ana-sayfa.js
   muhsinengin.com'un bütün bölümlerinde (alt alan adları dahil) aynı görünen parçalar.

   1) <ana-sayfa-dugmesi></ana-sayfa-dugmesi>
      muhsinengin.com ana sayfasına dönen düğme. Rozetinde turuncu küreler yavaşça döner.
      Öznitelikler:
        tema="koyu"     koyu zeminli başlıklar için (oyunlar, ders odası). Yazılmazsa sitenin
                        açık/koyu temasına (ve cihazın temasına) kendiliğinden uyar.
        kisa            dar yerlerde yalnız rozet görünür (yazı ekran okuyucuya kalır).
      Betik yüklenemezse (örn. internetsiz) içine yazılan sade bağlantı görünür:
        <ana-sayfa-dugmesi><a href="https://muhsinengin.com/">Ana sayfa</a></ana-sayfa-dugmesi>

   2) <doner-kureler boyut="64"></doner-kureler>
      Üç boyutlu yörüngede dönen, düzgün altıgen (petek) kabuklu turuncu küreler (yükleniyor göstergesi ya da süs).
        boyut  piksel (varsayılan 48) · hiz  bir turun saniyesi (varsayılan 2.4)
        cekirdek  ortada lacivert çekirdek · yorunge  yörünge çizgileri de görünür (atom gibi)

   3) Sayfa geçişi: betik etiketine data-gecis yazılırsa, başka bir bölüme giden bağlantıya
      tıklanınca yeni sayfa gelene kadar ortada dönen küreler görünür (yavaş okul ağlarında
      "tıkladım ama bir şey olmadı mı?" duygusunu giderir).

   Neden "custom element"? Bileşen kendi gölge DOM'unda yaşar: sayfanın kendi CSS'i onu bozamaz,
   o da sayfayı bozmaz. Birebir Ders gibi ekranı sürekli yeniden çizen uygulamalarda da
   etiket her göründüğünde kendini yeniden kurar.
   ===================================================================== */
(function () {
  'use strict';
  if (window.customElements && customElements.get('ana-sayfa-dugmesi')) return;
  var ANA = 'https://muhsinengin.com/';
  var betik = document.currentScript;

  /* ---------- dönen küreler: CSS 3B (tuval yok, işlemciyi yormaz) ----------
     ATOM MODELİ: her küre kendi yörüngesinde döner. Yörüngeler 72° yatırılır ve 0°, 60°, 120° açılarla
     çevrilir; böylece bir küre yatay, ikisi çapraz (yukarıdan aşağıya) hareket eder. Yörüngelerin hızları
     farklıdır, küreler hiç aynı anda hizalanmaz. Her küre, bağlı olduğu dönüşlerin tersini uygulayarak hep
     bize bakar (billboard); hepsi aynı 3B sahnede olduğu için öndeki küre çekirdeğin önünden, arkadaki
     arkasından geçer ve perspektifle küçülür. */
  /* Düzgün altıgen (petek) kabuk deseni. Bir döşeme 17,32 × 30 birim: ortada bir altıgen ve alttaki iki
     altıgenin ortak dikey kenarı; yan yana dizilince kusursuz bal peteği olur.
     Küçük kürelerde (rozet, imza) hücreler iri, çizgiler kalın tutulur: yoksa petek göze görünmez. */
  function petek(cizgi, dolgu, kalin) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.32 30"><g fill="none" stroke="' + cizgi + '" stroke-width="' + kalin + '" stroke-linejoin="round">' +
      '<path d="M8.66 0L17.32 5V15L8.66 20L0 15V5Z" fill="' + dolgu + '"/><path d="M8.66 20V30"/></g></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  var PT = petek('rgba(110,28,0,.62)', 'rgba(255,240,215,.10)', 1.15), PT_K = petek('rgba(95,20,0,.85)', 'rgba(255,236,205,.22)', 2.6);
  var PL = petek('rgba(190,210,255,.55)', 'rgba(255,255,255,.06)', 1.15), PL_K = petek('rgba(205,222,255,.85)', 'rgba(255,255,255,.12)', 2.6);
  var EGIM = 72;
  function kureCSS(on) {
    var e = EGIM;
    return '' +
      '.y{position:relative;width:var(--s);height:var(--s);perspective:calc(var(--s)*4);}' +
      '.sh{position:absolute;inset:0;transform-style:preserve-3d;}' +
      '.y::before{content:"";position:absolute;inset:-12%;border-radius:50%;background:radial-gradient(circle,rgba(255,150,60,.22) 0,rgba(255,150,60,.08) 45%,transparent 70%);}' +
      '.o{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateZ(var(--f));}' +
      '.h{position:absolute;inset:0;transform-style:preserve-3d;animation:' + on + 'h var(--d) linear infinite;animation-delay:var(--g);}' +
      '.y.iz .h::before{content:"";position:absolute;inset:0;border-radius:50%;border:1px solid rgba(255,140,50,.28);}' +
      '.b{position:absolute;left:50%;top:0;width:var(--b);height:var(--b);margin-left:calc(var(--b)/-2);margin-top:calc(var(--b)/-2);border-radius:50%;' +
      // katmanlar (üstten alta): kenar gölgesi (deseni küreye sarar) · parlama · petek kabuk · turuncu gövde
      'background:radial-gradient(circle at 50% 50%,transparent 50%,rgba(90,22,0,.6) 100%),radial-gradient(circle at 32% 26%,rgba(255,250,235,.95) 0,rgba(255,220,170,.45) 11%,transparent 27%),' +
      'var(--pt) 0 0/calc(var(--b)*var(--hc)) calc(var(--b)*var(--hc)*1.732),radial-gradient(circle at 36% 32%,#ffd1a0 0,#ff9a3c 32%,#ec610f 66%,#9a3204 100%);' +
      'animation:' + on + 'b var(--d) linear infinite,' + on + 'p calc(var(--d)*1.5) linear infinite;animation-delay:var(--g),0s;}' +
      '.c{position:absolute;left:50%;top:50%;width:var(--c);height:var(--c);margin:calc(var(--c)/-2) 0 0 calc(var(--c)/-2);border-radius:50%;' +
      'background:radial-gradient(circle at 50% 50%,transparent 50%,rgba(5,12,40,.65) 100%),radial-gradient(circle at 33% 27%,rgba(235,242,255,.9) 0,transparent 28%),' +
      'var(--pl) 0 0/calc(var(--c)*var(--hc)) calc(var(--c)*var(--hc)*1.732),radial-gradient(circle at 35% 30%,#8fa8ff 0,#3654b8 35%,#1d3b8b 65%,#0b1a4a 100%);' +
      'animation:' + on + 'q calc(var(--t)*2.2) linear infinite reverse;}' +
      '.y{--pt:' + PT + ';--pl:' + PL + ';--hc:.36;}.y.kc{--pt:' + PT_K + ';--pl:' + PL_K + ';--hc:.62;}' +
      '@keyframes ' + on + 'p{from{background-position:0 0,0 0,0 0,0 0}to{background-position:0 0,0 0,calc(var(--b)*var(--hc)*2) 0,0 0}}' +
      '@keyframes ' + on + 'q{from{background-position:0 0,0 0,0 0,0 0}to{background-position:0 0,0 0,calc(var(--c)*var(--hc)*2) 0,0 0}}' +
      '@keyframes ' + on + 'h{from{transform:rotateX(' + e + 'deg) rotateZ(0)}to{transform:rotateX(' + e + 'deg) rotateZ(360deg)}}' +
      '@keyframes ' + on + 'b{from{transform:rotateZ(0deg) rotateX(-' + e + 'deg) rotateZ(calc(var(--f)*-1))}to{transform:rotateZ(-360deg) rotateX(-' + e + 'deg) rotateZ(calc(var(--f)*-1))}}' +
      '@media (prefers-reduced-motion:reduce){.h,.b,.c{animation:none}.h{transform:rotateX(' + e + 'deg)}.b{transform:rotateX(-' + e + 'deg) rotateZ(calc(var(--f)*-1))}}';
  }
  // n küre, her biri kendi yörüngesinde; kucuk: iri hücreli kalın petek; iz: yörünge çizgileri görünsün
  function kureHTML(n, cekirdek, kucuk, iz) {
    var hiz = [1, 1.31, 0.82, 1.17, 0.93], s = '<div class="y' + (kucuk ? ' kc' : '') + (iz ? ' iz' : '') + '"><div class="sh">';
    for (var i = 0; i < n; i++) {
      var d = 'calc(var(--t)*' + hiz[i % 5] + ')';
      s += '<div class="o" style="--f:' + (i * 180 / n) + 'deg;--d:' + d + ';--g:calc(' + d + '*' + (-i / n).toFixed(3) + ')"><div class="h">' +
        '<div class="b" style="--b:calc(var(--s)*' + (kucuk ? 0.31 : 0.24) + ')"></div></div></div>';
    }
    s += (cekirdek ? '<div class="c" style="--c:calc(var(--s)*' + (kucuk ? 0.36 : 0.3) + ')"></div>' : '') + '</div></div>';
    return s;
  }

  /* ---------- 1) ana sayfa düğmesi ---------- */
  var DUGME_CSS = kureCSS('as') +
    ':host{display:inline-flex;vertical-align:middle;--z:rgba(255,255,255,.9);--y:#1d3b8b;--c1:rgba(29,59,139,.22);--g:0 1px 2px rgba(15,25,60,.08),0 4px 14px rgba(15,25,60,.10);font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}' +
    ':host([tema="koyu"]){--z:rgba(16,22,46,.72);--y:#ffd9a8;--c1:rgba(255,190,120,.35);--g:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.35);}' +
    ':host(.koyu-site){--z:rgba(22,29,39,.85);--y:#c9d6ff;--c1:rgba(155,179,255,.3);--g:0 1px 2px rgba(0,0,0,.3),0 4px 14px rgba(0,0,0,.3);}' +
    'a{display:inline-flex;align-items:center;gap:8px;padding:5px 13px 5px 6px;border-radius:999px;background:var(--z);color:var(--y);border:1px solid var(--c1);box-shadow:var(--g);text-decoration:none;' +
    'letter-spacing:.01em;white-space:nowrap;-webkit-backdrop-filter:blur(8px) saturate(1.2);backdrop-filter:blur(8px) saturate(1.2);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;}' +
    'a:hover{transform:translateY(-1px);border-color:#ff8a2b;box-shadow:var(--g),0 0 0 3px rgba(255,138,43,.18);}' +
    'a:active{transform:translateY(0) scale(.98);}' +
    'a:focus-visible{outline:3px solid #ff8a2b;outline-offset:2px;}' +
    '.r{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 50% 45%,rgba(255,170,90,.18),transparent 70%);}' +
    '.y{--s:30px;--t:5.5s;}a:hover .y{--t:2s;}' +
    '.m{display:flex;flex-direction:column;gap:2px;}.m small{font-weight:500;font-size:10.5px;opacity:.68;letter-spacing:.02em;}' +
    ':host([kisa]) .m{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}:host([kisa]) a{padding:4px;}' +
    '@media (max-width:480px){.m small{display:none}}';

  function koyuMu() {
    var k = document.documentElement, t = k.getAttribute('data-theme');
    if (t === 'dark') return true; if (t === 'light') return false;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  }
  if (window.customElements) {
    customElements.define('ana-sayfa-dugmesi', class extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) return;
        var r = this.attachShadow({ mode: 'open' });
        r.innerHTML = '<style>' + DUGME_CSS + '</style><a href="' + ANA + '" part="dugme" aria-label="Ana sayfaya dön: muhsinengin.com"><span class="r">' + kureHTML(3, true, true) +
          '</span><span class="m"><span>Ana sayfa</span><small>muhsinengin.com</small></span></a>';
        var el = this, guncelle = function () { el.classList.toggle('koyu-site', !el.hasAttribute('tema') && koyuMu()); };
        guncelle();
        document.addEventListener('temadegisti', guncelle);
        try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', guncelle); } catch (e) { /* eski tarayıcı */ }
      }
    });

    /* ---------- 2) dönen küreler ---------- */
    customElements.define('doner-kureler', class extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) return;
        var s = parseFloat(this.getAttribute('boyut')) || 48, t = parseFloat(this.getAttribute('hiz')) || 2.4, n = parseInt(this.getAttribute('sayi'), 10) || 3;
        var r = this.attachShadow({ mode: 'open' });
        r.innerHTML = '<style>:host{display:inline-block;vertical-align:middle}' + kureCSS('dk') + '.y{--s:' + s + 'px;--t:' + t + 's}</style>' +
          kureHTML(n, this.hasAttribute('cekirdek'), s < 72, this.hasAttribute('yorunge'));
        if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-hidden')) { this.setAttribute('role', 'img'); this.setAttribute('aria-label', 'Yükleniyor'); }
      }
    });
  }

  /* ---------- 3) sayfa geçişi göstergesi ---------- */
  if (betik && betik.hasAttribute('data-gecis')) {
    var perde = null, zaman = null;
    var stil = document.createElement('style');
    stil.textContent = '.me-gecis{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(245,247,250,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .25s;pointer-events:none}' +
      '.me-gecis.gor{opacity:1}.me-gecis>div{display:flex;flex-direction:column;align-items:center;gap:14px;padding:22px 30px;border-radius:20px;background:rgba(255,255,255,.85);box-shadow:0 20px 50px rgba(15,25,60,.18);font:600 15px system-ui,sans-serif;color:#1d3b8b}' +
      '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .me-gecis{background:rgba(10,14,22,.55)}:root:not([data-theme="light"]) .me-gecis>div{background:rgba(22,29,39,.9);color:#c9d6ff}}' +
      ':root[data-theme="dark"] .me-gecis{background:rgba(10,14,22,.55)}:root[data-theme="dark"] .me-gecis>div{background:rgba(22,29,39,.9);color:#c9d6ff}';
    document.head.appendChild(stil);
    var kapat = function () { clearTimeout(zaman); if (perde) { perde.remove(); perde = null; } };
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (!/^https?:$/.test(u.protocol) || !/(^|\.)muhsinengin\.com$/.test(u.hostname) && u.origin !== location.origin) return;
      if (u.origin === location.origin && u.pathname === location.pathname) return;   // sayfa içi bağlantı
      kapat();
      zaman = setTimeout(function () {                    // hızlı açılan sayfada hiç görünmesin
        perde = document.createElement('div'); perde.className = 'me-gecis';
        perde.innerHTML = '<div><doner-kureler boyut="64" cekirdek aria-hidden="true"></doner-kureler><span>Açılıyor…</span></div>';
        document.body.appendChild(perde); requestAnimationFrame(function () { if (perde) perde.classList.add('gor'); });
      }, 250);
    });
    window.addEventListener('pageshow', kapat);           // geri tuşuyla dönülünce perde kalmasın
    window.addEventListener('pagehide', function () { clearTimeout(zaman); });
  }
})();
