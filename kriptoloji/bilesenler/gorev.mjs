/* =====================================================================
   GÖREV BAĞLAYICI — kriptoloji/bilesenler/gorev.mjs
   Bir dosya bölümünü (section.dosya[data-dosya]) cevap kontrolüne bağlar:
   • Metin cevabı:  .cevap-satir içinde input + [data-kontrol] düğmesi
   • Optik seçenek: .secici[data-secenekler] içinde button[data-secenek]
   kontrol(girdi) → { dogru: bool, mesaj: 'geri bildirim' }
   Doğruysa dosya çözülür (durum.mjs) ve ÇÖZÜLDÜ damgası basılır.
   ===================================================================== */
import { coz, cozulduMu, dinle } from './durum.mjs';
import { damgala } from './damga.mjs';
import { buyukHarf, normalle } from '../cekirdek/turkce-alfabe.mjs';

/** Karşılaştırma için: Türkçe büyük harf, yalnız harf ve rakamlar, tek boşluk. */
export function sadele(metin) {
  return buyukHarf(normalle(metin)).replace(/[^A-ZÇĞİÖŞÜ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function gorevBagla(bolum, kontrol) {
  const bit = Number(bolum.dataset.dosya);
  const sonuc = bolum.querySelector('.geri-bildirim');
  const bildir = (s) => {
    sonuc.className = 'geri-bildirim ' + (s.dogru ? 'olumlu' : 'olumsuz');
    sonuc.textContent = s.mesaj;
    if (s.dogru && !cozulduMu(bit)) { damgala(bolum); coz(bit); }
  };
  const girdi = bolum.querySelector('.cevap-satir input');
  const dugme = bolum.querySelector('[data-kontrol]');
  if (girdi && dugme) {
    const dene = () => {
      if (!girdi.value.trim()) { sonuc.className = 'geri-bildirim'; sonuc.textContent = 'Önce cevabını yaz.'; return; }
      bildir(kontrol(girdi.value));
    };
    dugme.addEventListener('click', dene);
    girdi.addEventListener('keydown', (e) => { if (e.key === 'Enter') dene(); });
  }
  bolum.querySelectorAll('[data-secenekler] button[data-secenek]').forEach((b, _, hepsi) => {
    b.addEventListener('click', () => {
      hepsi.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      bildir(kontrol(b.dataset.secenek));
    });
  });
  dinle(() => { if (cozulduMu(bit)) damgala(bolum, { duyur: false }); });
  return { bildir };
}
