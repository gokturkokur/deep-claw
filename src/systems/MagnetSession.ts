/**
 * Magnet prototype rules. Plain TypeScript (no Phaser), so it can be unit tested.
 * Reuses the Claw state machine (swing / launch / retract), the swept collision maths and the
 * keg blast. The magnet never "hooks": items stick to it while the claw keeps launching.
 */
import { CLAW, WORLD, type ClawConfig } from '../config/game';
import { MAGNET, MAGNET_ITEMS, type MagnetItemId, type MagnetLevelDef } from '../config/magnet';
import { Claw, type ClawHost } from './Claw';
import { segmentCircle, segmentRect, sweep, type Shape } from './Collision';
import { chainBlast } from './Explosion';
import type { MagnetSettings } from './MagnetSettings';
import { makeRng, randomSeed, type Rng } from './Rng';

export interface MagnetEntity {
  id: number;
  kind: MagnetItemId;
  metal: boolean;
  explosive: boolean;
  x: number;
  y: number;
  weight: number;
  value: number;
  alive: boolean;
  /** Currently stuck to the magnet. */
  attached: boolean;
  /** How many times it stuck. Must never exceed 1. */
  attachCount: number;
  collected: boolean;
  /** Inside the pull field this frame (for the jitter effect). */
  pulled: boolean;
  /** Distance from the centre to where it touches the magnet. */
  reach: number;
  /** Offset from the magnet face when it stuck, in the rope frame (a along the rope, b across). */
  localA: number;
  localB: number;
  grabX: number;
  grabY: number;
  /** 0..1 settle animation after sticking. */
  blend: number;
  shape: Shape;
}

export type RecallReason = 'first' | 'full' | 'explosion';

export type MagnetEvent =
  | { type: 'launch' }
  | { type: 'attach'; id: number; kind: MagnetItemId; x: number; y: number }
  | { type: 'stuck'; id: number }
  | { type: 'miss' }
  | { type: 'recall'; reason: RecallReason }
  | { type: 'collect'; id: number; kind: MagnetItemId; value: number; x: number; y: number }
  | { type: 'explode'; id: number; x: number; y: number }
  | { type: 'destroyed'; id: number; x: number; y: number }
  | { type: 'timeUp' }
  | { type: 'end'; won: boolean };

export interface MagnetSessionOptions {
  level: MagnetLevelDef;
  /** Shared by reference: the settings panel changes it while the game runs. */
  settings: MagnetSettings;
  rng?: Rng;
}

/** Pull speed in px/s: weaker the further away, slower the heavier. 0 outside the radius. */
export function pullSpeed(dist: number, radius: number, strength: number, weight: number): number {
  if (radius <= 0 || dist >= radius) return 0;
  const f = Math.pow(1 - Math.max(0, dist) / radius, MAGNET.falloffPower);
  return (strength * f) / Math.max(0.1, weight);
}

export class MagnetSession implements ClawHost {
  readonly level: MagnetLevelDef;
  readonly settings: MagnetSettings;
  readonly claw: Claw;
  readonly entities: MagnetEntity[] = [];
  /** Total weight stuck to the magnet right now. */
  load = 0;
  timeLeft: number;
  earned = 0;
  status: 'playing' | 'won' | 'lost' = 'playing';
  /** Set by the scene while the settings panel is open: the clock stops, the world keeps running. */
  timerFrozen = false;
  events: MagnetEvent[] = [];
  elapsed = 0;

  private readonly rng: Rng;
  private readonly clawCfg: ClawConfig;
  private readonly blockers: Shape[] = [];
  private readonly byId = new Map<number, MagnetEntity>();

  constructor(opts: MagnetSessionOptions) {
    this.level = opts.level;
    this.settings = opts.settings;
    this.rng = opts.rng ?? makeRng(randomSeed());
    this.timeLeft = opts.level.durationSec;
    this.clawCfg = { ...CLAW, ...MAGNET.claw, tipRadius: MAGNET.tipRadius, extendSpeed: opts.settings.descentSpeed };
    this.claw = new Claw(WORLD.pivotX, WORLD.pivotY, this.clawCfg);

    let id = 1;
    for (const p of opts.level.items) {
      const def = MAGNET_ITEMS[p.kind];
      const shape: Shape = {
        id,
        kind: def.shape.kind,
        x: p.x,
        y: p.y,
        r: def.shape.kind === 'circle' ? def.shape.r : 0,
        hw: def.shape.kind === 'rect' ? def.shape.hw : 0,
        hh: def.shape.kind === 'rect' ? def.shape.hh : 0,
      };
      const e: MagnetEntity = {
        id,
        kind: p.kind,
        metal: def.metal,
        explosive: !!def.explosive,
        x: p.x,
        y: p.y,
        weight: def.weight,
        value: def.value,
        alive: true,
        attached: false,
        attachCount: 0,
        collected: false,
        pulled: false,
        reach: def.shape.kind === 'circle' ? def.shape.r : (def.shape.hw + def.shape.hh) / 2,
        localA: 0,
        localB: 0,
        grabX: p.x,
        grabY: p.y,
        blend: 1,
        shape,
      };
      this.entities.push(e);
      this.byId.set(id, e);
      id++;
    }
  }

