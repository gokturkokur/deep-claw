import { LEVELS } from '../data/levels';
import { BOOST_IDS } from '../config/economy';
import { LEVEL_RULES } from '../config/game';
import { MAX_SPINS, SHOP, WEEKLY } from '../config/economy';
import { checkAchievements, type AchievementDef } from './Achievements';
import type { RunStats } from './Session';
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
  freezeLeft?: number;
  /** Side mission of the level was completed. */
  missionDone?: boolean;
  missionReward?: number;
  /** Extra money on the first clear (boss reward). */
  extraBonus?: number;
}

export interface CompletionResult {
  stars: number;
  /** First time this level was cleared: money goes to the wallet and the shop opens. */
  firstClear: boolean;
  newBest: boolean;
  walletGain: number;
  missionBonus: number;
  /** A Lucky Wheel token was earned (first 3 star clear). */
  spinEarned: boolean;
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
  const prev = save.levels[key] ?? { stars: 0, best: 0, mission: false };
  const stars = starsFor(o.earned, o.target, LEVEL_RULES.starMultipliers);
  const firstClear = prev.stars === 0;
  const newBest = o.earned > prev.best;
  let missionBonus = 0;
  if (o.missionDone && !prev.mission) missionBonus = o.missionReward ?? 0;
  save.levels[key] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, o.earned), mission: !!prev.mission || !!o.missionDone };
  save.wallet += missionBonus;
  if (stars === 3 && prev.stars < 3) save.spins = Math.min(MAX_SPINS, save.spins + 1);

  save.inventory.blastCaps = o.blastCapsLeft;
  if (o.freezeLeft !== undefined) save.inventory.freeze = o.freezeLeft;
  for (const id of BOOST_IDS) save.boosts[id] = false;
  save.hasProgress = true;

  let walletGain = 0;
  if (firstClear) {
    walletGain = Math.round(o.earned * SHOP.walletShare) + (o.extraBonus ?? 0);
    save.wallet += walletGain;
    save.unlockedLevel = Math.min(LEVELS.length, Math.max(save.unlockedLevel, o.levelId + 1));
    save.currentLevel = Math.min(LEVELS.length, o.levelId + 1);
    save.phase = 'shop';
    save.shop = { seed, afterLevel: o.levelId, bought: [], rerolls: 0 };
    save.stats.levelsWon++;
  }
  return { stars, firstClear, newBest, walletGain, missionBonus, spinEarned: stars === 3 && prev.stars < 3 };
}

/** Skip Ticket: counts as a 1 star clear (no money, no shop) and opens the next level. */
export function skipLevel(save: SaveData, levelId: number): boolean {
  if (save.inventory.skip <= 0) return false;
  save.inventory.skip--;
  const key = String(levelId);
  const prev = save.levels[key] ?? { stars: 0, best: 0, mission: false };
  save.levels[key] = { ...prev, stars: Math.max(prev.stars, 1) };
  save.unlockedLevel = Math.min(LEVELS.length, Math.max(save.unlockedLevel, levelId + 1));
  save.currentLevel = Math.max(save.currentLevel, Math.min(LEVELS.length, levelId + 1));
  save.hasProgress = true;
  return true;
}

/** Leaving the shop: next level becomes the current one. */
export function leaveShop(save: SaveData): void {
  save.phase = 'level';
  save.shop = null;
}

export function isFinalLevel(levelId: number): boolean {
  return levelId >= LEVELS.length;
}

/** Add the counters of one finished run (win or lose) to the lifetime stats. */
export function mergeStats(save: SaveData, run: RunStats, earned: number): void {
  const st = save.stats;
  st.collected += run.collected;
  st.diamonds += run.diamonds;
  st.kegs += run.kegs;
  st.rocks += run.rocks;
  st.blasts += run.blasts;
  st.chests += run.chests;
  st.bestCombo = Math.max(st.bestCombo, run.bestCombo);
  st.totalEarned += earned;
  save.hasProgress = true;
}

export interface EndlessResult {
  newBest: boolean;
  walletGain: number;
  waves: number;
}

/** Endless mode: score is kept as a personal best, 30 % of it goes to the wallet. */
export function commitEndless(save: SaveData, score: number, wavesReached: number): EndlessResult {
  const newBest = score > save.endless.best;
  save.endless.best = Math.max(save.endless.best, score);
  save.endless.bestWaves = Math.max(save.endless.bestWaves, wavesReached);
  save.stats.endlessWaves = Math.max(save.stats.endlessWaves, wavesReached);
  const walletGain = Math.round(score * 0.3);
  save.wallet += walletGain;
  return { newBest, walletGain, waves: wavesReached };
}

export interface WeeklyResult {
  won: boolean;
  newBest: boolean;
  reward: number;
}

/** Weekly challenge: personal best per week, one reward per week for the first win. */
export function commitWeekly(save: SaveData, week: string, earned: number, target: number): WeeklyResult {
  if (save.weekly.week !== week) save.weekly = { week, best: 0, claimed: false };
  const won = earned >= target;
  const newBest = earned > save.weekly.best;
  save.weekly.best = Math.max(save.weekly.best, earned);
  let reward = 0;
  if (won && !save.weekly.claimed) {
    reward = WEEKLY.rewardMoney;
    save.wallet += reward;
    save.weekly.claimed = true;
  }
  return { won, newBest, reward };
}

export { checkAchievements };
export type { AchievementDef };
