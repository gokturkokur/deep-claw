import { OBJECTS, type ObjType } from '../config/economy';
import { WORLD } from '../config/game';
import type { LevelDef, LevelObject } from '../data/levels';
import { makeRng } from './Rng';

const half = (t: ObjType) => {
  const s = OBJECTS[t].shape;
  return s.kind === 'circle' ? { hw: s.r, hh: s.r } : { hw: s.hw, hh: s.hh };
};

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Procedural treasure field for Endless mode and the Weekly Challenge.
 * Same seed + difficulty = same field. Objects never overlap, stay inside the field
 * and inside the arc the claw can reach. Difficulty adds rocks, kegs, slime, beetles and chests.
 */
export function generateField(seed: number, difficulty: number): LevelObject[] {
  const rng = makeRng(seed);
  const d = Math.max(1, difficulty);
  const plan: ObjType[] = [];
  const add = (t: ObjType, n: number) => {
    for (let i = 0; i < n; i++) plan.push(t);
  };
  // big shapes first so they find room
  add('chest', d >= 6 ? 1 + (d >= 12 ? 1 : 0) : 0);
  add('goldL', 1 + Math.floor(d / 4));
  add('rockL', Math.min(4, Math.floor(d / 2)));
  add('goldM', 3 + Math.floor(d / 3));
  add('bag', 1 + (d >= 5 ? 1 : 0));
  add('keg', d >= 3 ? Math.min(4, 1 + Math.floor((d - 3) / 3)) : 0);
  add('diamond', 1 + Math.floor(d / 3));
  add('rockS', Math.min(5, 1 + Math.floor(d / 2)));
  add('slime', d >= 4 ? Math.min(3, 1 + Math.floor((d - 4) / 4)) : 0);
  add('goldS', 4 + Math.floor(d / 2));

  const placed: LevelObject[] = [];
  const free = (t: ObjType, x: number, y: number, gap = 8): boolean => {
    const a = half(t);
    return placed.every((o) => {
      if (o.type === 'beetle') return true;
      const b = half(o.type);
      return !(Math.abs(x - o.x) < a.hw + b.hw + gap && Math.abs(y - o.y) < a.hh + b.hh + gap);
    });
  };
  for (const t of plan) {
    const h = half(t);
    for (let tries = 0; tries < 80; tries++) {
      const x = Math.round(WORLD.fieldMinX + h.hw + rng() * (WORLD.fieldMaxX - WORLD.fieldMinX - 2 * h.hw));
      const y = Math.round(WORLD.fieldMinY + h.hh + 20 + rng() * (WORLD.fieldMaxY - WORLD.fieldMinY - 2 * h.hh - 20));
      const ang = (Math.atan2(y - WORLD.pivotY, x - WORLD.pivotX) * 180) / Math.PI;
      if (ang < 30 || ang > 150) continue;
      if (!free(t, x, y)) continue;
      placed.push({ type: t, x, y });
      break;
    }
  }
  // beetles walk in free horizontal bands
  const beetles = d >= 5 ? Math.min(3, 1 + Math.floor((d - 5) / 4)) : 0;
  for (let i = 0; i < beetles; i++) {
    for (let tries = 0; tries < 60; tries++) {
      const y = Math.round(430 + rng() * 740);
      const minX = 90 + Math.round(rng() * 80);
      const maxX = 630 - Math.round(rng() * 80);
      const clear = placed.every((o) => {
        if (o.type === 'beetle') return Math.abs(o.y - y) > 80;
        const b = half(o.type);
        return !(Math.abs(y - o.y) < b.hh + 40 && minX - 36 < o.x + b.hw && maxX + 36 > o.x - b.hw);
      });
      if (!clear) continue;
      placed.push({ type: 'beetle', x: minX, y, laneMinX: minX, laneMaxX: maxX, speed: 60 + Math.round(rng() * 40), carriesDiamond: rng() < 0.4 });
      break;
    }
  }
  return placed;
}

/** ISO-like week id (UTC), e.g. "2026-W45". */
export function weekId(date: Date): string {
  const t = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function endlessWave(seed: number, wave: number): LevelObject[] {
  return generateField(seed + wave * 7919, 1 + wave * 1.5);
}

export function weeklyLevel(week: string, target: number): LevelDef {
  return { id: 0, name: `Weekly ${week}`, target, swingMult: 1.1, objects: generateField(hashSeed(week), 8) };
}
