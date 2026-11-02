# Magnet Test - prototip notları

Bu bir deneme. Amaç bitmiş oyun değil: "mıknatısla balık tutma" mekaniği telefonda eğlenceli mi, onu hissetmek. Deep Claw olduğu gibi duruyor, bu ayrı bir mod.

## Nasıl açılır

- Ana menüde kırmızı **Magnet Test** düğmesi (Levels düğmesinin altında).
- Ya da oyunun adresinin sonuna `?mode=magnet` ekle. Örnek: `.../index.html?mode=magnet`. Doğrudan prototip açılır.
- Bilgisayarda: `npm run dev`, sonra `http://localhost:5173/?mode=magnet`.

Dokunuş: ekranın herhangi bir yerine dokun, mıknatıs iner. Klavyede Boşluk veya Aşağı ok. `G` ayar panelini açar/kapar, `Esc` panelden/modden çıkar.

Bu modun sonucu hiçbir şeyi kaydetmez: para, yıldız, ilerleme yok. Deep Claw kaydına dokunmaz. Sadece ayarların (aşağıda) hatırlanır.

## Oyun: "Kanal Testi"

60 saniye, hedef 800 para. Köprüden bulanık bir kanala bakıyorsun. Mıknatıs aynı Deep Claw kancası gibi sallanır ve iner.

**Metal** eşyalar mıknatısa çekilir ve yapışır: bozuk para kümesi (50, hafif), anahtar destesi (90), çakı (70), paslı bisiklet (300, ağır), alışveriş arabası (450, çok ağır), kilitli kasa (150 ile 700 arası rastgele, teslimatta açılır) ve **eski el bombası** (değeri yok, yapışırsa patlar).

**Metal olmayan** eşyalar (lastik, bot, taş) çekilmez. Mıknatıs bunlara çarparsa takılır ve o anki yüküyle geri döner.

Yük yüzeye gelince hepsi birden teslim edilir. Süre bitince ya da kanalda alınacak metal kalmayınca bölüm biter; inen mıknatıs önce geri gelir (Deep Claw ile aynı kural).

### Neyi denemeni öneririm

1. Önce ayarları elleme. Doğrudan aşağıya at: ortada anahtar destesi var, kolay para.
2. Halkaya bak. Mavi yarı saydam halka çekim alanı. İçindeki metal eşyalar titreyerek mıknatısa kayar.
3. Ortadaki lastiğin arkasında **kasa** var. Düz atınca lastiğe takılırsın. Kasayı almak için lastiğin hafif sağından geçecek bir açı lazım (ekran görüntüsünde sağ orta). Çekim yarıçapını büyütünce daha kolay olur.
4. **El bombaları** değerli şeylerin yanında (bisikletin yanı, sağ alttaki paraların yanı). Çekim yarıçapı büyükse bombayı da çekersin. Bomba yapışınca patlar, yanındaki eşyaları ve mıknatısın taşıdığı yükü de yok eder, mıknatıs boş döner.
5. İki davranışı karşılaştır (panelde mavi düğme). Aynı seviyeyi ikisiyle de oyna.
6. Kapasiteyi 2'ye indir, sonra 14'e çıkar. Hissini karşılaştır.
7. Ağır şeyleri (araba, bisiklet) tek başına çek: dönüş ne kadar yavaş?

## Ayar paneli

Oyun ekranında sağ üstteki **dişli** düğmesi. Panel alttan açılır, yarı saydam. Oyun arkada çalışmaya devam eder, sadece **süre sayacı durur** (ayar yaparken süre yanmasın diye). Panelin üstündeki alana dokunarak atış yapıp değişikliği hemen deneyebilirsin. Değerler telefonda hatırlanır. **Varsayılana dön** hepsini sıfırlar.

