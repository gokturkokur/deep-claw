# Rapor

## Yapılanlar

**Temel oyun**
- Phaser 3.90.0 + TypeScript (strict) + Vite. `npm run build` hatasız, `base: './'`.
- Kanca durum makinesi, süpürmeli çarpışma, dt en fazla 50 ms, 9+2 nesne türü (altın x3, elmas, kaya x2, gizemli torba, barut fıçısı, böcek, hazine sandığı, asit balçığı).
- Kayıt (localStorage, sürümlü, bozuk veriye dayanıklı), İngilizce / Türkçe, sesler ve müzik, orijinal SVG görseller.

**Bölümler ve hikaye**
- **100 bölüm**, 5 dünya (Eski Maden, Yankı Mağaraları, Magma Derinlikleri, Donmuş Kasa, Uçurum). İlk 20 bölüm elle tasarlandı, 21-100 `tools/build-levels.ts` ile üretilip veri olarak kaydedildi (`src/data/generatedLevels.ts`). Her dünyanın kendi renk teması var.
- Her 20. bölüm bir **patron bölümü** (ek ödül).
- **Hikaye modu**: Dusty (madenci), Çakıl (köstebek) ve Baron Gizmo ile 5 bölümlük hikaye. Her dünyanın başında bölüm kartı, ortasında ve patronda diyalog, 100. bölümden sonra final. Diyaloglar bir kez gösterilir, "Geç" ile atlanır (`src/data/story.ts`).
- Her bölümde **yan görev** (elmas topla, seri yap, fıçı patlat...). Görev ödülü ilk geçişte verilir.

**Oynanış**
- **Seri (combo)**: art arda değerli çekişler x1,5'e kadar çarpan verir, boş çekiş ve kaya seriyi bozar.
- Yakın kaybetme ekranı ("Ramak kaldı, sadece X eksik"), tek dokunuşla tekrar dene.
- Zaman Dondurucu (süre ve böcekler 6 sn durur), Atlama Bileti (geçemediğin bölümü atla).
- Elmas/sandık/büyük altında sarsıntı ve parlama, balçık çekersen para kaybedersin.
- **Patron bölümlerinin tuzakları**: ATAK (sallanma hızı aralıklı artar) ve KARARMA (ışıklar söner). Her dünya ve patron için ayrı müzik.
- Yeni oyuncu için **tek seferlik ipuçları** (fıçı, torba, böcek, balçık, sandık, seri, görev).
- **Şans Çarkı**: bir bölümü ilk kez 3 yıldızla geçince bir çevirme hakkı kazanılır (para, kapsül, dondurucu, güçlendirme, bilet, jackpot).

