# Şifre Dairesi — muhsinengin.com Kriptoloji Bölümü
## Faz 1 Uygulama Brief'i (Claude Code oturumu için)

> **Abdullah için kullanım:** Bu dosyayı repoda `docs/kriptoloji/KRIPTOLOJI-BRIEF.md` olarak kaydet. Claude Code'u `C:\projeler\muhsinengin` içinde aç ve şunu yaz:
> *"docs/kriptoloji/KRIPTOLOJI-BRIEF.md dosyasını baştan sona oku. Sadece Aşama 0'ı yap, bana raporla ve planını sun. Onayımı almadan kod yazma."*

---

## 0. Rol ve öncelik sırası

Sen kıdemli bir full-stack web geliştiricisisin. Güvenliği tasarımın içine yerleştirirsin (security-by-design) ve erişilebilirliğe önem verirsin. Bilgisayar mühendisi (güvenlik/kriptografi) ve öğretim tasarımcısı bakış açılarını da kullanırsın. İki bakış açısı çatışırsa (örneğin "öğretmesi kolay" ile "doğru ve güvenli") bunu açıkça söyle ve ödünleşimi (trade-off) açıkla.

Kurallar çakışırsa öncelik sırası:
1. Repodaki `CLAUDE.md` kuralları (önce plan, sonra onay; küçük Türkçe commit'ler; `main`'e push için onay; gizli anahtarları asla açığa çıkarma).
2. Bu brief.
3. Kendi varsayılan alışkanlıkların.

Bilmediğin bir şeyi uydurma. Doğrulanması gereken her bilgiyi **[doğrula]** ile işaretle. Bu kural; donanım hızları, tarihî bilgiler, MEB kazanım kodları ve font lisansları için de geçerli.

---

## 1. Bağlam

- **Sahip:** Abdullah (Muhsin Engin). Matematik öğretmeni ve BİLSEM danışman öğretmeni. Siteyi kendisi, Claude Code ile geliştiriyor. Yazılım süreçlerini öğreniyor; her kritik adımın anlaşılır biçimde belgelenmesini istiyor.
- **Site:** muhsinengin.com. Repo `enginmuhsin/muhsinengin`, yerel kopya `C:\projeler\muhsinengin`.
- **Barındırma:** Site GitHub Pages'ten Cenuta sunucusuna taşındı. DNS Cloudflare'de. Dağıtım (deploy) yöntemini repoda ve CLAUDE.md'de **doğrula**. Bunu GitHub Pages varsayma.
- **Tasarım:** Sitenin arayüzü, ek tasarım skill'leriyle "standart yapay zekâ şablonu" görünümünden kurtarıldı. Yeni bölüm de aynı kalitede ve aynı tasarım ailesinden olmalı. Sitede kendi dünyası olan, gezilen bir bölüm olarak **drone hangarı** var. Kriptoloji bölümü onun kardeşi gibi tasarlanacak: kendi teması ve hikâyesi olacak, oyunla ve görselle zenginleştirilecek.
- **Kitle:** BİLSEM ve okul öğretmenleri ile öğrencileri. Hem ortaokul hem lise. Öğretmen bölümü atölyede ve derste akıllı tahtada (FATİH) kullanacak. Lise öğrencisi proje fikri ve derinlik bulabilmeli.
- **Dil:** Arayüz tamamen Türkçe. Teknik terimler gerektiğinde parantez içinde İngilizce verilir.
- **Kapsam dışı (bu fazda yok):** Hipatia öğrenci projesi entegrasyonu (ileride "misafir salonu" olarak eklenecek), şifre üretici aracı (ileride ayrı ve izole bir sayfa olarak yapılacak), diğer odalar.

---

## 2. Konsept: Şifre Dairesi

Bölüm bir **şifre bürosu** olarak kurgulanır. Kullanıcı daireye stajyer olarak girer. Her oda bir şubedir, her görev bir **dosya**dır. Görev çözülünce dosyaya kırmızı **"ÇÖZÜLDÜ"** damgası basılır (animasyonlu, kısa, `prefers-reduced-motion` ile kapanabilir).

**Rütbeler:** Stajyer → Kod Kırıcı → Analist → Baş Kriptograf. Eşikleri, Faz 1'deki dosya sayısına göre sen öner.

