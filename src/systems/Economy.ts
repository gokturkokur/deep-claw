import { BAG, BEETLE_DIAMOND_VALUE, EFFECTS, OBJECTS, type ObjType } from '../config/economy';
import type { Rng } from './Rng';

/** One-level modifiers coming from shop items. */
export interface Modifiers {
  turbo: boolean;
  lantern: boolean;
  gemLens: boolean;
  crusher: boolean;
  hourglass: boolean;
  goldRush: boolean;
  extraMiner: boolean;
}

export const NO_MODIFIERS: Modifiers = { turbo: false, lantern: false, gemLens: false, crusher: false, hourglass: false, goldRush: false, extraMiner: false };

/** Money paid when a plain (non bag) object reaches the surface. */
export function collectValue(type: ObjType, mods: Modifiers, carriesDiamond = false): number {
  const def = OBJECTS[type];
  switch (type) {
    case 'diamond':
      return Math.round(def.value * (mods.gemLens ? EFFECTS.gemLensMult : 1));
    case 'rockS':
    case 'rockL':
      return Math.round(def.value * (mods.crusher ? EFFECTS.crusherMult : 1));
    case 'beetle': {
      if (!carriesDiamond) return def.value;
      const gem = BEETLE_DIAMOND_VALUE - def.value;
      return def.value + Math.round(gem * (mods.gemLens ? EFFECTS.gemLensMult : 1));
    }
    case 'bag':
    case 'keg':
      return 0;
    case 'slime':
    case 'chest':
      return def.value;
    default:
      return Math.round(def.value * (mods.goldRush ? EFFECTS.goldRushMult : 1));
  }
}

/** Pull strength multiplier from modifiers (bag strength boost is added by the session). */
export function baseStrength(mods: Modifiers): number {
  return mods.turbo ? EFFECTS.turboStrength : 1;
}

export type BagOutcome =
  | { kind: 'money'; amount: number }
  | { kind: 'item'; blastCaps: number }
  | { kind: 'strength'; mult: number };

export function bagOdds(mods: Modifiers) {
  return mods.lantern ? BAG.odds.lantern : BAG.odds.base;
}

export function bagMoneyRange(mods: Modifiers): [number, number] {
  return mods.lantern ? BAG.money.lantern : BAG.money.base;
}

export function rollBag(rng: Rng, mods: Modifiers): BagOutcome {
  const odds = bagOdds(mods);
  const r = rng();
  if (r < odds.money) {
    const [lo, hi] = bagMoneyRange(mods);
    const amount = Math.round((lo + (hi - lo) * rng()) / 10) * 10;
    return { kind: 'money', amount };
  }
  if (r < odds.money + odds.item) return { kind: 'item', blastCaps: BAG.freeBlastCaps };
  return { kind: 'strength', mult: BAG.strengthBoost };
}

/** Expected value of a bag, used by the balance estimator. */
export function bagExpectedValue(mods: Modifiers): number {
  const odds = bagOdds(mods);
  const [lo, hi] = bagMoneyRange(mods);
  return odds.money * ((lo + hi) / 2) + odds.item * BAG.itemNotionalValue;
}

export function starsFor(earned: number, target: number, multipliers: readonly number[]): number {
  let stars = 0;
  for (let i = 0; i < multipliers.length; i++) {
    if (earned >= Math.ceil(target * multipliers[i])) stars = i + 1;
  }
  return stars;
}
