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
  | 'beetle'
  | 'chest'
  | 'slime';

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
  chest: { type: 'chest', value: 800, weight: 5.5, shape: { kind: 'rect', hw: 50, hh: 40 }, hang: 38, texture: 'chest', collectible: true },
  slime: { type: 'slime', value: -150, weight: 1.5, shape: { kind: 'circle', r: 30 }, hang: 22, texture: 'slime', collectible: true },
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

export type BoostId = 'turbo' | 'lantern' | 'gemLens' | 'crusher' | 'hourglass' | 'goldRush' | 'extraMiner' | 'magnet' | 'defuser';
export type SupplyId = 'blastCap' | 'blastPack' | 'freeze' | 'skip' | 'crate';
export type ItemId = BoostId | SupplyId;

export const BOOST_IDS: readonly BoostId[] = ['turbo', 'lantern', 'gemLens', 'crusher', 'hourglass', 'goldRush', 'extraMiner', 'magnet', 'defuser'];

export interface ItemDef {
  id: ItemId;
  /** stack = goes into the inventory, pack = several stack items, crate = opens at once, boost = next level only. */
  kind: 'stack' | 'boost' | 'pack' | 'crate';
  priceMin: number;
  priceMax: number;
  icon: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  blastCap: { id: 'blastCap', kind: 'stack', priceMin: 700, priceMax: 2500, icon: 'icon_blast' },
  blastPack: { id: 'blastPack', kind: 'pack', priceMin: 1800, priceMax: 1800, icon: 'icon_blast' },
  freeze: { id: 'freeze', kind: 'stack', priceMin: 1000, priceMax: 1000, icon: 'icon_freeze' },
  skip: { id: 'skip', kind: 'stack', priceMin: 6000, priceMax: 6000, icon: 'icon_ticket' },
  crate: { id: 'crate', kind: 'crate', priceMin: 1500, priceMax: 1500, icon: 'icon_crate' },
  turbo: { id: 'turbo', kind: 'boost', priceMin: 900, priceMax: 1500, icon: 'icon_turbo' },
  lantern: { id: 'lantern', kind: 'boost', priceMin: 600, priceMax: 1100, icon: 'icon_lantern' },
  gemLens: { id: 'gemLens', kind: 'boost', priceMin: 1000, priceMax: 1800, icon: 'icon_gem' },
  crusher: { id: 'crusher', kind: 'boost', priceMin: 300, priceMax: 600, icon: 'icon_crusher' },
  hourglass: { id: 'hourglass', kind: 'boost', priceMin: 1200, priceMax: 2000, icon: 'icon_hourglass' },
  goldRush: { id: 'goldRush', kind: 'boost', priceMin: 1500, priceMax: 2500, icon: 'icon_goldrush' },
  extraMiner: { id: 'extraMiner', kind: 'boost', priceMin: 3000, priceMax: 4500, icon: 'icon_miner' },
  magnet: { id: 'magnet', kind: 'boost', priceMin: 700, priceMax: 1200, icon: 'icon_magnet' },
  defuser: { id: 'defuser', kind: 'boost', priceMin: 800, priceMax: 1400, icon: 'icon_defuse' },
};

export const SUPPLY_IDS: readonly SupplyId[] = ['blastCap', 'blastPack', 'freeze', 'skip', 'crate'];
export const ITEM_IDS: readonly ItemId[] = ['blastCap', 'blastPack', 'freeze', 'skip', 'crate', 'turbo', 'lantern', 'gemLens', 'crusher', 'hourglass', 'goldRush', 'extraMiner', 'magnet', 'defuser'];

export const SHOP = {
  /** Blast Cap price rises by this much per cleared level, capped at priceMax. */
  blastCapStep: 25,
  /** Boost items shown per visit (Blast Cap is always shown). */
  boostSlots: 4,
  maxBlastCaps: 9,
  maxFreeze: 5,
  maxSkip: 3,
  blastPackSize: 3,
  /** Boost deals cost up to this many times more late in the campaign (money piles up otherwise). */
  dealScaleMax: 2,
  /** ... reached at this level. */
  dealScaleLevel: 100,
  /** One deal in the daily-deals tab is this much cheaper. */
  saleDiscount: 0.3,
  /** Reroll cost = base * (rerolls so far + 1). */
  rerollBase: 250,
  /** Share of a first-clear level's earnings that goes into the wallet (the rest is running costs). */
  walletShare: 0.6,
} as const;

