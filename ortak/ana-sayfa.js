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
      Üç boyutlu yörüngede dönen turuncu küreler (yükleniyor göstergesi ya da süs).
        boyut  piksel (varsayılan 48) · hiz  bir turun saniyesi (varsayılan 2.4)

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
     Bir halka 66° yatırılıp kendi ekseninde döner; küreler halkanın üstünde durur ama her biri
     halkanın dönüşünü tersine çevirerek hep bize bakar (billboard). Arkadaki küre perspektif
     nedeniyle küçülür ve soluklaşır: göz bunu derinlik olarak okur. */
  function kureCSS(on) {
    return '' +
      '.y{position:relative;width:var(--s);height:var(--s);perspective:calc(var(--s)*4);}' +
      '.h{position:absolute;inset:0;transform-style:preserve-3d;animation:' + on + 'h var(--t) linear infinite;}' +
      '.k{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateZ(var(--a));}' +
      '.b{position:absolute;left:50%;top:0;width:var(--b);height:var(--b);margin-left:calc(var(--b)/-2);margin-top:calc(var(--b)/-2);border-radius:50%;' +
      'background:radial-gradient(circle at 34% 30%,#fff1df 0,#ffc27a 14%,#ff8a2b 42%,#e5560a 72%,#8f2c00 100%);' +
      'box-shadow:0 0 calc(var(--b)*.5) rgba(255,120,30,.55),inset calc(var(--b)*-.08) calc(var(--b)*-.12) calc(var(--b)*.2) rgba(120,30,0,.45);' +
      'animation:' + on + 'b var(--t) linear infinite;}' +
      '.c{position:absolute;left:50%;top:50%;width:var(--c);height:var(--c);margin:calc(var(--c)/-2) 0 0 calc(var(--c)/-2);border-radius:50%;' +
      'background:radial-gradient(circle at 35% 30%,#8fa8ff 0,#3654b8 35%,#1d3b8b 65%,#0b1a4a 100%);box-shadow:0 0 calc(var(--c)*.4) rgba(60,90,200,.45);}' +
      '@keyframes ' + on + 'h{from{transform:rotateX(66deg) rotateZ(0)}to{transform:rotateX(66deg) rotateZ(360deg)}}' +
      '@keyframes ' + on + 'b{from{transform:rotateZ(calc(var(--a)*-1)) rotateX(-66deg)}to{transform:rotateZ(calc(var(--a)*-1 - 360deg)) rotateX(-66deg)}}' +
      '@media (prefers-reduced-motion:reduce){.h,.b{animation:none}.h{transform:rotateX(66deg)}.b{transform:rotateZ(calc(var(--a)*-1)) rotateX(-66deg)}}';
  }
  function kureHTML(n, cekirdek) {
    var s = '<div class="y"><div class="h">';
    for (var i = 0; i < n; i++) s += '<div class="k" style="--a:' + (i * 360 / n) + 'deg"><div class="b" style="--b:calc(var(--s)*' + (n > 3 ? 0.22 : 0.26) + ')"></div></div>';
    s += '</div>' + (cekirdek ? '<div class="c"></div>' : '') + '</div>';
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
    '.r{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 50% 45%,rgba(255,170,90,.18),transparent 70%);}' +
    '.y{--s:26px;--t:5.5s;--c:9px;}a:hover .h,a:hover .b{animation-duration:1.6s;}' +
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
        r.innerHTML = '<style>' + DUGME_CSS + '</style><a href="' + ANA + '" part="dugme" aria-label="Ana sayfaya dön: muhsinengin.com"><span class="r">' + kureHTML(3, true) +
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
        r.innerHTML = '<style>:host{display:inline-block;vertical-align:middle}' + kureCSS('dk') + '.y{--s:' + s + 'px;--t:' + t + 's;--c:' + (s * 0.3) + 'px}</style>' + kureHTML(n, this.hasAttribute('cekirdek'));
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
