/* =====================================================================
   GÖREV BAĞLAYICI — kriptoloji/bilesenler/gorev.js
   Bir dosya bölümünü (section.dosya[data-dosya]) cevap kontrolüne bağlar:
   • Metin cevabı:  .cevap-satir içinde input + [data-kontrol] düğmesi
   • Optik seçenek: .secici[data-secenekler] içinde button[data-secenek]
   kontrol(girdi) → { dogru: bool, mesaj: 'geri bildirim' }  (ya da bunu veren bir Promise)
   Doğruysa dosya çözülür (durum.js) ve ÇÖZÜLDÜ damgası basılır.
   ===================================================================== */
import { coz, cozulduMu, dinle } from './durum.js';
import { damgala } from './damga.js';
import { buyukHarf, normalle } from '../cekirdek/turkce-alfabe.js';
import { cal } from './ses.js';

/** Karşılaştırma için: Türkçe büyük harf, yalnız harf ve rakamlar, tek boşluk. */
export function sadele(metin) {
  return buyukHarf(normalle(metin)).replace(/[^A-ZÇĞİÖŞÜ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** CSS animasyonunu baştan oynat (aynı sınıf yeniden eklenince tarayıcı animasyonu tekrarlamaz). */
function yenidenOynat(el, sinif) {
  if (!el) return;
  el.classList.remove(sinif);
  void el.offsetWidth;            // tarayıcıyı yeniden hesaplamaya zorla: animasyon sıfırlanır
  el.classList.add(sinif);
}

/**
 * Cevap geri bildirimi: doğruysa yeşil yazı + zil; yanlışsa yanıp sönen "TEKRAR DENE" etiketi,
 * kaçıncı deneme olduğu, sarsılan kutu ve kısa "dıt dıt" sesi. Aynı yanlışı ikinci kez yazan
 * öğrenci de bir şeyin değiştiğini görür (deneme sayısı artar, etiket yeniden yanıp söner).
 * hedef: { girdi: input, secilen: button } → sarsılacak öğe.
 */
export function geriBildir(sonuc, { dogru, mesaj }, { girdi = null, secilen = null } = {}) {
  if (dogru) {
    sonuc.dataset.deneme = '0';
    sonuc.className = 'geri-bildirim olumlu';
    sonuc.textContent = mesaj;
    if (girdi) girdi.classList.remove('yanlis-girdi');
    cal('dogru');
    return;
  }
  const n = Number(sonuc.dataset.deneme || 0) + 1;
  sonuc.dataset.deneme = String(n);
  sonuc.className = 'geri-bildirim olumsuz';
  sonuc.textContent = '';
  const etiket = document.createElement('span');
  etiket.className = 'tekrar-etiket';
  etiket.textContent = n > 1 ? 'Tekrar dene · ' + n + '. deneme' : 'Tekrar dene';
  sonuc.append(etiket, ' ', mesaj);
  yenidenOynat(etiket, 'yanip-son');
  const sarsilan = girdi || secilen;
  if (sarsilan) yenidenOynat(sarsilan, 'sarsil');
  if (girdi) {
    girdi.classList.add('yanlis-girdi');
    // fareli bilgisayarda imleç kutuya döner; telefonda klavye açılıp mesajı örtmesin diye dokunulmaz
    if (matchMedia('(pointer: fine)').matches) girdi.focus({ preventScroll: true });
  }
  cal('hata');
}

export function gorevBagla(bolum, kontrol) {
  const bit = Number(bolum.dataset.dosya);
  const sonuc = bolum.querySelector('.geri-bildirim');
  const bildir = (s, hedef = {}) => {
    if (s && typeof s.then === 'function') { s.then((x) => bildir(x, hedef)); return; }
    if (!s) return;
    geriBildir(sonuc, s, hedef);
    if (s.dogru && !cozulduMu(bit)) { damgala(bolum); coz(bit); }
  };
  const girdi = bolum.querySelector('.cevap-satir input');
  const dugme = bolum.querySelector('[data-kontrol]');
  if (girdi && dugme) {
    const dene = () => {
      if (!girdi.value.trim()) { sonuc.className = 'geri-bildirim'; sonuc.textContent = 'Önce cevabını yaz.'; yenidenOynat(girdi, 'sarsil'); girdi.focus(); return; }
      bildir(kontrol(girdi.value), { girdi });
    };
    dugme.addEventListener('click', dene);
    girdi.addEventListener('keydown', (e) => { if (e.key === 'Enter') dene(); });
    girdi.addEventListener('input', () => girdi.classList.remove('yanlis-girdi'));
  }
  bolum.querySelectorAll('[data-secenekler] button[data-secenek]').forEach((b, _, hepsi) => {
    b.addEventListener('click', () => {
      hepsi.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      bildir(kontrol(b.dataset.secenek), { secilen: b });
    });
  });
  dinle(() => { if (cozulduMu(bit)) damgala(bolum, { duyur: false }); });
  return { bildir };
}
