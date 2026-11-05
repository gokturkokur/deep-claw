import { describe, expect, it } from 'vitest';
import { OBJECTS } from '../src/config/economy';
import { WORLD } from '../src/config/game';
import { LEVELS } from '../src/data/levels';
import { estimateLevel } from '../src/systems/Balance';

function box(o: { type: keyof typeof OBJECTS; x: number; y: number }) {
  const s = OBJECTS[o.type].shape;
  const hw = s.kind === 'circle' ? s.r : s.hw;
  const hh = s.kind === 'circle' ? s.r : s.hh;
  return { l: o.x - hw, r: o.x + hw, t: o.y - hh, b: o.y + hh };
}

describe('level data', () => {
  it('has at least 20 levels with sequential ids', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(20);
    LEVELS.forEach((l, i) => expect(l.id).toBe(i + 1));
  });

  it.each(LEVELS.map((l) => [l.id, l]))('level %i: objects are inside the field and do not overlap', (_id, level) => {
    const problems: string[] = [];
    level.objects.forEach((o, i) => {
      const b = box(o);
      if (b.l < WORLD.fieldMinX || b.r > WORLD.fieldMaxX || b.t < WORLD.fieldMinY - 40 || b.b > WORLD.fieldMaxY + 30) {
        problems.push(`#${i} ${o.type} (${o.x},${o.y}) out of field`);
      }
      if (o.type === 'beetle') return; // moving: lane checked below
      level.objects.forEach((p, j) => {
        if (j <= i || p.type === 'beetle') return;
        const c = box(p);
        const gap = 4;
        if (b.l < c.r + gap && b.r + gap > c.l && b.t < c.b + gap && b.b + gap > c.t) {
          problems.push(`#${i} ${o.type}(${o.x},${o.y}) overlaps #${j} ${p.type}(${p.x},${p.y})`);
        }
      });
    });
    // beetle lanes must not run through static objects
    level.objects.filter((o) => o.type === 'beetle').forEach((bt, i) => {
      const r = OBJECTS.beetle.shape.kind === 'circle' ? OBJECTS.beetle.shape.r : 0;
      level.objects.forEach((p, j) => {
        if (p.type === 'beetle') return;
        const c = box(p);
        if (bt.y + r > c.t && bt.y - r < c.b && (bt.laneMinX ?? bt.x) - r < c.r && (bt.laneMaxX ?? bt.x) + r > c.l) {
          problems.push(`beetle ${i} lane crosses #${j} ${p.type}(${p.x},${p.y})`);
        }
      });
    });
    expect(problems).toEqual([]);
  });

  it('introduces beetles only from the mid game on', () => {
    const first = LEVELS.find((l) => l.objects.some((o) => o.type === 'beetle'));
    expect(first!.id).toBeGreaterThanOrEqual(6);
  });
});

describe('level balance', () => {
  const reports = LEVELS.map((l) => estimateLevel(l));

  it.each(reports.map((r) => [r.levelId, r]))('level %i target is neither impossible nor trivial', (_id, r) => {
    expect(r.estimate, 'estimate').toBeGreaterThan(0);
    expect(r.ratio).toBeLessThanOrEqual(0.9);
    expect(r.ratio).toBeGreaterThanOrEqual(0.35);
  });

  it('level 1 is easy and late levels are demanding', () => {
    expect(reports[0].ratio).toBeLessThanOrEqual(0.6);
    const early = reports.slice(0, 5).reduce((a, r) => a + r.ratio, 0) / 5;
    const late = reports.slice(-5).reduce((a, r) => a + r.ratio, 0) / 5;
    expect(late).toBeGreaterThan(early + 0.1);
  });

  it('targets never go down', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].target).toBeGreaterThan(LEVELS[i - 1].target);
  });

  it('level 1 is mostly gold', () => {
    const gold = LEVELS[0].objects.filter((o) => o.type.startsWith('gold')).length;
    expect(gold / LEVELS[0].objects.length).toBeGreaterThan(0.6);
  });
});
