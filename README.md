# DEEP CLAW

Telefon için dikey (9:16) 2D kanca / madencilik arcade oyunu. / A portrait mobile arcade game about a swinging mining claw.
Yapım / Built with: **Phaser 3 + TypeScript + Vite**. Android için Capacitor ile paketlenecek / to be packaged with Capacitor.

Oyunun adı, görselleri, sesleri, eşya isimleri ve bölümleri tamamen orijinaldir. / Name, art, sounds, item names and levels are all original.

---

## Türkçe

### Oyunu bilgisayarında dene (ilk kez)

1. [Node.js](https://nodejs.org) (LTS sürümü) kur.
2. Bu klasörde bir terminal aç ve sırayla çalıştır:

```bash
npm install
npm run dev
```

3. Terminalde çıkan adresi (genelde `http://localhost:5173`) tarayıcıda aç.

Telefonda denemek için: bilgisayar ve telefon aynı Wi-Fi'de olsun, `npm run dev -- --host` ile başlat ve terminaldeki "Network" adresini telefonda aç.

### Nasıl oynanır

- Kanca sağa sola sallanır. **Ekrana dokun** (bilgisayarda **Boşluk**, **Aşağı ok** veya fare tıklaması) ve kanca düz o yöne iner.
- Altını ve elması yukarı çek. Kayalar ağırdır ve yavaşlatır. Barut fıçısına çarparsan patlar ve çevresindeki her şeyi yok eder.
- Her bölümde **60 saniye** var ve bir **hedef** para var. Hedefe ulaşırsan kazanırsın, kazandığın para dükkânda harcanır.
- **D** tuşu (veya ekrandaki patlatıcı düğmesi): çektiğin şeyi patlatır, kanca boş ve hızlı döner.
- **P** veya **Esc**: duraklat.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu (kod değişince sayfa yenilenir) |
| `npm run build` | Yayına hazır oyunu `dist/` klasörüne üretir |
| `npm run preview` | `dist/` içindekini yerel olarak gösterir |
| `npm test` | Birim testleri (kanca matematiği, ekonomi, kayıt, bölüm dengesi) |
| `npm run test:e2e` | Tarayıcı testleri (Playwright, gerçek oyunu açar) |

`dist/` klasörü herhangi bir klasörden veya alt adresten çalışır (`base: './'`).

### Kendi görsellerini ve seslerini koymak

`docs/ASSETS.md` dosyasında her görselin ve sesin adı, boyutu ve ne olduğu yazıyor. Aynı adla, aynı boyutta kendi dosyanı `public/assets/images/` veya `public/assets/audio/` içine koyman yeterli.

### Önemli dosyalar

| Yol | İçerik |
|---|---|
| `MASTER_PROMPT.md` | Oyunun tam tarifi |
| `CLAUDE.md` | Bu repoda çalışan Claude oturumları için kurallar ve durum |
| `src/config/` | Para, ağırlık, hız, fiyat gibi **tüm sayılar** burada |
| `src/data/levels.ts` | 20 bölümün yerleşimi ve hedefleri |
| `docs/ASSETS.md` | Görsel ve ses listesi |
| `docs/ANDROID.md` | Android paketi ve Google Play adımları |
| `docs/REPORT.md` | Neler yapıldı, test sonuçları, eksikler |
| `archive/gdevelop/` | Vazgeçilen eski GDevelop planı (sadece referans) |

---

## English

### Run it

```bash
npm install
npm run dev
```

Open the printed address (usually `http://localhost:5173`). To try it on a phone on the same Wi-Fi: `npm run dev -- --host`.

### How to play

The claw swings. **Tap** (or **Space** / **Down arrow** / click) to drop it. Pull up gold and diamonds, avoid heavy rocks, beware of powder kegs. 60 seconds per level, reach the money target to win, spend your winnings in the shop. **D** = Blast Cap, **P** / **Esc** = pause.

### Commands

`npm run dev`, `npm run build` (output in `dist/`, works from any folder), `npm run preview`, `npm test` (unit tests), `npm run test:e2e` (Playwright browser tests).

### Replace the art and sounds

See `docs/ASSETS.md`: same file name and size, drop it into `public/assets/`.
