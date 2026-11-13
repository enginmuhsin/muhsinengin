/* =====================================================================
   SEZAR ÇARKI — kriptoloji/bilesenler/cark.js
   İç içe iki disk, her birinde 29 dilim (Türk alfabesi).
   • İç disk SABİT: açık harfler (mavi mürekkep).
   • Dış disk DÖNER: şifreli harfler (kırmızı kalem). Fare, parmak ya da klavye okları.
   • Dönüş dilime oturur (snap). Kaydırma k canlı bildirilir.
   Okuma: üstteki işaretin altında iç diskte A varsa, dış diskte onun karşısındaki harf A'nın şifresidir.
   cizCark(svg, { etkilesimli }) → { k(), kAyarla(k), dinle(f), vurgula(i) }
   vurgula(i): iç diskteki i. harften dış diskteki karşılığına kırmızı bir yol çizer (-1 → temizle).
   ===================================================================== */
import { BUYUK, N, mod } from '../cekirdek/turkce-alfabe.js';

const NS = 'http://www.w3.org/2000/svg';
const DILIM = 360 / N;
const MERKEZ = 200;

function el(ad, ozellik = {}, ebeveyn) {
  const e = document.createElementNS(NS, ad);
  for (const [k, v] of Object.entries(ozellik)) e.setAttribute(k, v);
  if (ebeveyn) ebeveyn.appendChild(e);
  return e;
}
const kutup = (r, aci) => [MERKEZ + r * Math.sin(aci * Math.PI / 180), MERKEZ - r * Math.cos(aci * Math.PI / 180)];

/** Bir halka çizer: r1 iç yarıçap, r2 dış yarıçap; harf i, i·DILIM açısında (saat yönü, tepeden). */
function halka(g, r1, r2, sinif) {
  el('circle', { cx: MERKEZ, cy: MERKEZ, r: r2, class: 'cark-cizgi ' + sinif + '-cevre' }, g);
  el('circle', { cx: MERKEZ, cy: MERKEZ, r: r1, class: 'cark-cizgi ' + sinif + '-cevre' }, g);
  for (let i = 0; i < N; i++) {
    const a = (i - 0.5) * DILIM;
    const [x1, y1] = kutup(r1, a), [x2, y2] = kutup(r2, a);
    el('line', { x1, y1, x2, y2, class: 'cark-cizgi ince' }, g);
    const [tx, ty] = kutup((r1 + r2) / 2, i * DILIM);
    const t = el('text', { x: tx, y: ty, class: 'cark-harf ' + sinif + '-harf', 'text-anchor': 'middle', 'dominant-baseline': 'central',
      transform: `rotate(${i * DILIM} ${tx} ${ty})`, 'data-i': i }, g);
    t.textContent = BUYUK[i];
  }
}

