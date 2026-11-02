# Magnet Test - prototip notları

Bu bir deneme. Amaç bitmiş oyun değil: "mıknatısla balık tutma" mekaniği telefonda eğlenceli mi, onu hissetmek. Deep Claw olduğu gibi duruyor, bu ayrı bir mod.

## 2. tur: ne değişti (ilk oynanıştan sonra)

1. **Çekim alanı çok küçüldü.** Varsayılan yarıçap 260 yerine **110**, aralık 80-420 yerine **60-200**. Çekim artık mesafeyle düz bir çizgide azalıyor (eskiden daha sert düşüyordu), böylece küçük alanda da "kayıp yapışma" görülebiliyor. Mıknatıs artık süpürge değil, biraz hata payı veren bir kanca.
2. **Ayarlar yeni bir anahtarla saklanıyor** (`deepclaw.magnet.settings.v2`). Telefonda kalan eski büyük değerler yeni varsayılanları ezmez. İlk açılışta ayarların hepsi varsayılana dönmüş olacak.
3. **El bombası çekim alanından hiç etkilenmiyor.** Kaymaz, titremez. Sadece mıknatısın yüzü doğrudan değerse patlar (patlama aynı: çevresindeki eşyaları ve mıknatısın taşıdığı yükü yok eder). Küçük bir kural değişikliği daha: eskiden mıknatıs neredeyse doluyken bombaya değerse patlamıyor, "takılıyordu". Artık kapasite fark etmez, değen bomba patlar.
4. **Lastik, bot ve taş kaldırıldı.** Metal olmayan eşya yok. Yerlerine **ağır ve ucuz hurda metaller** geldi. Hepsi çekilir ve yapışır, ama kapasiteyi yer ve yavaş geri gelir (Deep Claw'daki kayalar gibi).
5. **"Kanal Testi" baştan yerleştirildi** ve simülasyonla dengelendi. Hedef 800 yerine **2200**.
6. Kapasiteye sığmayan bir eşyaya çarpınca çıkan yazı "TAKILDI" yerine **"SIĞMADI"**. Artık takılmanın tek sebebi bu.

## Nasıl açılır

- Ana menüde kırmızı **Magnet Test** düğmesi (Levels düğmesinin altında).
- Ya da oyunun adresinin sonuna `?mode=magnet` ekle. Örnek: `.../index.html?mode=magnet`. Doğrudan prototip açılır.
- Bilgisayarda: `npm run dev`, sonra `http://localhost:5173/?mode=magnet`.

Dokunuş: ekranın herhangi bir yerine dokun, mıknatıs iner. Klavyede Boşluk veya Aşağı ok. `G` ayar panelini açar/kapar, `Esc` panelden/modden çıkar.

Bu modun sonucu hiçbir şeyi kaydetmez: para, yıldız, ilerleme yok. Deep Claw kaydına dokunmaz. Sadece ayarların hatırlanır.

## Oyun: "Kanal Testi"

60 saniye, hedef 2200 para. Köprüden bulanık bir kanala bakıyorsun. Mıknatıs Deep Claw kancası gibi sallanır ve iner. Kanaldaki her şey metal: değen ya da çekim alanında yanından geçen eşya yapışır. Yük yüzeye gelince hepsi birden teslim edilir.

| Eşya | Değer | Ağırlık | Not |
|---|---|---|---|
| Bozuk para kümesi | 50 | 0,5 | hafif |
| Çakı | 70 | 0,6 | hafif |
| Anahtar destesi | 90 | 0,8 | hafif |
| Paslı bisiklet | 300 | 3,5 | değerli, ağır |
| Kilitli kasa | 150 ile 700 arası (ortalama 425) | 4 | değerli, teslimatta açılır |
| Alışveriş arabası | 450 | 6 | değerli, çok ağır: varsayılan kapasitede ancak mıknatıs boşken yapışır |
| Paslı demir boru | 15 | 3 | hurda |
| Rögar kapağı | 20 | 4 | hurda |
| Paslı zincir yığını | 25 | 3,5 | hurda |
| Eski motor bloğu | 40 | 6 | hurda, tek başına kapasiteyi doldurur |
| Eski el bombası | 0 | - | çekilmez, değerse patlar |

**Hurda neden tuzak:** varsayılan kapasite 6. Önüne bir boru (3) çıkarsa, arkasındaki kasa (4) artık sığmaz: mıknatıs kasaya çarpar, "SIĞMADI" der ve sadece boruyla, yavaşça geri gelir. Değerli eşyaya ulaşmak için hurdayı atlatacak açıyı seçmen ya da önce hurdayı temizlemen gerekir.

**Yerleşim:**
- Üstte hafif bozuk paralar. Anahtar destesi tam başlangıcın altında.
- **Kasa** ortanın biraz solunda. Sol yarısını bir boru örtüyor, sağında bir bomba bekliyor. Aralarında yaklaşık **14 derecelik** açık su var (eskiden 6 derece).
- **Bisiklet** sağda. Sağ yarısını bir zincir yığını örtüyor, yanında ikinci bomba var. Açık pencere yaklaşık 9 derece.
- **İki alışveriş arabası** başlangıçta tamamen hurdanın arkasında. Soldakinin önünde zincir yığını ve motor bloğu, sağdakinin önünde bisiklet ve bir boru var. Önce onları temizlemek gerekiyor.
- Altta, rögar kapaklarının arkasında birkaç hafif eşya.

Süre bitince ya da kanalda alınacak bir şey kalmayınca bölüm biter; inen mıknatıs önce geri gelir.

### Neyi denemeni öneririm

1. Önce ayarları elleme. Halkanın ne kadar küçüldüğüne bak. Bir eşyanın hemen yanından geçince ona doğru kaydığını gör: hafif eşyalar belirgin kayar, ağır olanlar neredeyse hiç.
2. Bombanın yanından kasten geç. Halkanın içinde kalsa bile kıpırdamamalı.
3. Kasayı boru ile bomba arasından al.
4. Bir arabaya ulaşmayı dene: önündeki hurdayı mı temizlersin, yoksa başka şeye mi gidersin? Bu bölümün asıl kararı bu.
5. Kapasiteyi 8'e çıkar, sonra 4'e indir. 8'de boru artı kasa sığar ve tuzak yumuşar. 4'te araba ve motor bloğu hiç alınamaz, engel olur.
6. Davranışı (panelde mavi düğme) değiştirip aynı seviyeyi oyna.

## Ayar paneli

Oyun ekranında sağ üstteki **dişli** düğmesi. Panel alttan açılır, yarı saydam. Oyun arkada çalışmaya devam eder, sadece **süre sayacı durur**. Değerler telefonda hatırlanır. **Varsayılana dön** hepsini sıfırlar.

| Ayar | Ne işe yarar | Aralık | Varsayılan |
|---|---|---|---|
| Çekim yarıçapı | Mıknatısın yüzünden eşyanın ortasına kadar ölçülen alan. İçindeki eşyalar (bomba hariç) mıknatısa kayar. | 60 - 200 | 110 |
| Çekim gücü | Alandaki eşyaların ne hızla kaydığı. Kenara doğru azalır, eşya ağırsa yavaşlar. | 100 - 1600 | 700 |
| Kapasite | Mıknatısın taşıyabileceği toplam ağırlık. Dolunca geri döner. Kalan kapasiteye sığmayan eşya yapışmaz, mıknatıs ona çarpıp durur. | 2 - 20 | 6 |
| İniş hızı | Mıknatıs ne hızla iner. | 300 - 1500 | 850 |
| Davranış | **Süpürme:** kapasite dolana, kenara ya da sığmayan bir şeye çarpana kadar iner, yoldaki her şeyi toplar. **İlk yapışmada dur:** ilk eşya yapışınca geri döner. | iki seçenek | Süpürme |
| Halka | Çekim alanını gösteren halka. Kapalıyken de alan çalışır. | açık / kapalı | açık |

Ayarlarda olmayıp `src/config/magnet.ts` içinde olanlar: eşya değerleri ve ağırlıkları, geri çekme gücü, çekimin mesafeyle azalma eğrisi (`falloffPower`, şimdi 1), bomba yarıçapı, "bomba yükü de yok etsin mi", seviye yerleşimi ve hedef.

## Denge ölçümleri

Ölçümler `npx vite-node tools/magnet-balance.ts` ile alındı. Para beklenen değerle sayılır (kasa 425), böylece sonuç tekrarlanabilir. Kanaldaki toplam para 2625.

**Çekim alanının hata payı** (850 iniş hızında, eşyanın yanından düz geçerken; "doğrudan değme" mesafesinin üstüne eklenen kısım):

| Eşya | Eski (260, sert eğri) | Yeni (110, düz eğri) |
|---|---|---|
| Bozuk para | +98 px | +28 px |
| Anahtar | +60 px | +20 px |
| Kasa | +16 px | +4 px |
| Bisiklet | +16 px | 0 |
| Boru / motor bloğu | +18 / +10 px | +2 / +2 px |

**Oyuncu simülasyonları** (varsayılan ayarlar):

| | Süpürme | İlk yapışmada dur |
|---|---|---|
| Kusursuz oyuncu: hedefe ulaştığı an | **39,8 sn** | 33,9 sn |
| Kusursuz oyuncu, kasa en düşük (150) çıkarsa | 49,2 sn | 42,9 sn |
| Kusursuz oyuncu, kasa en yüksek (700) çıkarsa | 33,2 sn | 29,9 sn |
| Kusursuz oyuncu: kanalı bitirdiği an / toplam | 55,7 sn, 2555 | 49,5 sn, 2555 |
| İyi oyuncu (doğru kararlar, dokunuşu 0,1 sn'ye kadar şaşıyor), 20 oyun | ort. 2343, %75 hedefe ulaştı, ort. 55,1 sn'de | ort. 2488, %90 ulaştı, ort. 45,7 sn'de |
| Sıradan oyuncu (rastgele anlarda dokunuyor), 60 oyun | ort. 1046, %0 hedefe ulaştı | ort. 926, %0 |
| Kasa penceresi (başlangıçta) | 14 derece | 0 (önce üstteki anahtar yapışır) |
| Bisiklet penceresi (başlangıçta) | 8,75 derece | 0,75 derece |

"Kusursuz oyuncu" her atıştan önce bir tam salınım boyunca her anı dener, en umut verici olanlar için bir sonraki atışı da hesaplar ve saniye başına en çok parayı seçer.

Hedefi değiştirmek istersen (Süpürme, kusursuz oyuncu / sıradan oyuncunun kazanma oranı): 1600 → 23,9 sn / %10, 1800 → 33,2 sn / %3, 2200 → 39,8 sn / %0.

## Dürüst gözlemlerim

Güven düzeyleri: [Kesin] ölçtüm ya da kodda görüyorum, [Muhtemel] ölçümden çıkarım, [Tahmin] tasarımdan tahmin.

1. **[Kesin] Bu hedef zor.** İstediğin gibi kusursuz oyuncu hedefe yaklaşık 40. saniyede ulaşıyor, ama bunun bedeli şu: rastgele dokunan oyuncu hiç kazanamıyor (eskiden %40), doğru kararları verip sadece biraz şaşan "iyi oyuncu" bile %25 oranında kaçırıyor ve genelde son saniyelerde yetişiyor. Gerçek bir insan muhtemelen ikisinin arasında, yani çoğu oyunda kaybedebilirsin. Fazla zor gelirse `src/config/magnet.ts` içinde `target` değerini 1800'e indirmek en basit ayar.
2. **[Kesin] Kasanın rastgele parası sonucu çok oynatıyor.** Kusursuz oyuncu bile kasa 150 çıkarsa 49 saniyede, 700 çıkarsa 33 saniyede hedefe ulaşıyor. Şans payı istiyorsan iyi; istemiyorsan kasanın aralığını daraltmak gerekir.
3. **[Kesin] Bölüme bir şey ekledim:** ikinci bir alışveriş arabası ve birkaç hafif eşya (18 yerine 25 eşya). Sebep: sadece hedefi yükseltmek yetmiyordu. İlk denediğim 18-21 eşyalı yerleşimlerde kusursuz oyuncu kanalı 31-44 saniyede tamamen bitiriyordu; hedefi 40. saniyeye koymak "neredeyse her şeyi topla" (toplamın %95'i) demek oluyordu. Daha çok içerik, hedefin toplamın %84'ünde kalmasını sağladı.
4. **[Muhtemel] Çekim alanı artık hafif eşyalarda hissediliyor, ağırlarda neredeyse hiç.** Bozuk para 28 px öteden kayıp yapışıyor, kasa 4 px, bisiklet ve hurda hiç. Bu "ağır şey zor kıpırdar" mantığına uygun, ama mıknatısın "büyük uçlu bir kanca" gibi hissetme riski var. Ağır eşyaların da biraz kaymasını istersen çekim gücünü artırmak yerine `falloffPower` ya da ağırlık bölmesi ayarlanmalı.
5. **[Kesin] Süpürme davranışında ters bir durum var:** kasayı aldıktan sonra mıknatıs inmeye devam ediyor ve arkasındaki hurdaya (motor bloğu, rögar kapağı) çarpıp duruyor. Yani hurda bazen işine yarıyor: dalışı erken bitirip ağır yükün dönüş yolunu kısaltıyor. Sezgiye ters gelebilir. İlk yapışmada dur davranışında bu yok.
6. **[Kesin] İlk yapışmada dur davranışında kasa ilk atışta alınamıyor**, çünkü üstteki anahtar destesi önce yapışıp mıknatısı geri çağırıyor. Bölümü Süpürme'ye (varsayılan) göre dengeledim.
7. **[Kesin] Arabalar başlangıçta hiçbir açıdan alınamıyor**, önce hurda temizlenmeli. İstediğin "en az iki değerli eşyaya doğrudan ulaşılabilsin" kuralını kasa ve bisiklet sağlıyor.
8. **[Tahmin] Bisiklet de pas renginde**, yeni hurdalarla aynı renk ailesinde. Şekli çok farklı olduğu için ekran görüntüsünde karışmıyor, ama küçük ekranda bir bakışta ayırt etmek zorlaşabilir. Gerçek çizimde bisikleti daha canlı bir renge almanı öneririm.
9. **[Kesin] Gerçek telefonda denenmedi.** Testler yazılımla çizen Chromium'da koştu (yaklaşık 6 FPS). Akıcılık ve dokunma hissi hakkında bir şey söyleyemem.
10. **[Kesin] Sesler ve görseller hâlâ geçici.** Hurdalar basit yer tutucu SVG.

## Teknik özet

- Kurallar `src/systems/MagnetSession.ts` (Phaser'sız), ayar saklama `src/systems/MagnetSettings.ts`, tüm sayılar `src/config/magnet.ts`.
- Denge simülasyonu `src/systems/MagnetBalance.ts` (kusursuz oyuncu, sıradan oyuncu, açı taraması). Rapor: `npx vite-node tools/magnet-balance.ts` (yaklaşık 35 saniye sürer). Birim testleri kasa penceresini, doğrudan ulaşılabilen değerlileri ve kusursuz oyuncunun 35-45 saniye aralığını kontrol ediyor; bölümü değiştirirsen `npm test` haber verir.
- Bu turda kaldırılanlar: `metal` alanı ve metal olmayan eşya kodu (artık her şey metal), tire/boot/stone görselleri ve kayıtları. "Takılma" kodu sadece kapasiteye sığmayan eşyalar için duruyor.
- Görseller: `public/assets/images/mg_*.svg`, listesi `docs/ASSETS.md` içinde. `npm run assets:magnet-art` bu 12 dosyayı baştan üretir ve senin değiştirdiklerini ezer.

## Bilinen eksikler

- Telefonda test yok.
- Tek bölüm, kayıt yok, dükkân yok, yıldız yok, duraklatma ekranı yok.
- Çekilen eşyalar diğer eşyaların içinden geçerek mıknatısa gelebiliyor ve yapışan eşyalar üst üste biniyor; görsel olarak kaba.
- Denge sadece simülasyonla yapıldı.