| Ayar | Ne işe yarar | Aralık |
|---|---|---|
| Çekim yarıçapı | Mıknatısın etrafındaki alan. Büyüdükçe nişan almak kolaylaşır, ama bombayı ve istemediğin şeyleri de çekersin. | 80 - 420 |
| Çekim gücü | Alandaki eşyaların ne hızla kaydığı. Mesafe arttıkça zayıflar, eşya ağırsa yavaşlar. | 100 - 1600 |
| Kapasite | Mıknatısın taşıyabileceği toplam ağırlık. Dolunca geri döner. Kalan kapasiteye sığmayan metal eşya yapışmaz, engel gibi davranır (mıknatıs takılır). | 2 - 20 |
| İniş hızı | Mıknatıs ne hızla iner. Hızlıysa süre kazanırsın, yavaşsa daha rahat nişan alırsın. | 300 - 1500 |
| Davranış | **Süpürme:** kapasite dolana, kenara ya da metal olmayan bir şeye çarpana kadar iner, yoldaki her şeyi toplar. **İlk yapışmada dur:** ilk eşya yapışınca geri döner (Deep Claw'a daha yakın). | iki seçenek |
| Halka | Çekim alanını gösteren halka. Kapalıyken de alan çalışır, sadece görünmez. | açık / kapalı |

Ayarlarda olmayıp `src/config/magnet.ts` içinde olanlar (istersen söyle, panele ekleyeyim): geri çekme gücü, çekimin mesafeyle zayıflama eğrisi, bomba yarıçapı, "bomba yükü de yok etsin mi", eşya ağırlıkları ve değerleri, seviye yerleşimi ve hedef.

## Önerdiğim başlangıç değerleri

Çekim yarıçapı **260**, çekim gücü **700**, kapasite **6**, iniş hızı **850**, davranış **Süpürme**, halka **açık**. Bunlar paneldeki varsayılanlar.

Nasıl seçtim: kodla bir "sıradan oyuncu" simülasyonu çalıştırdım (rastgele zamanlarda dokunan, nişan almayan biri, 60 oyun). Son varsayılanlarla sonuçlar:

- **Süpürme:** ortalama 710 para, hedefi (800) tutturan %40.
- **İlk yapışmada dur:** ortalama 852 para, hedefi tutturan %52.
- Kapasite 14 yapınca Süpürme ortalaması 834'e çıkıyor. Kapasite 8 ile 14 neredeyse aynı sonucu veriyor (836 ve 834, ilk denemelerde): 8 ve üstünde kapasiteyi bu seviyede hiçbir şey zorlamıyor, ayarın anlamı kalmıyor. 6'da gerçek bir seçim çıkıyor: kasa ile bisiklet aynı atışta sığmıyor.
- Çekim yarıçapı en güçlü zorluk ayarı çıktı (Süpürme): 120'de ortalama 597, 260'ta 710, 380'de 875.
- Hedefi 800 yaptım ki sıradan oyuncu kabaca yarı yarıya kazansın.

[Muhtemel] Bunlar bir simülasyon, gerçek insan değil. Gerçek hissi sadece sen telefonda görebilirsin; sayıları güvenme, hisse güven.

## Deep Claw'a göre dürüst gözlemlerim

Güven düzeyleri: [Kesin] ölçtüm ya da kodda görüyorum, [Muhtemel] ölçümden çıkarım, [Tahmin] hissettiğim için değil, tasarımdan tahmin ediyorum.

1. **[Kesin] Gerçek telefonda denenmedi.** Testler yazılımla çizen Chromium'da koştu (yaklaşık 6 FPS). Akıcılık ve dokunma hissi hakkında hiçbir şey söyleyemem. Mantık testleri oyunu kodla ilerleterek yapıldı.
2. **[Muhtemel] Çekim alanı oyunu Deep Claw'dan belirgin biçimde kolaylaştırıyor.** Kancada eşyaya tam isabet etmek gerekiyor. Burada yarıçap kadar hata payın var. Bu yüzden "nişan alma becerisi" yerini "hangi sütunu seçeceğim, neyi çekmeyeceğim" kararına bırakıyor. Eğlence buradan gelecekse (bombalar, lastikler, kapasite) iyi; nişan hazzını seviyorsan mod ona benzemeyebilir.
3. **[Kesin] Mükemmel nişancı kanalı yaklaşık 15 saniyede boşaltıyor** (Süpürme: 4 atışta 1670 / 1785, simülasyon; İlk-yapışmada-dur: 8 atışta 1370). Yani yetenekli bir oyuncu için 60 saniye fazla uzun, seviye çok az eşya içeriyor. İnsan bu kadar kusursuz oynayamaz, ama "ustalaşınca sıkılır" riski gerçek. Daha çok eşya ya da yeniden dolan eşya gerekebilir. İlk-yapışmada-dur modu daha Deep Claw gibi (her atış tek karar).
4. **[Kesin] Kasayı almak dar bir zamanlama.** Lastiğin yanından geçen açı penceresi yaklaşık 6 derece. Salınımın ortasında bu yaklaşık 35 ms eder. Yani neredeyse şans atışı. Yarıçap büyütünce genişliyor. Bunu bilerek "değerli ve zor" bıraktım ama hoşuna gitmezse kasayı kolaylaştırırız.
5. **[Kesin] El bombası bilerek acımasız:** yapışınca yanındaki yükü de yok ediyor. `blastDestroysCarried` ile kapatılabilir. İlk denemede muhtemelen can sıkıcı gelir; bir şey öğrenmek için bırakıyorum.
6. **[Muhtemel] Ağır yük gerilimi çalışıyor:** 6 ağırlık yük 200 px/sn ile geliyor (Deep Claw'da büyük altın 125 px/sn). Dönüş yolunda beklemek sayaçla birlikte baskı yaratıyor.
7. **[Kesin] Sesler jenerik.** Mevcut sesleri yeniden kullandım (kanca sesi, taş sesi...). Mıknatıs "tak" sesi ya da elektrik cızırtısı yok. Hissi ciddi biçimde etkileyebilir, ama istediğin gibi cila yapmadım.
8. **[Kesin] Görseller geçici SVG.** Köprü ve su basit şekiller, vinç ve madenci Deep Claw'dan. Sular "bulanık" ama derinlik hissi zayıf.
9. **[Tahmin]** Asıl eğlence kaynağı yük arttıkça mıknatısa yapışan eşyaların birikmesi ve el bombasının "ya patlarsa" gerilimi olabilir. Bunu ancak elinde oynayınca anlarız.

## Teknik özet

- Kurallar `src/systems/MagnetSession.ts` (Phaser'sız), ayar saklama `src/systems/MagnetSettings.ts`, tüm sayılar `src/config/magnet.ts`.
- Yeniden kullanılanlar: `Claw` (sallanma, fırlatma, geri çekme), `Collision` (swept), keg patlaması, `AudioManager`, `Backdrop`, HUD bileşenleri, `Slider`/`Button`.
- Mevcut koda dokunulanlar (hepsi geriye uyumlu): `Claw` (ayar tipi genişledi, `recall()` ve isteğe bağlı `carriedWeight` eklendi), keg patlama kodu `Session` içinden `src/systems/Explosion.ts`'e taşındı ve `Session` onu çağırıyor, `Slider` (`setValue` ve isteğe bağlı dokunma yüksekliği), `Preload` (`?mode=magnet`), `MainMenu` (düğme), `main.ts`, `manifest.ts`, `e2e/helpers.ts` (isteğe bağlı sahne parametresi).
- Görseller: `public/assets/images/mg_*.svg`. Değiştirmek için aynı adla ve boyutta dosya koy. `npm run assets:magnet-art` komutu bu 11 dosyayı baştan üretir ve senin değiştirdiklerini ezer, sadece ilk halini istersen çalıştır.

## Bilinen eksikler

- Telefonda test yok (yukarıda).
- Tek bölüm, kayıt yok, dükkân yok, yıldız yok, duraklatma ekranı yok. Sekme arka plana gidince oyun donuyor (tarayıcı çizimi durdurur), ama ayrıca bir duraklatma ekranı yapmadım.
- Metal eşyaların birbirinin içinden geçerek mıknatısa gelmesi ve yapışan eşyaların birbirinin üstüne binmesi görsel olarak kaba.
- Çekim eğrisi ve ağırlıklar sadece simülasyonla ayarlandı.
