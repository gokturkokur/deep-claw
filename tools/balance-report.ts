import { LEVELS } from '../src/data/levels';
import { estimateLevel } from '../src/systems/Balance';

for (const l of LEVELS) {
  const r = estimateLevel(l);
  console.log(
    `L${String(l.id).padStart(2)} ${l.name.padEnd(18)} objs=${String(l.objects.length).padStart(2)} total=${String(r.totalValue).padStart(5)} est=${String(r.estimate).padStart(5)} pulls=${String(r.pulls).padStart(2)} target=${String(l.target).padStart(5)} ratio=${r.ratio.toFixed(2)}`,
  );
}
