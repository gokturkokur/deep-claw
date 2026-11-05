import { BOOST_IDS, SHOP, WHEEL, type BoostId, type WheelPrize } from '../config/economy';
import type { Rng } from './Rng';
import type { SaveData } from './Save';

export interface SpinResult {
  index: number;
  prize: WheelPrize;
  boost?: BoostId;
  /** True when the prize could not be given as is and turned into money. */
  converted?: number;
}

/** Spends one token and applies the prize. Full inventories turn the prize into money. */
export function spinWheel(save: SaveData, rng: Rng): SpinResult | null {
  if (save.spins <= 0) return null;
  save.spins--;
  const total = WHEEL.reduce((a, w) => a + w.weight, 0);
  let r = rng() * total;
  let index = 0;
  for (let i = 0; i < WHEEL.length; i++) {
    r -= WHEEL[i].weight;
    if (r < 0) {
      index = i;
      break;
    }
  }
  const prize = WHEEL[index].prize;
  const result: SpinResult = { index, prize };
  const toMoney = (n: number) => {
    save.wallet += n;
    result.converted = n;
  };
  switch (prize.kind) {
    case 'money':
      save.wallet += prize.amount;
      break;
    case 'caps':
      if (save.inventory.blastCaps >= SHOP.maxBlastCaps) toMoney(600);
      else save.inventory.blastCaps = Math.min(SHOP.maxBlastCaps, save.inventory.blastCaps + prize.amount);
      break;
    case 'freeze':
      if (save.inventory.freeze >= SHOP.maxFreeze) toMoney(500);
      else save.inventory.freeze++;
      break;
    case 'skip':
      if (save.inventory.skip >= SHOP.maxSkip) toMoney(2500);
      else save.inventory.skip++;
      break;
    case 'boost': {
      const idle = BOOST_IDS.filter((b) => !save.boosts[b]);
      if (!idle.length) toMoney(1000);
      else {
        const pick = idle[Math.floor(rng() * idle.length)];
        save.boosts[pick] = true;
        result.boost = pick;
      }
      break;
    }
  }
  save.hasProgress = true;
  return result;
}
