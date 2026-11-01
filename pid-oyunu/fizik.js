/* =====================================================================
   PID AYAR OYUNU — fizik.js
   ---------------------------------------------------------------------
   Bu dosyada yalnızca simülasyon (fizik + PID kontrolcü), seviyeler,
   puanlama, geri bildirim ve Ziegler–Nichols hesabı var. Ekrana çizim
   app.js içindedir.

   MODEL (tek eksen, yatış/roll):
     J · θ'' = τ_motor + τ_bozucu − b · θ'
       θ   : yatış açısı [rad]       J : atalet momenti [kg·m²]
       b   : hava sönümü [N·m·s/rad] τ : tork [N·m]

   KONTROLCÜ (PID):
     e        = θ_hedef − θ_ölçülen
     τ_komut  = Kp·e + Ki·∫e dt + Kd·(−θ'_ölçülen)
     • Türev, hatadan değil ÖLÇÜMDEN alınır ("derivative on measurement"):
       hedef aniden değişince D terimi sıçramaz.
     • İntegral sınırlanır (anti-windup).
     • τ_komut, ±TAU_MAKS ile kırpılır (motorların gücü sınırlı).
     • Motorlar komuta anında değil, birinci dereceden gecikmeyle uyar:
         τ_motor' = (τ_komut − τ_motor) / T_motor
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------------
   SABİTLER — oyunun "fiziği". Değiştirerek farklı dronları deneyebilirsin.
   Değerler 5 inçlik bir yarış dronunun yatış ekseni için kaba büyüklük
   mertebesindedir (kesin değil).
   --------------------------------------------------------------------- */
const PID_SABIT = {
  J: 0.01,                  // atalet momenti [kg·m²]
  B: 0.02,                  // sönüm katsayısı [N·m·s/rad] (hava direnci ve pervane sönümü)
  TAU_MAKS: 0.5,            // motorların üretebileceği en büyük tork [N·m]
  MOTOR_ZS: 0.03,           // motor gecikmesi zaman sabiti [s] (30 ms)
  DT: 1 / 240,              // sabit simülasyon adımı [s] (saniyede 240 adım)
  INTEGRAL_KATKI_MAKS: 0.25,// I teriminin en fazla katkısı [N·m] (anti-windup)
  DEVRILME_DEG: 80,         // bu açıyı aşarsa "devrildi" sayılır [°]
  BANT_DEG: 2,              // "oturdu" sayılmak için hedefe yakınlık bandı [°]
  // Kaydırıcı aralıkları
  KP_MAKS: 3, KI_MAKS: 3, KD_MAKS: 0.4,
};

const DERECE = Math.PI / 180;

/* ---------------------------------------------------------------------
   Tohumlu rastgele sayı üreteci (mulberry32).
   Aynı tohum → aynı "rastgele" diziler. Testleri tekrarlanabilir yapar.
   --------------------------------------------------------------------- */
