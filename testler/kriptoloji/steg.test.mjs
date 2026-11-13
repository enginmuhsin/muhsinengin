// Brief bölüm 8: gidiş-dönüş, boş mesaj, kapasiteyi aşan mesaj.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kapasiteBit, kapasiteBayt, baytGizle, baytCoz, metinGizle, metinCoz, bitDuzlemi, enBuyukFark, degisenKanal, ikili, KapasiteHatasi } from '../../kriptoloji/cekirdek/steg.mjs';

function gorsel(g, y, tohum = 7) {
  const p = new Uint8ClampedArray(g * y * 4);
  let s = tohum;
  for (let i = 0; i < p.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; p[i] = i % 4 === 3 ? 255 : s >> 23; }
  return p;
}

test('zorunlu vektör: Türkçe karakterler bayt bayt aynı döner', () => {
  const metin = 'Şifre Dairesi\'ne hoş geldin — ğüşiöç İı';
  const p = gorsel(40, 30);
  const s = metinGizle(p, metin);
  const c = metinCoz(s);
  assert.equal(c.tamam, true);
  assert.equal(c.metin, metin);
  assert.deepEqual([...baytCoz(s)], [...new TextEncoder().encode(metin)]);
});

test('fark en fazla 1; alfa değişmez; girdi değişmez', () => {
  const p = gorsel(50, 50); const kopya = new Uint8ClampedArray(p);
  const s = metinGizle(p, 'gizli');
  assert.ok(enBuyukFark(p, s) <= 1);
  for (let i = 3; i < p.length; i += 4) assert.equal(s[i], 255);
  assert.deepEqual(p, kopya);
});

test('boş mesaj: geçerli, uzunluk 0', () => {
  const s = metinGizle(gorsel(10, 10), '');
  assert.deepEqual(metinCoz(s), { tamam: true, metin: '', bayt: 0 });
});

test('kapasite: G × Y × 3 bit, sınırda tam sığar, bir bayt fazlası hata', () => {
  assert.equal(kapasiteBit(800, 600), 1440000);
  const g = 20, y = 10;   // 600 bit → (600 − 32) / 8 = 71 bayt
  assert.equal(kapasiteBayt(g, y), 71);
  const p = gorsel(g, y);
  const tam = new Uint8Array(71).fill(65);
  assert.deepEqual([...baytCoz(baytGizle(p, tam))], [...tam]);
  assert.throws(() => baytGizle(p, new Uint8Array(72)), KapasiteHatasi);
  assert.equal(kapasiteBayt(3, 3), 0);   // 27 bit < 32 bit başlık
});

test('mesajsız görsel ve bozulmuş görsel', () => {
  const p = new Uint8ClampedArray(30 * 30 * 4).fill(255);   // bütün LSB'ler 1 → uzunluk 2³²−1
  assert.deepEqual(metinCoz(p), { tamam: false, neden: 'baslik' });
  const s = metinGizle(gorsel(30, 30), 'ğüşiöç');
  for (let i = 0; i < 200; i++) s[i] ^= (i % 7 === 0 ? 1 : 0);   // JPEG benzeri bozulma
  assert.equal(metinCoz(s).tamam === true && metinCoz(s).metin === 'ğüşiöç', false);
});

test('emoji ve uzun metin', () => {
  const metin = '🙂 '.repeat(500) + 'son';
  const c = metinCoz(metinGizle(gorsel(100, 100), metin));
  assert.equal(c.metin, metin);
});

test('bit düzlemi ve ikili yazım', () => {
  const p = new Uint8ClampedArray([1, 0, 1, 77, 0, 0, 0, 77]);
  assert.deepEqual([...bitDuzlemi(p)], [170, 170, 170, 255, 0, 0, 0, 255]);
  assert.equal(ikili(200), '11001000');
  assert.equal(ikili(201), '11001001');
  assert.equal(degisenKanal(new Uint8ClampedArray([1, 2, 3, 4]), new Uint8ClampedArray([1, 3, 3, 9])), 1);
});
