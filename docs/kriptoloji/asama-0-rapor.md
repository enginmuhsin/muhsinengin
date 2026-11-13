# Şifre Dairesi · Aşama 0 raporu ve kararlar

Tarih: 12 Kasım 2026 · Dal: `kriptoloji-faz1` · Temel: `main` = `047c0ae`

## 1. Ziyaretçi sayacı

- Durum: `main`'de üç commit (45e3168, 7986981, 047c0ae). Kod tamam.
- Gönderilen: sayfa yolu + "bugün bu sayfada ilk mi" + "bugün sitede ilk mi". Adres:
  `https://kfpziysmsajqidkzaawh.supabase.co/rest/v1/rpc/sayac_artir`.
- Saklanan (Supabase `sayac_gunluk`): gün, sayfa, tekil, görüntülenme. IP tabloya yazılmaz.
  Supabase'in kendi istek kayıtları IP'yi bir süre tutabilir; süre plana bağlı [doğrula].
- Tarayıcıda: `localStorage` (`sayac:g:<gün>:<sayfa>`) ve 48 saatlik `sayac_site=<gün>` çerezi.
  Kimlik yok, yalnız tarih.
- **Karar:** Şifre Dairesi sayfalarında sayaç **depsuz modda** çalışır
  (`<script src="../ortak/sayac.js" data-depo="yok" defer>`): çerez ve depo okumaz/yazmaz,
  yalnız görüntülenme sayar. Bedeli: bu sayfalarda "tekil" sütunu 0 kalır ve "bu cihazı sayma"
  burada geçmez.

## 2. Repo ve yayın

- Yayın: Cenuta nginx, `main`'i 5 dakikada bir `git pull` ile çeker (CLAUDE.md).
  README'deki "GitHub Pages" ifadesi eski.
- Build yok; düz HTML/CSS/JS. Kontrol: `.github/workflows/site-kontrolu.yml`.
- Tasarım: `ortak/tokenlar.css` "İki Kalem" dili (TASARIM_PASAPORTU.md). Kart, gölge, hap düğme,
  degrade yok; çizgi, el çizimi alt çizgi/ok/halka, optik form seçicileri.

## 3. Kararlar (Aşama 0 açık sorularının cevabı)

| Konu | Karar | Gerekçe |
| --- | --- | --- |
| Yazı tipi | Yeni font yok. Fraunces + Onest; dosya numaraları sistem eş aralıklı (`--mono`) | Tasarım pasaportu: "en fazla 2 aile, yeni yazı tipi indirilmez". Special Elite, Courier Prime, IBM Plex Mono Türkçe testini geçti ama eklenmedi |
| URL | `/kriptoloji/`, `/kriptoloji/sezar/`, `/kriptoloji/kasa/`, `/kriptoloji/murekkep/`, `/kriptoloji/ogretmen/` | Tek `sw.js` bütün daireyi çevrimdışı yapar |
| İlerleme | Bellekte; sayfalar arası **adres çubuğunun `#` kısmında** taşınır (`#k=KRT-…`) | `#` sonrası sunucuya hiç gönderilmez; depo API'si gerekmez |
| Seviye | `?seviye=uzman` (brief 4.1) | Öğretmen link paylaşabilir |
| Kayıt kodu | 31 karakterlik alfabe, 5 veri + 1 kontrol, mod 31 | Ayrıntı: `ogrenme-notlari/01-altyapi.md` |
| CSP | Sayfalarda `<meta>`; isteğe bağlı Cloudflare Transform Rule | nginx'e dokunmadan çalışır |
| Tema/müzik tercihi | Site geneli betikler kalır (brief 10) | Kullanıcı girdisi değil, yalnız tercih |
| Benzetme | Brief'teki benzetme kartları kalır | CLAUDE.md "benzetme kullanma" der; brief bu bölüm için açıkça ister. Çelişki Abdullah'a bildirildi |

## 4. CSP (Şifre Dairesi sayfaları)

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' blob: data:; font-src 'self'; media-src 'self'; worker-src 'self';
connect-src 'self' https://kfpziysmsajqidkzaawh.supabase.co/rest/v1/rpc/sayac_artir;
object-src 'none'; base-uri 'self'; form-action 'none'
```

- `connect-src 'self'`: `muzik.js` MP3'ü `fetch` ile alır.
- `style-src 'unsafe-inline'`: `muzik.js` ve `ana-sayfa.js` sayfaya `<style>` ekler.
- `frame-ancestors` `<meta>` ile verilemez; istenirse Cloudflare → Rules → Transform Rules →
  Modify Response Header, yol `/kriptoloji/*`.

## 5. Cloudflare kontrol listesi (Abdullah yapar)

Cloudflare paneli → muhsinengin.com:
1. Speed → Optimization → Content Optimization → **Rocket Loader: Kapalı**.
2. Scrape Shield → **Email Address Obfuscation: Kapalı** (ya da `/kriptoloji/*` için Configuration Rule ile kapat).
3. Analytics & Logs → Web Analytics → site için **otomatik ekleme (automatic setup) kapalı**.
4. Zaraz → muhsinengin.com için **etkin değil**.
5. Doğrulama: `/kriptoloji/` sayfasında F12 → Network → sayfayı yenile → `cloudflareinsights`,
   `rocket-loader`, `email-decode`, `zaraz` adlı istek **olmamalı**.
