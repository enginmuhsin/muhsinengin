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

## Dedektif müziği
Şifre Dairesi sayfaları artık sitenin genel lo-fi müziği yerine kendi temasını çalıyor: **dedektif**. Bu, bu sayfalar için yazılmış özgün bir casus cazı; bilinen bir filmin ya da çizgi filmin ezgisi değil, çünkü onların ezgileri telifli.
- Re minör, dakikada 100 vuruş, "sallantılı" (swing) sekizlikler. 8 ölçülük döngü yaklaşık 19 saniye sürüyor.
- Dört turda katmanlar değişiyor: önce kontrbas, parmak şıklatma ve fırça; sonra boğuk saksofon ezgiyi çalıyor; sonra vibrafon ezgiyi devralıyor ve "parmak ucu" bas adımları giriyor; en sonda saksofonla vibrafon akorları birlikte çalıyor.
- Dosyası yok: her nota tarayıcıda üretiliyor (`muzik/muzik.js` → `TEMALAR.dedektif`). Hiçbir şey indirilmiyor, internetsiz de çalıyor.
- Ses düzeyi sitedeki öbür müziklerle eşitlendi (RMS ≈ 0,04).
- Odak teması gibi yalnız **Müzik** düğmesiyle açılıyor; önceki sayfada çalıyorsa sayfalar arasında sürüyor. Sınıfta kendiliğinden ses çıkmıyor.