function rastgeleUretec(tohum) {
  let a = tohum >>> 0;
  const r = function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Normal (Gauss) dağılımlı sayı: Box–Muller dönüşümü
  r.gauss = function () {
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return r;
}

/* ---------------------------------------------------------------------
   SEVİYELER
   Her seviye: süre, başlangıç açısı, sürekli rüzgâr fonksiyonu, ani
   darbe ayarı, sensör gürültüsü ve geçme koşulları içerir.
   --------------------------------------------------------------------- */
const SEVIYELER = [
  {
    no: 0, ad: 'Serbest deneme', puanli: false,
    gorev: 'Puan yok, süre yok. Kazançlarla oyna, "Rüzgâr ver" ve "Hedefi değiştir" düğmelerini dene.',
    sure: Infinity, baslangicDeg: 15, ruzgar: null, darbe: null, gurultuAciDeg: 0, gurultuHiz: 0,
  },
  {
    no: 1, ad: 'Sakin hava', puanli: true,
    gorev: 'Dron +20° eğik başlıyor. 3 saniye içinde 0°\'ye gelip ±2° içinde kalmasını sağla.',
    sure: 8, baslangicDeg: 20, ruzgar: null, darbe: null, gurultuAciDeg: 0, gurultuHiz: 0,
    gecme: m => [
      [m.oturmaSuresi <= 3, `Oturma süresi ≤ 3 sn (senin: ${sureYaz(m.oturmaSuresi)})`],
      [!m.devrildi, 'Devrilmeden bitir'],
    ],
    agirlik: { hata: 3, asim: 0.4, oturmaHedef: 1.2, oturma: 12, titresim: 0 },
  },
  {
    no: 2, ad: 'Hafif esinti', puanli: true,
    gorev: 'Sürekli hafif bir rüzgâr dronu bir yana itiyor. Son 4 saniyede ortalama sapma 0,5°\'nin altında olsun. İpucu: sadece P ile bu sapma hiç kapanmaz…',
    sure: 12, baslangicDeg: 0,
    ruzgar: t => 0.04 + 0.008 * Math.sin(0.7 * t),
    darbe: null, gurultuAciDeg: 0, gurultuHiz: 0,
    gecme: m => [
      [Math.abs(m.sonHataOrt) < 0.5, `Son 4 sn ortalama sapma < 0,5° (senin: ${tr(m.sonHataOrt, 2)}°)`],
      [!m.devrildi, 'Devrilmeden bitir'],
    ],
    agirlik: { hata: 6, asim: 0, oturma: 0, titresim: 0, kalici: 30 },
  },
  {
    no: 3, ad: 'Ani rüzgâr', puanli: true,
    gorev: 'Rastgele rüzgâr darbeleri geliyor. Dron hiçbir zaman 6°\'den fazla sapmasın ve ortalama hata 1,5°\'nin altında kalsın.',
    sure: 15, baslangicDeg: 0, ruzgar: null,
    darbe: { aralikMin: 1.2, aralikMax: 2.4, genlikMin: 0.08, genlikMax: 0.14, sure: 0.12 },
    gurultuAciDeg: 0, gurultuHiz: 0,
    gecme: m => [
      [m.maksHata < 6, `En büyük sapma < 6° (senin: ${tr(m.maksHata, 1)}°)`],
      [m.ortHata < 1.5, `Ortalama hata < 1,5° (senin: ${tr(m.ortHata, 2)}°)`],
      [!m.devrildi, 'Devrilmeden bitir'],
    ],
    agirlik: { hata: 10, asim: 0, oturma: 0, titresim: 0, maks: 3 },
  },
  {
    no: 4, ad: 'Gürültülü sensör', puanli: true,
    gorev: 'Jiroskop ve açı sensörü gürültülü. Dron +10°\'den başlıyor. 3 saniyede otursun, ortalama hata 1,5°\'nin altında, titreşim 30\'un altında olsun. D\'yi çok artırırsan motorlar titrer!',
    sure: 12, baslangicDeg: 10, ruzgar: null, darbe: null,
    gurultuAciDeg: 0.3, gurultuHiz: 0.15,
    gecme: m => [
      [m.oturmaSuresi <= 3, `Oturma süresi ≤ 3 sn (senin: ${sureYaz(m.oturmaSuresi)})`],
      [m.ortHata < 1.5, `Ortalama hata < 1,5° (senin: ${tr(m.ortHata, 2)}°)`],
      [m.titresim < 30, `Titreşim < 30 (senin: ${tr(m.titresim, 0)})`],
      [!m.devrildi, 'Devrilmeden bitir'],
    ],
    agirlik: { hata: 6, asim: 0.1, oturma: 0, titresim: 0.8, titresimEsik: 15 },
  },
  {
    no: 5, ad: 'Fırtına', puanli: true,
    gorev: 'Hepsi birden: değişken rüzgâr, ani darbeler, gürültülü sensör. 30 saniye boyunca 15°\'yi aşmadan dengede kal; ortalama hata 2,5°\'nin altında, titreşim 40\'ın altında olsun.',
    sure: 30, baslangicDeg: 0,
    ruzgar: t => 0.05 * Math.sin(0.35 * t) + 0.025 * Math.sin(1.3 * t + 1),
    darbe: { aralikMin: 1.0, aralikMax: 2.2, genlikMin: 0.08, genlikMax: 0.15, sure: 0.12 },
    gurultuAciDeg: 0.3, gurultuHiz: 0.15,
    gecme: m => [
      [m.maksHata < 15, `En büyük sapma < 15° (senin: ${tr(m.maksHata, 1)}°)`],
      [m.ortHata < 2.5, `Ortalama hata < 2,5° (senin: ${tr(m.ortHata, 2)}°)`],
      [m.titresim < 40, `Titreşim < 40 (senin: ${tr(m.titresim, 0)})`],
      [!m.devrildi, 'Devrilmeden bitir'],
    ],
    agirlik: { hata: 6, asim: 0, oturma: 0, titresim: 0.5, titresimEsik: 20, maks: 1 },
  },
];

function sureYaz(s) { return isFinite(s) ? tr(s, 2) + ' sn' : 'oturmadı'; }
/* Sayıyı Türkçe ondalık virgülle yazar: tr(0.43, 2) → "0,43" */
function tr(x, b) { return Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b }); }

