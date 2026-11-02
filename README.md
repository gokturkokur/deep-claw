# Deep Claw (çalışma adı)

Telefon için dikey (9:16) 2D kanca/madencilik arcade oyunu. Klasik "sallanan kanca" oyun türünden esinlenir; isim, görseller, sesler, eşya isimleri ve bölümler tamamen orijinaldir.

**Teknoloji:** Phaser 3 + TypeScript + Vite. Android'e Capacitor ile paketlenecek.

## Dosyalar

| Yol | İçerik |
|---|---|
| `MASTER_PROMPT.md` | Oyunun tam tarifi ve Claude'a verilen ana görev |
| `CLAUDE.md` | Bu repoda çalışan Claude oturumları için kurallar ve güncel durum |
| `archive/gdevelop/` | Vazgeçilen eski GDevelop planı (sadece referans) |

## Geliştirme nasıl ilerliyor

1. Cloud'daki Claude oturumu `MASTER_PROMPT.md`'yi uygular, oyunu yazar, test eder ve `main`'e bir pull request açar.
2. Pull request birleştirilir, oyun telefonda denenir.
3. Geri bildirimler yeni oturumlara verilir.

Oyun kodu geldiğinde nasıl çalıştırılacağı burada yazacak.

## Durum

- [x] Mimari ve oyun tasarımı (`MASTER_PROMPT.md`)
- [ ] Oyunun yazılması (cloud oturumu)
- [ ] Telefonda test ve geri bildirim
- [ ] Kendi görsellerim ve seslerim
- [ ] Android paketi ve Google Play
