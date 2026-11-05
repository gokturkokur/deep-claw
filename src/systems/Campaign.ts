import type { LevelDef } from '../data/levels';
import { LEVELS } from '../data/levels';
import { hashSeed } from './Fields';

export const LEVELS_PER_WORLD = 20;
export const WORLD_COUNT = Math.ceil(LEVELS.length / LEVELS_PER_WORLD);

export type ThemeId = 'mine' | 'cave' | 'lava' | 'ice' | 'abyss';
export const THEME_ORDER: readonly ThemeId[] = ['mine', 'cave', 'lava', 'ice', 'abyss'];

export interface Theme {
  sky: number;
  skyBase: number;
  soil: number;
  ground: number;
  glow: number;
  glowAlpha: number;
}

/** Tints applied to the shared background art, one look per world. */
export const THEMES: Record<ThemeId, Theme> = {
  mine: { sky: 0xffffff, skyBase: 0x3a2a5c, soil: 0xffffff, ground: 0xffffff, glow: 0xffffff, glowAlpha: 0.3 },
  cave: { sky: 0x9fb4e0, skyBase: 0x1f2f55, soil: 0x9fb4d8, ground: 0x8fc0c8, glow: 0x8fd0ff, glowAlpha: 0.34 },
  lava: { sky: 0xff9a6a, skyBase: 0x5a1f1a, soil: 0xe09080, ground: 0xc08a6a, glow: 0xff7a3a, glowAlpha: 0.42 },
  ice: { sky: 0xbfe4ff, skyBase: 0x2f4a7a, soil: 0xc4e2f2, ground: 0xe8f6ff, glow: 0xbfeaff, glowAlpha: 0.3 },
  abyss: { sky: 0x7a6aa8, skyBase: 0x120a2a, soil: 0x8a78b0, ground: 0x7a6aa0, glow: 0xb08aff, glowAlpha: 0.4 },
};

export function worldOf(levelId: number): number {
  return Math.min(WORLD_COUNT, Math.max(1, Math.ceil(levelId / LEVELS_PER_WORLD)));
}
export function themeOf(levelId: number): ThemeId {
  return THEME_ORDER[(worldOf(levelId) - 1) % THEME_ORDER.length];
}
export function firstLevelOfWorld(world: number): number {
  return (world - 1) * LEVELS_PER_WORLD + 1;
}
export function isBoss(levelId: number): boolean {
  return levelId % LEVELS_PER_WORLD === 0;
}

// ---- bonus missions ---------------------------------------------------------
export type MissionKind = 'diamonds' | 'combo' | 'kegs' | 'chests' | 'noSlime' | 'noRocks' | 'beetles' | 'noBlast';

export interface Mission {
  kind: MissionKind;
  goal: number;
  /** Bonus money paid on the first clear. */
  reward: number;
}

export interface MissionStats {
  diamonds: number;
  bestCombo: number;
  kegs: number;
  chests: number;
  slimes: number;
  rocks: number;
  beetles: number;
  blasts: number;
}

/** Each level has one optional side mission that fits what is actually in the level. */
export function missionFor(level: LevelDef): Mission {
  const count = (t: string) => level.objects.filter((o) => o.type === t).length;
  const options: Mission[] = [];
  const reward = Math.round((150 + level.id * 20) / 50) * 50;
  const diamonds = count('diamond') + level.objects.filter((o) => o.carriesDiamond).length;
  if (diamonds >= 1) options.push({ kind: 'diamonds', goal: Math.min(diamonds, 1 + Math.floor(level.id / 25)), reward });
  options.push({ kind: 'combo', goal: Math.min(8, 3 + Math.floor(level.id / 15)), reward });
  if (count('keg') >= 1) options.push({ kind: 'kegs', goal: 1, reward });
  if (count('chest') >= 1) options.push({ kind: 'chests', goal: 1, reward: reward + 100 });
  if (count('slime') >= 1) options.push({ kind: 'noSlime', goal: 0, reward });
  if (count('rockL') + count('rockS') >= 3) options.push({ kind: 'noRocks', goal: 0, reward });
  if (count('beetle') >= 1) options.push({ kind: 'beetles', goal: 1, reward });
  options.push({ kind: 'noBlast', goal: 0, reward: Math.round(reward / 100) * 50 });
  return options[hashSeed('mission' + level.id) % options.length];
}

