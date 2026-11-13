# Öğrenme notu 1 · Altyapı ve Lobi (Aşama 1)

## Ne yapıldı?

| Parça | Dosya | Görevi |
| --- | --- | --- |
| Türk alfabesi | `kriptoloji/cekirdek/turkce-alfabe.js` | 29 harf, İ/ı dönüşümü, NFC, mod |
| Sezar | `kriptoloji/cekirdek/sezar.js` | E(x) = (x + k) mod 29, kaba kuvvet tablosu |
| Dosya sicili | `kriptoloji/cekirdek/dosyalar.js` | 22 dosya, bit numaraları, rütbe eşikleri |
| Kayıt kodu | `kriptoloji/cekirdek/kayit-kodu.js` | KRT-XXXXX-C, mod 31 kontrol karakteri |
| Ortak bileşenler | `kriptoloji/bilesenler/` | ilerleme (bellek + `#`), seviye, sunum modu, damga |
| Görünüm | `kriptoloji/daire.css` | İki Kalem diline "oda kaplaması" |
| Lobi | `kriptoloji/index.html`, `lobi.js` | giriş dosyası (akrostiş), mühür, şubeler, kayıt kodu |
| Çevrimdışı | `kriptoloji/sw.js` | bir kez açılınca internetsiz çalışır |
| Testler | `testler/kriptoloji/*.test.mjs` | 16 test; GitHub her push'ta çalıştırır |
| Sayaç | `ortak/sayac.js` | yeni "depsuz mod" (`data-depo="yok"`) |

## Neden böyle yapıldı?

**1. "Saf modül" ile "ekran kodu" ayrı.** `cekirdek/` klasöründeki dosyalar ekrana hiç dokunmaz, sadece hesap yapar. Bu yüzden tarayıcı açmadan, tek komutla test edilebilirler. Sezar'ın doğru çalıştığını ekrana bakarak değil, testle kanıtlıyoruz.

**2. `toUpperCase()` neden yasak?** Bilgisayar "i" harfini büyütürken hangi dilde olduğunu bilmezse "I" yapar; Türkçede ise doğrusu "İ". Bu yüzden 29 harfi elle yazılmış bir tabloyla eşledik. Tablo hiçbir zaman fikir değiştirmez.

**3. İlerleme neden adres çubuğunda?** Brief hiçbir şeyin cihazda saklanmamasını istiyor. Ama öğrenci lobiden odaya geçince bellek sıfırlanır. Çözüm: ilerleme kodu adresin `#` kısmına yazılır (`…/kriptoloji/#k=KRT-6JTJ7-D`). Tarayıcılar `#` sonrasını **sunucuya hiç göndermez**; bu kısım sadece sayfanın içinde kalır.

**4. Kontrol karakteri neden 31 ile?** 31 asal. Asal sayıyla bölünce "bir harf yanlış" ve "iki harf yer değiştirmiş" hatalarının hepsi yakalanır. Testlerde bu, olası bütün tek harf hataları tek tek denenerek kanıtlandı.

**5. Sayaç neden "depsuz"?** Normal sayaç "bugün sayıldım" notunu tarayıcıda çerez ve localStorage'da tutuyor. Şifre Dairesi'nde bu not hiç yazılmıyor; sadece "bir görüntülenme" gönderiliyor. Bedeli: bu sayfalarda "tekil ziyaretçi" sayısı 0 görünür, yalnız görüntülenme sayılır.

**6. CSP ne işe yarıyor?** Sayfanın başındaki `Content-Security-Policy` satırı tarayıcıya "bu sayfa yalnız kendi sunucumuzdan kod çalıştırır, dışarıya yalnız sayacın tek adresine bağlanır" der. Test sırasında bunu bizzat gördük: dışarıdan sayfaya kod sokmaya çalışan test aracını CSP engelledi.

**7. Yeni yazı tipi neden yok?** Tasarım pasaportu en fazla 2 aile kuralı koyuyor. Daktilo görünümünü sitenin zaten kullandığı eş aralıklı sistem yazısıyla verdik.

## Benzetme

Kayıt kodu bir **apartman zil paneline** benzer. 22 dosya 22 zildir; çözülen dosyanın zili yanar. Kod, hangi zillerin yandığını bir sayı olarak yazar. Son karakter ise kapıcının kontrolüdür: "zil numaralarını topla, 31'e böl, kalanı söyle." Biri numarayı yanlış okursa kalan tutmaz ve kapıcı fark eder. Ama kapıcının kuralını bilen biri sahte bir panel de çizebilir. Bu yüzden kod sahteciliği değil, sadece yanlış yazmayı engeller.

## Kendin dene

1. Bilgisayarında `C:\projeler\muhsinengin` içinde PowerShell aç ve şunu yaz:
   ```
   git fetch origin
   git switch kriptoloji-faz1
   node --test testler/kriptoloji/alfabe-sezar.test.mjs testler/kriptoloji/kayit-kodu.test.mjs
   ```
   Ekranda `# pass 16` görmelisin.
2. Siteyi yerelde aç: `python -m http.server 8000`, sonra tarayıcıda `http://localhost:8000/kriptoloji/`.
3. Giriş dosyasını çöz, sonra adres çubuğuna bak: sonunda `#k=KRT-6JTJ7-D` belirir. Sayfayı yenile; damga yerinde kalır.
4. Kod alanına `KRT-6JTJ7-E` yaz (son harf yanlış). Daire hatayı yakalar.
5. Kendi elinle hesapla: `KRT-6JTJ6-8` için 1·4 + 2·16 + 3·24 + 4·16 + 5·4 = ? Sonucun 31'e bölümünden kalan 6 çıkmalı.
6. Sunum modunu dene: adresin sonuna `?sunum=1` ekle, ok tuşlarıyla ilerle.
