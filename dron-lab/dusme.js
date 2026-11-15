/* =====================================================================
   DRON TASARIM LABORATUVARI — dusme.js : Düşme ve arıza testi
   Öğrenci görüşü (Kasım 2026): "simülatördeki düşmeyi tasarımda da görelim."

   Üç senaryo, hepsi şu anki tasarımın kütlesi ve boyuyla:
   1) Batarya bitti: itki sıfır, dron hava direnciyle düşer.
        Son hız  v_t = √(2·m·g / (ρ·Cd·A))
        Hız      v(t) = v_t · tanh(g·t / v_t)
        Yol      y(t) = (v_t² / g) · ln cosh(g·t / v_t)
   2) Bir motor arızalandı: dengeyi korumak için karşı motor da kısılır,
      kullanılabilir itki ≈ T · (N − 2) / N. Dört motorlu dron dengeyi
      koruyamaz, döne döne düşer; altı ve sekiz motorlu dron çoğu zaman iner.
   3) Sert iniş: belli bir hızla yere değme (simülatördeki "sert iniş").
   Çarpma enerjisi E = ½·m·v². Hepsi basitleştirilmiş tahmindir.
   ===================================================================== */
(function () {
  'use strict';
  const H = window.DronHesap; if (!H) return;
  const $ = (id) => document.getElementById(id);
  const tr = H.tr || ((x, b) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b }));
  const g = 9.80665, CD = 1.1;   // düz levhaya yakın, yukarıdan bakınca dronun direnç katsayısı

  let tasarim = null, s = null, anim = null;

  // yukarıdan görünen alan: dingil mesafesi ≈ 2·pervane çapı, X gövde + duran pervaneler bu karenin ~%35'i
  function alan(t) { const D = t.pervaneCap * 0.0254, n = +t.motorSayisi; const L = D * (n >= 6 ? 2.6 : 2.0); return 0.35 * L * L * (n >= 6 ? 1.25 : 1); }

  function hesap() {
    const h = +$('dsYuk').value, senaryo = $('dsSenaryo').value;
    const m = s.m, W = s.W, rho = s.rho, A = alan(tasarim);
    const vt = Math.sqrt(2 * m * g / (rho * CD * A));
    const vBos = Math.sqrt(2 * g * h);                                     // havasız düşseydi
    const vCarp = vt * Math.sqrt(1 - Math.exp(-2 * g * h / (vt * vt)));    // havalı
    const tDus = vt / g * Math.acosh(Math.exp(g * h / (vt * vt)));
    const N = +tasarim.motorSayisi, Tkalan = s.Ttoplam * Math.max(0, N - 2) / N, TWRk = Tkalan / W;
    const r = { h, senaryo, m, A, vt, vBos, vCarp, tDus, N, TWRk, hoverK: Math.sqrt(W / Math.max(Tkalan, 1e-9)) };
    if (senaryo === 'motor') {
      r.iner = N >= 6 && TWRk > 1.15;
      if (r.iner) { r.vCarp = 1.2; r.tDus = h / 1.5 + 1.5; }                 // kontrollü alçalış ~1,5 m/s
      else { r.vCarp = Math.min(vCarp * 1.0, vt); }                           // dönerek düşer: serbest düşmeye yakın
    }
    if (senaryo === 'sert') { r.vCarp = +$('dsHiz').value; r.tDus = 0.6; r.h = 0; }
    r.E = 0.5 * m * r.vCarp * r.vCarp;
    return r;
  }
  function hasar(E) {
    if (E < 2) return ['iyi', 'Büyük ihtimalle sağlam', 'Pervane ucu çizilebilir. Hafif dronlar bu yüzden sınıfta güvenlidir.'];
    if (E < 10) return ['dikkat', 'Pervane kırılır, kol çatlayabilir', 'Yedek pervane taşımak bu yüzden FPV pilotlarının ilk kuralıdır.'];
    if (E < 40) return ['kotu', 'Kol ya da gövde kırılır', 'Bir insana çarpsa yaralayabilir. İnsanların üstünde uçulmamasının nedeni bu enerji.'];
    return ['kotu', 'Ağır hasar, tehlikeli darbe', 'Bu enerji ağır bir çekiç darbesine yakın. Ağır dronlarda bu yüzden paraşüt kullanılır, kurallar da sıkıdır.'];
  }

  function yaz(r) {
    const [sinif, baslik, not] = hasar(r.E);
    const kutu = (et, deg, alt, cl) => `<div class="sonuc ${cl || ''}"><div class="etiket">${et}</div><div class="deger">${deg}</div><div class="alt">${alt}</div></div>`;
    let ozet;
    if (r.senaryo === 'motor') {
      ozet = r.N < 6 ? `<b>${r.N} motorlu dron bir motorunu kaybedince dengede kalamaz.</b> Karşı köşedeki motorla tork dengesi bozulur: dron kendi ekseni etrafında hızla döner ve düşer. Bu yüzden ağır kamera ve yük dronları 6 ya da 8 motorlu yapılır.`
        : r.iner ? `<b>${r.N} motorlu dron arızaya rağmen inebilir.</b> Dengeyi korumak için karşı motor da kısılır; kalan itki ağırlığın <b>${tr(r.TWRk, 2)}</b> katı. Kalan motorlar %${tr(Math.min(100, r.hoverK * 100), 0)} gazla asılı kalır, dron 1,5 m/s ile kontrollü alçalır.`
          : `<b>${r.N} motor var ama kalan itki yetmiyor:</b> ağırlığın yalnızca ${tr(r.TWRk, 2)} katı. Arızada dron alçalmayı durduramaz. İtki/ağırlık oranını yükselt (daha güçlü motor ya da daha hafif yük).`;
    } else if (r.senaryo === 'sert') {
      ozet = `Simülatördeki <b>sert iniş</b> gibi: dron yere <b>${tr(r.vCarp, 1)} m/s</b> hızla değiyor. Hareket enerjisinin hepsi birkaç milisaniyede kollara ve iniş takımına yüklenir.`;
    } else {
      ozet = `İtki kesilince dron yalnızca hava direnciyle frenlenir. Hızı arttıkça direnç de artar ve sonunda ağırlığa eşitlenir: bu <b>son hız</b> (${tr(r.vt, 1)} m/s). Havasız bir ortamda aynı yükseklikten ${tr(r.vBos, 1)} m/s ile çarpardı.`;
    }
    $('dsSonuc').innerHTML = `<p class="ds-ozet">${ozet}</p>
      <div class="sonuc-grid">
        ${r.senaryo !== 'sert' ? kutu('Düşüş süresi', tr(r.tDus, 1) + ' s', `${tr(r.h, 0)} m yükseklikten`) : ''}
        ${kutu('Çarpma hızı', tr(r.vCarp, 1) + ' m/s', tr(r.vCarp * 3.6, 0) + ' km/sa')}
        ${r.senaryo === 'pil' ? kutu('Son hız (v_t)', tr(r.vt, 1) + ' m/s', `alan ≈ ${tr(r.A * 1e4, 0)} cm², Cd ≈ ${CD}`) : ''}
        ${kutu('Çarpma enerjisi', tr(r.E, r.E < 10 ? 1 : 0) + ' J', `kütle ${tr(r.m * 1000, 0)} g`, sinif)}
        ${kutu('Hasar tahmini', baslik, not, sinif)}
      </div>
      <p class="not">E = ½·m·v² = ½ · ${tr(r.m, 3)} kg · (${tr(r.vCarp, 1)} m/s)² ≈ ${tr(r.E, 1)} J${r.senaryo === 'pil' ? ` · v_t = √(2mg / ρ·Cd·A) = ${tr(r.vt, 1)} m/s` : ''}. Hasar sınırları öğretici yaklaşık değerlerdir.</p>`;
    return r;
  }

  /* ---------- canlandırma: yandan görünüş ---------- */
  function ciz(r, t) {
    const c = $('dsTuval'), x = c.getContext('2d'), w = c.clientWidth, h = c.clientHeight, dpr = devicePixelRatio || 1;
    if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    const css = getComputedStyle(document.documentElement), renk = (v, y) => css.getPropertyValue(v).trim() || y;
    const zemin = h - 26, ust = 18, H0 = r.senaryo === 'sert' ? 3 : Math.max(r.h, 1);
    const yPx = (y) => zemin - (y / H0) * (zemin - ust);
    // ölçek
    x.strokeStyle = renk('--grid', '#dde5ef'); x.fillStyle = renk('--muted', '#5c6778'); x.font = '11px system-ui'; x.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = H0 * i / 4, p = yPx(y); x.beginPath(); x.moveTo(40, p); x.lineTo(w - 8, p); x.stroke(); x.fillText(tr(y, 0) + ' m', 4, p + 4); }
    x.fillStyle = renk('--ok', '#1f8a5b'); x.fillRect(40, zemin, w - 48, 3);
    // konum ve hız
    let y, v, aci = 0;
    if (r.senaryo === 'sert') { const k = Math.min(1, t / r.tDus); y = 3 * (1 - k); v = r.vCarp; }
    else if (r.senaryo === 'motor' && r.iner) { const T2 = r.tDus; y = Math.max(0, r.h - r.h * Math.min(1, t / T2)); v = t < T2 ? r.h / T2 : 0; aci = Math.sin(t * 3) * 0.08; }
    else { y = Math.max(0, r.h - r.vt * r.vt / g * Math.log(Math.cosh(g * t / r.vt))); v = r.vt * Math.tanh(g * t / r.vt); aci = r.senaryo === 'motor' ? t * 9 : t * 1.2; }
    const py = zemin - (y / H0) * (zemin - ust) - 8, px = w * 0.55;
    // dron (yandan): gövde + kollar + pervaneler; döndükçe kısalır
    x.save(); x.translate(px, py); x.scale(Math.cos(aci) * 0.75 + 0.25 * Math.sign(Math.cos(aci) || 1), 1);
    x.fillStyle = renk('--text', '#1b2433'); x.fillRect(-26, -3, 52, 6); x.fillRect(-7, -9, 14, 7);
    x.fillStyle = renk('--c2', '#e08a1e'); x.fillRect(-36, -7, 20, 3); x.fillRect(16, -7, 20, 3);
    x.restore();
    const bitti = y <= 0.001;
    if (bitti && !(r.senaryo === 'motor' && r.iner)) {   // toz bulutu
      x.fillStyle = 'rgba(160,140,110,.45)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(px + (i - 2.5) * 12, zemin - 4, 6 + (i % 3) * 3, 0, 7); x.fill(); }
    }
    x.fillStyle = renk('--text', '#1b2433'); x.font = '600 13px system-ui';
    x.fillText(`t = ${tr(Math.min(t, r.tDus), 1)} s   v = ${tr(bitti ? r.vCarp : v, 1)} m/s   yükseklik = ${tr(y, 1)} m`, 46, 14);
    return bitti;
  }
  function baslat() {
    if (!s) return;
    if (!s.ucabilir && $('dsSenaryo').value === 'motor') { $('dsSonuc').innerHTML = '<p class="not">Bu tasarım zaten havalanamıyor: önce uçabilen bir tasarım yap.</p>'; return; }
    const r = yaz(hesap());
    cancelAnimationFrame(anim); const t0 = performance.now(), hiz = Math.max(1, r.tDus / 4);   // uzun düşüşleri en çok ~4 s'de oynat
    const kare = (now) => { const t = (now - t0) / 1000 * hiz; const bitti = ciz(r, t); if (!bitti) anim = requestAnimationFrame(kare); };
    anim = requestAnimationFrame(kare);
  }
  function senaryoDegis() {
    const sv = $('dsSenaryo').value;
    $('dsYukSatir').hidden = sv === 'sert'; $('dsHizSatir').hidden = sv !== 'sert';
    if (s) { const r = yaz(hesap()); ciz(r, 0); }
  }

  function kur() {
    const kart = document.createElement('section');
    kart.className = 'kart'; kart.id = 'dusmeKart'; kart.setAttribute('aria-labelledby', 'dsBaslik');
    kart.innerHTML = `<h2 id="dsBaslik">Düşme ve arıza testi <span class="yaklasik">tahmin</span></h2>
      <p class="not">Simülatörde dronun düştüğü durumları burada tasarımın üzerinde dene: aynı dron, aynı kütle.</p>
      <div class="ds-kontrol">
        <label>Senaryo <select id="dsSenaryo">
          <option value="pil">Batarya bitti: itki kesildi</option>
          <option value="motor">Bir motor arızalandı</option>
          <option value="sert">Sert iniş (yere hızlı değme)</option>
        </select></label>
        <label id="dsYukSatir">Yükseklik <input type="range" id="dsYuk" min="1" max="120" step="1" value="20"> <b id="dsYukDeg" class="num">20 m</b></label>
        <label id="dsHizSatir" hidden>İniş hızı <input type="range" id="dsHiz" min="0.5" max="8" step="0.5" value="3"> <b id="dsHizDeg" class="num">3 m/s</b></label>
        <button class="btn" type="button" id="dsBasla">Testi başlat</button>
      </div>
      <canvas id="dsTuval" class="ds-tuval" role="img" aria-label="Dronun yandan görünüşte düşüşü"></canvas>
      <div id="dsSonuc" aria-live="polite"></div>`;
    const deg = document.querySelector('#degBaslik') && document.querySelector('#degBaslik').closest('section');
    if (deg) deg.after(kart); else document.querySelector('main').append(kart);
    const st = document.createElement('style');
    st.textContent = `.ds-kontrol{display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center;margin:.6rem 0}
.ds-kontrol label{display:flex;gap:.4rem;align-items:center;font-weight:600;font-size:.9rem}
.ds-kontrol select{font:inherit;padding:.3rem .4rem;border-radius:8px;border:1px solid var(--border);background:var(--panel);color:var(--text)}
.ds-tuval{width:100%;height:220px;display:block;border-radius:10px;background:var(--panel-2);margin:.4rem 0 .8rem}
.ds-ozet{margin:0 0 .7rem;line-height:1.5}
.ds-kontrol label[hidden]{display:none}
@media print{#dusmeKart .ds-kontrol,#dusmeKart canvas{display:none}}`;
    document.head.append(st);
    $('dsSenaryo').addEventListener('change', senaryoDegis);
    $('dsYuk').addEventListener('input', () => { $('dsYukDeg').textContent = $('dsYuk').value + ' m'; senaryoDegis(); });
    $('dsHiz').addEventListener('input', () => { $('dsHizDeg').textContent = tr(+$('dsHiz').value, 1) + ' m/s'; senaryoDegis(); });
    $('dsBasla').addEventListener('click', baslat);
    new ResizeObserver(() => { if (s) ciz(hesap(), 0); }).observe($('dsTuval'));
  }

  addEventListener('tasarim-degisti', (e) => {
    tasarim = e.detail.tasarim; s = e.detail.s;
    if (!$('dusmeKart')) kur();
    cancelAnimationFrame(anim); senaryoDegis();
  });
})();
