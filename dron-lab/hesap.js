/* =====================================================================
   DRON TASARIM LABORATUVARI — hesap.js
   ---------------------------------------------------------------------
   Bu dosyada YALNIZCA fizik/hesap kodu var; ekrana hiçbir şey çizmez.
   Arayüz kodu app.js içindedir. Böyle ayırınca formülleri bulmak ve
   değiştirmek kolaylaşır.

   ÖNEMLİ: Buradaki her sonuç basitleştirilmiş modellere dayanan bir
   TAHMİNDİR. Gerçek değerler motor, pervane ve bataryanın üreticisine
   göre değişir. Kalibrasyon için aşağıdaki SABITLER nesnesini düzenle.
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------------
   SABITLER — kalibrasyon için değiştirebileceğin sayılar burada.
   Her birinin yanında ne işe yaradığı ve nereden geldiği yazıyor.
   --------------------------------------------------------------------- */
const SABITLER = {
  g: 9.80665,              // yerçekimi ivmesi [m/s²]
  R_HAVA: 287.05,          // kuru hava gaz sabiti [J/(kg·K)]
  GAMMA_HAVA: 1.4,         // havanın özgül ısı oranı (ses hızı için)

  // --- Batarya ---
  HUCRE_NOMINAL_V: 3.7,    // LiPo hücre başına nominal gerilim [V]
  HUCRE_MIN_V: 3.0,        // yük altında inilebilecek en düşük hücre gerilimi [V]
  // İç direnç tahmini: R_hücre ≈ IC_DIRENC_K / (kapasite[Ah] · C)  [Ω]
  // Bu ilişki BENİM basitleştirmemdir: yüksek C değerli, büyük kapasiteli
  // paketlerin iç direnci düşüktür. Gerçek paketlerde ölçüp ayarla.
  IC_DIRENC_K: 0.5,
  KULLANILABILIR_KAPASITE: 0.80,   // bataryanın güvenle kullanılabilen kısmı (%80)

  // --- Motor ---
  // Yük altındaki devir / boştaki devir (KV·V). Pervane takılı motor,
  // boştaki devrinin yaklaşık %75–85'ine çıkar. Kaba ortalama: 0,80
  RPM_YUK_ORANI: 0.80,
  // Motor + ESC toplam verimi (mil gücü / elektrik gücü). Tipik 0,70–0,80
  ETA_MOTOR_ESC: 0.75,
  // Düşük gazda (hover) motor+ESC verimi genellikle daha düşüktür. Kaba: 0,60–0,70
  ETA_HOVER: 0.62,
  // Uçuş kontrolcüsü, kamera, verici vb. elektroniklerin sabit tüketimi [W]
  ELEKTRONIK_GUC_W: 3,

  // --- Pervane katsayıları (statik, yani dron havada asılıyken) ---
  // Ct ≈ (CT_TABAN + CT_EGIM · hatve/çap) · kanat_çarpanı
  // Cp ≈ (CP_TABAN + CP_EGIM · hatve/çap) · kanat_çarpanı
  // Bu doğrusal formüller BENİM kaba yaklaşımımdır. UIUC Propeller Data
  // Site'taki küçük pervanelerin statik ölçümleri kabaca Ct ≈ 0,08–0,15,
  // Cp ≈ 0,03–0,08 aralığındadır; sayılar bu aralığa oturacak şekilde
  // seçildi. Belirli bir pervanen için ölçüm varsa doğrudan onu yaz.
  CT_TABAN: 0.07,
  CT_EGIM: 0.06,
  CP_TABAN: 0.02,
  CP_EGIM: 0.06,
  CT_UC_KANAT: 1.25,       // 3 kanat, 2 kanada göre ~%25 daha fazla itki (kaba)
  CP_UC_KANAT: 1.40,       // ...ama ~%40 daha fazla güç ister (kaba)

  // --- Uyarı eşikleri ---
  UC_MACH_UYARI: 0.75,     // pervane ucu bu Mach sayısını aşarsa uyar
  // Motor başına elektrik gücü / motor kütlesi bu değeri (W/g) aşarsa
  // motor o gücü taşıyamaz; gerçek devir hesaplanandan çok düşük kalır.
  // Küçük fırçasız motorlar kısa süreli ~20–30 W/g'a kadar çıkabilir (kaba).
  MOTOR_W_PER_G_MAKS: 30,
  // Batarya enerji yoğunluğu üst sınırı [Wh/kg]. Dron LiPo paketleri tipik
  // 130–180 Wh/kg; en iyi lityum hücreler bile ~250–270 Wh/kg civarındadır.
  // Girilen batarya ağırlığı bu sınırın izin verdiğinden hafifse tasarım
  // fizik açısından yapılamaz (cömert sınır: 250).
  BATARYA_MAKS_WH_KG: 250,
  // Çerçeve sınıfına göre takılabilecek en büyük pervane çapı [inç]
  MAKS_PERVANE: { 2: 2.2, 3: 3.1, 5: 5.2, 7: 7.2, 10: 10.5 },
};

