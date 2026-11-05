import { UPGRADE_IDS, UPGRADES } from '../config/economy';
import type { SaveData } from './Save';

export interface AchievementDef {
  id: string;
  reward: number;
  test: (s: SaveData) => boolean;
  /** Progress shown in the list: [current, goal]. */
  progress: (s: SaveData) => [number, number];
}

const stat = (key: keyof SaveData['stats'], goal: number, reward: number, id: string): AchievementDef => ({
  id,
  reward,
  test: (s) => s.stats[key] >= goal,
  progress: (s) => [Math.min(goal, s.stats[key]), goal],
});

export const ACHIEVEMENTS: AchievementDef[] = [
  stat('collected', 1, 100, 'firstFind'),
  stat('collected', 100, 600, 'collector'),
  stat('collected', 500, 1500, 'hoarder'),
  stat('diamonds', 10, 700, 'gemHunter'),
  stat('diamonds', 50, 2000, 'gemKing'),
  stat('kegs', 5, 500, 'demolition'),
  stat('rocks', 20, 300, 'rockLover'),
  stat('blasts', 10, 800, 'blaster'),
  stat('chests', 3, 1200, 'chestFinder'),
  stat('bestCombo', 5, 500, 'combo5'),
  stat('bestCombo', 10, 1500, 'combo10'),
  stat('levelsWon', 5, 600, 'miner5'),
  stat('levelsWon', 20, 3000, 'miner20'),
  stat('totalEarned', 50000, 2500, 'tycoon'),
  stat('endlessWaves', 5, 1000, 'endless5'),
  {
    id: 'upgraded',
    reward: 2000,
    test: (s) => UPGRADE_IDS.some((u) => s.upgrades[u] >= UPGRADES[u].max),
    progress: (s) => [Math.max(...UPGRADE_IDS.map((u) => s.upgrades[u])), 5],
  },
];

/** Unlock everything that is newly reached, pay the rewards, return the new ones. */
export function checkAchievements(save: SaveData): AchievementDef[] {
  const fresh: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (save.achievements.includes(a.id) || !a.test(save)) continue;
    save.achievements.push(a.id);
    save.wallet += a.reward;
    fresh.push(a);
  }
  return fresh;
}
