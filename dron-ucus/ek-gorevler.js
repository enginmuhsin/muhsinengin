/* =====================================================================
   EK GÖREVLER — Paket 7
   1) rota  : Otonom rota. Öğrenci bloklarla program yazar (kalk, git, ileri,
              dön, yüksel, fotoğraf, tekrarla, in); otopilot uygular.
              TEKNOFEST otonom görevlerine hazırlık. Sonuçta gezgin satıcı
              problemi: 4 hedefin en kısa sırası.
   2) kayit : Uçuş kaydı. Betaflight Blackbox CSV'sindeki kumanda hareketleri
              (rcCommand) simülatördeki drona uygulanır; kayıtta gyro varsa
              gerçek ve simüle dönüş hızları canlı karşılaştırılır.
   Ayrıca her uçuş 50 Hz'de kaydedilir; sonuç ekranından CSV indirilebilir.

   Bu dosya ana betikten ÖNCE yüklenir; ana betiğin değişkenlerine (uc, fz,
   gorevD, girdi, ayar, THREE, bildir …) yalnızca çağrı anında erişir.
   ===================================================================== */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const sin = Math.sin, cos = Math.cos, PI = Math.PI;
  const kis = (v, a, b) => Math.max(a, Math.min(b, v));
  const say = (x, b = 1) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b });
  const sakla = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const getir = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const aci = (a) => Math.atan2(sin(a), cos(a));

  /* ---------- stil ---------- */
  const css = document.createElement('style');
  css.textContent = `
.ek-panel{pointer-events:auto;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(980px,calc(100% - 24px));max-height:calc(100% - 90px);overflow:auto;padding:16px;z-index:12;box-sizing:border-box;display:flex;flex-direction:column;gap:10px}
.ek-panel h3{margin:0;font-size:19px}
.ek-panel p{margin:0;font-size:13.5px;line-height:1.5;color:var(--soluk)}
.ek-panel p b{color:var(--yazi)}
.ek-dugmeler{display:flex;gap:6px;flex-wrap:wrap}
.ek-dugmeler button,.ek-panel .dg{border-radius:10px;padding:8px 12px;border:1px solid var(--cizgi);background:rgba(255,255,255,.07);font-weight:600;font-size:13.5px}
.ek-panel button.ana{background:var(--itki);border-color:var(--itki);color:#1a0d02}
.ek-izgara{display:grid;grid-template-columns:200px minmax(0,1fr) minmax(0,.9fr);gap:12px;align-items:start}
@media (max-width:820px){.ek-izgara{grid-template-columns:1fr}}
.palet{display:flex;flex-direction:column;gap:5px}
.palet button{text-align:left;border-radius:9px;padding:7px 10px;border:1px solid var(--cizgi);background:rgba(255,255,255,.06);font-size:13px;font-weight:600}
.palet button i{font-style:normal;display:inline-block;width:18px;text-align:center;margin-right:4px}
.program{min-height:120px;border:1px dashed var(--cizgi);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:5px}
.blok{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.07);border-left:4px solid var(--b,#8fb3ff);font-size:13px}
.blok.secili{outline:2px solid var(--itki)}
.blok.calisiyor{background:rgba(255,176,74,.25)}
.blok b{font-weight:700}
.blok input{width:58px;font:inherit;padding:3px 5px;border-radius:6px;border:1px solid var(--cizgi);background:rgba(0,0,0,.25);color:var(--yazi)}
.blok .sag{margin-left:auto;display:flex;gap:3px}
.blok .sag button{width:26px;height:26px;border-radius:7px;border:1px solid var(--cizgi);background:transparent;font-size:12px;padding:0}
.ic-liste{margin:4px 0 2px 16px;display:flex;flex-direction:column;gap:5px;width:calc(100% - 16px)}
.kod{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.55;background:rgba(0,0,0,.28);border:1px solid var(--cizgi);border-radius:10px;padding:10px;white-space:pre;overflow:auto;max-height:300px;margin:0}
.ek-not{font-size:12px!important}
#kayitGrafik{pointer-events:none;position:absolute;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(520px,calc(100% - 340px));min-width:260px;height:118px}
@media (max-width:760px){#kayitGrafik{bottom:190px;width:calc(100% - 24px)}}
`;
  document.head.append(css);

  /* =====================================================================
     UÇUŞ KAYDEDİCİ — her görevde, 50 Hz. Sütunlar Betaflight CSV adlarıyla.
     ===================================================================== */
  const KAYIT_HZ = 50, KAYIT_MAKS = KAYIT_HZ * 600;
  let kayit = null, kayitT = 0;
  const BASLIK = ['loopIteration', 'time (us)', 'rcCommand[0]', 'rcCommand[1]', 'rcCommand[2]', 'rcCommand[3]',
    'gyroADC[0]', 'gyroADC[1]', 'gyroADC[2]', 'motor[0]', 'motor[1]', 'motor[2]', 'motor[3]', 'simPozX', 'simPozY', 'simPozZ', 'simYaw', 'simMod', 'simAkro'];
  window.EK_HER_ADIM = function (dt) {
    const u = uc; if (!u || u.dustu) return;
    if (!kayit || kayit.uc !== u) { kayit = { uc: u, satir: [], sablon: ayar.sablon, gorev: gorevD.tip }; kayitT = 0; }
    kayitT += dt; if (kayitT < 1 / KAYIT_HZ || kayit.satir.length >= KAYIT_MAKS) return; kayitT -= 1 / KAYIT_HZ;
    const kolay = ayar.mod === 'kolay', r = (v) => Math.round(v);
    const thr = kolay ? 1500 + girdi.tirman * 500 : 1000 + girdi.gaz * 1000;
    const yawHiz = (u.yerde && u.gaz < .05) ? 0 : -girdi.yaw * 140;
    const m = r(1000 + u.gaz * 1000);
    kayit.satir.push([kayit.satir.length, r(u.zaman * 1e6), r(girdi.roll * 500), r(girdi.pitch * 500), r(girdi.yaw * 500), r(thr),
      r(u.rRoll * 180 / PI), r(u.rPitch * 180 / PI), r(yawHiz), m, m, m, m,
      +u.poz.x.toFixed(3), +u.poz.y.toFixed(3), +u.poz.z.toFixed(3), +u.yaw.toFixed(4), kolay ? 0 : 1, ayar.kumanda === 'akro' ? 1 : 0]);
  };
  function kayitCSV(k) { return BASLIK.map((b) => `"${b}"`).join(',') + '\n' + k.satir.map((s) => s.join(',')).join('\n') + '\n'; }
  function indir(ad, metin) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([metin], { type: 'text/csv' })); a.download = ad;
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  // sonuç ekranına "Uçuş kaydını indir" düğmesi
  addEventListener('DOMContentLoaded', () => {
    const satir = document.querySelector('#sonuc .satir'); if (!satir) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'sKayit'; b.textContent = 'Kaydı indir (CSV)';
    b.title = 'Bu uçuşun kumanda, gyro ve konum kaydı; Betaflight Blackbox sütun adlarıyla';
    b.onclick = () => { if (!kayit || !kayit.satir.length) return; const z = new Date(); indir(`dron-ucus-${kayit.gorev}-${z.toISOString().slice(0, 16).replace(/[:T]/g, '-')}.csv`, kayitCSV(kayit)); };
    satir.append(b);
    new MutationObserver(() => { if (!$('sonuc').hidden && kayit && kayit.satir.length > 10) sakla('dronSim.sonKayit', { csv: kayit.satir.length < 15000 ? kayitCSV(kayit) : null, sablon: kayit.sablon }); }).observe($('sonuc'), { attributes: true, attributeFilter: ['hidden'] });
  });

  /* ---------- CSV okuyucu (Betaflight blackbox_decode çıktısı ya da bu simülatörün kaydı) ---------- */
  function csvOku(metin) {
    const satirlar = metin.split(/\r?\n/).filter((s) => s.trim());
    const bi = satirlar.findIndex((s) => /time/i.test(s) && /rcCommand/i.test(s));
    if (bi < 0) throw new Error('Başlık satırında "time" ve "rcCommand" sütunları bulunamadı.');
    const ad = satirlar[bi].split(',').map((s) => s.replace(/"/g, '').trim());
    const sut = (re) => ad.findIndex((a) => re.test(a));
    const iT = sut(/^time/i), iR = [0, 1, 2, 3].map((k) => sut(new RegExp(`^rcCommand\\[${k}\\]`, 'i'))), iG = [0, 1, 2].map((k) => sut(new RegExp(`^gyroADC\\[${k}\\]`, 'i')));
    if (iT < 0 || iR.some((i) => i < 0)) throw new Error('time ya da rcCommand[0..3] sütunu eksik.');
    const iP = ['simPozX', 'simPozY', 'simPozZ', 'simYaw'].map((n) => ad.indexOf(n)), iM = ad.indexOf('simMod'), iA = ad.indexOf('simAkro');
    const v = { t: [], rc: [], gyro: iG.every((i) => i >= 0) ? [] : null, poz: iP.every((i) => i >= 0) ? [] : null, mod: null, akro: null };
    let t0 = null;
    for (let i = bi + 1; i < satirlar.length; i++) {
      const p = satirlar[i].split(',').map((x) => parseFloat(x));
      if (!Number.isFinite(p[iT])) continue;
      if (t0 === null) t0 = p[iT];
      v.t.push((p[iT] - t0) / 1e6); v.rc.push(iR.map((k) => p[k]));
      if (v.gyro) v.gyro.push(iG.map((k) => p[k]));
      if (v.poz) v.poz.push(iP.map((k) => p[k]));
      if (iM >= 0 && v.mod === null) v.mod = p[iM] ? 'normal' : 'kolay';
      if (iA >= 0 && v.akro === null) v.akro = !!p[iA];
    }
    if (v.t.length < 10) throw new Error('Kayıtta yeterli satır yok.');
    // Betaflight kayıtları genelde 1–2 kHz: oynatma için seyreltmeye gerek yok, zamanla aranır
    return v;
  }
  function ornekle(v, t) {        // t anındaki satırın indeksi (ikili arama)
    let a = 0, b = v.t.length - 1; if (t <= v.t[0]) return 0; if (t >= v.t[b]) return b;
    while (b - a > 1) { const m = (a + b) >> 1; if (v.t[m] <= t) a = m; else b = m; }
    return a;
  }

  /* =====================================================================
     1) OTONOM ROTA (blok kodlama)
     Öğrenci koordinatları: x doğu (+x), y kuzey (dünyada −z). Başlangıç yönü kuzey,
     dön(+) saat yönünde. Hedefler parkta, okul ve ağaçlardan uzakta.
     ===================================================================== */
  const HEDEFLER = [{ x: 12, y: 14, renk: '#ffb04a' }, { x: 30, y: 28, renk: '#5fd39d' }, { x: 18, y: 48, renk: '#8fb3ff' }, { x: -6, y: 36, renk: '#ff7a72' }];
  const BLOK = {
    kalk:    { ad: 'kalk', simge: '⤒', p: [['yükseklik', 3, 'm']], renk: '#ffb04a' },
    git:     { ad: 'git', simge: '⌖', p: [['x', 0, ''], ['y', 0, '']], renk: '#8fb3ff' },
    ileri:   { ad: 'ileri', simge: '↑', p: [['mesafe', 10, 'm']], renk: '#8fb3ff' },
    sag:     { ad: 'sağa dön', simge: '↻', p: [['açı', 90, '°']], renk: '#c49bff' },
    sol:     { ad: 'sola dön', simge: '↺', p: [['açı', 90, '°']], renk: '#c49bff' },
    yuksel:  { ad: 'yüksel', simge: '⇕', p: [['metre', 2, 'm']], renk: '#ffb04a' },
    bekle:   { ad: 'bekle', simge: '⏱', p: [['süre', 2, 's']], renk: '#a1b0aa' },
    foto:    { ad: 'fotoğraf çek', simge: '◉', p: [], renk: '#5fd39d' },
    tekrar:  { ad: 'tekrarla', simge: '⟳', p: [['kez', 4, '']], renk: '#ff7a72', ic: true },
    in:      { ad: 'in', simge: '⤓', p: [], renk: '#ffb04a' },
  };
  const ORNEK = [{ t: 'kalk', v: [4] }, { t: 'git', v: [12, 14] }, { t: 'foto', v: [] }, { t: 'git', v: [30, 28] }, { t: 'foto', v: [] },
    { t: 'git', v: [18, 48] }, { t: 'foto', v: [] }, { t: 'git', v: [-6, 36] }, { t: 'foto', v: [] }, { t: 'git', v: [0, 0] }, { t: 'in', v: [] }];
  let program = getir('dronSim.rotaProgram') || JSON.parse(JSON.stringify(ORNEK));
  let hedefListe = null;           // yeni blokların ekleneceği liste (tekrarla içi ya da ana program)

  // programı düz komut listesine aç ve planla: her komutun bitişindeki hedef konum/yön
  function planla(prog) {
    const k = [], d = { x: 0, y: 0, h: 0, yon: 0 }, yol = [[0, 0, 0]];
    const ac = (liste, derinlik) => {
      for (const b of liste) {
        if (k.length > 400) return;
        const v = b.v.map(Number);
        if (b.t === 'tekrar') { const n = kis(Math.round(v[0]) || 0, 0, 50); for (let i = 0; i < n; i++) ac(b.ic || [], derinlik + 1); continue; }
        if (b.t === 'kalk') d.h = kis(v[0], .5, 30);
        if (b.t === 'yuksel') d.h = kis(d.h + v[0], .5, 30);
        if (b.t === 'git') { d.x = kis(v[0], -80, 80); d.y = kis(v[1], -80, 80); }
        if (b.t === 'ileri') { d.x += sin(d.yon) * v[0]; d.y += cos(d.yon) * v[0]; }
        if (b.t === 'sag') d.yon += v[0] * PI / 180;
        if (b.t === 'sol') d.yon -= v[0] * PI / 180;
        if (b.t === 'in') d.h = 0;
        k.push({ b, t: b.t, v, x: d.x, y: d.y, h: d.h, yon: d.yon });
        yol.push([d.x, d.y, d.h]);
      }
    };
    ac(prog, 0);
    let L = 0; for (let i = 1; i < yol.length; i++) L += Math.hypot(yol[i][0] - yol[i - 1][0], yol[i][1] - yol[i - 1][1], yol[i][2] - yol[i - 1][2]);
    return { komut: k, yol, uzunluk: L };
  }
  // 4 hedef + dönüş: 4! = 24 sıralamanın en kısası (gezgin satıcı problemi)
  function enKisaTur() {
    let en = Infinity, sira = null;
    const per = (a, n = a.length) => n <= 1 ? [a.slice()] : [].concat(...a.map((x, i) => per(a.slice(0, i).concat(a.slice(i + 1))).map((p) => [x, ...p])));
    for (const p of per([0, 1, 2, 3])) {
      let L = 0, o = { x: 0, y: 0 };
      for (const i of p) { L += Math.hypot(HEDEFLER[i].x - o.x, HEDEFLER[i].y - o.y); o = HEDEFLER[i]; }
      L += Math.hypot(o.x, o.y);
      if (L < en) { en = L; sira = p; }
    }
    return { en, sira };
  }
  function kodYaz(liste, girinti = '') {
    return liste.map((b) => {
      const v = b.v.map((x) => Number(x));
      if (b.t === 'tekrar') return `${girinti}for i in range(${v[0]}):\n${b.ic && b.ic.length ? kodYaz(b.ic, girinti + '    ') : girinti + '    pass'}`;
      const ad = { kalk: 'kalk', git: 'git', ileri: 'ileri', sag: 'saga_don', sol: 'sola_don', yuksel: 'yuksel', bekle: 'bekle', foto: 'fotograf_cek', in: 'in_' }[b.t];
      return `${girinti}dron.${ad}(${v.join(', ')})`;
    }).join('\n');
  }

  function rotaPaneli() {
    let p = $('rotaP');
    if (!p) {
      p = document.createElement('div'); p.id = 'rotaP'; p.className = 'panel ek-panel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-labelledby', 'rotaBaslik');
      $('hud').append(p);
    }
    const hedefMetin = HEDEFLER.map((h, i) => `<b style="color:${h.renk}">${i + 1}</b> (${h.x}, ${h.y})`).join(' · ');
    p.innerHTML = `<h3 id="rotaBaslik">Otonom rota: programı yaz</h3>
      <p>Dron, yazdığın bloklarla kendi kendine uçacak. Dört renkli hedefin üstünde <b>fotoğraf çek</b>, sonra <b>H pedine</b> (0, 0) dönüp <b>in</b>. Koordinatlar metre: x doğuya, y kuzeye doğru. Hedefler: ${hedefMetin}.</p>
      <div class="ek-izgara">
        <div><div class="palet" id="palet" aria-label="Bloklar"></div></div>
        <div><div class="program" id="programListe" aria-label="Program"></div>
          <p class="ek-not" id="rotaOzet" style="margin-top:6px"></p></div>
        <div><pre class="kod" id="rotaKod" aria-label="Programın Python karşılığı"></pre>
          <p class="ek-not" style="margin-top:6px">Aynı program Python'da böyle yazılır. TEKNOFEST otonom görevlerinde dronlar da bu tür komut dizileriyle uçar.</p></div>
      </div>
      <div class="ek-dugmeler"><button type="button" class="ana" id="rotaCalis">Programı çalıştır ▶</button><button type="button" id="rotaOrnek">Örnek program</button><button type="button" id="rotaTemiz">Temizle</button></div>`;
    $('palet').innerHTML = Object.entries(BLOK).map(([k, b]) => `<button type="button" data-blok="${k}" style="border-left:4px solid ${b.renk}"><i>${b.simge}</i>${b.ad}${b.p.length ? ' (' + b.p.map((x) => x[0]).join(', ') + ')' : ''}</button>`).join('');
    $('palet').onclick = (e) => {
      const b = e.target.closest('[data-blok]'); if (!b) return;
      const t = BLOK[b.dataset.blok], yeni = { t: b.dataset.blok, v: t.p.map((x) => x[1]) }; if (t.ic) yeni.ic = [];
      (hedefListe || program).push(yeni); if (t.ic) hedefListe = yeni.ic; programCiz();
    };
    $('rotaCalis').onclick = () => { if (!program.length) return; sakla('dronSim.rotaProgram', program); rotaBaslat(); };
    $('rotaOrnek').onclick = () => { program = JSON.parse(JSON.stringify(ORNEK)); hedefListe = null; programCiz(); };
    $('rotaTemiz').onclick = () => { program = []; hedefListe = null; programCiz(); };
    p.hidden = false; programCiz();
    setTimeout(() => { const b = $('rotaCalis'); if (b) b.focus(); }, 50);
  }
  function programCiz() {
    const kutu = $('programListe'); if (!kutu) return;
    const blokEl = (b, liste, i) => {
      const t = BLOK[b.t], d = document.createElement('div');
      d.className = 'blok' + (b.ic && b.ic === hedefListe ? ' secili' : ''); d.style.setProperty('--b', t.renk); d._blok = b;
      d.innerHTML = `<b>${t.simge} ${t.ad}</b>` + t.p.map((x, k) => `<label>${x[0]} <input type="number" step="any" value="${b.v[k]}" aria-label="${t.ad}: ${x[0]}"> ${x[2]}</label>`).join('') +
        `<span class="sag">${t.ic ? `<button type="button" data-is="ic" title="Yeni blokları bunun içine ekle">⤵</button>` : ''}<button type="button" data-is="yukari" aria-label="Yukarı taşı">↑</button><button type="button" data-is="asagi" aria-label="Aşağı taşı">↓</button><button type="button" data-is="sil" aria-label="Sil">✕</button></span>`;
      d.querySelectorAll('input').forEach((inp, k) => { inp.oninput = () => { b.v[k] = inp.value; ozetYaz(); }; });
      d.querySelector('.sag').onclick = (e) => {
        const is = e.target.dataset.is; if (!is) return;
        if (is === 'sil') { liste.splice(i, 1); if (b.ic && hedefListe === b.ic) hedefListe = null; }
        if (is === 'yukari' && i > 0) [liste[i - 1], liste[i]] = [liste[i], liste[i - 1]];
        if (is === 'asagi' && i < liste.length - 1) [liste[i + 1], liste[i]] = [liste[i], liste[i + 1]];
        if (is === 'ic') hedefListe = hedefListe === b.ic ? null : b.ic;
        programCiz();
      };
      if (b.ic) {
        const ic = document.createElement('div'); ic.className = 'ic-liste';
        b.ic.forEach((c, j) => ic.append(blokEl(c, b.ic, j)));
        if (!b.ic.length) { const bos = document.createElement('p'); bos.className = 'ek-not'; bos.textContent = '⤵ ile seç, sonra soldan blok ekle'; ic.append(bos); }
        d.append(ic);
      }
      return d;
    };
    kutu.innerHTML = '';
    program.forEach((b, i) => kutu.append(blokEl(b, program, i)));
    if (!program.length) kutu.innerHTML = '<p class="ek-not">Soldan blok ekle. Örnek: kalk (4) → git (12, 14) → fotoğraf çek …</p>';
    ozetYaz();
  }
  function ozetYaz() {
    const pl = planla(program);
    if ($('rotaKod')) $('rotaKod').textContent = 'import dron\n\n' + (kodYaz(program) || '# program boş');
    if ($('rotaOzet')) $('rotaOzet').innerHTML = `${pl.komut.length} komut · planlanan yol <b>${say(pl.uzunluk, 0)} m</b>` + (hedefListe ? ' · yeni bloklar <b>tekrarla</b> içine eklenecek' : '');
    rotaCizgisi(pl);
  }
  // planlanan yol: sahnede kesikli çizgi
  function rotaCizgisi(pl) {
    const g = gorevD; if (!g || g.tip !== 'rota') return;
    if (g.cizgi) { gorevGrubu.remove(g.cizgi); g.cizgi.geometry.dispose(); }
    const pts = pl.yol.map(([x, y, h]) => new THREE.Vector3(x, Math.max(.15, h + .02), -y));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    g.cizgi = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: '#ffb04a', dashSize: .6, gapSize: .35 }));
    g.cizgi.computeLineDistances(); gorevGrubu.add(g.cizgi);
  }
  function etiketDoku(metin, renk, cercevesiz) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    if (cercevesiz) {   // eksen işaretleri: kutusuz, gölgeli yazı
      x.font = '800 64px system-ui,sans-serif'; x.textAlign = 'center'; x.lineWidth = 10; x.strokeStyle = 'rgba(12,20,21,.55)'; x.strokeText(metin[1], 128, 84);
      x.fillStyle = renk; x.fillText(metin[1], 128, 84); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    }
    x.fillStyle = 'rgba(12,20,21,.78)'; x.beginPath(); x.roundRect ? x.roundRect(8, 8, 240, 112, 22) : x.rect(8, 8, 240, 112); x.fill();
    x.fillStyle = renk; x.font = '800 54px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(metin[0], 128, 66);
    x.fillStyle = '#e9efe8'; x.font = '600 26px system-ui,sans-serif'; x.fillText(metin[1], 128, 104);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }

  let otopilotAyar = null;
  const rota = {
    kart: { ad: 'Otonom rota', kisa: 'Bloklarla program yaz: dron 4 hedefin fotoğrafını kendi çeksin, dönüp insin.', ders: 'Algoritma ve en kısa yol' },
    kur(g) {
      // otopilot irtifa tutma ve açı modunda çalışır (gerçek otopilotlar gibi)
      if (!otopilotAyar) otopilotAyar = { mod: ayar.mod, kumanda: ayar.kumanda };
      ayar.mod = 'kolay'; ayar.kumanda = 'aci';
      g.bekle = true; g.hedefler = HEDEFLER.map((h, i) => {
        const p = new THREE.Vector3(h.x, 0, -h.y);
        const halka = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.5, 48), new THREE.MeshBasicMaterial({ color: h.renk, transparent: true, opacity: .75, side: THREE.DoubleSide, depthWrite: false }));
        halka.rotation.x = -PI / 2; halka.position.copy(p).setY(.03); gorevGrubu.add(halka);
        const isik = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 14, 20, 1, true), new THREE.MeshBasicMaterial({ color: h.renk, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false }));
        isik.position.copy(p).setY(7); gorevGrubu.add(isik);
        const et = new THREE.Sprite(new THREE.SpriteMaterial({ map: etiketDoku([String(i + 1), `(${h.x}, ${h.y})`], h.renk), depthTest: false }));
        et.scale.set(3.2, 1.6, 1); et.position.copy(p).setY(3.4); gorevGrubu.add(et);
        return { ...h, p, halka, isik, cekildi: false };
      });
      // koordinat eksenleri: x (doğu) ve y (kuzey), 10 m'de bir işaret
      const ek = (a, b, renk) => gorevGrubu.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: renk })));
      ek(new THREE.Vector3(-12, .04, 0), new THREE.Vector3(45, .04, 0), '#ff7a72'); ek(new THREE.Vector3(0, .04, 12), new THREE.Vector3(0, .04, -55), '#8fb3ff');
      for (let i = 10; i <= 40; i += 10) { const s1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: etiketDoku(['', `x ${i}`], '#ff9a92', true), depthTest: true })); s1.scale.set(1.4, .7, 1); s1.position.set(i, .35, 1.4); gorevGrubu.add(s1); }
      for (let i = 10; i <= 50; i += 10) { const s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: etiketDoku(['', `y ${i}`], '#a9c4ff', true), depthTest: true })); s2.scale.set(1.4, .7, 1); s2.position.set(1.6, .35, -i); gorevGrubu.add(s2); }
      g.hedef = null; g.yolUcus = 0; g.foto = 0; g.flas = 0;
    },
    basla() { rotaPaneli(); bildir('Programı yaz, sonra çalıştır', 1800); },
    girdi(g, dt) { if (g.oto) otopilot(g, dt); },
    adim(g, dt) {
      const u = uc;
      if (g.oto && g.onceki) g.yolUcus += u.poz.distanceTo(g.onceki);
      g.onceki = u.poz.clone();
      for (const h of g.hedefler) h.isik.material.opacity = h.cekildi ? .05 : .1 + .06 * sin(u.zaman * 3);
      if (g.bitis != null && (g.bitis -= dt) <= 0) bitir(true);
    },
    hud(g) {
      const k = g.oto && g.komut[g.pc];
      const n = g.hedefler.filter((h) => h.cekildi).length;
      return { hedef: !g.oto ? 'Programı yaz ve çalıştır.' : k ? `Komut ${g.pc + 1}/${g.komut.length}: ${BLOK[k.t].ad}${k.v.length ? ' (' + k.v.join(', ') + ')' : ''}` : 'Program bitti.', ek: `Fotoğraf <b>${n}/4</b> · Yol <b>${say(g.yolUcus || 0, 0)} m</b>` };
    },
    bitir(g, olcum) {
      const n = g.hedefler.filter((h) => h.cekildi).length, T = enKisaTur(), pl = g.plan;
      const sira = T.sira.map((i) => i + 1).join(' → ');
      const pedde = Math.hypot(uc.poz.x, uc.poz.z) < 2.5 && uc.yerde;
      const fark = pl ? (pl.uzunluk - T.en) / T.en * 100 : 0;
      const bloklar = (function sayac(l) { return l.reduce((s, b) => s + 1 + (b.ic ? sayac(b.ic) : 0), 0); })(program);
      olcum.splice(0, olcum.length, ['Fotoğraf', `${n}/4`], ['Pede dönüş', pedde ? 'evet' : 'hayır'], ['Uçulan yol', say(g.yolUcus, 0) + ' m'], ['Planlanan yol', say(pl ? pl.uzunluk : 0, 0) + ' m'], ['En kısa tur', say(T.en, 0) + ' m'], ['Blok sayısı', String(bloklar)], ['Süre', say(g.sure, 1) + ' s']);
      const tamam = n === 4 && pedde;
      return {
        baslik: tamam ? (fark < 3 ? 'Kusursuz rota!' : 'Görev tamam') : n === 4 ? 'Fotoğraflar tamam, iniş eksik' : `${n} hedefin fotoğrafı çekildi`,
        metin: (tamam ? `Dron programını baştan sona kendi uyguladı. ` : `Eksik hedefler için <b>git</b> ve <b>fotoğraf çek</b> bloklarını kontrol et; fotoğraf hedefin 2,5 m yakınında çekilmeli. `) +
          `Dört hedefi ziyaret etmenin <b>4! = 24</b> farklı sırası var; en kısası <b>${sira}</b> sırasıyla <b>${say(T.en, 0)} m</b>. ${pl ? `Senin planın ${say(pl.uzunluk, 0)} m${fark > 0.5 ? `, en kısadan %${say(fark, 0)} uzun` : ', yani en kısa tur'}.` : ''} ` +
          `Hedef sayısı arttıkça sıralama sayısı patlar: 10 hedefte 3.628.800 sıra olur. Buna <b>gezgin satıcı problemi</b> denir; teslimat dronları ve kargo şirketleri her gün bu soruyu çözer.`,
        formul: `sıralama sayısı = n!  ·  4! = 24  ·  10! = 3 628 800`,
      };
    },
    kapat() {
      const p = $('rotaP'); if (p) p.hidden = true;
      if (otopilotAyar) { ayar.mod = otopilotAyar.mod; ayar.kumanda = otopilotAyar.kumanda; otopilotAyar = null; }
    },
  };
  function rotaBaslat() {
    const g = gorevD; if (!g || g.tip !== 'rota') return;
    g.plan = planla(program); g.komut = g.plan.komut; g.pc = 0; g.oto = true; g.bekle = false; g.kT = 0;
    g.ref = { x: 0, y: 0, h: 0, yon: 0 };
    $('rotaP').hidden = true; bildir('Otopilot devrede', 1200);
  }
  // Otopilot: hedef konum → istenen hız → istenen ivme → eğim komutu (açı modu), irtifa için tırmanma hızı
  function otopilot(g, dt) {
    const u = uc, k = g.komut[g.pc];
    const x = u.poz.x, y = -u.poz.z, h = u.poz.y - fz.ayak, vx = u.hiz.x, vy = -u.hiz.z;
    if (!k) { // program bitti: olduğun yerde dur; inmediysen 4 s sonra bitir
      if (g.bitis == null && !g.bitti) g.bitis = u.yerde ? 1 : 4;
    }
    const hedef = k || { x: g.ref.x, y: g.ref.y, h: g.ref.h, yon: g.ref.yon, t: 'bekle', v: [1e9] };
    const ex = hedef.x - x, ey = hedef.y - y, d = Math.hypot(ex, ey);
    const vMaks = 4.5, vs = Math.min(vMaks, .9 * d), vdx = d > 1e-3 ? ex / d * vs : 0, vdy = d > 1e-3 ? ey / d * vs : 0;
    const aMaks = 9.81 * Math.tan(28 * PI / 180) * .9;
    let ax = 2.2 * (vdx - vx), ay = 2.2 * (vdy - vy); const am = Math.hypot(ax, ay); if (am > aMaks) { ax *= aMaks / am; ay *= aMaks / am; }
    // dünya ivmesini gövde eksenine çevir (yaw): ileri = (−sin yaw, cos yaw) [öğrenci koordinatı], sağ = (cos yaw, sin yaw)
    const fx = -sin(u.yaw), fy = cos(u.yaw), rx = cos(u.yaw), ry = sin(u.yaw);
    const maks = 28 * PI / 180;
    const yerde = u.yerde && h < .2;
    girdi.pitch = yerde ? 0 : kis(Math.atan((ax * fx + ay * fy) / 9.81) / maks, -1, 1);
    girdi.roll = yerde ? 0 : kis(Math.atan((ax * rx + ay * ry) / 9.81) / maks, -1, 1);
    const eh = hedef.h - h;
    girdi.tirman = hedef.t === 'in' ? (h > 1.2 ? -.6 : -.3) : kis(eh * .9 - u.hiz.y * .25, -.7, 1);
    const yawH = -hedef.yon, ey2 = aci(yawH - u.yaw);
    girdi.yaw = yerde ? 0 : kis(-ey2 * 2.2, -1, 1);
    if (!k) return;
    // komut bitti mi?
    const v = Math.hypot(vx, vy), varis = d < .7 && v < .8 && Math.abs(eh) < .35, yonTamam = Math.abs(ey2) < .06;
    let bitti = false;
    if (k.t === 'kalk' || k.t === 'yuksel') bitti = Math.abs(eh) < .3 && d < 1.2;
    else if (k.t === 'git' || k.t === 'ileri') bitti = varis;
    else if (k.t === 'sag' || k.t === 'sol') bitti = yonTamam && d < 1.2;
    else if (k.t === 'bekle') { g.kT += dt; bitti = g.kT >= k.v[0]; }
    else if (k.t === 'foto') {
      g.kT += dt;
      if (g.kT >= .6 && !g.cekti) {
        g.cekti = true; g.foto++;
        const yakin = g.hedefler.find((t) => !t.cekildi && Math.hypot(t.x - x, t.y - y) < 2.5);
        if (yakin) { yakin.cekildi = true; yakin.halka.material.color.set('#e9efe8'); bildir(`Hedef ${g.hedefler.indexOf(yakin) + 1} fotoğraflandı ✓`, 1200); }
        else bildir('Fotoğraf çekildi, ama yakında hedef yok', 1300);
        flas();
      }
      bitti = g.kT >= .9;
    } else if (k.t === 'in') bitti = u.yerde && u.gaz < .15;
    if (bitti) { g.ref = { x: k.x, y: k.y, h: k.h, yon: k.yon }; g.pc++; g.kT = 0; g.cekti = false; }
  }
  function flas() {
    const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:.6;pointer-events:none;z-index:20;transition:opacity .4s';
    document.body.append(f); requestAnimationFrame(() => { f.style.opacity = '0'; }); setTimeout(() => f.remove(), 450);
  }

  /* =====================================================================
     2) UÇUŞ KAYDI OYNATICI
     ===================================================================== */
  let kayitAyar = null;
  const kayitGorev = {
    kart: { ad: 'Uçuş kaydı', kisa: 'Blackbox CSV kaydındaki kumanda hareketlerini bu drona uygula; gerçek ve simüle dönüşü karşılaştır.', ders: 'Veri, model ve gerçek' },
    kur(g) { g.bekle = true; g.oynat = null; g.oT = 0; g.hataK = 0; g.hataN = 0; },
    basla(g) { kayitPaneli(g); },
    girdi(g, dt) {
      const v = g.oynat; if (!v) return;
      const i = ornekle(v, g.oT), rc = v.rc[i];
      girdi.roll = kis(rc[0] / 500, -1, 1); girdi.pitch = kis(rc[1] / 500, -1, 1); girdi.yaw = kis(rc[2] / 500, -1, 1);
      if (ayar.mod === 'kolay') girdi.tirman = kis((rc[3] - 1500) / 500, -1, 1); else girdi.gaz = kis((rc[3] - 1000) / 1000, 0, 1);
    },
    adim(g, dt) {
      const v = g.oynat; if (!v) return;
      g.oT += dt;
      const i = ornekle(v, g.oT);
      if (v.gyro) { const e = uc.rRoll * 180 / PI - v.gyro[i][0], e2 = uc.rPitch * 180 / PI - v.gyro[i][1]; g.hataK += e * e + e2 * e2; g.hataN += 2; }
      if (g.hayalet && v.poz) { const p = v.poz[i]; g.hayalet.visible = true; g.hayalet.position.set(p[0], p[1] - fz.ayak * .2, p[2]); g.hayalet.rotation.set(0, p[3], 0); }
      if (g.oT - (g.sonNokta || 0) >= 1 / 50) {          // grafik: 50 Hz örnek, 30 Hz çizim
        g.sonNokta = g.oT; g.grafik.push([g.oT, uc.rRoll * 180 / PI, v.gyro ? v.gyro[i][0] : null, v.rc[i][0] / 500]);
        if (g.grafik.length > 400) g.grafik.shift();
      }
      if (g.oT - (g.sonCiz || 0) >= 1 / 30) { g.sonCiz = g.oT; grafikCiz(g); }
      if (g.oT >= v.t[v.t.length - 1]) bitir(true);
    },
    hud(g) {
      const v = g.oynat; if (!v) return { hedef: 'Bir kayıt seç.', ek: '' };
      const sp = v.poz ? Math.hypot(uc.poz.x - v.poz[ornekle(v, g.oT)][0], uc.poz.z - v.poz[ornekle(v, g.oT)][2]) : null;
      return { hedef: `${g.kayitAd} oynatılıyor. Kumandayı kayıt kullanıyor; sen yalnızca kamerayı değiştir (C).`, ek: `<b>${say(g.oT, 1)}/${say(v.t[v.t.length - 1], 1)} s</b>` + (sp != null ? ` · Hayaletten sapma <b>${say(sp, 1)} m</b>` : '') };
    },
    bitir(g, olcum) {
      const v = g.oynat; if (!v) return {};
      const rms = g.hataN ? Math.sqrt(g.hataK / g.hataN) : null;
      const son = v.poz ? v.poz[v.poz.length - 1] : null, sapma = son ? Math.hypot(uc.poz.x - son[0], uc.poz.z - son[2]) : null;
      olcum.splice(0, olcum.length, ['Kayıt süresi', say(v.t[v.t.length - 1], 1) + ' s'], ['Satır', v.t.length.toLocaleString('tr-TR')]);
      if (rms != null) olcum.push(['Dönüş hızı farkı (RMS)', say(rms, 0) + ' °/s']);
      if (sapma != null) olcum.push(['Son konum farkı', say(sapma, 1) + ' m']);
      return {
        baslik: 'Kayıt sonu',
        metin: `Kayıttaki kumanda hareketleri bu dronu uçurdu. ${rms != null ? `Gyro sütunları vardı: simüle dronun dönüş hızı ile kayıttaki dönüş hızı arasındaki ortalama fark <b>${say(rms, 0)} °/s</b>. ` : ''}` +
          `${sapma != null ? `Rota sonunda dron, kayıttaki konumdan <b>${say(sapma, 1)} m</b> uzakta. ` : ''}` +
          (sapma != null && sapma < 1.5 && ayar.kumanda === 'aci'
            ? `Başka bir dronla da rota hemen hemen aynı kaldıysa şaşırma: açı modunda kol eğimi belirler, yatay ivme de yalnız eğime bağlıdır (a = g·tan θ), kütleye değil. Farkı sürükleme ve denetleyicinin tepki hızı yaratır. Akro modda ya da rüzgârda fark çok daha büyük olur.`
            : `Aynı kumanda farklı bir dronda farklı bir uçuş üretir: kütle, itki, rüzgâr ve denetleyici ayarı değişince model de değişir. Başka bir dron şablonu seçip aynı kaydı yeniden oynat ve farkı ölç.`),
        formul: rms != null ? 'RMS = √( Σ (ω_sim − ω_kayıt)² / N )' : null,
      };
    },
    kapat() {
      const p = $('kayitP'); if (p) p.hidden = true; const c = $('kayitGrafik'); if (c) c.hidden = true;
      if (kayitAyar) { ayar.mod = kayitAyar.mod; ayar.kumanda = kayitAyar.kumanda; kayitAyar = null; }
    },
  };
  function kayitPaneli(g) {
    let p = $('kayitP');
    if (!p) { p = document.createElement('div'); p.id = 'kayitP'; p.className = 'panel ek-panel'; p.style.width = 'min(560px,calc(100% - 24px))'; p.setAttribute('role', 'dialog'); $('hud').append(p); }
    const son = getir('dronSim.sonKayit');
    p.innerHTML = `<h3>Uçuş kaydını oynat</h3>
      <p>Bir uçuş kaydı seç. Kayıttaki <b>kumanda hareketleri</b> (rcCommand) saniye saniye bu drona uygulanır. Kayıtta <b>gyro</b> sütunları varsa, gerçek dönüş hızı ile simülasyonun dönüş hızı ekranın altında canlı çizilir.</p>
      <div class="ek-dugmeler" style="flex-direction:column">
        <button type="button" class="ana" data-k="ornek">Örnek kayıt (bu simülatörde otonom rotadan kaydedildi)</button>
        <button type="button" data-k="son" ${son && son.csv ? '' : 'disabled'}>Son uçuşum${son && son.csv ? '' : ' (henüz yok)'}</button>
        <label class="dg" style="cursor:pointer">Betaflight CSV dosyası seç… <input type="file" accept=".csv,text/csv" id="kayitDosya" style="display:none"></label>
      </div>
      <p class="ek-not" id="kayitHata" role="status"></p>
      <p class="ek-not">Gerçek dron kaydı nasıl alınır? Betaflight'ta Blackbox'ı aç, uç, kaydı Blackbox Explorer'da açıp CSV olarak dışa aktar. Yalnızca <code>time</code>, <code>rcCommand[0-3]</code> ve varsa <code>gyroADC[0-2]</code> sütunları kullanılır. Gerçek dron kayıtları akro modda oynatılır. Simülatördeki dron kayıttaki dronla aynı değildir; sonucu bir <b>karşılaştırma</b> olarak oku, kopya olarak değil.</p>`;
    p.hidden = false;
    const yukle = (metin, ad) => {
      try {
        const v = csvOku(metin);
        if (!kayitAyar) kayitAyar = { mod: ayar.mod, kumanda: ayar.kumanda };
        ayar.mod = v.mod || 'normal'; ayar.kumanda = v.akro == null ? 'akro' : (v.akro ? 'akro' : 'aci');
        g.oynat = v; g.kayitAd = ad; g.bekle = false; g.oT = 0; g.grafik = [];
        if (v.poz && !g.hayalet) g.hayalet = hayaletYap();
        p.hidden = true; $('kayitGrafik').hidden = false;
        $('gAd').textContent = 'Uçuş kaydı · ' + (ayar.kumanda === 'akro' ? 'Akro' : 'Açı') + (ayar.mod === 'kolay' ? ' · irtifa sabit' : '');
        bildir(`${ad}: ${v.t.length.toLocaleString('tr-TR')} satır, ${say(v.t[v.t.length - 1], 1)} s`, 1800);
      } catch (e) { $('kayitHata').textContent = 'Kayıt okunamadı: ' + e.message; $('kayitHata').style.color = 'var(--kotu)'; }
    };
    p.querySelector('[data-k="ornek"]').onclick = () => fetch('ornek-kayit.csv').then((r) => (r.ok ? r.text() : Promise.reject(new Error('örnek kayıt indirilemedi')))).then((t) => yukle(t, 'Örnek kayıt')).catch((e) => { $('kayitHata').textContent = e.message; });
    p.querySelector('[data-k="son"]').onclick = () => { const s = getir('dronSim.sonKayit'); if (s && s.csv) yukle(s.csv, 'Son uçuşun'); };
    $('kayitDosya').onchange = (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > 60e6) { $('kayitHata').textContent = 'Dosya çok büyük (60 MB üstü).'; return; } f.text().then((t) => yukle(t, f.name)); };
    if (!$('kayitGrafik')) { const c = document.createElement('canvas'); c.id = 'kayitGrafik'; c.className = 'panel'; c.hidden = true; $('hud').append(c); }
    $('kayitGrafik').hidden = true;
  }
  function grafikCiz(g) {
    const c = $('kayitGrafik'); if (!c || c.hidden) return;
    const r = c.getBoundingClientRect(), o = Math.min(devicePixelRatio || 1, 2);
    if (c.width !== Math.round(r.width * o)) { c.width = Math.round(r.width * o); c.height = Math.round(r.height * o); }
    const x = c.getContext('2d'); x.setTransform(o, 0, 0, o, 0, 0); const W = r.width, H = r.height;
    x.clearRect(0, 0, W, H);
    const v = g.grafik; if (v.length < 2) return;
    const t1 = v[v.length - 1][0], t0 = t1 - 6, X = (t) => 8 + (t - t0) / 6 * (W - 16);
    let m = 90; for (const s of v) { if (s[0] < t0) continue; m = Math.max(m, Math.abs(s[1]), Math.abs(s[2] || 0)); }
    const Y = (d) => H / 2 - d / m * (H / 2 - 16);
    x.strokeStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.moveTo(8, H / 2); x.lineTo(W - 8, H / 2); x.stroke();
    const cizgi = (k, renk, kesik, olc) => { x.strokeStyle = renk; x.lineWidth = 1.8; x.setLineDash(kesik ? [4, 3] : []); x.beginPath(); let ilk = true; for (const s of v) { if (s[0] < t0 || s[k] == null) continue; const yy = olc ? H / 2 - s[k] * (H / 2 - 16) : Y(s[k]); ilk ? x.moveTo(X(s[0]), yy) : x.lineTo(X(s[0]), yy); ilk = false; } x.stroke(); x.setLineDash([]); };
    cizgi(3, 'rgba(255,176,74,.55)', false, true);
    if (g.oynat.gyro) cizgi(2, '#e9efe8', true);
    cizgi(1, '#8fb3ff', false);
    x.font = '600 11px system-ui,sans-serif'; x.fillStyle = '#ffb04a'; x.fillText('kol (roll)', 10, 13);
    x.fillStyle = '#8fb3ff'; x.fillText('simülasyon ω', 74, 13);
    if (g.oynat.gyro) { x.fillStyle = '#e9efe8'; x.fillText('kayıt ω (kesikli)', 160, 13); }
    x.fillStyle = 'rgba(233,239,232,.6)'; x.fillText(`±${Math.round(m)} °/s · son 6 s`, W - 112, H - 6);
  }

  window.EK_GOREVLER = { rota, kayit: kayitGorev };
})();
