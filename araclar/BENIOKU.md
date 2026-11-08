# araclar/

Sitenin otomatik kontrolleri. GitHub'daki **Site kontrolü** iş akışı (`.github/workflows/site-kontrolu.yml`) bunları her yüklemede çalıştırır.

| Dosya | Ne yapar |
| --- | --- |
| `konsol-tarama.cjs` | Her sayfayı gerçek bir tarayıcıda (masaüstü 1280 px ve telefon 390 px) açar; JavaScript hatası, `console.error`, site içinde 404 dönen dosya ve telefonda yatay taşma arar. Hata varsa iş akışı kırmızı olur. |
| `lighthouserc.json` | Lighthouse eşikleri: erişilebilirlik en az 95 (altı kırmızı), en iyi uygulamalar ve SEO 90, performans 50 (altı yalnızca uyarı). |
| `og-uret.cjs` | Paylaşım görsellerini (`ortak/og/*.jpg`, 1200×630) üretir. Metinler dosyanın başındaki `KARTLAR` listesindedir; sağdaki çizim mevcut görselden korunur, `ana.jpg`'nin sağına sitenin güncel ekran görüntüsü konur. İş akışında çalışmaz, elle çalıştırılır. |

Paylaşım görsellerini yeniden üretmek (yerel sunucu 8765'te açıkken; tek kart için adını yaz, ör. `ana`):
`node araclar/og-uret.cjs [ad ...]` · kurulu Chrome ile: `OG_KANAL=chrome node araclar/og-uret.cjs` · başka klasöre yazmak için `--cikti <klasör>`.

Bilgisayarda çalıştırmak için (Node ve Python gerekir):

```
npm install --no-save playwright && npx playwright install chromium
python3 -m http.server 8765 &
node araclar/konsol-tarama.cjs
```