/* ---------------------------------------------------------------------
   Simulasyon — bir denemenin tüm durumunu tutar.
   new Simulasyon(seviye, {kp, ki, kd}, tohum)
   adim() her çağrıldığında zamanı DT kadar ilerletir.
   --------------------------------------------------------------------- */
class Simulasyon {
  constructor(seviye, kazanc, tohum = 12345) {
    this.seviye = seviye;
    this.kazanc = Object.assign({}, kazanc);
    this.rnd = rastgeleUretec(tohum);
    this.t = 0;
    this.teta = seviye.baslangicDeg * DERECE;   // gerçek açı
    this.omega = 0;                             // gerçek açısal hız
    this.tauMotor = 0;                          // motorların o anki torku
    this.integral = 0;                          // ∫e dt
    this.hedef = 0;                             // hedef açı [rad]
    this.u = 0;                                 // son kontrol komutu [N·m]
    this.uOnceki = 0;
    this.tauBozucu = 0;
    this.manuelDarbe = { bitis: -1, genlik: 0 };
    this.otoDarbe = { sonraki: seviye.darbe ? 1.0 : Infinity, bitis: -1, genlik: 0 };
    this.bitti = false;
    this.devrildi = false;
    // Ölçüm/puan için biriken istatistikler
    const e0 = -this.teta;
    this.ist = {
      e0, n: 0, mutlakToplam: 0, maks: 0, asimMaks: 0,
      sonDisari: 0, duDkToplam: 0, doyum: 0,
      sonToplam: 0, sonN: 0, sifirGecis: 0, sonIsaret: Math.sign(e0), gecisArasiMaks: 0,
      uMutlakToplam: 0,
    };
  }

  /* İki ölçüm: açı sensörü ve jiroskop (açısal hız). Gürültü eklenir. */
  olcum() {
    const s = this.seviye;
    return {
      teta: this.teta + (s.gurultuAciDeg ? this.rnd.gauss() * s.gurultuAciDeg * DERECE : 0),
      omega: this.omega + (s.gurultuHiz ? this.rnd.gauss() * s.gurultuHiz : 0),
    };
  }

  /* O anki bozucu tork: sürekli rüzgâr + otomatik darbeler + manuel darbe */
  bozucuHesapla() {
    const s = this.seviye, t = this.t;
    let tau = s.ruzgar ? s.ruzgar(t) : 0;
    if (s.darbe) {
      const d = this.otoDarbe;
      if (t >= d.sonraki) {
        d.bitis = t + s.darbe.sure;
        const yon = this.rnd() < 0.5 ? -1 : 1;
        d.genlik = yon * (s.darbe.genlikMin + this.rnd() * (s.darbe.genlikMax - s.darbe.genlikMin));
        d.sonraki = t + s.darbe.aralikMin + this.rnd() * (s.darbe.aralikMax - s.darbe.aralikMin);
      }
      if (t < d.bitis) tau += d.genlik;
    }
    if (t < this.manuelDarbe.bitis) tau += this.manuelDarbe.genlik;
    return tau;
  }

