import { BOOST_IDS, CLAW_IDS, COSMETICS, DEFAULT_COSMETICS, SAVE, SHOP, UPGRADE_IDS, UPGRADES, type CosmeticSlot, type BoostId, type ClawId, type UpgradeId } from '../config/economy';
import { LEVELS } from '../data/levels';

export type Lang = 'en' | 'tr';

export interface ShopState {
  /** Seed so a reload shows the same stock. */
  seed: number;
  /** Level that was just cleared. */
  afterLevel: number;
  /** Boost items already bought in this visit. */
  bought: BoostId[];
  /** How many times the player rerolled this visit. */
  rerolls: number;
}

export interface Stats {
  collected: number;
  diamonds: number;
  kegs: number;
  rocks: number;
  blasts: number;
  chests: number;
  bestCombo: number;
  levelsWon: number;
  totalEarned: number;
  endlessWaves: number;
}

export function defaultStats(): Stats {
  return { collected: 0, diamonds: 0, kegs: 0, rocks: 0, blasts: 0, chests: 0, bestCombo: 0, levelsWon: 0, totalEarned: 0, endlessWaves: 0 };
}

export interface SaveData {
  saveVersion: number;
  /** Highest level the player may play. */
  unlockedLevel: number;
  /** Level that "Continue" opens (or the shop before it). */
  currentLevel: number;
  /** 'shop' = the player won and has not left the shop yet. */
  phase: 'level' | 'shop';
  wallet: number;
  levels: Record<string, { stars: number; best: number; mission?: boolean }>;
  inventory: { blastCaps: number; freeze: number; skip: number };
  cosmetics: { owned: string[]; equipped: Record<CosmeticSlot, string> };
  storySeen: string[];
  /** Boosts bought for the next level. */
  boosts: Record<BoostId, boolean>;
  shop: ShopState | null;
  stats: Stats;
  achievements: string[];
  daily: { last: string; streak: number };
  upgrades: Record<UpgradeId, number>;
  claws: { owned: ClawId[]; equipped: ClawId };
  endless: { best: number; bestWaves: number };
  weekly: { week: string; best: number; claimed: boolean };
  hasProgress: boolean;
  hintShown: boolean;
  settings: { music: number; sfx: number; vibration: boolean; lang: Lang | null };
}

export function defaultSave(): SaveData {
  return {
    saveVersion: SAVE.version,
    unlockedLevel: 1,
    currentLevel: 1,
    phase: 'level',
    wallet: 0,
    levels: {},
    inventory: { blastCaps: 0, freeze: 0, skip: 0 },
    cosmetics: { owned: COSMETICS.filter((c) => c.price === 0).map((c) => c.id), equipped: { ...DEFAULT_COSMETICS } },
    storySeen: [],
    boosts: { turbo: false, lantern: false, gemLens: false, crusher: false, hourglass: false, goldRush: false, extraMiner: false },
    shop: null,
    stats: defaultStats(),
    achievements: [],
    daily: { last: '', streak: 0 },
    upgrades: { winch: 0, muscle: 0, watch: 0, fortune: 0 },
    claws: { owned: ['standard'], equipped: 'standard' },
    endless: { best: 0, bestWaves: 0 },
    weekly: { week: '', best: 0, claimed: false },
    hasProgress: false,
    hintShown: false,
    settings: { music: 0.6, sfx: 0.8, vibration: true, lang: null },
  };
}

