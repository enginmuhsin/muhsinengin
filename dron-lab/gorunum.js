/* =====================================================================
   DRON GÖRÜNÜMÜ — dron-lab/gorunum.js
   Tasarım Laboratuvarı ile Uçuş Simülatörü'nün ortak "boya kataloğu".
   Buradaki seçimler yalnız GÖRÜNÜMÜ değiştirir; kütle, itki, uçuş süresi
   gibi fizik sonuçlarına hiçbir etkisi yoktur (hesap.js bunları okumaz).

   Tasarımdaki alanlar (hepsi sayı, bağlantıya yazılabilsin diye):
     gStil    : 0 otomatik (tasarımdan) · 1 açık karbon · 2 kabuklu (gezgin)
     gKol     : 0 X · 1 uzun X · 2 ölü kedi (dört motorlu dronlarda)
     gRenk    : gövde / kabuk rengi
     gVurgu   : motor kapağı, şerit, kayış rengi
     gLed     : kol altı LED rengi
     gPervane : pervane rengi (0 = tipine göre)
     gNo      : yarış numarası (0 = yok, 1–99)
   ===================================================================== */
(function (kok) {
  'use strict';
  const G = {
    stil: ['Otomatik (tasarımdan)', 'Açık karbon (yarış)', 'Kabuklu (gezgin)'],
    kol: ['X', 'Uzun X (stretch)', 'Ölü kedi (deadcat)'],
    renk: [['İnci beyazı', '#e7ecf2'], ['Gece siyahı', '#2a2f37'], ['Lacivert', '#1d3b8b'], ['Kırmızı', '#c8323b'],
      ['Turuncu', '#e0662a'], ['Orman yeşili', '#2f7a4f'], ['Gök mavisi', '#4aa3df'], ['Güneş sarısı', '#e9b21e']],
    vurgu: [['Turuncu', '#e08a1e'], ['Kırmızı', '#e0434c'], ['Mavi', '#2f5bd0'], ['Yeşil', '#2fae6a'], ['Mor', '#7a4fd6'], ['Beyaz', '#f0f2f5']],
    led: [['Turuncu', '#ff9a3c'], ['Mavi', '#3aa8ff'], ['Yeşil', '#3ddc97'], ['Mor', '#b46bff'], ['Kırmızı', '#ff4d5e'], ['Beyaz', '#f4f8ff']],
    pervane: [['Tipine göre', null], ['Turuncu', '#e8650f'], ['Siyah', '#24282f'], ['Beyaz', '#eef1f5'], ['Lacivert', '#25409a'], ['Şeffaf', '#cfe3f5']],
    sec(liste, i, yedek) { const s = liste[Math.max(0, Math.min(liste.length - 1, i | 0))]; return (s && s[1]) || yedek; },
    // dört motorlu dronda motorların burun yönüne göre açıları (derece, saat yönünde)
    acilar(t, gorselTip) {
      if ((+t.motorSayisi || 4) !== 4) return null;
      const k = t.gKol | 0;
      if (k === 1) return [35, 145, 215, 325];
      if (k === 2) return [62, 150, 210, 298];
      if (gorselTip === 'gezgin') return [52, 128, 232, 308];
      return null;
    },
    // görünen gövde ailesi: fizik tipi + öğrencinin stil seçimi
    tip(t, fizikTipi) {
      const s = t.gStil | 0;
      if (s === 2 && (fizikTipi === 'yaris' || fizikTipi === 'uzun')) return 'gezgin';
      if (s === 1 && fizikTipi === 'uzun') return 'yaris';
      return fizikTipi;
    },
    VARSAYILAN: { gStil: 0, gKol: 0, gRenk: 0, gVurgu: 0, gLed: 0, gPervane: 0, gNo: 0 },
  };
  kok.DronGorunum = G;
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(typeof window !== 'undefined' ? window : globalThis);
