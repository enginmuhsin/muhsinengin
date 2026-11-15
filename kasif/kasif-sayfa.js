/* Kâşif Defteri sayfası: başlangıç (mod seçimi), defter (istasyonlar, parola, kasa) ve Kâşifler Duvarı.
   Durum ortak/kasif.js'te; bu dosya yalnız sayfayı çizer. Duvara giden adlar her zaman textContent ile yazılır. */
(function () {
  'use strict';
  var K = window.KASIF; if (!K) return;
  var $ = function (id) { return document.getElementById(id); };
  var URL_ = 'https://kfpziysmsajqidkzaawh.supabase.co/rest/v1/rpc/';
  var ANAHTAR = 'sb_publishable_jzoa489kAPGEComqCF2JSQ_N8gjKPjC';   // herkese açık anahtar; güvenlik veritabanında
  var MOD_AD = { bireysel: 'Tek başına', kaptan: 'Takım kaptanı', uye: 'Takım üyesi' };
  var secilenMod = null, sureZaman = null;
  var el = function (ad, sinif, metin) { var e = document.createElement(ad); if (sinif) e.className = sinif; if (metin != null) e.textContent = metin; return e; };
  var temizAd = function (s) { return String(s || '').replace(/[^A-Za-z0-9ÇĞİÖŞÜçğıöşüÂâÎîÛû ._-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24); };
  function sureYaz(ms) { var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sn = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sn).padStart(2, '0'); }

  /* ---------- başlangıç ---------- */
  document.querySelectorAll('#modSec [data-mod]').forEach(function (b) {
    b.onclick = function () {
      secilenMod = b.dataset.mod;
      document.querySelectorAll('#modSec [data-mod]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('.mod-aciklama').forEach(function (d) { d.hidden = d.dataset.ac !== secilenMod; });
      $('baslat').disabled = false; $('baslatHata').textContent = '';
    };
  });
  $('baslat').onclick = function () {
    var h = $('baslatHata'); h.className = 'geri-bildirim olumsuz';
    if (secilenMod === 'bireysel') {
      var ad = temizAd($('adBireysel').value); if (ad.length < 2) { h.textContent = 'En az 2 harflik bir takma ad yaz.'; return; }
      K.basla('bireysel', ad);
    } else if (secilenMod === 'kaptan') {
      var t = temizAd($('takimAdi').value); if (t.length < 2) { h.textContent = 'Takımına bir ad ver (en az 2 harf).'; return; }
      var u = $('uyeler').value.split(',').map(temizAd).filter(function (x) { return x.length >= 2; }).slice(0, 5);
      K.basla('kaptan', t, t, u);
    } else if (secilenMod === 'uye') {
      K.basla('uye', temizAd($('takimAdiUye').value), temizAd($('takimAdiUye').value));
    } else return;
    ciz(); scrollTo({ top: $('defter').offsetTop - 20, behavior: 'smooth' });
  };

  /* ---------- defter ---------- */
  function ciz() {
    var st = K.oku();
    $('baslangic').hidden = !!st; $('defter').hidden = !st;
    clearInterval(sureZaman);
    if (!st) return;
    $('kimlik').textContent = MOD_AD[st.mod] + (st.ad ? ' · ' + st.ad : '') + (st.mod === 'kaptan' && st.uyeler.length ? ' · ' + st.uyeler.join(', ') : '');
    var n = K.kacTane(st); $('ilerleme').textContent = n + '/' + K.ISTASYON.length;
    var sureEl = $('sure'), tik = function () { sureEl.textContent = sureYaz((st.bitti || Date.now()) - st.basla); };
    tik(); if (!st.bitti && st.mod !== 'uye') sureZaman = setInterval(tik, 1000);
    if (st.mod === 'uye') sureEl.textContent = 'kaptanda';
    // pullar
    var p = $('pullar'); p.textContent = '';
    K.ISTASYON.forEach(function (i) { var s = el('span', st.parcalar[i.id] ? 'var' : '', i.ikon); p.append(s); });
    // istasyonlar
    var ol = $('istasyonlar'); ol.textContent = '';
    K.ISTASYON.forEach(function (i) {
      var bitti = !!st.parcalar[i.id], li = el('li', bitti ? 'tamam' : '');
      var ust = el('div', 'ist-ust'); ust.append(el('b', null, i.ikon + ' ' + i.ad), el('span', 'ist-yer', i.yer)); li.append(ust);
      li.append(el('p', 'ist-gorev', i.gorev));
      if (i.id === 's1' && !bitti) { li.append(el('div', 'sifreli', K.SIFRELI_NOT)); }
      if (bitti) { var pul = el('span', 'ist-pul', i.kelime); pul.append(el('small', null, 'kasa rakamı ' + i.rakam)); li.append(pul); }
      else {
        var d = el('details', 'ist-ipucu'); d.append(el('summary', null, 'İpucu'), el('p', null, i.ipucu)); li.append(d);
        var a = el('a', null, i.id === 's1' ? 'Sezar Çarkı\'nı aç →' : i.yer + ' →'); a.href = i.adres; li.append(a);
      }
      ol.append(li);
    });
    // parola kutusu
    $('parolaEtiket').textContent = st.mod === 'bireysel' ? 'Şifreli nottaki parolayı yaz' : st.mod === 'kaptan' ? 'Parola yaz (senin çözdüğün ya da takım arkadaşının söylediği)' : 'Şifreli nottaki parolayı yaz';
    document.querySelector('.parola-kutu').hidden = !!st.bitti || n === K.ISTASYON.length;
    // kasa
    var kasaVar = st.mod !== 'uye';
    $('kasa').hidden = !kasaVar || !!st.bitti;
    $('kasa').classList.toggle('kilitli', n < K.ISTASYON.length);
    $('kasaKod').disabled = $('kasaAc').disabled = n < K.ISTASYON.length;
    $('kasaNot').textContent = n < K.ISTASYON.length ? 'Kasa kilitli: önce beş parçanın hepsini topla (' + n + '/' + K.ISTASYON.length + ').' : 'Beş kasa rakamını görevlerin sırasıyla (1\'den 5\'e) yaz.';
    if (st.mod === 'uye') { $('kasa').hidden = true; }
    // final
    $('final').hidden = !st.bitti;
    if (st.bitti) {
      var ad = st.mod === 'kaptan' ? st.takim + ' takımı' : st.ad;
      $('finalMetin').textContent = 'Kasa açıldı, aşı kartı yerinde. Pamuk aşısını olup evine döndü. ' + ad + ', Bölüm 1\'i ' + sureYaz(st.bitti - st.basla) + ' sürede bitirdi. Şifre çözdün, ışık ve sesle iz sürdün, kargo dronu tasarlayıp uçurdun ve bir kodu en az tahminle kırdın.';
      $('duvaraYaz').hidden = !!st.gonderildi;
      if (st.gonderildi) { $('duvarSonuc').className = 'geri-bildirim olumlu'; $('duvarSonuc').textContent = 'Duvara gönderildi; öğretmen onaylayınca görünecek.'; }
    }
  }
  $('parolaGonder').onclick = function () {
    var r = K.kelimeDene($('parola').value), s = $('parolaSonuc');
    var msj = {
      tamam: ['olumlu', r.ist ? '"' + r.ist.ad + '" parçası deftere yapıştı. Kasa rakamı: ' + r.ist.rakam : ''],
      zaten: ['olumlu', 'Bu parça zaten defterinde.'],
      kendin: ['olumsuz', 'Doğru parola, ama tek başına modunda bu pulu görevi kendin yaparak kazanmalısın: ' + (r.ist ? r.ist.yer : '') + '.'],
      yanlis: ['olumsuz', 'Bu parola hiçbir göreve uymuyor. Harfleri kontrol et.'],
      yok: ['olumsuz', 'Önce defteri aç.'],
    }[r.durum];
    s.className = 'geri-bildirim ' + msj[0]; s.textContent = msj[1];
    if (r.durum === 'tamam') $('parola').value = '';
    ciz();
  };
  $('parola').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('parolaGonder').click(); });
  $('kasaAc').onclick = function () {
    var s = $('kasaSonuc');
    if (K.kasaDene($('kasaKod').value)) { s.textContent = ''; ciz(); $('finalBaslik').focus(); }
    else { s.className = 'geri-bildirim olumsuz'; s.textContent = 'Kasa açılmadı. Rakamları görev sırasına göre (1, 2, 3, 4, 5) dizdin mi?'; }
  };
  $('kasaKod').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('kasaAc').click(); });
  $('sifirla').onclick = function () {
    var b = $('sifirla');
    if (b.dataset.emin !== '1') { b.dataset.emin = '1'; b.textContent = 'Emin misin? İlerleme silinir (tekrar bas)'; return; }
    K.sifirla(); b.dataset.emin = ''; b.textContent = 'Defteri sıfırla'; ciz();
  };

  /* ---------- Kâşifler Duvarı ---------- */
  function rpc(ad, govde) {
    return fetch(URL_ + ad, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANAHTAR, Authorization: 'Bearer ' + ANAHTAR }, body: JSON.stringify(govde) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  $('duvaraYaz').onclick = function () {
    var st = K.oku(), s = $('duvarSonuc'), b = $('duvaraYaz'); if (!st || !st.bitti) return;
    b.disabled = true; s.className = 'geri-bildirim'; s.textContent = 'Gönderiliyor…';
    rpc('kasif_gonder', { p_bolum: K.BOLUM, p_tur: st.mod === 'kaptan' ? 'takim' : 'bireysel', p_ad: st.mod === 'kaptan' ? st.takim : st.ad, p_uyeler: st.mod === 'kaptan' ? st.uyeler.join(', ') : null, p_sure: Math.round((st.bitti - st.basla) / 1000) })
      .then(function (r) {
        if (r === 'tamam' || r === 'tekrar') { st.gonderildi = true; K.yaz(st); ciz(); }
        else { b.disabled = false; s.className = 'geri-bildirim olumsuz'; s.textContent = r === 'gecersiz' ? 'Gönderilemedi: ad yalnız harf, rakam ve boşluk içermeli (2–24 karakter).' : 'Bugünlük duvar dolu; yarın tekrar dene.'; }
      })
      .catch(function () { b.disabled = false; s.className = 'geri-bildirim olumsuz'; s.textContent = 'Duvara ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.'; });
  };
  function duvar() {
    rpc('kasif_liste', { p_bolum: K.BOLUM }).then(function (liste) {
      [['bireysel', 'duvarBireysel'], ['takim', 'duvarTakim']].forEach(function (x) {
        var ol = $(x[1]); ol.textContent = '';
        var l = (liste || []).filter(function (d) { return d.tur === x[0]; });
        if (!l.length) { ol.append(el('li', 'bos', 'Henüz kimse yok. İlk sen ol!')); return; }
        l.forEach(function (d) { var li = el('li'); li.append(document.createTextNode(d.ad), el('b', null, sureYaz(d.sure * 1000))); if (d.uyeler) li.append(el('small', null, d.uyeler)); ol.append(li); });
      });
    }).catch(function () { ['duvarBireysel', 'duvarTakim'].forEach(function (id) { var ol = $(id); ol.textContent = ''; ol.append(el('li', 'bos', 'Duvar şu an yüklenemedi.')); }); });
  }

  document.addEventListener('kasif-degisti', ciz);
  addEventListener('storage', function (e) { if (e.key && e.key.indexOf('me.kasif') === 0) ciz(); });
  ciz(); duvar();
})();
