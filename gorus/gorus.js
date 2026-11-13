/* =====================================================================
   GÖRÜŞ FORMU — gorus/gorus.js
   Tek ağ isteği: Supabase'teki gorus_gonder fonksiyonu (gorus/kurulum.sql).
   Ad, e-posta, çerez, tarayıcı deposu yok. Hangi sayfadan gelindiği ?sayfa= ile gelir.
   ===================================================================== */
(function () {
  'use strict';
  var URL_ = 'https://kfpziysmsajqidkzaawh.supabase.co/rest/v1/rpc/gorus_gonder';
  var ANAHTAR = 'sb_publishable_jzoa489kAPGEComqCF2JSQ_N8gjKPjC'; // herkese açık anahtar; güvenlik veritabanında
  var $ = function (id) { return document.getElementById(id); };
  var acilis = Date.now();
  var rol = null, puan = null;

  // Hangi sayfadan gelindi? (?sayfa=/kriptoloji/sezar/) — listede yoksa seçenek olarak eklenir
  var gelen = new URLSearchParams(location.search).get('sayfa');
  if (gelen && /^\/([a-z0-9-]+\/)*([a-z0-9-]+\.html)?$/.test(gelen) && gelen.length <= 80) {
    var sec = $('sayfa'), var_ = false;
    for (var i = 0; i < sec.options.length; i++) if (sec.options[i].value === gelen) var_ = true;
    if (!var_) { var o = document.createElement('option'); o.value = gelen; o.textContent = 'Bu sayfa: ' + gelen; sec.insertBefore(o, sec.options[1]); }
    sec.value = gelen;
    var geri = $('geriDon'); geri.href = gelen; geri.textContent = 'Geldiğin sayfaya dön';
  }

  function seciciBagla(kapId, nitelik, ata) {
    var dugmeler = $(kapId).querySelectorAll('button');
    dugmeler.forEach(function (b) {
      b.addEventListener('click', function () {
        var zatenSecili = b.getAttribute('aria-pressed') === 'true';
        dugmeler.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        // Puan isteğe bağlı: aynı yuvarlağa ikinci kez basınca seçim kalkar
        if (zatenSecili && nitelik === 'puan') { ata(null); return; }
        b.setAttribute('aria-pressed', 'true');
        ata(b.dataset[nitelik]);
      });
    });
  }
  seciciBagla('rolSec', 'rol', function (v) { rol = v; });
  seciciBagla('puanSec', 'puan', function (v) { puan = v ? Number(v) : null; });

  var mesaj = $('mesaj');
  mesaj.addEventListener('input', function () { $('sayacYazi').textContent = mesaj.value.length + ' / 1500'; });

  // Kişisel bilgi uyarısı: e-posta ya da telefon numarasına benzeyen bir şey varsa nazikçe hatırlat
  function kisiselBilgiVarMi(m) {
    return /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(m) || /(\+?90|0)?\s*5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/.test(m);
  }

  var sonuc = $('sonuc'), gonder = $('gonder');
  function yaz(metin, olumlu) { sonuc.textContent = metin; sonuc.className = 'geri-bildirim ' + (olumlu ? 'olumlu' : 'olumsuz'); }

  $('form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if ($('web').value) return;                         // tuzak alan doldurulmuş: bot
    if (!rol) { yaz('Lütfen önce kim olduğunu seç (öğrenci, öğretmen, veli ya da diğer).'); $('rolSec').querySelector('button').focus(); return; }
    var m = mesaj.value.trim();
    if (m.length < 3) { yaz('Mesaj kutusu boş görünüyor.'); mesaj.focus(); return; }
    if (kisiselBilgiVarMi(m) && !gonder.dataset.onay) {
      gonder.dataset.onay = '1';
      yaz('Mesajında e-posta ya da telefon numarasına benzeyen bir şey var. Silmeni öneririm; yine de göndermek istersen bir kez daha bas.');
      return;
    }
    if (Date.now() - acilis < 2500) { yaz('Biraz yavaş: bir saniye sonra yeniden dene.'); return; }

    gonder.disabled = true; gonder.textContent = 'Gönderiliyor…';
    try {
      var r = await fetch(URL_, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANAHTAR, Authorization: 'Bearer ' + ANAHTAR },
        body: JSON.stringify({ p_sayfa: $('sayfa').value || null, p_rol: rol, p_puan: puan, p_mesaj: m }),
        credentials: 'omit', referrerPolicy: 'no-referrer'
      });
      var d = r.ok ? await r.json() : null;
      if (d === 'tamam') { $('form').hidden = true; $('tesekkur').hidden = false; $('tesekkur').querySelector('h2').focus(); return; }
      yaz({
        tekrar: 'Bu mesaj zaten ulaşmış görünüyor. Teşekkürler!',
        sinir: 'Kutu bugün çok doldu; lütfen yarın yeniden dene.',
        gecersiz: 'Mesaj gönderilemedi: lütfen alanları kontrol et (mesaj en az 3, en çok 1500 karakter).'
      }[d] || 'Şu an gönderilemedi. İnternet bağlantını kontrol edip yeniden dene.');
    } catch (h) {
      yaz('Şu an gönderilemedi. İnternet bağlantını kontrol edip yeniden dene.');
    }
    gonder.disabled = false; gonder.textContent = 'Gönder';
  });
})();
