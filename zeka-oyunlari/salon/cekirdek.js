'use strict';
/* =====================================================================
   OYUN SALONU — ortak çekirdek
   Her oyun Salon.kaydet(id, tanim) ile kendini tanıtır.
   tanim = { baslik, alt, ozet, etiketler[], onizleme() → svg,
             kurallar[], secenekler?[], dallanmaRef?, dallanmaAd?,
             olustur(api) → { yeni(), geriAl?(), yokEt?() } }
   ===================================================================== */
const Salon = (() => {
  const oyunlar = {}, sira = [];
  const $ = (id) => document.getElementById(id);
  let aktif = null, aktifId = null, isciler = [];

  const VARSAYILAN = [
    { id: 'rakip', ad: 'Rakip', sec: [['bilgisayar', 'Bilgisayar'], ['insan', 'İki kişi']], v: 'bilgisayar' },
    { id: 'seviye', ad: 'Seviye', sec: [['kolay', 'Kolay'], ['orta', 'Orta'], ['zor', 'Zor']], v: 'orta', goster: (a) => a.rakip !== 'insan' },
  ];

  /* ---------- güvenli depolama ---------- */
  const oku = (k, v) => { try { const x = localStorage.getItem('salon.' + k); return x == null ? v : JSON.parse(x); } catch (e) { return v; } };
  const yaz = (k, v) => { try { localStorage.setItem('salon.' + k, JSON.stringify(v)); } catch (e) {} };

  /* ---------- günün bulmacası: herkese aynı tohum ---------- */
  const gunAnahtari = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const gunAdi = () => new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  function tohumlu(tohum) { // mulberry32: aynı tohum → her tarayıcıda aynı sayı dizisi
    let a = typeof tohum === 'string' ? [...tohum].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703) : tohum >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const karistir = (dizi, rnd = Math.random) => { for (let i = dizi.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [dizi[i], dizi[j]] = [dizi[j], dizi[i]]; } return dizi; };
  async function kopyala(metin) {
    try { await navigator.clipboard.writeText(metin); return true; }
    catch (e) { const t = document.createElement('textarea'); t.value = metin; document.body.append(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} t.remove(); return ok; }
  }

  /* ---------- yardımcılar ---------- */
  const tr = (x, b = 0) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b });
  // Ortak oyun ikonları (ortak/oyun-ikonlari.svg); kendi sayfası olan oyunlar
  const SAYFALI = new Set(['satranc', 'go', 'mangala', 'reversi', 'hex', 'gizlikod', 'sudoku']);
  const SAYFA_ADI = { gizlikod: 'gizli-kod' };   // oyun kimliği ≠ sayfa klasörü olanlar
  function ikon(id) {
    if (!SAYFALI.has(id)) return null;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ikon'); s.setAttribute('aria-hidden', 'true');
    const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '../../ortak/oyun-ikonlari.svg#ik-' + id); s.append(u); return s;
  }
  function el(etiket, ozellik = {}, ...cocuk) {
    const e = document.createElement(etiket);
    for (const [k, v] of Object.entries(ozellik)) {
      if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of cocuk.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  }
  const svgNS = 'http://www.w3.org/2000/svg';
  function svg(etiket, oz = {}) { const e = document.createElementNS(svgNS, etiket); for (const [k, v] of Object.entries(oz)) e.setAttribute(k, v); return e; }

  /* ---------- işçi (Web Worker): yapay zeka arayüzü dondurmasın ----------
     kaynak: içinde `function dusun(veri)` tanımlı JS metni.
     Her soru yeni bir işçide çalışır; önceki soru iptal edilir (eski cevap gelmez). */
  function isciYap(kaynak) {
    let w = null, yedek = null;
    return {
      sor(veri) {
        this.iptal();
        return new Promise((coz) => {
          try {
            const url = URL.createObjectURL(new Blob([kaynak + '\nself.onmessage=function(e){self.postMessage(dusun(e.data));};'], { type: 'text/javascript' }));
            w = new Worker(url); isciler.push(w);
            const benim = w;
            w.onmessage = (e) => { if (benim === w) { w.terminate(); w = null; coz(e.data); } };
            w.onerror = () => { if (benim === w) { w.terminate(); w = null; yedekCalis(); } };
            w.postMessage(veri);
          } catch (e) { yedekCalis(); }
          function yedekCalis() {
            if (!yedek) yedek = new Function(kaynak + '\nreturn dusun;')();
            setTimeout(() => coz(yedek(veri)), 30);
          }
        });
      },
      iptal() { if (w) { w.terminate(); w = null; } },
    };
  }

  /* ---------- dallanma ölçer ---------- */
  let dal = { toplam: 0, sayi: 0, log: 0 };
  function dallanmaCiz() {
    const t = aktif.tanim, kutu = $('dallanma');
    if (!dal.sayi) { kutu.innerHTML = `Her hamlede kaç yasal seçenek olduğunu sayacağım. Kaynaklardaki tipik değer: <b>${t.dallanmaRef ?? '—'}</b>.`; return; }
    const b = dal.toplam / dal.sayi;
    const L = t.oyunUzunlugu || 40;
    kutu.innerHTML = `Bu oyunda <b class="num">${dal.sayi}</b> konumda ortalama <b class="num">${tr(b, 1)}</b> yasal hamle vardı.
      ${t.oyunUzunlugu ? `${L} hamlelik bir oyunda olası oyun sayısı kabaca <b class="num">b<sup>${L}</sup> ≈ 10<sup>${tr(L * Math.log10(Math.max(b, 1)), 0)}</sup></b>.` : ''}
      Kaynaklardaki tipik değer: <b>${t.dallanmaRef ?? '—'}</b>.`;
  }
  function dallanmaKaydet(n) {
    if (!(n > 0)) return;
    dal.toplam += n; dal.sayi++;
    const k = oku('dallanma', {}); const x = k[aktifId] || { toplam: 0, sayi: 0 };
    x.toplam += n; x.sayi++; k[aktifId] = x; yaz('dallanma', k);
    dallanmaCiz();
  }

  /* ---------- seçenek paneli ---------- */
  function ayarlariOku(t) {
    const kayit = oku('ayar.' + aktifId, {});
    const a = {};
    for (const g of (t.secenekler || VARSAYILAN)) a[g.id] = g.sec.some(([v]) => v === kayit[g.id]) ? kayit[g.id] : g.v;
    return a;
  }
  function seceneklerCiz() {
    const t = aktif.tanim, a = aktif.ayar, kutu = $('secenekler'); kutu.innerHTML = '';
    for (const g of (t.secenekler || VARSAYILAN)) {
      if (g.goster && !g.goster(a)) continue;
      kutu.append(el('div', { class: 'secim', role: 'group', 'aria-label': g.ad }, el('span', {}, g.ad),
        g.sec.map(([v, ad]) => el('button', {
          class: 'cip', type: 'button', 'aria-pressed': String(a[g.id] === v),
          onclick: () => { a[g.id] = v; yaz('ayar.' + aktifId, a); seceneklerCiz(); yeniOyun(); },
        }, ad))));
    }
  }

  /* ---------- api: oyunun dünyayla konuştuğu tek yer ---------- */
  function apiYap() {
    return {
      tahta: $('tahta'), el, svg, tr, oku, yaz, isciYap, gunAnahtari, gunAdi, tohumlu, karistir, kopyala,
      get ayar() { return aktif.ayar; },
      durum(html, opts = {}) { const d = $('durum'); d.innerHTML = html; d.classList.toggle('dusunuyor', !!opts.dusunuyor); },
      neden(html) { $('nedenKutu').hidden = !html; $('neden').innerHTML = html || ''; },
      mat(html) { $('mat').innerHTML = html; },
      dallanma: dallanmaKaydet,
      bitti(metin, kayip = false) { const a = $('afis'); a.hidden = false; a.className = 'afis' + (kayip ? ' kayip' : ''); a.textContent = metin; },
      bildir(m, ms = 1600) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(t._z); t._z = setTimeout(() => (t.hidden = true), ms); },
      geriAlAktif(v) { $('geriAl').disabled = !v; },
      // ekran okuyucuya hamleyi söyle ("Beyaz e2–e4")
      duyur(m) { const d = $('duyuru'); if (d) { d.textContent = ''; setTimeout(() => (d.textContent = m), 30); } },
      // paylaşılabilir konum kodu: oyun her hamlede bildirir
      konum(kod) { if (aktif) { aktif.kod = kod || ''; const p = $('paylas'); if (p) p.disabled = !kod; } },
    };
  }

  function yeniOyun() {
    isciler.forEach((w) => w.terminate()); isciler = [];
    dal = { toplam: 0, sayi: 0 };
    $('afis').hidden = true; $('neden').innerHTML = ''; $('nedenKutu').hidden = true;
    dallanmaCiz();
    aktif.oyun.yeni();
  }

  function oyunAc(id, zorla, kod) {
    const t = oyunlar[id]; if (!t) return salonAc();
    if (aktif && aktif.oyun.yokEt) aktif.oyun.yokEt();
    aktifId = id;
    $('salon').hidden = true; $('oyunSayfa').hidden = false; $('salonaDon').hidden = false;
    $('oyunBaslik').textContent = t.baslik; $('oyunAlt').textContent = t.alt;
    $('kurallar').innerHTML = t.kurallar.map((k) => `<li>${k}</li>`).join('') + (SAYFALI.has(id) ? `<li class="sayfa-bag"><a href="../${SAYFA_ADI[id] || id}/">${t.baslik}: tarihi ve arkasındaki matematik →</a></li>` : '');
    $('tahta').innerHTML = ''; $('mat').innerHTML = '';
    document.title = t.baslik + ' · Oyun Salonu';
    aktif = { tanim: t, ayar: null, oyun: null };
    aktif.ayar = ayarlariOku(t);
    if (zorla) Object.assign(aktif.ayar, zorla);
    seceneklerCiz();
    aktif.oyun = t.olustur(apiYap());
    $('geriAl').hidden = !aktif.oyun.geriAl; $('geriAl').disabled = true;
    $('paylas').hidden = !aktif.oyun.yukle; $('paylas').disabled = true;
    $('dallanma').closest('.kutu').hidden = !!t.arac;
    yeniOyun();
    if (kod && aktif.oyun.yukle) { try { aktif.oyun.yukle(kod); apiYap().bildir('Paylaşılan konum açıldı.'); } catch (e) { apiYap().bildir('Bu bağlantıdaki konum okunamadı; yeni oyun başladı.'); } }
    turGoster(false);
    scrollTo(0, 0);
  }

  /* ---------- öğretici tur: ilk açılışta 3 adım; "Nasıl oynanır?" ile tekrar ---------- */
  function turGoster(zorla) {
    const t = aktif && aktif.tanim; const eski = document.getElementById('turKart'); if (eski) eski.remove();
    if (!t || !t.tur) return;
    if (!zorla && oku('tur.' + aktifId, false)) return;
    let i = 0;
    const kart = el('div', { id: 'turKart', class: 'tur-kart', role: 'dialog', 'aria-label': t.baslik + ': nasıl oynanır' });
    const ciz = () => {
      const a = t.tur[i]; kart.innerHTML = '';
      kart.append(el('div', { class: 'tur-ust' }, el('span', { class: 'kas' }, `Nasıl oynanır · ${i + 1}/${t.tur.length}`), el('button', { type: 'button', class: 'tur-kapat', 'aria-label': 'Turu kapat', onclick: kapat }, '×')),
        el('b', {}, a.baslik), el('p', {}, a.metin),
        el('div', { class: 'dugmeler' },
          i > 0 ? el('button', { type: 'button', class: 'dug', onclick: () => { i--; ciz(); } }, 'Geri') : null,
          el('button', { type: 'button', class: 'dug ana', onclick: () => { if (i < t.tur.length - 1) { i++; ciz(); } else kapat(); } }, i < t.tur.length - 1 ? 'İleri' : 'Oynamaya başla')));
      document.querySelectorAll('.tur-vurgu').forEach((x) => x.classList.remove('tur-vurgu'));
      if (a.vurgu) document.querySelectorAll(a.vurgu).forEach((x) => x.classList.add('tur-vurgu'));
      kart.querySelector('.dug.ana').focus();
    };
    function kapat() { yaz('tur.' + aktifId, true); kart.remove(); document.querySelectorAll('.tur-vurgu').forEach((x) => x.classList.remove('tur-vurgu')); }
    document.querySelector('.alan').append(kart); ciz();
  }

  function salonAc() {
    if (aktif && aktif.oyun && aktif.oyun.yokEt) aktif.oyun.yokEt();
    isciler.forEach((w) => w.terminate()); isciler = [];
    aktif = null; aktifId = null;
    $('salon').hidden = false; $('oyunSayfa').hidden = true; $('salonaDon').hidden = true;
    document.title = 'Oyun Salonu';
    dallanmaTablosu();
  }

  function dallanmaTablosu() {
    const k = oku('dallanma', {});
    const satirlar = sira.filter((id) => !oyunlar[id].arac).map((id) => ({ id, t: oyunlar[id], x: k[id] }));
    const maks = Math.log10(400);
    const olc = (b) => Math.max(2, Math.log10(Math.max(1, b)) / maks * 100);
    $('dallanmaTablo').innerHTML = satirlar.map(({ id, t, x }) => {
      const b = x && x.sayi ? x.toplam / x.sayi : 0;
      const ref = t.dallanmaSayi;
      return `<div class="dal-satir"><span>${t.baslik}</span>
        <div class="dal-yol" title="logaritmik ölçek">${b ? `<i class="sen" style="width:${olc(b)}%"></i>` : ''}${ref ? `<i class="ref" style="left:${olc(ref)}%"></i>` : ''}</div>
        <span class="num">${b ? `<b>${tr(b, 1)}</b>` : '<span style="color:var(--soluk)">henüz oynanmadı</span>'} ${ref ? `/ ${t.dallanmaRef}` : ''}</span></div>`;
    }).join('') + '<p style="font-size:12px;color:var(--soluk);margin:8px 0 0">Ölçek logaritmik: her çizgi aralığı 10 kat.</p>';
  }

  // #oyun ya da #oyun-secenek (ör. #gizlikod-gunluk): seçeneği doğrudan açar
  function rota() {
    // eski bağlantılar: #mastermind… → #gizlikod… (oyunun adı Gizli Kod oldu)
    if (/^#mastermind/.test(location.hash)) { history.replaceState(null, '', location.hash.replace(/^#mastermind/, '#gizlikod')); }
    const h = decodeURIComponent(location.hash.slice(1));
    if (oyunlar[h]) return oyunAc(h);
    if (h.includes('~')) { const [id, kod] = [h.slice(0, h.indexOf('~')), h.slice(h.indexOf('~') + 1)]; if (oyunlar[id]) return oyunAc(id, null, kod); }
    const [id, deger] = [h.slice(0, h.indexOf('-')), h.slice(h.indexOf('-') + 1)];
    const t = oyunlar[id];
    if (t && deger) { const g = (t.secenekler || VARSAYILAN).find((g) => g.sec.some(([v]) => v === deger)); if (g) return oyunAc(id, { [g.id]: deger }); }
    salonAc();
  }

  /* Kart → tahta geçişi (View Transitions): kartın önizlemesi büyüyüp tahtaya dönüşür,
     salona dönerken tahta kartına küçülür. Desteklemeyen tarayıcıda ya da azaltılmış
     hareket tercihinde doğrudan geçer. */
  function gecisliRota() {
    const h = decodeURIComponent(location.hash.slice(1)), hedef = h.split(/[-~]/)[0];
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return rota();
    const kartOnizle = (id) => document.querySelector(`#kartlar .kart[href="#${CSS.escape(id)}"] .onizle`);
    const ad = (e, v) => { if (e) e.style.viewTransitionName = v || ''; };
    if (oyunlar[hedef] && !aktifId) {                 // salon → oyun
      const k = kartOnizle(hedef); ad(k, 'oyun-tahta');
      const g = document.startViewTransition(() => { ad(k); rota(); ad($('tahta'), 'oyun-tahta'); });
      g.finished.finally(() => ad($('tahta')));
    } else if (!oyunlar[hedef] && aktifId) {          // oyun → salon
      const onceki = aktifId; ad($('tahta'), 'oyun-tahta');
      const g = document.startViewTransition(() => { ad($('tahta')); rota(); ad(kartOnizle(onceki), 'oyun-tahta'); });
      g.finished.finally(() => ad(kartOnizle(onceki)));
    } else rota();
  }

  function basla() {
    $('kartlar').innerHTML = '';
    for (const id of sira) {
      const t = oyunlar[id];
      const kart = el('a', { class: 'kart' + (t.arac ? ' arac' : ''), href: '#' + id, style: 'text-decoration:none;color:inherit' },
        el('div', { class: 'onizle' }), el('h3', {}, ikon(id), t.baslik), el('p', {}, t.ozet),
        el('div', { class: 'etiketler' }, t.etiketler.map((e, i) => el('span', { class: 'etiket' + (i === 0 ? ' ai' : '') }, e))));
      kart.querySelector('.onizle').innerHTML = t.onizleme();
      $('kartlar').append(kart);
    }
    $('yeniOyun').onclick = () => { if (aktif) yeniOyun(); };
    $('geriAl').onclick = () => { if (aktif && aktif.oyun.geriAl) { isciler.forEach((w) => w.terminate()); isciler = []; $('afis').hidden = true; aktif.oyun.geriAl(); } };
    $('salonaDon').onclick = () => { location.hash = ''; };
    $('turAc').onclick = () => turGoster(true);
    $('paylas').onclick = async () => {
      if (!aktif || !aktif.kod) return;
      const url = location.href.split('#')[0] + '#' + aktifId + '~' + aktif.kod;
      const ok = await kopyala(url); apiYap().bildir(ok ? 'Konum bağlantısı kopyalandı. Açan kişi tahtayı bu hâliyle görür.' : url, ok ? 1800 : 6000);
    };
    // Ok tuşlarıyla tahtada gezinme: hücreler data-r / data-c taşır; Enter ya da boşluk "tıklar".
    const tahta = $('tahta'); let odak = { r: 0, c: 0 };
    const hucreler = () => [...tahta.querySelectorAll('[data-r][data-c]')];
    const sirala = () => { const h = hucreler(); if (!h.length) return; let bulundu = false;
      h.forEach((x) => { const ben = +x.dataset.r === odak.r && +x.dataset.c === odak.c; x.setAttribute('tabindex', ben ? '0' : '-1'); if (ben) bulundu = true; });
      if (!bulundu) h[0].setAttribute('tabindex', '0'); };
    new MutationObserver(sirala).observe(tahta, { childList: true, subtree: true });
    tahta.addEventListener('keydown', (e) => {
      const x = e.target.closest && e.target.closest('[data-r][data-c]'); if (!x) return;
      const yon = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      if (yon) {
        e.preventDefault(); const r = +x.dataset.r + yon[0], c = +x.dataset.c + yon[1];
        const y = tahta.querySelector(`[data-r="${r}"][data-c="${c}"]`); if (y) { odak = { r, c }; sirala(); y.focus(); }
      } else if ((e.key === 'Enter' || e.key === ' ') && x.tagName !== 'BUTTON') { e.preventDefault(); x.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    });
    tahta.addEventListener('focusin', (e) => { const x = e.target.closest && e.target.closest('[data-r][data-c]'); if (x) odak = { r: +x.dataset.r, c: +x.dataset.c }; });
    // "İçeriğe atla": adres çubuğundaki oyun yolunu bozmadan odağı içeriğe taşı
    document.querySelectorAll('[data-atla]').forEach((x) => x.addEventListener('click', (e) => {
      e.preventDefault(); const m = $('salon').hidden ? $('tahta') : $('kartlar'); m.setAttribute('tabindex', '-1'); m.focus();
    }));
    // Sınıf modu: akıllı tahtada büyük dokunma hedefleri, büyük yazı, tam ekran
    const sm = $('sinifModu');
    if (sm) sm.onclick = () => {
      const acik = !document.body.classList.contains('sinif');
      document.body.classList.toggle('sinif', acik); sm.setAttribute('aria-pressed', String(acik));
      try { if (acik && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); else if (!acik && document.fullscreenElement) document.exitFullscreen?.(); } catch (e) {}
    };
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('sinif')) { document.body.classList.remove('sinif'); sm && sm.setAttribute('aria-pressed', 'false'); } });
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
    addEventListener('hashchange', gecisliRota);
    rota();
  }

  function kaydet(id, tanim) { oyunlar[id] = tanim; sira.push(id); }
  return { kaydet, basla, el, svg, tr, gunAnahtari, tohumlu, karistir };
})();
