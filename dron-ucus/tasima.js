/* =====================================================================
   KARGO DRONU: TAŞIMA TURU
   Öğretmen ve öğrenci önerisi (Kasım 2026): "yük taşıyan dron kediyi ve başka
   paketleri bir yerden bir yere götürsün."

   Üç iş, sırayla:
     1) İlaç paketi (0,3 kg)  : eczane deposu → apartman çatısı
     2) Kitap kolisi (1,2 kg) : okul bahçesi → batıdaki ev
     3) Pamuk, taşıma kutusunda (3,0 kg) : Pamuk'un evi → veteriner
   Yükü almak için pedin üstüne in; yük dronun altına asılır, kütle artar,
   itki/ağırlık düşer, hover gazı yükselir, akım artar. İtki/ağırlık 1,3'ün altına
   düşecekse dron yükü kaldıramaz (o iş atlanır, sonuçta neden yazılır).
   Öğrettiği: hover gücü kütlenin 1,5. kuvvetiyle büyür: P ≈ W^1,5 / √(2ρA).

   Ana betikten ÖNCE yüklenir; EK_GOREVLER'e eklenir. Ana betiğin değişkenlerine
   (THREE, uc, fz, gorevD, ayar, fizikHazirla, gorevGrubu, bildir …) yalnızca
   çağrı anında erişir.
   ===================================================================== */
