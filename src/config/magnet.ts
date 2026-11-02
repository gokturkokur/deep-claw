/**
 * Magnet prototype ("Magnet Test" mode). Every number of this mode lives here.
 * Deep Claw's own config files are not touched by this mode.
 */
import { KEG } from './game';

export type MagnetItemId = 'coins' | 'keys' | 'knife' | 'bike' | 'cart' | 'safe' | 'grenade' | 'pipe' | 'manhole' | 'chain' | 'engine';

export interface MagnetItemDef {
  id: MagnetItemId;
  /** Money when delivered. For the safe this is only the average (see `prize`). */
  value: number;
  /** Retract divider and capacity cost. */
  weight: number;
  /** Collision shape (slightly smaller than the art). */
  shape: { kind: 'circle'; r: number } | { kind: 'rect'; hw: number; hh: number };
  /** Texture key (placeholder SVG, see src/assets/manifest.ts). */
  texture: string;
  /**
   * Goes off when the magnet face touches it (keg logic). Explosives are never pulled by the field
   * and ignore the capacity: only a direct touch sets them off.
   */
  explosive?: boolean;
  /** Random reward revealed on delivery (mystery bag logic). */
  prize?: { min: number; max: number; step: number };
}

export const MAGNET_ITEMS: Record<MagnetItemId, MagnetItemDef> = {
  coins: { id: 'coins', value: 50, weight: 0.5, shape: { kind: 'circle', r: 26 }, texture: 'mg_coins' },
  keys: { id: 'keys', value: 90, weight: 0.8, shape: { kind: 'circle', r: 28 }, texture: 'mg_keys' },
  knife: { id: 'knife', value: 70, weight: 0.6, shape: { kind: 'circle', r: 26 }, texture: 'mg_knife' },
  bike: { id: 'bike', value: 300, weight: 3.5, shape: { kind: 'rect', hw: 62, hh: 40 }, texture: 'mg_bike' },
  cart: { id: 'cart', value: 450, weight: 6, shape: { kind: 'rect', hw: 50, hh: 46 }, texture: 'mg_cart' },
  safe: {
    id: 'safe',
    value: 425,
    weight: 4,
    shape: { kind: 'rect', hw: 40, hh: 40 },
    texture: 'mg_safe',
    prize: { min: 150, max: 700, step: 10 },
  },
  grenade: { id: 'grenade', value: 0, weight: 1, shape: { kind: 'circle', r: 24 }, texture: 'mg_grenade', explosive: true },
  // Heavy cheap scrap: sticks like everything else, eats the capacity and crawls home (the rocks of this mode).
  pipe: { id: 'pipe', value: 15, weight: 3, shape: { kind: 'rect', hw: 58, hh: 15 }, texture: 'mg_pipe' },
  manhole: { id: 'manhole', value: 20, weight: 4, shape: { kind: 'circle', r: 40 }, texture: 'mg_manhole' },
  chain: { id: 'chain', value: 25, weight: 3.5, shape: { kind: 'circle', r: 36 }, texture: 'mg_chain' },
  engine: { id: 'engine', value: 40, weight: 6, shape: { kind: 'rect', hw: 48, hh: 38 }, texture: 'mg_engine' },
};

export const MAGNET_ITEM_IDS = Object.keys(MAGNET_ITEMS) as MagnetItemId[];

/** Physics and feel that are not on the settings panel. */
export const MAGNET = {
  /** Collision radius of the magnet face (bigger than the Deep Claw jaw tip). */
  tipRadius: 34,
  /** Retract speed = baseRetractSpeed * retractStrength / total carried weight (the Deep Claw formula). */
  retractStrength: 2.4,
  /** Pull speed = pullStrength * (1 - dist/radius)^falloffPower / weight. 1 = straight line down to 0 at the edge. */
  falloffPower: 1,
  /** If less than this capacity is left, the load counts as full. (Lightest item is 0.5.) */
  minItemWeight: 0.5,
  /** Seconds an item takes to settle into its spot on the magnet after touching it. */
  attachBlendSec: 0.1,
  /** Grenade blast radius. Same number as the Deep Claw powder keg. */
  blastRadius: KEG.blastRadius,
  /** True: a grenade also destroys what the magnet already carries (it sits right next to it). */
  blastDestroysCarried: true,
  /** Items inside the field jitter by this many px so the player can read the pull (grenades never do). */
  pullJitterPx: 3,
  /** Overrides on the shared claw numbers (CLAW in config/game.ts). */
  claw: {
    emptyRetractSpeed: 1500,
    baseRetractSpeed: 500,
    minRetractSpeed: 60,
  },
} as const;

