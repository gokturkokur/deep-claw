/**
 * One-off helper used while authoring: nudges overlapping objects apart and moves beetle
 * lanes into free bands, then prints the cleaned layouts as TypeScript.
 * Run: npx vite-node tools/relax-levels.ts > /tmp/levels-body.txt
 */
import { OBJECTS, type ObjType } from '../src/config/economy';
import { WORLD } from '../src/config/game';
import { LEVELS, type LevelObject } from '../src/data/levels';

const half = (t: ObjType) => {
  const s = OBJECTS[t].shape;
  return s.kind === 'circle' ? { hw: s.r, hh: s.r } : { hw: s.hw, hh: s.hh };
};
const prio: Record<ObjType, number> = { keg: 0, rockL: 1, rockS: 1, beetle: 9, bag: 2, goldS: 3, goldM: 3, goldL: 4, diamond: 5 };
const GAP = 8;
const short: Record<ObjType, string> = { goldS: 'gS', goldM: 'gM', goldL: 'gL', diamond: 'dm', rockS: 'rS', rockL: 'rL', bag: 'bg', keg: 'kg', beetle: 'bt' };

for (const level of LEVELS) {
  const objs: LevelObject[] = level.objects.map((o) => ({ ...o }));
  const statics = objs.filter((o) => o.type !== 'beetle');
  for (let it = 0; it < 600; it++) {
    let moved = false;
    for (let i = 0; i < statics.length; i++) {
      for (let j = i + 1; j < statics.length; j++) {
        const a = statics[i];
        const b = statics[j];
        const ha = half(a.type);
        const hb = half(b.type);
        const ox = ha.hw + hb.hw + GAP - Math.abs(a.x - b.x);
        const oy = ha.hh + hb.hh + GAP - Math.abs(a.y - b.y);
        if (ox <= 0 || oy <= 0) continue;
        const mover = prio[a.type] <= prio[b.type] ? a : b;
        const stay = mover === a ? b : a;
        const other = mover === a ? b : a;
        void other;
        if (ox < oy) mover.x += (mover.x >= stay.x ? 1 : -1) * (ox + 1);
        else mover.y += (mover.y >= stay.y ? 1 : -1) * (oy + 1);
        moved = true;
      }
    }
    for (const o of statics) {
      const h = half(o.type);
      o.x = Math.min(WORLD.fieldMaxX - h.hw, Math.max(WORLD.fieldMinX + h.hw, o.x));
      o.y = Math.min(WORLD.fieldMaxY - h.hh, Math.max(WORLD.fieldMinY + h.hh, o.y));
    }
    if (!moved) break;
  }
  // beetles: find the nearest y band free of statics
  for (const bt of objs.filter((o) => o.type === 'beetle')) {
    const r = 28 + GAP;
    const free = (y: number) =>
      statics.every((s) => {
        const h = half(s.type);
        return !(y + r > s.y - h.hh && y - r < s.y + h.hh && (bt.laneMinX ?? 0) - r < s.x + h.hw && (bt.laneMaxX ?? 0) + r > s.x - h.hw);
      });
    for (let d = 0; d < 700; d += 5) {
      const y = [bt.y + d, bt.y - d].find((v) => v >= 420 && v <= 1180 && free(v));
      if (y !== undefined) {
        bt.y = y;
        break;
      }
    }
  }
  const fmt = (o: LevelObject) =>
    o.type === 'beetle'
      ? `bt(${Math.round(o.y)}, ${o.laneMinX}, ${o.laneMaxX}, ${o.speed}${o.carriesDiamond ? ', true' : ''})`
      : `${short[o.type]}(${Math.round(o.x)}, ${Math.round(o.y)})`;
  const lines: string[] = [];
  for (let i = 0; i < objs.length; i += 5) lines.push('      ' + objs.slice(i, i + 5).map(fmt).join(', ') + ',');
  console.log(`  {\n    id: ${level.id},\n    name: ${JSON.stringify(level.name)},\n    target: ${level.target},${level.swingMult ? `\n    swingMult: ${level.swingMult},` : ''}\n    objects: [\n${lines.join('\n')}\n    ],\n  },`);
}
