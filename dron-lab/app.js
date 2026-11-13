/* =====================================================================
   DRON TASARIM LABORATUVARI — app.js (arayüz)
   ---------------------------------------------------------------------
   Görevleri:
   1) Girdi alanlarını (kaydırıcı + sayı kutusu) oluşturmak
   2) Her değişiklikte hesap.js'teki hesapla() fonksiyonunu çağırmak
   3) Sonuçları, değerlendirmeyi, grafikleri ekrana çizmek
   4) Paylaşım (URL hash), JSON indir/yükle, karşılaştırma, yazdırma
   Hesap formülleri burada DEĞİL, hesap.js içindedir.
   ===================================================================== */
'use strict';

(function () {
  const H = window.DronHesap;

  /* -------------------------------------------------------------------
     GRUPLAR: Ekrandaki girdi alanlarının listesi.
     tip 'aralik' → kaydırıcı + sayı kutusu; tip 'secim' → açılır menü.
     Yeni bir alan eklemek istersen buraya bir satır eklemen yeterli
     (ama hesap.js'te de kullanman gerekir).
     ------------------------------------------------------------------- */
  const GRUPLAR = [
    { baslik: 'Çerçeve', alanlar: [
      { id: 'cerceveSinif', tip: 'secim', etiket: 'Boyut sınıfı', secenekler: [[2, '2" (mikro)'], [3, '3"'], [5, '5"'], [7, '7"'], [10, '10"']] },
      { id: 'cerceveG', tip: 'aralik', etiket: 'Çerçeve ağırlığı', min: 5, max: 1000, adim: 1, birim: 'g' },
    ]},
    { baslik: 'Motor', alanlar: [
      { id: 'kv', tip: 'aralik', etiket: 'KV değeri', min: 200, max: 25000, adim: 50, birim: 'dev/dk/V' },
      { id: 'motorG', tip: 'aralik', etiket: 'Motor ağırlığı (tanesi)', min: 1, max: 250, adim: 1, birim: 'g' },
      { id: 'motorSayisi', tip: 'secim', etiket: 'Motor sayısı', secenekler: [[4, '4 (quad)'], [6, '6 (hexa)'], [8, '8 (okta)']] },
    ]},
    { baslik: 'Pervane', alanlar: [
      { id: 'pervaneCap', tip: 'aralik', etiket: 'Çap', min: 1, max: 15, adim: 0.1, birim: 'inç' },
      { id: 'hatve', tip: 'aralik', etiket: 'Hatve (pitch)', min: 0.5, max: 10, adim: 0.1, birim: 'inç' },
      { id: 'kanat', tip: 'secim', etiket: 'Kanat sayısı', secenekler: [[2, '2 kanat'], [3, '3 kanat']] },
    ]},
    { baslik: 'Batarya', alanlar: [
      { id: 'hucre', tip: 'secim', etiket: 'Hücre sayısı', secenekler: [2, 3, 4, 5, 6, 7, 8].map(s => [s, `${s}S (${(s * 3.7).toFixed(1)} V)`]) },
      { id: 'kapasite', tip: 'aralik', etiket: 'Kapasite', min: 100, max: 12000, adim: 50, birim: 'mAh' },
      { id: 'cDegeri', tip: 'aralik', etiket: 'C değeri', min: 5, max: 200, adim: 1, birim: 'C' },
      { id: 'bataryaG', tip: 'aralik', etiket: 'Batarya ağırlığı', min: 5, max: 2000, adim: 1, birim: 'g' },
    ]},
    { baslik: 'Diğer ağırlıklar', alanlar: [
      { id: 'fcEscG', tip: 'aralik', etiket: 'Uçuş kontrol kartı + ESC', min: 0, max: 300, adim: 1, birim: 'g' },
      { id: 'kameraG', tip: 'aralik', etiket: 'Kamera', min: 0, max: 500, adim: 1, birim: 'g' },
      { id: 'aliciG', tip: 'aralik', etiket: 'Alıcı', min: 0, max: 100, adim: 1, birim: 'g' },
      { id: 'ekYukG', tip: 'aralik', etiket: 'Ek yük', min: 0, max: 5000, adim: 5, birim: 'g' },
    ]},
    { baslik: 'Ortam', alanlar: [
      { id: 'rakim', tip: 'aralik', etiket: 'Rakım', min: 0, max: 5000, adim: 10, birim: 'm' },
      { id: 'sicaklik', tip: 'aralik', etiket: 'Sıcaklık', min: -30, max: 50, adim: 1, birim: '°C' },
    ]},
  ];
  // Tüm alanları tek listede de tutalım (id → tanım)
  const ALANLAR = {};
  GRUPLAR.forEach(g => g.alanlar.forEach(a => { ALANLAR[a.id] = a; }));

  // Şu anki tasarım (başlangıçta 5 inç yarış şablonu)
  let tasarim = Object.assign({}, H.SABLONLAR.yaris5);
  delete tasarim.ad;

  // Karşılaştırma yuvaları
  const yuvalar = { A: null, B: null };

  const $ = (id) => document.getElementById(id);

  /* ===================================================================
     1) TEMA DÜĞMESİ — açık/koyu arasında geçiş yapar, seçimi hatırlar.
     =================================================================== */
  function temaKur() {
    // Düğme ../tema.js tarafından bağlanır; tema değişince grafik renkleri yenilensin
    document.addEventListener('temadegisti', () => guncelle());
  }

  /* ===================================================================
     2) GİRDİ ALANLARINI OLUŞTUR
     Her 'aralik' alanı için: <label>, sayı kutusu, kaydırıcı.
     İkisi birbirine bağlıdır; biri değişince öteki de güncellenir.
     =================================================================== */
  function girdileriOlustur() {
    const kap = $('girdiler');
    GRUPLAR.forEach(grup => {
      const fs = document.createElement('fieldset');
      const lg = document.createElement('legend');
      lg.textContent = grup.baslik;
      fs.appendChild(lg);

      grup.alanlar.forEach(a => {
        const satir = document.createElement('div');
        satir.className = 'alan';
        if (a.tip === 'secim') {
          satir.innerHTML = `<label for="g_${a.id}">${a.etiket}</label>`;
          const sel = document.createElement('select');
          sel.id = 'g_' + a.id;
          a.secenekler.forEach(([deger, yazi]) => {
            const o = document.createElement('option');
            o.value = deger; o.textContent = yazi;
            sel.appendChild(o);
          });
          sel.addEventListener('change', () => { tasarim[a.id] = Number(sel.value); sablonuTemizle(); guncelle(); });
          satir.appendChild(sel);
        } else {
          satir.innerHTML = `
            <label for="g_${a.id}">${a.etiket}</label>
            <span class="sayi-kutu">
              <input type="number" id="g_${a.id}" min="${a.min}" max="${a.max}" step="${a.adim}" inputmode="decimal">
              <span class="birim">${a.birim}</span>
            </span>
            <input type="range" id="r_${a.id}" min="${a.min}" max="${a.max}" step="${a.adim}" aria-label="${a.etiket} (${a.birim})">`;
          const sayi = satir.querySelector('input[type=number]');
          const kayd = satir.querySelector('input[type=range]');
          // Kaydırıcı hareket edince
          kayd.addEventListener('input', () => {
            sayi.value = kayd.value;
            tasarim[a.id] = Number(kayd.value);
            kayd.setAttribute('aria-valuetext', `${kayd.value} ${a.birim}`);
            sablonuTemizle(); guncelle();
          });
          // Sayı kutusuna yazılınca (aralık dışı değerleri sınırla)
          sayi.addEventListener('change', () => {
            let v = Number(sayi.value);
            if (!isFinite(v)) v = tasarim[a.id];
            v = Math.min(a.max, Math.max(a.min, v));
            sayi.value = v; kayd.value = v;
            tasarim[a.id] = v;
            sablonuTemizle(); guncelle();
          });
        }
        fs.appendChild(satir);
      });
      kap.appendChild(fs);
    });

    // Şablon menüsünü doldur
    const sel = $('sablon');
    Object.entries(H.SABLONLAR).forEach(([anahtar, s]) => {
      const o = document.createElement('option');
      o.value = anahtar; o.textContent = s.ad;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      tasarim = Object.assign({}, H.SABLONLAR[sel.value]);
      delete tasarim.ad;
      formuDoldur();
      guncelle();
    });
  }

  function sablonuTemizle() { $('sablon').value = ''; }

  /* Tasarım nesnesindeki değerleri ekrandaki alanlara yazar. */
  function formuDoldur() {
    Object.values(ALANLAR).forEach(a => {
      const el = $('g_' + a.id);
      el.value = tasarim[a.id];
      const r = $('r_' + a.id);
      if (r) { r.value = tasarim[a.id]; r.setAttribute('aria-valuetext', `${tasarim[a.id]} ${a.birim}`); }
    });
  }

  /* Dışarıdan gelen (URL/JSON) veriyi güvenle tasarıma çevirir:
     yalnızca bilinen alanlar, yalnızca sayı, yalnızca izinli aralıkta. */
  function guvenliTasarim(ham) {
    const yeni = Object.assign({}, tasarim);
    Object.values(ALANLAR).forEach(a => {
      if (ham[a.id] === undefined) return;
      const v = Number(ham[a.id]);
      if (!isFinite(v)) return;
      if (a.tip === 'secim') {
        if (a.secenekler.some(([d]) => Number(d) === v)) yeni[a.id] = v;
      } else {
        yeni[a.id] = Math.min(a.max, Math.max(a.min, v));
      }
    });
    return yeni;
  }

  /* ===================================================================
     3) SAYI BİÇİMLENDİRME — Türkçe ondalık virgül
     =================================================================== */
  function bicim(x, basamak = 1) {
    if (!isFinite(x)) return '—';
    return x.toLocaleString('tr-TR', { minimumFractionDigits: basamak, maximumFractionDigits: basamak });
  }

  /* ===================================================================
     4) ANA GÜNCELLEME — her girdi değişikliğinde çalışır.
     =================================================================== */
  let hashZamanlayici = null;
  function guncelle() {
    const s = H.hesapla(tasarim);
    const d = H.degerlendir(tasarim, s);
    degerlendirmeCiz(d);
    ozetSeritCiz(s, d);
    sonuclariCiz(s);
    formulleriCiz(s);
    grafikleriCiz(s);
    agirlikCiz(s);
    yazdirTablosu();
    karsilastirmaCiz();
    onizlemeGuncelle(s);
    // Adres çubuğunu çok sık değiştirmemek için kısa bir gecikme
    clearTimeout(hashZamanlayici);
    hashZamanlayici = setTimeout(hashYaz, 300);
  }

  /* 3B önizleme (dron3d.js): girdilerden ölçekli model; uçamıyorsa yerde, uçuyorsa
     pervaneler hover gazıyla orantılı hızda döner. */
  let onizleme = null;
  function onizlemeGuncelle(s) {
    const tv = $('dron3b');
    if (!tv || !window.Dron3D) return;
    if (!onizleme) {
      onizleme = Dron3D.Sahne(tv, { yakinlik: 1.85 });
      const pd = $('labPatlat');
      if (pd) pd.addEventListener('click', () => {
        const acik = pd.getAttribute('aria-pressed') !== 'true';
        pd.setAttribute('aria-pressed', String(acik)); pd.textContent = acik ? 'Parçaları birleştir' : 'Parçaları ayır';
        onizleme.patlat(acik ? 1 : 0);
      });
    }
    onizleme.ayarla(Dron3D.tasarimdan(tasarim));
    // gövde tipi: tasarımın kendisinden çıkar (uçuş simülatörüyle aynı kural)
    const tipKutu = $('govdeTipi');
    if (tipKutu && Dron3D.dronTipi) {
      const c = +tasarim.pervaneCap, n = +tasarim.motorSayisi;
      const TIP = {
        agir: ['Ağır yük gövdesi', n >= 6 ? `${n} motor` : `${c}" pervane`, 'boru kollar, uzun iniş takımı, GPS'],
        whoop: ['Tiny whoop (kanallı mikro)', `${c}" pervane`, 'pervaneler halka kanal içinde; sınıfta güvenli'],
        cine: ['Cinewhoop (kanallı)', `${c}" pervane`, 'kanallı pervaneler ve üstte sinema kamerası'],
        uzun: ['Uzun menzil gövdesi', `${c}" pervane`, 'GPS direği ve uzun antenler'],
        yaris: ['Yarış (FPV) gövdesi', `${c}" pervane`, 'açık karbon gövde, aksiyon kamerası'],
      }[Dron3D.dronTipi(tasarim)];
      tipKutu.innerHTML = `<b>${TIP[0]}</b> · çünkü ${TIP[1]}: ${TIP[2]}. <a class="sime-git" href="../dron-ucus/index.html">Bu tasarımı Uçuş Simülatörü'nde uçur →</a> Orada bu tip kendi karakteriyle uçar.`;
    }
    onizleme.ucus(!!s.ucabilir);
    onizleme.hiz(s.ucabilir ? .45 + 1.4 * Math.min(1, s.hoverGaz) : .25);
  }

  function degerlendirmeCiz(d) {
    const kutu = $('degerlendirme');
    kutu.className = 'degerlendirme ' + d.sinif;
    let html = `<div class="baslik">${d.baslik}</div><p>${d.metin}</p>`;
    if (d.uyarilar.length) {
      html += '<ul class="uyari-liste">' + d.uyarilar.map(u => `<li class="${u.tur}">${u.metin}</li>`).join('') + '</ul>';
    } else {
      html += '<p class="not">Kritik bir uyarı yok.</p>';
    }
    kutu.innerHTML = html;
  }

  /* Telefon için alt özet şeridi: en önemli üç sayı + sonuçlara bağlantı */
  function ozetSeritCiz(s, d) {
    const serit = $('ozetSerit');
    serit.className = 'ozet-serit ' + d.sinif;
    serit.innerHTML = `<span>TWR ≈ <strong>${bicim(s.TWR, 1)}</strong></span>
      <span>Hover ≈ <strong>${s.ucabilir ? '%' + bicim(s.hoverGaz * 100, 0) : '—'}</strong></span>
      <span>Süre ≈ <strong>${s.ucabilir ? bicim(s.ucusDk, 1) + ' dk' : '—'}</strong></span>
      <a href="#degBaslik" tabindex="-1">Sonuçlar ↑</a>`;
  }

  /* Sonuç kartları. Her kartın yanında "yaklaşık" rozeti var. */
  function sonuclariCiz(s) {
    const kartlar = [];
    const ekle = (etiket, deger, alt, durum = '') => kartlar.push({ etiket, deger, alt, durum });

    ekle('Toplam kütle', `${bicim(s.kutle.toplam, 0)} g`, `Ağırlık W = ${bicim(s.W, 2)} N`);
    ekle('İtki/ağırlık (TWR)', bicim(s.TWR, 2), 'Tam gazda itki ÷ ağırlık',
      s.TWR < 1.2 ? 'kotu' : s.TWR < 2 || s.TWR > 8 ? 'dikkat' : 'iyi');
    ekle('Hover gazı', s.ucabilir ? `%${bicim(s.hoverGaz * 100, 0)}` : 'Uçamaz', 'Havada durmak için gereken gaz',
      !s.ucabilir || s.hoverGaz > 0.7 ? 'kotu' : s.hoverGaz > 0.55 ? 'dikkat' : 'iyi');
    ekle('Uçuş süresi (hover)', s.ucabilir ? `${bicim(s.ucusDk, 1)} dk` : '—', 'Sakin havada hover; agresif uçuşta çok daha kısa',
      !s.ucabilir || s.ucusDk < 3 ? 'kotu' : s.ucusDk < 5 ? 'dikkat' : 'iyi');
    ekle('Toplam maks. itki', `${bicim(s.Ttoplam / 9.80665 * 1000, 0)} g`, `Motor başına ${bicim(s.Tmotor / 9.80665 * 1000, 0)} g (${bicim(s.Tmotor, 1)} N)`);
    ekle('Tam gaz akımı', `${bicim(s.Imaks, 0)} A`, `Batarya sınırı ${bicim(s.Ibatarya, 0)} A · ${bicim(s.PmaksToplamEl, 0)} W`,
      s.Imaks > s.Ibatarya ? 'kotu' : s.Imaks > 0.8 * s.Ibatarya ? 'dikkat' : 'iyi');
    ekle('Hover akımı / gücü', s.ucabilir ? `${bicim(s.Ihover, 1)} A` : '—', s.ucabilir ? `${bicim(s.PelHover, 0)} W · ${bicim(s.gramPerWatt, 1)} g/W` : '');
    ekle('Maks. dikey ivme', `${bicim(s.dikeyIvme_g, 1)} g`, `${bicim(s.dikeyIvme_g * 9.80665, 1)} m/s² (yerçekimi hariç net)`);
    ekle('Çeviklik puanı', `${s.ceviklik}/100`, 'Öğretici endeks (birimsiz)');
    ekle('Motor devri (yükte)', `${bicim(s.rpm, 0)} dev/dk`, `Yükte gerilim ≈ ${bicim(s.V, 1)} V`);
    ekle('Hava yoğunluğu', `${bicim(s.rho, 3)} kg/m³`, `Basınç ${bicim(s.hava.P / 100, 0)} hPa`);
    ekle('Pervane ucu hızı', `Mach ${bicim(s.ucMach, 2)}`, `${bicim(s.ucHizi, 0)} m/s`, s.ucMach > 0.75 ? 'dikkat' : '');

    $('sonuclar').innerHTML = kartlar.map(k => `
      <div class="sonuc ${k.durum}">
        <div class="etiket">${k.etiket} <span class="yaklasik">yaklaşık</span></div>
        <div class="deger">${k.deger}</div>
        <div class="alt">${k.alt}</div>
      </div>`).join('');
  }

  /* Formülleri, içine şu anki sayıları koyarak gösterir (öğretici). */
  function formulleriCiz(s) {
    const t = tasarim;
    const satirlar = [
      `ρ = P/(R·T) = ${bicim(s.hava.P, 0)} / (287,05 · ${bicim(s.hava.T, 1)}) = ${bicim(s.rho, 3)} kg/m³`,
      `V_yük = S · (3,7 − I·R_hücre) ≈ ${t.hucre} · ${bicim(s.Vhucre, 2)} = ${bicim(s.V, 1)} V   (R_hücre ≈ ${bicim(s.Rhucre * 1000, 1)} mΩ)`,
      `RPM ≈ KV · V_yük · 0,80 = ${t.kv} · ${bicim(s.V, 1)} · 0,80 = ${bicim(s.rpm, 0)} dev/dk  →  n = ${bicim(s.n, 1)} dev/s`,
      `Ct ≈ ${bicim(s.Ct, 3)} , Cp ≈ ${bicim(s.Cp, 3)}   (hatve/çap = ${bicim(s.oran, 2)}, ${t.kanat} kanat)`,
      `T = Ct·ρ·n²·D⁴ = ${bicim(s.Ct, 3)} · ${bicim(s.rho, 3)} · ${bicim(s.n, 1)}² · ${bicim(s.D, 4)}⁴ = ${bicim(s.Tmotor, 2)} N (motor başına)`,
      `P_mil = Cp·ρ·n³·D⁵ = ${bicim(s.Pmil, 0)} W ;  P_el = P_mil/0,75 = ${bicim(s.Pel, 0)} W (motor başına)`,
      `TWR = (${t.motorSayisi} · ${bicim(s.Tmotor, 2)}) / ${bicim(s.W, 2)} = ${bicim(s.TWR, 2)}`,
      `Hover gazı ≈ √(W/T_toplam) = √(${bicim(s.W, 2)} / ${bicim(s.Ttoplam, 2)}) = ${bicim(s.hoverGaz, 2)}`,
      `t = (kapasite · 0,8) / I_hover = (${bicim(t.kapasite / 1000, 2)} Ah · 0,8) / ${bicim(s.Ihover, 2)} A = ${bicim(s.ucusDk, 1)} dk`,
      `Batarya sınırı = kapasite · C = ${bicim(t.kapasite / 1000, 2)} · ${t.cDegeri} = ${bicim(s.Ibatarya, 0)} A`,
    ];
    $('formuller').innerHTML = satirlar.map(x => `<div style="white-space:nowrap;padding:.15rem 0">${x}</div>`).join('');
  }

  /* ===================================================================
     5) GRAFİK ÇİZİMİ (Canvas 2D, kütüphanesiz)
     cizgiGrafik(canvas, ayarlar):
       ayarlar.seriler = [{ noktalar: [[x,y],...], renk }]
       ayarlar.yatay   = [{ y, renk, etiket }]   (yatay referans çizgisi)
       ayarlar.dikey   = [{ x, renk, etiket }]   (dikey referans çizgisi)
       ayarlar.xEtiket, ayarlar.yEtiket
     =================================================================== */
  function renk(degisken) {
    return getComputedStyle(document.documentElement).getPropertyValue(degisken).trim();
  }

  function cizgiGrafik(canvas, ay) {
    // Yüksek çözünürlüklü ekranlarda (retina) bulanıklığı önle
    const oran = window.devicePixelRatio || 1;
    const gen = canvas.clientWidth, yuk = canvas.clientHeight;
    if (gen === 0) return;
    canvas.width = gen * oran; canvas.height = yuk * oran;
    const c = canvas.getContext('2d');
    c.setTransform(oran, 0, 0, oran, 0, 0);
    c.clearRect(0, 0, gen, yuk);

    const kenar = { sol: 52, sag: 14, ust: 12, alt: 38 };
    const w = gen - kenar.sol - kenar.sag, h = yuk - kenar.ust - kenar.alt;

    // Eksen sınırları
    let xMin = ay.xMin ?? Infinity, xMax = ay.xMax ?? -Infinity, yMin = 0, yMax = ay.yMax ?? -Infinity;
    ay.seriler.forEach(s => s.noktalar.forEach(([x, y]) => {
      if (ay.xMin === undefined) xMin = Math.min(xMin, x);
      if (ay.xMax === undefined) xMax = Math.max(xMax, x);
      if (ay.yMax === undefined) yMax = Math.max(yMax, y);
    }));
    (ay.yatay || []).forEach(l => { yMax = Math.max(yMax, l.y * 1.1); });
    if (!isFinite(xMin) || xMax <= xMin) { xMin = 0; xMax = 1; }
    if (!isFinite(yMax) || yMax <= 0) yMax = 1;
    yMax = guzelUst(yMax);
    if (ay.xMax === undefined) xMax = guzelUst(xMax);   // eksen sonunu yuvarlak sayıya çek

    const px = x => kenar.sol + (x - xMin) / (xMax - xMin) * w;
    const py = y => kenar.ust + h - (y - yMin) / (yMax - yMin) * h;

    // Izgara ve eksen yazıları
    c.font = '12px system-ui, sans-serif';
    c.fillStyle = renk('--muted');
    c.strokeStyle = renk('--grid');
    c.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const yv = yMin + (yMax - yMin) * i / 5;
      const yy = py(yv);
      c.beginPath(); c.moveTo(kenar.sol, yy); c.lineTo(kenar.sol + w, yy); c.stroke();
      c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText(kisaSayi(yv), kenar.sol - 6, yy);
    }
    for (let i = 0; i <= 5; i++) {
      const xv = xMin + (xMax - xMin) * i / 5;
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(kisaSayi(xv), px(xv), kenar.ust + h + 6);
    }
    c.textAlign = 'center';
    c.fillText(ay.xEtiket || '', kenar.sol + w / 2, yuk - 14);
    c.save(); c.translate(12, kenar.ust + h / 2); c.rotate(-Math.PI / 2);
    c.fillText(ay.yEtiket || '', 0, 0); c.restore();

    // Referans çizgileri
    c.setLineDash([6, 4]); c.lineWidth = 2;
    (ay.yatay || []).forEach(l => {
      c.strokeStyle = l.renk; c.beginPath(); c.moveTo(kenar.sol, py(l.y)); c.lineTo(kenar.sol + w, py(l.y)); c.stroke();
    });
    (ay.dikey || []).forEach(l => {
      if (l.x < xMin || l.x > xMax) return;
      c.strokeStyle = l.renk; c.beginPath(); c.moveTo(px(l.x), kenar.ust); c.lineTo(px(l.x), kenar.ust + h); c.stroke();
    });
    c.setLineDash([]);

    // Seriler
    c.lineWidth = 2.5;
    ay.seriler.forEach(s => {
      c.strokeStyle = s.renk; c.beginPath();
      s.noktalar.forEach(([x, y], i) => { i ? c.lineTo(px(x), py(y)) : c.moveTo(px(x), py(y)); });
      c.stroke();
    });

    // İşaret noktaları (ör. hover noktası)
    (ay.noktalar || []).forEach(n => {
      c.fillStyle = n.renk; c.beginPath(); c.arc(px(n.x), py(n.y), 5, 0, Math.PI * 2); c.fill();
      if (n.etiket) { c.textAlign = 'left'; c.textBaseline = 'bottom'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = renk('--panel-2'); c.strokeText(n.etiket, px(n.x) + 10, py(n.y) - 16); c.fillStyle = renk('--text'); c.fillText(n.etiket, px(n.x) + 10, py(n.y) - 16); }
    });
  }
  // Eksen üst sınırını 1, 2, 2.5, 5, 10 gibi okunaklı bir sayıya yuvarlar.
  function guzelUst(v) {
    const us = Math.pow(10, Math.floor(Math.log10(v)));
    for (const k of [1, 2, 2.5, 5, 10]) if (k * us >= v) return k * us;
    return 10 * us;
  }
  function kisaSayi(v) { return Math.abs(v) >= 1000 ? (v / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + 'k' : v.toLocaleString('tr-TR', { maximumFractionDigits: 1 }); }

  function grafikleriCiz(s) {
    const agirlikG = s.kutle.toplam;
    cizgiGrafik($('itkiGrafik'), {
      seriler: [{ noktalar: H.itkiEgrisi(s), renk: renk('--c1') }],
      yatay: [{ y: agirlikG, renk: renk('--c2') }],
      noktalar: s.ucabilir ? [{ x: s.hoverGaz * 100, y: agirlikG, renk: renk('--c2'), etiket: `Hover ≈ %${Math.round(s.hoverGaz * 100)}` }] : [],
      xMin: 0, xMax: 100, xEtiket: 'Gaz (%)', yEtiket: 'İtki (g)',
    });
    const egri = H.ucusSuresiEgrisi(tasarim);
    cizgiGrafik($('sureGrafik'), {
      seriler: [{ noktalar: egri, renk: renk('--c3') }],
      dikey: [{ x: tasarim.ekYukG, renk: renk('--c2') }],
      xMin: 0, xEtiket: 'Ek yük (g)', yEtiket: 'Süre (dk)',
    });
  }

  /* Ağırlık dağılımı çubuğu */
  function agirlikCiz(s) {
    const k = s.kutle;
    const parcalar = [
      ['Çerçeve', k.cerceve, '--c1'], ['Motorlar', k.motorlar, '--c2'],
      ['Batarya', k.batarya, '--c3'], ['Elektronik', k.elektronik, '--c4'], ['Ek yük', k.ekYuk, '--muted'],
    ].filter(p => p[1] > 0);
    $('agirlikBar').innerHTML = parcalar.map(([ad, g, r]) => {
      const yuzde = g / k.toplam * 100;
      return `<div style="width:${yuzde}%;background:var(${r})${r === '--c2' || r === '--c3' ? ';color:#111b1c' : ''}" title="${ad}: ${g} g">${yuzde > 9 ? Math.round(yuzde) + '%' : ''}</div>`;
    }).join('');
    $('agirlikBar').setAttribute('aria-label', 'Ağırlık dağılımı: ' + parcalar.map(([ad, g]) => `${ad} ${Math.round(g / k.toplam * 100)}%`).join(', '));
    $('agirlikLejant').innerHTML = parcalar.map(([ad, g, r]) => `<span style="--renk:var(${r})">${ad}: ${bicim(g, 0)} g (%${bicim(g / k.toplam * 100, 0)})</span>`).join('');
  }

  /* ===================================================================
     6) PAYLAŞIM: URL hash (#kv=1950&...)
     Adres çubuğundaki "#" sonrası sunucuya gönderilmez; tamamen tarayıcıda kalır.
     =================================================================== */
  function hashYaz() {
    const p = new URLSearchParams();
    Object.keys(ALANLAR).forEach(k => p.set(k, tasarim[k]));
    history.replaceState(null, '', '#' + p.toString());   // geçmişi doldurmadan güncelle
  }
  function hashOku() {
    if (location.hash.length < 2) return false;
    const p = new URLSearchParams(location.hash.slice(1));
    const ham = {};
    p.forEach((v, k) => { ham[k] = v; });
    tasarim = guvenliTasarim(ham);
    return true;
  }
  function durum(mesaj) { $('paylasDurum').textContent = mesaj; }

  function paylasimKur() {
    $('linkKopyala').addEventListener('click', async () => {
      hashYaz();
      try {
        await navigator.clipboard.writeText(location.href);
        durum('Bağlantı kopyalandı. Bu bağlantıyı açan kişi aynı tasarımı görür.');
      } catch (e) {
        // Bazı tarayıcılar (özellikle dosyadan açınca) panoya izin vermez
        window.prompt('Bağlantıyı kopyala:', location.href);
      }
    });

    // JSON indir: tasarımı bir dosya olarak bilgisayara kaydeder
    $('jsonIndir').addEventListener('click', () => {
      const veri = { arac: 'dron-tasarim-lab', surum: 1, tarih: new Date().toISOString(), tasarim };
      const blob = new Blob([JSON.stringify(veri, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'dron-tasarimi.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      durum('JSON dosyası indirildi.');
    });

    // JSON yükle: kullanıcının seçtiği dosyayı okur
    $('jsonYukleDugme').addEventListener('click', () => $('jsonDosya').click());
    $('jsonDosya').addEventListener('change', (olay) => {
      const dosya = olay.target.files[0];
      if (!dosya) return;
      const okuyucu = new FileReader();
      okuyucu.onload = () => {
        try {
          const veri = JSON.parse(okuyucu.result);
          tasarim = guvenliTasarim(veri.tasarim || veri);
          sablonuTemizle(); formuDoldur(); guncelle();
          durum(`"${dosya.name}" yüklendi.`);
        } catch (e) {
          durum('Dosya okunamadı: geçerli bir JSON değil.');
        }
      };
      okuyucu.readAsText(dosya);
      olay.target.value = '';
    });

    $('yazdir').addEventListener('click', () => window.print());

    // Karşılaştırma yuvaları
    $('slotA').addEventListener('click', () => { yuvalar.A = Object.assign({}, tasarim); karsilastirmaCiz(); durum('Tasarım A yuvasına kondu.'); });
    $('slotB').addEventListener('click', () => { yuvalar.B = Object.assign({}, tasarim); karsilastirmaCiz(); durum('Tasarım B yuvasına kondu.'); });
    $('yukleA').addEventListener('click', () => { if (yuvalar.A) { tasarim = Object.assign({}, yuvalar.A); sablonuTemizle(); formuDoldur(); guncelle(); } });
    $('yukleB').addEventListener('click', () => { if (yuvalar.B) { tasarim = Object.assign({}, yuvalar.B); sablonuTemizle(); formuDoldur(); guncelle(); } });
  }

  /* ===================================================================
     7) KARŞILAŞTIRMA TABLOSU
     =================================================================== */
  function karsilastirmaCiz() {
    const kart = $('karsilastirKart');
    if (!yuvalar.A && !yuvalar.B) { kart.hidden = true; return; }
    kart.hidden = false;
    const sA = yuvalar.A ? H.hesapla(yuvalar.A) : null;
    const sB = yuvalar.B ? H.hesapla(yuvalar.B) : null;
    const satirlar = [
      ['Pervane', t => `${t.pervaneCap}×${t.hatve}×${t.kanat}`, null],
      ['Batarya', t => `${t.hucre}S ${t.kapasite} mAh ${t.cDegeri}C`, null],
      ['KV', t => t.kv, null],
      ['Toplam kütle (g)', null, s => bicim(s.kutle.toplam, 0)],
      ['TWR', null, s => bicim(s.TWR, 2)],
      ['Hover gazı (%)', null, s => s.ucabilir ? bicim(s.hoverGaz * 100, 0) : 'Uçamaz'],
      ['Uçuş süresi (dk)', null, s => s.ucabilir ? bicim(s.ucusDk, 1) : '—'],
      ['Tam gaz akımı (A)', null, s => bicim(s.Imaks, 0)],
      ['Batarya sınırı (A)', null, s => bicim(s.Ibatarya, 0)],
      ['Maks. itki (g)', null, s => bicim(s.Ttoplam / 9.80665 * 1000, 0)],
      ['Çeviklik', null, s => s.ceviklik],
      ['Değerlendirme', null, (s, t) => H.degerlendir(t, s).baslik],
    ];
    const hucre = (t, s, f, g) => t ? (f ? f(t) : g(s, t)) : '<span class="not">boş</span>';
    $('karsilastirTablo').innerHTML =
      '<thead><tr><th>Özellik <span class="yaklasik">yaklaşık</span></th><th>A</th><th>B</th></tr></thead><tbody>' +
      satirlar.map(([ad, f, g]) => `<tr><th scope="row">${ad}</th><td>${hucre(yuvalar.A, sA, f, g)}</td><td>${hucre(yuvalar.B, sB, f, g)}</td></tr>`).join('') +
      '</tbody>';
  }

  /* Yazdırma için girdi tablosu */
  function yazdirTablosu() {
    $('yazdirGirdiler').innerHTML = Object.values(ALANLAR).map(a => {
      let deger = tasarim[a.id];
      if (a.tip === 'secim') { const s = a.secenekler.find(([d]) => Number(d) === deger); deger = s ? s[1] : deger; }
      else deger = `${deger} ${a.birim}`;
      return `<tr><th scope="row">${a.etiket}</th><td>${deger}</td></tr>`;
    }).join('');
  }

  /* ===================================================================
     BAŞLAT
     =================================================================== */
  temaKur();
  girdileriOlustur();
  paylasimKur();
  if (!hashOku()) $('sablon').value = 'yaris5';
  formuDoldur();
  guncelle();
  // Pencere boyutu değişince grafikleri yeniden çiz
  let boyutZaman = null;
  window.addEventListener('resize', () => { clearTimeout(boyutZaman); boyutZaman = setTimeout(guncelle, 150); });
  // Yazdırmadan önce "Varsayımlar ve sınırlar" bölümünü aç, sonra grafiklerin boyutunu yenile
  window.addEventListener('beforeprint', () => { document.querySelectorAll('details.varsayim').forEach(d => { d.open = true; }); });
  // Başka biri bağlantıyı yapıştırıp aynı sekmede açarsa
  window.addEventListener('hashchange', () => { if (hashOku()) { formuDoldur(); guncelle(); } });
})();