/* ---------------------------------------------------------------------
   HAZIR ŞABLONLAR — "Hazır şablon" menüsündeki ön ayarlar.
   Değerler piyasadaki tipik yapılara yakın seçildi (kesin değil).
   --------------------------------------------------------------------- */
const SABLONLAR = {
  yaris5: {
    ad: 'Yarış 5 inç (6S)',
    cerceveSinif: 5, cerceveG: 110,
    kv: 1950, motorG: 32, motorSayisi: 4,
    pervaneCap: 5.0, hatve: 4.3, kanat: 3,
    hucre: 6, kapasite: 1300, cDegeri: 120, bataryaG: 200,
    fcEscG: 15, kameraG: 10, aliciG: 3, ekYukG: 0,
    rakim: 0, sicaklik: 20,
  },
  sinematik3: {
    ad: 'Sinematik 3 inç (cinewhoop)',
    cerceveSinif: 3, cerceveG: 90,
    kv: 3800, motorG: 12, motorSayisi: 4,
    pervaneCap: 3.0, hatve: 2.0, kanat: 3,
    hucre: 4, kapasite: 850, cDegeri: 75, bataryaG: 100,
    fcEscG: 12, kameraG: 30, aliciG: 3, ekYukG: 0,
    rakim: 0, sicaklik: 20,
  },
  uzun7: {
    ad: 'Uzun menzil 7 inç',
    cerceveSinif: 7, cerceveG: 160,
    kv: 1200, motorG: 50, motorSayisi: 4,
    pervaneCap: 7.0, hatve: 3.5, kanat: 2,
    hucre: 6, kapasite: 2200, cDegeri: 50, bataryaG: 330,
    fcEscG: 15, kameraG: 10, aliciG: 5, ekYukG: 30,
    rakim: 0, sicaklik: 20,
  },
  mikro: {
    ad: 'Eğitim / Mikro 2 inç',
    cerceveSinif: 2, cerceveG: 20,
    kv: 10000, motorG: 4, motorSayisi: 4,
    pervaneCap: 2.0, hatve: 1.2, kanat: 3,
    hucre: 2, kapasite: 450, cDegeri: 80, bataryaG: 26,
    fcEscG: 5, kameraG: 4, aliciG: 1, ekYukG: 0,
    rakim: 0, sicaklik: 20,
  },
  yuk10: {
    ad: 'Yük taşıyıcı 10 inç',
    cerceveSinif: 10, cerceveG: 350,
    kv: 700, motorG: 90, motorSayisi: 4,
    pervaneCap: 10.0, hatve: 4.5, kanat: 2,
    hucre: 6, kapasite: 6000, cDegeri: 25, bataryaG: 800,
    fcEscG: 30, kameraG: 20, aliciG: 10, ekYukG: 500,
    rakim: 0, sicaklik: 20,
  },
};

/* Küçük yardımcı: bir sayıyı [alt, ust] aralığına sıkıştırır. */
function sinirla(x, alt, ust) { return Math.min(ust, Math.max(alt, x)); }
/* Sayıyı Türkçe biçimde yazar: tr(3.25, 2) → "3,25" */
function tr(x, b) { return Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b }); }

/* ---------------------------------------------------------------------
   havaYogunlugu(rakim_m, sicaklik_C)
   1) Basınç (Uluslararası Standart Atmosfer, troposfer):
        P = 101325 · (1 − 2.25577e-5 · h)^5.25588     [Pa]
   2) İdeal gaz denklemi:
        ρ = P / (R · T)       T = sıcaklık + 273,15    [kg/m³]
   Not: Basınç formülü standart sıcaklık profilini varsayar; ρ'yu ise
   kullanıcının girdiği gerçek sıcaklıkla hesaplıyoruz. Bu yaygın ve
   yeterince iyi bir yaklaşımdır.
   --------------------------------------------------------------------- */