export const EFFECTS = {
  /** Turbo Winch Oil: pull speed multiplier. */
  turboStrength: 1.5,
  /** Gem Lens: diamond value multiplier. */
  gemLensMult: 1.5,
  /** Ore Crusher: rock value multiplier. */
  crusherMult: 3,
  /** Hourglass: extra seconds. */
  hourglassSec: 15,
  /** Gold Fever: gold nugget value multiplier. */
  goldRushMult: 1.5,
  /** Extra Miner: the helper pulls up the nearest gold or diamond this often (s). */
  helperIntervalSec: 7,
  /** Magnet Charm: extra claw hit radius. */
  magnetRadius: 12,
  /** Keg Defuser: a defused keg is pulled up like a heavy object and pays this. */
  defusedKegValue: 150,
  defusedKegWeight: 3,
} as const;

export const SAVE = {
  key: 'deepclaw.save',
  version: 2,
} as const;

/** Combo: back to back deliveries worth at least `minValue` raise the payout multiplier. */
export const COMBO = {
  step: 0.1,
  max: 1.5,
  minValue: 50,
} as const;

/** Perfect hit: the claw line passes within `fraction` of the object's size from its centre. */
export const PERFECT = {
  fraction: 0.3,
  bonus: 0.1,
} as const;

export type UpgradeId = 'winch' | 'muscle' | 'watch' | 'fortune';
export const UPGRADE_IDS: readonly UpgradeId[] = ['winch', 'muscle', 'watch', 'fortune'];

/**
 * Every price in the Workshop (upgrades, claws, style) is multiplied by this.
 * Shop, crate, reroll and other prices are not affected. Set back to 1 for the original prices.
 */
export const WORKSHOP_PRICE_MULT = 10;

/** Permanent upgrades: price of level n+1 = base * growth^n (rounded to 50), times WORKSHOP_PRICE_MULT. */
export const UPGRADES: Record<UpgradeId, { max: number; base: number; growth: number; perLevel: number; icon: string }> = {
  winch: { max: 8, base: 900, growth: 1.7, perLevel: 0.07, icon: 'icon_turbo' },
  muscle: { max: 8, base: 1100, growth: 1.7, perLevel: 0.06, icon: 'icon_crusher' },
  watch: { max: 8, base: 1500, growth: 1.7, perLevel: 2, icon: 'icon_clock' },
  fortune: { max: 8, base: 1000, growth: 1.7, perLevel: 0.1, icon: 'icon_lantern' },
};

export type ClawId = 'standard' | 'wide' | 'swift' | 'titan';
export const CLAW_IDS: readonly ClawId[] = ['standard', 'wide', 'swift', 'titan'];

/** Claw types: different hit size, reel speed and pull strength. */
type ClawDef = { price: number; tipRadius: number; extendMult: number; strengthMult: number; tint: number };
/** Base prices; the real price is base * WORKSHOP_PRICE_MULT (see CLAW_TYPES). */
const CLAW_BASE: Record<ClawId, ClawDef> = {
  standard: { price: 0, tipRadius: 14, extendMult: 1, strengthMult: 1, tint: 0xffffff },
  wide: { price: 2500, tipRadius: 26, extendMult: 0.95, strengthMult: 0.9, tint: 0xffd680 },
  swift: { price: 3500, tipRadius: 14, extendMult: 1.3, strengthMult: 1, tint: 0x9fe0ff },
  titan: { price: 6000, tipRadius: 18, extendMult: 1, strengthMult: 1.3, tint: 0xff9a8a },
};
export const CLAW_TYPES = Object.fromEntries(
  CLAW_IDS.map((id) => [id, { ...CLAW_BASE[id], price: CLAW_BASE[id].price * WORKSHOP_PRICE_MULT }]),
) as Record<ClawId, ClawDef>;

/** Daily gift, 7 day cycle. */
export type DailyReward = { kind: 'money'; amount: number } | { kind: 'caps'; amount: number } | { kind: 'boost' };
export const DAILY_REWARDS: readonly DailyReward[] = [
  { kind: 'caps', amount: 1 },
  { kind: 'money', amount: 300 },
  { kind: 'caps', amount: 2 },
  { kind: 'money', amount: 700 },
  { kind: 'boost' },
  { kind: 'caps', amount: 3 },
  { kind: 'money', amount: 2000 },
];

