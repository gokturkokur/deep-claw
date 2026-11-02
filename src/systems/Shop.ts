import { BOOST_IDS, ITEMS, SHOP, type BoostId, type ItemId } from '../config/economy';
import { makeRng } from './Rng';
import type { SaveData } from './Save';
import type { Modifiers } from './Economy';

export interface ShopOffer {
  id: ItemId;
  price: number;
}

const round10 = (n: number): number => Math.round(n / 10) * 10;

export function blastCapPrice(afterLevel: number): number {
  const def = ITEMS.blastCap;
  return Math.min(def.priceMax, def.priceMin + SHOP.blastCapStep * Math.max(0, afterLevel - 1));
}

/**
 * Stock for one shop visit. Blast Cap is always there; boosts appear at random
 * (SHOP.boostSlots of the 4), at a random price inside their range. Same seed = same shop.
 */
export function rollShop(seed: number, afterLevel: number): ShopOffer[] {
  const rng = makeRng(seed);
  const pool: BoostId[] = [...BOOST_IDS];
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, SHOP.boostSlots);
  const offers: ShopOffer[] = [{ id: 'blastCap', price: blastCapPrice(afterLevel) }];
  for (const id of BOOST_IDS) {
    if (!picked.includes(id)) continue;
    const def = ITEMS[id];
    offers.push({ id, price: round10(def.priceMin + (def.priceMax - def.priceMin) * rng()) });
  }
  return offers;
}

export type BuyResult = { ok: true } | { ok: false; reason: 'funds' | 'owned' | 'max' | 'unavailable' };

/** Validates and applies a purchase on the save object. */
export function buy(save: SaveData, offer: ShopOffer): BuyResult {
  const def = ITEMS[offer.id];
  if (def.kind === 'stack') {
    if (save.inventory.blastCaps >= SHOP.maxBlastCaps) return { ok: false, reason: 'max' };
  } else if (save.boosts[offer.id as BoostId]) {
    return { ok: false, reason: 'owned' };
  }
  if (save.wallet < offer.price) return { ok: false, reason: 'funds' };

  save.wallet -= offer.price;
  if (def.kind === 'stack') save.inventory.blastCaps += 1;
  else {
    save.boosts[offer.id as BoostId] = true;
    save.shop?.bought.push(offer.id as BoostId);
  }
  return { ok: true };
}

export function activeModifiers(save: SaveData): Modifiers {
  return { ...save.boosts };
}
