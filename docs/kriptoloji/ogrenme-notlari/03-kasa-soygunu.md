# Öğrenme notu 3 · Kasa Soygunu (Aşama 3)

## Ne yapıldı?

| Parça | Dosya |
| --- | --- |
| Entropi ve süre hesapları | `kriptoloji/cekirdek/entropi.mjs` |
| Gerçek SHA-256 kaba kuvveti ve hız ölçümü | `kriptoloji/cekirdek/kaba-kuvvet.mjs` |
| Oda sayfası | `kriptoloji/kasa/index.html`, `kasa.mjs` |
| Föy (hesap tablosu, zar etkinliği, cevap anahtarı) | `kriptoloji/kasa/foy.html`, `foy.mjs` |
| Testler | `testler/kriptoloji/entropi.test.mjs`, `kaba-kuvvet.test.mjs` |

7 dosya: 201–203 Çırak, 204–206 Uzman, 207 kapanış. Kapanışta "Anahtar Atölyesi yakında" köprüsü açılır.

## Neden böyle yapıldı?

**1. Şifre yazılacak kutu yok.** İnsanlar "şifrem ne kadar güçlü?" diye gerçek şifrelerini yazma eğilimindedir. Sayfa hiçbir şey göndermese bile bu, yanlış bir alışkanlık öğretir. Bu yüzden kilitler hazır listeden seçiliyor. Sayfadaki yazı kutuları yalnız sayı cevapları (deneme sayısı, bit, yıl) içindir.

**2. Tablo elle yazılmadı.** Brief'teki tablonun her hücresi (126 → 7,0 bit, 29⁸ → 50 saniye, 7776⁵ → 90 yıl…) `entropi.mjs` ile hesaplanıyor. Testler bu değerleri brief'le karşılaştırıyor. Föydeki cevap anahtarı da aynı fonksiyonlardan üretiliyor; sayfa ile föy hiçbir zaman birbirini tutmaz hâle gelemez.

**3. Yakalanan küçük bir hata.** İlk sürümde olasılık sayısını 2^(bit) ile geri hesaplıyordum. 4 haneli PIN için bu 9999,9999… verdi ve "≈ 1 saniye" yerine "1 saniyeden kısa" yazdı. Bilgisayarlar ondalık sayıları tam saklayamaz; doğrudan N^L hesaplamak bu sorunu ortadan kaldırdı. Testler bu hatayı yazar yazmaz yakaladı.

**4. Ölçüm gerçek, hızlar varsayım.** "Kasayı kır" düğmesi rastgele bir yılın SHA-256 özetini üretir ve 1900'den başlayarak bütün yılları dener. Ardından cihazın bir saniyede kaç özet hesapladığını ölçer. Bu sayı, saldırgan listesine "Senin cihazın" olarak eklenir. 10, 10⁴ ve 10¹⁰ değerleri ise ders için seçilmiş yuvarlak varsayımlardır ve sayfada açıkça öyle yazıyor.

**5. Logaritmik zaman çizgisi.** "Anında" ile "evrenin yaşı" arasında 10²⁰ kat fark var; düz bir cetvelde hepsi aynı noktaya düşerdi. Çizgi her küçük çentikte 10 kat ilerler. Telefonda yazılar okunaklı kalsın diye yatay kaydırılır.

## Benzetme

Yavaş anahtar türetme (KDF), kasanın kapısına **ağır bir kol** takmak gibidir. Hırsızın elindeki anahtar sayısı değişmez ama her denemede o ağır kolu çevirmesi gerekir. 10¹⁰'dan 10⁴'e düşen hız, kasaya 20 sürgü eklemekle aynı etkiyi yapar: log₂(10⁶) ≈ 20 bit.

## Kendin dene

1. `http://localhost:8000/kriptoloji/kasa/` aç, "8 küçük Türkçe harf" ile "8 harf + 1 sembol"ü karşılaştır. Sonra "5 rastgele kelime"yi seç. Kasanın sürgü sayısına bak.
2. "Kasayı kır ve hızımı ölç" düğmesine bas. Okul bilgisayarında ve telefonunda ayrı ayrı dene: hangisi daha hızlı?
3. Ölçümden sonra saldırgan listesinde "Senin cihazın"ı seç ve "5 rastgele kelime"nin sana kaç yıl dayanacağına bak.
4. Testler: `node --test testler/kriptoloji/*.test.mjs` → `# pass 28`.