**Faz 1 içeriği:**
1. **Lobi** (`/kriptoloji/`): Dairenin girişi. Kısa hikâye, odalara kapılar, rütbe rozeti, kayıt kodu girişi, öğretmen kapısı.
2. **Oda 1 — Sezar Çarkı**
3. **Oda 2 — Kasa Soygunu**
4. **Oda 3 — Görünmez Mürekkep**
5. **Öğretmen Masası** (`/kriptoloji/ogretmen/`): Hazır ders akışları, föyler, sunum modu açıklaması.

URL yapısını drone hangarının mevcut yapısına göre belirle. Yukarıdakiler sadece öneri.

---

## 3. Görsel yön (A: "Şifre Dairesi")

**Hedef his:** 1940'ların şifre bürosu ile matematikçi defterinin karışımı.

- **Malzemeler:** kraft kâğıt ve dosya kartonu dokusu (hafif, CSS veya küçük SVG ile), kareli defter zemini, mürekkep laciverti, damga kırmızısı, pirinç/bakır tonlu döner çarklar, daktilo harfleriyle yazılmış dosya başlıkları.
- **Kesinlikle kaçınılacaklar:** yeşil "matrix/hacker" ekranı, neon, jenerik gradyan kartlar, emoji ikonlar, stok "kilit + kalkan" ikonları, sıradan yapay zekâ landing page düzeni.
- **Yazı tipleri:** Kendi sunucumuzda barındırılacak (self-hosted), açık lisanslı (OFL/Apache) olacak. **Türkçe glifler zorunlu:** ç ğ ı İ ö ş ü ve büyük halleri. Seçtiğin her fontu bu harflerle test et; lisansı [doğrula].
- **Sitenin kimliği korunur:** Yörüngeli Küp logosu ve sitenin mevcut tasarım değişkenleri (renk, boşluk, tipografi ölçeği) incelenir. Yeni tema bunların üzerine bir "oda kaplaması" olarak kurulur, ayrı bir site gibi görünmez.
- **İki ekran hedefi:** telefon (360 px) ve akıllı tahta (1920 px). Akıllı tahtada uzaktan okunabilirlik önemli.
- Kurulu tasarım skill'lerini (örneğin frontend-design) kullan. Aşama 0'da hangilerinin kurulu olduğunu raporla.

---

## 4. Tüm odalarda ortak bileşenler

### 4.1 Seviye anahtarı: Çırak / Uzman
- **Çırak** ortaokul, **Uzman** lise seviyesidir. Simülasyon aynı kalır, sadece derinlik değişir: Uzman'da formül, ispat, ek görev ve "Proje Kapısı" görünür.
- Seviye URL'de tutulur (`?seviye=uzman`). Böylece öğretmen doğrudan link paylaşabilir. Depolama API'si kullanılmaz.

### 4.2 Sunum modu (öğretmen için)
- `?sunum=1` ile açılır. İçeriği:
  - büyük yazı,
  - adım adım ilerleme (ok tuşları veya tıklama),
  - cevapları gizle/göster,
  - süre sayacı,
  - 2–4 takımlık puan tablosu (sadece bellekte tutulur, sayfa kapanınca silinir).

### 4.3 Her odanın iskeleti
1. **Benzetme kartı:** Kavramı tek cümlelik bir benzetmeyle açar. Benzetme yanlış kavram öğretmemeli.
2. **Simülasyon / oyun**
3. **Dosya görevleri:** Çırak için 2–3, Uzman için 2–3 görev.
4. **Dosya kapanış sorusu:** Tek soru. Öğrenme hedefini ölçer, doğru cevap damgayı açar.
5. **Proje Kapısı (yalnızca Uzman):** 2–3 açık uçlu araştırma sorusu. Abdullah'ın onayından geçmeyen soru yayınlanmaz.
6. **Öğretmen notu:**
   - süre ve sınıf düzeyi,
   - malzemeler,
   - öğrenme hedefleri (gözlenebilir davranış olarak: "öğrenci … yapabilir"),
   - sık görülen kavram yanılgıları ve bunların nasıl giderileceği,
   - farklılaştırma önerileri,
   - MEB kazanım eşlemesi (kodlar uydurulmaz, [doğrula] ile işaretlenir).
