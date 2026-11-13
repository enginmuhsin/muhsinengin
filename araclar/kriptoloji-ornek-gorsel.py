"""Şifre Dairesi · Görünmez Mürekkep odasının örnek görsellerini üretir.

Görseller bu betikle ÇİZİLİR (dış kaynak yok, lisans sorunu yok):
  kriptoloji/murekkep/ornekler/kek.png         temiz görsel (öğrenci kendi mesajını gizler)
  kriptoloji/murekkep/ornekler/kek-mektup.png  dairenin gizli mektubu (Dosya 301)

Düz renkler ve kenar yumuşatma olmadan çizilir: böylece "bit düzlemi" sakin görünür ve
gizlenen mesaj orada kar gibi belirir. Gizleme biçimi kriptoloji/cekirdek/steg.js ile aynıdır.
Çalıştır: python araclar/kriptoloji-ornek-gorsel.py   (Pillow gerekir: pip install pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw

KOK = Path(__file__).resolve().parent.parent / 'kriptoloji' / 'murekkep' / 'ornekler'
G, Y = 480, 320
MEKTUP = ('Merhaba stajyer! Bu satırları okuyorsan görünmez mürekkebi çözdün. '
          'Kek masum görünüyordu ama içinde bir mektup vardı. '
          'Dosyayı kapatmak için parola: MÜREKKEP')

def ciz():
    im = Image.new('RGB', (G, Y), (244, 239, 228))           # kâğıt
    d = ImageDraw.Draw(im)
    for x in range(0, G, 24): d.line([(x, 0), (x, Y)], fill=(222, 228, 236))   # kareli defter
    for y in range(0, Y, 24): d.line([(0, y), (G, y)], fill=(222, 228, 236))
    d.rectangle([60, 262, 420, 276], fill=(120, 86, 52))      # masa
    d.ellipse([110, 238, 370, 270], fill=(206, 212, 220))     # tabak
    d.rectangle([140, 150, 340, 252], fill=(214, 160, 92))    # kek gövdesi
    d.rectangle([140, 186, 340, 198], fill=(245, 232, 210))   # krema katı
    d.rectangle([140, 220, 340, 230], fill=(245, 232, 210))
    d.rectangle([132, 132, 348, 156], fill=(246, 236, 222))   # üst krema
    for x in range(140, 345, 26): d.ellipse([x - 9, 146, x + 9, 168], fill=(246, 236, 222))
    for x, r in ((176, 7), (240, 7), (304, 7)): d.ellipse([x - r, 118 - r, x + r, 118 + r], fill=(196, 40, 52))  # vişneler
    d.rectangle([236, 70, 244, 112], fill=(32, 60, 140))      # mum
    d.polygon([(240, 44), (231, 64), (240, 72), (249, 64)], fill=(232, 132, 36))  # alev
    d.rectangle([370, 40, 452, 96], outline=(196, 40, 52), width=4)               # damga çerçevesi
    d.line([(382, 58), (440, 58)], fill=(196, 40, 52), width=4)
    d.line([(382, 76), (426, 76)], fill=(196, 40, 52), width=4)
    return im

def gizle(im, metin):
    veri = metin.encode('utf-8')
    bitler = [(len(veri) >> b) & 1 for b in range(31, -1, -1)]
    for x in veri: bitler += [(x >> b) & 1 for b in range(7, -1, -1)]
    duz = bytearray(im.tobytes())                             # R,G,B,R,G,B… (alfa yok)
    assert len(bitler) <= len(duz), 'kapasite yetmiyor'
    for i, b in enumerate(bitler): duz[i] = (duz[i] & 0xFE) | b
    return Image.frombytes('RGB', im.size, bytes(duz))

if __name__ == '__main__':
    KOK.mkdir(parents=True, exist_ok=True)
    temiz = ciz()
    temiz.save(KOK / 'kek.png', optimize=True)
    gizle(temiz, MEKTUP).save(KOK / 'kek-mektup.png', optimize=True)
    print('yazıldı:', KOK)
