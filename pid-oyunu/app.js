/* =====================================================================
   PID AYAR OYUNU — app.js (arayüz ve oyun döngüsü)
   ---------------------------------------------------------------------
   Görevleri:
   1) Kaydırıcıları, seviyeleri, düğmeleri bağlamak
   2) Oyun döngüsü: requestAnimationFrame + sabit adımlı simülasyon
   3) Dronu ve grafikleri Canvas 2D ile çizmek
   4) Puan, geri bildirim, ipucu, Ziegler–Nichols yardımcısı
   5) En iyi skorları localStorage'da saklamak
   Fizik ve PID formülleri fizik.js içindedir.
   ===================================================================== */
'use strict';

(function () {
  const F = window.PIDFizik;
  const P = F.PID_SABIT;
  const $ = (id) => document.getElementById(id);

  /* ===================================================================
     1) KALICI KAYIT (localStorage)
     Tarayıcı izin vermezse (gizli sekme vb.) try/catch ile sessizce geç.
     =================================================================== */
  const KAYIT_ANAHTARI = 'pid-oyunu-v1';
  let kayit = { acik: 1, enIyi: {}, kazanc: { kp: 0.5, ki: 0, kd: 0 }, seviye: 1 };
  try {
    const ham = localStorage.getItem(KAYIT_ANAHTARI);
    if (ham) kayit = Object.assign(kayit, JSON.parse(ham));
  } catch (e) { /* sessizce geç */ }
  function kaydet() {
    try { localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(kayit)); } catch (e) { /* sessizce geç */ }
  }

  /* ===================================================================
     2) OYUN DURUMU
     =================================================================== */
  let kazanc = {
    kp: sinirla(Number(kayit.kazanc.kp) || 0, 0, P.KP_MAKS),
    ki: sinirla(Number(kayit.kazanc.ki) || 0, 0, P.KI_MAKS),
    kd: sinirla(Number(kayit.kazanc.kd) || 0, 0, P.KD_MAKS),
  };
  let seviye = F.SEVIYELER[kayit.seviye] || F.SEVIYELER[1];
  let sim = null;                 // Simulasyon nesnesi
  let durum = 'hazir';            // 'hazir' | 'calisiyor' | 'duraklatildi' | 'bitti'
  let sonSonuc = null;            // son biten denemenin {m, p}
  let ipucuSirasi = {};           // seviye no → kaçıncı ipucu
  let hedefIndeks = 0;
  const HEDEFLER = [0, 15, -15, 0, 30];   // "Hedefi değiştir" sırası (derece)

  // Grafik geçmişi: son 8 saniye, saniyede 60 örnek
  const GECMIS_SN = 8, ORNEK_HZ = 60;
  const GECMIS_UZ = GECMIS_SN * ORNEK_HZ;
  let gecmis = { t: [], aci: [], hedef: [], u: [] };
  let ornekSayac = 0;

  function sinirla(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function bicim(x, b = 1) { return Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b }); }
  function renk(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  /* ===================================================================
     3) TEMA DÜĞMESİ (Dron Lab ile aynı)
     =================================================================== */
  $('temaDugme').addEventListener('click', () => {
    const kok = document.documentElement;
    const koyu = kok.getAttribute('data-theme') === 'dark' ||
      (!kok.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const yeni = koyu ? 'light' : 'dark';
    kok.setAttribute('data-theme', yeni);
    try { localStorage.setItem('site-tema', yeni); } catch (e) { /* sessizce geç */ }
    ciz();
  });

  /* ===================================================================
     4) KAZANÇ KAYDIRICILARI
     Her kazanç için bir kaydırıcı + bir sayı kutusu. İkisi senkron.
     =================================================================== */
  const KAZANC_ALANLARI = [
    { ad: 'kp', maks: P.KP_MAKS, basamak: 2 },
    { ad: 'ki', maks: P.KI_MAKS, basamak: 2 },
    { ad: 'kd', maks: P.KD_MAKS, basamak: 3 },
  ];
  function kazancYaz() {
    KAZANC_ALANLARI.forEach(a => {
      $(a.ad).value = kazanc[a.ad];
      $(a.ad + 'Sayi').value = Number(kazanc[a.ad]).toFixed(a.basamak);
      $(a.ad).setAttribute('aria-valuetext', bicim(kazanc[a.ad], a.basamak));
    });
  }
  function kazancDegisti() {
    if (sim) sim.kazanc = Object.assign({}, kazanc);   // çalışan simülasyona anında uygula
    kayit.kazanc = Object.assign({}, kazanc);
    kaydet();
  }
  KAZANC_ALANLARI.forEach(a => {
    $(a.ad).addEventListener('input', () => {
      kazanc[a.ad] = Number($(a.ad).value);
      $(a.ad + 'Sayi').value = kazanc[a.ad].toFixed(a.basamak);
      $(a.ad).setAttribute('aria-valuetext', bicim(kazanc[a.ad], a.basamak));
      kazancDegisti();
    });
    $(a.ad + 'Sayi').addEventListener('change', () => {
      let v = Number($(a.ad + 'Sayi').value);
      if (!isFinite(v)) v = kazanc[a.ad];
      kazanc[a.ad] = sinirla(v, 0, a.maks);
      kazancYaz();
      kazancDegisti();
    });
  });
  $('kazancSifir').addEventListener('click', () => { kazanc = { kp: 0, ki: 0, kd: 0 }; kazancYaz(); kazancDegisti(); });
  $('enIyiYukle').addEventListener('click', () => {
    const e = kayit.enIyi[seviye.no];
    if (!e) { geriBildirimYaz(['Bu seviyede henüz kayıtlı bir skorun yok.']); return; }
    kazanc = { kp: e.kp, ki: e.ki, kd: e.kd };
    kazancYaz(); kazancDegisti();
    geriBildirimYaz([`En iyi ayarın yüklendi (puan ${e.puan}).`]);
  });

  /* ===================================================================
     5) SEVİYE SEÇİMİ
     =================================================================== */
  function seviyeleriCiz() {
    const liste = $('seviyeListe');
    liste.innerHTML = '';
    F.SEVIYELER.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seviye-btn';
      const kilitli = s.puanli && s.no > kayit.acik;
      b.disabled = kilitli;
      b.setAttribute('aria-pressed', s.no === seviye.no ? 'true' : 'false');
      const enIyi = kayit.enIyi[s.no];
      const yildiz = s.puanli ? (enIyi ? '★'.repeat(enIyi.yildiz) + '☆'.repeat(3 - enIyi.yildiz) : '☆☆☆') : '';
      b.innerHTML = `<span class="s-ad">${s.puanli ? s.no + '. ' : ''}${s.ad}${kilitli ? ' 🔒' : ''}</span>
                     <span class="s-yildiz" aria-hidden="true">${yildiz}</span>
                     ${enIyi ? `<span class="not"> ${enIyi.puan}</span>` : ''}`;
      b.setAttribute('aria-label', `${s.ad}${kilitli ? ', kilitli' : ''}${enIyi ? `, en iyi puan ${enIyi.puan}, ${enIyi.yildiz} yıldız` : ''}`);
      b.addEventListener('click', () => { seviye = s; kayit.seviye = s.no; kaydet(); seviyeleriCiz(); sifirla(); });
      liste.appendChild(b);
    });
    $('gorevMetni').textContent = seviye.gorev;
    $('hedefDugme').disabled = seviye.puanli;   // puanlı seviyelerde hedef sabit
  }
  $('hepsiniAc').addEventListener('click', () => { kayit.acik = 5; kaydet(); seviyeleriCiz(); });

  /* ===================================================================
     6) DÜĞMELER VE KISAYOLLAR
     =================================================================== */
  function sifirla() {
    sim = new F.Simulasyon(seviye, kazanc, (Math.random() * 1e9) | 0);
    sim.hedef = 0; hedefIndeks = 0;
    gecmis = { t: [], aci: [], hedef: [], u: [] };
    durumAyarla('hazir');
    ciz();
  }
  function baslatDuraklat() {
    if (durum === 'calisiyor') { durumAyarla('duraklatildi'); return; }
    if (durum === 'bitti') sifirla();
    durumAyarla('calisiyor');
  }
  function durumAyarla(yeni) {
    durum = yeni;
    const yazi = { hazir: 'Hazır', calisiyor: 'Çalışıyor', duraklatildi: 'Duraklatıldı', bitti: 'Bitti' }[yeni];
    $('durumRozet').textContent = yazi;
    $('baslatDugme').textContent = yeni === 'calisiyor' ? '⏸ Duraklat' : yeni === 'bitti' ? '▶ Yeniden dene' : '▶ Başlat';
    sonZaman = null;
  }
  $('baslatDugme').addEventListener('click', baslatDuraklat);
  $('sifirlaDugme').addEventListener('click', sifirla);
  $('ruzgarDugme').addEventListener('click', () => { if (sim && !sim.bitti) sim.ruzgarVer(); });
  $('hedefDugme').addEventListener('click', () => {
    if (!sim || seviye.puanli) return;
    hedefIndeks = (hedefIndeks + 1) % HEDEFLER.length;
    sim.hedef = HEDEFLER[hedefIndeks] * F.DERECE;
  });

  // Klavye kısayolları (yazı kutusundayken çalışmasın)
  document.addEventListener('keydown', (e) => {
    const etiket = (e.target.tagName || '').toLowerCase();
    if (['input', 'select', 'textarea', 'button', 'summary'].includes(etiket)) return;
    if (e.key === ' ') { e.preventDefault(); baslatDuraklat(); }
    else if (e.key === 'r' || e.key === 'R') sifirla();
    else if (e.key === 'w' || e.key === 'W') { if (sim && !sim.bitti) sim.ruzgarVer(); }
  });

  // Sekme arka plana geçince otomatik duraklat (simülasyon "sıçramasın")
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && durum === 'calisiyor') durumAyarla('duraklatildi');
  });

  /* ===================================================================
     7) OYUN DÖNGÜSÜ
     requestAnimationFrame ekranın yenilenme hızında (~60 Hz) çağrılır.
     Fizik ise sabit dt = 1/240 s ile ilerlemeli. Bu yüzden geçen gerçek
     zamanı bir "biriktirici"ye ekleyip dt'lik dilimler halinde harcarız.
     Böylece hızlı ya da yavaş bilgisayarda fizik aynı davranır.
     =================================================================== */
  let sonZaman = null, biriken = 0;
  function dongu(zaman) {
    if (durum === 'calisiyor' && sim) {
      if (sonZaman === null) sonZaman = zaman;
      // Çok uzun bir duraklama olduysa (ör. sekme değişimi) en fazla 0,1 s say
      const gecen = Math.min(0.1, (zaman - sonZaman) / 1000);
      sonZaman = zaman;
      biriken += gecen;
      while (biriken >= P.DT && !sim.bitti) {
        sim.adim();
        biriken -= P.DT;
        // 240 Hz'lik adımların her 4'ünden birini grafiğe kaydet (60 Hz)
        if (++ornekSayac % (240 / ORNEK_HZ) === 0) gecmiseEkle();
      }
      if (sim.bitti) denemeBitti();
    } else {
      sonZaman = null; biriken = 0;
    }
    ciz();
    miniAnimasyonlar(zaman);
    requestAnimationFrame(dongu);
  }

  function gecmiseEkle() {
    gecmis.t.push(sim.t);
    gecmis.aci.push(sim.teta / F.DERECE);
    gecmis.hedef.push(sim.hedef / F.DERECE);
    gecmis.u.push(sim.u);
    if (gecmis.t.length > GECMIS_UZ) { gecmis.t.shift(); gecmis.aci.shift(); gecmis.hedef.shift(); gecmis.u.shift(); }
  }

  /* ===================================================================
     8) DENEME BİTİNCE: puanla, kaydet, sonucu göster
     =================================================================== */
  function denemeBitti() {
    durumAyarla('bitti');
    const m = sim.olcutler();
    if (!seviye.puanli) {
      sonSonuc = { m, p: null };
      $('sonucIcerik').innerHTML = '<p>Dron devrildi! Serbest denemede puan yok; "Neden böyle oldu?" düğmesine bak.</p>';
      return;
    }
    const p = F.puanla(seviye, m);
    sonSonuc = { m, p };
    // En iyi skor mu?
    const onceki = kayit.enIyi[seviye.no];
    let yeniRekor = false;
    if (p.gecti && (!onceki || p.puan > onceki.puan)) {
      kayit.enIyi[seviye.no] = { puan: p.puan, yildiz: p.yildiz, kp: kazanc.kp, ki: kazanc.ki, kd: kazanc.kd };
      yeniRekor = true;
    }
    if (p.gecti && seviye.no >= kayit.acik && seviye.no < 5) kayit.acik = seviye.no + 1;
    kaydet();
    seviyeleriCiz();

    const yildizlar = '★'.repeat(p.yildiz) + '☆'.repeat(3 - p.yildiz);
    $('sonucIcerik').innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <div><div class="puan-buyuk">${p.puan}</div><div class="not">/ 100 puan</div></div>
        <div class="yildizlar" aria-label="${p.yildiz} yıldız">${yildizlar}</div>
        <div><strong>${m.devrildi ? 'Dron devrildi!' : p.gecti ? 'Seviye geçildi! 🎉' : 'Henüz geçilmedi'}</strong>
          ${yeniRekor ? '<br><span class="rozet">Yeni en iyi skor</span>' : ''}
          ${p.gecti && seviye.no < 5 ? '<br><span class="not">Sonraki seviye açıldı.</span>' : ''}</div>
      </div>
      <ul class="kosul-liste">${p.kosullar.map(([ok, yazi]) => `<li class="${ok ? 'tamam' : 'olmadi'}">${yazi}</li>`).join('')}</ul>
      <div class="tablo-kap"><table>
        <tr><th>Ortalama hata</th><td class="sayi">${bicim(m.ortHata, 2)}°</td><th>Aşım</th><td class="sayi">%${bicim(m.asimYuzde, 0)}</td></tr>
        <tr><th>Oturma süresi</th><td class="sayi">${isFinite(m.oturmaSuresi) ? bicim(m.oturmaSuresi, 2) + ' sn' : '—'}</td><th>Titreşim</th><td class="sayi">${bicim(m.titresim, 0)}</td></tr>
        <tr><th>En büyük sapma</th><td class="sayi">${bicim(m.maksHata, 1)}°</td><th>Motor doyumu</th><td class="sayi">%${bicim(m.doyumOrani * 100, 0)}</td></tr>
      </table></div>`;
    $('geriBildirim').innerHTML = '';
  }

  function geriBildirimYaz(mesajlar, baslik) {
    $('geriBildirim').innerHTML = `<div class="degerlendirme" style="margin-top:.6rem">
      ${baslik ? `<div class="baslik">${baslik}</div>` : ''}
      <ul class="uyari-liste">${mesajlar.map(m => `<li class="bilgi">${m}</li>`).join('')}</ul></div>`;
  }

  $('nedenDugme').addEventListener('click', () => {
    // Bitmiş deneme yoksa, süren denemenin şu anki ölçütlerine bak
    let m;
    if (sonSonuc && durum === 'bitti') m = sonSonuc.m;
    else if (sim && sim.t > 1) m = sim.olcutler();
    if (!m) { geriBildirimYaz(['Önce birkaç saniye simülasyon çalıştır.']); return; }
    geriBildirimYaz(F.analizEt(seviye, m, kazanc), 'Neden böyle oldu?');
  });
  $('ipucuDugme').addEventListener('click', () => {
    const liste = F.IPUCLARI[seviye.no] || [];
    const i = ipucuSirasi[seviye.no] || 0;
    const gosterilecek = liste.slice(0, i + 1);
    ipucuSirasi[seviye.no] = Math.min(i + 1, liste.length - 1);
    geriBildirimYaz(gosterilecek, `İpucu ${Math.min(i + 1, liste.length)}/${liste.length}`);
  });

  /* ===================================================================
     9) ÇİZİM — SAHNE (yandan dron)
     =================================================================== */
  function tuvalHazirla(canvas) {
    const oran = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * oran) || canvas.height !== Math.round(h * oran)) {
      canvas.width = Math.round(w * oran); canvas.height = Math.round(h * oran);
    }
    const c = canvas.getContext('2d');
    c.setTransform(oran, 0, 0, oran, 0, 0);
    c.clearRect(0, 0, w, h);
    return { c, w, h };
  }

  /* droneCiz: (x, y) merkezli, 'aci' radyan yatmış, 'olcek' boyutunda dron.
     itkiFark: sağ-sol motor farkını göstermek için (−1..1). */
  function droneCiz(c, x, y, aci, olcek, itkiFark, zamanSn) {
    c.save();
    c.translate(x, y);
    c.rotate(aci);          // Canvas'ta pozitif açı saat yönünde → sağa yatış
    const kol = olcek;
    // Kol
    c.strokeStyle = renk('--text'); c.lineWidth = Math.max(3, olcek * 0.05); c.lineCap = 'round';
    c.beginPath(); c.moveTo(-kol, 0); c.lineTo(kol, 0); c.stroke();
    // Gövde
    c.fillStyle = renk('--accent');
    const gw = olcek * 0.42, gh = olcek * 0.16;
    c.beginPath(); c.roundRect ? c.roundRect(-gw / 2, -gh / 2, gw, gh, 6) : c.rect(-gw / 2, -gh / 2, gw, gh); c.fill();
    // Motorlar ve pervaneler
    [-1, 1].forEach(yan => {
      const mx = yan * kol;
      c.fillStyle = renk('--muted');
      c.fillRect(mx - olcek * 0.05, -olcek * 0.12, olcek * 0.1, olcek * 0.12);
      // Dönen pervane: genişliği zamanla değişen elips (dönme hissi)
      const pw = olcek * 0.32 * (0.55 + 0.45 * Math.abs(Math.sin(zamanSn * 40 + yan)));
      c.fillStyle = renk('--c2'); c.globalAlpha = 0.75;
      c.beginPath(); c.ellipse(mx, -olcek * 0.14, pw, olcek * 0.025, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      // İtki oku: motorun ürettiği ek itkiyi gösterir (yukarı)
      const itki = 0.5 + 0.5 * yan * -itkiFark;   // sağ motor fazla iterse dron sola döner
      const ok = olcek * (0.15 + 0.45 * sinirla(itki, 0, 1));
      c.strokeStyle = renk('--c3'); c.lineWidth = 3;
      c.beginPath(); c.moveTo(mx, -olcek * 0.2); c.lineTo(mx, -olcek * 0.2 - ok); c.stroke();
      c.beginPath(); c.moveTo(mx - 5, -olcek * 0.2 - ok + 7); c.lineTo(mx, -olcek * 0.2 - ok); c.lineTo(mx + 5, -olcek * 0.2 - ok + 7); c.stroke();
    });
    c.restore();
  }

  function sahneCiz() {
    const { c, w, h } = tuvalHazirla($('sahne'));
    const cx = w / 2, cy = h * 0.55;
    const olcek = Math.min(w * 0.3, 150);
    // Ufuk çizgisi
    c.strokeStyle = renk('--grid'); c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, cy); c.lineTo(w, cy); c.stroke();
    // Açı ölçeği (±30°, ±60°): soluk ışınlar çizilir, etiketler tuvalin kenarına
    // konur; böylece dronun pervanelerinin altında kalıp okunmaz olmazlar.
    c.fillStyle = renk('--muted'); c.font = '11px system-ui, sans-serif'; c.textAlign = 'center';
    [-60, -30, 30, 60].forEach(d => {
      [0, Math.PI].forEach(taraf => {
        const a = d * F.DERECE + taraf;
        const dx = Math.cos(a), dy = Math.sin(a);
        // Merkezden tuval kenarına (10 px iç boşlukla) olan uzaklık
        const tx = dx > 0 ? (w - 26 - cx) / dx : (26 - cx) / dx;
        const ty = dy > 0 ? (h - 36 - cy) / dy : (28 - cy) / dy;
        const uz = Math.min(tx, ty);
        c.strokeStyle = renk('--grid'); c.setLineDash([2, 5]);
        c.beginPath(); c.moveTo(cx + dx * olcek * 1.35, cy + dy * olcek * 1.35); c.lineTo(cx + dx * uz, cy + dy * uz); c.stroke();
        c.setLineDash([]);
        c.fillText(d + '°', cx + dx * (uz + 10), cy + dy * (uz + 10) + 4);
      });
    });
    if (!sim) return;
    // Hedef çizgisi (kesikli)
    c.save(); c.translate(cx, cy); c.rotate(sim.hedef);
    c.setLineDash([8, 6]); c.strokeStyle = renk('--c2'); c.lineWidth = 2;
    c.beginPath(); c.moveTo(-olcek * 1.2, 0); c.lineTo(olcek * 1.2, 0); c.stroke();
    c.restore(); c.setLineDash([]);
    // Dron
    droneCiz(c, cx, cy, sim.teta, olcek, sim.tauMotor / P.TAU_MAKS, sim.t);
    // Rüzgâr okları (bozucu tork varsa)
    const tb = sim.tauBozucu;
    if (Math.abs(tb) > 0.003) {
      const yon = Math.sign(tb);
      const uz = 20 + Math.min(1, Math.abs(tb) / 0.15) * 60;
      c.strokeStyle = renk('--c4'); c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const y = cy - olcek * 0.6 + i * 18;
        const x0 = yon > 0 ? 12 : w - 12;
        const x1 = x0 + yon * uz;
        c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
        c.beginPath(); c.moveTo(x1 - yon * 8, y - 5); c.lineTo(x1, y); c.lineTo(x1 - yon * 8, y + 5); c.stroke();
      }
      c.fillStyle = renk('--c4'); c.textAlign = yon > 0 ? 'left' : 'right';
      c.fillText('rüzgâr', yon > 0 ? 12 : w - 12, cy - olcek * 0.6 - 10);
    }
    // Devrildi yazısı
    if (sim.devrildi) {
      c.fillStyle = renk('--bad'); c.font = 'bold 22px system-ui, sans-serif'; c.textAlign = 'center';
      c.fillText('DEVRİLDİ!', cx, 30);
    }
    // İlerleme çubuğu (puanlı seviyelerde)
    if (isFinite(seviye.sure)) {
      c.fillStyle = renk('--grid'); c.fillRect(10, h - 10, w - 20, 5);
      c.fillStyle = renk('--accent'); c.fillRect(10, h - 10, (w - 20) * Math.min(1, sim.t / seviye.sure), 5);
    }
  }

  /* ===================================================================
     10) ÇİZİM — ZAMAN GRAFİKLERİ (son 8 saniye)
     zamanGrafik(canvas, seriler, yMin, yMax, yatayCizgiler, birim)
     =================================================================== */
  function zamanGrafik(canvas, seriler, yMin, yMax, yataylar, birim) {
    const { c, w, h } = tuvalHazirla(canvas);
    const sol = 44, sag = 10, ust = 10, alt = 22;
    const gw = w - sol - sag, gh = h - ust - alt;
    const tSon = gecmis.t.length ? gecmis.t[gecmis.t.length - 1] : 0;
    const tIlk = Math.max(0, tSon - GECMIS_SN);
    const tBas = tSon < GECMIS_SN ? 0 : tIlk;
    const px = t => sol + (t - tBas) / GECMIS_SN * gw;
    const py = y => ust + gh - (y - yMin) / (yMax - yMin) * gh;
    // Izgara
    c.strokeStyle = renk('--grid'); c.fillStyle = renk('--muted'); c.lineWidth = 1;
    c.font = '11px system-ui, sans-serif';
    for (let i = 0; i <= 4; i++) {
      const v = yMin + (yMax - yMin) * i / 4;
      c.beginPath(); c.moveTo(sol, py(v)); c.lineTo(sol + gw, py(v)); c.stroke();
      c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText(v.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + birim, sol - 4, py(v));
    }
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (let s = Math.ceil(tBas); s <= tBas + GECMIS_SN; s++) c.fillText(s + ' sn', px(s), ust + gh + 4);
    // Yatay referanslar
    c.setLineDash([5, 4]);
    yataylar.forEach(l => { c.strokeStyle = l.renk; c.beginPath(); c.moveTo(sol, py(l.y)); c.lineTo(sol + gw, py(l.y)); c.stroke(); });
    c.setLineDash([]);
    // Seriler
    c.save(); c.beginPath(); c.rect(sol, ust, gw, gh); c.clip();
    seriler.forEach(s => {
      c.strokeStyle = s.renk; c.lineWidth = s.kalinlik || 2; c.beginPath();
      s.veri.forEach((y, i) => { const X = px(gecmis.t[i]), Y = py(y); i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
      c.stroke();
    });
    c.restore();
  }

  function grafikleriCiz() {
    // Açı ekseni: en az ±25°, veri büyükse genişlet
    let m = 25;
    gecmis.aci.forEach(a => { m = Math.max(m, Math.abs(a)); });
    m = Math.min(90, Math.ceil(m / 5) * 5);
    zamanGrafik($('aciGrafik'), [
      { veri: gecmis.hedef, renk: renk('--c2'), kalinlik: 2 },
      { veri: gecmis.aci, renk: renk('--c1'), kalinlik: 2.5 },
    ], -m, m, [], '°');
    zamanGrafik($('kontrolGrafik'), [{ veri: gecmis.u, renk: renk('--c3') }],
      -P.TAU_MAKS * 1.1, P.TAU_MAKS * 1.1,
      [{ y: P.TAU_MAKS, renk: renk('--bad') }, { y: -P.TAU_MAKS, renk: renk('--bad') }], '');
  }

  function durumYaz() {
    if (!sim) return;
    $('gSure').textContent = bicim(sim.t, 1) + (isFinite(seviye.sure) ? ' / ' + seviye.sure : '');
    $('gAci').textContent = bicim(sim.teta / F.DERECE, 1);
    $('gHedef').textContent = bicim(sim.hedef / F.DERECE, 0);
    $('gKontrol').textContent = bicim(sim.u, 2);
  }

  function ciz() { sahneCiz(); grafikleriCiz(); durumYaz(); }

  /* ===================================================================
     11) MİNİ ANİMASYONLAR (P, I, D benzetme kutularında)
     Her kutu açıkken iki küçük simülasyon yan yana çalışır:
     solda "iyi" ayar, sağda "eksik/aşırı" ayar. 4,5 sn'de bir baştan.
     =================================================================== */
  const MINI = {
    P: { sol: { kp: 0.5, ki: 0, kd: 0.06, ad: 'Uygun P' }, sag: { kp: 0.75, ki: 0, kd: 0, ad: 'P çok yüksek' }, baslangic: 20, ruzgar: null },
    I: { sol: { kp: 0.8, ki: 0, kd: 0.07, ad: 'I = 0' }, sag: { kp: 0.8, ki: 1.0, kd: 0.07, ad: 'I var' }, baslangic: 0, ruzgar: () => 0.06 },
    D: { sol: { kp: 0.5, ki: 0, kd: 0, ad: 'D = 0' }, sag: { kp: 0.5, ki: 0, kd: 0.07, ad: 'D var' }, baslangic: 20, ruzgar: null },
  };
  const miniDurum = {};   // anahtar → { simSol, simSag, basZaman }
  function miniBaslat(anahtar) {
    const ay = MINI[anahtar];
    const sev = { baslangicDeg: ay.baslangic, sure: Infinity, ruzgar: ay.ruzgar, darbe: null, gurultuAciDeg: 0, gurultuHiz: 0 };
    miniDurum[anahtar] = { simSol: new F.Simulasyon(sev, ay.sol, 1), simSag: new F.Simulasyon(sev, ay.sag, 1), sonZaman: null };
  }
  document.querySelectorAll('details[data-mini]').forEach(d => {
    d.addEventListener('toggle', () => { if (d.open) miniBaslat(d.dataset.mini); else delete miniDurum[d.dataset.mini]; });
  });
  function miniAnimasyonlar(zaman) {
    Object.keys(miniDurum).forEach(anahtar => {
      const md = miniDurum[anahtar];
      if (md.sonZaman === null) md.sonZaman = zaman;
      let gecen = Math.min(0.1, (zaman - md.sonZaman) / 1000);
      md.sonZaman = zaman;
      while (gecen > 0) { md.simSol.adim(); md.simSag.adim(); gecen -= P.DT; }
      if (md.simSol.t > 4.5 || md.simSol.bitti || md.simSag.bitti) { miniBaslat(anahtar); return; }
      const canvas = $('mini' + anahtar);
      const { c, w, h } = tuvalHazirla(canvas);
      const olcek = Math.min(w * 0.17, 60);
      [[md.simSol, MINI[anahtar].sol, w * 0.25], [md.simSag, MINI[anahtar].sag, w * 0.75]].forEach(([s, ay, x]) => {
        // Hedef çizgisi
        c.setLineDash([4, 4]); c.strokeStyle = renk('--c2'); c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(x - olcek * 1.2, h * 0.6); c.lineTo(x + olcek * 1.2, h * 0.6); c.stroke(); c.setLineDash([]);
        droneCiz(c, x, h * 0.6, s.teta, olcek, s.tauMotor / P.TAU_MAKS, s.t);
        c.fillStyle = renk('--text'); c.font = '12px system-ui, sans-serif'; c.textAlign = 'center';
        c.fillText(`${ay.ad}  (${bicim(s.teta / F.DERECE, 0)}°)`, x, h - 8);
      });
      if (MINI[anahtar].ruzgar) { c.fillStyle = renk('--c4'); c.textAlign = 'left'; c.fillText('→ sürekli rüzgâr', 8, 14); }
    });
  }

  /* ===================================================================
     12) ZIEGLER–NICHOLS YARDIMCISI
     =================================================================== */
  let znOneri = null;
  function znHesapla(Ku, Tu) {
    if (!(Ku > 0) || !(Tu > 0)) { $('znSonuc').textContent = 'Ku ve Tu sıfırdan büyük olmalı.'; return; }
    znOneri = {
      kp: sinirla(0.6 * Ku, 0, P.KP_MAKS),
      ki: sinirla(1.2 * Ku / Tu, 0, P.KI_MAKS),
      kd: sinirla(0.075 * Ku * Tu, 0, P.KD_MAKS),
    };
    $('znSonuc').innerHTML = `Öneri: <strong>Kp = ${bicim(znOneri.kp, 2)}</strong> (0,6·${bicim(Ku, 2)}), ` +
      `<strong>Ki = ${bicim(znOneri.ki, 2)}</strong> (1,2·${bicim(Ku, 2)}/${bicim(Tu, 2)}), ` +
      `<strong>Kd = ${bicim(znOneri.kd, 3)}</strong> (0,075·${bicim(Ku, 2)}·${bicim(Tu, 2)})`;
    $('znUygula').disabled = false;
  }
  $('znOlc').addEventListener('click', () => {
    $('znSonuc').textContent = 'Ölçülüyor…';
    // Arayüz donmasın diye bir sonraki karede çalıştır
    setTimeout(() => {
      const r = F.zieglerNicholsOlc();
      $('znKu').value = r.Ku.toFixed(3);
      $('znTu').value = r.Tu.toFixed(3);
      znHesapla(r.Ku, r.Tu);
      $('znSonuc').innerHTML = `Simülasyonda yalnızca P ile denedim: Ku ≈ ${bicim(r.Ku, 2)}, Tu ≈ ${bicim(r.Tu, 2)} sn bulundu.<br>` + $('znSonuc').innerHTML;
    }, 20);
  });
  $('znHesapla').addEventListener('click', () => znHesapla(Number($('znKu').value), Number($('znTu').value)));
  $('znUygula').addEventListener('click', () => {
    if (!znOneri) return;
    kazanc = Object.assign({}, znOneri);
    kazancYaz(); kazancDegisti();
    geriBildirimYaz(['Ziegler–Nichols önerisi kaydırıcılara yazıldı. Şimdi "Başlat"a bas ve nasıl davrandığını izle.']);
  });

  /* ===================================================================
     BAŞLAT
     =================================================================== */
  if (seviye.puanli && seviye.no > kayit.acik) seviye = F.SEVIYELER[1];
  kazancYaz();
  seviyeleriCiz();
  sifirla();
  window.addEventListener('resize', ciz);
  requestAnimationFrame(dongu);
})();