  // ---- ClawHost ----------------------------------------------------------
  /** Only things that stop the magnet are swept here: non-metal and metal that is too heavy to lift. */
  sweep(ax: number, ay: number, bx: number, by: number): { id: number; t: number } | null {
    this.blockers.length = 0;
    for (const e of this.entities) if (e.alive && !e.attached && !this.liftable(e)) this.blockers.push(e.shape);
    return sweep(this.blockers, ax, ay, bx, by, MAGNET.tipRadius);
  }
  weightOf(): number {
    return 1;
  }
  hookable(): boolean {
    return false;
  }
  strength(): number {
    return MAGNET.retractStrength;
  }
  carriedWeight(): number {
    return this.load;
  }
  // -----------------------------------------------------------------------

  get(id: number): MagnetEntity | undefined {
    return this.byId.get(id);
  }

  /** Metal that still fits into the remaining capacity. Everything else is an obstacle. */
  liftable(e: MagnetEntity): boolean {
    return e.metal && e.weight <= this.settings.capacity - this.load + 1e-9;
  }

  isFull(): boolean {
    return this.load > 0 && this.settings.capacity - this.load < MAGNET.minItemWeight - 1e-9;
  }

  /** Metal things that are still down there and worth delivering. */
  collectibleCount(): number {
    let n = 0;
    for (const e of this.entities) if (e.alive && e.metal && !e.explosive) n++;
    return n;
  }

  launch(): boolean {
    if (this.status !== 'playing') return false;
    const ok = this.claw.launch();
    if (ok) this.events.push({ type: 'launch' });
    return ok;
  }

