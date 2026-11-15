/* =====================================================================
   OKUL: Kahramankazan BİLSEM — içine girilebilen bina
   Öğretmen önerisi (Kasım 2026): "okul binasına içeri girilebilsin; sınıflar
   atölye olsun; müdür odası, öğretmenler odası olsun; akıllı tahtalar, sıralar…
   öğrenci içeri girdiğinde okul hissi olsun."

   Dış ölçüler eski binayla aynı (30 m × 12 m, 3 kat, çatı 9,6 m): çatı pisti,
   güneş panelleri, tabela, saçak, bayrak ve çatıya kargo görevi değişmez.
   Kat yüksekliği 3 m. Ön cephe (+z) bahçeye bakar; orta koridor x boyunca uzanır;
   koridorun doğu ucunda katları bağlayan merdiven boşluğu vardır.

   Zemin : Müdür Odası · Müdür Yardımcısı · Giriş Holü · Öğretmenler Odası
           Zekâ Oyunları Atölyesi · Kütüphane · Kantin
   1. kat: Matematik · Fen Bilimleri · Bilişim · Yapay Zekâ · Dron ve Robotik · Rehberlik
   2. kat: İngilizce · Türk Dili ve Edebiyatı · Görsel Sanatlar · Müzik · Proje (TÜBİTAK) · Toplantı Salonu

   Kapalı pencerelerde cam vardır (çarpılır). Turuncu çerçeveli pencereler AÇIK.
   Bütün duvar, döşeme, cam ve mobilya KUTULAR'a eklenir: çarpılır, üstlerine inilir.
   Duvarların adı 'duvar' (saklanma yeri üretici onları ev sanmasın).
   ===================================================================== */
