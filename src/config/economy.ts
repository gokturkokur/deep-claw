/** Object values, weights, shop prices, bag outcomes. */

export type ObjType =
  | 'goldS'
  | 'goldM'
  | 'goldL'
  | 'diamond'
  | 'rockS'
  | 'rockL'
  | 'bag'
  | 'keg'
  | 'beetle';

export interface ObjDef {
  type: ObjType;
  /** Base money value (0 for special). */
  value: number;
  /** Retract divider. Bags roll a random weight inside weightRange. */
  weight: number;
  weightRange?: [number, number];
  /** Collision shape (slightly smaller than the art). */
  shape: { kind: 'circle'; r: number } | { kind: 'rect'; hw: number; hh: number };
  /** How far the object centre hangs below the jaw tip while carried. */
  hang: number;
  /** Texture key of the art. */
  texture: string;
  /** Can the claw pull this up? (kegs explode instead) */
  collectible: boolean;
}

export const OBJECTS: Record<ObjType, ObjDef> = {
  goldS: { type: 'goldS', value: 100, weight: 1.2, shape: { kind: 'circle', r: 28 }, hang: 22, texture: 'gold_s', collectible: true },
  goldM: { type: 'goldM', value: 250, weight: 2.2, shape: { kind: 'circle', r: 40 }, hang: 30, texture: 'gold_m', collectible: true },
  goldL: { type: 'goldL', value: 500, weight: 4.0, shape: { kind: 'circle', r: 58 }, hang: 44, texture: 'gold_l', collectible: true },
  diamond: { type: 'diamond', value: 600, weight: 1.0, shape: { kind: 'circle', r: 22 }, hang: 20, texture: 'diamond', collectible: true },
  rockS: { type: 'rockS', value: 10, weight: 3.0, shape: { kind: 'circle', r: 32 }, hang: 24, texture: 'rock_s', collectible: true },
  rockL: { type: 'rockL', value: 20, weight: 5.5, shape: { kind: 'rect', hw: 56, hh: 46 }, hang: 40, texture: 'rock_l', collectible: true },
  bag: { type: 'bag', value: 0, weight: 2.5, weightRange: [1.0, 4.0], shape: { kind: 'circle', r: 36 }, hang: 28, texture: 'bag', collectible: true },
  keg: { type: 'keg', value: 0, weight: 1, shape: { kind: 'rect', hw: 34, hh: 44 }, hang: 0, texture: 'keg', collectible: false },
  beetle: { type: 'beetle', value: 50, weight: 1.0, shape: { kind: 'circle', r: 28 }, hang: 22, texture: 'beetle_a', collectible: true },
};

/** A beetle that carries a diamond is worth this much (before Gem Lens). */
export const BEETLE_DIAMOND_VALUE = 650;

export const OBJ_TYPES = Object.keys(OBJECTS) as ObjType[];

export const BAG = {
  /** Outcome odds without / with Lucky Lantern. */
  odds: {
    base: { money: 0.6, item: 0.2, strength: 0.2 },
    lantern: { money: 0.5, item: 0.25, strength: 0.25 },
  },
  /** Money range (rounded to 10). */
  money: {
    base: [50, 400] as [number, number],
    lantern: [150, 600] as [number, number],
  },
  /** Pull strength bonus for the rest of the level. */
  strengthBoost: 1.5,
  /** The free item is this many Blast Caps. */
  freeBlastCaps: 1,
  /** How much the balance estimator counts a free item as. */
  itemNotionalValue: 150,
} as const;

export type ItemId = 'blastCap' | 'turbo' | 'lantern' | 'gemLens' | 'crusher';
export type BoostId = Exclude<ItemId, 'blastCap'>;

export const BOOST_IDS: readonly BoostId[] = ['turbo', 'lantern', 'gemLens', 'crusher'];

export interface ItemDef {
  id: ItemId;
  kind: 'stack' | 'boost';
  priceMin: number;
  priceMax: number;
  icon: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  blastCap: { id: 'blastCap', kind: 'stack', priceMin: 150, priceMax: 250, icon: 'icon_blast' },
  turbo: { id: 'turbo', kind: 'boost', priceMin: 300, priceMax: 500, icon: 'icon_turbo' },
  lantern: { id: 'lantern', kind: 'boost', priceMin: 200, priceMax: 400, icon: 'icon_lantern' },
  gemLens: { id: 'gemLens', kind: 'boost', priceMin: 350, priceMax: 600, icon: 'icon_gem' },
  crusher: { id: 'crusher', kind: 'boost', priceMin: 50, priceMax: 150, icon: 'icon_crusher' },
};

export const ITEM_IDS: readonly ItemId[] = ['blastCap', 'turbo', 'lantern', 'gemLens', 'crusher'];

export const SHOP = {
  /** Blast Cap price rises by this much per cleared level, capped at priceMax. */
  blastCapStep: 5,
  /** Boost items shown per visit (Blast Cap is always shown). */
  boostSlots: 3,
  maxBlastCaps: 9,
} as const;

export const EFFECTS = {
  /** Turbo Winch Oil: pull speed multiplier. */
  turboStrength: 1.5,
  /** Gem Lens: diamond value multiplier. */
  gemLensMult: 1.5,
  /** Ore Crusher: rock value multiplier. */
  crusherMult: 3,
} as const;

export const SAVE = {
  key: 'deepclaw.save',
  version: 2,
} as const;
