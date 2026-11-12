import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALFABE, kodUret, kodCoz, kontrolDegeri, hataMetni } from '../../kriptoloji/cekirdek/kayit-kodu.mjs';
import { DOSYALAR, BIT_SAYISI, rutbeSirasi, sayim } from '../../kriptoloji/cekirdek/dosyalar.mjs';

test('alfabe: 31 karakter, karışabilenler yok', () => {
  assert.equal(ALFABE.length, 31);
  assert.equal(new Set(ALFABE).size, 31);
  for (const c of '01OILİı') assert.ok(!ALFABE.includes(c), c);
});

// Elle doğrulanan vektör: n = 1·2²² = 4 194 304 = [4,16,24,16,4]₃₁ → "6JTJ6";
// kontrol = 1·4 + 2·16 + 3·24 + 4·16 + 5·4 = 192 ≡ 6 (mod 31) → "8"
test('test vektörleri', () => {
  assert.deepEqual([4, 16, 24, 16, 4].map((d) => ALFABE[d]).join(''), '6JTJ6');
  assert.equal(kontrolDegeri([4, 16, 24, 16, 4]), 6);
  assert.equal(kodUret(0), 'KRT-6JTJ6-8');
  assert.equal(kodUret(1), 'KRT-6JTJ7-D');
  assert.equal(kodUret(129), 'KRT-6JTPB-J');
  assert.equal(kodUret(2 ** 22 - 1), 'KRT-B4M39-F');
});

test('gidiş-dönüş: rastgele 2000 maske', () => {
  for (let i = 0; i < 2000; i++) {
    const m = Math.floor(Math.random() * 2 ** BIT_SAYISI);
    assert.deepEqual(kodCoz(kodUret(m)), { tamam: true, maske: m, surum: 1 });
  }
});

test('kibar girdi: küçük harf, boşluk, tire yok', () => {
  assert.equal(kodCoz('krt 6jtj7 d').maske, 1);
  assert.equal(kodCoz('6JTJ7D').maske, 1);
  assert.equal(kodCoz(' KRT—6JTJ7—D ').maske, 1);
});

test('her tek karakter hatası yakalanır', () => {
  const kod = kodUret(0b1010110010110100101101).replace(/^KRT-|-/g, '');
  for (let p = 0; p < 6; p++) for (const c of ALFABE) {
    if (c === kod[p]) continue;
    const bozuk = kod.slice(0, p) + c + kod.slice(p + 1);
    assert.equal(kodCoz(bozuk).tamam, false, bozuk);
  }
});

test('veri karakterlerinin her yer değiştirmesi yakalanır', () => {
  const kod = kodUret(0b1110001010110100111001).replace(/^KRT-|-/g, '');
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {
    if (kod[i] === kod[j]) continue;
    const a = [...kod]; [a[i], a[j]] = [a[j], a[i]];
    assert.equal(kodCoz(a.join('')).tamam, false, a.join(''));
  }
});

test('hatalar ve mesajlar', () => {
  assert.equal(kodCoz('').hata, 'bos');
  assert.equal(kodCoz('KRT-6JTJ7').hata, 'uzunluk');
  assert.equal(kodCoz('KRT-6JT07-D').hata, 'karakter');
  assert.equal(kodCoz('KRT-6JTİ7-D').hata, 'karakter');
  assert.equal(kodCoz('KRT-6JTJ7-E').hata, 'kontrol');
  assert.equal(kodCoz(kodUret(5, 2)).hata, 'surum');
  for (const h of ['bos', 'uzunluk', 'kontrol', 'surum']) assert.ok(hataMetni({ hata: h }).length > 10);
  assert.throws(() => kodUret(-1)); assert.throws(() => kodUret(2 ** 22)); assert.throws(() => kodUret(1.5));
});

test('sicil: bitler benzersiz ve sıralı, rütbe eşikleri', () => {
  assert.equal(DOSYALAR.length, BIT_SAYISI);
  DOSYALAR.forEach((d, i) => assert.equal(d.bit, i));
  const kapanis = DOSYALAR.filter((d) => d.tur === 'kapanis').map((d) => 1 << d.bit);
  const uzman = DOSYALAR.filter((d) => d.tur === 'uzman').map((d) => 1 << d.bit);
  const veya = (a) => a.reduce((x, y) => x | y, 0);
  assert.equal(rutbeSirasi(0), 0);
  assert.equal(rutbeSirasi(1), 0);
  assert.equal(rutbeSirasi(kapanis[0]), 1);
  assert.equal(rutbeSirasi(veya(kapanis)), 2);
  assert.equal(rutbeSirasi(veya(kapanis) | veya(uzman.slice(0, 5))), 2);
  assert.equal(rutbeSirasi(veya(kapanis) | veya(uzman.slice(0, 6))), 3);
  assert.equal(sayim(2 ** 22 - 1).toplam, 22);
});
