/* =====================================================================
   GÖREV: BİLSEM'İ GEZ (bina içi)
   Okulun bahçesinden kalk, açık bir pencereden ya da giriş kapısından içeri gir,
   sekiz atölyeyi ziyaret et: her atölyenin ortasında dönen bir halka var, içinden
   geç. Atölyeler istediğin sırayla gezilir; katlar arasında koridorun doğu
   ucundaki merdiven boşluğundan geçilir.
   Ana betikten ÖNCE yüklenir; EK_GOREVLER'e eklenir.
   ===================================================================== */
(function () {
  'use strict';
  const say = (x, b = 1) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b });
  const sakla = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const getir = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const BILGI = {
    mat: 'Matematik Atölyesi: tahtada Pisagor bağıntısı var. Dronun eğim açısı da bir üçgenle hesaplanır.',
    fen: 'Fen Bilimleri Atölyesi: deney masaları. İtki, ağırlık, sürtünme: dron uçarken hepsi burada öğrendiğin kuvvetler.',
    bilisim: 'Bilişim Atölyesi: bilgisayarların başında kod yazılır. Otonom rota görevindeki bloklar da bir programdır.',
    yz: 'Yapay Zekâ Atölyesi: tahtadaki sinir ağı veriden öğrenir. Bir modelin adil ve güvenli olup olmadığını sorgulamak da işin parçası.',
    zeka: 'Zekâ Oyunları Atölyesi: satranç tahtaları hazır. Turnuva saat 14.00\'te!',
    dron: 'Dron ve Robotik Atölyesi: masadaki küçük dronlar burada tasarlanıp toplanır.',
    ing: 'İngilizce Atölyesi: "I fly a drone every weekend." Dron kelimeleri: wing, battery, propeller.',
    edb: 'Türk Dili ve Edebiyatı Atölyesi: bugünün konusu şiirde ölçü ve uyak.',
  };
  const gorev = {
    kart: { ad: 'BİLSEM\'i gez (bina içi)', kisa: 'Okula açık bir pencereden ya da kapıdan gir; 8 atölyedeki dönen halkalardan geç. Kat değiştirmek için merdiven boşluğunu kullan. Küçük dron önerilir.', ders: 'Dar alanda hassas uçuş' },
    basla(g) {
      g.ruzgarHiz = 0; g.ziyaret = new Set(); g.icerde = false;
      const sx = -38, sz = -17;
      uc.poz.set(sx, fz.ayak, sz); uc.onceki.copy(uc.poz); uc.yaw = 0; uc._son = null; kameraAni = true;
      pedA.position.set(sx, 0.01, sz);
      g.duraklar = OKUL.duraklar().map((d) => {
        const h = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 10, 40), new THREE.MeshBasicMaterial({ color: '#ffb04a', transparent: true, opacity: 0.9 }));
        h.position.set(d.x, d.y, d.z); gorevGrubu.add(h);
        return Object.assign({}, d, { h, tamam: false });
      });
      g.hedef = null;
      const gen = 2 * fz.kol + fz.t.pervaneCap * 0.0254;
      bildir(`Hoş geldin! Dronun ${say(gen * 100, 0)} cm, kapılar 110 cm.`, 3200);
    },
    adim(g, dt) {
      const u = uc;
      const ic = OKUL.icMekan(u.poz);
      if (ic && !g.icerde) { g.icerde = true; bildir('Okulun içindesin. Kapıların üstündeki tabelalara bak!', 2400); }
      let en = null, enD = Infinity;
      for (const d of g.duraklar) {
        d.h.rotation.y += dt * 1.6; d.h.rotation.x = 0.4 * Math.sin(u.zaman * 1.2 + d.x);
        if (d.tamam) continue;
        const dist = Math.hypot(u.poz.x - d.x, u.poz.y - d.y, u.poz.z - d.z);
        if (dist < 0.75) {
          d.tamam = true; g.ziyaret.add(d.tur); d.h.material.color.set('#3ddc97'); d.h.material.opacity = 0.35;
          bildir(`${g.ziyaret.size}/${g.duraklar.length} · ${BILGI[d.tur] || d.ad}`, 4200);
          if (g.ziyaret.size === g.duraklar.length) { setTimeout(() => { if (gorevD === g && !g.bitti) bitir(true); }, 600); }
        } else if (dist < enD) { enD = dist; en = d; }
      }
      g.hedef = en ? new THREE.Vector3(en.x, en.y, en.z) : null; g.enYakin = en;
    },
    hud(g) {
      const u = uc, en = g.enYakin;
      return {
        hedef: OKUL.icMekan(u.poz) ? `Atölyeleri gez: ${g.ziyaret.size}/${g.duraklar.length}. ${en ? `En yakın: ${en.ad} (${en.k === 0 ? 'zemin kat' : en.k + '. kat'})` : ''}` : 'Okula gir: turuncu çerçeveli açık pencerelerden ya da giriş kapısından.',
        ek: `Ziyaret <b>${g.ziyaret.size}/${g.duraklar.length}</b>` + (en ? ` · Uzaklık <b>${say(Math.hypot(u.poz.x - en.x, u.poz.y - en.y, u.poz.z - en.z), 0)} m</b>` : ''),
      };
    },
    bitir(g, olcum) {
      const anahtar = 'dronSim.okul.' + ayar.sablon, eski = getir(anahtar), yeni = !g.hile && (!eski || g.sure < eski);
      if (yeni) sakla(anahtar, Math.round(g.sure * 10) / 10);
      olcum.push(['Gezilen atölye', `${g.ziyaret.size}/${g.duraklar.length}`], ['Rekor (bu dron)', say(yeni ? g.sure : eski, 1) + ' s']);
      return {
        baslik: yeni ? 'Yeni rekor! Bütün atölyeler gezildi' : 'Bütün atölyeler gezildi',
        metin: `Sekiz atölyeyi <b>${say(g.sure, 1)} s</b>'de gezdin. Bina içinde rüzgâr yoktur ama her şey çok yakındır: bir kapıdan geçmek, bir kat yukarı çıkmak hassas gaz ve küçük eğim ister. İç mekânda GPS çalışmaz; gerçek iç mekân dronları yerlerini kamerayla (optik akış) ya da mesafe sensörleriyle tutar. Bir dronun bir kapıdan geçebilmesi için genişliği (2·kol + pervane çapı) kapıdan dar olmalı, her yanda da pay kalmalıdır.`,
        formul: 'genişlik = 2·L + D   ·   kapı payı = (kapı − genişlik) / 2',
      };
    },
    kapat() { pedA.position.set(0, 0.005, 0); },
  };
  window.EK_GOREVLER = Object.assign(window.EK_GOREVLER || {}, { okul: gorev });
})();