function havaYogunlugu(rakim_m, sicaklik_C) {
  const P = 101325 * Math.pow(1 - 2.25577e-5 * rakim_m, 5.25588);
  const T = sicaklik_C + 273.15;
  const rho = P / (SABITLER.R_HAVA * T);
  return { P, T, rho };
}

/* ---------------------------------------------------------------------
   pervaneKatsayilari(cap_inc, hatve_inc, kanat)
   Hatve/çap oranından itki katsayısı Ct ve güç katsayısı Cp tahmin eder.
   (Formüller SABITLER bölümünde açıklandı.)
   --------------------------------------------------------------------- */
function pervaneKatsayilari(cap_inc, hatve_inc, kanat) {
  const oran = hatve_inc / cap_inc;
  const ucKanat = Number(kanat) === 3;
  const Ct = (SABITLER.CT_TABAN + SABITLER.CT_EGIM * oran) * (ucKanat ? SABITLER.CT_UC_KANAT : 1);
  const Cp = (SABITLER.CP_TABAN + SABITLER.CP_EGIM * oran) * (ucKanat ? SABITLER.CP_UC_KANAT : 1);
  return { Ct, Cp, oran };
}

/* ---------------------------------------------------------------------
   kutleDagilimi(t) — gram cinsinden parça parça kütleler.
   --------------------------------------------------------------------- */
function kutleDagilimi(t) {
  const motorlar = t.motorG * t.motorSayisi;
  const diger = t.fcEscG + t.kameraG + t.aliciG + t.ekYukG;
  return {
    cerceve: t.cerceveG,
    motorlar,
    batarya: t.bataryaG,
    elektronik: t.fcEscG + t.kameraG + t.aliciG,
    ekYuk: t.ekYukG,
    diger,
    toplam: t.cerceveG + motorlar + t.bataryaG + diger,
  };
}

/* ---------------------------------------------------------------------
   hesapla(t) — ANA HESAP. t: tasarım nesnesi (tüm girdiler).
   Adımlar:
   1) Kütle ve ağırlık:            W = m · g
   2) Hava yoğunluğu ρ
   3) TAM GAZ noktası (batarya gerilim düşümüyle birlikte, yinelemeli):
        V_yük = S · (3,7 − I · R_hücre)
        RPM   = KV · V_yük · RPM_YUK_ORANI      n = RPM / 60  [dev/s]
        T     = Ct · ρ · n² · D⁴                 (D metre)     [N]
        P_mil = Cp · ρ · n³ · D⁵                               [W]
        P_el  = P_mil / η
        I     = (N · P_el + P_elektronik) / V_yük
      Akım gerilimi düşürür, gerilim akımı düşürür; bu yüzden birkaç
      kez döngüyle dengeye getiriyoruz.
   4) TWR = T_toplam / W
   5) Hover gazı ≈ √(W / T_toplam)   (T ∝ gaz² kabulü)
   6) Hover gücü: aynı pervanede P ∝ T^1.5 olduğundan
        P_mil,hover = P_mil,maks · (W / T_toplam)^1.5
        P_el,hover  = P_mil,hover / η_hover + P_elektronik
   7) Uçuş süresi t = (kapasite · 0,8) / I_hover
   --------------------------------------------------------------------- */
