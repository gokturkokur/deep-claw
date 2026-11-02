import { CLAW, KEG, LEVEL_RULES, WORLD } from '../config/game';
import { OBJECTS, type ObjType } from '../config/economy';
import type { LevelDef } from '../data/levels';
import { sweep, type Shape } from './Collision';
import { bagExpectedValue, collectValue, NO_MODIFIERS, baseStrength, type Modifiers } from './Economy';

/**
 * Level balance estimator (no Phaser). It plays the level like a decent player:
 * repeatedly aim at the object with the best money-per-second, pulling away whatever is in
 * the way first (rocks), exploding kegs that are in the way, and respecting the swing arc.
 */

interface Sim {
  id: number;
  type: ObjType;
  x: number;
  y: number;
  alive: boolean;
  shape: Shape;
  value: number;
  weight: number;
}

export interface BalanceReport {
  levelId: number;
  /** Money a decent player can get in the time limit. */
  estimate: number;
  /** All the money that exists in the level (expected values). */
  totalValue: number;
  pulls: number;
  target: number;
  /** target / estimate */
  ratio: number;
}

const DEG = Math.PI / 180;
/** Seconds lost per pull to aiming (waiting for the swing), on top of the pauses. */
export const AIM_OVERHEAD_SEC = 1.3;

function valueOf(type: ObjType, mods: Modifiers, carries: boolean): number {
  if (type === 'bag') return bagExpectedValue(mods);
  return collectValue(type, mods, carries);
}

function build(level: LevelDef, mods: Modifiers): Sim[] {
  return level.objects.map((o, i) => {
    const def = OBJECTS[o.type];
    const x = o.type === 'beetle' ? ((o.laneMinX ?? o.x) + (o.laneMaxX ?? o.x)) / 2 : o.x;
    return {
      id: i + 1,
      type: o.type,
      x,
      y: o.y,
      alive: true,
      value: valueOf(o.type, mods, !!o.carriesDiamond),
      weight: def.weightRange ? (def.weightRange[0] + def.weightRange[1]) / 2 : def.weight,
      shape: {
        id: i + 1,
        kind: def.shape.kind,
        x,
        y: o.y,
        r: def.shape.kind === 'circle' ? def.shape.r : 0,
        hw: def.shape.kind === 'rect' ? def.shape.hw : 0,
        hh: def.shape.kind === 'rect' ? def.shape.hh : 0,
      },
    };
  });
}

/** Can the swinging claw point at this object at all? */
function reachable(s: Sim): boolean {
  const dx = s.x - WORLD.pivotX;
  const dy = s.y - WORLD.pivotY;
  const ang = Math.atan2(dy, dx) / DEG;
  const lim = CLAW.swingAmplitudeDeg - 2;
  return ang >= 90 - lim && ang <= 90 + lim && Math.hypot(dx, dy) < CLAW.maxLength - 40;
}

const PAUSES = CLAW.hookPauseSec + CLAW.collectPauseSec + AIM_OVERHEAD_SEC;

/** Simulates aiming at `target` on a copy of the field. Returns null if the target gets blown up. */
function aim(all: Sim[], target: Sim, strength: number): { time: number; value: number; removed: Sim[]; pulls: number } | null {
  const dx = target.x - WORLD.pivotX;
  const dy = target.y - WORLD.pivotY;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist;
  const uy = dy / dist;
  const ax = WORLD.pivotX + ux * CLAW.homeLength;
  const ay = WORLD.pivotY + uy * CLAW.homeLength;
  const bx = WORLD.pivotX + ux * CLAW.maxLength;
  const by = WORLD.pivotY + uy * CLAW.maxLength;

  const alive = new Set(all.filter((s) => s.alive).map((s) => s.id));
  const removed: Sim[] = [];
  let time = 0;
  let value = 0;
  let pulls = 0;

  for (let guard = 0; guard < 40; guard++) {
    const shapes: Shape[] = [];
    for (const s of all) {
      if (!alive.has(s.id)) continue;
      if (s.type === 'beetle' && s !== target) continue; // moving: never blocks
      shapes.push(s.shape);
    }
    const hit = sweep(shapes, ax, ay, bx, by, CLAW.tipRadius);
    if (!hit) return null;
    const h = all.find((s) => s.id === hit.id) as Sim;
    const len = CLAW.homeLength + hit.t * (CLAW.maxLength - CLAW.homeLength);
    const out = (len - CLAW.homeLength) / CLAW.extendSpeed;
    pulls++;
    if (h.type === 'keg') {
      time += out + (len - CLAW.homeLength) / CLAW.emptyRetractSpeed + PAUSES;
      const queue: Sim[] = [h];
      alive.delete(h.id);
      removed.push(h);
      while (queue.length) {
        const k = queue.shift() as Sim;
        for (const o of all) {
          if (!alive.has(o.id)) continue;
          if (Math.hypot(o.x - k.x, o.y - k.y) > KEG.blastRadius) continue;
          alive.delete(o.id);
          removed.push(o);
          if (o.type === 'keg') queue.push(o);
          if (o === target) return null;
        }
      }
    } else {
      const back = (len - CLAW.homeLength) / Math.max(CLAW.minRetractSpeed, (CLAW.baseRetractSpeed * strength) / h.weight);
      time += out + back + PAUSES;
      value += h.value;
      alive.delete(h.id);
      removed.push(h);
      if (h === target) return { time, value, removed, pulls };
    }
  }
  return null;
}

export function estimateLevel(level: LevelDef, mods: Modifiers = NO_MODIFIERS, durationSec: number = LEVEL_RULES.durationSec): BalanceReport {
  const sims = build(level, mods);
  const strength = baseStrength(mods);
  let elapsed = 0;
  let money = 0;
  let pulls = 0;
  const totalValue = sims.reduce((a, s) => a + (OBJECTS[s.type].collectible ? s.value : 0), 0);

  while (elapsed < durationSec) {
    let best: { time: number; value: number; removed: Sim[]; pulls: number } | null = null;
    let bestRatio = -1;
    for (const s of sims) {
      if (!s.alive || !OBJECTS[s.type].collectible || !reachable(s)) continue;
      const r = aim(sims, s, strength);
      if (!r) continue;
      const ratio = r.value / r.time;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = r;
      }
    }
    if (!best) break;
    // A bundle may span several pulls; the player re-decides after each, but committing the
    // bundle is a fair approximation. Stop adding once the clock has run out.
    elapsed += best.time;
    money += best.value;
    pulls += best.pulls;
    for (const s of best.removed) s.alive = false;
  }

  return {
    levelId: level.id,
    estimate: Math.round(money),
    totalValue: Math.round(totalValue),
    pulls,
    target: level.target,
    ratio: money > 0 ? level.target / money : Infinity,
  };
}

