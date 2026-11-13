// Brief bölüm 7'deki tablo kodla yeniden hesaplanır.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KILITLER, bit, uzay, entropi, tumSure, ortalamaSure, sureYaz, bilimsel, sayiYaz } from '../../kriptoloji/cekirdek/entropi.mjs';

const k = (id) => KILITLER.find((x) => x.id === id);
const yakin = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

test('brief tablosu: olasılık ve entropi', () => {
  yakin(uzay(k('yil')), 126, 1e-9);   yakin(bit(k('yil')), 6.98, 0.01);
  yakin(uzay(k('pin4')), 1e4, 1e-6);  yakin(bit(k('pin4')), 13.29, 0.01);
  yakin(uzay(k('harf8')) / 5.0e11, 1, 0.01); yakin(bit(k('harf8')), 38.86, 0.01);
  yakin(uzay(k('kelime5')) / 2.84e19, 1, 0.01); yakin(bit(k('kelime5')), 64.62, 0.01);
  yakin(bit(k('rakam3')), 9.97, 0.01);
  assert.equal(29 ** 8, 500246412961);
});

test('brief tablosu: tüm uzayın taranma süresi', () => {
  assert.equal(sureYaz(tumSure(k('yil'), 1e10)), 'anında');
  assert.equal(sureYaz(tumSure(k('yil'), 1e4)), '1 saniyeden kısa');
  assert.equal(sureYaz(tumSure(k('pin4'), 1e10)), 'anında');
  assert.equal(sureYaz(tumSure(k('pin4'), 1e4)), '≈ 1,0 saniye');
  assert.equal(sureYaz(tumSure(k('harf8'), 1e10)), '≈ 50 saniye');
  assert.equal(sureYaz(tumSure(k('harf8'), 1e4)), '≈ 1,6 yıl');
  assert.equal(sureYaz(tumSure(k('kelime5'), 1e10)), '≈ 90 yıl');
  assert.equal(sureYaz(tumSure(k('kelime5'), 1e4)), '≈ 90 milyon yıl');
  yakin(ortalamaSure(k('pin4'), 1e4), 0.5, 1e-9);
});

test('kelime mi sembol mü: bir kelime 32 sembolden çok daha fazla bit ekler', () => {
  yakin(bit(k('harf8s')) - bit(k('harf8')), 5, 1e-9);
  yakin(bit(k('kelime6')) - bit(k('kelime5')), 12.92, 0.01);
  yakin(entropi(7776, 1), 12.92, 0.01);
  assert.equal(6 ** 5, 7776);
});

test('yavaş KDF: 10¹⁰ → 10⁴ deneme/sn ≈ 19,9 bit ek güç', () => {
  yakin(Math.log2(1e10 / 1e4), 19.93, 0.01);
});

test('biçimleme', () => {
  assert.equal(sayiYaz(1234567), '1 234 567');
  assert.equal(sayiYaz(3.25, 2), '3,25');
  assert.equal(bilimsel(5.0e11), '5,0·10¹¹');
  assert.equal(bilimsel(2.84e19), '2,8·10¹⁹');
  assert.equal(sureYaz(86400 * 3), '≈ 3 gün');
});
