/* =====================================================================
   ÇİZİMLER — kriptoloji/bilesenler/cizimler.js
   Dairenin kalem çizimleri (SVG işaretlemesi döndürür; içerik sabittir, kullanıcı girdisi içermez).
   Renkler CSS'ten gelir: .ci = mürekkep çizgisi, .ck = kırmızı kalem, .cd = dolgu.
   • odaSimgesi(id, x, y, olcek): kat planındaki oda simgeleri
   • rozet(id, kazanildi): rütbe rozetleri (120 × 120)
   ===================================================================== */

/** Kat planı simgeleri: merkez (x, y), yaklaşık 80 birim genişlik. */
export function odaSimgesi(id, x, y, o = 1) {
  const g = (ic) => `<g class="oda-simge" transform="translate(${x} ${y}) scale(${o})" aria-hidden="true">${ic}</g>`;
  switch (id) {
    case 'sezar': {   // iç içe iki çark, çentikler, tepe işareti
      let c = '<circle class="ci" r="38"/><circle class="ci" r="24"/><circle class="cd" r="3"/>';
      for (let i = 0; i < 29; i++) {
        const a = (i / 29) * 2 * Math.PI;
        c += `<line class="ci ince" x1="${(38 * Math.sin(a)).toFixed(1)}" y1="${(-38 * Math.cos(a)).toFixed(1)}" x2="${(32 * Math.sin(a)).toFixed(1)}" y2="${(-32 * Math.cos(a)).toFixed(1)}"/>`;
      }
      return g(c + '<path class="ck dolu" d="M-7 -50 h14 l-7 9 z"/><path class="ck" d="M0 0 L0 -22"/>');
    }
    case 'kasa':   // kasa gövdesi, kadran, sürgüler
      return g('<rect class="ci" x="-36" y="-34" width="72" height="68" rx="6"/><rect class="ci ince" x="-28" y="-26" width="56" height="52" rx="3"/>' +
        '<circle class="ci" r="14"/><path class="ci" d="M0 -14 v6 M14 0 h-6 M0 14 v-6 M-14 0 h6"/><circle class="cd" r="2.5"/>' +
        '<path class="ck" d="M36 -20 h8 M36 -8 h8 M36 4 h8 M36 16 h8"/>');
    case 'murekkep':   // kek, mum, içinde katlanmış mektup
      return g('<path class="ci" d="M-34 -6 h68 v34 h-68 z"/><path class="ci" d="M-38 28 h76"/><path class="ci ince" d="M-34 8 h68"/>' +
        '<path class="ci" d="M-36 -6 q6 -9 12 0 q6 -9 12 0 q6 -9 12 0 q6 -9 12 0 q6 -9 12 0 q6 -9 12 0"/>' +
        '<path class="ci" d="M0 -14 v-14"/><path class="ck dolu" d="M0 -40 q-6 7 0 11 q6 -4 0 -11 z"/>' +
        '<path class="ck" d="M-14 12 h28 v12 h-28 z M-14 12 l14 7 l14 -7"/>');
    case 'ogretmen':   // masa, açık defter, tebeşir tahtası
      return g('<rect class="ci" x="-40" y="-38" width="80" height="40" rx="3"/><path class="ci ince" d="M-30 -26 h34 M-30 -16 h22"/><path class="ck" d="M16 -28 l12 12 M28 -28 l-12 12"/>' +
        '<path class="ci" d="M-44 18 h88 M-36 18 v18 M36 18 v18"/><path class="ci" d="M-22 14 q11 -6 22 0 q11 -6 22 0"/>');
    case 'lobi':   // kapı ve paspas
      return g('<path class="ci" d="M-22 30 v-58 h44 v58"/><circle class="cd" cx="12" cy="4" r="3"/><path class="ck" d="M-34 36 h68"/>');
    case 'arsiv':   // dosya dolabı, asma kilit yerine kurdele mühür
      return g('<rect class="ci" x="-30" y="-38" width="60" height="76" rx="3"/><path class="ci" d="M-30 -12 h60 M-30 12 h60"/>' +
        '<path class="ci ince" d="M-8 -26 h16 M-8 0 h16 M-8 24 h16"/><circle class="ck" cx="22" cy="30" r="10"/><path class="ck" d="M16 38 l-4 10 M28 38 l4 10"/>');
    default: return '';
  }
}

/** Rütbe rozeti (120 × 120). Kazanılmamışsa soluk ve kesik çizgili çizilir. */
export function rozet(id, kazanildi) {
  const sinif = 'rozet' + (kazanildi ? ' kazanildi' : ' kilitli');
  const cerceve = '<circle class="ci" cx="60" cy="60" r="52"/><circle class="ci ince" cx="60" cy="60" r="45"/>';
  let ic = '';
  switch (id) {
    case 'stajyer':   // kalem ucu: ilk yazılan not
      ic = '<path class="ci" d="M60 26 l14 30 l-14 32 l-14 -32 z"/><path class="ci" d="M60 56 v32"/><circle class="cd" cx="60" cy="56" r="4"/><path class="ck" d="M38 96 h44"/>';
      break;
    case 'kod-kirici': {   // çark: 29 çentik ve okunan pencere
      ic = '<circle class="ci" cx="60" cy="60" r="28"/><circle class="ci" cx="60" cy="60" r="16"/>';
      for (let i = 0; i < 29; i++) {
        const a = (i / 29) * 2 * Math.PI;
        ic += `<line class="ci ince" x1="${(60 + 28 * Math.sin(a)).toFixed(1)}" y1="${(60 - 28 * Math.cos(a)).toFixed(1)}" x2="${(60 + 23 * Math.sin(a)).toFixed(1)}" y2="${(60 - 23 * Math.cos(a)).toFixed(1)}"/>`;
      }
      ic += '<rect class="ck" x="54" y="26" width="12" height="22" rx="3"/><circle class="cd" cx="60" cy="60" r="3"/>';
      break;
    }
    case 'analist':   // kareli kâğıt üstünde büyüteç
      ic = '<path class="ci ince" d="M34 40 h40 M34 52 h40 M34 64 h40 M42 32 v40 M54 32 v40 M66 32 v40"/>' +
        '<circle class="ck" cx="68" cy="58" r="15"/><path class="ck kalin" d="M79 69 l13 13"/>';
      break;
    case 'bas-kriptograf':   // mühür: çark + büyüteç + 29
      ic = '<circle class="ci" cx="60" cy="56" r="24"/><text class="rozet-29" x="60" y="64" text-anchor="middle">29</text>' +
        '<path class="ck" d="M30 84 q30 16 60 0"/><path class="ck" d="M36 30 l6 8 M84 30 l-6 8 M60 22 v8"/>';
      break;
  }
  return `<svg class="${sinif}" viewBox="0 0 120 120" aria-hidden="true">${cerceve}${ic}</svg>`;
}