  /* "Rüzgâr ver" düğmesi: 0,12 saniyelik bir tork darbesi */
  ruzgarVer() {
    const yon = this.rnd() < 0.5 ? -1 : 1;
    this.manuelDarbe = { bitis: this.t + 0.12, genlik: yon * 0.13 };
  }

  /* -----------------------------------------------------------------
     adim() — tek bir simülasyon adımı (DT = 1/240 s)
     1) Ölç   2) PID hesapla   3) Motor gecikmesi   4) Fizik (Euler)
     5) İstatistik topla
     ----------------------------------------------------------------- */
  adim() {
    if (this.bitti) return;
    const P = PID_SABIT, dt = P.DT, k = this.kazanc;

    // 1) Ölçüm
    const olc = this.olcum();

    // 2) PID
    const e = this.hedef - olc.teta;
    this.integral += e * dt;
    // Anti-windup: I teriminin katkısı ±INTEGRAL_KATKI_MAKS'ı geçmesin
    if (k.ki > 1e-6) {
      const sinir = P.INTEGRAL_KATKI_MAKS / k.ki;
      this.integral = Math.max(-sinir, Math.min(sinir, this.integral));
    } else {
      this.integral = Math.max(-2, Math.min(2, this.integral));
    }
    const pTerim = k.kp * e;
    const iTerim = k.ki * this.integral;
    const dTerim = -k.kd * olc.omega;          // ölçüm üzerinden türev
    let u = pTerim + iTerim + dTerim;
    const doydu = Math.abs(u) > P.TAU_MAKS;
    u = Math.max(-P.TAU_MAKS, Math.min(P.TAU_MAKS, u));   // aktüatör sınırı
    // İlk adımda önceki komut yok: sıçramayı titreşim sayma
    this.uOnceki = this.ist.n === 0 ? u : this.u;
    this.u = u;
    this.terimler = { p: pTerim, i: iTerim, d: dTerim };

    // 3) Motor gecikmesi (birinci derece): τ += (u − τ)·dt/T
    this.tauMotor += (u - this.tauMotor) * dt / P.MOTOR_ZS;

    // 4) Fizik: J·θ'' = τ_motor + τ_bozucu − b·θ'   (yarı-örtük Euler)
    this.tauBozucu = this.bozucuHesapla();
    const ivme = (this.tauMotor + this.tauBozucu - P.B * this.omega) / P.J;
    this.omega += ivme * dt;
    this.teta += this.omega * dt;
    this.t += dt;

    // 5) İstatistik (GERÇEK açıyla; gürültüsüz)
    const eGercek = (this.hedef - this.teta) / DERECE;   // derece
    const ist = this.ist;
    ist.n++;
    ist.mutlakToplam += Math.abs(eGercek);
    if (this.t > 0.5 || this.seviye.baslangicDeg === 0) ist.maks = Math.max(ist.maks, Math.abs(eGercek));
    if (ist.e0 !== 0) ist.asimMaks = Math.max(ist.asimMaks, -eGercek * Math.sign(ist.e0));
    if (Math.abs(eGercek) > P.BANT_DEG) ist.sonDisari = this.t;
    const du = (u - this.uOnceki) / P.TAU_MAKS;
    ist.duDkToplam += du * du;
    ist.uMutlakToplam += Math.abs(u);
    if (doydu) ist.doyum++;
    // Kaç kez hedefin öbür tarafına geçti? (salınım sayısı)
    const isaret = Math.sign(eGercek);
    ist.gecisArasiMaks = Math.max(ist.gecisArasiMaks, Math.abs(eGercek));
    if (isaret !== 0 && isaret !== ist.sonIsaret) {
      if (ist.gecisArasiMaks > 0.5) ist.sifirGecis++;
      ist.sonIsaret = isaret; ist.gecisArasiMaks = 0;
    }
    // Son 4 saniye ortalaması (kalıcı hata)
    if (isFinite(this.seviye.sure) && this.t > this.seviye.sure - 4) { ist.sonToplam += eGercek; ist.sonN++; }

    // Bitiş koşulları
    if (Math.abs(this.teta) > P.DEVRILME_DEG * DERECE) { this.devrildi = true; this.bitti = true; }
    if (this.t >= this.seviye.sure) this.bitti = true;
  }

