# Deep Claw (çalışma adı)

GDevelop 5 ile yapılan, Android için dikey (9:16) 2D kanca/madencilik arcade oyunu. Klasik "Gold Miner" oyun döngüsünden esinlenir; görseller, isim, sesler ve bölümler tamamen orijinaldir.

## Klasör yapısı

| Yol | İçerik |
|---|---|
| `00-architecture.md` | Faz 0: teknik mimari, sahneler, objeler, değişkenler, kanca matematiği, yol haritası, riskler |
| `01-phase1-setup.md` | Faz 1: proje kurulumu, sahneler, menü geçişleri (adım adım) |
| `DeepClaw/` | GDevelop projesi (`game.json` buraya kaydedilecek) |
| `DeepClaw/assets/` | Geçici (placeholder) görseller. Faz 6'da aynı dosya adlarıyla gerçek çizimler gelecek |
| `tools/make_placeholders.py` | Placeholder görselleri yeniden üretir: `python3 tools/make_placeholders.py DeepClaw/assets` (Pillow gerekir) |
| `CLAUDE.md` | Bu projede çalışan Claude oturumları için kurallar ve durum |

## Durum

- [x] Faz 0 - Mimari
- [ ] Faz 1 - Proje kurulumu ve sahneler (rehber hazır, GDevelop'ta uygulanacak)
- [ ] Faz 2 - Kanca sallanma ve fırlatma
- [ ] Faz 3 - Obje toplama ve geri çekme
- [ ] Faz 4 - Puan, para ve hedefler
- [ ] Faz 5 - Bölümler ve denge
- [ ] Faz 6 - Menüler, arayüz, animasyon
- [ ] Faz 7 - Ses, cila, optimizasyon
- [ ] Faz 8 - Android testi ve Google Play
