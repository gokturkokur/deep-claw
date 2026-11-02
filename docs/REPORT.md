# Rapor

## Yapılanlar

- Phaser 3.90.0 + TypeScript (strict) + Vite. `npm run build` hatasız, `base: './'`.
- 10 sahne: Boot, Preload, Ana Menü, Bölüm Seçimi, Oyun, Duraklat, Ayarlar, Bölüm Tamam, Oyun Bitti, Dükkân. Geçişler 240 ms solma.
- Kanca durum makinesi (Swinging, Launching, Hooked, Missed, Retracting, Collecting), süpürmeli (swept) çarpışma, dt en fazla 50 ms.
- 9 nesne türü: altın (3 boy), elmas, kaya (2 boy), gizemli torba, barut fıçısı (zincirleme patlama), böcek (hareketli).
- 20 bölüm (`src/data/levels.ts`), 60 sn, hedef, 1-2-3 yıldız, denge kontrolü.
- Dükkân: Patlatıcı Kapsül (kalıcı), Turbo Vinç Yağı, Şanslı Fener, Mücevher Merceği, Cevher Ezici (sadece sonraki bölüm). Rastgele stok.
- Kayıt: localStorage, sürümlü JSON, bozuk/eski kayıt güvenli. İngilizce / Türkçe.
- Orijinal SVG görseller (`public/assets/images`) ve sentezlenmiş sesler (`public/assets/audio`), tek manifest.
- Sayfa arka plana gidince otomatik duraklama ve ses kısma.

## Test sonuçları

- Birim testleri (Vitest): **106 test geçti** (kanca, çarpışma, oturum, ekonomi, dükkân, kayıt, bölüm geçerliliği, bölüm dengesi).
- Tarayıcı testleri (Playwright, Chromium): **17 test geçti** (açılış, konsol hatası yok, dokunuşla fırlatma, HUD düğmesi fırlatmıyor, toplama, kazan-dükkân-satın al-sonraki bölüm, yeniden yükle-Devam, kaybet-yeniden dene, Patlatıcı, dil, 5 ekran boyutu için düzen kontrolü, ekran galerisi).
- Ekran görüntüleri: `docs/screenshots/` (360x640, 390x844, 412x915, 768x1024, 1280x720). Siyah bant yok, HUD ekran içinde ve üst üste binmiyor.

## Bilinen eksikler ve dürüst notlar

- **Gerçek telefonda denenmedi.** Testler yazılımla çizen Chromium'da (yaklaşık 6 FPS) koştu, bu yüzden 60 FPS hedefi ölçülemedi. Mantık testleri oyunu kodla ilerletir.
- Bölüm hedefleri bir tahmin modeline göre ayarlandı (`src/systems/Balance.ts`), gerçek oyuncu verisi yok. Gerçek denemeden sonra hedefler değişebilir.
- Görseller 1x çözünürlükte çizilir; yüksek DPI telefonlarda biraz yumuşak görünebilir.
- Ses ve görseller geçici (yer tutucu) kalitededir; kendi dosyalarınla değiştirilecek (`docs/ASSETS.md`).
- Daha önce temizlenmiş bir bölümü tekrar oynayınca cüzdana para eklenmez (para üretme hilesini önlemek için). Yıldız ve rekor güncellenir.
- Kaybedilen denemede harcanan Patlatıcı ve boost'lar geri verilir (kayıt sadece kazanınca değişir).
- Capacitor eklenmedi (istendiği gibi), adımlar `docs/ANDROID.md` içinde.
- Android geri tuşu, uygulama ikonu ve mağaza görselleri henüz yok.

## Sonraki fikirler

Daha fazla bölüm, gerçek ses ve çizimler, reklam/IAP yok ama istenirse eklenebilir, yüksek DPI doku, başarımlar, günlük ödül.
