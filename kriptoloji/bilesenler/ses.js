/* =====================================================================
   EFEKT SESLERİ — kriptoloji/bilesenler/ses.js
   Bütün sesler o an tarayıcıda Web Audio ile üretilir: dosya indirilmez, internet gerekmez.
     tik     çark bir harf döndüğünde: mandal tıkırtısı (kısa süzülmüş gürültü + küçük vuruş)
     surgu   kasaya sürgü sürülürken: metal sürtünmesi + kilitlenme tıkı
     acildi  kasa açıldığında: iki tık, derin "tok" ve kısa metal çınlaması
     hata    yanlış cevap: iki kısa, alçak "dıt dıt" (kulak tırmalamaz)
     dogru   doğru cevap: damga vuruşu + iki notalı küçük zil
   Açık/kapalı tercihi YALNIZ bellekte tutulur (sayfa yenilenince yeniden açık başlar):
   Şifre Dairesi hiçbir şey saklamaz. Düğme üst çubuğa kendiliğinden eklenir.
   Tarayıcılar ziyaretçi dokunmadan ses çalmaya izin vermez; buradaki her ses bir tıklamanın,
   tuşun ya da sürüklemenin sonucudur, o yüzden ilk dokunuşta ses bağlamı açılır.
   ===================================================================== */

let acik = true;
let ac = null, ana = null, gurultu = null;
let sonTik = 0;

function baglam() {
  if (!ac) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ac = new C();
    ana = ac.createGain(); ana.gain.value = 0.55; ana.connect(ac.destination);
    // 0,3 sn'lik beyaz gürültü: tıkırtıların hammaddesi (bir kez üretilir)
    gurultu = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.3), ac.sampleRate);
    const v = gurultu.getChannelData(0);
    for (let i = 0; i < v.length; i++) v[i] = Math.random() * 2 - 1;
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

/** Süzgeçten geçmiş kısa gürültü patlaması: tık, sürtünme, damga. */
function patla(t, { frekans, q = 3, sure = 0.03, guc = 0.5, tur = 'bandpass' }) {
  const k = ac.createBufferSource(); k.buffer = gurultu;
  const s = ac.createBiquadFilter(); s.type = tur; s.frequency.value = frekans; s.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(guc, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
  k.connect(s).connect(g).connect(ana);
  k.start(t, Math.random() * 0.2); k.stop(t + sure + 0.01);
}

/** Tek ton: başlangıç frekansından bitişe kayar, hızla söner. */
function ton(t, { f1, f2 = f1, sure = 0.1, guc = 0.2, tip = 'sine', suz = 0 }) {
  const o = ac.createOscillator(); o.type = tip;
  o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + sure);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(guc, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
  let son = g;
  if (suz) { const s = ac.createBiquadFilter(); s.type = 'lowpass'; s.frequency.value = suz; g.connect(s); son = s; }
  o.connect(g); son.connect(ana);
  o.start(t); o.stop(t + sure + 0.02);
}

const SESLER = {
  tik(t) {
    const r = 0.92 + Math.random() * 0.16;            // her tık biraz farklı: gerçek mandal gibi
    patla(t, { frekans: 3400 * r, q: 5, sure: 0.022, guc: 0.9 });
    ton(t, { f1: 190 * r, f2: 90, sure: 0.035, guc: 0.25 });
  },
  surgu(t) {
    patla(t, { frekans: 1500, q: 1.2, sure: 0.12, guc: 0.18 });
    patla(t + 0.11, { frekans: 2600, q: 6, sure: 0.025, guc: 0.8 });
    ton(t + 0.11, { f1: 140, f2: 70, sure: 0.08, guc: 0.3 });
  },
  acildi(t) {
    patla(t, { frekans: 2800, q: 6, sure: 0.025, guc: 0.8 });
    patla(t + 0.09, { frekans: 2200, q: 6, sure: 0.03, guc: 0.8 });
    ton(t + 0.09, { f1: 95, f2: 45, sure: 0.22, guc: 0.45 });
    ton(t + 0.12, { f1: 1760, sure: 0.45, guc: 0.05, tip: 'triangle' });
    ton(t + 0.12, { f1: 2637, sure: 0.35, guc: 0.025, tip: 'triangle' });
  },
  hata(t) {
    ton(t, { f1: 233, f2: 220, sure: 0.11, guc: 0.12, tip: 'square', suz: 1100 });
    ton(t + 0.15, { f1: 196, f2: 185, sure: 0.16, guc: 0.12, tip: 'square', suz: 1100 });
  },
  dogru(t) {
    patla(t, { frekans: 600, q: 0.8, sure: 0.08, guc: 0.6, tur: 'lowpass' });
    ton(t, { f1: 120, f2: 60, sure: 0.1, guc: 0.35 });
    ton(t + 0.12, { f1: 659, sure: 0.28, guc: 0.14, tip: 'triangle' });
    ton(t + 0.24, { f1: 988, sure: 0.4, guc: 0.12, tip: 'triangle' });
  },
};

/** Sesi çal. Ses kapalıysa, tarayıcı Web Audio sunmuyorsa ya da bir hata olursa sessizce geçer. */
export function cal(ad) {
  if (!acik || !SESLER[ad]) return;
  try {
    if (!baglam()) return;
    const t = ac.currentTime + 0.005;
    if (ad === 'tik') { if (t - sonTik < 0.028) return; sonTik = t; }   // hızlı sürüklemede tıklar üst üste binmesin
    SESLER[ad](t);
  } catch { /* ses yoksa sessiz devam */ }
}

export const sesAcikMi = () => acik;

/* ---------- Üst çubuktaki "Efekt" düğmesi ---------- */
const HOPARLOR = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="ses-dalga" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="ses-carpi" d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function dugmeEkle() {
  if (document.getElementById('efektDugme')) return;
  const nav = document.querySelector('.ust-cubuk nav');
  if (!nav) return;
  const b = document.createElement('button');
  b.type = 'button'; b.id = 'efektDugme'; b.className = 'tema-dugme efekt-dugme';
  b.setAttribute('aria-pressed', 'true');
  b.setAttribute('aria-label', 'Efekt sesleri');
  b.title = 'Çark, kasa ve cevap sesleri';
  b.innerHTML = HOPARLOR + ' <span class="efekt-yazi">Efekt</span>';
  const yaz = () => {
    b.setAttribute('aria-pressed', String(acik));
    b.querySelector('.efekt-yazi').textContent = acik ? 'Efekt' : 'Efekt kapalı';
  };
  b.addEventListener('click', () => { acik = !acik; yaz(); if (acik) cal('tik'); });
  const tema = nav.querySelector('#temaDugme');
  nav.insertBefore(b, tema || null);
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dugmeEkle); else dugmeEkle();
}
