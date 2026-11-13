import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ozet, yilKasasi, kasayiKir, hizOlc, rastgeleTam } from '../../kriptoloji/cekirdek/kaba-kuvvet.mjs';

test('SHA-256 özeti: bilinen değer ve 64 hex karakter', async () => {
  const o = await ozet('1987');
  assert.match(o, /^[0-9a-f]{64}$/);
  assert.equal(o, await ozet('1987'));
  assert.notEqual(o, await ozet('1988'));
});

test('kasa her zaman açılır ve deneme sayısı yıl sırasına eşittir', async () => {
  for (let i = 0; i < 5; i++) {
    const kasa = await yilKasasi();
    const s = await kasayiKir(kasa);
    assert.ok(s.bulunan);
    assert.equal(s.deneme, Number(s.bulunan) - 1900 + 1);
    assert.equal(await ozet(s.bulunan), kasa.hedef);
    assert.ok(s.deneme >= 1 && s.deneme <= 126);
  }
});

test('rastgele yıl aralıkta', () => {
  for (let i = 0; i < 2000; i++) { const y = rastgeleTam(1900, 2025); assert.ok(y >= 1900 && y <= 2025); }
});

test('hız ölçümü pozitif bir sayı döndürür', async () => {
  const h = await hizOlc(200);
  assert.ok(h > 100, String(h));
});
