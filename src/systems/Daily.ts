import { DAILY_REWARDS, BOOST_IDS, SHOP, type BoostId, type DailyReward } from '../config/economy';
import { hashSeed } from './Fields';
import type { SaveData } from './Save';

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function canClaimDaily(save: SaveData, today: string): boolean {
  return save.daily.last !== today;
}

/** Streak that a claim made `today` would have (resets after a missed day). */
export function nextStreak(save: SaveData, today: string): number {
  if (!save.daily.last) return 1;
  const gap = dayNumber(today) - dayNumber(save.daily.last);
  return gap === 1 ? save.daily.streak + 1 : 1;
}

export interface DailyResult {
  reward: DailyReward;
  streak: number;
  boost?: BoostId;
}

export function claimDaily(save: SaveData, today: string): DailyResult | null {
  if (!canClaimDaily(save, today)) return null;
  const streak = nextStreak(save, today);
  const reward = DAILY_REWARDS[(streak - 1) % DAILY_REWARDS.length];
  save.daily = { last: today, streak };
  const result: DailyResult = { reward, streak };
  if (reward.kind === 'money') save.wallet += reward.amount;
  else if (reward.kind === 'caps') save.inventory.blastCaps = Math.min(SHOP.maxBlastCaps, save.inventory.blastCaps + reward.amount);
  else {
    const idle = BOOST_IDS.filter((b) => !save.boosts[b]);
    const pool = idle.length ? idle : [...BOOST_IDS];
    const pick = pool[hashSeed(today) % pool.length];
    save.boosts[pick] = true;
    result.boost = pick;
  }
  save.hasProgress = true;
  return result;
}
