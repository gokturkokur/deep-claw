/**
 * Plays every campaign level with a simple "perfect aim" bot on the real Session and prints how much
 * money it earns compared with the target. A human gets roughly 60-80 % of what this bot gets.
 *   npx vite-node tools/bot-report.ts [fromLevel] [toLevel]
 */
import { CLAW, WORLD } from '../src/config/game';
import { LEVELS } from '../src/data/levels';
import { OBJECTS } from '../src/config/economy';
import { makeRng } from '../src/systems/Rng';
import { estimateLevel } from '../src/systems/Balance';
import { Session, type Entity } from '../src/systems/Session';
import { sweep } from '../src/systems/Collision';

const DEG = Math.PI / 180;

function exposed(s: Session, e: Entity): boolean {
  const dx = e.x - WORLD.pivotX;
  const dy = e.y - WORLD.pivotY;
  const d = Math.hypot(dx, dy);
  const ux = dx / d;
  const uy = dy / d;
  const shapes = s.entities.filter((o) => o.alive && !o.hooked && (o.type !== 'beetle' || o === e)).map((o) => o.shape);
  const hit = sweep(shapes, WORLD.pivotX + ux * CLAW.homeLength, WORLD.pivotY + uy * CLAW.homeLength, WORLD.pivotX + ux * CLAW.maxLength, WORLD.pivotY + uy * CLAW.maxLength, s.claw.tipRadius);
  return !!hit && hit.id === e.shape.id;
}

function firstHit(s: Session, t: Entity, removed: Set<number>): Entity | null {
  const dx = t.x - WORLD.pivotX;
  const dy = t.y - WORLD.pivotY;
  const d = Math.hypot(dx, dy);
  const ux = dx / d;
  const uy = dy / d;
  const shapes = s.entities.filter((o) => o.alive && !o.hooked && !removed.has(o.id) && (o.type !== 'beetle' || o === t)).map((o) => o.shape);
  const hit = sweep(shapes, WORLD.pivotX + ux * CLAW.homeLength, WORLD.pivotY + uy * CLAW.homeLength, WORLD.pivotX + ux * CLAW.maxLength, WORLD.pivotY + uy * CLAW.maxLength, s.claw.tipRadius);
  return hit ? s.get(hit.id) ?? null : null;
}

const worth = (e: Entity) => (e.type === 'bag' ? 150 : OBJECTS[e.type].value);
const pullTime = (e: Entity) => {
  const dist = Math.hypot(e.x - WORLD.pivotX, e.y - WORLD.pivotY);
  return dist / CLAW.extendSpeed + dist / (CLAW.baseRetractSpeed / e.weight) + 1.2;
};

/** Best next object to pull: plans through blockers (rocks) like a thoughtful player. */
function choose(s: Session): Entity | null {
  let best = -Infinity;
  let pick: Entity | null = null;
  for (const e of s.entities) {
    if (!e.alive || e.type === 'beetle' || !OBJECTS[e.type].collectible) continue;
    const ang = Math.atan2(e.y - WORLD.pivotY, e.x - WORLD.pivotX) / DEG;
    if (ang < 90 - CLAW.swingAmplitudeDeg + 3 || ang > 90 + CLAW.swingAmplitudeDeg - 3) continue;
    const removed = new Set<number>();
    let value = 0;
    let time = 0;
    let first: Entity | null = null;
    let ok = false;
    for (let guard = 0; guard < 6; guard++) {
      const h = firstHit(s, e, removed);
      if (!h || h.type === 'keg') break;
      if (!first) first = h;
      value += worth(h);
      time += pullTime(h);
      removed.add(h.id);
      if (h === e) {
        ok = true;
        break;
      }
    }
    if (!ok || !first) continue;
    const ratio = value / time;
    if (ratio > best) {
      best = ratio;
      pick = first;
    }
  }
  return pick;
}

function play(levelIndex: number, seed: number): number {
  const level = LEVELS[levelIndex];
  const s = new Session({ level, rng: makeRng(seed) });
  const dt = 1 / 60;
  let target: Entity | null = null;
  let prevDiff = 0;
  for (let i = 0; i < 60 * 80 && s.status === 'playing'; i++) {
    if (s.claw.state === 'swinging') {
      if (!target || !target.alive || target.hooked) target = choose(s);
      if (target) {
        const want = Math.atan2(target.y - WORLD.pivotY, target.x - WORLD.pivotX) / DEG;
        const diff = s.claw.angleDeg - want;
        if (prevDiff !== 0 && diff * prevDiff <= 0 && Math.abs(diff) < 6) {
          s.claw.angleDeg = want;
          s.launch();
        }
        prevDiff = diff;
      } else prevDiff = 0;
    }
    s.update(dt);
  }
  return s.earned;
}

const from = Number(process.argv[2] ?? 1);
const to = Number(process.argv[3] ?? LEVELS.length);
const rows: string[] = [];
for (let i = from - 1; i < to; i++) {
  const runs = [1, 2, 3].map((seed) => play(i, seed));
  const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
  const est = estimateLevel(LEVELS[i]).estimate;
  rows.push(`L${String(i + 1).padStart(3)} est=${String(est).padStart(5)} bot/est=${(avg / est).toFixed(2)} target=${String(LEVELS[i].target).padStart(5)} bot=${String(Math.round(avg)).padStart(5)} ratio=${(avg / LEVELS[i].target).toFixed(2)}`);
}
console.log(rows.join('\n'));
