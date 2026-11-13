/* =====================================================================
   SUNUM MODU — kriptoloji/bilesenler/sunum.mjs
   ?sunum=1 ile açılır (akıllı tahta için):
   • büyük yazı (daire.css → html.sunum)
   • adım adım ilerleme: [data-adim] öğeleri tek tek gösterilir; → / ← / PageDown / PageUp / boşluk
   • cevapları gizle/göster: [data-cevap] öğeleri
   • süre sayacı (başlat / durdur / sıfırla)
   • 2–4 takımlık puan tablosu — yalnız bellekte; sayfa kapanınca silinir
   ===================================================================== */

export function sunumAcikMi() { return new URLSearchParams(location.search).get('sunum') === '1'; }

export function sunumBaslat() {
  if (!sunumAcikMi()) return;
  const kok = document.documentElement;
  kok.classList.add('sunum');
  const adimlar = [...document.querySelectorAll('[data-adim]')];
  let i = 0;

  const cubuk = document.createElement('div');
  cubuk.className = 'sunum-cubugu';
  cubuk.setAttribute('role', 'region');
  cubuk.setAttribute('aria-label', 'Sunum denetimleri');
  cubuk.innerHTML =
    '<button class="dugme yalin" type="button" data-git="-1">← Önceki</button>' +
    '<span class="adim-no" aria-live="polite"></span>' +
    '<button class="dugme" type="button" data-git="1">Sonraki</button>' +
    '<button class="dugme yalin" type="button" data-cevaplar aria-pressed="false">Cevapları göster</button>' +
    '<span class="sure" role="timer" aria-label="Süre">00:00</span>' +
    '<button class="dugme yalin" type="button" data-sure>Başlat</button>' +
    '<button class="dugme yalin" type="button" data-sure-sifirla>Sıfırla</button>' +
    '<div class="puanlar"><label>Takım <select data-takim-sayisi aria-label="Takım sayısı">' +
    '<option>2</option><option>3</option><option>4</option></select></label><span data-takimlar></span></div>';
  document.body.appendChild(cubuk);

  const adimNo = cubuk.querySelector('.adim-no');
  function goster(n) {
    if (!adimlar.length) { adimNo.textContent = ''; return; }
    i = Math.max(0, Math.min(adimlar.length - 1, n));
    adimlar.forEach((a, j) => a.classList.toggle('etkin-adim', j === i));
    adimNo.textContent = (i + 1) + ' / ' + adimlar.length;
    window.scrollTo(0, 0);
  }
  cubuk.addEventListener('click', (e) => {
    const g = e.target.closest('[data-git]');
    if (g) goster(i + Number(g.dataset.git));
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goster(i + 1); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goster(i - 1); }
  });
  goster(0);

  // Cevaplar
  const cevapDugme = cubuk.querySelector('[data-cevaplar]');
  cevapDugme.addEventListener('click', () => {
    const acik = cevapDugme.getAttribute('aria-pressed') !== 'true';
    cevapDugme.setAttribute('aria-pressed', String(acik));
    cevapDugme.textContent = acik ? 'Cevapları gizle' : 'Cevapları göster';
    document.querySelectorAll('[data-cevap]').forEach((c) => c.classList.toggle('cevap-acik', acik));
  });

  // Süre
  const sure = cubuk.querySelector('.sure'), sureD = cubuk.querySelector('[data-sure]');
  let gecen = 0, baslangic = 0, zamanlayici = 0;
  const yaz = () => {
    const s = Math.floor((gecen + (zamanlayici ? Date.now() - baslangic : 0)) / 1000);
    sure.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  sureD.addEventListener('click', () => {
    if (zamanlayici) { gecen += Date.now() - baslangic; clearInterval(zamanlayici); zamanlayici = 0; sureD.textContent = 'Başlat'; }
    else { baslangic = Date.now(); zamanlayici = setInterval(yaz, 250); sureD.textContent = 'Durdur'; }
    yaz();
  });
  cubuk.querySelector('[data-sure-sifirla]').addEventListener('click', () => {
    clearInterval(zamanlayici); zamanlayici = 0; gecen = 0; sureD.textContent = 'Başlat'; yaz();
  });

  // Puan tablosu (bellekte)
  const takimlar = cubuk.querySelector('[data-takimlar]');
  let puan = [0, 0, 0, 0];
  const harfler = ['A', 'B', 'C', 'D'];
  function takimCiz(n) {
    takimlar.innerHTML = '';
    for (let t = 0; t < n; t++) {
      const s = document.createElement('span');
      s.className = 'takim';
      s.innerHTML = '<button class="kucuk-d" type="button" aria-label="' + harfler[t] + ' takımından 1 puan düş">−</button>' +
        harfler[t] + ' <output aria-live="polite">' + puan[t] + '</output>' +
        '<button class="kucuk-d" type="button" aria-label="' + harfler[t] + ' takımına 1 puan ekle">+</button>';
      const [eksi, arti] = s.querySelectorAll('button');
      const o = s.querySelector('output');
      eksi.addEventListener('click', () => { puan[t] = Math.max(0, puan[t] - 1); o.textContent = puan[t]; });
      arti.addEventListener('click', () => { puan[t] += 1; o.textContent = puan[t]; });
      takimlar.appendChild(s);
    }
  }
  const sec = cubuk.querySelector('[data-takim-sayisi]');
  sec.addEventListener('change', () => takimCiz(Number(sec.value)));
  takimCiz(2);
}
