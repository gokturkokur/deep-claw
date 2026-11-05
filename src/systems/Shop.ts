import { BOOST_IDS, COSMETICS, CRATE, ITEMS, SHOP, type BoostId, type ItemId } from '../config/economy';
import { makeRng, type Rng } from './Rng';
import type { SaveData } from './Save';
import type { Modifiers } from './Economy';

export interface ShopOffer {
  id: ItemId;
  price: number;
  /** Cheaper than normal today. */
  sale?: boolean;
}

const round10 = (n: number): number => Math.round(n / 10) * 10;

export function blastCapPrice(afterLevel: number): number {
  const def = ITEMS.blastCap;
  return Math.min(def.priceMax, def.priceMin + SHOP.blastCapStep * Math.max(0, afterLevel - 1));
}

/** Supplies tab: always the same five things, Blast Cap price grows with progress. */
export function supplyOffers(afterLevel: number): ShopOffer[] {
  return [
    { id: 'blastCap', price: blastCapPrice(afterLevel) },
    { id: 'blastPack', price: ITEMS.blastPack.priceMin },
    { id: 'freeze', price: ITEMS.freeze.priceMin },
    { id: 'crate', price: ITEMS.crate.priceMin },
    { id: 'skip', price: ITEMS.skip.priceMin },
  ];
}

/**
 * Daily deals tab: SHOP.boostSlots of the boosts at random prices, one of them on sale.
 * Same seed and reroll count = same deals, so a reload shows the same shop.
 */
export function dealOffers(seed: number, rerolls = 0): ShopOffer[] {
  const rng = makeRng(seed + rerolls * 104729);
  const pool: BoostId[] = [...BOOST_IDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, SHOP.boostSlots);
  const saleIndex = Math.floor(rng() * picked.length);
  return picked.map((id, i) => {
    const def = ITEMS[id];
    const base = round10(def.priceMin + (def.priceMax - def.priceMin) * rng());
    const sale = i === saleIndex;
    return { id, price: sale ? round10(base * (1 - SHOP.saleDiscount)) : base, sale };
  });
}

export function rerollCost(rerolls = 0): number {
  return SHOP.rerollBase * ((rerolls || 0) + 1);
}

export function reroll(save: SaveData): boolean {
  if (!save.shop) return false;
  const cost = rerollCost(save.shop.rerolls);
  if (save.wallet < cost) return false;
  save.wallet -= cost;
  save.shop.rerolls = (save.shop.rerolls || 0) + 1;
  save.shop.bought = [];
  return true;
}

export type CrateReward =
  | { kind: 'money'; amount: number }
  | { kind: 'caps'; amount: number }
  | { kind: 'freeze' }
  | { kind: 'boost'; boost: BoostId }
  | { kind: 'skip' };

/** Opens a Mystery Crate and applies the reward. Items that are already full turn into money. */
export function openCrate(save: SaveData, rng: Rng): CrateReward {
  const total = CRATE.money.weight + CRATE.caps.weight + CRATE.freeze.weight + CRATE.boost.weight + CRATE.skip.weight;
  let r = rng() * total;
  const money = (): CrateReward => {
    const big = rng() < CRATE.money.bigChance;
    const amount = big ? CRATE.money.big[Math.floor(rng() * CRATE.money.big.length)] : CRATE.money.small;
    save.wallet += amount;
    return { kind: 'money', amount };
  };
  if ((r -= CRATE.money.weight) < 0) return money();
  if ((r -= CRATE.caps.weight) < 0) {
    if (save.inventory.blastCaps >= SHOP.maxBlastCaps) return money();
    save.inventory.blastCaps += CRATE.caps.amount;
    return { kind: 'caps', amount: CRATE.caps.amount };
  }
  if ((r -= CRATE.freeze.weight) < 0) {
    if (save.inventory.freeze >= SHOP.maxFreeze) return money();
    save.inventory.freeze++;
    return { kind: 'freeze' };
  }
  if ((r -= CRATE.boost.weight) < 0) {
    const idle = BOOST_IDS.filter((b) => !save.boosts[b]);
    if (!idle.length) return money();
    const boost = idle[Math.floor(rng() * idle.length)];
    save.boosts[boost] = true;
    return { kind: 'boost', boost };
  }
  if (save.inventory.skip >= SHOP.maxSkip) return money();
  save.inventory.skip++;
  return { kind: 'skip' };
}

export type BuyResult = { ok: true; reward?: CrateReward } | { ok: false; reason: 'funds' | 'owned' | 'max' | 'unavailable' };

/** Validates and applies a purchase on the save object. */
export function buy(save: SaveData, offer: ShopOffer, rng: Rng = Math.random): BuyResult {
  const def = ITEMS[offer.id];
  const inv = save.inventory;
  switch (def.kind) {
    case 'boost':
      if (save.boosts[offer.id as BoostId]) return { ok: false, reason: 'owned' };
      break;
    case 'pack':
      if (inv.blastCaps >= SHOP.maxBlastCaps) return { ok: false, reason: 'max' };
      break;
    case 'stack':
      if (offer.id === 'blastCap' && inv.blastCaps >= SHOP.maxBlastCaps) return { ok: false, reason: 'max' };
      if (offer.id === 'freeze' && inv.freeze >= SHOP.maxFreeze) return { ok: false, reason: 'max' };
      if (offer.id === 'skip' && inv.skip >= SHOP.maxSkip) return { ok: false, reason: 'max' };
      break;
    default:
      break;
  }
  if (save.wallet < offer.price) return { ok: false, reason: 'funds' };

  save.wallet -= offer.price;
  save.hasProgress = true;
  switch (def.kind) {
    case 'boost':
      save.boosts[offer.id as BoostId] = true;
      save.shop?.bought.push(offer.id as BoostId);
      return { ok: true };
    case 'pack':
      inv.blastCaps = Math.min(SHOP.maxBlastCaps, inv.blastCaps + SHOP.blastPackSize);
      return { ok: true };
    case 'crate':
      return { ok: true, reward: openCrate(save, rng) };
    default:
      if (offer.id === 'blastCap') inv.blastCaps++;
      else if (offer.id === 'freeze') inv.freeze++;
      else if (offer.id === 'skip') inv.skip++;
      return { ok: true };
  }
}

export function activeModifiers(save: SaveData): Modifiers {
  return { ...save.boosts };
}

// ---- cosmetics (Workshop > Style) ---------------------------------------------
export function buyCosmetic(save: SaveData, id: string): BuyResult {
  const def = COSMETICS.find((c) => c.id === id);
  if (!def) return { ok: false, reason: 'unavailable' };
  if (save.cosmetics.owned.includes(id)) return { ok: false, reason: 'owned' };
  if (save.wallet < def.price) return { ok: false, reason: 'funds' };
  save.wallet -= def.price;
  save.cosmetics.owned.push(id);
  save.cosmetics.equipped[def.slot] = id;
  save.hasProgress = true;
  return { ok: true };
}

export function equipCosmetic(save: SaveData, id: string): boolean {
  const def = COSMETICS.find((c) => c.id === id);
  if (!def || !save.cosmetics.owned.includes(id)) return false;
  save.cosmetics.equipped[def.slot] = id;
  return true;
}
