/* Öğretmen Masası: bağlantılar ilerleme/seviye taşır; kayıt kodu okuyucu (bellekte, gönderilmez). */
import { kodCoz, hataMetni } from '../cekirdek/kayit-kodu.mjs';
import { DOSYALAR, ODALAR, RUTBELER, rutbeSirasi, sayim } from '../cekirdek/dosyalar.mjs';
import { baglantilariGuncelle } from '../bilesenler/durum.mjs';

const $ = (s) => document.querySelector(s);
const NO = { lobi: '000-A' };
const odaNo = { sezar: 1, kasa: 2, murekkep: 3 };
const dosyaNo = (d) => (d.oda === 'lobi' ? NO.lobi : String(odaNo[d.oda] * 100 + (d.bit - (odaNo[d.oda] - 1) * 7)));

function oku() {
  const s = kodCoz($('#okuKod').value);
  const sonuc = $('#okuSonuc'), kap = $('#okuTablo');
  sonuc.className = 'geri-bildirim';
  if (!s.tamam) { sonuc.textContent = hataMetni(s); sonuc.classList.add('olumsuz'); kap.hidden = true; return; }
  const say = sayim(s.maske);
  sonuc.textContent = say.toplam + ' / ' + DOSYALAR.length + ' dosya · rütbe: ' + RUTBELER[rutbeSirasi(s.maske)].ad;
  sonuc.classList.add('olumlu');
  kap.innerHTML = '';
  const gruplar = [{ id: 'lobi', ad: 'Lobi' }, ...ODALAR];
  for (const g of gruplar) {
    const h = document.createElement('h3'); h.textContent = g.ad; kap.appendChild(h);
    const ul = document.createElement('ul'); ul.className = 'dosya-listesi';
    for (const d of DOSYALAR.filter((x) => x.oda === g.id)) {
      const li = document.createElement('li');
      const coz = (s.maske & (1 << d.bit)) !== 0;
      li.className = coz ? 'cozuldu' : '';
      li.textContent = dosyaNo(d) + ' · ' + d.ad + ' · ' + { cirak: 'Çırak', uzman: 'Uzman', kapanis: 'Kapanış', giris: 'Giriş' }[d.tur] + ' — ' + (coz ? 'çözüldü' : 'açık');
      ul.appendChild(li);
    }
    kap.appendChild(ul);
  }
  kap.hidden = false;
}
$('#okuDugme').addEventListener('click', oku);
$('#okuKod').addEventListener('keydown', (e) => { if (e.key === 'Enter') oku(); });

baglantilariGuncelle();
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
