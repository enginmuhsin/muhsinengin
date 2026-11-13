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
    veri = r.data || []; ciz();
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