function hesapla(t) {
  const S = SABITLER;
  const N = t.motorSayisi;

  // 1) Kütle
  const kutle = kutleDagilimi(t);
  const m = kutle.toplam / 1000;          // kg
  const W = m * S.g;                       // N

  // 2) Hava
  const hava = havaYogunlugu(t.rakim, t.sicaklik);
  const rho = hava.rho;

  // Pervane
  const D = t.pervaneCap * 0.0254;         // inç → metre
  const { Ct, Cp, oran } = pervaneKatsayilari(t.pervaneCap, t.hatve, t.kanat);

  // Batarya
  const Ah = t.kapasite / 1000;
  const Rhucre = S.IC_DIRENC_K / (Ah * t.cDegeri);   // Ω (tahmini)
  const Ibatarya = Ah * t.cDegeri;                   // sürekli akım sınırı [A]

  // 3) Tam gaz — yinelemeli çözüm
  let Vhucre = S.HUCRE_NOMINAL_V;
  let V, rpm, n, Tmotor, Pmil, Pel, Imaks;
  for (let i = 0; i < 40; i++) {
    V = t.hucre * Vhucre;
    rpm = t.kv * V * S.RPM_YUK_ORANI;
    n = rpm / 60;
    Tmotor = Ct * rho * n * n * Math.pow(D, 4);
    Pmil = Cp * rho * Math.pow(n, 3) * Math.pow(D, 5);
    Pel = Pmil / S.ETA_MOTOR_ESC;
    Imaks = (N * Pel + S.ELEKTRONIK_GUC_W) / V;
    const yeni = sinirla(S.HUCRE_NOMINAL_V - Imaks * Rhucre, S.HUCRE_MIN_V, S.HUCRE_NOMINAL_V);
    Vhucre = 0.5 * Vhucre + 0.5 * yeni;    // yumuşak güncelleme (salınımı önler)
  }
  const Ttoplam = Tmotor * N;

  // 4) İtki/ağırlık
  const TWR = Ttoplam / W;

  // 5) Hover gazı
  const hoverGaz = Math.sqrt(W / Ttoplam);   // 0..1 (1'den büyükse uçamaz)
  const ucabilir = hoverGaz < 1;

  // 6) Hover gücü ve akımı
  const PmilHover = N * Pmil * Math.pow(Math.min(1, W / Ttoplam), 1.5);
  const PelHover = PmilHover / S.ETA_HOVER + S.ELEKTRONIK_GUC_W;
  let VhucreH = S.HUCRE_NOMINAL_V, Ihover = 0;
  for (let i = 0; i < 30; i++) {
    Ihover = PelHover / (t.hucre * VhucreH);
    VhucreH = sinirla(S.HUCRE_NOMINAL_V - Ihover * Rhucre, S.HUCRE_MIN_V, S.HUCRE_NOMINAL_V);
  }

  // 7) Uçuş süresi (dakika)
  const ucusDk = ucabilir ? (Ah * S.KULLANILABILIR_KAPASITE / Ihover) * 60 : 0;

  // 8) Dikey ivme: a = (T − W)/m  →  g cinsinden TWR − 1
  const dikeyIvme_g = TWR - 1;

  // 9) Pervane ucu hızı ve Mach sayısı: v = π · D · n,  a_ses = √(γ R T)
  const ucHizi = Math.PI * D * n;
  const sesHizi = Math.sqrt(S.GAMMA_HAVA * S.R_HAVA * hava.T);
  const ucMach = ucHizi / sesHizi;

  // 10) Çeviklik puanı (0–100): FİZİKSEL BİR BİRİM DEĞİL, öğretici bir endeks.
  //     TWR arttıkça doygunlaşan bir eğri × küçük pervane avantajı
  //     (küçük pervaneler daha hafif, devir değişimine daha hızlı yanıt verir).
  const tabanCev = 1 - Math.exp(-Math.max(0, TWR - 1) / 3);
  const boyutCarpani = Math.min(1.15, Math.pow(5 / t.pervaneCap, 0.3));
  const ceviklik = Math.round(sinirla(100 * tabanCev * boyutCarpani, 0, 100));

  // Verimlilik: hover'da watt başına taşınan gram
  const gramPerWatt = kutle.toplam / PelHover;

  return {
    kutle, m, W, hava, rho, D, Ct, Cp, oran,
    Rhucre, Ibatarya,
    V, Vhucre, rpm, n,
    Tmotor, Ttoplam, Pmil, Pel, Imaks, PmaksToplamEl: Imaks * V,
    TWR, hoverGaz, ucabilir,
    PelHover, Ihover, VhucreH, ucusDk,
    dikeyIvme_g, ucHizi, ucMach, ceviklik, gramPerWatt,
  };
}

/* ---------------------------------------------------------------------
   degerlendir(t, s) — sonucu öğretmen diliyle yorumlar ve uyarı üretir.
   s: hesapla() çıktısı.  Dönen: { sinif, baslik, metin, uyarilar[] }
   --------------------------------------------------------------------- */
