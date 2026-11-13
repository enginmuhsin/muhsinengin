# Öğrenme notu 6 · Efekt sesleri ve "Tekrar dene" uyarısı

## Ne eklendi?
- **Çark tıkırtısı:** Sezar çarkı her harf döndüğünde mandal gibi tıklar.
- **Kasa sesleri:** Kilit değişince sürgüler "şak" diye sürülür; ölçümde yıllar sayılırken şifre çarkı gibi tıklar; kasa açılınca "tok" sesi ve kısa bir metal çınlaması gelir.
- **Cevap sesleri:** Doğru cevapta damga vuruşu ve iki notalı küçük bir zil, yanlış cevapta iki kısa, alçak "dıt dıt".
- **Yanıp sönen uyarı:** Yanlış cevapta kırmızı **TEKRAR DENE** etiketi dört kez yanıp söner, kutu sağa sola sallanır. İkinci yanlışta etiket "Tekrar dene · 2. deneme" olur, yani aynı yanlışı yazan öğrenci de bir şeylerin değiştiğini görür.
- Üst çubukta **Efekt** düğmesi var, telefonda Menü'nün içinde. Sesi kapatır ya da açar.

## Nasıl çalışıyor? (benzetme)
Sesler bir dosyadan çalınmıyor; tarayıcının içindeki küçük bir **sentezleyici** (Web Audio) her sesi o an üretiyor. Bunu bir elektronik org gibi düşünebilirsin: kayıt çalmaz, tuşa basınca sesi kendisi yapar.
- Tık sesi = 20 milisaniyelik bir "hışırtı" (beyaz gürültü), süzgeçten geçirilip tiz bir tıka dönüşüyor.
- Kasa "tok" sesi = hızla alçalan, çok pes bir ton.
Bu yüzden indirilecek dosya yok, internet olmadan da çalışıyor.

## Kurallara uyuyor mu?
- Ses tercihi **yalnız bellekte** tutuluyor; sayfa yenilenince ses yeniden açık başlıyor. Şifre Dairesi hâlâ hiçbir şey saklamıyor.
- Tarayıcılar ziyaretçi dokunmadan ses çalmaya izin vermez. Buradaki her ses bir tıklamanın sonucu olduğu için sorun çıkmıyor.
- Cihazında "hareketi azalt" açık olan öğrencide yanıp sönme ve sallanma olmuyor; kırmızı etiket ve kırmızı çerçeve yine görünüyor.
- Telefonda yanlış cevaptan sonra klavye kendiliğinden açılmıyor, böylece uyarı yazısının üstü kapanmıyor.

## Dosyalar
- `kriptoloji/bilesenler/ses.js`: sesler ve Efekt düğmesi
- `kriptoloji/bilesenler/gorev.js` → `geriBildir()`: doğru/yanlış geri bildirimi (lobideki parola, kayıt kodu ve arşiv notu da bunu kullanıyor)
- `kriptoloji/daire.css`: `.tekrar-etiket`, `.sarsil`, `.yanlis-girdi`
- `kriptoloji/sw.js`: çevrimdışı önbellek sürümü `kripto-v11`

## Şifre Dairesi müzikleri
Abdullah'ın Pixabay'den seçtiği iki parça Şifre Dairesi'nin müziği oldu (Pixabay İçerik Lisansı; kaynak gösterme zorunlu değil, `muzik/muzik.js` başında yine de yazılı):

| Tema | Parça | Sayfalar | Döngü |
|---|---|---|---|
| `casus` | "Spy" (freesound_community) | Lobi, Kasa Soygunu | 25,26 sn = 152 vuruş/dk'da 16 ölçü |
| `dedektif` | "Spy Game" (freesound_community) | Sezar Çarkı, Görünmez Mürekkep, Öğretmen Masası | 50,37 sn |

**Dikişsiz döngü nasıl yapıldı? (benzetme)** Bir parçayı döngüye almak, bir şeridin iki ucunu birbirine yapıştırmaya benzer. Yanlış yerden keserseniz her turda "tık" diye bir atlama duyulur.
- *Spy* zaten döngü olarak bestelenmiş. Vuruşları ölçüp ölçü uzunluğunu bulduk: 4 ölçü 6,316 sn, 16 ölçü 25,263 sn. Tam ölçü çizgisinden kestik. Son notanın taşan yankısını başa ekledik, tıpkı şeridin ucundaki boyanın öbür uca taşması gibi.
- *Spy Game* uzun bir parça. Bilgisayara "parçanın hangi anı, başıyla aynı sesleri çıkarıyor?" diye ses tayfıyla aratıldı; cevap 50,37 sn sonrası oldu. O noktadan kesip çeyrek saniyelik bir çapraz geçişle başa bağladık.
- Ses düzeyleri, sitedeki öbür müziklerle aynı ortalama güçte (−27,7 dBFS) duyulacak şekilde ayarlandı.

**Davranış:** Müzik yalnız **Müzik** düğmesiyle açılıyor; açıksa sayfalar arasında sürüyor. Her parça kendi kaldığı yerden devam ediyor. Örneğin Lobi'den Sezar'a geçince casus kısılıyor ve dedektif başlıyor; Kasa'ya geçince casus kaldığı yerden devam ediyor.

**İnternet yoksa:** Dosya inemezse yerine tarayıcıda üretilen yedek dedektif müziği çalar: parmak şıklatma, kontrbas, saksofon ve vibrafon (`TEMALAR.dedektif`).
