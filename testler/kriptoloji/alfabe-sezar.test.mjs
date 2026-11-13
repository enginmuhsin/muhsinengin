// Çalıştır: node --test testler/kriptoloji/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUYUK, KUCUK, N, sira, normalle, buyukHarf, kucukHarf, mod, yabanciHarfler } from '../../kriptoloji/cekirdek/turkce-alfabe.js';
import { sezar, sezarCoz, kabaKuvvet, anahtarNormal } from '../../kriptoloji/cekirdek/sezar.js';

test('alfabe: 29 harf, doğru sıra', () => {
  assert.equal(N, 29);
  assert.equal(BUYUK.join(''), 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ');
  assert.equal(KUCUK.join(''), 'abcçdefgğhıijklmnoöprsştuüvyz');
  assert.equal(sira('A'), 0); assert.equal(sira('Z'), 28);
  assert.equal(sira('I'), 10); assert.equal(sira('İ'), 11);
  assert.equal(sira('ı'), 10); assert.equal(sira('i'), 11);
  assert.equal(sira('Q'), -1); assert.equal(sira('W'), -1); assert.equal(sira('X'), -1);
});

test('büyük/küçük: i ↔ İ, ı ↔ I (yerel ayardan bağımsız)', () => {
  assert.equal(buyukHarf('ılık iğne'), 'ILIK İĞNE');
  assert.equal(kucukHarf('IŞIK İZMİR'), 'ışık izmir');
  assert.equal(buyukHarf('quiz'), 'QUİZ');
});

test('NFC: ayrık noktalı i ve birleşik harfler', () => {
  assert.equal(normalle('İstanbul'), 'İstanbul');
  assert.equal(normalle('i̇'), 'i');
  assert.equal(normalle('ç'), 'ç');      // c + çengel → ç
  assert.equal(normalle('ğ'), 'ğ');      // g + kısa → ğ
  assert.equal(sezar('İ', 1), 'J');
});

test('mod: negatif sayılarda da 0 ≤ r < m', () => {
  assert.equal(mod(-1, 29), 28); assert.equal(mod(-30, 29), 28); assert.equal(mod(58, 29), 0);
});

// Brief bölüm 5: zorunlu test vektörleri
test('Sezar zorunlu vektörler', () => {
  assert.equal(sezar('MERHABA', 3), 'ÖĞTJÇDÇ');
  assert.equal(sezar('ZEYTİN', 3), 'CĞBVLP');
  assert.equal(sezar('ılık', 1), 'imil');
  assert.equal(sezar('ÖĞTJÇDÇ', -3), 'MERHABA');
  assert.equal(sezar('Q-W 2026!', 5), 'Q-W 2026!');
});

test('Sezar: çöz(şifrele(x)) = x, her anahtar ve büyük/küçük karışık metin', () => {
  const metin = 'Şifre Dairesi\'ne hoş geldin — ğüşiöç İı 2026 🙂 QWX';
  for (let k = -60; k <= 60; k++) assert.equal(sezarCoz(sezar(metin, k), k), metin);
  assert.equal(sezar(metin, 29), metin);
  assert.equal(sezar(metin, 0), metin);
});

test('Sezar: kenar durumlar', () => {
  assert.equal(sezar('', 5), '');
  assert.equal(sezar(null, 5), '');
  assert.equal(sezar('ABC', '2'), 'CÇD');
  assert.equal(sezar('ABC', 2.9), 'CÇD');
  assert.equal(anahtarNormal(-3), 26);
  const uzun = 'A'.repeat(100000);
  assert.equal(sezar(uzun, 1), 'B'.repeat(100000));
  assert.deepEqual(yabanciHarfler('Wi-Fi ve XQ'), ['W', 'X', 'Q']);
});

test('kaba kuvvet: 28 satır, doğru anahtar içinde', () => {
  const t = kabaKuvvet('ÖĞTJÇDÇ');
  assert.equal(t.length, 28);
  assert.equal(t.find((s) => s.k === 3).metin, 'MERHABA');
});
