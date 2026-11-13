# Öğrenme notu 5 · Öğretmen Masası ve internetsiz çalışma (Aşama 5)

## Ne yapıldı?

| Parça | Dosya |
| --- | --- |
| Öğretmen Masası (3 ders akışı, sunum modu rehberi, kod okuyucu, veli/idare için gizlilik özeti) | `kriptoloji/ogretmen/index.html`, `ogretmen.mjs` |
| Ortak gezinme: Lobi · 3 oda · Öğretmen Masası | bütün oda sayfaları |
| Çevrimdışı önbellek `kripto-v5` (57 dosya) | `kriptoloji/sw.js` |

Ders akışları: **Ortaokul 40 dk** (Sezar), **Lise 80 dk** (Sezar Uzman + Kasa + Proje Kapısı), **Atölye 2 × 40 dk** (üç odanın zinciri). Her birinde dakika planı, sunum bağlantıları, föyler ve bilgisayarsız seçenek var.

## Neden böyle yapıldı?

**1. Kod okuyucu öğretmen için.** Öğrenci kayıt kodunu deftere yazar; öğretmen Öğretmen Masası'nda kodu girip hangi dosyaların çözüldüğünü görür. Hiçbir sunucu, hesap ya da liste yok: kod, bilginin kendisidir. Sayfada dürüst bir not var: kod sahteciliği engellemez, not vermek için değil kaldığı yerden devam etmek içindir.

**2. "Bir kez aç, sonra internetsiz kullan".** Bölümün `sw.js` dosyası (service worker) bir **depo görevlisi** gibi çalışır. İlk ziyarette 57 dosyayı (sayfalar, kodlar, yazı tipleri, kek görselleri) tarayıcının önbelleğine koyar. Bağlantı kesilince sayfalar oradan gelir. Bu önbellek yalnız sitenin kendi dosyalarını tutar; öğrencinin yazdığı hiçbir şey oraya girmez.

**3. Test nasıl yapıldı?** Tarayıcı bölümü bir kez açtı, sonra bağlantısı tamamen kesildi. Öğretmen Masası'ndaki 10 bağlantının 10'u açıldı: sunum modu, seviye, çark, kasa hesapları, kek görseli (piksel değeri birebir aynı), föyler ve görev kontrolü dahil.

**4. Küçük bir düzeltme.** Önbellek yalnız `https` adreslerde kayıt oluyordu; bu yüzden bilgisayarında `localhost`'ta denerken internetsiz çalışmayı göremezdin. Koşul artık "güvenli bağlam": `https` ve `localhost` ikisi de geçerli.

## Benzetme

Service worker, okul kütüphanesindeki **ödünç masası** gibidir. İlk gün kitapları raflara dizer. Ertesi gün internet kesilse bile öğrenci masaya gelip aynı kitabı ister ve kitabı raftan alır. Yeni bir baskı çıktığında (`SURUM` numarası arttığında) eski kitapları toplayıp yenilerini dizer.

## Kendin dene

1. `http://localhost:8000/kriptoloji/` aç, sonra Öğretmen Masası'na geç.
2. F12 → **Application** → **Service workers**: `sw.js` "activated" görünmeli. **Cache storage** → `kripto-v5`: dosya listesine bak.
3. F12 → **Network** → üstteki **No throttling** listesinden **Offline** seç. Ders akışlarındaki bağlantıları tek tek aç: hepsi açılmalı.
4. Kod okuyucuya `KRT-B4M39-F` yaz: 22/22 dosya, Baş Kriptograf. Sonra son harfi değiştir: daire hatayı yakalar.
