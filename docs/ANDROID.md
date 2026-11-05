# Android paketi ve Google Play (adım adım)

Bu belge kod bilmeden ilerlemen için yazıldı. Oyun şu an bir web oyunu. Capacitor onu bir Android uygulamasının içine koyar. **Capacitor paketlerini bilerek henüz eklemedik**; aşağıdaki adımlarda ilk kez ekleniyor.

## 0. Önce gerekenler (bir kere)

1. **Node.js LTS** kur: https://nodejs.org
2. **Android Studio** kur: https://developer.android.com/studio (kurulumda "Android SDK" seçili kalsın).
3. **Java** için ekstra bir şey kurma, Android Studio kendi Java'sını getirir.

## 1. Oyunu derle

Proje klasöründe terminalde:

```bash
npm install
npm run build
```

Bu, `dist/` klasörünü üretir. Android uygulamasının içine giren şey budur.

## 2. Capacitor'u ekle (ilk kez)

```bash
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npx cap init "Deep Claw" com.seninadin.deepclaw --web-dir=dist
npx cap add android
```

`com.seninadin.deepclaw` paket adıdır. Küçük harf, nokta ile ayrılmış, **bir kez seçilir ve Google Play'de sonradan değişmez**. Kendi adını veya stüdyo adını kullan (ör. `com.gokturkokur.deepclaw`).

`capacitor.config.ts` dosyasında şu satırın olduğundan emin ol (kayıtlı ilerlemenin uygulama güncellemelerinde silinmemesi için):

```ts
server: { androidScheme: 'https' }
```

## 3. Her değişiklikten sonra

```bash
npm run build
npx cap sync android
npx cap open android
```

Son komut Android Studio'yu açar. Üstteki yeşil **Run** (oynat) düğmesiyle telefonda veya emülatörde denersin. Telefonu USB ile bağlamak için telefonda "Geliştirici seçenekleri > USB hata ayıklama" açık olmalı.

## 4. Android Studio'da yapılacak ayarlar (bir kere)

- **Dikey kilit:** `android/app/src/main/AndroidManifest.xml` içinde `<activity ...>` etiketine `android:screenOrientation="portrait"` ekle.
- **Tam ekran:** oyun zaten tüm ekranı kullanır. Çentik (notch) altına çizim için `android/app/src/main/res/values/styles.xml` içinde tema bölümüne `<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>` ekle.
- **Uygulama ikonu:** Android Studio'da `app` klasörüne sağ tık > New > Image Asset. 1024 x 1024 bir ikon seç.
- **Uygulama adı:** `android/app/src/main/res/values/strings.xml` içindeki `app_name` değeri "Deep Claw" olsun.
- **Geri tuşu:** ileride Capacitor `App` eklentisiyle geri tuşunu "duraklat"a bağlayacağız (şimdilik tuş uygulamayı kapatır).

## 5. Yayın dosyasını üret (AAB)

1. Android Studio: **Build > Generate Signed App Bundle / APK > Android App Bundle**.
2. **Create new...** ile bir **anahtar deposu (keystore)** oluştur. Şifreleri ve `.jks` dosyasını **güvenli bir yere yedekle ve kimseyle paylaşma**. Kaybedersen uygulamayı bir daha güncelleyemezsin. (Google Play App Signing'i açık bırak, ek koruma sağlar.)
3. **release** seç, bitir. Çıkan `.aab` dosyası `android/app/release/` içindedir.

## 6. Google Play Console

1. https://play.google.com/console adresinde **geliştirici hesabı** aç (tek seferlik 25 USD, kimlik doğrulaması gerekir).
2. **Uygulama oluştur:** ad "Deep Claw", dil, "Oyun", "Ücretsiz".
3. **Mağaza girişi** için hazırla:
   - Uygulama ikonu 512 x 512 PNG
   - Öne çıkan görsel 1024 x 500
   - Telefon ekran görüntüleri (en az 2, dikey, `docs/screenshots/` içindekiler başlangıç için kullanılabilir)
   - Kısa açıklama (80 karakter) ve uzun açıklama
4. **Gizlilik politikası:** oyun kişisel veri toplamıyor ve reklam / satın alma içermiyor. Yine de Play bir gizlilik politikası bağlantısı ister. Basit bir sayfa yeterli ("Bu oyun hiçbir kişisel veri toplamaz, ilerleme sadece cihazında saklanır").
5. **Veri güvenliği formu:** "Veri toplanmıyor" seçeneklerini işaretle.
6. **İçerik derecelendirmesi** anketini doldur (şiddet yok, kumar yok).
7. **Hedef kitle:** 13+ seçmek en kolay yoldur (çocuklara özel kurallar çıkmaz).

## 7. Yeni kişisel hesaplar için kapalı test kuralı (önemli)

Kişisel geliştirici hesapları (2023'ten sonra açılanlar) uygulamayı herkese açmadan önce **kapalı test** yapmak zorunda:

- Kapalı test (Closed testing) kanalı oluştur.
- **En az 12 test kullanıcısı** davet et (Gmail adresleriyle veya bir Google Grubu ile). Hepsi teste **katılmış (opt-in)** olmalı.
- Test, bu kullanıcılarla **kesintisiz 14 gün** sürmeli.
- 14 gün dolunca Play Console'da "Üretime başvur" (Apply for production) düğmesi açılır, Google inceler (birkaç gün sürebilir).

İpucu: Aile ve arkadaşlardan 15-20 kişi topla, çünkü bazıları ayrılabilir. Her yeni sürümü önce kapalı teste yükle. Kurallar zaman zaman değişir, güncel hâli için Play Console'daki "Üretime çıkış gereksinimleri" bölümüne bak.

## 8. Sık karşılaşılan sorunlar

| Sorun | Çözüm |
|---|---|
| Ses ilk dokunuştan önce çalmıyor | Normal: telefonlar kullanıcı dokunmadan sesi engeller. Oyun ilk dokunuşta sesi açar. |
| Oyun beyaz ekranda kalıyor | `npm run build` yapmadan `npx cap sync` çalıştırılmış olabilir. Önce build, sonra sync. |
| Kayıtlı ilerleme güncellemeden sonra gitti | `capacitor.config.ts` içinde `androidScheme: 'https'` olmalı ve paket adı (appId) değişmemeli. |
| Android Studio "SDK bulunamadı" diyor | Android Studio > Settings > Languages & Frameworks > Android SDK içinden SDK'yı kur. |
