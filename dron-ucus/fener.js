/* =====================================================================
   YÖNLENDİRİLEBİLİR ARAMA FENERİ (gimbal)
   Öğretmen önerisi (Kasım 2026): "ışığı kumandadan sağa sola, aşağı yukarı
   çevirebilsin; yakınlaştırıp genişletebilsin, odaklayabilsin."

   Gerçek arama dronlarındaki gibi fener dronun altında, iki eksenli bir gimbalda:
     • yatay dönüş (pan)  : dronun burnuna göre −90° … +90°
     • eğim (tilt)        : 0° ufka bakar … 90° dik aşağı bakar
     • zoom (demet açısı) : yarım açı 6° (dar, uzağa) … 40° (geniş, yakına)
     • odak               : keskin kenarlı ya da yumuşak kenarlı ışık
   Fiziği: fenerin ışık akısı Φ sabittir. Demet daraldıkça aynı ışık daha küçük bir
   katı açıya (Ω) toplanır, ışık şiddeti artar:  I = Φ / Ω,  Ω = 2π(1 − cos θ).
   Zemindeki aydınlık yine E = I / d². Dar demet uzağa yeter ama küçük bir yeri
   aydınlatır; geniş demet çok yeri görür ama sönüktür.

   Tuşlar: Q/E yatay, Z/X eğim, N dar (zoom), M geniş, B odak, 0 sıfırla.
   Gamepad: yön tuşları yatay/eğim, LB/RB zoom. Dokunmatik: ekrandaki fener paneli.
   Ana betikten ÖNCE yüklenir; değişkenlere yalnız çağrı anında erişir.
   ===================================================================== */
