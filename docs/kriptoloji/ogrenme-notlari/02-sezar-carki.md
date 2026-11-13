# Öğrenme notu 2 · Sezar Çarkı (Aşama 2)

## Ne yapıldı?

| Parça | Dosya |
| --- | --- |
| Oda sayfası | `kriptoloji/sezar/index.html`, `sezar.mjs` |
| Çark bileşeni (SVG, sürükleme, klavye, tık sesi) | `kriptoloji/bilesenler/cark.mjs` |
| Görev bağlayıcı (cevap kontrolü + damga) | `kriptoloji/bilesenler/gorev.mjs` |
| Yazdırılabilir föy (kâğıt çark + cevap anahtarı) | `kriptoloji/sezar/foy.html`, `foy.mjs`, `kriptoloji/foy.css` |
| Görev verisi testleri | `testler/kriptoloji/sezar-odasi.test.mjs` |
| Proje Kapısı taslağı (yayında değil) | `docs/kriptoloji/proje-kapisi-taslak.md` |

7 dosya var: 3 Çırak (101–103), 3 Uzman (104–106) ve 1 kapanış (107). Kapanış çözülünce rütbe **Kod Kırıcı** olur.

## Neden böyle yapıldı?

**1. Cevaplar sayfa kaynağında yok.** Meraklı bir öğrenci sağ tık → "Kaynağı görüntüle" ile cevabı arayabilir. Bu yüzden sayfada mesajların yalnız *şifreli* hâli var. Öğrenci "BUGÜN SAAT…" yazınca kod bunu **şifreleyip** şifreli metinle karşılaştırır. Tıpkı şifre kontrolünde gerçek sistemlerin yaptığı gibi: saklanan şey cevabın kendisi değil, dönüştürülmüş hâlidir.

**2. Yanlış cevaba göre ayrı geri bildirim.** "Ters yöne döndürdün", "C değil Ç", "32 doğru ama mod al" gibi mesajlar, öğrencinin *hangi* yanılgıya düştüğünü yakalar. Kavram yanılgısı listesi öğretmen notunda da var.

**3. Çark neden SVG?** SVG bir çizim tarifidir; akıllı tahtada 4K ekranda da telefonda da keskin kalır, harfleri ekran okuyucu okuyabilir. Çark `role="slider"` olarak işaretli: klavyeyle (ok tuşları, Home) ve ekran okuyucuyla kullanılabilir.

**4. Föydeki ölçek hatası (yakalanıp düzeltildi).** İlk denemede iç ve dış disk farklı ölçekte basılıyordu; kesip birleştirince iç disk halkaya oturmazdı. Şimdi ikisi de "400 birim = 108 mm" ölçeğinde. İç diskin dış kenarı (148 birim) dış halkanın iç kenarına (150 birim) tam oturur.

**5. Sunum modu seviyeyi biliyor.** Çırak'ta 7 adım, Uzman'da 11 adım gösterir; öğretmen sunum sırasında seviyeyi değiştirebilir.

## Benzetme

Görev kontrolü, **mühürlü zarf** gibi çalışır. Öğretmen doğru cevabı zarfa koyup mühürlemiş (şifreli metin). Öğrencinin cevabı da aynı mühürle mühürlenir; iki mühür birebir aynıysa cevap doğrudur. Zarfı açmaya hiç gerek kalmaz.

## Kendin dene

1. `http://localhost:8000/kriptoloji/sezar/` aç. Çarkı fareyle çevir, sonra Tab ile çarka gel ve ok tuşlarını kullan.
2. Adrese `?seviye=uzman` ekle: formül, kaba kuvvet tablosu ve "Neden 29?" dosyası belirir.
3. Dosya 104'e önce `C` yaz: "Çok yakın!" uyarısını gör. Sonra `Ç` yaz: damga basılır.
4. Bütün dosyaları çözüp menüden **Lobi**'ye dön: rütben **Kod Kırıcı** olmuş olmalı.
5. Föyü aç (`sezar/foy.html`), "Yazdır" → "PDF olarak kaydet". 3 sayfa çıkmalı; son sayfa cevap anahtarı.
6. Testleri çalıştır: `node --test testler/kriptoloji/*.test.mjs` → `# pass 19`.