export function cizCark(svg, { etkilesimli = true, baslangic = 0, tikSesi = () => false } = {}) {
  svg.setAttribute('viewBox', '0 0 400 400');
  svg.innerHTML = '';
  const dis = el('g', { class: 'cark-dis' }, svg);
  halka(dis, 150, 192, 'dis');
  // dış diske tutamak çentikleri (pirinç çark hissi)
  for (let i = 0; i < N; i++) {
    const [x1, y1] = kutup(192, (i + 0.5) * DILIM), [x2, y2] = kutup(198, (i + 0.5) * DILIM);
    el('line', { x1, y1, x2, y2, class: 'cark-cizgi tutamak' }, dis);
  }
  const ic = el('g', { class: 'cark-ic' }, svg);
  halka(ic, 104, 146, 'ic');
  el('circle', { cx: MERKEZ, cy: MERKEZ, r: 100, class: 'cark-cizgi ic-cevre' }, ic);
  // tepe işareti: okunan çift
  el('path', { d: `M${MERKEZ - 16} 2 L${MERKEZ + 16} 2 L${MERKEZ} 16 Z`, class: 'cark-isaret' }, svg);
  el('rect', { x: MERKEZ - 17, y: 6, width: 34, height: 94, rx: 6, class: 'cark-pencere' }, svg);
  const kYazi = el('text', { x: MERKEZ, y: MERKEZ - 6, class: 'cark-k', 'text-anchor': 'middle' }, svg);
  const kAlt = el('text', { x: MERKEZ, y: MERKEZ + 26, class: 'cark-k-alt', 'text-anchor': 'middle' }, svg);
  kAlt.textContent = 'kaydırma';

  const yolKatman = el('g', { class: 'cark-yol' }, svg);   // dönmeyen katman: harf yolu
  let k = mod(baslangic, N), aci = -k * DILIM, secili = -1;
  function vurguCiz() {
    yolKatman.innerHTML = '';
    ic.querySelectorAll('.ic-harf').forEach((t) => t.classList.toggle('secili', Number(t.dataset.i) === secili));
    dis.querySelectorAll('.dis-harf').forEach((t) => t.classList.toggle('secili', secili >= 0 && Number(t.dataset.i) === mod(secili + k, N)));
    if (secili < 0) return;
    const a = secili * DILIM;
    const [x1, y1] = kutup(108, a), [x2, y2] = kutup(188, a);
    el('line', { x1, y1, x2, y2, class: 'yol-cizgi' }, yolKatman);
    const [ox, oy] = kutup(100, a);
    el('circle', { cx: ox, cy: oy, r: 4, class: 'yol-nokta' }, yolKatman);
  }
  function vurgula(i) { secili = i; vurguCiz(); }
  const dinleyiciler = new Set();

  function ciz(animasyon) {
    dis.style.transition = animasyon ? 'transform .18s ease-out' : 'none';
    dis.style.transform = `rotate(${aci}deg)`;
    kYazi.textContent = 'k = ' + k;
    svg.setAttribute('aria-valuenow', k);
    svg.setAttribute('aria-valuetext', `Kaydırma ${k}: A harfi ${BUYUK[k]} olur.`);
    dis.querySelectorAll('.dis-harf').forEach((t) => t.classList.toggle('tepede', Number(t.dataset.i) === k));
    ic.querySelectorAll('.ic-harf').forEach((t) => t.classList.toggle('tepede', Number(t.dataset.i) === 0));
    vurguCiz();
  }
  function kAyarla(yeni, animasyon = true) {
    const eski = k;
    k = mod(Math.round(yeni), N);
    // en kısa yoldan dön: açıyı sürekli tut ki 28→0 geçişinde çark ters dönmesin
    let fark = mod(k - eski, N); if (fark > N / 2) fark -= N;
    aci -= fark * DILIM;
    ciz(animasyon);
    if (k !== eski) { tik(); dinleyiciler.forEach((f) => f(k)); }
  }

  // İsteğe bağlı "tık" sesi (varsayılan kapalı). Ses tarayıcıda üretilir, dosya indirilmez.
  let ses;
  function tik() {
    if (!tikSesi()) return;
    try {
      ses = ses || new (window.AudioContext || window.webkitAudioContext)();
      const o = ses.createOscillator(), g = ses.createGain(), t = ses.currentTime;
      o.type = 'square'; o.frequency.value = 1800;
      g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      o.connect(g).connect(ses.destination); o.start(t); o.stop(t + 0.035);
    } catch { /* ses yoksa sessiz devam */ }
  }

  if (etkilesimli) {
    svg.setAttribute('role', 'slider');
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-valuemin', '0');
    svg.setAttribute('aria-valuemax', String(N - 1));
    svg.setAttribute('aria-label', 'Sezar çarkı: dış diski döndür');
    svg.addEventListener('keydown', (e) => {
      const adim = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[e.key];
      if (adim) { e.preventDefault(); kAyarla(k + adim); }
      if (e.key === 'Home') { e.preventDefault(); kAyarla(0); }
    });
    // Sürükleme: işaretçinin merkez etrafındaki açısı kadar dış disk döner
    let surukle = null;
    const aciAl = (e) => {
      const r = svg.getBoundingClientRect();
      return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
    };
    svg.addEventListener('pointerdown', (e) => {
      surukle = { bas: aciAl(e), aci0: aci, k0: k };
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('donuyor');
    });
    svg.addEventListener('pointermove', (e) => {
      if (!surukle) return;
      let d = aciAl(e) - surukle.bas;
      d = ((d + 540) % 360) - 180;
      surukle.bas += d; surukle.aci0 += d;
      aci = surukle.aci0;
      dis.style.transition = 'none';
      dis.style.transform = `rotate(${aci}deg)`;
      const yeniK = mod(Math.round(-aci / DILIM), N);
      if (yeniK !== k) { k = yeniK; kYazi.textContent = 'k = ' + k; dis.querySelectorAll('.dis-harf').forEach((t) => t.classList.toggle('tepede', Number(t.dataset.i) === k)); vurguCiz(); tik(); dinleyiciler.forEach((f) => f(k)); }
    });
    const birak = () => {
      if (!surukle) return;
      surukle = null; svg.classList.remove('donuyor');
      aci = -Math.round(-aci / DILIM) * DILIM;   // dilime otur
      ciz(true);
    };
    svg.addEventListener('pointerup', birak);
    svg.addEventListener('pointercancel', birak);
  }

  ciz(false);
  return { k: () => k, kAyarla, vurgula, dinle: (f) => { dinleyiciler.add(f); return () => dinleyiciler.delete(f); } };
}

/** Föy için kesilecek iki ayrı disk (siyah-beyaz). svg: boş <svg>; tur: 'dis' | 'ic' */
export function cizKagitDisk(svg, tur) {
  // İki disk AYNI ölçekte basılmalı ki iç disk dış halkanın içine tam otursun:
  // dış disk 400 birim = 108 mm, iç disk yalnız orta 300 birimi gösterir = 81 mm (foy.css).
  svg.setAttribute('viewBox', tur === 'dis' ? '0 0 400 400' : '50 50 300 300');
  svg.innerHTML = '';
  const g = el('g', {}, svg);
  if (tur === 'dis') {
    halka(g, 150, 192, 'dis');
    el('circle', { cx: MERKEZ, cy: MERKEZ, r: 196, class: 'kes-cizgi' }, g);
    el('text', { x: MERKEZ, y: MERKEZ - 10, 'text-anchor': 'middle', class: 'foy-k' }, g).textContent = 'DIŞ DİSK · şifreli';
    el('text', { x: MERKEZ, y: MERKEZ + 14, 'text-anchor': 'middle', class: 'foy-k' }, g).textContent = 'ortadaki boşluğu kesme';
  } else {
    halka(g, 104, 146, 'ic');
    el('circle', { cx: MERKEZ, cy: MERKEZ, r: 148, class: 'kes-cizgi' }, g);
    el('path', { d: `M${MERKEZ - 10} 46 L${MERKEZ + 10} 46 L${MERKEZ} 58 Z`, class: 'cark-isaret' }, g);
    el('text', { x: MERKEZ, y: MERKEZ + 26, 'text-anchor': 'middle', class: 'foy-k' }, g).textContent = 'İÇ DİSK · açık';
  }
  el('circle', { cx: MERKEZ, cy: MERKEZ, r: 3, class: 'cark-isaret' }, g);
}
