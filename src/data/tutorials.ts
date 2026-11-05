/**
 * Small one-time tutorial cards. "unlock_*" cards pop up on the main menu the first time a button opens,
 * "scene_*" cards the first time a screen is entered. The Settings screen can show them all again.
 */
export interface Tutorial {
  id: string;
  /** Texture key of the icon shown on the card. */
  icon: string;
  en: { title: string; text: string };
  tr: { title: string; text: string };
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'unlock_shop',
    icon: 'icon_shop',
    en: { title: 'Shop unlocked!', text: 'Spend your coins on supplies: Blast Caps, Time Freeze and a Mystery Crate. The Deals tab has boosts for your next level, they change when you refresh them.' },
    tr: { title: 'Dükkân açıldı!', text: 'Paranı malzemelere harca: Patlatıcı, Zaman Dondurucu ve Gizemli Sandık. Fırsatlar sekmesinde bir sonraki bölüm için güçlendirmeler var, yenileyince değişirler.' },
  },
  {
    id: 'unlock_awards',
    icon: 'icon_trophy',
    en: { title: 'Awards unlocked!', text: 'Reach goals like collecting diamonds or building combos to earn coins. Every award shows your progress.' },
    tr: { title: 'Ödüller açıldı!', text: 'Elmas toplamak veya seri yapmak gibi hedefleri tamamla, para kazan. Her ödülde ilerlemeni görürsün.' },
  },
  {
    id: 'unlock_gift',
    icon: 'icon_gift',
    en: { title: 'Daily gift', text: 'Tap the gift on the main menu once a day. Coming back every day builds a streak with better rewards, day 7 pays the most.' },
    tr: { title: 'Günlük hediye', text: 'Ana menüdeki hediyeye günde bir kez dokun. Her gün gelirsen seri oluşur ve ödüller büyür, 7. gün en çok verir.' },
  },
  {
    id: 'unlock_workshop',
    icon: 'icon_wrench',
    en: { title: 'Workshop unlocked!', text: 'Upgrades are permanent: faster rope, stronger pull, more time. Claws change how you grab. Style is only for looks. Save up, the best things are expensive.' },
    tr: { title: 'Atölye açıldı!', text: 'Yükseltmeler kalıcıdır: daha hızlı ip, daha güçlü çekiş, daha fazla süre. Kancalar tutuşunu değiştirir. Stil sadece görünüş içindir. Biriktir, en iyileri pahalı.' },
  },
  {
    id: 'unlock_wheel',
    icon: 'icon_wheel',
    en: { title: 'Lucky Wheel unlocked!', text: 'Clear a level with 3 stars for the first time to earn a spin. Prizes are coins, supplies and boosts, and the jackpot is huge.' },
    tr: { title: 'Şans Çarkı açıldı!', text: 'Bir bölümü ilk kez 3 yıldızla geçince çevirme hakkı kazanırsın. Ödüller para, malzeme ve güçlendirme, büyük ikramiye çok değerli.' },
  },
  {
    id: 'unlock_endless',
    icon: 'icon_infinity',
    en: { title: 'Endless mode unlocked!', text: 'No target here. The field refills every time you clear it and you get bonus seconds. How many waves can you survive?' },
    tr: { title: 'Sonsuz mod açıldı!', text: 'Burada hedef yok. Alanı temizledikçe yenisi gelir ve ekstra süre kazanırsın. Kaç dalga dayanabilirsin?' },
  },
  {
    id: 'unlock_weekly',
    icon: 'icon_calendar',
    en: { title: 'Weekly challenge unlocked!', text: 'Everyone plays the same field this week. Beat the target once to win a bonus reward, then improve your best score.' },
    tr: { title: 'Haftalık meydan okuma açıldı!', text: 'Bu hafta herkes aynı alanı oynar. Hedefi bir kez geç, bonus ödülü al, sonra en iyi skorunu geliştir.' },
  },
  {
    id: 'scene_shop',
    icon: 'icon_shop',
    en: { title: 'Welcome to the shop', text: 'Supplies are always for sale. Deals are boosts for your next level only, one of them is on sale. Gifts and crates are surprises, so buy what you need.' },
    tr: { title: 'Dükkâna hoş geldin', text: 'Malzemeler her zaman satılır. Fırsatlar sadece bir sonraki bölüm için güçlendirmedir, biri indirimdedir. Hediye ve sandık sürprizdir, ihtiyacın olanı al.' },
  },
  {
    id: 'scene_levels',
    icon: 'icon_book',
    en: { title: 'Pick a level', text: 'Use the arrows to change worlds. Stars show your best result and a coin means the side mission is done. Locked levels open as you win.' },
    tr: { title: 'Bölüm seç', text: 'Dünyaları oklarla değiştir. Yıldızlar en iyi sonucunu, para simgesi yan görevin bittiğini gösterir. Kilitli bölümler kazandıkça açılır.' },
  },
];

/** Menu buttons in the order they open, with the card that explains them. */
export const UNLOCK_TUTORIALS: ReadonlyArray<{ id: string; feature: 'shop' | 'awards' | 'workshop' | 'wheel' | 'endless' | 'weekly' | 'gift' }> = [
  { id: 'unlock_shop', feature: 'shop' },
  { id: 'unlock_awards', feature: 'awards' },
  { id: 'unlock_gift', feature: 'gift' },
  { id: 'unlock_workshop', feature: 'workshop' },
  { id: 'unlock_wheel', feature: 'wheel' },
  { id: 'unlock_endless', feature: 'endless' },
  { id: 'unlock_weekly', feature: 'weekly' },
];

export function tutorialById(id: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.id === id);
}
