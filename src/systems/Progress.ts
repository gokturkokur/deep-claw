import { LEVELS } from '../data/levels';
import { BOOST_IDS } from '../config/economy';
import { LEVEL_RULES } from '../config/game';
import { starsFor } from './Economy';
import { randomSeed } from './Rng';
import type { SaveData } from './Save';

export interface LevelOutcome {
  levelId: number;
  earned: number;
  target: number;
  won: boolean;
  /** Blast Caps left at the end of the attempt. */
  blastCapsLeft: number;
}

export interface CompletionResult {
  stars: number;
  /** First time this level was cleared: money goes to the wallet and the shop opens. */
  firstClear: boolean;
  newBest: boolean;
  walletGain: number;
}

/**
 * Commit a finished attempt to the save.
 * A lost attempt changes nothing (no earnings, no consumed items): the player just retries.
 * A won attempt: stars/best, wallet (first clear only, so old levels cannot be farmed),
 * Blast Caps used, one-level boosts consumed, next level unlocked, shop opened.
 */
export function commitOutcome(save: SaveData, o: LevelOutcome, seed: number = randomSeed()): CompletionResult | null {
  if (!o.won) return null;
  const key = String(o.levelId);
  const prev = save.levels[key] ?? { stars: 0, best: 0 };
  const stars = starsFor(o.earned, o.target, LEVEL_RULES.starMultipliers);
  const firstClear = prev.stars === 0;
  const newBest = o.earned > prev.best;
  save.levels[key] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, o.earned) };

  save.inventory.blastCaps = o.blastCapsLeft;
  for (const id of BOOST_IDS) save.boosts[id] = false;
  save.hasProgress = true;

  let walletGain = 0;
  if (firstClear) {
    walletGain = o.earned;
    save.wallet += walletGain;
    save.unlockedLevel = Math.min(LEVELS.length, Math.max(save.unlockedLevel, o.levelId + 1));
    save.currentLevel = Math.min(LEVELS.length, o.levelId + 1);
    save.phase = 'shop';
    save.shop = { seed, afterLevel: o.levelId, bought: [] };
  }
  return { stars, firstClear, newBest, walletGain };
}

/** Leaving the shop: next level becomes the current one. */
export function leaveShop(save: SaveData): void {
  save.phase = 'level';
  save.shop = null;
}

export function isFinalLevel(levelId: number): boolean {
  return levelId >= LEVELS.length;
}