  /* Denemenin ölçütleri (puan ve geri bildirim için) */
  olcutler() {
    const ist = this.ist;
    const n = Math.max(1, ist.n);
    const sure = this.t;
    return {
      sure,
      ortHata: ist.mutlakToplam / n,                         // ortalama |hata| [°]
      maksHata: ist.maks,                                    // en büyük |hata| [°]
      asimDeg: Math.max(0, ist.asimMaks),
      asimYuzde: ist.e0 !== 0 ? Math.max(0, ist.asimMaks) / Math.abs(ist.e0 / DERECE) * 100 : 0,
      oturmaSuresi: this.devrildi || ist.sonDisari > sure - 0.5 ? Infinity : ist.sonDisari,
      // Titreşim endeksi: komutun adımdan adıma değişiminin RMS'i (×1000, birimsiz)
      titresim: Math.sqrt(ist.duDkToplam / n) * 1000,
      doyumOrani: ist.doyum / n,
      sonHataOrt: ist.sonN ? ist.sonToplam / ist.sonN : 0,  // işaretli → kalıcı sapma
      salinim: ist.sifirGecis,
      devrildi: this.devrildi,
    };
  }
}

/* ---------------------------------------------------------------------
   puanla(seviye, m) — 0–100 puan ve 0–3 yıldız.
   Puan = 100 − cezalar. Cezalar seviyenin "agirlik" ayarından gelir:
     hata    : ortalama hata (°) başına ceza
     asim    : aşım yüzdesi başına ceza
     oturma  : hedef süreyi aşan her saniye için ceza
     titresim: eşik üstü titreşim birimi başına ceza
     kalici  : son 4 sn'deki kalıcı sapma (°) başına ceza
     maks    : en büyük sapma (°) başına ceza
   Yıldız: geçemedi → 0; geçti → 1; puan ≥ 70 → 2; puan ≥ 88 → 3
   --------------------------------------------------------------------- */
function puanla(seviye, m) {
  if (m.devrildi) return { puan: 0, yildiz: 0, gecti: false, kosullar: seviye.gecme(m) };
  const a = seviye.agirlik;
  let ceza = 0;
  ceza += Math.min(45, (a.hata || 0) * m.ortHata);
  ceza += Math.min(20, (a.asim || 0) * m.asimYuzde);
  if (a.oturma) ceza += Math.min(25, a.oturma * Math.max(0, (isFinite(m.oturmaSuresi) ? m.oturmaSuresi : 10) - a.oturmaHedef));
  if (a.titresim) ceza += Math.min(25, a.titresim * Math.max(0, m.titresim - a.titresimEsik));
  if (a.kalici) ceza += Math.min(30, a.kalici * Math.abs(m.sonHataOrt));
  if (a.maks) ceza += Math.min(25, a.maks * m.maksHata);
  const puan = Math.max(0, Math.min(100, Math.round(100 - ceza)));
  const kosullar = seviye.gecme(m);
  const gecti = kosullar.every(k => k[0]);
  const yildiz = !gecti ? 0 : puan >= 88 ? 3 : puan >= 70 ? 2 : 1;
  return { puan, yildiz, gecti, kosullar };
}

/* ---------------------------------------------------------------------
   analizEt(seviye, m, kazanc) — "Neden böyle oldu?" geri bildirimi.
   Basit kurallar: ölçütlere bakıp olası nedeni ve öneriyi yazar.
   --------------------------------------------------------------------- */
