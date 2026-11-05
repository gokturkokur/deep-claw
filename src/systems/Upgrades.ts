import { CLAW_TYPES, HELPER, UPGRADES, type ClawId, type UpgradeId } from '../config/economy';
import type { SaveData } from './Save';

export function upgradeCost(id: UpgradeId, level: number): number {
  const u = UPGRADES[id];
  return Math.round((u.base * Math.pow(u.growth, level)) / 50) * 50;
}

export type BuyResult = { ok: true } | { ok: false; reason: 'funds' | 'max' | 'owned' };

export function buyUpgrade(save: SaveData, id: UpgradeId): BuyResult {
  const lvl = save.upgrades[id];
  if (lvl >= UPGRADES[id].max) return { ok: false, reason: 'max' };
  const cost = upgradeCost(id, lvl);
  if (save.wallet < cost) return { ok: false, reason: 'funds' };
  save.wallet -= cost;
  save.upgrades[id] = lvl + 1;
  save.hasProgress = true;
  return { ok: true };
}

export function buyClaw(save: SaveData, id: ClawId): BuyResult {
  if (save.claws.owned.includes(id)) return { ok: false, reason: 'owned' };
  const price = CLAW_TYPES[id].price;
  if (save.wallet < price) return { ok: false, reason: 'funds' };
  save.wallet -= price;
  save.claws.owned.push(id);
  save.claws.equipped = id;
  save.hasProgress = true;
  return { ok: true };
}

export function equipClaw(save: SaveData, id: ClawId): boolean {
  if (!save.claws.owned.includes(id)) return false;
  save.claws.equipped = id;
  return true;
}

export function buyHelper(save: SaveData): BuyResult {
  if (save.helper) return { ok: false, reason: 'owned' };
  if (save.wallet < HELPER.price) return { ok: false, reason: 'funds' };
  save.wallet -= HELPER.price;
  save.helper = true;
  save.hasProgress = true;
  return { ok: true };
}
