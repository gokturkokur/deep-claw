/**
 * Magnet prototype ("Magnet Test" mode). Every number of this mode lives here.
 * Deep Claw's own config files are not touched by this mode.
 */
import { KEG } from './game';

export type MagnetItemId = 'coins' | 'keys' | 'knife' | 'bike' | 'cart' | 'safe' | 'grenade' | 'tire' | 'boot' | 'stone';

export interface MagnetItemDef {
  id: MagnetItemId;
  /** Metal items are pulled and stick. Everything else is an obstacle. */
  metal: boolean;
  /** Money when delivered. For the safe this is only the average (see `prize`). */
  value: number;
  /** Retract divider and capacity cost. */
  weight: number;
  /** Collision shape (slightly smaller than the art). */
  shape: { kind: 'circle'; r: number } | { kind: 'rect'; hw: number; hh: number };
  /** Texture key (placeholder SVG, see src/assets/manifest.ts). */
  texture: string;
  /** Goes off when it sticks to the magnet (keg logic). */
  explosive?: boolean;
  /** Random reward revealed on delivery (mystery bag logic). */
  prize?: { min: number; max: number; step: number };
}

export const MAGNET_ITEMS: Record<MagnetItemId, MagnetItemDef> = {
  coins: { id: 'coins', metal: true, value: 50, weight: 0.5, shape: { kind: 'circle', r: 26 }, texture: 'mg_coins' },
  keys: { id: 'keys', metal: true, value: 90, weight: 0.8, shape: { kind: 'circle', r: 28 }, texture: 'mg_keys' },
  knife: { id: 'knife', metal: true, value: 70, weight: 0.6, shape: { kind: 'circle', r: 26 }, texture: 'mg_knife' },
  bike: { id: 'bike', metal: true, value: 300, weight: 3.5, shape: { kind: 'rect', hw: 62, hh: 40 }, texture: 'mg_bike' },
  cart: { id: 'cart', metal: true, value: 450, weight: 6, shape: { kind: 'rect', hw: 50, hh: 46 }, texture: 'mg_cart' },
  safe: {
    id: 'safe',
    metal: true,
    value: 425,
    weight: 4,
    shape: { kind: 'rect', hw: 40, hh: 40 },
    texture: 'mg_safe',
    prize: { min: 150, max: 700, step: 10 },
  },
  grenade: { id: 'grenade', metal: true, value: 0, weight: 1, shape: { kind: 'circle', r: 24 }, texture: 'mg_grenade', explosive: true },
  tire: { id: 'tire', metal: false, value: 0, weight: 3, shape: { kind: 'circle', r: 48 }, texture: 'mg_tire' },
  boot: { id: 'boot', metal: false, value: 0, weight: 2, shape: { kind: 'circle', r: 40 }, texture: 'mg_boot' },
  stone: { id: 'stone', metal: false, value: 0, weight: 5, shape: { kind: 'circle', r: 42 }, texture: 'mg_stone' },
};

export const MAGNET_ITEM_IDS = Object.keys(MAGNET_ITEMS) as MagnetItemId[];

/** Physics and feel that are not on the settings panel. */
export const MAGNET = {
  /** Collision radius of the magnet face (bigger than the Deep Claw jaw tip). */
  tipRadius: 34,
  /** Retract speed = baseRetractSpeed * retractStrength / total carried weight (the Deep Claw formula). */
  retractStrength: 2.4,
  /** Pull speed = pullStrength * (1 - dist/radius)^falloffPower / weight. */
  falloffPower: 1.5,
  /** If less than this capacity is left, the load counts as full. (Lightest item is 0.5.) */
  minItemWeight: 0.5,
  /** Seconds an item takes to settle into its spot on the magnet after touching it. */
  attachBlendSec: 0.1,
  /** Grenade blast radius. Same number as the Deep Claw powder keg. */
  blastRadius: KEG.blastRadius,
  /** True: a grenade also destroys what the magnet already carries (it sits right next to it). */
  blastDestroysCarried: true,
  /** Items inside the field jitter by this many px so the player can read the pull. */
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
  pullRadius: { min: 80, max: 420, step: 10, def: 260 },
  pullStrength: { min: 100, max: 1600, step: 25, def: 700 },
  capacity: { min: 2, max: 20, step: 0.5, def: 6 },
  descentSpeed: { min: 300, max: 1500, step: 25, def: 850 },
  mode: { def: 'sweep' as MagnetMode },
  showRing: { def: true },
  storageKey: 'deepclaw.magnet.settings',
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
 * "Kanal Testi". Easy stuff near the surface, a valuable safe hidden behind a tyre in the middle,
 * heavy metal that eats the capacity, and grenades planted next to the valuables.
 */
export const MAGNET_LEVEL: MagnetLevelDef = {
  id: 'canal-test',
  name: 'Kanal Testi',
  durationSec: 60,
  target: 800,
  swingMult: 1,
  items: [
    // near the surface: easy, one is straight below the start
    { kind: 'keys', x: 360, y: 520 },
    { kind: 'coins', x: 230, y: 470 },
    { kind: 'coins', x: 500, y: 450 },
    { kind: 'knife', x: 610, y: 560 },
    { kind: 'knife', x: 120, y: 600 },
    // middle: the tyre blocks the straight path to the safe, the grenade sits next to the bike
    { kind: 'tire', x: 340, y: 690 },
    { kind: 'safe', x: 420, y: 870 },
    { kind: 'boot', x: 140, y: 700 },
    { kind: 'bike', x: 600, y: 850 },
    { kind: 'grenade', x: 610, y: 700 },
    { kind: 'keys', x: 210, y: 880 },
    // deep: heavy cart behind a stone, coins next to a second grenade
    { kind: 'stone', x: 250, y: 950 },
    { kind: 'cart', x: 130, y: 1020 },
    { kind: 'stone', x: 470, y: 960 },
    { kind: 'coins', x: 560, y: 1070 },
    { kind: 'grenade', x: 630, y: 1030 },
    { kind: 'keys', x: 330, y: 1090 },
    { kind: 'coins', x: 400, y: 1150 },
  ],
};