  update(dtRaw: number): void {
    const dt = Math.min(Math.max(dtRaw, 0), CLAW.maxDt);
    if (this.status !== 'playing') return;
    this.elapsed += dt;
    if (!this.timerFrozen && this.timeLeft > 0) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft === 0) this.events.push({ type: 'timeUp' });
    }
    this.clawCfg.extendSpeed = this.settings.descentSpeed;
    for (const e of this.entities) e.pulled = false;

    const wasLaunching = this.claw.state === 'launching';
    const px = this.claw.tipX;
    const py = this.claw.tipY;
    this.claw.update(dt, this, this.level.swingMult);

    let stuck = false;
    for (const ev of this.claw.events) {
      if (ev === 'hit') {
        stuck = true;
        this.events.push({ type: 'stuck', id: this.claw.hitId });
      } else if (ev === 'missed' && !stuck) {
        this.events.push({ type: 'miss' });
      }
    }

    if (wasLaunching) {
      this.attachAlongPath(px, py, this.claw.tipX, this.claw.tipY);
      if (this.claw.state === 'launching') this.pull(dt);
      if (this.claw.state === 'launching' && this.isFull()) this.recall('full');
    }
    for (const ev of this.claw.events) if (ev === 'collected') this.deliver();

    this.placeAttached(dt);
    this.checkEnd();
  }

  /** Swept test of the magnet's path against every liftable item: nothing can be skipped. */
  private attachAlongPath(ax: number, ay: number, bx: number, by: number): void {
    const r = MAGNET.tipRadius;
    for (;;) {
      let best: MagnetEntity | null = null;
      let bestT = Infinity;
      for (const e of this.entities) {
        if (!e.alive || e.attached || !this.liftable(e)) continue;
        const s = e.shape;
        const t = s.kind === 'circle' ? segmentCircle(ax, ay, bx, by, s.x, s.y, s.r + r) : segmentRect(ax, ay, bx, by, s.x, s.y, s.hw + r, s.hh + r);
        if (t >= 0 && t < bestT) {
          bestT = t;
          best = e;
        }
      }
      if (!best) return;
      if (!this.attach(best, ax + (bx - ax) * bestT, ay + (by - ay) * bestT)) return;
    }
  }

  /** Pull field: metal inside the radius slides towards the magnet face. */
  private pull(dt: number): void {
    const R = this.settings.pullRadius;
    const tx = this.claw.tipX;
    const ty = this.claw.tipY;
    for (const e of this.entities) {
      if (this.claw.state !== 'launching') return;
      if (!e.alive || e.attached || !this.liftable(e)) continue;
      const dx = tx - e.x;
      const dy = ty - e.y;
      const d = Math.hypot(dx, dy);
      if (d >= R) continue;
      e.pulled = true;
      const contact = MAGNET.tipRadius + e.reach;
      const room = d - contact;
      const step = pullSpeed(d, R, this.settings.pullStrength, e.weight) * dt;
      if (room <= 0) {
        if (!this.attach(e, tx, ty)) return;
      } else if (room <= step) {
        // Arrives this frame: stop exactly at the face, never overshoot.
        e.x = tx - (dx / d) * contact;
        e.y = ty - (dy / d) * contact;
        e.shape.x = e.x;
        e.shape.y = e.y;
        if (!this.attach(e, tx, ty)) return;
      } else {
        e.x += (dx / d) * step;
        e.y += (dy / d) * step;
        e.shape.x = e.x;
        e.shape.y = e.y;
      }
    }
  }

  /** (cx, cy) is where the magnet face was at the moment of contact. Returns false when the dive ends. */
  private attach(e: MagnetEntity, cx: number, cy: number): boolean {
    if (!e.alive || e.attached || e.attachCount > 0) return true;
    e.attached = true;
    e.attachCount++;
    e.pulled = false;
    e.grabX = e.x;
    e.grabY = e.y;
    e.blend = 0;
    const ox = e.x - cx;
    const oy = e.y - cy;
    e.localA = ox * this.claw.dirX + oy * this.claw.dirY;
    e.localB = -ox * this.claw.dirY + oy * this.claw.dirX;
    this.load += e.weight;
    this.events.push({ type: 'attach', id: e.id, kind: e.kind, x: e.x, y: e.y });

    if (e.explosive) {
      this.explode(e);
      this.recall('explosion');
      return false;
    }
    if (this.settings.mode === 'firstStick') {
      this.recall('first');
      return false;
    }
    if (this.isFull()) {
      this.recall('full');
      return false;
    }
    return true;
  }

  private recall(reason: RecallReason): void {
    if (this.claw.recall()) this.events.push({ type: 'recall', reason });
  }

  /** Old grenade: the keg blast (radius, chain reaction) around the place where it stuck. */
  private explode(first: MagnetEntity): void {
    const pool = MAGNET.blastDestroysCarried ? this.entities : this.entities.filter((o) => !o.attached);
    chainBlast(pool, first, MAGNET.blastRadius, (o) => o.explosive, {
      explode: (g) => this.events.push({ type: 'explode', id: g.id, x: g.x, y: g.y }),
      destroyed: (o) => this.events.push({ type: 'destroyed', id: o.id, x: o.x, y: o.y }),
    });
    let load = 0;
    for (const o of this.entities) {
      if (o.alive && o.attached) load += o.weight;
      else if (!o.alive) o.attached = false;
    }
    this.load = load;
  }

  /** Stuck items follow the magnet face every frame. */
  private placeAttached(dt: number): void {
    const c = this.claw;
    const dx = c.dirX;
    const dy = c.dirY;
    for (const e of this.entities) {
      if (!e.alive || !e.attached) continue;
      e.blend = Math.min(1, e.blend + dt / MAGNET.attachBlendSec);
      const p = 1 - (1 - e.blend) * (1 - e.blend);
      const tx = c.tipX + dx * e.localA - dy * e.localB;
      const ty = c.tipY + dy * e.localA + dx * e.localB;
      e.x = e.grabX + (tx - e.grabX) * p;
      e.y = e.grabY + (ty - e.grabY) * p;
      e.shape.x = e.x;
      e.shape.y = e.y;
    }
  }

  /** The magnet is home: everything stuck to it is delivered, once. */
  private deliver(): void {
    for (const e of this.entities) {
      if (!e.alive || !e.attached || e.collected) continue;
      e.collected = true;
      e.alive = false;
      e.attached = false;
      let value = e.value;
      const prize = MAGNET_ITEMS[e.kind].prize;
      if (prize) {
        const steps = Math.floor((prize.max - prize.min) / prize.step);
        value = prize.min + Math.floor(this.rng() * (steps + 1)) * prize.step;
      }
      this.earned += value;
      this.events.push({ type: 'collect', id: e.id, kind: e.kind, value, x: e.x, y: e.y });
    }
    this.load = 0;
  }

  /** Ends only when the magnet is home: a dive in progress always finishes first. */
  private checkEnd(): void {
    if (this.claw.state !== 'swinging') return;
    if (this.timeLeft > 0 && this.collectibleCount() > 0) return;
    this.status = this.earned >= this.level.target ? 'won' : 'lost';
    this.events.push({ type: 'end', won: this.status === 'won' });
  }
}
