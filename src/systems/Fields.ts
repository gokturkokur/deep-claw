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

/**
 * Campaign layout generator (levels 21+). Same seed + difficulty = same level.
 * Scatters treasure and hazards (with sensible caps so the field stays readable), then hides
 * valuables behind rocks and powder kegs placed on the line between the winch and the treasure.
 * The result is baked into src/data/generatedLevels.ts by tools/build-levels.ts.
 */
export function buildLevelObjects(seed: number, d: number): LevelObject[] {
  const rng = makeRng(seed);
  const cap = (n: number, max: number) => Math.min(max, Math.max(0, Math.floor(n)));
  const plan: ObjType[] = [];
  const add = (t: ObjType, n: number) => {
    for (let i = 0; i < n; i++) plan.push(t);
  };
  add('chest', d >= 6 ? cap(1 + (d - 6) / 7, 3) : 0);
  add('goldL', cap(1 + d / 6, 4));
  add('rockL', cap(1 + d / 6, 4));
  add('goldM', cap(3 + d / 4, 8));
  add('bag', cap(1 + d / 9, 3));
  add('keg', cap(1 + d / 6, 4));
  add('diamond', cap(1 + d / 5, 6));
  add('rockS', cap(1 + d / 7, 4));
  add('slime', d >= 4 ? cap(1 + (d - 4) / 5, 4) : 0);
  add('goldS', cap(4 + d / 3, 9));

  const placed: LevelObject[] = [];
  const free = (t: ObjType, x: number, y: number, gap = 8): boolean => {
    const a = half(t);
    if (x - a.hw < WORLD.fieldMinX || x + a.hw > WORLD.fieldMaxX || y - a.hh < WORLD.fieldMinY || y + a.hh > WORLD.fieldMaxY) return false;
    return placed.every((o) => {
      if (o.type === 'beetle') return !(Math.abs(y - o.y) < a.hh + 36 && x - a.hw < o.laneMaxX! + 36 && x + a.hw > o.laneMinX! - 36);
      const b = half(o.type);
      return !(Math.abs(x - o.x) < a.hw + b.hw + gap && Math.abs(y - o.y) < a.hh + b.hh + gap);
    });
  };
  const reachable = (x: number, y: number): boolean => {
    const ang = (Math.atan2(y - WORLD.pivotY, x - WORLD.pivotX) * 180) / Math.PI;
    return ang >= 30 && ang <= 150;
  };
  // beetle lanes are laid out first; everything else keeps out of their bands
  const beetles = d >= 5 ? cap(1 + (d - 5) / 7, 3) : 0;
  for (let i = 0; i < beetles; i++) {
    for (let tries = 0; tries < 300; tries++) {
      const y = Math.round(440 + rng() * 740);
      const width = 170 + Math.round(rng() * 200);
      const minX = Math.round(90 + rng() * (540 - width));
      const maxX = minX + width;
      if (!placed.every((o) => Math.abs(o.y - y) > 110 || o.laneMaxX! < minX - 20 || o.laneMinX! > maxX + 20)) continue;
      placed.push({ type: 'beetle', x: minX, y, laneMinX: minX, laneMaxX: maxX, speed: 60 + Math.round(rng() * 45), carriesDiamond: rng() < 0.35 });
      break;
    }
  }
  for (const t of plan) {
    const h = half(t);
    for (let tries = 0; tries < 120; tries++) {
      const x = Math.round(WORLD.fieldMinX + h.hw + rng() * (WORLD.fieldMaxX - WORLD.fieldMinX - 2 * h.hw));
      const y = Math.round(WORLD.fieldMinY + h.hh + rng() * (WORLD.fieldMaxY - WORLD.fieldMinY - 2 * h.hh));
      if (!reachable(x, y) || !free(t, x, y)) continue;
      placed.push({ type: t, x, y });
      break;
    }
  }
  // shields: rocks / kegs on the ray to valuable treasure
  const valuables = placed.filter((o) => o.type === 'diamond' || o.type === 'chest' || o.type === 'goldL');
  let shields = cap(d / 3, 6);
  for (const v of valuables) {
    if (shields <= 0) break;
    if (rng() > 0.8) continue;
    const f = 0.5 + rng() * 0.28;
    const x = Math.round(WORLD.pivotX + (v.x - WORLD.pivotX) * f);
    const y = Math.round(WORLD.pivotY + (v.y - WORLD.pivotY) * f);
    const t: ObjType = d >= 8 && rng() < 0.3 ? 'keg' : rng() < 0.6 ? 'rockL' : 'rockS';
    if (y > WORLD.fieldMinY + 20 && reachable(x, y) && free(t, x, y, 6)) {
      placed.push({ type: t, x, y });
      shields--;
    }
  }
  return placed;
}