function degerlendir(t, s) {
  let sinif, baslik, metin;
  const twr = s.TWR;
  if (twr < 1.2) {
    sinif = 'kotu'; baslik = 'Kalkış zor, bu dron uçmaz.';
    metin = 'Motorların tam gazda ürettiği itki, ağırlığı ancak karşılıyor ya da karşılayamıyor. Kütleyi azalt, daha büyük pervane, daha yüksek KV ya da daha fazla hücre dene.';
  } else if (twr < 2) {
    sinif = 'dikkat'; baslik = 'Uçar ama hantal; yüklü taşıma için uygun.';
    metin = 'Havada durabilir ama manevra ve rüzgâra karşı güç payı az. Ani bir rüzgârda toparlanması zor olabilir.';
  } else if (twr < 4) {
    sinif = 'iyi'; baslik = 'Dengeli; sinematik ve genel amaçlı uçuş için uygun.';
    metin = 'Yumuşak, kontrollü uçuş için iyi bir güç payı var. Kamera taşıma ve eğitim için ideal aralık.';
  } else if (twr <= 8) {
    sinif = 'iyi'; baslik = 'Çevik; yarış/freestyle sınıfı.';
    metin = 'Hızlı hızlanır, takla ve keskin dönüşler yapabilir. Deneyim ister.';
  } else {
    sinif = 'dikkat'; baslik = 'Çok agresif; acemi için tehlikeli.';
    metin = 'Gaza küçük bir dokunuş bile ani tırmanış yaratır. Önce simülatörde pratik yap, düşük gaz eğrisi kullan.';
  }

  const u = [];   // uyarılar: {tur: 'kotu'|'dikkat'|'bilgi', metin}
  // --- Gerçeklik denetimi: kâğıt üstünde uçan ama yapılamayan tasarımlar ---
  let gercekDisi = false;
  const Wh = t.hucre * SABITLER.HUCRE_NOMINAL_V * t.kapasite / 1000;
  const minBatG = Wh * 1000 / SABITLER.BATARYA_MAKS_WH_KG;
  if (t.bataryaG < minBatG) {
    gercekDisi = true;
    u.push({ tur: 'kotu', metin: `${t.hucre}S ${t.kapasite} mAh bir batarya yaklaşık ${tr(Wh, 0)} Wh enerji taşır. En iyi lityum hücreler bile kilogram başına ~${SABITLER.BATARYA_MAKS_WH_KG} Wh taşıyabilir; bu enerji için en az ~${tr(minBatG, 0)} g batarya gerekir, sen ${t.bataryaG} g girdin. Bu ağırlıkta böyle bir batarya yapılamaz, bu yüzden uçuş süresi ve itki/ağırlık sonuçları GEÇERSİZDİR. Batarya ağırlığını artır ya da kapasiteyi düşür.` });
  }
  if (s.Imaks > s.Ibatarya) {
    u.push({ tur: 'kotu', metin: `Tam gazda yaklaşık ${tr(s.Imaks, 0)} A çekiliyor; bataryanın sürekli akım sınırı ${tr(s.Ibatarya, 0)} A (kapasite × C). Batarya ısınır, gerilim çöker, ömrü kısalır. Daha yüksek C değeri veya kapasite seç.` });
  }
  if (s.ucabilir && s.hoverGaz > 0.70) {
    u.push({ tur: 'kotu', metin: `Hover gazı yaklaşık %${tr((s.hoverGaz * 100), 0)}: dronu havada tutmak için gazın çoğu harcanıyor, manevra payı çok az.` });
  }
  if (s.ucabilir && s.hoverGaz < 0.15) {
    u.push({ tur: 'dikkat', metin: 'Hover gazı %15\'in altında: gaz kolu çok hassas olur, yumuşak uçmak zorlaşır.' });
  }
  if (s.ucabilir && s.ucusDk < 3) {
    u.push({ tur: 'kotu', metin: `Tahmini uçuş süresi ${tr(s.ucusDk, 1)} dk; 3 dakikanın altında. Daha büyük batarya ya da daha hafif tasarım düşün.` });
  }
  const maksPervane = SABITLER.MAKS_PERVANE[t.cerceveSinif];
  if (maksPervane && t.pervaneCap > maksPervane) {
    u.push({ tur: 'kotu', metin: `${t.pervaneCap}" pervane, ${t.cerceveSinif}" sınıfı çerçeveye büyük (en fazla ~${maksPervane}"). Pervaneler birbirine veya çerçeveye çarpabilir.` });
  }
  if (s.ucMach > SABITLER.UC_MACH_UYARI) {
    u.push({ tur: 'dikkat', metin: `Pervane ucu ses hızının yaklaşık %${tr((s.ucMach * 100), 0)}'i hızla dönüyor. Bu hızda verim düşer, gürültü artar; model burada iyimser kalabilir.` });
  }
  const wPerG = s.Pel / t.motorG;
  if (wPerG > SABITLER.MOTOR_W_PER_G_MAKS) {
    gercekDisi = true;
    u.push({ tur: 'kotu', metin: `Her motorun yaklaşık ${tr(s.Pel, 0)} W çekmesi gerekiyor (${tr(wPerG, 0)} W/g). ${t.motorG} g'lık bir motor bunu taşıyamaz: ısınıp yanar ya da bu devre hiç çıkamaz. Bu durumda hesaplanan itki GEÇERSİZDİR. KV'yi düşür, daha küçük pervane ya da daha ağır motor seç.` });
  }
  if (s.Vhucre < 3.3) {
    u.push({ tur: 'dikkat', metin: `Tam gazda hücre gerilimi yaklaşık ${tr(s.Vhucre, 2)} V'a düşüyor (gerilim çökmesi). Batarya zorlanıyor.` });
  }
  if (s.rho < 1.0) {
    u.push({ tur: 'bilgi', metin: `Hava yoğunluğu düşük (${tr(s.rho, 2)} kg/m³). Yüksek rakım ve sıcakta pervaneler daha az itki üretir.` });
  }
  if (t.motorSayisi > 4) {
    u.push({ tur: 'bilgi', metin: `${t.motorSayisi} motorlu tasarımlarda çerçeve genellikle daha büyük ve ağırdır; çerçeve ağırlığını buna göre girdiğinden emin ol.` });
  }
  if (gercekDisi) {
    sinif = 'kotu'; baslik = 'Kâğıt üstünde uçuyor, gerçekte yapılamaz.';
    metin = 'Bazı değerler fizik kurallarıyla bağdaşmıyor (aşağıdaki kırmızı uyarılara bak). Hesap yine de yapıldı ama sonuçlar gerçek bir dronu anlatmıyor.';
  }
  return { sinif, baslik, metin, uyarilar: u, gercekDisi };
}