(function () {
  'use strict';
  const say = (x, b = 1) => Number(x).toLocaleString('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b });
  const TWR_ALT = 1.3;
  const ISLER = [
    { ad: 'İlaç paketi', kisa: 'ilaç paketini', kg: 0.3, boy: [0.22, 0.13, 0.16], renk: '#f4f6fb', serit: '#d8343b',
      al: { x: 6, z: -7, ad: 'eczane deposundaki' }, ver: { x: -102, z: 13, ad: 'apartmanın çatısındaki' } },
    { ad: 'Kitap kolisi', kisa: 'kitap kolisini', kg: 1.2, boy: [0.32, 0.2, 0.24], renk: '#b98b55', serit: '#e3c79a',
      al: { x: -31, z: -14, ad: 'okul bahçesindeki' }, ver: { x: -118, z: 19.5, ad: 'batıdaki evin bahçesindeki' } },
    { ad: 'Pamuk (taşıma kutusunda)', kisa: 'Pamuk\'u', kg: 3.0, boy: [0.36, 0.34, 0.54], kedi: true,
      al: { x: -86, z: 19.5, ad: 'Pamuk\'un evinin önündeki' }, ver: { x: -24, z: 9.5, ad: 'veteriner kliniğinin önündeki' } },
  ];

  /* ---------- veteriner kliniği (kasabaya kalıcı olarak eklenir) ---------- */
  function klinikYap() {
    if (typeof sahne === 'undefined' || klinikYap.tamam) return; klinikYap.tamam = true;
    const x = -24, z = 16, w = 6, d = 4.5, h = 3.2;
    const M = (r, o) => new THREE.MeshStandardMaterial(Object.assign({ color: r, roughness: 0.8 }, o));
    const g = new THREE.Group(); sahne.add(g);
    const govde = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M('#eaf3ef')); govde.position.set(x, h / 2, z); govde.castShadow = govde.receiveShadow = true; g.add(govde);
    const cati = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.25, d + 0.4), M('#2f8a5a')); cati.position.set(x, h + 0.12, z); g.add(cati);
    const kapi = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.05), M('#a9cbe0', { roughness: 0.2 })); kapi.position.set(x, 1.05, z - d / 2 - 0.02); g.add(kapi);
    // tabela: yeşil artı ve VETERİNER yazısı
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const t = c.getContext('2d');
    t.fillStyle = '#2f8a5a'; t.fillRect(0, 0, 512, 128); t.fillStyle = '#fff';
    t.fillRect(28, 52, 64, 24); t.fillRect(48, 32, 24, 64);
    t.font = '700 58px Onest, Arial'; t.textBaseline = 'middle'; t.fillText('VETERİNER', 112, 68);
    const dk = new THREE.CanvasTexture(c); dk.encoding = THREE.sRGBEncoding;
    const tabela = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), new THREE.MeshStandardMaterial({ map: dk, emissive: '#ffffff', emissiveMap: dk, emissiveIntensity: 0.25 }));
    tabela.position.set(x, h - 0.55, z - d / 2 - 0.03); tabela.rotation.y = Math.PI; g.add(tabela);
    KUTULAR.push({ x0: x - w / 2 - 0.2, x1: x + w / 2 + 0.2, z0: z - d / 2 - 0.2, z1: z + d / 2 + 0.2, y0: 0, ust: h + 0.25, ad: 'ev' });
  }
  addEventListener('DOMContentLoaded', klinikYap);

  /* ---------- pedler, ışık sütunu, yük modelleri ---------- */
  function pedYap(renk, harf) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = renk; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 50, 0, 7); x.stroke();
    x.fillStyle = '#fff'; x.font = 'bold 54px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(harf, 64, 68);
    const d = new THREE.CanvasTexture(c); d.encoding = THREE.sRGBEncoding;
    const m = new THREE.Mesh(new THREE.CircleGeometry(1.4, 40), new THREE.MeshStandardMaterial({ map: d, transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
  }
  function sutunYap(renk) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 26, 24, 1, true), new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
    m.renderOrder = 2; return m;
  }
  function yukYap(is) {
    const [w, h, d] = is.boy, g = new THREE.Group();
    if (is.kedi) {   // taşıma kutusu: gri gövde, ızgaralı kapı, içinde Pamuk
      const M = new THREE.MeshStandardMaterial({ color: '#8d98a6', roughness: 0.6 });
      const tab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), M); tab.position.y = -h / 2 + 0.015; g.add(tab);
      const ust = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), M); ust.position.y = h / 2 - 0.015; g.add(ust);
      for (const s of [-1, 1]) { const yan = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, d), M); yan.position.x = s * (w / 2 - 0.015); g.add(yan); }
      // iki uç da ızgaralı kapı: kamera hangi yandan bakarsa baksın Pamuk görünür
      const cub = new THREE.MeshStandardMaterial({ color: '#d7dde4', metalness: 0.7, roughness: 0.3 });
      for (const uc of [-1, 1]) {
        for (let i = -3; i <= 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, h - 0.04, 6), cub); c.position.set(i * w / 8, 0, uc * (d / 2 - 0.01)); g.add(c); }
        const cer = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, 0.02), cub); cer.position.set(0, 0, uc * (d / 2 - 0.01)); g.add(cer);
      }
      const sap = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), M); sap.position.y = h / 2; g.add(sap);
      if (window.KURTARMA && KURTARMA.vanKedisi) { const k = KURTARMA.vanKedisi(); k.scale.setScalar(0.6); k.position.set(0, -h / 2 + 0.03, 0.02); k.userData.halka.visible = false; g.add(k); g.userData.kedi = k; }
    } else {
      const kutu = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: is.renk, roughness: 0.85 })); g.add(kutu);
      const s = new THREE.Mesh(new THREE.BoxGeometry(w + 0.004, h * 0.18, d + 0.004), new THREE.MeshStandardMaterial({ color: is.serit, roughness: 0.7 })); g.add(s);
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  /* ---------- görev ---------- */
  function guc(t, kg) { const f = fizikHazirla({ ...t, ekYukG: t.ekYukG + kg * 1000 }); return f; }

  function basla(g) {
    g.ruzgarHiz = 2; g.is = 0; g.yukte = false; g.kayit = []; g.enerji = 0; g.isBas = { t: 0, E: 0 }; g.kalkBekle = false;
    g.tBos = { ...fz.t }; g.fzBos = fz; g.ayakBos = fz.ayak;
    g.pedler = ISLER.map((is) => {
      const yA = zeminY(is.al.x, is.al.z), yV = zeminY(is.ver.x, is.ver.z);
      const a = pedYap('#e0662a', 'AL'), v = pedYap('#2b7bd6', is.kedi ? '+' : 'VER');
      a.position.set(is.al.x, yA + 0.02, is.al.z); v.position.set(is.ver.x, yV + 0.02, is.ver.z); gorevGrubu.add(a, v);
      const yuk = yukYap(is); yuk.position.set(is.al.x + 1.9, yA + is.boy[1] / 2, is.al.z); gorevGrubu.add(yuk);
      return { a, v, yA, yV, yuk };
    });
    g.sutun = sutunYap('#ffb04a'); gorevGrubu.add(g.sutun);
    hedefGuncelle(g);
    bildir(`3 iş var. İlk iş: ${ISLER[0].kisa} turuncu AL pedinden al. ${dokunmatik ? '' : 'T: otomatik kalkış'}`, 3000);
  }
  function hedefGuncelle(g) {
    const is = ISLER[g.is]; if (!is) { g.hedef = null; g.sutun.visible = false; return; }
    const p = g.pedler[g.is], yer = g.yukte ? is.ver : is.al, y = g.yukte ? p.yV : p.yA;
    g.hedef = new THREE.Vector3(yer.x, y + 0.5, yer.z);
    g.sutun.position.set(yer.x, y + 13, yer.z); g.sutun.material.color.set(g.yukte ? '#5aa2ff' : '#ffb04a'); g.sutun.visible = true;
  }
  function yukAl(g) {
    const is = ISLER[g.is], f2 = guc(g.tBos, is.kg);
    if (!f2.ucabilir || f2.TWR < TWR_ALT) {
      g.kayit.push({ is, atlandi: true, twr: f2.TWR });
      bildir(`Dron ${is.kisa} kaldıramaz: yükle itki/ağırlık ${say(f2.TWR, 2)} olur, en az ${say(TWR_ALT, 1)} gerek. Bu iş atlandı.`, 4200);
      sonrakiIs(g); return;
    }
    const p = g.pedler[g.is], yuk = p.yuk, h = is.boy[1];
    gorevGrubu.remove(yuk); yuk.position.set(0, -fz.ayak - h / 2 + 0.01, 0); yuk.rotation.set(0, 0, 0); dron.add(yuk);
    f2.ayak = g.ayakBos + h; uc.poz.y += h;
    fz = f2; hoverIzKonum();
    g.yukte = true; g.isBas = { t: g.sure, E: g.enerji, twr: f2.TWR, hover: f2.hoverGaz, P: f2.PelHover };
    bildir(`${is.ad} alındı (+${say(is.kg, 1)} kg). İtki/ağırlık ${say(g.fzBos.TWR, 1)} → ${say(f2.TWR, 1)}. Mavi pede götür.`, 3000);
    hedefGuncelle(g);
  }
  function yukBirak(g) {
    const is = ISLER[g.is], p = g.pedler[g.is], yuk = p.yuk, h = is.boy[1];
    dron.remove(yuk); yuk.position.set(is.ver.x + 1.6, p.yV + h / 2, is.ver.z); yuk.rotation.y = uc.yaw; gorevGrubu.add(yuk);
    uc.poz.y = Math.max(p.yV + g.ayakBos, uc.poz.y - h);
    fz = g.fzBos; fz.ayak = g.ayakBos; hoverIzKonum();
    g.kayit.push({ is, sure: g.sure - g.isBas.t, E: g.enerji - g.isBas.E, twr: g.isBas.twr, hover: g.isBas.hover, P: g.isBas.P });
    g.yukte = false;
    if (is.kedi) {
      bildir('Pamuk veterinerde! Kontrolü yapıldı: sapasağlam.', 3000);
      dispatchEvent(new CustomEvent('kasif-olay', { detail: { olay: 'tasima-pamuk' } }));
    } else bildir(`${is.ad} teslim edildi.`, 1800);
    sonrakiIs(g);
  }
  function sonrakiIs(g) {
    g.is++; g.kalkBekle = true;
    if (g.is >= ISLER.length) { g.sutun.visible = false; g.hedef = null; setTimeout(() => { if (gorevD === g && !g.bitti) bitir(true); }, 900); return; }
    hedefGuncelle(g);
    setTimeout(() => { if (gorevD === g && !g.bitti) bildir(`Sıradaki iş: ${ISLER[g.is].kisa} ${ISLER[g.is].al.ad} turuncu AL pedinden al.`, 2600); }, 2200);
  }
  function adim(g, dt) {
    const u = uc;
    g.enerji += u.I * fz.t.hucre * u.Vh * dt;
    const yuk = g.yukte && g.pedler[g.is] && g.pedler[g.is].yuk;
    if (yuk) { yuk.rotation.z = -u.roll * 0.25; yuk.rotation.x = u.pitch * 0.25; if (yuk.userData.kedi && window.KURTARMA) KURTARMA.kediCanlandir(yuk.userData.kedi, dt, false, true); }
    if (g.sutun) g.sutun.material.opacity = 0.12 + 0.06 * Math.sin(u.zaman * 3);
    if (!u.yerde) g.kalkBekle = false;
    const is = ISLER[g.is]; if (!is || g.kalkBekle || !u.yerde || u.gaz > 0.12 || u.zaman < 1) return;
    const yer = g.yukte ? is.ver : is.al, y = g.yukte ? g.pedler[g.is].yV : g.pedler[g.is].yA;
    if (Math.hypot(u.poz.x - yer.x, u.poz.z - yer.z) < 1.8 && Math.abs(zeminY(u.poz.x, u.poz.z, u.poz.y) - y) < 0.3) { if (g.yukte) yukBirak(g); else yukAl(g); }
  }
  function hud(g) {
    const is = ISLER[g.is];
    if (!is) return { hedef: 'Bütün işler bitti.', ek: '' };
    const yer = g.yukte ? is.ver : is.al;
    return {
      hedef: `İş ${g.is + 1}/3 · ${g.yukte ? `${is.ad} yüklü: ${yer.ad} mavi pede in.` : `${is.ad} (${say(is.kg, 1)} kg): ${yer.ad} turuncu AL pedine in.`}`,
      ek: `Yük <b>${g.yukte ? say(is.kg, 1) + ' kg' : 'yok'}</b> · İtki/ağırlık <b>${say(fz.TWR, 2)}</b> · Hover gazı <b>%${say(fz.hoverGaz * 100, 0)}</b> · Harcanan <b>${say(g.enerji / 1000, 1)} kJ</b>`,
    };
  }
  function sonuc(g, olcum) {
    const bitenler = g.kayit.filter((k) => !k.atlandi), atlananlar = g.kayit.filter((k) => k.atlandi);
    const bos = g.fzBos, mBos = bos.m;
    let metin = `3 işten <b>${bitenler.length}</b> tanesini teslim ettin${atlananlar.length ? `, ${atlananlar.length} iş atlandı` : ''}. `;
    const enAgir = bitenler.reduce((a, b) => (!a || b.is.kg > a.is.kg ? b : a), null);
    if (enAgir) {
      const m2 = mBos + enAgir.is.kg, oranM = m2 / mBos, oranP = enAgir.P / bos.PelHover;
      metin += `${enAgir.is.ad} yüklüyken dronun kütlesi <b>${say(oranM, 2)} katına</b> çıktı, havada durmak için gereken güç ise <b>${say(oranP, 2)} katına</b> (${say(bos.PelHover, 0)} W → ${say(enAgir.P, 0)} W). Güç kütleden daha hızlı artar: pervane, daha ağır bir dronu tutmak için havayı hem daha çok hem daha hızlı itmek zorundadır. İdeal hover gücü kütlenin 1,5. kuvvetiyle büyür. Kargo dronlarının menzili bu yüzden yük arttıkça hızla kısalır.`;
    }
    if (atlananlar.length) metin += ` <b>${atlananlar.map((k) => k.is.ad).join(', ')}</b> için dronun gücü yetmedi (itki/ağırlık ${atlananlar.map((k) => say(k.twr, 2)).join(', ')}; en az ${say(TWR_ALT, 1)} gerek). Menüden <b>Yük taşıyıcı 10 inç</b> dronu seç ya da <a href="../dron-lab/index.html">Dron Laboratuvarı</a>'nda kendi kargo dronunu tasarla.`;
    g.kayit.forEach((k, i) => olcum.push([`${i + 1}. ${k.is.ad}`, k.atlandi ? 'atlandı' : `${say(k.sure, 0)} s · ${say(k.E / 1000, 1)} kJ`]));
    olcum.push(['Toplam enerji', say(g.enerji / 1000, 1) + ' kJ']);
    let baslik = atlananlar.length ? 'Tur bitti, bir iş eksik kaldı' : 'Bütün yükler yerinde!';
    if (!atlananlar.length && !g.hile) {
      const anahtar = 'dronSim.tasima.' + ayar.sablon, eski = getir(anahtar);
      if (!eski || g.sure < eski) { sakla(anahtar, Math.round(g.sure * 10) / 10); baslik = 'Yeni rekor! Bütün yükler yerinde'; }
      olcum.push(['Rekor (bu dron)', say(Math.min(g.sure, eski || Infinity), 1) + ' s']);
    }
    return { baslik, metin, formul: 'P_hover ≈ W^1,5 / √(2·ρ·A)   ·   TWR = T_maks / (m·g)' };
  }
  const sakla = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const getir = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

  const tasima = {
    kart: { ad: 'Kargo dronu: taşıma turu', kisa: 'İlaç paketini, kitap kolisini ve Pamuk\'u taşıma kutusunda veterinere götür. Her yük dronu ağırlaştırır; ağır yük için güçlü dron gerek.', ders: 'Yük, itki/ağırlık ve güç (P ∝ m^1,5)' },
    basla, adim, hud, bitir: sonuc,
    kapat() {},
  };
  window.EK_GOREVLER = Object.assign(window.EK_GOREVLER || {}, { tasima });
})();