7. **Yazdırılabilir föy:** Baskı CSS'i ile A4, siyah-beyaz uyumlu. Cevap anahtarı ayrı sayfada. Tarayıcının "PDF olarak kaydet" özelliğiyle çıktı alınır.

### 4.4 Kariyer ve kayıt kodu
- **Hiçbir veri saklanmaz:** localStorage, cookie ve IndexedDB yok. İlerleme bellekte tutulur.
- Öğrenci istediğinde bir **kayıt kodu** alır (örnek biçim: `KRT-7Q2M-X`). Kod şunları içerir: sürüm (v1), tamamlanan dosyaların bit maskesi ve bir **kontrol karakteri** (checksum).
- Kodda karışabilen karakterler (0/O, 1/I/l, ve Türkçe I/İ) kullanılmaz.
- Kontrol karakteri, ağırlıklı toplamın alfabe boyuna göre modu gibi basit ve öğretilebilir bir yöntemle hesaplanır. Yöntemi belgele ve test vektörleri yaz.
- **Bu bir öğretim fırsatıdır:** Lobide küçük bir "Bu kod nasıl çalışıyor?" kutusu olur. Açıklama TC kimlik numarasının son hanesi ve ISBN benzetmesiyle yapılır.
- Kutu şu dürüst notu da içerir: *"Bu kod yazım hatasını yakalar ama sahteciliği engellemez. Sahteciliği engellemek için dijital imza gerekir. Onu ileride Hash odasında göreceğiz."*
- Kod girildiğinde damgalar ve rütbe geri gelir. Hatalı kodda kibar bir uyarı gösterilir.

---

## 5. Türk alfabesi modülü (en kritik altyapı)

Tüm odalar tek bir saf modülü (`turkce-alfabe.js` veya repo düzenine uygun bir ad) kullanır.

- **Alfabe:** 29 harf, tam olarak bu sırayla, 0'dan 28'e kadar indekslenir:
  `A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z`
- **Normalizasyon:** Girdi önce Unicode **NFC** biçimine getirilir. Bazı klavyeler "i̇" harfini `i` + birleşik nokta (U+0307) olarak üretir; bu da ele alınmalı.
- **Büyük/küçük harf dönüşümü açık bir eşlemeyle yapılır:** `i ↔ İ`, `ı ↔ I`. `toUpperCase()` / `toLowerCase()` kullanılmaz, çünkü locale'e bağlıdır ve İ/ı'yı bozar. Şifrelemede harfin büyük/küçük hali korunur.
- **Alfabe dışı karakterler** (boşluk, rakam, noktalama, Q/W/X, emoji) değiştirilmeden geçirilir. Arayüzde Q/W/X'in Türk alfabesinde olmadığı kısa bir notla belirtilir.
- Modül saf fonksiyonlardan oluşur, DOM'a dokunmaz ve `node --test` ile build adımı olmadan test edilebilir.

**Zorunlu test vektörleri (Sezar, k = 3, Türk alfabesi):**

| Girdi | k | Çıktı |
|---|---|---|
| `MERHABA` | 3 | `ÖĞTJÇDÇ` |
| `ZEYTİN` | 3 | `CĞBVLP` (Z ve Y başa sarar) |
| `ılık` | 1 | `imil` (ı→i, büyük/küçük korunur) |
| `ÖĞTJÇDÇ` | −3 | `MERHABA` |
| `Q-W 2026!` | 5 | `Q-W 2026!` (değişmez) |

Bu vektörleri elle de doğrula. Bir vektör tutmazsa dur ve raporla.

---

## 6. Oda 1 — Sezar Çarkı

**Benzetme:** Sezar şifresi, harflerin bir dönme dolapta yer değiştirmesi gibidir. Herkes aynı sayıda koltuk kayar.

**Simülasyon:**
- SVG ile iç içe iki disk, her birinde 29 dilim (Türk alfabesi).
- Dış disk parmakla, fareyle ya da klavye oklarıyla (erişilebilirlik) döndürülür. Döndürme dilime oturur (snap).
- Kaydırma sayısı `k` canlı gösterilir.
- Yanda açık metin ve şifreli metin alanları anlık güncellenir.
- Pirinç çark estetiğinde olmalı; dönüşte hafif bir "tık" sesi olabilir (varsayılan kapalı, açılabilir).

