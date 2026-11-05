/**
 * Story mode: the campaign tells one story across 5 worlds.
 * Dusty (the miner) and Pebble (a talking mole) go deeper and deeper to stop Baron Gizmo's Great Drill.
 * Beats are shown once, before the level they are attached to (see storyBeatFor).
 */
export type Who = 'dusty' | 'pebble' | 'baron';

export interface Line {
  who: Who;
  en: string;
  tr: string;
}

export interface Beat {
  id: string;
  lines: Line[];
}

export const WHO_NAME: Record<Who, { en: string; tr: string }> = {
  dusty: { en: 'Dusty', tr: 'Dusty' },
  pebble: { en: 'Pebble', tr: 'Çakıl' },
  baron: { en: 'Baron Gizmo', tr: 'Baron Gizmo' },
};

export const CHAPTER_TITLE: Array<{ en: string; tr: string }> = [
  { en: 'The Old Mine', tr: 'Eski Maden' },
  { en: 'Echo Caverns', tr: 'Yankı Mağaraları' },
  { en: 'Magma Depths', tr: 'Magma Derinlikleri' },
  { en: 'The Frozen Vault', tr: 'Donmuş Kasa' },
  { en: 'The Abyss', tr: 'Uçurum' },
];

const b = (id: string, lines: Line[]): Beat => ({ id, lines });
const L = (who: Who, en: string, tr: string): Line => ({ who, en, tr });

