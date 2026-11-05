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

## Test sonuçları

- Birim testleri (Vitest): **303 test geçti** (kanca, çarpışma, oturum, seri, dondurma, yükseltmeler, dükkân, sandık, kozmetik, günlük hediye, başarımlar, kayıt, hikaye, görevler, 100 bölümün geçerliliği ve dengesi).
- Tarayıcı testleri (Playwright): **28 test geçti** (temel akış, hikaye diyaloğu, sonsuz mod, haftalık, atölye alışverişi, günlük hediye, başarımlar, dünya sayfaları, dondurma, sandık, 5 ekran boyutunda düzen kontrolü, ekran galerisi).
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