**Çırak görevleri (öneri):**
- Dairenin gönderdiği şifreli bir mesajı verilen anahtarla çöz.
- Anahtarı bilinmeyen bir mesajda çarkı çevirerek anahtarı bul.
- Arkadaşına şifreli mesaj yaz.

Mesajların hepsi kurgusaldır, yaşa uygundur ve gerçek kişi bilgisi içermez.

**Uzman görevleri ve içerik:**
- `E(x) = (x + k) mod 29` ve `D(x) = (x − k) mod 29` formülleri.
- **Kaba kuvvet (brute force) tablosu:** 28 olası anahtarın hepsiyle çözümler listelenir. Öğrenci anlamlı olanı seçer. Buradan "Neden sadece 28 anahtar?" ve "Bu neden zayıf?" sonucuna ulaşılır.
- **Mod 29 keşfi (bölümün imza fikri):** 29 asal sayıdır. Bu yüzden afin şifrede (`ax + b`) 1'den 28'e kadar her çarpan geçerlidir: 28 × 29 = **812 anahtar**. İngilizce alfabede (mod 26) sadece 12 çarpan geçerlidir: 12 × 26 = **312 anahtar**. Burada sadece meraklandırıcı bir "sonraki oda" notu olur; afin odası ileride eklenecek.

**Kavram yanılgıları:**
- "Şifreyi kimse göremiyorsa güvenlidir." (Oysa 28 deneme yeter.)
- "Kodlama ile şifreleme aynı şeydir."

**Kapanış sorusu (örnek):** *"Bir casus 28 anahtarın hepsini denerse ne olur?"*

---

## 7. Oda 2 — Kasa Soygunu

**Benzetme:** Entropi, bir anahtarlıktaki anahtar sayısı gibidir. Hırsız anahtarları tek tek dener. Anahtarlık ne kadar büyükse soygun o kadar uzun sürer.

**Önemli kural:** Bu odada **serbest şifre giriş alanı yoktur.** Kullanıcı gerçek şifresini yazmasın diye kilit türleri hazır seçeneklerden seçilir. Örnekler kurgusaldır.

**Simülasyon:**
- Bir kasa ve kilit türü seçenekleri:
  - 3 haneli rakam kilidi,
  - doğum yılı (1900–2025 arası, 126 olasılık),
  - 4 haneli PIN,
  - 8 küçük Türkçe harf,
  - 5 rastgele kelime (7776 kelimelik bir listeden).
- Saldırgan modeli seçilir (hızlar örnektir, değerleri **[doğrula]**):
  - çevrim içi ve yavaşlatılmış (throttled),
  - çevrim dışı + hızlı hash + GPU,
  - çevrim dışı + yavaş KDF.
- **Gerçek ölçüm:** Tarayıcıda Web Crypto ile SHA-256 kullanılarak bir doğum yılı kilidi gerçekten kaba kuvvetle kırılır. Saniyedeki deneme sayısı canlı ölçülür ve "Senin cihazın: … deneme/sn" olarak gösterilir. Böylece sonuç tahmin değil, ölçüm olur.
- Büyük sayılar için logaritmik bir "zaman çizgisi" gösterilir: göz açıp kapayıncaya → bir gün → bir insan ömrü → evrenin yaşı.

**Uzman içeriği:** Entropi formülü `H = L · log₂(N)` ve hesaplanmış örnekler (aritmetiği kodda tekrar hesapla):

| Kilit | Olasılık | Entropi | 10¹⁰ deneme/sn* | 10⁴ deneme/sn* |
|---|---|---|---|---|
| Doğum yılı | 126 | ≈ 7,0 bit | anında | < 1 sn |
| 4 haneli PIN | 10⁴ | ≈ 13,3 bit | anında | ≈ 1 sn |
| 8 Türkçe küçük harf | 29⁸ ≈ 5,0·10¹¹ | ≈ 38,9 bit | ≈ 50 sn | ≈ 1,6 yıl |
| 5 rastgele kelime | 7776⁵ ≈ 2,8·10¹⁹ | ≈ 64,6 bit | ≈ 90 yıl | çok uzun |