function analizEt(seviye, m, k) {
  const ms = [];
  const s = seviye;
  if (m.devrildi) {
    if (k.kp < 0.05) ms.push('P neredeyse sıfır: kontrolcü hataya hiç tepki vermiyor, dron rüzgârla devrildi. P\'yi artırarak başla.');
    else if (k.kd < 0.02) ms.push('Salınımlar her seferinde büyüyerek dronu devirdi. Bu, sönüm eksikliğidir: D kazancını artır (ör. 0,05–0,15).');
    else ms.push('Dron devrildi. Kazançlardan biri çok yüksek olabilir ya da motorlar sürekli sınırda çalışıyor. P ve I\'yı biraz düşür.');
    return ms;
  }
  if (m.salinim >= 5 && m.asimYuzde > 20) {
    ms.push(`Dron hedefin etrafında ${m.salinim} kez gidip geldi (aşım ≈ %${tr(m.asimYuzde, 0)}). P yüksek ya da D düşük olabilir; D'yi biraz artırmayı dene.`);
  } else if (m.asimYuzde > 22) {
    ms.push(`Dron hedefin üstüne çıkıp geri döndü (aşım ≈ %${tr(m.asimYuzde, 0)}). P çok yüksek olabilir; D'yi biraz artırmayı dene.`);
  } else if (m.salinim >= 6) {
    ms.push(`Dron hedef etrafında ${m.salinim} kez salındı. Sönümü artırmak için D'yi biraz yükselt.`);
  }
  if (s.baslangicDeg !== 0 && m.asimYuzde < 2 && m.oturmaSuresi > 2.5) {
    ms.push('Dron hedefe çok yavaş, ağır ağır geldi. P düşük ya da D gereğinden yüksek olabilir: P\'yi artır veya D\'yi azalt.');
  }
  if (Math.abs(m.sonHataOrt) > 0.4 && s.ruzgar) {
    if (k.ki < 0.05) ms.push(`Rüzgâr dronu sürekli ${tr(Math.abs(m.sonHataOrt), 1)}° kadar itiyor ve bu sapma kapanmıyor. Bu "kalıcı hata"dır; I kazancı onu zamanla biriktirip kapatır. I'yı artır.`);
    else ms.push(`Hâlâ ${tr(Math.abs(m.sonHataOrt), 1)}° kalıcı sapma var. I'yı biraz daha artır ya da P'yi yükselt.`);
  }
  if (k.ki > 1.5 && m.asimYuzde > 25) {
    ms.push('I çok yüksek: hata birikirken dron hedefi geçip uzun bir dalga çiziyor ("integral şişmesi"). I\'yı azalt.');
  }
  if (m.titresim > 20) {
    ms.push(`Kontrol çıkışı çok titrek (titreşim ${tr(m.titresim, 0)}). Sensör gürültüsü D kazancıyla büyütülüp motorlara gidiyor. Gerçek dronda bu, motor ısınması ve görüntüde "jello" demektir. D'yi azalt.`);
  }
  if (m.doyumOrani > 0.15) {
    ms.push(`Zamanın %${tr((m.doyumOrani * 100), 0)}'ında motorlar sınırda (doyumda) çalıştı. Kazançlar o kadar büyük ki motorlar yetişemiyor; hepsini biraz düşür.`);
  }
  if (s.darbe && m.maksHata > 8) {
    ms.push(`Rüzgâr darbesi dronu ${tr(m.maksHata, 1)}° saptırdı. Darbelere karşı daha sert durmak için P'yi ve onunla birlikte D'yi artır.`);
  }
  if (!ms.length) ms.push('Güzel! Belirgin bir sorun görünmüyor. Puanı artırmak için küçük adımlarla (±%10) ince ayar yap.');
  return ms;
}

/* ---------------------------------------------------------------------
   İPUÇLARI — her seviyede sırayla açılan 3 ipucu
   --------------------------------------------------------------------- */
