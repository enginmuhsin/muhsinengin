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

  /* ---------- yardımcılar ---------- */
  const tr = (x, b = 0) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b });
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
      tahta: $('tahta'), el, svg, tr, oku, yaz, isciYap,
      get ayar() { return aktif.ayar; },
      durum(html, opts = {}) { const d = $('durum'); d.innerHTML = html; d.classList.toggle('dusunuyor', !!opts.dusunuyor); },
      neden(html) { $('nedenKutu').hidden = !html; $('neden').innerHTML = html || ''; },
      mat(html) { $('mat').innerHTML = html; },
      dallanma: dallanmaKaydet,
      bitti(metin, kayip = false) { const a = $('afis'); a.hidden = false; a.className = 'afis' + (kayip ? ' kayip' : ''); a.textContent = metin; },
      bildir(m, ms = 1600) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(t._z); t._z = setTimeout(() => (t.hidden = true), ms); },
      geriAlAktif(v) { $('geriAl').disabled = !v; },
    };
  }

  function yeniOyun() {
    isciler.forEach((w) => w.terminate()); isciler = [];
    dal = { toplam: 0, sayi: 0 };
    $('afis').hidden = true; $('neden').innerHTML = ''; $('nedenKutu').hidden = true;
    dallanmaCiz();
    aktif.oyun.yeni();
  }

  function oyunAc(id) {
    const t = oyunlar[id]; if (!t) return salonAc();
    if (aktif && aktif.oyun.yokEt) aktif.oyun.yokEt();
    aktifId = id;
    $('salon').hidden = true; $('oyunSayfa').hidden = false; $('salonaDon').hidden = false;
    $('oyunBaslik').textContent = t.baslik; $('oyunAlt').textContent = t.alt;
    $('kurallar').innerHTML = t.kurallar.map((k) => `<li>${k}</li>`).join('');
    $('tahta').innerHTML = ''; $('mat').innerHTML = '';
    document.title = t.baslik + ' · Oyun Salonu';
    aktif = { tanim: t, ayar: null, oyun: null };
    aktif.ayar = ayarlariOku(t);
    seceneklerCiz();
    aktif.oyun = t.olustur(apiYap());
    $('geriAl').hidden = !aktif.oyun.geriAl; $('geriAl').disabled = true;
    yeniOyun();
    scrollTo(0, 0);
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
    const satirlar = sira.map((id) => ({ id, t: oyunlar[id], x: k[id] }));
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

  function rota() { const h = location.hash.slice(1); if (oyunlar[h]) oyunAc(h); else salonAc(); }

  function basla() {
    $('kartlar').innerHTML = '';
    for (const id of sira) {
      const t = oyunlar[id];
      const kart = el('a', { class: 'kart', href: '#' + id, style: 'text-decoration:none;color:inherit' },
        el('div', { class: 'onizle' }), el('h3', {}, t.baslik), el('p', {}, t.ozet),
        el('div', { class: 'etiketler' }, t.etiketler.map((e, i) => el('span', { class: 'etiket' + (i === 0 ? ' ai' : '') }, e))));
      kart.querySelector('.onizle').innerHTML = t.onizleme();
      $('kartlar').append(kart);
    }
    $('yeniOyun').onclick = () => { if (aktif) yeniOyun(); };
    $('geriAl').onclick = () => { if (aktif && aktif.oyun.geriAl) { isciler.forEach((w) => w.terminate()); isciler = []; $('afis').hidden = true; aktif.oyun.geriAl(); } };
    $('salonaDon').onclick = () => { location.hash = ''; };
    addEventListener('hashchange', rota);
    rota();
  }

  function kaydet(id, tanim) { oyunlar[id] = tanim; sira.push(id); }
  return { kaydet, basla, el, svg, tr };
})();