\* Tüm uzayın taranma süresi. Ortalama süre bunun yarısıdır. Hız değerleri varsayımdır **[doğrula]**.

**Kavram yanılgıları:**
- "Uzun bir sayı güçlü şifredir."
- "Sembol eklemek şifreyi kırılmaz yapar."
- "Doğum yılım gizli, kimse bilmez."

**Kapanış sorusu (örnek):** *"Bir kelime eklemek mi, bir sembol eklemek mi kasayı daha çok güçlendirir? Neden?"*

**Sonraki faza köprü:** Odanın sonunda "Anahtar Atölyesi yakında" notu olur. Hatırlaması kolay bir sırdan her site için güçlü şifre üretme fikri burada tanıtılır, ama araç bu fazda yapılmaz.

---

## 8. Oda 3 — Görünmez Mürekkep (steganografi)

**Benzetme:** Steganografi, mektubu bir kekin içine saklamak gibidir. Kriptografi ise mektubu kimsenin okuyamayacağı bir dile çevirmektir. İkisi birlikte kullanılabilir.

**Simülasyon:**
- Hazır örnek görseller kullanılır: sitenin kendi çizimleri ya da lisansı temiz görseller. Kaynakları ve lisansları belgelenir.
- İsteğe bağlı olarak kullanıcı kendi görselini yükleyebilir. Görsel **sadece tarayıcıda** işlenir, hiçbir yere gönderilmez.
- Mesaj UTF-8 baytlara çevrilir. Önce 32 bitlik bir uzunluk başlığı, ardından mesaj bitleri R, G ve B kanallarının en düşük anlamlı bitlerine (LSB) yazılır. Alfa kanalı kullanılmaz.
- **Görselleştirmeler:**
  - Yakınlaştırılmış piksel ızgarası: önce/sonra değerleri gösterilir, fark en fazla 1'dir.
  - **"Bit düzlemi" görünümü:** Görselin LSB katmanı siyah-beyaz olarak çizilir. Mesajın gizlendiği bölge orada "kar" gibi belirir. Odanın en etkileyici anı budur.
- Sonuç **PNG** olarak indirilir. **JPEG kayıplıdır ve mesajı yok eder.** Bunu öğreten bir görev olsun: "Görseli JPEG'e çevir, sonra mesajı çözmeye çalış. Ne oldu? Neden?"
- **Teknik risk:** Bazı tarayıcılar (parmak izi korumalı Firefox, Brave) canvas piksel değerlerini rastgele değiştirebilir. Sayfa açılışında bir gidiş-dönüş öz testi yap (yaz → oku → karşılaştır). Test başarısız olursa kullanıcıya anlaşılır bir uyarı göster.

**Çırak görevleri:**
- Dairenin görselindeki gizli mesajı bul.
- Kendi mesajını gizle ve arkadaşına çözdür.

**Uzman içeriği:**
- Kapasite hesabı: `G × Y × 3` bit.
- İkili sayı sistemi ve bir piksel değerinin ±1 değişince neden fark edilmediği.
- Steganografi ile kriptografi farkı.
- Önce Sezar ile şifreleyip sonra gizleme (iki katmanlı koruma).

**Test vektörü:** `Şifre Dairesi'ne hoş geldin — ğüşiöç İı` metni gizlenip geri çıkarıldığında bayt bayt aynı olmalı. Boş mesaj ve kapasiteyi aşan mesaj da ele alınmalı.

**Kavram yanılgısı:** "Gizli mesaj görünmüyorsa şifrelenmiştir."

**Kapanış sorusu (örnek):** *"Gizlediğin mesajı biri bulursa okuyabilir mi? Bunu nasıl önlersin?"*

---

## 9. Öğretmen Masası

- **Hazır ders akışları**, örneğin:
  - Ortaokul 40 dk: Sezar Çarkı + kapanış sorusu
  - Lise 80 dk: Sezar (Uzman) + Kasa Soygunu + Proje Kapısı
  - Atölye 2×40 dk: üç odanın zinciri
- Her akış için:
  - doğrudan sunum modu linki,
  - föy linkleri,
  - süre planı,
  - bilgisayarsız (kâğıt) alternatif.
