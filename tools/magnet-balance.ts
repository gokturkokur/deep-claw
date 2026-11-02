// Balance report for the Magnet Test level. Run: npx vite-node tools/magnet-balance.ts
import { MAGNET_ITEMS, MAGNET_LEVEL } from '../src/config/magnet';
import { playCasual, playPerfect, widestWindow, winningAngles } from '../src/systems/MagnetBalance';
import { defaultSettings } from '../src/systems/MagnetSettings';

const L = MAGNET_LEVEL;
const total = L.items.reduce((n, p) => n + MAGNET_ITEMS[p.kind].value, 0);
console.log(`${L.name}: ${L.items.length} items, total ${total} (safe at its average), target ${L.target}`);

for (const mode of ['sweep', 'firstStick'] as const) {
  const set = { ...defaultSettings(), mode };
  console.log(`\n== mode ${mode}`);
  L.items.forEach((p, i) => {
    if (MAGNET_ITEMS[p.kind].value < 300) return;
    const a = winningAngles(L, set, i);
    console.log(`  ${p.kind.padEnd(5)} (${p.x},${p.y}) widest window ${widestWindow(a).toFixed(2)} deg, all angles ${(a.length * 0.25).toFixed(2)} deg`);
  });
  const perfect = playPerfect(L, set);
  console.log(`  perfect player: target at ${perfect.targetAt ?? 'never'} s, ${perfect.earned} by ${perfect.endAt} s, ${perfect.shots.length} dives`);
  for (const s of perfect.shots) console.log(`    t=${s.at.toFixed(1).padStart(4)} angle ${s.angle.toFixed(1).padStart(5)} +${String(s.gain).padStart(3)} ${s.kinds.join(' ')}`);
  for (const roll of ['min', 'max'] as const) {
    const safe = MAGNET_ITEMS.safe.prize![roll];
    const r = playPerfect(L, set, { priceOf: (k) => (k === 'safe' ? safe : MAGNET_ITEMS[k].value) });
    console.log(`  perfect player, safe pays ${safe}: target at ${r.targetAt ?? 'never'} s, ${r.earned} by ${r.endAt} s`);
  }
  const good = Array.from({ length: 20 }, (_, i) => playPerfect(L, set, { lateFrames: 6, seed: 50 + i }));
  const hit = good.filter((r) => r.targetAt !== null);
  const avgGood = good.reduce((a, r) => a + r.earned, 0) / good.length;
  console.log(
    `  good player (perfect choices, taps up to 0.1 s off, 20 runs): average ${Math.round(avgGood)}, reached target ${Math.round((100 * hit.length) / good.length)}%` +
      (hit.length ? `, on average at ${(hit.reduce((a, r) => a + (r.targetAt ?? 0), 0) / hit.length).toFixed(1)} s` : ''),
  );
  const runs = Array.from({ length: 60 }, (_, i) => playCasual(L, set, 1000 + i));
  const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
  console.log(`  casual player (random taps, 60 runs): average ${Math.round(avg)}, reached target ${Math.round((100 * runs.filter((m) => m >= L.target).length) / runs.length)}%`);
}
