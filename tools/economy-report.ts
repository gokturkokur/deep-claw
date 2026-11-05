/** Rough economy check: expected wallet income per level vs the price of everything permanent. */
import { LEVELS } from '../src/data/levels';
import { CLAW_TYPES, COSMETICS, SHOP, UPGRADES, UPGRADE_IDS } from '../src/config/economy';
import { isBoss, missionFor, worldOf } from '../src/systems/Campaign';
import { upgradeCost } from '../src/systems/Upgrades';

let cum = 0;
const marks = [10, 20, 40, 60, 80, 100];
for (const l of LEVELS) {
  const earned = l.target * 1.3; // a decent player clears with ~30 % to spare
  const income = earned * SHOP.walletShare + missionFor(l).reward * 0.6 + (isBoss(l.id) ? 1500 * worldOf(l.id) : 0);
  cum += income;
  if (marks.includes(l.id)) console.log(`after level ${l.id}: income per level ~${Math.round(income)}, total earned ~${Math.round(cum)}`);
}
const up = UPGRADE_IDS.reduce((a, id) => a + Array.from({ length: UPGRADES[id].max }, (_, i) => upgradeCost(id, i)).reduce((x, y) => x + y, 0), 0);
const claws = Object.values(CLAW_TYPES).reduce((a, c) => a + c.price, 0);
const cos = COSMETICS.reduce((a, c) => a + c.price, 0);
console.log(`permanent sinks: upgrades ${up}, claws ${claws}, cosmetics ${cos}, total ${up + claws + cos}`);
