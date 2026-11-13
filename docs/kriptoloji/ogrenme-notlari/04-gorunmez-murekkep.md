# Öğrenme notu 4 · Görünmez Mürekkep (Aşama 4)

## Ne yapıldı?

| Parça | Dosya |
| --- | --- |
| LSB steganografi çekirdeği | `kriptoloji/cekirdek/steg.js` |
| Oda sayfası (çöz, gizle, bit düzlemi, piksel tablosu, JPEG deneyi) | `kriptoloji/murekkep/index.html`, `murekkep.js` |
| Örnek görseller (kek) ve üretici betik | `kriptoloji/murekkep/ornekler/*.png`, `araclar/kriptoloji-ornek-gorsel.py` |
| Föy: "tek mi, çift mi?" kâğıt etkinliği | `kriptoloji/murekkep/foy.html`, `foy.js` |
| Testler | `testler/kriptoloji/steg.test.mjs` |

7 dosya: 301–303 Çırak, 304–306 Uzman, 307 kapanış. Böylece Faz 1'in 22 dosyasının hepsi yerinde.

## Neden böyle yapıldı?

**1. Görseli biz çizdik.** Lisanslı bir fotoğraf yerine, Python betiğiyle düz renkli bir kek çizdik. İki nedeni var: lisans sorunu hiç doğmuyor ve düz renkli bir çizimin "bit düzlemi" sakin oluyor. Mesaj yazılınca o sakin düzlemde kar gibi bir bant beliriyor. Fotoğrafta en düşük bitler zaten karışık olduğundan bu etki görünmezdi (öğretmen notunda farklılaştırma sorusu olarak var).

**2. Parola sayfada yazmıyor.** Dosya 301'in cevabı (mektuptaki parola) kodda düz metin olarak yok; yalnız SHA-256 özeti var. Öğrencinin yazdığı parola da özetleniyor ve iki özet karşılaştırılıyor. Bu, Kasa Soygunu'nda öğrenilen "şifre özeti" fikrinin gerçek bir kullanımı.

**3. Gidiş-dönüş her seferinde sınanıyor.** Mesaj gizlenince sayfa görseli tuvale yazıyor, tuvalden geri okuyor, çözüyor ve karşılaştırıyor. Dosya 302 ancak bu sınamadan geçerse kapanıyor. Testte brief'in zorunlu cümlesi gizlenip PNG olarak indirildi, sonra yeniden açıldı ve bayt bayt aynı çıktı.

**4. Tuval öz testi.** Bazı tarayıcılar (parmak izi korumalı Firefox, Brave) kişiyi tanımayı zorlaştırmak için tuval piksellerini bilerek az miktarda değiştirir. Sayfa açılışta 8 × 4 piksellik bir deseni yazıp geri okur; tutmazsa sayfanın başında açık bir uyarı gösterir.

**5. JPEG neden mesajı yok ediyor?** JPEG dosyayı küçültmek için göze önemsiz görünen ayrıntıları atar. Testte kalite 0,92'de 331 553 kanal değeri değişti; mesaj tamamen kayboldu. Görsel göze aynı göründü. PNG ise her sayıyı aynen saklar.

## Benzetme

En düşük bit, bir fiyat etiketindeki **kuruş hanesi** gibidir. 200,00 TL ile 201,00 TL arasındaki farkı gözle ayırt etmek kolay; ama 199,99 ile 200,00 arasındaki fark, uzaktan bakan kimsenin dikkatini çekmez. Steganografi, mesajı binlerce etiketin kuruş hanelerine tek tek yazmak gibidir: etiketlerin hepsi aynı görünür, ama kuruşları sırayla okuyan mektubu bulur.

## Kendin dene

1. `http://localhost:8000/kriptoloji/murekkep/` aç, "Mektubu çıkar" düğmesine bas. Bit düzleminde en üstte ince bir kar şeridi var mı?
2. "Bir sayfalık mektup gizle" düğmesine bas ve dört görseli karşılaştır: üstteki iki resim aynı, alttaki iki bit düzlemi çok farklı.
3. "JPEG'e çevir ve çöz" düğmesine bas. Bit düzleminde ne oldu?
4. Kendi çizdiğin bir resme mesaj gizle, PNG'yi indir, telefonuna gönder ve telefondan "Başka bir PNG aç" ile çöz. Sonra aynı resmi WhatsApp ile "fotoğraf" olarak gönderip dene: WhatsApp fotoğrafları genellikle sıkıştırdığı için mesaj büyük olasılıkla kaybolur ("belge" olarak gönderilirse korunur).
5. Testler: `node --test testler/kriptoloji/*.test.mjs`.