(function () {
  'use strict';
  const D = Math.PI / 180;
  const PHI = 636;                       // lümen: 26°'lik demette 1000 cd verir (eski sabit fener)
  const YARI_MIN = 6 * D, YARI_MAX = 40 * D;
  const F = {
    pan: 0, egim: 90 * D, yari: 26 * D, keskin: false,
    hizPan: 70 * D, hizEgim: 55 * D,
    omega() { return 2 * Math.PI * (1 - Math.cos(F.yari)); },
    I() { return PHI / F.omega(); },     // kandela
    // demetin dünya koordinatındaki yönü (birim vektör), dronun yaw açısına göre
    yon(yaw, hedef) {
      const a = yaw + F.pan, c = Math.cos(F.egim);
      return (hedef || new THREE.Vector3()).set(-Math.sin(a) * c, -Math.sin(F.egim), -Math.cos(a) * c);
    },
    // p noktası demetin içinde mi? Dönen: { ic, aci, d, E }
    isik(u, p) {
      const v = new THREE.Vector3().subVectors(p, u.poz), d = v.length();
      const ax = F.yon(u.yaw), aci = Math.acos(Math.max(-1, Math.min(1, ax.dot(v) / Math.max(d, 1e-6))));
      return { ic: aci < F.yari, aci, d, E: F.I() / Math.max(d * d, 0.01) };
    },
    // eğik demetin zemine değdiği yer ve oradaki aydınlık (HUD için)
    zemin(u, h) {
      if (F.egim < 3 * D) return { d: Infinity, E: 0, r: 0 };
      const d = h / Math.sin(F.egim);
      return { d, E: F.I() / (d * d), r: d * Math.tan(F.yari) };
    },
    sifirla(gorev) { F.pan = 0; F.egim = (gorev === 'kurtarma' ? 90 : 40) * D; F.yari = 26 * D; F.keskin = false; },
  };

  /* ---------- girdi ---------- */
  const basili = {};
  const dokun = { pan: 0, egim: 0, zoom: 0 };
  addEventListener('keydown', (e) => {
    if (typeof durum === 'undefined' || durum !== 'ucus' || !geceAcik) return;
    if (e.code === 'KeyB') { F.keskin = !F.keskin; bildir('Fener odağı: ' + (F.keskin ? 'keskin kenar' : 'yumuşak kenar'), 900); }
    if (e.code === 'Digit0') { F.sifirla(gorevD && gorevD.tip); bildir('Fener ortalandı', 800); }
  });
  function guncelle(dt) {
    if (typeof tus === 'undefined') return;
    let p = (tus.KeyE ? 1 : 0) - (tus.KeyQ ? 1 : 0), t = (tus.KeyZ ? 1 : 0) - (tus.KeyX ? 1 : 0), z = (tus.KeyM ? 1 : 0) - (tus.KeyN ? 1 : 0);
    const gp = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : null;
    if (gp && gp.buttons.length > 15) {
      const b = (i) => (gp.buttons[i] && gp.buttons[i].pressed ? 1 : 0);
      p += b(15) - b(14); t += b(13) - b(12); z += b(5) - b(4);
    }
    p += dokun.pan; t += dokun.egim; z += dokun.zoom;
    if (p) F.pan = Math.max(-90 * D, Math.min(90 * D, F.pan - p * F.hizPan * dt));
    if (t) F.egim = Math.max(0, Math.min(90 * D, F.egim + t * F.hizEgim * dt));
    if (z) F.yari = Math.max(YARI_MIN, Math.min(YARI_MAX, F.yari * Math.exp(z * 1.1 * dt)));
  }

  /* ---------- görünüm: spot ışığı, demet konisi, panel ---------- */
  let koni = null;
  function ciz(u) {
    if (!dronFar) return;
    const ax = F.yon(u.yaw);
    dronFar.position.copy(u.poz).addScaledVector(ax, 0.05);
    dronFar.target.position.copy(u.poz).addScaledVector(ax, 10);
    const oran = (2 * Math.PI * (1 - Math.cos(26 * D))) / F.omega();   // 26°'ye göre ne kadar yoğun
    dronFar.angle = F.yari;
    dronFar.penumbra = F.keskin ? 0.08 : 0.55;
    dronFar.intensity = 2.2 * Math.pow(oran, 0.55);
    dronFar.distance = Math.min(140, 40 * Math.sqrt(oran));
    // demet konisi: havadaki toz ve nem ışığı gösterir (gece arama ışığının görünen "çubuğu")
    if (!koni) {
      koni = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 28, 1, true), new THREE.MeshBasicMaterial({ color: '#dfe9ff', transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: true }));
      koni.geometry.translate(0, -0.5, 0); koni.geometry.rotateX(-Math.PI / 2);   // tepe orijinde, gövde +z… sonra lookAt ile çevrilir
      koni.renderOrder = 4; sahne.add(koni);
    }
    const L = Math.min(dronFar.distance * 0.5, 30), R = L * Math.tan(F.yari);
    koni.visible = dronFar.visible;
    koni.position.copy(dronFar.position); koni.scale.set(R, R, L);
    koni.lookAt(dronFar.position.x + ax.x, dronFar.position.y + ax.y, dronFar.position.z + ax.z);
    koni.material.opacity = (F.keskin ? 0.09 : 0.06) * Math.min(1.6, Math.pow(oran, 0.25));
  }
  function panel(goster) {
    let p = document.getElementById('fenerP');
    if (!p) {
      if (!goster) return;
      p = document.createElement('div'); p.id = 'fenerP'; p.className = 'panel';
      p.innerHTML = `<b class="fp-bas">FENER</b>
        <div class="fp-izgara">
          <button data-f="egim:-1" aria-label="Feneri yukarı kaldır">▲</button>
          <button data-f="pan:-1" aria-label="Feneri sola çevir">◀</button><button data-f="sifir" aria-label="Feneri ortala">●</button><button data-f="pan:1" aria-label="Feneri sağa çevir">▶</button>
          <button data-f="egim:1" aria-label="Feneri aşağı indir">▼</button>
        </div>
        <div class="fp-zoom"><button data-f="zoom:-1" aria-label="Demeti daralt (yakınlaştır)">Dar</button><button data-f="zoom:1" aria-label="Demeti genişlet">Geniş</button><button data-f="odak" aria-label="Odağı değiştir">Odak</button></div>
        <div class="fp-bilgi num" id="fenerBilgi"></div>`;
      document.getElementById('hud').append(p);
      const bas = (e) => {
        const b = e.target.closest('[data-f]'); if (!b) return; e.preventDefault();
        const [ad, v] = b.dataset.f.split(':');
        if (ad === 'sifir') { F.sifirla(gorevD && gorevD.tip); return; }
        if (ad === 'odak') { F.keskin = !F.keskin; return; }
        dokun[ad] = +v; b.setPointerCapture && b.setPointerCapture(e.pointerId);
      };
      const birak = () => { dokun.pan = dokun.egim = dokun.zoom = 0; };
      p.addEventListener('pointerdown', bas); p.addEventListener('pointerup', birak); p.addEventListener('pointercancel', birak); p.addEventListener('pointerleave', birak);
      const st = document.createElement('style');
      st.textContent = `#fenerP{pointer-events:auto;position:absolute;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(170px + env(safe-area-inset-bottom,0px));padding:8px 10px;display:flex;flex-direction:column;gap:6px;align-items:center;z-index:11;touch-action:none;user-select:none}
#fenerP .fp-bas{font:700 11px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.14em;color:#ffd98a}
#fenerP .fp-izgara{display:grid;grid-template-columns:repeat(3,38px);grid-template-rows:repeat(3,34px);gap:3px}
#fenerP .fp-izgara button:nth-child(1){grid-area:1/2}#fenerP .fp-izgara button:nth-child(2){grid-area:2/1}#fenerP .fp-izgara button:nth-child(3){grid-area:2/2}#fenerP .fp-izgara button:nth-child(4){grid-area:2/3}#fenerP .fp-izgara button:nth-child(5){grid-area:3/2}
#fenerP button{border-radius:8px;border:1px solid var(--cizgi);background:rgba(255,255,255,.08);font-weight:700;font-size:14px;padding:0}
#fenerP .fp-zoom{display:flex;gap:4px}#fenerP .fp-zoom button{padding:5px 8px;font-size:12px}
#fenerP .fp-bilgi{font-size:11.5px;color:var(--soluk);text-align:center;line-height:1.35}
@media (max-width:760px){#fenerP{bottom:auto;top:calc(120px + env(safe-area-inset-top,0px))}}`;
      document.head.append(st);
    }
    p.hidden = !goster;
  }
  let bilgiT = 0;
  F.adim = function (dt) {
    const acik = typeof durum !== 'undefined' && durum === 'ucus' && geceAcik && uc && !uc.dustu;
    panel(acik);
    if (koni && !acik) koni.visible = false;
    if (!acik) return;
    guncelle(dt); ciz(uc);
    bilgiT -= dt;
    if (bilgiT <= 0) {
      bilgiT = 0.15;
      const b = document.getElementById('fenerBilgi');
      if (b) b.innerHTML = `yön ${Math.round(-F.pan / D)}° · eğim ${Math.round(F.egim / D)}°<br>demet ${Math.round(2 * F.yari / D)}° · ${Math.round(F.I()).toLocaleString('tr-TR')} cd`;
    }
  };
  window.FENER = F;
})();