const IPUCLARI = {
  0: ['Önce I ve D\'yi sıfırla, yalnızca P ile oyna. Ne görüyorsun?', 'Şimdi D\'yi yavaş yavaş artır: salınım nasıl değişti?', 'Sonra "Rüzgâr ver"e bas ve I\'nın etkisini gör.'],
  1: ['Yalnızca P ile dron salıncak gibi sallanır. Salınımı ne durdurur?', 'D, değişim hızına bakıp fren yapar. D\'yi 0,05–0,15 arası dene.', 'Örnek başlangıç: P ≈ 1,0 ve D ≈ 0,10. Sonra ince ayar yap.'],
  2: ['Yalnızca P ve D ile dene. Grafikte açı hedefin biraz altında mı kalıyor?', 'Bu kalıcı sapmayı I terimi kapatır: hatayı biriktirip giderek daha fazla düzeltme yapar.', 'I\'yı 0,3–1,0 arası dene. Çok yükseltirsen dalgalanma başlar.'],
  3: ['Darbelere karşı "sert" durmak için P yüksek olmalı.', 'P\'yi artırdıkça D\'yi de artır, yoksa salınım başlar.', 'Örnek: P ≈ 2, D ≈ 0,15–0,2, I ≈ 0,5.'],
  4: ['Kontrol çıkışı grafiğine bak: titriyor mu?', 'Titreşimin kaynağı çoğunlukla D\'dir; gürültüyü büyütür. D\'yi azalt.', 'D\'yi azaltınca salınım artarsa P\'yi de biraz düşür. Denge noktasını bul.'],
  5: ['Önceki seviyelerden öğrendiklerini birleştir: P darbeler için, I rüzgâr için, D sönüm için.', 'Titreşim sınırı yüzünden D\'yi çok artıramazsın.', 'Örnek bölge: P ≈ 0,7–1,0, I ≈ 0,6–1,0, D ≈ 0,06–0,07. Oradan küçük adımlarla ilerle.'],
};

/* ---------------------------------------------------------------------
   zieglerNicholsOlc() — Ziegler–Nichols "salınım" yöntemi:
   1) I = D = 0 yap. P'yi, dron sabit genlikle (ne büyüyen ne sönen)
      salınana kadar artır. Bu P'ye "kritik kazanç" Ku denir.
   2) O andaki salınımın periyodu Tu (saniye).
   3) Klasik PID tarifi:  Kp = 0,6·Ku   Ki = 1,2·Ku/Tu   Kd = 0,075·Ku·Tu
   Bu fonksiyon bu deneyi gürültüsüz bir simülasyonda ikiye bölme
   (bisection) yöntemiyle otomatik yapar.
   --------------------------------------------------------------------- */
function sadecePDeneyi(kp, sureSn = 20) {
  const sev = { baslangicDeg: 5, sure: sureSn, ruzgar: null, darbe: null, gurultuAciDeg: 0, gurultuHiz: 0 };
  const sim = new Simulasyon(sev, { kp, ki: 0, kd: 0 }, 1);
  // Tepe noktalarını (pozitif yerel maksimumlar) bul
  const tepeler = [];
  let onceki = sim.teta, oncekiOnceki = sim.teta;
  while (!sim.bitti) {
    sim.adim();
    if (onceki > oncekiOnceki && onceki >= sim.teta && onceki > 0) tepeler.push({ t: sim.t, deger: onceki });
    oncekiOnceki = onceki; onceki = sim.teta;
  }
  return { tepeler, devrildi: sim.devrildi };
}

function zieglerNicholsOlc() {
  let alt = 0.01, ust = PID_SABIT.KP_MAKS * 2;
  let sonuc = null;
  for (let i = 0; i < 30; i++) {
    const orta = (alt + ust) / 2;
    const d = sadecePDeneyi(orta);
    const tp = d.tepeler;
    let buyuyor;
    if (d.devrildi) buyuyor = true;
    else if (tp.length < 4) buyuyor = false;
    else buyuyor = tp[tp.length - 1].deger > tp[1].deger;   // ilk tepeyi atla
    if (buyuyor) ust = orta; else alt = orta;
    if (tp.length >= 4) sonuc = { tepeler: tp };
  }
  const Ku = (alt + ust) / 2;
  const d = sadecePDeneyi(Ku, 20);
  const tp = d.tepeler;
  let Tu = NaN;
  if (tp.length >= 3) Tu = (tp[tp.length - 1].t - tp[0].t) / (tp.length - 1);
  return {
    Ku, Tu,
    kp: 0.6 * Ku,
    ki: 1.2 * Ku / Tu,
    kd: 0.075 * Ku * Tu,
  };
}

/* Tarayıcıda global, Node.js'te modül olarak sun */
const PIDFizik = { PID_SABIT, DERECE, SEVIYELER, IPUCLARI, Simulasyon, puanla, analizEt, zieglerNicholsOlc, rastgeleUretec };
if (typeof module !== 'undefined' && module.exports) { module.exports = PIDFizik; }
else { window.PIDFizik = PIDFizik; }
