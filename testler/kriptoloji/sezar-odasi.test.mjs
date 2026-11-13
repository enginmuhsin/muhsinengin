// Sezar odasındaki görev mesajları: sayfada yalnız şifreli hâlleri var.
// Bu test, şifreli metinlerin gerçekten bir Türkçe cümleye çözüldüğünü ve sayfa ile föyün aynı veriyi kullandığını denetler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sezarCoz, sezar } from '../../kriptoloji/cekirdek/sezar.js';

const oda = readFileSync(new URL('../../kriptoloji/sezar/sezar.js', import.meta.url), 'utf8');
const foy = readFileSync(new URL('../../kriptoloji/sezar/foy.js', import.meta.url), 'utf8');
const veri = (kaynak, ad) => {
  const m = new RegExp(`const ${ad} = \\{ sifreli: '([^']+)', k: (\\d+) \\}`).exec(kaynak);
  return { sifreli: m[1], k: Number(m[2]) };
};

test('görev mesajları doğru çözülür', () => {
  assert.equal(sezarCoz(veri(oda, 'M1').sifreli, 5), 'BUGÜN SAAT ÜÇTE ARŞİVDE BULUŞALIM');
  assert.equal(sezarCoz(veri(oda, 'M2').sifreli, 11), 'KÜTÜPHANENİN KAPISI AÇIK');
  assert.equal(sezarCoz(veri(oda, 'M5').sifreli, 19), 'KASA ŞİFRESİ ÇOK ZAYIF');
  assert.equal(sezar('KALEM', 7), 'RGSJŞ');
});

test('oda ve föy aynı mesajları kullanır', () => {
  for (const ad of ['M1', 'M2', 'M5']) assert.deepEqual(veri(oda, ad), veri(foy, ad));
});

test('afin anahtar sayıları: mod 29 → 812, mod 26 → 312', () => {
  const ebob = (a, b) => (b ? ebob(b, a % b) : a);
  const carpan = (m) => [...Array(m).keys()].filter((a) => a > 0 && ebob(a, m) === 1).length;
  assert.equal(carpan(29), 28); assert.equal(carpan(29) * 29, 812);
  assert.equal(carpan(26), 12); assert.equal(carpan(26) * 26, 312);
});