export type MagnetMode = 'firstStick' | 'sweep';

/** Ranges and defaults of the settings panel. Defaults are my suggested starting values. */
export const MAGNET_SETTINGS = {
  /** Measured from the magnet face to the item's centre. Small on purpose: a bit of forgiveness, not a vacuum cleaner. */
  pullRadius: { min: 60, max: 200, step: 10, def: 110 },
  pullStrength: { min: 100, max: 1600, step: 25, def: 700 },
  capacity: { min: 2, max: 20, step: 0.5, def: 6 },
  descentSpeed: { min: 300, max: 1500, step: 25, def: 850 },
  mode: { def: 'sweep' as MagnetMode },
  showRing: { def: true },
  /** v2: new key so values remembered from the old, much bigger radius do not override the new defaults. */
  storageKey: 'deepclaw.magnet.settings.v2',
} as const;

export interface MagnetPlacement {
  kind: MagnetItemId;
  x: number;
  y: number;
}

export interface MagnetLevelDef {
  id: string;
  name: string;
  durationSec: number;
  /** Money to earn in the time limit. */
  target: number;
  /** Multiplier on swing speed. */
  swingMult: number;
  items: readonly MagnetPlacement[];
}

/**
 * "Kanal Testi". Light loose change near the surface, two valuables you can reach straight away
 * (the safe and the bike, each half covered by cheap heavy scrap), two shopping carts hidden behind
 * scrap that has to be cleared first, and grenades right next to the safe and the bike.
 * Balanced with tools/magnet-balance.ts (see docs/MAGNET_PROTOTYPE.md for the numbers).
 */
export const MAGNET_LEVEL: MagnetLevelDef = {
  id: 'canal-test',
  name: 'Kanal Testi',
  durationSec: 60,
  /** A perfect player reaches this at about 41 s (safe at its average value). */
  target: 2200,
  swingMult: 1,
  items: [
    // near the surface: easy, the key bunch is straight below the start
    { kind: 'keys', x: 360, y: 470 },
    { kind: 'coins', x: 215, y: 440 },
    { kind: 'knife', x: 100, y: 520 },
    { kind: 'coins', x: 540, y: 450 },
    { kind: 'knife', x: 640, y: 520 },
    // safe: a pipe covers its left side, a grenade waits on its right; about 14 degrees of open water between
    { kind: 'pipe', x: 165, y: 630 },
    { kind: 'safe', x: 300, y: 720 },
    { kind: 'grenade', x: 420, y: 760 },
    // bike: a chain pile covers its right side, a second grenade sits next to it
    { kind: 'chain', x: 600, y: 640 },
    { kind: 'bike', x: 560, y: 900 },
    { kind: 'grenade', x: 670, y: 820 },
    // left: first cart behind a chain pile and the engine block, keys behind a manhole cover
    { kind: 'manhole', x: 90, y: 800 },
    { kind: 'chain', x: 200, y: 860 },
    { kind: 'engine', x: 250, y: 940 },
    { kind: 'cart', x: 130, y: 1080 },
    { kind: 'keys', x: 60, y: 960 },
    { kind: 'keys', x: 60, y: 1180 },
    // right: second cart behind the bike and a pipe
    { kind: 'pipe', x: 620, y: 1010 },
    { kind: 'cart', x: 600, y: 1140 },
    { kind: 'coins', x: 680, y: 1190 },
    // bottom middle: small stuff behind a manhole cover
    { kind: 'manhole', x: 380, y: 1000 },
    { kind: 'keys', x: 330, y: 1090 },
    { kind: 'knife', x: 480, y: 1100 },
    { kind: 'coins', x: 400, y: 1170 },
    { kind: 'knife', x: 260, y: 1170 },
  ],
};