(function () {
  'use strict';
  const O = {};
  const X0 = -53, X1 = -23, Z0 = -36, Z1 = -24, T = 0.3, ti = 0.12, FH = 3, KAT = 3;
  const CZ0 = -31.2, CZ1 = -28.8;                 // koridor
  const MX0 = X1 - 3.4;                            // merdiven boşluğu (koridorun doğu ucu)
  const taban = (k) => k * FH;                     // k. katın döşeme üstü (zemin 0)

  const ODALAR = [
    // [kat, taraf ('on' = bahçe tarafı, 'arka'), x0, x1, ad, tür]
    [0, 'on', X0, -47.5, 'Müdür Odası', 'mudur'], [0, 'on', -47.5, -42, 'Müdür Yardımcısı', 'mudyrd'], [0, 'on', -42, -34, 'Giriş Holü', 'hol'], [0, 'on', -34, X1, 'Öğretmenler Odası', 'ogretmen'],
    [0, 'arka', X0, -44, 'Zekâ Oyunları Atölyesi', 'zeka'], [0, 'arka', -44, -35, 'Kütüphane', 'kutuphane'], [0, 'arka', -35, X1, 'Kantin', 'kantin'],
    [1, 'on', X0, -43, 'Matematik Atölyesi', 'mat'], [1, 'on', -43, -33, 'Fen Bilimleri Atölyesi', 'fen'], [1, 'on', -33, X1, 'Bilişim Atölyesi', 'bilisim'],
    [1, 'arka', X0, -43, 'Yapay Zekâ Atölyesi', 'yz'], [1, 'arka', -43, -33, 'Dron ve Robotik Atölyesi', 'dron'], [1, 'arka', -33, X1, 'Rehberlik Servisi', 'rehber'],
    [2, 'on', X0, -43, 'İngilizce Atölyesi', 'ing'], [2, 'on', -43, -33, 'Türk Dili ve Edebiyatı Atölyesi', 'edb'], [2, 'on', -33, X1, 'Görsel Sanatlar Atölyesi', 'sanat'],
    [2, 'arka', X0, -43, 'Müzik Atölyesi', 'muzik'], [2, 'arka', -43, -33, 'Proje Atölyesi (TÜBİTAK)', 'proje'], [2, 'arka', -33, X1, 'Toplantı Salonu', 'toplanti'],
  ].map(([k, taraf, x0, x1, ad, tur]) => ({ k, taraf, x0: x0 + (x0 === X0 ? T : 0), x1: x1 - (x1 === X1 ? T : 0), z0: taraf === 'on' ? CZ1 + ti : Z0 + T, z1: taraf === 'on' ? Z1 - T : CZ0 - ti, ad, tur, y: taban(k) }));
  O.odalar = ODALAR;
  // açık pencereler: [cephe, kat, bölme]  (ön/arka cephe 10 bölme × 3 m, yan cepheler 4 bölme × 3 m)
  const ACIK = { 'on:1:1': 1, 'on:2:8': 1, 'arka:0:2': 1, 'dogu:1:1': 1, 'arka:2:5': 1 };

  O.icMekan = (p) => p.x > X0 + 0.25 && p.x < X1 - 0.25 && p.z > Z0 + 0.25 && p.z < Z1 - 0.25 && p.y < 9;

  O.yap = function (grup) {
    const B = SEHIR.Birlesik, doku = SEHIR.doku;
    const bm = () => new B();
    const dis = bm(), ic = bm(), dos = bm(), tav = bm(), camB = bm(), cer = bm(), bant = bm(), ahsap = bm(), metal = bm(), beyaz = bm(), koyu = bm(), mavi = bm(), kirmizi = bm(), yesil = bm(), ekran = bm(), lambaB = bm(), sari = bm();
    const kutu = (Bx, x0, x1, y0, y1, z0, z1, ad) => {
      if (x1 - x0 < 0.005 || y1 - y0 < 0.005 || z1 - z0 < 0.005) return;
      Bx.kutuYan((x0 + x1) / 2, (z0 + z1) / 2, y0, x1 - x0, y1 - y0, z1 - z0, 2, 2);
      Bx.ust(x0, x1, z0, z1, y1, 2, 2);
      (Bx === dos ? tav : Bx).dortgen([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1]);
      if (ad) KUTULAR.push({ x0, x1, z0, z1, y0, ust: y1, ad });
    };
    O.acikPencereler = [];

    /* ---------- dış duvarlar: gerçek pencere boşlukları ---------- */
    const PW = 1.6, ES = 0.9, PY = 1.5;   // pencere genişliği, denizlik, pencere yüksekliği
    const cephe = (ad, k) => {
      const uzun = ad === 'on' || ad === 'arka', n = uzun ? 10 : 4, L = uzun ? 30 : 12, bw = L / n;
      const y0 = taban(k), yU = taban(k + 1) - (k === KAT - 1 ? 0 : 0.25), yT = y0;
      const P = (a0, a1, b0, b1, ya, yb, Bx, isim) => {
        if (uzun) { const zb = ad === 'arka' ? Z0 : Z1 - T; kutu(Bx, X0 + a0, X0 + a1, ya, yb, zb + b0, zb + b1, isim); }
        else { const xb = ad === 'bati' ? X0 : X1 - T; kutu(Bx, xb + b0, xb + b1, ya, yb, Z0 + a0, Z0 + a1, isim); }
      };
      let a = 0;
      for (let i = 0; i < n; i++) {
        const kapi = ad === 'on' && k === 0 && (i === 4 || i === 5), tabelaArka = ad === 'on' && k === 1 && i >= 3 && i <= 6;
        if (tabelaArka) continue;
        if (kapi && i === 5) continue;   // çift kanatlı giriş: 4. ve 5. bölmeyi birlikte açar
        const w0 = kapi ? i * bw + 1.4 : i * bw + (bw - PW) / 2, w1 = kapi ? (i + 1) * bw + 1.6 : w0 + PW;
        const esik = kapi ? yT : yT + ES, ust = kapi ? yT + 2.6 : yT + ES + PY, acik = ACIK[`${ad}:${k}:${i}`];
        P(a, w0, 0, T, y0, yU, dis, 'duvar');
        if (!kapi) P(w0, w1, 0, T, y0, esik, dis, 'duvar');
        P(w0, w1, 0, T, ust, yU, dis, 'duvar');
        P(w0 - 0.08, w1 + 0.08, -0.08, 0, esik - 0.06, esik, beyaz);   // denizlik (dışta)
        if (!acik && !kapi) {
          P(w0, w1, T / 2 - 0.03, T / 2 + 0.03, esik, ust, camB, 'cam');
          P((w0 + w1) / 2 - 0.03, (w0 + w1) / 2 + 0.03, T / 2 - 0.05, T / 2 + 0.05, esik, ust, beyaz);   // kayıt
        } else {
          const c = 0.07, Bc = kapi ? koyu : cer;
          P(w0, w1, -0.04, T + 0.04, ust - c, ust, Bc); P(w0, w0 + c, -0.04, T + 0.04, esik, ust, Bc); P(w1 - c, w1, -0.04, T + 0.04, esik, ust, Bc);
          if (!kapi) P(w0, w1, -0.04, T + 0.04, esik, esik + c, Bc);
          O.acikPencereler.push({ ad, k, i, kapi });
        }
        a = w1;
      }
      P(a, L, 0, T, y0, yU, dis, 'duvar');
      if (k) P(-0.05, L + 0.05, -0.06, 0, y0 - 0.12, y0 + 0.06, bant);   // kat silmesi (kiremit rengi)
      if (k === 0) P(-0.05, L + 0.05, -0.04, 0, 0, 0.6, koyu);           // zemin kaidesi
    };
    for (let k = 0; k < KAT; k++) for (const ad of ['on', 'arka', 'bati', 'dogu']) cephe(ad, k);
    // (tabelanın arkası: 1. kat ön cephenin ortası pencere bırakılmadan dolu örülür; yukarıdaki döngü atlar)

    /* ---------- döşemeler (merdiven boşluğu doğu uçta) ---------- */
    KUTULAR.push({ x0: X0 + T, x1: X1 - T, z0: Z0 + T, z1: Z1 - T, y0: -0.05, ust: 0.02, ad: 'duvar' });
    for (let k = 1; k < KAT; k++) {
      const y1 = taban(k), y0 = y1 - 0.25;
      kutu(dos, X0 + T, X1 - T, y0, y1, Z0 + T, CZ0, 'duvar'); kutu(dos, X0 + T, X1 - T, y0, y1, CZ1, Z1 - T, 'duvar'); kutu(dos, X0 + T, MX0, y0, y1, CZ0, CZ1, 'duvar');
    }
    tav.dortgen([X0 + T, 8.98, Z0 + T], [X1 - T, 8.98, Z0 + T], [X1 - T, 8.98, Z1 - T], [X0 + T, 8.98, Z1 - T], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1]);   // çatı döşemesinin altı
    for (let k = 0; k < KAT; k++) {   // döşeme kaplaması
      const y = taban(k) + 0.03;
      if (k === 0) dos.ust(X0 + T, X1 - T, Z0 + T, Z1 - T, y, 3, 3);
      else { dos.ust(X0 + T, X1 - T, Z0 + T, CZ0, y, 3, 3); dos.ust(X0 + T, X1 - T, CZ1, Z1 - T, y, 3, 3); dos.ust(X0 + T, MX0, CZ0, CZ1, y, 3, 3); }
    }
    // merdiven basamakları (yalnız görünüş)
    for (let k = 0; k < KAT - 1; k++) for (let s = 0; s < 16; s++) { const y = taban(k) + (s + 1) * FH / 17, x = MX0 + 0.15 + (s / 15) * 2.9; kutu(koyu, x, x + 0.2, y - 0.1, y, CZ0 + 0.1, -30.05); }
    kutu(metal, MX0, X1 - T, 0, 9, -30.05, -29.95);   // merdiven ortası perde (ince)

    /* ---------- iç duvarlar: koridor duvarları (kapılı), oda ara duvarları ---------- */
    const kapilar = [];
    for (let k = 0; k < KAT; k++) {
      const y0 = taban(k), y1 = taban(k + 1) - 0.25;
      for (const taraf of ['on', 'arka']) {
        const zw = taraf === 'on' ? CZ1 : CZ0 - ti, odalar = ODALAR.filter((o) => o.k === k && o.taraf === taraf);
        let a = X0 + T;
        for (const o of odalar) {
          if (o.tur === 'hol') { kutu(ic, a, o.x0, y0, y1, zw, zw + ti, 'duvar'); kutu(ic, o.x0, o.x1, y1 - 0.5, y1, zw, zw + ti, 'duvar'); a = o.x1; continue; }
          const d1 = Math.min(o.x1, MX0) - 0.7, d0 = d1 - 1.1;     // kapı odanın doğu ucunda (merdivene taşmaz)
          kutu(ic, a, d0, y0, y1, zw, zw + ti, 'duvar'); kutu(ic, d0, d1, y0 + 2.2, y1, zw, zw + ti, 'duvar');
          kutu(ahsap, d1 - 0.04, d1 + 0.02, y0, y0 + 2.2, taraf === 'on' ? zw + ti : zw - 0.9, taraf === 'on' ? zw + ti + 0.9 : zw);   // açık kapı kanadı
          a = d1; o.kapi = { x: (d0 + d1) / 2, z: zw + ti / 2 };
          kapilar.push(o);
        }
        kutu(ic, a, MX0, y0, y1, zw, zw + ti, 'duvar');
        if (taraf === 'on' || k > 0) kutu(ic, MX0, X1 - T, y0, y1, zw, zw + ti, 'duvar');
        for (let j = 1; j < odalar.length; j++) kutu(ic, odalar[j].x0 - ti / 2, odalar[j].x0 + ti / 2, y0, y1, odalar[j].z0, odalar[j].z1, 'duvar');
      }
    }

    /* ---------- tahta ve poster dokuları ---------- */
    const tahtaDoku = (tur, ad) => doku(512, 288, (x, w, h) => {
      x.fillStyle = '#0f2a3a'; x.fillRect(0, 0, w, h);
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#16405a'); g.addColorStop(1, '#0b1d2a'); x.fillStyle = g; x.fillRect(8, 8, w - 16, h - 16);
      x.fillStyle = '#ffffff'; x.font = '700 26px Onest, Arial'; x.textAlign = 'left'; x.fillText(ad, 26, 46);
      x.font = '500 22px Onest, Arial'; x.fillStyle = '#cfe6ff';
      const yaz = (s, i) => x.fillText(s, 30, 92 + i * 34);
      const icerik = {
        mat: ['a² + b² = c²', 'π ≈ 3,14159…', 'f(x) = 2x + 3', 'Asal: 2, 3, 5, 7, 11, 13…'],
        fen: ['Newton: F = m · a', 'H₂O → su molekülü', 'Işık hızı ≈ 300.000 km/s', 'Deney: hipotez → gözlem → sonuç'],
        bilisim: ['for (i = 0; i < 10; i++) {', '   dron.kalk();', '}', 'Algoritma = adım adım çözüm'],
        yz: ['Yapay sinir ağı', 'girdi → gizli katman → çıktı', 'Veri + model = tahmin', 'Etik: adil, güvenli, açık'],
        dron: ['İtki / ağırlık > 1', 'Hover gazı ≈ √(W / T)', 'PID: Kp · Ki · Kd', 'Uçuştan önce kontrol listesi!'],
        zeka: ['Bugünün turnuvası: 14.00', 'Satranç · Go · Mangala · Hex', 'Strateji = ileriyi görmek', 'Kazanmak kadar öğrenmek'],
        ing: ['Hello! How are you today?', 'I fly a drone every weekend.', 'Present Simple: I / you / we fly', 'New words: wing, battery, sky'],
        edb: ['Türk Dili ve Edebiyatı', 'Halk · Divan · Tanzimat · Cumhuriyet', 'Bugün: şiirde ölçü ve uyak', 'Ödev: bir anı yaz'],
        sanat: ['Renk çemberi', 'ana renkler: kırmızı, sarı, mavi', 'perspektif: kaçış noktası', 'Sergi: Cuma'],
        muzik: ['Do Re Mi Fa Sol La Si', '4/4 ölçü', 'Koro çalışması: Salı', 'Ritim = matematik'],
        proje: ['TÜBİTAK 2204 takvimi', '1) Problem  2) Hipotez', '3) Yöntem  4) Veri  5) Sonuç', 'Rapor teslimi yaklaşıyor!'],
        toplanti: ['Zümre toplantısı', 'Gündem: dönem planı', 'Proje danışmanlığı', 'Veli toplantısı tarihi'],
      }[tur] || ['Hoş geldiniz'];
      icerik.forEach(yaz);
      if (tur === 'mat') { x.strokeStyle = '#ffd23f'; x.lineWidth = 3; x.beginPath(); x.moveTo(380, 240); x.lineTo(480, 240); x.lineTo(380, 120); x.closePath(); x.stroke(); x.fillStyle = '#ffd23f'; x.fillText('c', 440, 175); }
      if (tur === 'yz') { x.fillStyle = '#7fd1ff'; for (const [cx, cy] of [[380, 110], [380, 170], [380, 230], [440, 140], [440, 200], [495, 170]]) { x.beginPath(); x.arc(cx, cy, 9, 0, 7); x.fill(); } x.strokeStyle = 'rgba(127,209,255,.5)'; x.lineWidth = 1.5; for (const a of [110, 170, 230]) for (const b of [140, 200]) { x.beginPath(); x.moveTo(380, a); x.lineTo(440, b); x.stroke(); } for (const b of [140, 200]) { x.beginPath(); x.moveTo(440, b); x.lineTo(495, 170); x.stroke(); } }
      if (tur === 'zeka') { for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { x.fillStyle = (i + j) % 2 ? '#e9d6b5' : '#7a4f2a'; x.fillRect(380 + i * 18, 110 + j * 18, 18, 18); } }
    });
    const posterDoku = (renk, baslik, alt) => doku(192, 256, (x, w, h) => {
      x.fillStyle = renk; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(10, 10, w - 20, h - 20);
      x.fillStyle = renk; x.font = '800 22px Onest, Arial'; x.textAlign = 'center'; x.fillText(baslik, w / 2, 48);
      x.font = '500 15px Onest, Arial'; x.fillStyle = '#2a2f36'; alt.forEach((s, i) => x.fillText(s, w / 2, 90 + i * 26));
    });
    const tahtalar = [], posterler = [], oyunTahtasi = bm();
    const tahtaKoy = (o, tur, ad) => {   // akıllı tahta: odanın batı duvarında, doğuya bakar
      const cz = (o.z0 + o.z1) / 2, y = o.y + 1.0, x = o.x0 + 0.02 + ti / 2;
      kutu(koyu, x - 0.02, x + 0.06, y - 0.05, y + 1.3, cz - 1.15, cz + 1.15);           // çerçeve
      tahtalar.push({ tur, ad, x: x + 0.065, y0: y + 0.01, y1: y + 1.23, z0: cz - 1.1, z1: cz + 1.1 });   // sonra tek atlasta çizilir
      kutu(metal, x, x + 0.25, y - 0.12, y - 0.06, cz - 1.0, cz + 1.0);               // kalem altlığı
    };
    const posterKoy = (o, renk, baslik, alt, kaydir) => {   // koridor tarafı iç duvara poster
      const zw = o.taraf === 'on' ? o.z0 + 0.01 : o.z1 - 0.01, x = o.x0 + 1.2 + (kaydir || 0), y = o.y + 1.3;
      posterler.push({ renk, baslik, alt, x, y, zw, on: o.taraf === 'on' });
    };

    /* ---------- mobilya ---------- */
    const sira = (x, z, y, yon) => {   // ikili öğrenci sırası (tahtaya bakar) + iki sandalye
      kutu(ahsap, x - 0.25, x + 0.25, y + 0.7, y + 0.75, z - 0.6, z + 0.6, 'mobilya');
      kutu(metal, x - 0.23, x + 0.23, y, y + 0.7, z - 0.58, z - 0.54); kutu(metal, x - 0.23, x + 0.23, y, y + 0.7, z + 0.54, z + 0.58);
      for (const dz of [-0.3, 0.3]) { kutu(mavi, x + 0.38, x + 0.76, y + 0.42, y + 0.47, z + dz - 0.2, z + dz + 0.2); kutu(mavi, x + 0.72, x + 0.76, y + 0.47, y + 0.9, z + dz - 0.2, z + dz + 0.2); }
    };
    const masa = (x0, x1, z0, z1, y, h, Bx) => kutu(Bx || ahsap, x0, x1, y + h - 0.05, y + h, z0, z1, 'mobilya') || kutu(metal, x0 + 0.05, x1 - 0.05, y, y + h - 0.05, (z0 + z1) / 2 - 0.03, (z0 + z1) / 2 + 0.03);
    const raf = (x0, x1, z0, z1, y, h) => { kutu(ahsap, x0, x1, y, y + h, z0, z1, 'mobilya'); for (let r = 0.4; r < h; r += 0.42) { const s = (r * 7) % 3; kutu([kirmizi, mavi, yesil, sari][Math.floor(s)], x0 + 0.02, x1 - 0.02, y + r - 0.32, y + r - 0.02, z0 - 0.01, z1 + 0.01); } };
    const bilgisayar = (x, z, y, yon) => { kutu(koyu, x - 0.03, x + 0.03, y + 0.78, y + 1.1, z - 0.25, z + 0.25); kutu(ekran, x + yon * 0.035, x + yon * 0.04, y + 0.8, y + 1.08, z - 0.23, z + 0.23); kutu(koyu, x - 0.1, x + 0.1, y + 0.75, y + 0.78, z - 0.08, z + 0.08); };

    for (const o of ODALAR) {
      const y = o.y, cz = (o.z0 + o.z1) / 2, W = o.x1 - o.x0, D = o.z1 - o.z0;
      const atolye = ['mat', 'fen', 'bilisim', 'yz', 'dron', 'zeka', 'ing', 'edb', 'sanat', 'muzik', 'proje'].includes(o.tur);
      if (atolye || o.tur === 'toplanti') tahtaKoy(o, o.tur, o.ad);
      if (atolye) masa(o.x0 + 0.9, o.x0 + 2.1, cz + 0.9, cz + 1.6, y, 0.76);   // öğretmen masası
      if (['mat', 'ing', 'edb', 'yz'].includes(o.tur)) {
        for (let xx = o.x0 + 3.2; xx < o.x1 - 0.9; xx += 1.65) for (const dz of [-1.05, 1.05]) sira(xx, cz + dz, y);
      }
      if (o.tur === 'yz') for (let xx = o.x0 + 3; xx < o.x1 - 0.6; xx += 1.3) { const zz = o.taraf === 'on' ? o.z1 - 0.45 : o.z0 + 0.45; masa(xx - 0.55, xx + 0.55, zz - 0.35, zz + 0.35, y, 0.75); }
      if (o.tur === 'bilisim') {
        for (const zz of [o.z0 + 0.45, o.z1 - 0.45]) {
          masa(o.x0 + 2.6, o.x1 - 0.5, zz - 0.35, zz + 0.35, y, 0.75);
          for (let xx = o.x0 + 3.1; xx < o.x1 - 0.8; xx += 1.2) bilgisayar(xx, zz + (zz < cz ? -0.12 : 0.12), y, zz < cz ? 1 : -1);
        }
        masa(o.x0 + 3.5, o.x1 - 2, cz - 0.4, cz + 0.4, y, 0.75);
      }
      if (o.tur === 'fen') {
        for (const dz of [-1.0, 1.0]) { kutu(beyaz, o.x0 + 3, o.x1 - 1, y, y + 0.9, cz + dz - 0.45, cz + dz + 0.45, 'mobilya'); kutu(koyu, o.x0 + 3, o.x1 - 1, y + 0.9, y + 0.93, cz + dz - 0.45, cz + dz + 0.45); for (let xx = o.x0 + 4; xx < o.x1 - 1.5; xx += 2) kutu(metal, xx, xx + 0.04, y + 0.93, y + 1.25, cz + dz - 0.02, cz + dz + 0.02); }
        raf(o.x1 - 0.5, o.x1 - 0.1, o.z0 + 0.2, o.z0 + 1.6, y, 1.8);
      }
      if (o.tur === 'dron') {
        kutu(ahsap, o.x0 + 3, o.x1 - 1, y + 0.85, y + 0.9, cz - 0.6, cz + 0.6, 'mobilya'); kutu(metal, o.x0 + 3.1, o.x1 - 1.1, y, y + 0.85, cz - 0.05, cz + 0.05);
        for (let xx = o.x0 + 3.6; xx < o.x1 - 1.4; xx += 1.4) {   // masadaki küçük dron modelleri
          kutu(koyu, xx - 0.12, xx + 0.12, y + 0.9, y + 0.96, cz - 0.04, cz + 0.04); kutu(koyu, xx - 0.04, xx + 0.04, y + 0.9, y + 0.96, cz - 0.12, cz + 0.12);
          for (const [dx, dz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) kutu(kirmizi, xx + dx - 0.07, xx + dx + 0.07, y + 0.97, y + 0.975, cz + dz - 0.07, cz + dz + 0.07);
        }
        kutu(metal, o.x1 - 0.12, o.x1 - 0.06, y + 1.0, y + 2.2, o.z0 + 0.4, o.z1 - 0.4);   // takım panosu
      }
      if (o.tur === 'zeka') {
        for (const [dx, dz] of [[3.4, -0.9], [3.4, 0.9], [5.6, -0.9], [5.6, 0.9], [7.8, 0]]) {
          if (o.x0 + dx > o.x1 - 0.8) continue;
          masa(o.x0 + dx - 0.45, o.x0 + dx + 0.45, cz + dz - 0.45, cz + dz + 0.45, y, 0.72);
          oyunTahtasi.ust(o.x0 + dx - 0.25, o.x0 + dx + 0.25, cz + dz - 0.25, cz + dz + 0.25, y + 0.725, 0, 0);
        }
      }
      if (o.tur === 'sanat') for (let xx = o.x0 + 3.2; xx < o.x1 - 0.8; xx += 1.8) for (const dz of [-0.9, 0.9]) {   // resim sehpaları
        kutu(ahsap, xx - 0.03, xx + 0.03, y, y + 1.6, cz + dz - 0.35, cz + dz - 0.31); kutu(ahsap, xx - 0.03, xx + 0.03, y, y + 1.6, cz + dz + 0.31, cz + dz + 0.35);
        kutu([kirmizi, sari, mavi, yesil][Math.floor((xx + dz) * 3) & 3], xx - 0.06, xx - 0.02, y + 0.9, y + 1.5, cz + dz - 0.32, cz + dz + 0.32);
      }
      if (o.tur === 'muzik') {
        kutu(koyu, o.x0 + 3, o.x0 + 4.5, y, y + 1.0, o.z0 + 0.2, o.z0 + 0.8, 'mobilya');   // piyano
        kutu(beyaz, o.x0 + 3.02, o.x0 + 4.48, y + 0.72, y + 0.74, o.z0 + 0.78, o.z0 + 0.92);
        for (const [dx, r] of [[6, 0.3], [6.6, 0.22], [7.1, 0.25]]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.35, 16), new THREE.MeshStandardMaterial({ color: '#c8323b', roughness: 0.4 })); d.position.set(o.x0 + dx, y + 0.5, cz); grup.add(d); }
        for (let xx = o.x0 + 3.2; xx < o.x1 - 1; xx += 1.2) kutu(mavi, xx, xx + 0.4, y + 0.42, y + 0.47, cz + 0.8, cz + 1.2);
      }
      if (o.tur === 'proje') {
        masa(o.x0 + 3, o.x1 - 1.5, cz - 0.7, cz + 0.7, y, 0.76);
        for (let xx = o.x0 + 3.4; xx < o.x1 - 1.8; xx += 1.6) {   // üç kanatlı proje panosu
          kutu(beyaz, xx, xx + 0.9, y + 0.76, y + 1.5, cz - 0.02, cz + 0.02); kutu(mavi, xx + 0.05, xx + 0.85, y + 1.3, y + 1.45, cz - 0.03, cz + 0.03);
        }
      }
      if (o.tur === 'toplanti') { masa(o.x0 + 2.5, o.x1 - 1.5, cz - 0.7, cz + 0.7, y, 0.76); for (let xx = o.x0 + 2.8; xx < o.x1 - 1.6; xx += 0.9) for (const dz of [-1.05, 1.05]) kutu(koyu, xx, xx + 0.45, y + 0.45, y + 0.5, cz + dz - 0.22, cz + dz + 0.22); }
      if (o.tur === 'mudur') {
        masa(o.x0 + 1.4, o.x0 + 3.2, cz - 0.5, cz + 0.5, y, 0.78, koyu); kutu(koyu, o.x0 + 0.6, o.x0 + 1.1, y + 0.45, y + 1.3, cz - 0.3, cz + 0.3);   // makam koltuğu
        raf(o.x0 + 0.1, o.x0 + 0.5, o.z0 + 0.3, o.z0 + 1.6, y, 2.0);
        masa(o.x1 - 2.4, o.x1 - 0.6, cz - 0.6, cz + 0.6, y, 0.74);   // toplantı masası
        const dr = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 2.2, 8), new THREE.MeshStandardMaterial({ color: '#d4a64a', metalness: 0.7 })); dr.position.set(o.x0 + 0.5, y + 1.1, o.z1 - 0.4); grup.add(dr);
        const by = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), bayrakMalz()); by.position.set(o.x0 + 0.97, y + 1.8, o.z1 - 0.4); by.material = by.material.clone(); by.material.side = THREE.DoubleSide; grup.add(by);
      }
      if (o.tur === 'mudyrd') { masa(o.x0 + 1, o.x0 + 2.6, cz - 0.45, cz + 0.45, y, 0.76); raf(o.x1 - 0.5, o.x1 - 0.1, o.z0 + 0.3, o.z1 - 0.3, y, 1.9); kutu(koyu, o.x0 + 0.4, o.x0 + 0.85, y + 0.45, y + 1.1, cz - 0.25, cz + 0.25); }
      if (o.tur === 'ogretmen') {
        masa(o.x0 + 1.5, o.x1 - 2, cz - 0.7, cz + 0.7, y, 0.76);
        for (let xx = o.x0 + 1.8; xx < o.x1 - 2.2; xx += 0.85) for (const dz of [-1.0, 1.0]) kutu(koyu, xx, xx + 0.42, y + 0.45, y + 0.5, cz + dz - 0.2, cz + dz + 0.2);
        for (let xx = o.x1 - 1.6; xx < o.x1 - 0.1; xx += 0.5) kutu(metal, xx, xx + 0.46, y, y + 1.9, o.z0 + 0.05, o.z0 + 0.55, 'mobilya');   // dolaplar
      }
      if (o.tur === 'kutuphane') {
        for (const zz of [o.z0 + 0.1, o.z1 - 0.5]) raf(o.x0 + 0.5, o.x1 - 0.5, zz, zz + 0.4, y, 2.1);
        masa(o.x0 + 2.5, o.x1 - 2.5, cz - 0.5, cz + 0.5, y, 0.75);
      }
      if (o.tur === 'kantin') {
        kutu(beyaz, o.x0 + 0.5, o.x0 + 3.5, y, y + 1.05, o.z0 + 0.2, o.z0 + 0.8, 'mobilya'); kutu(kirmizi, o.x0 + 0.5, o.x0 + 3.5, y + 1.05, y + 1.1, o.z0 + 0.2, o.z0 + 0.85);
        for (const [dx, dz] of [[5.5, 0], [8, 0], [10.5, 0]]) if (o.x0 + dx < o.x1 - 0.6) masa(o.x0 + dx - 0.5, o.x0 + dx + 0.5, cz + dz - 0.5, cz + dz + 0.5, y, 0.74);
      }
      if (o.tur === 'rehber') { masa(o.x0 + 3, o.x0 + 4, cz - 0.5, cz + 0.5, y, 0.6); for (const dx of [2.3, 4.7]) kutu(yesil, o.x0 + dx - 0.3, o.x0 + dx + 0.3, y + 0.4, y + 0.85, cz - 0.3, cz + 0.3, 'mobilya'); raf(o.x1 - 0.5, o.x1 - 0.1, o.z0 + 0.4, o.z1 - 0.4, y, 1.6); }
      if (o.tur === 'hol') {
        // kupa dolabı (camlı), duyuru panosu, bekleme bankı
        kutu(ahsap, o.x0 + 0.3, o.x0 + 2.3, y, y + 0.3, o.z0 + 0.15, o.z0 + 0.6, 'mobilya'); kutu(camB, o.x0 + 0.3, o.x0 + 2.3, y + 0.3, y + 2.0, o.z0 + 0.15, o.z0 + 0.6, 'cam');
        for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.25, 12), new THREE.MeshStandardMaterial({ color: '#d4a64a', metalness: 0.85, roughness: 0.25 })); c.position.set(o.x0 + 0.6 + i * 0.45, y + 0.45 + (i % 2) * 0.6, o.z0 + 0.38); grup.add(c); }
        kutu(ahsap, o.x1 - 3, o.x1 - 0.5, y + 0.42, y + 0.47, o.z0 + 0.2, o.z0 + 0.6, 'mobilya');
        const pano = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshStandardMaterial({ map: doku(256, 128, (x) => {
          x.fillStyle = '#b8864f'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#1d3b8b'; x.font = '800 18px Onest, Arial'; x.fillText('DUYURULAR', 72, 22);
          [['#fff7c2', 'Bilim Şenliği'], ['#d6f0ff', 'Satranç turnuvası'], ['#ffd9e0', 'TÜBİTAK 2204'], ['#d9ffd9', 'Dron kulübü']].forEach(([r, t], i) => { x.fillStyle = r; x.fillRect(10 + i * 61, 34, 56, 80); x.fillStyle = '#333'; x.font = '600 10px Onest, Arial'; x.fillText(t, 13 + i * 61, 54); });
        }) }));
        pano.position.set((o.x0 + o.x1) / 2 + 1.5, y + 1.6, o.z0 + 0.01); grup.add(pano);
        O.hol = o;
      }
      // tavan lambaları (her odada iki panel)
      for (const fx of [0.33, 0.66]) { const lx = o.x0 + W * fx, ly = taban(o.k + 1) - 0.26; lambaB.dortgen([lx - 0.5, ly, cz - 0.5], [lx + 0.5, ly, cz - 0.5], [lx + 0.5, ly, cz + 0.5], [lx - 0.5, ly, cz + 0.5], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1]); }
    }
    // posterler
    const P = { mat: ['#1d3b8b', 'Matematik', ['Sayılar her yerde', 'Asal mısın?', '1, 1, 2, 3, 5, 8…']], fen: ['#2f7a4f', 'Periyodik', ['H He Li Be', 'B C N O F', 'Ne Na Mg']], bilisim: ['#2b2f36', 'Kodla!', ['if · for · while', 'Hata = ipucu', 'Kaydet!']],
      yz: ['#5a3fa8', 'Yapay Zekâ', ['Veri temiz mi?', 'Model adil mi?', 'Sonucu sorgula']], dron: ['#e08a1e', 'Güvenli Uçuş', ['Pervane koruması', 'Batarya kontrolü', 'Gözün dronda']],
      zeka: ['#7a4f2a', 'Turnuva', ['Satranç', 'Go · Mangala', 'MEDAR · Hex']], ing: ['#c8323b', 'English', ['Read · Write', 'Listen · Speak', 'Every day!']], edb: ['#8a5a2b', 'Edebiyat', ['Oku', 'Düşün', 'Yaz']],
      sanat: ['#d0457a', 'Sergi', ['Renk · Biçim', 'Doku · Işık', 'Cuma 15.00']], muzik: ['#26445c', 'Koro', ['Salı 14.00', 'Herkes davetli', '♪ ♫ ♪']], proje: ['#1f8a5b', 'Proje Takvimi', ['Fikir', 'Deney', 'Rapor · Sunum']] };
    for (const o of ODALAR) if (P[o.tur]) { posterKoy(o, ...P[o.tur], 0); posterKoy(o, P[o.tur][0], 'BİLSEM', ['Merak et', 'Araştır', 'Paylaş'], 2.2); }

    /* ---------- kapı tabelaları (koridor tarafında, kapının üstünde) ---------- */
    const tab = bm(), N = kapilar.length;
    const tabD = doku(1024, 512, (x) => {
      kapilar.forEach((o, j) => {
        const cx = (j % 4) * 256, cy = Math.floor(j / 4) * 64;
        x.fillStyle = o.tur === 'mudur' || o.tur === 'mudyrd' || o.tur === 'ogretmen' ? '#26445c' : '#1d3b8b'; x.fillRect(cx + 3, cy + 3, 250, 58);
        x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
        let f = 30; x.font = `700 ${f}px Onest, Arial`; while (x.measureText(o.ad).width > 236 && f > 12) { f--; x.font = `700 ${f}px Onest, Arial`; }
        x.fillText(o.ad, cx + 128, cy + 33);
      });
    });
    kapilar.forEach((o, j) => {
      const u0 = (j % 4) / 4, u1 = u0 + 0.25, v1 = 1 - Math.floor(j / 4) / 8, v0 = v1 - 1 / 8, y = o.y + 2.28, w = 1.5, x = o.kapi.x;
      if (o.taraf === 'on') { const z = o.kapi.z - ti / 2 - 0.01; tab.dortgen([x + w / 2, y, z], [x - w / 2, y, z], [x - w / 2, y + 0.36, z], [x + w / 2, y + 0.36, z], [0, 0, -1], [u0, v0, u1, v0, u1, v1, u0, v1]); }
      else { const z = o.kapi.z + ti / 2 + 0.01; tab.dortgen([x - w / 2, y, z], [x + w / 2, y, z], [x + w / 2, y + 0.36, z], [x - w / 2, y + 0.36, z], [0, 0, 1], [u0, v0, u1, v0, u1, v1, u0, v1]); }
    });
    // koridor: tavan lambaları, yangın dolabı, dolaplar (öğrenci dolapları)
    for (let k = 0; k < KAT; k++) {
      for (let x = X0 + 2; x < MX0 - 0.5; x += 3) { const ly = taban(k + 1) - 0.26; lambaB.dortgen([x - 0.6, ly, CZ0 + 0.7], [x + 0.6, ly, CZ0 + 0.7], [x + 0.6, ly, CZ1 - 0.7], [x - 0.6, ly, CZ1 - 0.7], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1]); }
      kutu(kirmizi, X0 + 0.32, X0 + 0.5, taban(k) + 1.0, taban(k) + 1.7, CZ0 + 0.6, CZ1 - 0.6);
    }

    /* ---------- malzemeler ve sahneye ekleme ---------- */
    const M = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8 }, o));
    const vinil = doku(128, 128, (x) => { x.fillStyle = '#b9b2a4'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(0,0,0,.1)'; x.lineWidth = 2; x.strokeRect(0, 0, 64, 64); x.strokeRect(64, 64, 64, 64); x.strokeRect(64, 0, 64, 64); x.strokeRect(0, 64, 64, 64); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(90,80,60,${Math.random() * 0.12})`; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); } });
    const lM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f6f9ff', emissiveIntensity: 0.55 }); lM.userData.gunduz = 0.55; GECE.malz.push([lM, 1.4]);
    const ekM = new THREE.MeshStandardMaterial({ color: '#0d2a44', emissive: '#3a8ad8', emissiveIntensity: 0.7 });
    grup.add(
      dis.mesh(M({ color: '#efe5cf', roughness: 0.9 }), true), ic.mesh(M({ color: '#f3efe4', side: THREE.DoubleSide })),
      dos.mesh(M({ map: vinil, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })), tav.mesh(M({ color: '#f2f2ee', emissive: '#c9c6bd', emissiveIntensity: 0.3 })),
      camB.mesh(new THREE.MeshStandardMaterial({ color: '#8fb6d4', roughness: 0.05, metalness: 0.35, transparent: true, opacity: 0.4, depthWrite: false })),
      cer.mesh(M({ color: '#ff8a1e', emissive: '#ff6a00', emissiveIntensity: 0.25 })), bant.mesh(M({ color: '#b8614a' })),
      ahsap.mesh(M({ color: '#c99a62', roughness: 0.6 }), true), metal.mesh(M({ color: '#9aa3ad', metalness: 0.6, roughness: 0.4 })), beyaz.mesh(M({ color: '#f4f5f6' })),
      koyu.mesh(M({ color: '#3a3f47' })), mavi.mesh(M({ color: '#2f6fd0' })), kirmizi.mesh(M({ color: '#c8323b' })), yesil.mesh(M({ color: '#2f7a4f' })), sari.mesh(M({ color: '#e9b21e' })),
      ekran.mesh(ekM), lambaB.mesh(lM), tab.mesh(M({ map: tabD })));
    // akıllı tahtalar ve posterler: her biri ayrı ağ yerine tek doku atlasında (az çizim çağrısı)
    {
      const n = tahtalar.length, sut = 4, sat = Math.ceil(n / sut), W = 512, H = 288;
      const at = doku(sut * W, sat * H, (x) => tahtalar.forEach((t, j) => x.drawImage(tahtaDoku(t.tur, t.ad).image, (j % sut) * W, Math.floor(j / sut) * H)));
      const tb = bm();
      tahtalar.forEach((t, j) => {
        const u0 = (j % sut) / sut, u1 = u0 + 1 / sut, v1 = 1 - Math.floor(j / sut) / sat, v0 = v1 - 1 / sat;
        tb.dortgen([t.x, t.y0, t.z1], [t.x, t.y0, t.z0], [t.x, t.y1, t.z0], [t.x, t.y1, t.z1], [1, 0, 0], [u0, v0, u1, v0, u1, v1, u0, v1]);
      });
      grup.add(tb.mesh(new THREE.MeshStandardMaterial({ map: at, emissiveMap: at, emissive: '#ffffff', emissiveIntensity: 0.55 })));
      const m = posterler.length, ps = 8, pr = Math.ceil(m / ps), PW_ = 192, PH = 256;
      const ap = doku(ps * PW_, pr * PH, (x) => posterler.forEach((q, j) => x.drawImage(posterDoku(q.renk, q.baslik, q.alt).image, (j % ps) * PW_, Math.floor(j / ps) * PH)));
      const pb = bm();
      posterler.forEach((q, j) => {
        const u0 = (j % ps) / ps, u1 = u0 + 1 / ps, v1 = 1 - Math.floor(j / ps) / pr, v0 = v1 - 1 / pr, a = 0.35, h = 0.465, uv = [u0, v0, u1, v0, u1, v1, u0, v1];
        if (q.on) pb.dortgen([q.x - a, q.y - h, q.zw], [q.x + a, q.y - h, q.zw], [q.x + a, q.y + h, q.zw], [q.x - a, q.y + h, q.zw], [0, 0, 1], uv);
        else pb.dortgen([q.x + a, q.y - h, q.zw], [q.x - a, q.y - h, q.zw], [q.x - a, q.y + h, q.zw], [q.x + a, q.y + h, q.zw], [0, 0, -1], uv);
      });
      grup.add(pb.mesh(new THREE.MeshStandardMaterial({ map: ap, roughness: 0.7 })));
      grup.add(oyunTahtasi.mesh(new THREE.MeshStandardMaterial({ map: doku(64, 64, (x) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#e9d6b5' : '#7a4f2a'; x.fillRect(i * 8, j * 8, 8, 8); } }), polygonOffset: true, polygonOffsetFactor: -2 })));
    }
    return O;
  };

  // okul turu görevinin durakları: her atölyenin ortası
  O.duraklar = () => ODALAR.filter((o) => ['mat', 'bilisim', 'yz', 'zeka', 'fen', 'dron', 'ing', 'edb'].includes(o.tur)).map((o) => ({ ad: o.ad, tur: o.tur, x: (o.x0 + o.x1) / 2 + 1, y: o.y + 1.5, z: (o.z0 + o.z1) / 2, k: o.k }));
  window.OKUL = O;
})();