export const STORY: Beat[] = [
  b('w1_intro', [
    L('pebble', 'Dusty! The ground is shaking again. Something is drilling under our mine!', 'Dusty! Zemin yine sallanıyor. Madenimizin altında biri delik deliyor!'),
    L('dusty', 'Then we dig faster than it does. Fire up the winch, Pebble.', 'O zaman ondan hızlı kazarız. Vinci çalıştır Çakıl.'),
    L('pebble', 'Gold first, questions later. Tap to drop the claw!', 'Önce altın, sonra sorular. Kancayı bırakmak için dokun!'),
  ]),
  b('w1_mid', [
    L('pebble', 'Look at these tracks. Giant, round, and very shiny.', 'Şu izlere bak. Kocaman, yuvarlak ve çok parlak.'),
    L('dusty', 'Whoever it is, they are stealing our diamonds. Not on my shift.', 'Kim olursa olsun elmaslarımızı çalıyor. Benim vardiyamda olmaz.'),
  ]),
  b('w1_boss', [
    L('baron', 'Ha ha! Little miner! My Great Drill takes the Deep for itself!', 'Ha ha! Küçük madenci! Büyük Matkabım Derinlik\'i kendine alıyor!'),
    L('dusty', 'Who are you supposed to be?', 'Sen de kimsin?'),
    L('baron', 'Baron Gizmo! Remember the name, you will not see me again. Down I go!', 'Baron Gizmo! Adımı aklında tut, beni bir daha göremeyeceksin. Ben iniyorum!'),
    L('pebble', 'He is escaping through the floor. After him!', 'Zeminden kaçıyor. Peşinden!'),
  ]),
  b('w2_intro', [
    L('pebble', 'Whoa. It is so quiet down here. Hello? ...hello... hello...', 'Vay. Burası çok sessiz. Merhaba? ...haba... haba...'),
    L('dusty', 'Echo Caverns. Careful, the walls hide slimes and sleeping kegs.', 'Yankı Mağaraları. Dikkat, duvarlar balçık ve uyuyan fıçı saklıyor.'),
  ]),
  b('w2_mid', [
    L('pebble', 'The Baron left a note: "Thank you for the free gold, miner!"', 'Baron bir not bırakmış: "Bedava altın için teşekkürler madenci!"'),
    L('dusty', 'Free?! I will make him pay for every nugget.', 'Bedava mı?! Her külçe için ödeteceğim.'),
  ]),
  b('w2_boss', [
    L('baron', 'You followed me into the dark? Brave, and foolish. Try my cave guardians!', 'Beni karanlığa kadar mı takip ettin? Cesur ve aptalca. Mağara bekçilerimi dene!'),
    L('dusty', 'Pebble, hold the rope.', 'Çakıl, ipi tut.'),
    L('pebble', 'I am a mole. I have no hands. But I believe in you!', 'Ben bir köstebeğim. Elim yok. Ama sana inanıyorum!'),
  ]),
  b('w3_intro', [
    L('pebble', 'It is getting hot. My whiskers are curling.', 'Hava ısınıyor. Bıyıklarım kıvrılıyor.'),
    L('dusty', 'Magma Depths. The kegs are extra grumpy here, watch your claw.', 'Magma Derinlikleri. Fıçılar burada ekstra huysuz, kancana dikkat.'),
  ]),
  b('w3_mid', [
    L('dusty', 'The Drill left a trail of melted rock. We are close.', 'Matkap eriyik kaya izi bırakmış. Yakınız.'),
    L('pebble', 'Also lots of treasure chests. Is the Baron... leaving us presents?', 'Bir sürü hazine sandığı da var. Baron... bize hediye mi bırakıyor?'),
  ]),
  b('w3_boss', [
    L('baron', 'My Drill is hungry, and it loves gold! Feed it, and I shall crush you!', 'Matkabım aç ve altını seviyor! Onu besle de seni ezeyim!'),
    L('dusty', 'Nobody crushes my mole.', 'Köstebeğimi kimse ezemez.'),
  ]),
  b('w4_intro', [
    L('pebble', 'B-b-brr! Where did the lava go?', 'B-b-brr! Lav nereye gitti?'),
    L('dusty', 'The Frozen Vault. Old miners locked their best treasure in here.', 'Donmuş Kasa. Eski madenciler en iyi hazinelerini buraya kilitlemiş.'),
  ]),
  b('w4_mid', [
    L('pebble', 'The Baron is trying to melt the vault open with his Drill.', 'Baron kasayı Matkabıyla eritip açmaya çalışıyor.'),
    L('dusty', 'Then we get there first and grab everything.', 'O zaman önce biz varır, her şeyi alırız.'),
  ]),
  b('w4_boss', [
    L('baron', 'Too late! The vault is mine! And so is every nugget in it!', 'Çok geç! Kasa benim! İçindeki her külçe de!'),
    L('dusty', 'Gold belongs to whoever pulls it up first. Those are the rules.', 'Altın, onu ilk çıkaranındır. Kurallar böyle.'),
    L('baron', 'Those are NOT the rules!', 'Kurallar BÖYLE DEĞİL!'),
  ]),
  b('w5_intro', [
    L('pebble', 'This is the bottom. The Abyss. Dusty, I can hear it humming.', 'Burası en dip. Uçurum. Dusty, uğultusunu duyabiliyorum.'),
    L('dusty', 'The Heart of the Deep. The source of all the gold. The Baron wants it.', 'Derinliğin Kalbi. Tüm altının kaynağı. Baron onu istiyor.'),
  ]),
  b('w5_mid', [
    L('pebble', 'The Drill is chewing the walls apart. If it reaches the Heart, the whole mine collapses!', 'Matkap duvarları çiğniyor. Kalbe ulaşırsa bütün maden çöker!'),
    L('dusty', 'Then this is the last shift. Pull, Pebble, pull!', 'O zaman bu son vardiya. Çek Çakıl, çek!'),
  ]),
  b('w5_boss', [
    L('baron', 'The Heart is mine! Power, gold, everything!', 'Kalp benim! Güç, altın, her şey!'),
    L('dusty', 'Baron, you cannot own the deep. You can only dig it with respect.', 'Baron, derinliğe sahip olamazsın. Sadece saygıyla kazabilirsin.'),
    L('pebble', 'Dusty, the final claw drop. Make it count!', 'Dusty, son kanca atışı. Değerli kıl!'),
  ]),
  b('finale', [
    L('baron', 'Impossible... my Drill... my gold...', 'İmkânsız... Matkabım... altınım...'),
    L('pebble', 'The Heart is quiet again. The mine is saved, Dusty!', 'Kalp yine sakin. Maden kurtuldu Dusty!'),
    L('dusty', 'And the Baron is going to spend a long time mining rocks by hand. Fair enough.', 'Baron da uzun süre elle kaya kazacak. Adil.'),
    L('pebble', 'So... same time tomorrow? Daily gift is waiting, and Endless mode never ends.', 'Peki... yarın aynı saat mi? Günlük hediye bekliyor, Sonsuz mod da hiç bitmiyor.'),
  ]),
];

/** The beat that plays before a level (once), or null. */
export function storyBeatFor(levelId: number): Beat | null {
  const world = Math.ceil(levelId / 20);
  const pos = levelId - (world - 1) * 20;
  const key = pos === 1 ? 'intro' : pos === 10 ? 'mid' : pos === 20 ? 'boss' : null;
  if (!key) return null;
  return STORY.find((s) => s.id === `w${world}_${key}`) ?? null;
}

export const FINALE = STORY.find((s) => s.id === 'finale') as Beat;
