# Görüş ve öneriler kutusu

| Parça | Dosya | Görevi |
| --- | --- | --- |
| Form | `gorus/index.html`, `gorus.js`, `gorus.css` | Anonim görüş: rol, isteğe bağlı puan, sayfa, mesaj |
| Bağlantı | `ortak/gorus-baglanti.js` | Her sayfanın altına "Görüş ve öneriler" bağlantısı (kendisi hiçbir şey göndermez) |
| Panel | `gorus/panel/` | Yalnız yönetici okur; okundu/sil (sitede bağlantısı yok) |
| Veritabanı | `gorus/kurulum.sql` | Tablo + 4 güvenli fonksiyon |

## Kurulum (bir kez, yaklaşık 5 dakika)

1. Supabase paneli → proje → **SQL Editor** → **New query**.
2. `gorus/kurulum.sql` dosyasının tamamını yapıştır → **Run**.
3. En altta `deneme | tamam` görmelisin.
4. `https://muhsinengin.com/gorus/panel/` adresini aç, sayaç paneline girdiğin e-posta ve şifreyle gir. "Kurulum denemesi" görüşünü görürsün; **Sil** ile silebilirsin.

Not: `sayac/kurulum.sql` daha önce çalıştırılmış olmalı (panel yetkisi oradaki yönetici listesini kullanır).

## Güvenlik ve gizlilik (test edildi, PostgreSQL 16)

- Ziyaretçi yalnız `gorus_gonder` fonksiyonunu çağırabilir; tabloyu ve listeyi **okuyamaz**.
- Giriş yapmış ama yönetici olmayan hesap: "yetki yok".
- Geçersiz rol, 1–5 dışı puan, 3'ten kısa ya da 1500'den uzun mesaj reddedilir; aynı mesaj bir günde ikinci kez kabul edilmez; günde en çok 200 görüş.
- Ad, e-posta, IP, çerez yok. Mesajda e-posta ya da telefon numarasına benzer bir şey varsa form önce uyarır.
- 400 günden eski görüşler panel açılınca silinir.
- Panel mesajları her zaman düz metin olarak yazar; mesajın içine gizlenmiş kod çalışmaz.
- Şifre Dairesi sayfalarında form yoktur, yalnız bağlantı vardır: "Bu bölüm yazdıklarını hiçbir yere göndermez" sözü korunur.

## Sonra eklenebilir

- Yeni görüş gelince e-posta bildirimi (Supabase Edge Function + e-posta servisi gerektirir).
