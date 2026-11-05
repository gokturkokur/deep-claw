import { MAX_SPINS } from '../config/economy';
import type { SaveData } from './Save';

/**
 * Easter egg: the shooting star on the main menu. The first wish of the day gives
 * one Lucky Wheel spin (up to the usual cap); later wishes that day give nothing.
 */
export function wishOnStar(save: SaveData, today: string): 'spin' | 'already' {
  if (!save.eggs.found.includes('star')) save.eggs.found.push('star');
  if (save.eggs.starDay === today) return 'already';
  save.eggs.starDay = today;
  save.spins = Math.min(MAX_SPINS, save.spins + 1);
  return 'spin';
}