- **İnternet sorununa karşı:** Sayfa bir kez yüklendikten sonra her şey ağ bağlantısı olmadan çalışmalı. Ağ kesilince test et.

---

## 10. Teknik kurallar ve gizlilik (somut mekanizmalarla)

- **Teknoloji:** Repodaki mevcut yaklaşım neyse o kullanılır. Ağır framework eklenmez; eski bir i3 bilgisayarda ve akıllı tahtada akıcı çalışmalı.
- **Üçüncü taraf yok:** CDN, analitik, takip betiği, harici font veya harici görsel kullanılmaz. Her şey kendi sunucumuzdan gelir.
- **Ağ isteği yok — tek istisna ziyaretçi sayacı:** Sayfa yüklendikten sonra kullanıcı girdisiyle ilgili hiçbir ağ isteği yapılmaz. Bunu DevTools → Network sekmesinde doğrula ve ekran görüntüsüyle raporla.
  - **İstisna:** Sitenin kendi ziyaretçi sayacı lobide ve Faz 1 odalarında çalışabilir. Şartları:
    - sadece sayfa yolunu ve sayıyı gönderir;
    - kullanıcının yazdığı hiçbir şeyi (mesaj, görsel, kod) göndermez;
    - cookie veya kalıcı kimlik kullanmaz;
    - üçüncü taraf betik değildir.
  - CSP'de `connect-src` sadece sayacın tek adresine izin verir. Bu adresi sayaç kodundan al.
  - Sayaç **gelecekteki Anahtar Atölyesi (şifre üretici) sayfasına asla eklenmez.**
  - Lobideki gizlilik notu dürüst yazılır: *"Bu bölüm yazdıklarını kaydetmez ve hiçbir yere göndermez. Sadece sayfanın kaç kez ziyaret edildiği sayılır."*
- **Depolama yok:** `localStorage`, `sessionStorage`, cookie ve `IndexedDB` hiç kullanılmaz. Kodda bu API'leri `grep` ile ara ve sonucu raporla.
- **CSP:** Sunucu başlığı ile, ya da sunucu buna izin vermiyorsa `<meta>` ile. Öneri: `default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; object-src 'none'; base-uri 'self'`. Cenuta + Cloudflare yapısında başlığın nerede ayarlanacağını Abdullah'a adım adım açıkla.
- **Cloudflare kontrolü:** Cloudflare sayfaya kendiliğinden betik ekleyebilir (Rocket Loader, Web Analytics otomatik ekleme, E-posta gizleme, Zaraz). `/kriptoloji/` için bunların kapalı olduğunu kontrol etme adımlarını Abdullah'a yaz. Dashboard'a sen erişemezsin.
- **Site geneli betikler** (müzik oynatıcı, sayfa geçiş efektleri): Faz 1'de gizli veri işlenmediği için bunlar kalabilir. Ama ileride gelecek şifre üretici sayfası bunlardan tamamen ayrı tutulacak. Şimdiden bunu gözeten bir yapı kur.
- **Erişilebilirlik:** Her etkileşim klavyeyle yapılabilmeli. Sonuç değişimleri `aria-live` ile duyurulur. Kontrast WCAG AA, dokunma hedefleri ≥ 44 px, `prefers-reduced-motion` desteklenir.
- **Testler:** Saf modüller (`turkce-alfabe`, `sezar`, `entropi`, `steg`, `kayit-kodu`) `node --test` ile çalışır. Bölüm 5, 7 ve 8'deki test vektörlerinin hepsi teste eklenir.
- **Tarayıcılar:** Chrome, Firefox, Safari (iOS), Samsung Internet ve akıllı tahtanın tarayıcısı ile test edilir.

---

## 11. Çalışma süreci ve kabul kriterleri

Her aşamanın sonunda dur, raporla ve onay bekle. Commit'ler küçük ve Türkçe olur. `main`'e push için onay alınır.

