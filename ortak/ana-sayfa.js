/* =====================================================================
   ORTAK BİLEŞENLER — ortak/ana-sayfa.js
   muhsinengin.com'un bütün bölümlerinde (alt alan adları dahil) aynı görünen parçalar.

   1) <me-imza boyut="72"></me-imza>
      Muhsin ENGİN imzası "Yörüngeli Küp": içinde M okunan izometrik küp (altıgen) ve çevresindeki
      eğik yörüngede dönen üç turuncu elektron. Ayrıntılı açıklama aşağıda, motorun başında.
        boyut    piksel (varsayılan 48)
        hiz      elektronların bir turu, saniye (varsayılan 6)
        duragan  hareket etmez (alt bilgi, yazdırma gibi yerler)
        izsiz    elektronların arkasındaki ışık izi çizilmez (40 pikselin altında zaten çizilmez)
        tema     "acik" | "koyu"; yazılmazsa sitenin ve cihazın temasına uyar
      Eski adı <doner-kureler> da aynı imzayı çizer (eski sayfalar bozulmasın diye).
      Durağan sürümü: muhsinengin.com/ortak/imza.svg (açık zemin), imza-koyu.svg, sekme simgesi /simge.svg.

   2) <ana-sayfa-dugmesi></ana-sayfa-dugmesi>
      muhsinengin.com ana sayfasına dönen düğme; rozeti küçük imzadır, üstüne gelince elektronlar hızlanır.
      Öznitelikler:
        tema="koyu"     koyu zeminli başlıklar için (oyunlar, ders odası). Yazılmazsa sitenin
                        açık/koyu temasına (ve cihazın temasına) kendiliğinden uyar.
        kisa            dar yerlerde yalnız rozet görünür (yazı ekran okuyucuya kalır).
      Betik yüklenemezse (örn. internetsiz) içine yazılan sade bağlantı görünür:
        <ana-sayfa-dugmesi><a href="https://muhsinengin.com/">Ana sayfa</a></ana-sayfa-dugmesi>

   3) Sayfa geçişi: betik etiketine data-gecis yazılırsa, başka bir bölüme giden bağlantıya
      tıklanınca yeni sayfa gelene kadar ortada hızlı dönen imza görünür (yavaş okul ağlarında
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

  /* =====================================================================
     MUHSİN ENGİN İMZASI — "Yörüngeli Küp"
     Üç düşünce tek şekilde:
       · GEOMETRİ: düzgün altıgen. Merkezden üç kola ayrılınca izometrik bir KÜP olur (3B tasarım, üretim).
       · İMZA: küpün ön kenarları bir M çizer: sol kenar yukarı, merkeze iniş, sağ köşeye çıkış, sağ kenar aşağı.
               M'nin dibi tam merkezde, atomun çekirdeğinin olacağı yerde durur.
       · FİZİK: küpün çevresinde eğik bir yörünge ve üç turuncu elektron. Yörünge düzlemi yavaşça yalpalar
               (precession), bu yüzden elektronlar hem sağa-sola hem yukarı-aşağı gezer.
       · MEDAR: altıgen, MEDAR tahtasının biçimi; küpün üç yüzü üç ton gölgeyle ayrılır.
     Gerçek 3B hesap yapılır: yörüngenin arka yarısı ve arkadaki elektron küpün ARKASINDAN geçer
     ve küçülür; öndeki büyür. Her elektronun ardında sönen kısa bir ışık izi kalır.
     Bütün imzalar tek bir requestAnimationFrame saatiyle çizilir; ekranda görünmeyen ya da
     arka sekmedeki imza hesap yapmaz. "Hareketi azalt" ayarında durağan logo gösterilir.
     ===================================================================== */
  var NS = 'http://www.w3.org/2000/svg', C30 = Math.cos(Math.PI / 6);
  var RENK = {
    acik: { ink: '#1d3b8b', yuz: ['rgba(29,59,139,.10)', 'rgba(29,59,139,.22)', 'rgba(29,59,139,.36)'], cizgi: 'rgba(29,59,139,.55)', yor: '#e08a1e' },
    koyu: { ink: '#d6e0ff', yuz: ['rgba(155,179,255,.16)', 'rgba(155,179,255,.28)', 'rgba(155,179,255,.42)'], cizgi: 'rgba(190,206,255,.6)', yor: '#ffb04a' }
  };
  var G = { cx: 32, cy: 32, R: 27, r: 15.5, egim: 70, don: -22, faz: [62, 160, 250] };   // durağan logo bu anın fotoğrafıdır
  function kupSVG(k) {
    var r = G.r, cx = G.cx, cy = G.cy, P = { T: [0, -r], UR: [r * C30, -r / 2], LR: [r * C30, r / 2], B: [0, r], LL: [-r * C30, r / 2], UL: [-r * C30, -r / 2], C: [0, 0] };
    var q = function (n) { return (cx + P[n][0]).toFixed(2) + ' ' + (cy + P[n][1]).toFixed(2); };
    return '<path d="M' + q('T') + 'L' + q('UR') + 'L' + q('C') + 'L' + q('UL') + 'Z" fill="' + k.yuz[0] + '"/>' +
      '<path d="M' + q('UL') + 'L' + q('C') + 'L' + q('B') + 'L' + q('LL') + 'Z" fill="' + k.yuz[1] + '"/>' +
      '<path d="M' + q('C') + 'L' + q('UR') + 'L' + q('LR') + 'L' + q('B') + 'Z" fill="' + k.yuz[2] + '"/>' +
      '<path d="M' + q('UL') + 'L' + q('T') + 'L' + q('UR') + 'M' + q('LR') + 'L' + q('B') + 'L' + q('LL') + 'M' + q('C') + 'L' + q('B') + '" fill="none" stroke="' + k.cizgi + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M' + q('LL') + 'L' + q('UL') + 'L' + q('C') + 'L' + q('UR') + 'L' + q('LR') + '" fill="none" stroke="' + k.ink + '" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  // yörünge üzerindeki a açılı noktanın ekran konumu ve derinliği (z>0: önde)
  function nokta(a, egim, don) {
    var e = egim * Math.PI / 180, d = don * Math.PI / 180, x = G.R * Math.cos(a), y = G.R * Math.sin(a) * Math.cos(e), z = G.R * Math.sin(a) * Math.sin(e);
    return [G.cx + x * Math.cos(d) - y * Math.sin(d), G.cy + x * Math.sin(d) + y * Math.cos(d), z / G.R];
  }
  var IZ = 7, IZ_ADIM = 0.12;   // iz: 7 parça, her biri 0,12 radyan geride
  function Imza(kok, boyut, secenek) {
    this.boyut = boyut; this.iz = secenek.iz; this.hiz = secenek.hiz; this.kat = 1; this.hedefKat = 1;
    this.aci = 0; this.zaman = 0; this.gorunur = true; this.tema = null;
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 64 64'); svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    svg.setAttribute('aria-hidden', 'true'); svg.style.overflow = 'visible'; svg.style.display = 'block';
    svg.innerHTML = '<defs><radialGradient id="e" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffe7c9"/><stop offset=".42" stop-color="#ff9a3c"/><stop offset="1" stop-color="#b8400a"/></radialGradient></defs>' +
      '<g class="arka"><path class="hy" fill="none" stroke-width="1.4" stroke-linecap="round" opacity=".6"/></g><g class="kup"></g><g class="on"><path class="hy" fill="none" stroke-width="1.6" stroke-linecap="round"/></g>';
    kok.appendChild(svg); this.svg = svg;
    this.kupG = svg.querySelector('.kup'); this.hyA = svg.querySelector('.arka .hy'); this.hyO = svg.querySelector('.on .hy');
    this.el = []; var self = this;
    G.faz.forEach(function () {
      var o = { iz: [] };
      ['arka', 'on'].forEach(function (k) {
        var g = svg.querySelector('.' + k);
        for (var i = 0; i < (self.iz ? IZ : 0); i++) { var l = document.createElementNS(NS, 'line'); l.setAttribute('stroke-linecap', 'round'); g.appendChild(l); o.iz.push({ k: k, l: l, i: i }); }
        var c = document.createElementNS(NS, 'circle'); c.setAttribute('fill', 'url(#e)'); g.appendChild(c); o[k] = c;
      });
      self.el.push(o);
    });
  }
  Imza.prototype.renk = function (koyu) {
    var t = koyu ? 'koyu' : 'acik'; if (t === this.tema) return; this.tema = t;
    var k = RENK[t]; this.kupG.innerHTML = kupSVG(k); this.hyA.setAttribute('stroke', k.yor); this.hyO.setAttribute('stroke', k.yor);
    this.el.forEach(function (o) { o.iz.forEach(function (p) { p.l.setAttribute('stroke', k.yor); }); });
  };
  Imza.prototype.ciz = function () {
    // yalpalama: eğim 56°–80° arasında (yörünge açılıp kapanır, elektronlar küpün üstünden-altından geçer), dönme ±34°
    var t = this.zaman, egim = G.egim - 2 + 12 * Math.sin(t * 0.37), don = G.don + 34 * Math.sin(t * 0.19), self = this;
    // yörünge: alt yarı (sin a > 0) önde, üst yarı arkada
    var on = '', arka = '';
    for (var i = 0; i <= 48; i++) {
      var p = nokta(Math.PI * i / 48, egim, don), q = nokta(Math.PI + Math.PI * i / 48, egim, don);
      on += (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); arka += (i ? 'L' : 'M') + q[0].toFixed(2) + ' ' + q[1].toFixed(2);
    }
    this.hyO.setAttribute('d', on); this.hyA.setAttribute('d', arka);
    this.el.forEach(function (o, n) {
      var a = self.aci + G.faz[n] * Math.PI / 180, p = nokta(a, egim, don), onde = p[2] >= 0, rr = 3.15 + 0.85 * p[2];
      o.on.style.display = onde ? '' : 'none'; o.arka.style.display = onde ? 'none' : '';
      var c = onde ? o.on : o.arka; c.setAttribute('cx', p[0].toFixed(2)); c.setAttribute('cy', p[1].toFixed(2)); c.setAttribute('r', rr.toFixed(2));
      o.iz.forEach(function (s) {
        var a1 = a - s.i * IZ_ADIM - 0.05, a2 = a1 - IZ_ADIM, p1 = nokta(a1, egim, don), p2 = nokta(a2, egim, don), ond = (p1[2] + p2[2]) >= 0;
        if ((s.k === 'on') !== ond) { s.l.style.display = 'none'; return; }
        s.l.style.display = ''; s.l.setAttribute('x1', p1[0].toFixed(2)); s.l.setAttribute('y1', p1[1].toFixed(2)); s.l.setAttribute('x2', p2[0].toFixed(2)); s.l.setAttribute('y2', p2[1].toFixed(2));
        var w = (3.15 + 0.85 * p1[2]) * 1.15 * (1 - s.i / (IZ + 2)); s.l.setAttribute('stroke-width', w.toFixed(2)); s.l.setAttribute('stroke-opacity', (0.5 * (1 - s.i / IZ)).toFixed(2));
      });
    });
  };
  // tek saat: bütün imzalar
  var IMZALAR = [], saat = null, onceki = 0;
  var hareketsiz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tik(ts) {
    var dt = Math.min(0.05, onceki ? (ts - onceki) / 1000 : 0); onceki = ts; var calisan = false;
    IMZALAR.forEach(function (m) {
      if (!m.gorunur || m.duragan) return; calisan = true;
      m.kat += (m.hedefKat - m.kat) * Math.min(1, dt * 4);
      m.zaman += dt * (0.6 + 0.4 * m.kat); m.aci += dt * m.kat * 2 * Math.PI / m.hiz; m.ciz();
    });
    saat = (calisan && !document.hidden) ? requestAnimationFrame(tik) : null; if (!saat) onceki = 0;
  }
  function saatiKur() { if (!saat && !hareketsiz && !document.hidden) saat = requestAnimationFrame(tik); }
  document.addEventListener('visibilitychange', saatiKur);
  var gozcu = window.IntersectionObserver ? new IntersectionObserver(function (gl) {
    gl.forEach(function (g) { var m = g.target.__imza; if (m) { m.gorunur = g.isIntersecting; } }); saatiKur();
  }) : null;
  function koyuMu() {
    var k = document.documentElement, t = k.getAttribute('data-theme');
    if (t === 'dark') return true; if (t === 'light') return false;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  }
  // <me-imza> (ve eski adıyla <doner-kureler>)
  function imzaKur(host) {
    if (host.shadowRoot) return host.__imza;
    var boyut = parseFloat(host.getAttribute('boyut')) || 48;
    var r = host.attachShadow({ mode: 'open' }); // boyut varsayılandır; sayfa CSS'i genişlik/yükseklik verirse (örn. 1.8em) imza yazıyla birlikte ölçeklenir
    r.innerHTML = '<style>:host{display:inline-block;vertical-align:middle;line-height:0;width:' + boyut + 'px;height:' + boyut + 'px}</style>';
    var m = new Imza(r, boyut, { iz: boyut >= 40 && !host.hasAttribute('izsiz'), hiz: parseFloat(host.getAttribute('hiz')) || 6 });
    m.duragan = hareketsiz || host.hasAttribute('duragan'); host.__imza = m;
    var renkle = function () { var t = host.getAttribute('tema'); m.renk(t ? t === 'koyu' : koyuMu()); };
    renkle(); m.ciz();
    document.addEventListener('temadegisti', renkle);
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renkle); } catch (e) { /* eski tarayıcı */ }
    new MutationObserver(renkle).observe(host, { attributes: true, attributeFilter: ['tema'] });
    IMZALAR.push(m); if (gozcu) gozcu.observe(host); saatiKur();
    if (!host.hasAttribute('aria-label') && !host.hasAttribute('aria-hidden')) { host.setAttribute('role', 'img'); host.setAttribute('aria-label', 'Muhsin ENGİN imzası'); }
    return m;
  }

  /* ---------- 1) ana sayfa düğmesi ---------- */
  var DUGME_CSS =
    ':host{display:inline-flex;vertical-align:middle;--z:rgba(255,255,255,.9);--y:#1d3b8b;--c1:rgba(29,59,139,.22);--g:0 1px 2px rgba(15,25,60,.08),0 4px 14px rgba(15,25,60,.10);--g1:rgba(15,25,60,.08);--g2:rgba(15,25,60,.10);--g2o:4px 14px;font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}' +
    ':host([tema="koyu"]){--z:rgba(16,22,46,.72);--y:#ffd9a8;--c1:rgba(255,190,120,.35);--g:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.35);--g1:rgba(0,0,0,.3);--g2:rgba(0,0,0,.35);--g2o:6px 18px;}' +
    ':host(.koyu-site){--z:rgba(22,29,39,.85);--y:#c9d6ff;--c1:rgba(155,179,255,.3);--g:0 1px 2px rgba(0,0,0,.3),0 4px 14px rgba(0,0,0,.3);--g1:rgba(0,0,0,.3);--g2:rgba(0,0,0,.3);--g2o:4px 14px;}' +
    'a{display:inline-flex;align-items:center;gap:8px;padding:5px 13px 5px 6px;border-radius:999px;background:var(--ana-sayfa-zemin,var(--z));color:var(--murekkep,var(--y));border:1px solid var(--ana-sayfa-zemin,var(--c1));' +
    'box-shadow:0 1px 2px var(--ana-sayfa-zemin,var(--g1)),0 var(--g2o) var(--ana-sayfa-zemin,var(--g2));text-decoration:none;' +
    'letter-spacing:.01em;white-space:nowrap;-webkit-backdrop-filter:blur(8px) saturate(1.2);backdrop-filter:blur(8px) saturate(1.2);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;}' +
    'a:hover{transform:translateY(var(--ana-sayfa-kalk,-1px));border-color:var(--ana-sayfa-zemin,#ff8a2b);box-shadow:0 1px 2px var(--ana-sayfa-zemin,var(--g1)),0 var(--g2o) var(--ana-sayfa-zemin,var(--g2)),0 0 0 3px var(--ana-sayfa-zemin,rgba(255,138,43,.18));}' +
    '.m>span{text-decoration:underline;text-decoration-color:var(--murekkep,transparent);text-decoration-thickness:1px;text-underline-offset:1px;}a:hover .m>span{text-decoration-thickness:2px;}' +
    'a:active{transform:translateY(0) scale(.98);}' +
    'a:focus-visible{outline:3px solid #ff8a2b;outline-offset:2px;}' +
    '.r{display:grid;place-items:center;width:32px;height:32px;}' +
    '.m{display:flex;flex-direction:column;gap:2px;}.m small{font-weight:500;font-size:10.5px;color:var(--kursun,color-mix(in srgb,currentColor 68%,transparent));letter-spacing:.02em;}' +
    ':host([kisa]) .m{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}:host([kisa]) a{padding:4px;}' +
    '@media (max-width:480px){.m small{display:none}}';

  if (window.customElements) {
    customElements.define('ana-sayfa-dugmesi', class extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) return;
        var r = this.attachShadow({ mode: 'open' });
        r.innerHTML = '<style>' + DUGME_CSS + '</style><a href="' + ANA + '" part="dugme" title="Ana sayfaya dön"><span class="r"><me-imza boyut="30" aria-hidden="true"></me-imza>' +
          '</span><span class="m"><span>Ana sayfa</span><small>muhsinengin.com</small></span></a>';
        var el = this, imza = r.querySelector('me-imza'), a = r.querySelector('a');
        var guncelle = function () { var koyu = el.getAttribute('tema') === 'koyu' || (!el.hasAttribute('tema') && koyuMu()); el.classList.toggle('koyu-site', !el.hasAttribute('tema') && koyuMu()); imza.setAttribute('tema', koyu ? 'koyu' : 'acik'); };
        guncelle();
        document.addEventListener('temadegisti', guncelle);
        try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', guncelle); } catch (e) { /* eski tarayıcı */ }
        // üstüne gelince elektronlar hızlanır
        a.addEventListener('pointerenter', function () { if (imza.__imza) imza.__imza.hedefKat = 3.5; });
        a.addEventListener('pointerleave', function () { if (imza.__imza) imza.__imza.hedefKat = 1; });
      }
    });

    /* ---------- 2) imza: <me-imza boyut="72"> · eski ad <doner-kureler> da aynı imzayı çizer ---------- */
    var ImzaEl = class extends HTMLElement { connectedCallback() { imzaKur(this); } };
    customElements.define('me-imza', ImzaEl);
    customElements.define('doner-kureler', class extends HTMLElement { connectedCallback() { imzaKur(this); } });
  }

  /* ---------- 4) telefon menüsü: <button data-menu-dugme> içinde bulunduğu <nav>'ı açar/kapar ----------
     nav'a "acik" sınıfı eklenir (görünüm sayfanın CSS'indedir). Bağlantıya basınca, Esc ile, menü dışına
     dokununca ya da ekran genişleyince kapanır. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-menu-dugme]');
    var acikNav = document.querySelector('nav.acik');
    if (b) { var n = b.closest('nav'); if (!n) return; var ac = !n.classList.contains('acik'); n.classList.toggle('acik', ac); b.setAttribute('aria-expanded', String(ac)); return; }
    if (acikNav && (!acikNav.contains(e.target) || e.target.closest('a[href]'))) menuyuKapat();
  });
  function menuyuKapat() { document.querySelectorAll('nav.acik').forEach(function (n) { n.classList.remove('acik'); var b = n.querySelector('[data-menu-dugme]'); if (b) b.setAttribute('aria-expanded', 'false'); }); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.querySelector('nav.acik')) { var b = document.querySelector('nav.acik [data-menu-dugme]'); menuyuKapat(); if (b) b.focus(); } });
  try { matchMedia('(min-width: 761px)').addEventListener('change', function (m) { if (m.matches) menuyuKapat(); }); } catch (e) { /* eski tarayıcı */ }

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
        perde.innerHTML = '<div><me-imza boyut="76" hiz="2.6" aria-hidden="true"></me-imza><span>Açılıyor…</span></div>';
        document.body.appendChild(perde); requestAnimationFrame(function () { if (perde) perde.classList.add('gor'); });
      }, 250);
    });
    window.addEventListener('pageshow', kapat);           // geri tuşuyla dönülünce perde kalmasın
    window.addEventListener('pagehide', function () { clearTimeout(zaman); });
  }
})();