export function missionProgress(m: Mission, s: MissionStats): number {
  switch (m.kind) {
    case 'diamonds':
      return s.diamonds;
    case 'combo':
      return s.bestCombo;
    case 'kegs':
      return s.kegs;
    case 'chests':
      return s.chests;
    case 'beetles':
      return s.beetles;
    case 'noSlime':
      return s.slimes === 0 ? 1 : 0;
    case 'noRocks':
      return s.rocks === 0 ? 1 : 0;
    case 'noBlast':
      return s.blasts === 0 ? 1 : 0;
  }
}

export function missionGoal(m: Mission): number {
  return m.kind === 'noSlime' || m.kind === 'noRocks' || m.kind === 'noBlast' ? 1 : m.goal;
}

/** "No ..." missions can only be judged at the end of the level. */
export function missionIsRestriction(m: Mission): boolean {
  return m.kind === 'noSlime' || m.kind === 'noRocks' || m.kind === 'noBlast';
}

export function missionDone(m: Mission, s: MissionStats): boolean {
  return missionProgress(m, s) >= missionGoal(m);
}

/** Boss levels have a twist: the swing speeds up in pulses (rush) and / or the lights go out (blackout). */
export interface Twist {
  rush: boolean;
  blackout: boolean;
}

export function twistFor(levelId: number): Twist {
  if (!isBoss(levelId)) return { rush: false, blackout: false };
  const w = worldOf(levelId);
  return { rush: w === 1 || w === 3 || w === 4 || w === 5, blackout: w === 2 || w === 3 || w === 5 };
}

export const TWIST = {
  /** Cycle length (s); the last `rushSec` seconds of each cycle are fast. */
  rushCycle: 12,
  rushSec: 4,
  rushMult: 1.45,
  blackoutCycle: 10,
  blackoutStart: 6.5,
  blackoutSec: 3,
} as const;

/** Short one-time tips, each tied to something the player meets in a level. Returns the first unseen one. */
export function tipFor(level: LevelDef, seen: readonly string[]): string | null {
  const has = (t: string) => level.objects.some((o) => o.type === t);
  const order: Array<[string, boolean]> = [
    ['keg', has('keg')],
    ['bag', has('bag')],
    ['slime', has('slime')],
    ['beetle', has('beetle')],
    ['chest', has('chest')],
    ['rockL', has('rockL') && level.id > 3],
    ['combo', level.id >= 2],
    ['mission', level.id >= 3],
  ];
  for (const [id, applies] of order) if (applies && !seen.includes(id)) return id;
  return null;
}

/** Miner rank from the total number of stars earned. */
export const RANK_STARS: readonly number[] = [0, 15, 40, 80, 140, 220, 290];

export function totalStars(levels: Record<string, { stars: number }>): number {
  return Object.values(levels).reduce((a, l) => a + l.stars, 0);
}

export function rankIndex(stars: number): number {
  let r = 0;
  for (let i = 0; i < RANK_STARS.length; i++) if (stars >= RANK_STARS[i]) r = i;
  return r;
}

/** Main menu buttons open one by one so a new player only sees Play at first (level = highest unlocked level needed). */
export type MenuFeature = 'shop' | 'awards' | 'workshop' | 'wheel' | 'endless' | 'weekly';
export const MENU_UNLOCK: Record<MenuFeature, number> = {
  shop: 2,
  awards: 2,
  workshop: 3,
  wheel: 4,
  endless: 5,
  weekly: 6,
};
