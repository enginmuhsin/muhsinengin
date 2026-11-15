/* Görüş kutusu paneli: yalnız sayac_yonetici listesindeki hesap okuyabilir (gorus/kurulum.sql).
   Mesajlar her zaman textContent ile yazılır (HTML olarak değil): kötü niyetli bir mesaj sayfada kod çalıştıramaz. */
(function () {
  'use strict';
  var sb = supabase.createClient('https://kfpziysmsajqidkzaawh.supabase.co', 'sb_publishable_jzoa489kAPGEComqCF2JSQ_N8gjKPjC');
  var $ = function (id) { return document.getElementById(id); };
  var veri = [], filtre = 'okunmamis';
  var ROL = { ogrenci: 'Öğrenci', ogretmen: 'Öğretmen', veli: 'Veli', diger: 'Diğer' };
  var el = function (ad, sinif, metin) { var e = document.createElement(ad); if (sinif) e.className = sinif; if (metin != null) e.textContent = metin; return e; };

  async function basla() {
    var s = (await sb.auth.getSession()).data.session;
    $('girisKutu').hidden = !!s; $('panel').hidden = !s;
    if (s) yukle();
  }
  $('giris').onsubmit = async function (e) {
    e.preventDefault(); $('girisHata').textContent = '';
    var r = await sb.auth.signInWithPassword({ email: $('eposta').value.trim(), password: $('sifre').value });
    if (r.error) { $('girisHata').textContent = 'Giriş olmadı: e-posta ya da şifre hatalı.'; return; }
    basla();
  };
  $('cikis').onclick = async function () { await sb.auth.signOut(); basla(); };
  $('yenile').onclick = yukle;
  document.querySelectorAll('.filtre').forEach(function (b) {
    b.onclick = function () {
      filtre = b.dataset.filtre;
      document.querySelectorAll('.filtre').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      ciz();
    };
  });

  async function yukle() {
    $('panelHata').textContent = '';
    var r = await sb.rpc('gorus_liste');
    if (r.error) {
      $('panelHata').textContent = /yetki/.test(r.error.message) ? 'Bu hesabın okuma yetkisi yok (sayac_yonetici listesinde değil).'
        : /gorus_liste|function/.test(r.error.message) ? 'Görüş kutusu henüz kurulmamış: gorus/kurulum.sql dosyasını Supabase SQL Editor\'da çalıştır.'
        : 'Veri alınamadı: ' + r.error.message;
      return;
    }
    veri = r.data || []; ciz(); kasifYukle();
  }

  /* Kâşifler Duvarı onayı (kasif/kurulum.sql) */
  async function kasifYukle() {
    var kutu = $('kasifListe'); kutu.textContent = '';
    var r = await sb.rpc('kasif_yonetim');
    if (r.error) { kutu.append(el('p', 'bos', /kasif_yonetim|function/.test(r.error.message) ? 'Duvar henüz kurulmamış: kasif/kurulum.sql dosyasını Supabase SQL Editor\'da çalıştır.' : 'Veri alınamadı: ' + r.error.message)); return; }
    var l = r.data || [];
    if (!l.length) { kutu.append(el('p', 'bos', 'Henüz gönderim yok.')); return; }
    l.forEach(function (d) {
      var k = el('article', 'gorus' + (d.onay ? '' : ' okunmamis')), ust = el('div', 'ust');
      var s = d.sure, sure = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      ust.append(el('b', null, new Date(d.zaman).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })), el('span', null, d.tur === 'takim' ? 'Takım' : 'Tek başına'), el('span', null, 'süre ' + sure), el('span', 'yol', d.bolum));
      var islem = el('div', 'islem');
      var onay = el('button', d.onay ? 'ikincil' : '', d.onay ? 'Onayı kaldır' : 'Onayla');
      onay.onclick = async function () { var x = await sb.rpc('kasif_onay', { p_id: d.id, p_onay: !d.onay }); if (!x.error) kasifYukle(); };
      var sil = el('button', 'ikincil', 'Sil');
      sil.onclick = async function () { if (sil.dataset.emin !== '1') { sil.dataset.emin = '1'; sil.textContent = 'Emin misin?'; return; } var x = await sb.rpc('kasif_sil', { p_id: d.id }); if (!x.error) kasifYukle(); };
      islem.append(onay, sil);
      k.append(ust, el('p', 'mesaj', d.ad + (d.uyeler ? ' · ' + d.uyeler : '')), islem);
      kutu.append(k);
    });
  }

  function tas(sayi, yazi) { var d = el('div', 'tas'); d.append(el('b', null, sayi), el('span', null, yazi)); return d; }

  function ciz() {
    var puanlar = veri.filter(function (g) { return g.puan; }).map(function (g) { return g.puan; });
    var ort = puanlar.length ? (puanlar.reduce(function (a, b) { return a + b; }, 0) / puanlar.length).toFixed(1).replace('.', ',') : '–';
    var t = $('tasler'); t.textContent = '';
    t.append(tas(String(veri.length), 'görüş (son 400 gün)'), tas(String(veri.filter(function (g) { return !g.okundu; }).length), 'okunmamış'), tas(ort, 'ortalama puan'));

    var liste = $('liste'); liste.textContent = '';
    var gosterilen = veri.filter(function (g) { return filtre === 'hepsi' || !g.okundu; });
    if (!gosterilen.length) { liste.append(el('p', 'bos', filtre === 'hepsi' ? 'Henüz görüş yok.' : 'Okunmamış görüş yok.')); return; }
    gosterilen.forEach(function (g) {
      var k = el('article', 'gorus' + (g.okundu ? '' : ' okunmamis'));
      var ust = el('div', 'ust');
      ust.append(el('b', null, new Date(g.zaman).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })),
        el('span', null, ROL[g.rol] || g.rol), el('span', null, g.puan ? g.puan + ' / 5' : 'puansız'), el('span', 'yol', g.sayfa || 'genel'));
      var islem = el('div', 'islem');
      var oku = el('button', 'ikincil', g.okundu ? 'Okunmadı yap' : 'Okundu');
      oku.onclick = async function () { var r = await sb.rpc('gorus_okundu', { p_id: g.id, p_okundu: !g.okundu }); if (!r.error) { g.okundu = !g.okundu; ciz(); } };
      var sil = el('button', 'ikincil', 'Sil');
      sil.onclick = async function () {
        if (sil.dataset.emin !== '1') { sil.dataset.emin = '1'; sil.textContent = 'Emin misin? Geri alınamaz'; return; }
        var r = await sb.rpc('gorus_sil', { p_id: g.id });
        if (!r.error) { veri = veri.filter(function (x) { return x.id !== g.id; }); ciz(); }
      };
      islem.append(oku, sil);
      k.append(ust, el('p', 'mesaj', g.mesaj), islem);
      liste.append(k);
    });
  }

  basla();
})();