export const ENDLESS = {
  startSec: 45,
  waveBonusSec: 10,
} as const;

export const WEEKLY = {
  difficulty: 8,
  /** The target is this share of what the balance estimator thinks is possible. */
  targetShare: 0.6,
  rewardMoney: 1500,
} as const;

/** How long Time Freeze stops the clock and the beetles (s). */
export const FREEZE_SEC = 6;

export type CosmeticSlot = 'outfit' | 'clawSkin' | 'rope';
export interface CosmeticDef {
  id: string;
  slot: CosmeticSlot;
  price: number;
  /** Outfits swap the miner texture, skins and ropes tint the claw / rope. */
  texture?: string;
  tint?: number;
}
/** Base prices; the real price is base * WORKSHOP_PRICE_MULT (see COSMETICS). */
const COSMETICS_BASE: readonly CosmeticDef[] = [
  { id: 'outfit_orange', slot: 'outfit', price: 0, texture: 'miner' },
  { id: 'outfit_blue', slot: 'outfit', price: 1200, texture: 'miner_blue' },
  { id: 'outfit_green', slot: 'outfit', price: 1200, texture: 'miner_green' },
  { id: 'outfit_purple', slot: 'outfit', price: 2500, texture: 'miner_purple' },
  { id: 'outfit_tycoon', slot: 'outfit', price: 6000, texture: 'miner_tycoon' },
  { id: 'claw_steel', slot: 'clawSkin', price: 0 },
  { id: 'claw_gold', slot: 'clawSkin', price: 1800, tint: 0xffd24a },
  { id: 'claw_rose', slot: 'clawSkin', price: 1500, tint: 0xff9ac0 },
  { id: 'claw_jade', slot: 'clawSkin', price: 1500, tint: 0x7ae0a0 },
  { id: 'claw_shadow', slot: 'clawSkin', price: 3000, tint: 0x6a6a8a },
  { id: 'rope_brown', slot: 'rope', price: 0 },
  { id: 'rope_red', slot: 'rope', price: 500, tint: 0xff7a7a },
  { id: 'rope_neon', slot: 'rope', price: 800, tint: 0x7aff9a },
  { id: 'rope_golden', slot: 'rope', price: 1500, tint: 0xffd24a },
];
export const COSMETICS: readonly CosmeticDef[] = COSMETICS_BASE.map((c) => ({ ...c, price: c.price * WORKSHOP_PRICE_MULT }));
export const DEFAULT_COSMETICS = { outfit: 'outfit_orange', clawSkin: 'claw_steel', rope: 'rope_brown' } as const;

/** Mystery Crate: weighted rewards. */
export const CRATE = {
  /** Money prizes are usually small: `bigChance` of them are a profit over the 1500 price. */
  money: { weight: 45, small: 600, bigChance: 0.33, big: [2000, 2400] as readonly number[] },
  caps: { weight: 25, amount: 1 },
  freeze: { weight: 12 },
  boost: { weight: 10 },
  skip: { weight: 2 },
} as const;

/** Lucky Wheel: one spin token is earned for each level cleared with 3 stars for the first time. */
export type WheelPrize =
  | { kind: 'money'; amount: number }
  | { kind: 'caps'; amount: number }
  | { kind: 'freeze' }
  | { kind: 'boost' }
  | { kind: 'skip' };
export const WHEEL: ReadonlyArray<{ prize: WheelPrize; weight: number; color: number; icon?: string }> = [
  { prize: { kind: 'money', amount: 300 }, weight: 22, color: 0xd9a020 },
  { prize: { kind: 'money', amount: 800 }, weight: 15, color: 0x58c24a },
  { prize: { kind: 'caps', amount: 2 }, weight: 14, color: 0xe5483a, icon: 'icon_blast' },
  { prize: { kind: 'money', amount: 2000 }, weight: 6, color: 0x3a8fe0 },
  { prize: { kind: 'freeze' }, weight: 14, color: 0x7fd0ff, icon: 'icon_freeze' },
  { prize: { kind: 'boost' }, weight: 12, color: 0xb07aff, icon: 'icon_gift' },
  { prize: { kind: 'skip' }, weight: 5, color: 0x3aa84a, icon: 'icon_ticket' },
  { prize: { kind: 'money', amount: 6000 }, weight: 2, color: 0xffd23a },
];
export const MAX_SPINS = 20;