| Aşama | Teslim | Kabul kriteri |
|---|---|---|
| 0. Denetim | CLAUDE.md, drone hangarının yapısı, tasarım değişkenleri, deploy yöntemi ve kurulu skill'ler hakkında rapor; dosya ağacı önerisi; açık sorular | Kod yazılmamış olmalı. Rapor Abdullah'ın anlayacağı dilde olmalı |
| 1. Altyapı | Türk alfabesi modülü ve testleri, kayıt kodu modülü ve testleri, ortak bileşenler (seviye, sunum modu, damga), lobi iskeleti | Tüm test vektörleri geçer. Lobi telefonda ve 1920 px'te düzgün görünür |
| 2. Sezar Çarkı | Oda, görevler, Uzman katmanı, föy | Çark klavye ve dokunmayla çalışır. İ/ı testleri geçer |
| 3. Kasa Soygunu | Oda ve canlı ölçüm | Ölçülen deneme/sn ekranda görünür. Tablo değerleri kodla yeniden hesaplanmış olur. Serbest şifre alanı yoktur |
| 4. Görünmez Mürekkep | Oda ve bit düzlemi görünümü | Gidiş-dönüş testi geçer. JPEG görevi çalışır. Canvas öz testi uyarı verir |
| 5. Öğretmen Masası | Ders akışları ve föyler | 3 akışın her biri internetsiz uçtan uca çalışır |
| 6. Kalite kontrol | Ağ, depolama ve CSP raporu; erişilebilirlik kontrolü; tarayıcı testi | Bölüm 12'deki listenin tamamı işaretlenmiş olur |

**Abdullah için öğrenme notu:** Her aşamanın sonunda `docs/kriptoloji/ogrenme-notlari/` altına kısa bir not yaz. Not şunları içersin:
- ne yapıldı,
- neden böyle yapıldı,
- bir benzetme,
- Abdullah'ın kendi deneyebileceği bir adım.

Faz sonunda bu notlar tek bir eğitim PDF'ine dönüştürülebilir olmalı.

---

## 12. Bitirmeden önce kalite kontrol listesi

- [ ] "Yazdıkların saklanmaz/gönderilmez" iddiası mekanizmalarla kanıtlandı (grep sonucu, Network ekran görüntüsü, CSP). Network'te görünen tek dış istek ziyaretçi sayacına gidiyor ve kullanıcı girdisi içermiyor.
- [ ] Türk alfabesinin 29 harfi, İ/ı dönüşümü ve NFC normalizasyonu her cihazda aynı sonucu veriyor.
- [ ] Her odada benzetme, simülasyon, görev, kapanış sorusu, föy ve öğretmen notu var.
- [ ] Benzetmeler yanlış kavram öğretmiyor.
- [ ] Hız ve kırılma süresi değerleri varsayım olarak işaretlendi; tarayıcıda gerçek bir ölçüm de gösteriliyor.
- [ ] Gerçek şifre girilebilecek bir alan yok; tüm örnekler kurgusal.
- [ ] Tarihî bilgiler ve kazanım eşlemeleri [doğrula] ile işaretli ya da kaynaklı.
- [ ] Tasarım jenerik yapay zekâ şablonuna benzemiyor ve sitenin kimliğiyle uyumlu.
- [ ] Telefon, akıllı tahta ve eski bilgisayarda akıcı çalışıyor; internetsiz çalışıyor.
- [ ] Kenar durumlar ele alındı: boş girdi, çok uzun girdi, emoji, alfabe dışı harf, kapasiteyi aşan mesaj.

---

## 13. Sonraki fazlar (şimdi yapma, sadece mimariyi bunlara açık tut)

- **Diğer odalar:** Skitale, Frekans Analizi (Türkçe harf frekansları gerçek bir metin derleminden hesaplanacak), Afin (mod 29), Vigenère, Hash Blenderı, Boya Karıştırma (anahtar değişimi), Oyuncak RSA, Mors Işığı, Enigma Atölyesi, Ebced Odası, Kod Kırma Düellosu, Hazine Avı (QR kodlu), Casus Mektup (mesaj linkin # kısmında).
- **Anahtar Atölyesi:** Durumsuz (stateless) şifre üretici. Ayrı ve izole bir sayfa olacak; sıkı CSP, site geneli betik yok, Web Crypto ile yavaş KDF kullanılacak, algoritma sürümlenecek (v1). Ayrı bir brief ile yapılacak.
- **Hipatia Misafir Salonu:** Öğrenci projesi için ayrı bir modül. Öğrencilerin adı ve proje bilgisi açıkça yazılacak. Sahiplik sınırı net olacak. Ayrı bir brief ile yapılacak.