const num = (v: unknown, def: number, min: number, max: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
const int = (v: unknown, def: number, min: number, max: number): number => Math.round(num(v, def, min, max));
const bool = (v: unknown, def: boolean): boolean => (typeof v === 'boolean' ? v : def);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Upgrade older save shapes to the current one. Never throws. */
export function migrate(raw: unknown): Record<string, unknown> {
  if (!isObj(raw)) return {};
  const version = typeof raw.saveVersion === 'number' ? raw.saveVersion : 0;
  if (version >= SAVE.version) return raw;
  // v0/v1 shape: { level, money, caps, stars: number[] , best: number[] }
  const out: Record<string, unknown> = {};
  const level = int(raw.level, 1, 1, LEVELS.length);
  out.unlockedLevel = level;
  out.currentLevel = level;
  out.wallet = raw.money ?? raw.wallet;
  out.inventory = { blastCaps: raw.caps ?? 0 };
  const stars = Array.isArray(raw.stars) ? raw.stars : [];
  const best = Array.isArray(raw.best) ? raw.best : [];
  const levels: Record<string, { stars: number; best: number }> = {};
  stars.forEach((s, i) => {
    levels[String(i + 1)] = { stars: int(s, 0, 0, 3), best: int(best[i], 0, 0, 1e9) };
  });
  out.levels = levels;
  out.hasProgress = level > 1 || (typeof out.wallet === 'number' && out.wallet > 0);
  if (isObj(raw.settings)) out.settings = raw.settings;
  return out;
}

/** Validate a loaded object, filling any missing / broken field with defaults. */
export function sanitize(raw: unknown): SaveData {
  const d = defaultSave();
  const r = migrate(raw);
  const maxLevel = LEVELS.length;

  d.unlockedLevel = int(r.unlockedLevel, 1, 1, maxLevel);
  d.currentLevel = int(r.currentLevel, d.unlockedLevel, 1, maxLevel);
  if (d.currentLevel > d.unlockedLevel) d.unlockedLevel = d.currentLevel;
  d.phase = r.phase === 'shop' ? 'shop' : 'level';
  d.wallet = int(r.wallet, 0, 0, 1e9);
  d.hasProgress = bool(r.hasProgress, false);
  d.hintShown = bool(r.hintShown, false);

  if (isObj(r.levels)) {
    for (const [k, v] of Object.entries(r.levels)) {
      const id = Number(k);
      if (!Number.isInteger(id) || id < 1 || id > maxLevel || !isObj(v)) continue;
      d.levels[String(id)] = { stars: int(v.stars, 0, 0, 3), best: int(v.best, 0, 0, 1e9), mission: bool(v.mission, false) };
    }
  }
  if (isObj(r.inventory)) {
    d.inventory.blastCaps = int(r.inventory.blastCaps, 0, 0, SHOP.maxBlastCaps);
    d.inventory.freeze = int(r.inventory.freeze, 0, 0, SHOP.maxFreeze);
    d.inventory.skip = int(r.inventory.skip, 0, 0, SHOP.maxSkip);
  }
  if (isObj(r.cosmetics)) {
    const ids = COSMETICS.map((c) => c.id);
    const owned = Array.isArray(r.cosmetics.owned) ? r.cosmetics.owned.filter((c): c is string => typeof c === 'string' && ids.includes(c)) : [];
    d.cosmetics.owned = Array.from(new Set([...d.cosmetics.owned, ...owned]));
    if (isObj(r.cosmetics.equipped)) {
      for (const slot of ['outfit', 'clawSkin', 'rope'] as CosmeticSlot[]) {
        const want = r.cosmetics.equipped[slot];
        if (typeof want === 'string' && d.cosmetics.owned.includes(want) && COSMETICS.find((c) => c.id === want)?.slot === slot) d.cosmetics.equipped[slot] = want;
      }
    }
  }
  if (Array.isArray(r.storySeen)) d.storySeen = r.storySeen.filter((x): x is string => typeof x === 'string').slice(0, 100);
  if (isObj(r.boosts)) for (const id of BOOST_IDS) d.boosts[id] = bool(r.boosts[id], false);

  if (isObj(r.shop) && d.phase === 'shop') {
    const bought = Array.isArray(r.shop.bought) ? r.shop.bought.filter((b): b is BoostId => BOOST_IDS.includes(b as BoostId)) : [];
    d.shop = {
      seed: int(r.shop.seed, 1, 0, 0xffffffff),
      afterLevel: int(r.shop.afterLevel, Math.max(1, d.currentLevel - 1), 1, maxLevel),
      bought,
      rerolls: int(r.shop.rerolls, 0, 0, 1000),
    };
  } else {
    d.phase = 'level';
  }
  if (d.phase === 'shop' && !d.shop) d.phase = 'level';

  if (isObj(r.stats)) for (const k of Object.keys(d.stats) as Array<keyof Stats>) d.stats[k] = int(r.stats[k], 0, 0, 1e12);
  if (Array.isArray(r.achievements)) d.achievements = r.achievements.filter((a): a is string => typeof a === 'string').slice(0, 100);
  if (isObj(r.daily)) d.daily = { last: typeof r.daily.last === 'string' ? r.daily.last.slice(0, 10) : '', streak: int(r.daily.streak, 0, 0, 10000) };
  if (isObj(r.upgrades)) for (const id of UPGRADE_IDS) d.upgrades[id] = int(r.upgrades[id], 0, 0, UPGRADES[id].max);
  if (isObj(r.claws)) {
    const owned = Array.isArray(r.claws.owned) ? r.claws.owned.filter((c): c is ClawId => CLAW_IDS.includes(c as ClawId)) : [];
    d.claws.owned = Array.from(new Set<ClawId>(['standard', ...owned]));
    d.claws.equipped = d.claws.owned.includes(r.claws.equipped as ClawId) ? (r.claws.equipped as ClawId) : 'standard';
  }
  if (isObj(r.endless)) d.endless = { best: int(r.endless.best, 0, 0, 1e12), bestWaves: int(r.endless.bestWaves, 0, 0, 1e6) };
  if (isObj(r.weekly)) d.weekly = { week: typeof r.weekly.week === 'string' ? r.weekly.week.slice(0, 10) : '', best: int(r.weekly.best, 0, 0, 1e12), claimed: bool(r.weekly.claimed, false) };

  if (isObj(r.settings)) {
    d.settings.music = num(r.settings.music, d.settings.music, 0, 1);
    d.settings.sfx = num(r.settings.sfx, d.settings.sfx, 0, 1);
    d.settings.vibration = bool(r.settings.vibration, true);
    d.settings.lang = r.settings.lang === 'en' || r.settings.lang === 'tr' ? r.settings.lang : null;
  }
  return d;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory store for tests and for browsers where localStorage is blocked. */
export class MemoryStore implements KeyValueStore {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v);
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
}

export function safeStore(): KeyValueStore {
  try {
    const s = window.localStorage;
    s.setItem('__t', '1');
    s.removeItem('__t');
    return s;
  } catch {
    return new MemoryStore();
  }
}

export class SaveManager {
  data: SaveData;

  constructor(private readonly store: KeyValueStore) {
    this.data = this.load();
  }

  load(): SaveData {
    let parsed: unknown = null;
    try {
      const txt = this.store.getItem(SAVE.key);
      parsed = txt ? JSON.parse(txt) : null;
    } catch {
      parsed = null;
    }
    this.data = sanitize(parsed);
    return this.data;
  }

  save(): void {
    try {
      this.store.setItem(SAVE.key, JSON.stringify(this.data));
    } catch {
      /* storage full or blocked: keep playing */
    }
  }

  /** Wipe progress but keep settings. */
  resetProgress(): void {
    const settings = this.data.settings;
    this.data = defaultSave();
    this.data.settings = settings;
    this.data.hintShown = false;
    this.save();
  }

  stars(level: number): number {
    return this.data.levels[String(level)]?.stars ?? 0;
  }
  best(level: number): number {
    return this.data.levels[String(level)]?.best ?? 0;
  }
}
