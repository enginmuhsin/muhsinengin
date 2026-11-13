# Şifre Dairesi · Faz 1 kalite raporu (Aşama 6)

Tarih: 13 Kasım 2026 · Dal: `kriptoloji-faz1` · Test ortamı: Chrome (masaüstü 1920 px, telefon 360 px, açık/koyu tema)

## Brief bölüm 12 kontrol listesi

| | Madde | Kanıt |
| --- | --- | --- |
| ✅ | "Yazdıkların saklanmaz/gönderilmez" mekanizmalarla kanıtlandı | Aşağıda: grep, ağ kaydı, CSP. Canlıda DevTools ekran görüntüsü Abdullah'ta (adım 3). |
| ✅ | 29 harf, İ/ı dönüşümü, NFC her cihazda aynı | `toUpperCase/toLowerCase` hiç kullanılmıyor; elle eşleme + testler (NFC, ayrık nokta, `İ → İ`). |
| ✅ | Her odada benzetme, simülasyon, görev, kapanış, föy, öğretmen notu | 3 oda × 7 dosya + lobi giriş dosyası = 22; üç föy (A4, cevap anahtarı ayrı sayfada). |
| ✅ | Benzetmeler yanlış kavram öğretmiyor | Dönme dolap: "sona gelen başa döner" (mod). Anahtarlık: anahtar sayısı = olasılık. Kek: saklamak ≠ okunamaz yapmak. |
| ✅ | Hızlar varsayım olarak işaretli; gerçek ölçüm var | Kasa: "hızlar varsayımdır" etiketi + öğretmen notu; Web Crypto SHA-256 laboratuvarı. |
| ✅ | Gerçek şifre girilebilecek alan yok | Kasa'da yalnız sayı cevabı kutuları (`inputmode=numeric/decimal`); `textarea` ve `type=password` yok (testle denetlendi). |
| ⚠️ | Tarihî bilgiler ve kazanımlar [doğrula] | Sitede tarihî iddia yok; MEB kazanımları "henüz eşlenmedi". Taslak: `proje-kapisi-taslak.md`. |
| ✅ | Tasarım jenerik değil, sitenin kimliğiyle uyumlu | İki Kalem token'ları; yeni font yok; kart/gölge/degrade yok; dosya sekmesi, damga, pirinç çark. |
| ✅ | Telefon, akıllı tahta, eski bilgisayar; internetsiz | 360 ve 1920 px ekran görüntüleri; görseller 1200 px'e küçültülür; çevrimdışı test 10/10. |
| ✅ | Kenar durumlar | Boş girdi, 100 000 karakter, emoji, Q/W/X, ayrık noktalı i, kapasiteyi aşan mesaj, mesajsız görsel, JPEG bozulması: testlerde ve tarayıcıda. |

## Kanıtlar

**Depolama (grep, `kriptoloji/`):** `localStorage`, `sessionStorage`, `document.cookie`, `indexedDB` → kodda **yok** (tek eşleşme bir açıklama satırı). Önbellekte (`sw.js`, Cache Storage) yalnız sitenin kendi dosyaları durur.

**Ağ:** 8 sayfa yüklenip kullanıldığında 48 istek, **hepsi kendi sunucumuza**. Kodda ağ çağrısı yalnız `sw.js`'te (kendi dosyalarını önbelleğe alma). Tek dış istek, canlıda sayacın tek adresidir: `…supabase.co/rest/v1/rpc/sayac_artir`; gönderilen yalnız `{p_yol, p_tekil:false, p_site_tekil:false}` (sanal tarayıcı testinde gösterildi).

**CSP:** Bütün 8 sayfada `<meta http-equiv="Content-Security-Policy">`. Testlerde CSP ihlali yok. HTML'de satır içi betik, `style=""` ve `onclick=""` yok. Dışarıdan sayfaya betik sokmaya çalışan test aracı CSP tarafından engellendi.

**Erişilebilirlik:** axe-core (WCAG 2.1 AA), 8 sayfa × açık/koyu × Çırak/Uzman: **0 ihlal**. Telefonda 44 px'ten küçük dokunma hedefi yok. Çark `role=slider`, klavyeyle Tab + oklar. `prefers-reduced-motion` → damga animasyonsuz. Sonuçlar `aria-live` ile duyurulur.

**Testler:** `node --test testler/kriptoloji/*.test.mjs` → 35/35. GitHub iş akışına eklendi.

## Yol üstünde bulunup düzeltilenler

- Kâğıt çarkta iç ve dış disk farklı ölçekteydi (kesince oturmazdı).
- 10⁴ olasılık 2^(log₂) yoluyla 9999,99… çıkıyordu.
- `daire.css` içindeki `@import`, sitenin sayfa geçiş efektini iptal ediyordu; `tokenlar.css` artık `<link>` ile.
- Telefonda zaman çizgisi okunmuyordu; seçenek açıklamaları sıkışıyordu.
- Kâğıt kodunda kırmızı yazı, kraft zeminde kontrast eşiğinin altındaydı.

## Bu ortamda yapılamayanlar (Abdullah'ın adımları)

1. **Diğer tarayıcılar.** Firefox, Safari (iPhone/iPad), Samsung Internet ve akıllı tahtanın tarayıcısı bu bulut ortamına kurulamadı (indirme sitesi kapalı). Her birinde: lobi → giriş dosyası → Sezar çarkını parmakla çevir → Kasa'da "Kasayı kır" → Mürekkep'te "Mektubu çıkar" ve "Mesajı gizle". Firefox'ta "parmak izi koruması" açıksa Mürekkep odasının başında uyarı görünmeli.
2. **Cloudflare kontrolü.** `asama-0-rapor.md` bölüm 5'teki dört ayar.
3. **Canlı ağ kanıtı.** Yayından sonra `muhsinengin.com/kriptoloji/` → F12 → Network → yenile → sayfada gezin. Listede dış adres olarak yalnız `kfpziysmsajqidkzaawh.supabase.co` görünmeli. Ekran görüntüsünü `docs/kriptoloji/` altına koy.
4. **Eski i3 bilgisayar.** Mürekkep'te "Bir sayfalık mektup gizle" ve Kasa'da ölçüm, birkaç saniyeden kısa sürmeli.

## Bilinen küçük durum

Otomatik testte, sürükleme gibi işlemlerden hemen sonra odadan lobiye geçerken Chrome bazen "View transition aborted" yazıyor. Normal kullanımda görülmedi; olursa yalnız geçiş animasyonu atlanır, sayfa normal açılır.
