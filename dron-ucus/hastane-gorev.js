/* =====================================================================
   GÖREV: HASTANEDE ACİL İLAÇ (bina içi uçuş)
   Öğretmen önerisi (Kasım 2026): "küçük dronlar camdan girip binanın içini dolaşabilsin."

   Asansör arızalı. 2. kattaki 208 numaralı odada yatan hastaya ilaç lazım.
   Dron hastanenin önündeki pedden kalkar. Turuncu çerçeveli AÇIK pencerelerden
   ya da zemin kattaki giriş kapısından içeri girer, koridorda oda numaralarını
   okuyarak 208'i bulur ve ilaç kutusunu hastanın komodininin üstüne bırakır.
   Kapalı pencerelerde cam vardır: cama çarpan dron düşer.

   Öğrettiği: dar alanda uçuş. Bir dronun genişliği = 2·kol + pervane çapı;
   kapıdan geçmek için her yanda en az bir pervane yarıçapı kadar boşluk gerekir.
   İçeride rüzgâr yoktur; GPS sinyali binada zayıflar, pilot gözle uçar.
   Ana betikten ÖNCE yüklenir; EK_GOREVLER'e eklenir.
   ===================================================================== */
(function () {
  'use strict';
  const say = (x, b = 1) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b });
  const sakla = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const getir = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const HEDEF_NO = '208';

  function hedefOda() { return SEHIR.hastane && SEHIR.hastane.odalar.find((o) => o.no === HEDEF_NO); }
  function katAdi(y) { const H = SEHIR.hastane; for (let k = 2; k >= 0; k--) if (y >= H.taban(k) - 0.2) return `${k + 1}. kat`; return 'zemin'; }

  const gorev = {
    kart: { ad: 'Hastanede acil ilaç (bina içi)', kisa: 'Asansör bozuk: 208 numaralı odaya ilaç götür. Açık pencereden ya da kapıdan içeri gir, koridorda oda numaralarını oku. Küçük dron önerilir.', ders: 'Dar alanda uçuş: genişlik = 2·kol + pervane çapı' },
    basla(g) {
      const H = SEHIR.hastane, o = hedefOda(); if (!H || !o) return;
      g.ruzgarHiz = 0; g.oda = o; g.icerde = false; g.katUyari = ''; g.girisT = null;
      // başlangıç: hastanenin güney önündeki meydan, burun binaya dönük
      const sx = H.cx - 6, sz = H.Z0 - 7, y = zeminY(sx, sz) + fz.ayak;
      uc.poz.set(sx, y, sz); uc.onceki.copy(uc.poz); uc.yaw = Math.PI; uc._son = null; kameraAni = true;
      pedA.position.set(sx, zeminY(sx, sz) + 0.01, sz);
      // hedef: komodinin üstünde yeşil ilaç pedi ve küçük ilaç kutusu
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.28, 28), new THREE.MeshBasicMaterial({ color: '#3ddc97', transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -3 }));
      p.rotation.x = -Math.PI / 2; p.position.set(o.komodin.x, o.komodin.y + 0.006, o.komodin.z); gorevGrubu.add(p); g.ped = p;
      g.hedef = new THREE.Vector3(o.komodin.x, o.komodin.y + 0.3, o.komodin.z);
      // dronun altında küçük ilaç kutusu (yalnız görünüş; kütlesi 40 g, ihmal edilir)
      const kutu = new THREE.Mesh(new THREE.BoxGeometry(fz.kol * 0.6, fz.kol * 0.3, fz.kol * 0.45), new THREE.MeshStandardMaterial({ color: '#f4f6fb' }));
      const hac = new THREE.Mesh(new THREE.BoxGeometry(fz.kol * 0.22, 0.002, fz.kol * 0.06), new THREE.MeshBasicMaterial({ color: '#d8343b' })); hac.position.y = fz.kol * 0.151; kutu.add(hac);
      kutu.position.set(0, -fz.ayak * 0.6, 0); dron.add(kutu); g.kutu3 = kutu;
      const gen = 2 * fz.kol + fz.t.pervaneCap * 0.0254;
      g.genislik = gen;
      bildir(`Dronunun genişliği ${say(gen * 100, 0)} cm. Pencere 220 cm, oda kapıları 160 cm. Turuncu çerçeveli pencereler açık.`, 4200);
      if (gen > 1.2) setTimeout(() => { if (gorevD === g) bildir('Bu dron kapılar için çok geniş olabilir: Mikro ya da Sinematik dron dene.', 3000); }, 4400);
    },
    adim(g, dt) {
      const u = uc, H = SEHIR.hastane, o = g.oda; if (!H || !o) return;
      if (g.ped) g.ped.material.opacity = 0.55 + 0.35 * Math.sin(u.zaman * 4);
      const ic = SEHIR.icMekan(u.poz);
      if (ic && !g.icerde) { g.icerde = true; g.girisT = g.sure; bildir('Hastanedesin! Koridorda oda numaralarına bak; 208 ikinci katta. Merdiven boşluğu doğu uçta.', 3200); }
      if (ic) { const k = katAdi(u.poz.y); if (k !== g.katUyari) { g.katUyari = k; if (g.girisT !== g.sure) bildir(k, 900); } }
      if (u.yerde && u.gaz < 0.12 && u.zaman > 1.5) {
        const d = Math.hypot(u.poz.x - o.komodin.x, u.poz.z - o.komodin.z), y = zeminY(u.poz.x, u.poz.z, u.poz.y);
        if (d < 0.45 && Math.abs(y - o.komodin.y) < 0.08) bitir(true);
      }
    },
    hud(g) {
      const u = uc, o = g.oda; if (!o) return { hedef: 'Hastane bulunamadı.', ek: '' };
      const ic = SEHIR.icMekan(u.poz);
      return {
        hedef: ic ? `İçeridesin (${katAdi(u.poz.y)}). 208 numaralı odayı bul, ilacı komodindeki yeşil pede bırak.` : 'Hastaneye gir: turuncu çerçeveli açık pencerelerden ya da zemin kattaki kapıdan.',
        ek: `Dron genişliği <b>${say(g.genislik * 100, 0)} cm</b> · Kapı <b>160 cm</b> · Uzaklık <b>${say(Math.hypot(u.poz.x - o.komodin.x, u.poz.y - o.komodin.y, u.poz.z - o.komodin.z), 0)} m</b>`,
      };
    },
    bitir(g, olcum) {
      const pay = (1.6 - g.genislik) / 2, iceri = g.girisT == null ? null : g.sure - g.girisT;
      const anahtar = 'dronSim.hastane.' + ayar.sablon, eski = getir(anahtar), yeni = !g.hile && (!eski || g.sure < eski);
      if (yeni) sakla(anahtar, Math.round(g.sure * 10) / 10);
      olcum.push(['Dron genişliği', say(g.genislik * 100, 0) + ' cm'], ['Kapıda iki yandaki boşluk', say(Math.max(0, pay) * 100, 0) + ' cm']);
      if (iceri != null) olcum.push(['İçeride geçen süre', say(iceri, 1) + ' s']);
      olcum.push(['Rekor (bu dron)', say(yeni ? g.sure : eski, 1) + ' s']);
      return {
        baslik: yeni ? 'Yeni rekor! İlaç zamanında ulaştı' : 'İlaç 208 numaralı odada',
        metin: `Hasta ilacını aldı. Dronunun pervane uçları arası genişliği <b>${say(g.genislik * 100, 0)} cm</b>: iki kol boyu artı bir pervane çapı. 160 cm'lik oda kapısından geçerken her yanda yalnızca <b>${say(Math.max(0, pay) * 100, 0)} cm</b> boşluk vardı. Bina içinde rüzgâr yoktur ama GPS sinyali duvarlardan geçerken zayıflar; gerçek iç mekân dronları bu yüzden kameralarla ya da optik akış sensörüyle yerini tutar. Küçük ve pervane korumalı dronlar dar koridorların ustasıdır.`,
        formul: `genişlik = 2·L + D = 2 · ${say(fz.kol * 100, 0)} cm + ${say(fz.t.pervaneCap * 2.54, 0)} cm ≈ ${say(g.genislik * 100, 0)} cm`,
      };
    },
    kapat() { pedA.position.set(0, 0.005, 0); },
  };
  window.EK_GOREVLER = Object.assign(window.EK_GOREVLER || {}, { hastane: gorev });
})();