**Para harcama yerleri (dükkân tek yer değil)**
- **Dükkân** (bölüm sonrası ve menüden): Malzeme sekmesi (Patlatıcı, Patlatıcı Paketi, Zaman Dondurucu, Gizemli Sandık, Atlama Bileti) ve Fırsatlar sekmesi (9 güçlendirmeden 4'ü (Turbo, Fener, Mercek, Ezici, Kum Saati, Altın Ateşi, Yardımcı Madenci, Mıknatıs, Fıçı Etkisizleştirici), biri indirimli, ücretle yenilenir).
- **Atölye** (menüden): kalıcı **Yükseltmeler** (Hızlı Vinç, Güçlü Kollar, Cep Saati, Talih, her biri 5 seviye), **Kancalar** (Geniş, Hızlı, Titan), **Stil** (4 madenci kıyafeti, 4 kanca kaplaması, 3 ip rengi).
- Ekonomi sıkı: ilk geçişte kazancın %60'ı cüzdana girer, fiyatlar 300-6000 arası.

**Ek modlar ve geri dönüş sebepleri**
- **Sonsuz mod**: süre sınırı yok, alan temizlenince yeni dalga ve +10 sn, kişisel rekor.
- **Haftalık meydan okuma**: haftaya göre sabit yerleşim, haftada bir kez ödül.
- **Günlük hediye** (7 günlük seri), **16 başarım** (ödüllü, ilerleme çubuklu).

## Son eklenenler

- **Tam isabet bonusu**: nesnenin tam ortasına vurursan %10 ekstra (yeşil +bonus olarak görünür).
- **Rütbe**: toplam yıldıza göre 7 unvan (Çırak ... Efsane), ana menüde sol üstte.
- **GitHub Pages**: `.github/workflows/pages.yml` oyunu web sayfası olarak yayınlar. Bir kez GitHub'da Settings > Pages > Source: "GitHub Actions" seçilmeli. PR `main`'e birleşince oyun `https://gokturkokur.github.io/deep-claw/` adresinde açılır.

## Ana ekran ve ses güncellemesi

- Ana ekran sadeleştirildi: üstte rütbe ve cüzdan, ortada Oyna/Devam/Bölümler, altta altı simgelik bir sıra. Yeni oyuncuda simgeler kilitli (kilit + açılacağı bölüm numarası): Dükkân ve Ödüller 2. bölümde, Atölye 3, Çark 4, Sonsuz 5, Haftalık 6. Kilitli düğmeye basınca Dusty kısaca uyarır.
- Ana ekran canlı: Dusty (seçili kıyafetiyle) ve Çakıl yerde durur, nefes alır, göz kırpar, konuşma balonlarıyla konuşur (hediye ve çark hatırlatması dahil); dokununca tepki verirler.
- Ses: hâlâ sentezlenmiş, çünkü lisanssız gerçek kayıt kullanamıyorum. Ancak ses motoru geliştirildi (katmanlı tonlar, oda yankısı, yumuşak doygunluk, müzikte pad, hi-hat ve snare). Gerçek kayıtların için `docs/ASSETS.md`: aynı adla `.wav` koymak yeterli.

## Eğitim kartları

Bir menü düğmesi ilk kez açıldığında ana ekranda küçük bir kart çıkar ve ne işe yaradığını anlatır (Dükkân, Ödüller, Günlük hediye, Atölye, Çark, Sonsuz, Haftalık). Aynı ziyarette sadece bir kart gösterilir, kapatınca ilgili düğme birkaç kez büyüyüp küçülür. Dükkâna ve bölüm seçimine ilk girişte de birer kart vardır. Ayarlar'daki "İpuçlarını tekrar göster" hepsini sıfırlar. Kartlar `src/data/tutorials.ts` içinde (İngilizce ve Türkçe), testler için `&notut=1` ile kapatılır.

## Bölüm başı kartları artık oyunu durdurur

Bölüm başındaki ipucu (Çakıl) ve ilk Sonsuz/Haftalık açıklaması kapatma düğmesi olan bir karttır; kart açıkken süre ve böcekler çalışmaz, "Anladım" deyince oyun başlar. Patron ve dalga başlıkları için oyun 1-1,3 sn bekler. Atölye, Çark ve Ödüller ekranları ilk girişte kendilerini anlatır (Dükkân'daki Atölye düğmesinden girince de).

## Kalıcı Yardımcı Madenci

Atölye > Yükseltmeler sekmesinin son satırı: **Yardımcı Madenci, 100.000**. Bir kez alınır, her bölümde 7 saniyede bir en yakın altını veya elması kendisi toplar (sahnede ikinci bir madenci görünür). Dükkândaki tek bölümlük "Yardımcı Madenci" güçlendirmesiyle birikir: ikisi birden varsa her turda iki nesne toplanır.

## Gizli sürpriz: dev patlama

Fıçı Etkisizleştirici açıkken barut fıçısı kancayla çekilebilir. Fıçı kancadayken Patlatıcı Kapsül kullanılırsa (düğme veya D tuşu) normal "Güm!" yerine **dev patlama** olur: ekran sarsılır, madenin her yerinde art arda patlamalar çıkar, ortada "KABOOOM!" yazar ve sahadaki her şey yok olur. Bölüm o anda kaybedilir. Yenilgi ekranının başlığı "KABUUUM!" (İngilizcede "KABOOOM!") olur ve altında "Fıçıya patlatıcı atılmaz. Bütün maden havaya uçtu!" yazar. Mıknatıs Tılsımı şart değil; tetikleyen şey kancadaki fıçı ve patlatıcıdır. Kaybedilen her bölümde olduğu gibi harcanan kapsül envantere geri döner. Ayar: `src/config/game.ts` içindeki `MEGA_BLAST` (`enabled: false` ile kapatılır).

Aynı değişiklikte yenilgi ekranındaki eski bir düzen hatası da düzeltildi: "Az kaldı" ve görev yazısı "Tekrar" düğmesinin altında kalıyordu, düğmeler artık aşağıda.

## Gizli sürprizler (easter egg)

Dev patlamaya ek olarak altı gizli sürpriz var. Hepsinin ayarı tek yerde: `src/config/game.ts` içindeki `EGGS`. Her biri ilk bulunduğunda **gizli bir başarım** açar (Ödüller ekranında bulunana kadar "??? (Gizli)" ve bir bilmece görünür, bulununca adı ve ödülü açılır). Bulunanlar ve torba serisi kayıtta tutulur (`eggs`).

| Sürpriz | Nasıl bulunur | Ne olur | Başarım ödülü |
|---|---|---|---|
| Böcek barışı | Elmas taşıyan böceğin 95 px yakınından 3 kez boş kanca geçir | Böcek durur, kıpırdanır, "Tamam tamam!" der. Sonraki atışta elmasını bırakıp yoluna devam eder | 800 |
| Sabırlı madenci | Bölüm başında 30 saniye hiç kanca atma | Dusty "Of, sıkıldım!" deyip kancayı kendisi atar, o çekiş %10 fazla öder | 500 |
| Havai fişek | Tek patlamada en az 4 fıçı zincirle | "HAVAİ FİŞEK!" yazısı ve renkli patlamalar | 1.500 |
| Baron'un Kasası | Patron bölümünde (her dünyanın 20. bölümü) hiç altın çekmeden bütün taşları çek (en az 2 taş) | Altın renkli bir sandık çıkar, değeri 3.000 | 1.500 |
| Kayan yıldız | Ana menüde gökyüzüne art arda 10 kez dokun (her dokunuşta küçük bir pırıltı çıkar) | Yıldız geçer, Pebble "Kayan yıldız! +1 çark hakkı" der. Ödül günde bir kez | 500 |
| Şanslı torba | Gizemli torbadan art arda 3 kez aynı tür ödül çıksın (bölümler arası sayılır) | 4. torba garanti "BÜYÜK İKRAMİYE!": 2.000 (Talih yükseltmesiyle artar) | 1.000 |
| Kabuuum | Kancadaki fıçıya patlatıcı at (yukarıda) | Dev patlama, bölüm kaybedilir | 500 |

Ek olarak: elmas taşıyan böceklerin sırtında artık küçük bir elmas görünüyor. Önceden normal böcekle aynı görünüyordu, oyuncu hangisinin değerli olduğunu anlayamıyordu.

Notlar: Böcek, sabır, kasa ve torba sürprizleri oyunu etkilediği için `Session` seçeneği `eggs: false` ile kapatılabilir (testlerde kullanılır). Sabırlı madenci yeni oyuncuya da yardım eder: hiç dokunmayan oyuncu kancanın kendiliğinden gittiğini görür. Havai fişek ve kasa olayları birim testlerinde gerçek akışla doğrulandı; tarayıcıda görüntüleri ekran görüntüsüyle kontrol edildi, gerçek bir patron bölümünde baştan sona oynanarak denenmedi.

## Ekonomi incelemesi

`npx vite-node tools/economy-report.ts` bir bölümü "%30 payla" geçen oyuncunun toplam gelirini hesaplar: 100 bölümde yaklaşık 525.000. Önceki hâlde kalıcı harcamalar sadece 140.000 idi, yani 40. bölümden sonra para birikiyordu. Düzeltmeler:
- Yükseltmeler 5 yerine **8 seviye** (daha yumuşak etkiyle: hız %7, güç %6, süre +2 sn, talih %10 seviye başına), toplam yükseltme maliyeti yaklaşık 440.000. Kalıcı harcamaların toplamı (yükseltme, kanca, kıyafet) yaklaşık 475.000, yani gelirin tamamına yakını.
- Patlatıcı Kapsül fiyatı 700'den başlayıp bölüm 100'de 2500'e kadar çıkıyor, Paket %15 indirimle onun 3 katı.
- Fırsatlar sekmesindeki güçlendirme fiyatları bölüm ilerledikçe en fazla 2 kat artıyor.
- Sandık fiyatı sabit; ödül ortalaması fiyatın %80'inin altında.

### Atölye fiyatları x10 (2026-11-05)

Kullanıcı isteğiyle Atölye'deki her şeyin fiyatı 10 katına çıktı: yükseltmeler, kancalar ve kıyafetler. Kalıcı Yardımcı Madenci (100.000) bu değişiklikten sonra ayrı fiyatlandırıldı ve çarpılmıyor. Dükkân, sandık, yenileme ve diğer fiyatlar aynı. Ayar tek bir sayıda: `src/config/economy.ts` içindeki `WORKSHOP_PRICE_MULT = 10` (1 yapınca eski fiyatlar döner).

Sonuç: Atölye'nin toplamı yaklaşık 4.755.000, 100 bölümlük kampanyanın toplam geliri ise yaklaşık 525.000. Oyuncu kampanya boyunca Atölye'nin ancak yaklaşık %11'ini alabilir. Başka hiçbir şey almayan oyuncu ilk yükseltmeyi (9.000) yaklaşık 6. bölümde, Geniş Kanca'yı (25.000) 12. bölümde, Titan Kanca'yı (60.000) 22. bölümde alabilir. Bir yükseltmeyi sonuna kadar çıkarmak en az 884.000 tuttuğu için "yükseltmeyi tamamla" başarımı kampanya geliriyle ulaşılamaz hâle geldi (Sonsuz/Haftalık geliri gerekir).

## Ekonomi ayarı (sandık)

Gizemli Sandık 1500. Para çıkarsa çoğunlukla 600, üçte biri 2000-2400 (kâr). Diğer ödüller: 1 Patlatıcı Kapsül (en sık), Zaman Dondurucu, güçlendirme, çok nadir Atlama Bileti (6000). Ortalama değer fiyatın %80'inin altında (testle doğrulanıyor), yani sandık alıp para büyütmek mümkün değil. Açılış animasyonu: siyah ekranda kapı sallanır, açılır, ışıklar çıkar.

Diğer fiyatlar: Patlatıcı 700 (bölümle 1200'e kadar artar), Paket 1800, Zaman Dondurucu 1000, Atlama Bileti 6000.

## Test sonuçları

- Birim testleri (Vitest): **328 test geçti** (gizli sürprizler, kanca, çarpışma, oturum, seri, dondurma, yükseltmeler, dükkân, sandık, kozmetik, günlük hediye, başarımlar, kayıt, hikaye, görevler, 100 bölümün geçerliliği ve dengesi).
- Tarayıcı testleri (Playwright): **33 test geçti** (temel akış, dev patlama, kayan yıldız ve sabırlı madenci sürprizleri, hikaye diyaloğu, sonsuz mod, haftalık, atölye alışverişi, günlük hediye, başarımlar, dünya sayfaları, dondurma, sandık, 5 ekran boyutunda düzen kontrolü, ekran galerisi).
- Ekran görüntüleri: `docs/screenshots/`.

## Bilinen eksikler ve dürüst notlar

- **Gerçek telefonda denenmedi.** Testler yazılımla çizen Chromium'da (yaklaşık 6 FPS) koştu, 60 FPS ölçülemedi.
- **Bölüm hedefleri bir tahmin modeline göre ayarlı** (`src/systems/Balance.ts`), gerçek oyuncu verisi yok. Seri çarpanı ve yükseltmeler tahmin modeline dahil değil, yani gerçekte oyun biraz kolay olabilir. 21-100. bölümler üretilmiş yerleşimlerdir, tek tek elle cilalanmadı.
- Bölüm adları ve görev metinleri dışında 21-100 bölümlerde özel el yapımı bulmaca yok.
- Hikaye metinleri kısa ve basit; senin düzeltmene açık (`src/data/story.ts`).
- Haftalık meydan okuma tek cihazda yerel; skor tablosu ve çevrimiçi yarış yok (sunucu gerekir).
- Görseller 1x çözünürlükte, ses ve görseller geçici kalitede (kendi dosyalarınla değiştirilecek, `docs/ASSETS.md`).
- Daha önce geçilmiş bölümü tekrar oynayınca cüzdana para eklenmez. Kaybedilen denemede kullanılan eşyalar geri verilir.
- Capacitor eklenmedi, adımlar `docs/ANDROID.md` içinde. Android geri tuşu, ikon ve mağaza görselleri yok.

## Sonraki fikirler

Yeni dünyalar ve bölüm paketleri, patron bölümlerine özel mekanikler, sezon/etkinlik bölümleri, çevrimiçi skor tablosu, evcil hayvan yardımcılar, daha fazla kıyafet, gerçek ses ve çizimler.

## Denge aracı (bot)

`npx vite-node tools/bot-report.ts` her bölümü "mükemmel nişan alan" bir botla oynatır ve hedefle karşılaştırır. Bot genelde tahmin modelinin 1,0-1,4 katı kazanır; gerçek oyuncu botun yaklaşık %60-80'ini yapar. Bot bazı fıçılı bölümlerde (13, 92) düşük kalıyor çünkü fıçıyı bilerek patlatmayı planlamıyor; o bölümler insan için daha kolay olabilir.