/* ---------------------------------------------------------------------
   itkiEgrisi(s) — grafik için (gaz %, toplam itki g) noktaları.
   Kabul: T = T_maks · gaz²
   --------------------------------------------------------------------- */
function itkiEgrisi(s) {
  const noktalar = [];
  for (let gz = 0; gz <= 100; gz += 2) {
    const T = s.Ttoplam * Math.pow(gz / 100, 2);
    noktalar.push([gz, T / SABITLER.g * 1000]);   // N → gram-kuvvet
  }
  return noktalar;
}

/* ---------------------------------------------------------------------
   ucusSuresiEgrisi(t) — ek yük arttıkça uçuş süresi nasıl değişir?
   Ek yükü 0'dan, dronun ancak havada kalabildiği yüke kadar artırıp her
   adımda hesapla()'yı yeniden çalıştırır. Dönen: [[ekYuk_g, dk], ...]
   --------------------------------------------------------------------- */
function ucusSuresiEgrisi(t) {
  const temel = hesapla(t);
  // Hover gazının ~%95 olduğu yük ≈ (T_maks·0,9 − W) — üst sınırı kabaca bul
  const maksYuk = Math.max(50, (temel.Ttoplam * 0.9 - temel.W) / SABITLER.g * 1000 + t.ekYukG);
  const adim = maksYuk / 30;
  const noktalar = [];
  for (let i = 0; i <= 30; i++) {
    const yuk = i * adim;
    const s = hesapla(Object.assign({}, t, { ekYukG: yuk }));
    if (!s.ucabilir) break;
    noktalar.push([yuk, s.ucusDk]);
  }
  return noktalar;
}

/* Tarayıcıda global olarak, Node.js'te (test için) modül olarak sun. */
const DronHesap = { SABITLER, SABLONLAR, havaYogunlugu, pervaneKatsayilari, kutleDagilimi, hesapla, degerlendir, itkiEgrisi, ucusSuresiEgrisi };
if (typeof module !== 'undefined' && module.exports) { module.exports = DronHesap; }
else { window.DronHesap = DronHesap; }
