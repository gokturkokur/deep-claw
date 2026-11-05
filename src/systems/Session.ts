import { BEETLE, KEG, LEVEL_RULES, CLAW, WORLD } from '../config/game';
import { COMBO, CLAW_TYPES, ENDLESS, EFFECTS, FREEZE_SEC, UPGRADES, type ClawId, type UpgradeId } from '../config/economy';
import { endlessWave } from './Fields';
import { TWIST, twistFor } from './Campaign';
import { BEETLE_DIAMOND_VALUE, BAG, OBJECTS, SHOP, type ObjType } from '../config/economy';
import type { LevelDef } from '../data/levels';
import { Claw, type ClawHost } from './Claw';
import { sweep, type Shape } from './Collision';
import { baseStrength, collectValue, rollBag, starsFor, NO_MODIFIERS, type BagOutcome, type Modifiers } from './Economy';
import { makeRng, randomSeed, type Rng } from './Rng';

export interface Entity {
  id: number;
  type: ObjType;
  x: number;
  y: number;
  weight: number;
  alive: boolean;
  /** Currently carried by the claw. */
  hooked: boolean;
  carriesDiamond: boolean;
  laneMinX: number;
  laneMaxX: number;
  vx: number;
  /** Where the object was when it was hooked (for the smooth grab). */
  grabX: number;
  grabY: number;
  shape: Shape;
}

export type SessionEvent =
  | { type: 'launch' }
  | { type: 'hit'; id: number }
  | { type: 'miss' }
  | { type: 'collect'; id: number; kind: ObjType; value: number; x: number; y: number; bag?: BagOutcome; combo: number; mult: number }
  | { type: 'wave'; wave: number }
  | { type: 'freeze'; seconds: number }
  | { type: 'explode'; id: number; x: number; y: number }
  | { type: 'destroyed'; id: number; x: number; y: number }
  | { type: 'blast'; id: number; x: number; y: number }
  | { type: 'timeUp' }
  | { type: 'end'; won: boolean };

export interface SessionOptions {
  level: LevelDef;
  modifiers?: Modifiers;
  blastCaps?: number;
  rng?: Rng;
  durationSec?: number;
  upgrades?: Record<UpgradeId, number>;
  clawType?: ClawId;
  /** Endless mode: waves of generated fields, no target. */
  endlessSeed?: number;
  freezeCount?: number;
}

export interface RunStats {
  slimes: number;
  beetles: number;
  collected: number;
  diamonds: number;
  kegs: number;
  rocks: number;
  blasts: number;
  chests: number;
  bestCombo: number;
}

export class Session implements ClawHost {
  readonly level: LevelDef;
  readonly mods: Modifiers;
  readonly claw: Claw;
  readonly entities: Entity[] = [];
  /** Alive, non-carried shapes the claw can hit. Rebuilt only when the set changes. */
  private shapes: Shape[] = [];
  private shapesDirty = true;
  private byId = new Map<number, Entity>();
  private readonly rng: Rng;

  timeLeft: number;
  earned = 0;
  blastCaps: number;
  /** Extra pull strength from a Mystery Bag (rest of the level). */
  bagStrength = 1;
  status: 'playing' | 'won' | 'lost' = 'playing';
  events: SessionEvent[] = [];
  elapsed = 0;
  private helperTimer = 0;
  combo = 0;
  wave = 1;
  /** Boss twist: the swing is currently fast. */
  rushing = false;
  freezeCount: number;
  /** Seconds of Time Freeze left. */
  freezeLeft = 0;
  readonly endlessSeed: number | null;
  readonly stats: RunStats = { slimes: 0, beetles: 0, collected: 0, diamonds: 0, kegs: 0, rocks: 0, blasts: 0, chests: 0, bestCombo: 0 };
  private readonly upg: Record<UpgradeId, number>;
  private readonly clawType: ClawId;

  constructor(opts: SessionOptions) {
    this.level = opts.level;
    this.mods = opts.modifiers ?? NO_MODIFIERS;
    this.blastCaps = opts.blastCaps ?? 0;
    this.freezeCount = opts.freezeCount ?? 0;
    this.rng = opts.rng ?? makeRng(randomSeed());
    this.upg = opts.upgrades ?? { winch: 0, muscle: 0, watch: 0, fortune: 0 };
    this.clawType = opts.clawType ?? 'standard';
    this.endlessSeed = opts.endlessSeed ?? null;
    const base = opts.durationSec ?? (this.endlessSeed !== null ? ENDLESS.startSec : LEVEL_RULES.durationSec);
    this.timeLeft = base + (this.mods.hourglass ? EFFECTS.hourglassSec : 0) + this.upg.watch * UPGRADES.watch.perLevel;
    this.helperTimer = EFFECTS.helperIntervalSec;
    this.claw = new Claw(WORLD.pivotX, WORLD.pivotY);
    const ct = CLAW_TYPES[this.clawType];
    this.claw.tipRadius = ct.tipRadius + (this.mods.magnet ? EFFECTS.magnetRadius : 0);
    this.claw.extendMult = ct.extendMult * (1 + this.upg.winch * UPGRADES.winch.perLevel);

    this.loadObjects(this.endlessSeed !== null ? endlessWave(this.endlessSeed, 1) : opts.level.objects);
  }

  /** Replace the field (used at start and for each Endless wave). */
  private loadObjects(objects: LevelDef['objects']): void {
    this.entities.length = 0;
    this.byId.clear();
    let id = 1;
    for (const o of objects) {
      const def = OBJECTS[o.type];
      const weight = def.weightRange ? def.weightRange[0] + (def.weightRange[1] - def.weightRange[0]) * this.rng() : def.weight;
      const e: Entity = {
        id: id++,
        type: o.type,
        x: o.x,
        y: o.y,
        weight,
        alive: true,
        hooked: false,
        carriesDiamond: !!o.carriesDiamond,
        laneMinX: o.laneMinX ?? o.x,
        laneMaxX: o.laneMaxX ?? o.x,
        vx: 0,
        grabX: o.x,
        grabY: o.y,
        shape: {
          id: id - 1,
          kind: def.shape.kind,
          x: o.x,
          y: o.y,
          r: def.shape.kind === 'circle' ? def.shape.r : 0,
          hw: def.shape.kind === 'rect' ? def.shape.hw : 0,
          hh: def.shape.kind === 'rect' ? def.shape.hh : 0,
        },
      };
      if (o.type === 'beetle') {
        const sp = o.speed ?? BEETLE.speedMin + (BEETLE.speedMax - BEETLE.speedMin) * this.rng();
        e.vx = this.rng() < 0.5 ? sp : -sp;
      }
      this.entities.push(e);
      this.byId.set(e.id, e);
    }
    this.shapesDirty = true;
  }

  // ---- ClawHost ----------------------------------------------------------
  sweep(ax: number, ay: number, bx: number, by: number): { id: number; t: number } | null {
    if (this.shapesDirty) this.rebuildShapes();
    return sweep(this.shapes, ax, ay, bx, by, this.claw.tipRadius);
  }
  weightOf(id: number): number {
    const e = this.byId.get(id);
    if (e?.type === 'keg') return EFFECTS.defusedKegWeight;
    return e?.weight ?? 1;
  }
  hookable(id: number): boolean {
    const e = this.byId.get(id);
    if (!e) return false;
    return OBJECTS[e.type].collectible || (e.type === 'keg' && this.mods.defuser);
  }
  strength(): number {
    return baseStrength(this.mods) * this.bagStrength * (1 + this.upg.muscle * UPGRADES.muscle.perLevel) * CLAW_TYPES[this.clawType].strengthMult;
  }
  // -----------------------------------------------------------------------

  get(id: number): Entity | undefined {
    return this.byId.get(id);
  }

  private rebuildShapes(): void {
    this.shapes.length = 0;
    for (const e of this.entities) if (e.alive && !e.hooked) this.shapes.push(e.shape);
    this.shapesDirty = false;
  }

  /** Objects the player can still pull up (kegs do not count). */
  collectibleCount(): number {
    let n = 0;
    for (const e of this.entities) if (e.alive && OBJECTS[e.type].collectible) n++;
    return n;
  }

  /** Position of the carried object relative to the jaw tip (smooth grab, then hanging). */
  private placeHooked(e: Entity): void {
    const hang = OBJECTS[e.type].hang;
    const tx = this.claw.tipX + this.claw.dirX * hang;
    const ty = this.claw.tipY + this.claw.dirY * hang;
    const p = this.claw.state === 'hooked' ? easeOut(this.claw.hookProgress) : 1;
    e.x = e.grabX + (tx - e.grabX) * p;
    e.y = e.grabY + (ty - e.grabY) * p;
    e.shape.x = e.x;
    e.shape.y = e.y;
  }

  launch(): boolean {
    if (this.status !== 'playing') return false;
    const ok = this.claw.launch();
    if (ok) this.events.push({ type: 'launch' });
    return ok;
  }

  /** Blast Cap: destroy the carried object; the claw returns empty at full speed. */
  useBlastCap(): boolean {
    if (this.status !== 'playing' || this.blastCaps <= 0) return false;
    const id = this.claw.hookedId;
    if (id < 0) return false;
    const e = this.byId.get(id);
    if (!e || !e.alive) return false;
    if (!this.claw.dropHooked()) return false;
    this.blastCaps--;
    this.stats.blasts++;
    e.alive = false;
    e.hooked = false;
    this.shapesDirty = true;
    this.events.push({ type: 'blast', id, x: e.x, y: e.y });
    return true;
  }

  /** Time Freeze: the clock and the beetles stop for FREEZE_SEC. */
  useFreeze(): boolean {
    if (this.status !== 'playing' || this.freezeCount <= 0 || this.freezeLeft > 0 || this.timeLeft <= 0) return false;
    this.freezeCount--;
    this.freezeLeft = FREEZE_SEC;
    this.events.push({ type: 'freeze', seconds: FREEZE_SEC });
    return true;
  }

  update(dtRaw: number): void {
    const dt = Math.min(Math.max(dtRaw, 0), CLAW.maxDt);
    if (this.status !== 'playing') return;
    this.elapsed += dt;

    if (this.freezeLeft > 0) this.freezeLeft = Math.max(0, this.freezeLeft - dt);
    if (this.timeLeft > 0 && this.freezeLeft <= 0) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft === 0) this.events.push({ type: 'timeUp' });
    }

    if (this.freezeLeft <= 0) this.moveBeetles(dt);
    if (this.mods.extraMiner) this.runHelper(dt);

    this.rushing = twistFor(this.level.id).rush && this.elapsed % TWIST.rushCycle > TWIST.rushCycle - TWIST.rushSec;
    this.claw.update(dt, this, (this.level.swingMult ?? 1) * (this.rushing ? TWIST.rushMult : 1));
    for (const ev of this.claw.events) {
      switch (ev) {
        case 'hit':
          this.onHit(this.claw.hitId);
          break;
        case 'missed':
          this.events.push({ type: 'miss' });
          break;
        case 'collected':
          if (this.claw.deliveredId < 0) this.combo = 0;
          this.onCollected(this.claw.deliveredId);
          break;
        default:
          break;
      }
    }

    // Carried object follows the jaws every frame.
    if (this.claw.hookedId >= 0) {
      const e = this.byId.get(this.claw.hookedId);
      if (e) this.placeHooked(e);
    }

    this.checkEnd();
  }

  /** Extra Miner: every few seconds the helper pulls up the closest free gold or diamond. */
  private runHelper(dt: number): void {
    this.helperTimer -= dt;
    if (this.helperTimer > 0 || this.timeLeft <= 0) return;
    this.helperTimer = EFFECTS.helperIntervalSec;
    let best: Entity | null = null;
    let bestD = Infinity;
    for (const e of this.entities) {
      if (!e.alive || e.hooked) continue;
      if (e.type !== 'goldS' && e.type !== 'goldM' && e.type !== 'goldL' && e.type !== 'diamond') continue;
      const d = Math.hypot(e.x - WORLD.pivotX, e.y - WORLD.pivotY);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (!best) return;
    best.alive = false;
    this.shapesDirty = true;
    const value = collectValue(best.type, this.mods, false);
    this.earned += value;
    this.stats.collected++;
    if (best.type === 'diamond') this.stats.diamonds++;
    this.events.push({ type: 'collect', id: best.id, kind: best.type, value, x: best.x, y: best.y, combo: this.combo, mult: 1 });
  }

  private moveBeetles(dt: number): void {
    for (const e of this.entities) {
      if (e.type !== 'beetle' || !e.alive || e.hooked) continue;
      e.x += e.vx * dt;
      if (e.x < e.laneMinX) {
        e.x = e.laneMinX;
        e.vx = Math.abs(e.vx);
      } else if (e.x > e.laneMaxX) {
        e.x = e.laneMaxX;
        e.vx = -Math.abs(e.vx);
      }
      e.shape.x = e.x;
    }
  }

  private onHit(id: number): void {
    const e = this.byId.get(id);
    if (!e) return;
    this.events.push({ type: 'hit', id });
    if (e.type === 'keg' && !this.mods.defuser) {
      this.explode(e);
      return;
    }
    e.hooked = true;
    e.grabX = e.x;
    e.grabY = e.y;
    this.shapesDirty = true;
  }

  /** Powder keg: destroys everything within the radius, chaining through other kegs. */
  private explode(first: Entity): void {
    const queue: Entity[] = [first];
    first.alive = false;
    const r2 = KEG.blastRadius * KEG.blastRadius;
    while (queue.length) {
      const keg = queue.shift() as Entity;
      this.stats.kegs++;
      this.events.push({ type: 'explode', id: keg.id, x: keg.x, y: keg.y });
      for (const o of this.entities) {
        if (!o.alive || o === keg) continue;
        const dx = o.x - keg.x;
        const dy = o.y - keg.y;
        if (dx * dx + dy * dy > r2) continue;
        o.alive = false;
        if (o.type === 'keg') queue.push(o);
        else this.events.push({ type: 'destroyed', id: o.id, x: o.x, y: o.y });
      }
    }
    this.shapesDirty = true;
  }

  private onCollected(id: number): void {
    if (id < 0) return;
    const e = this.byId.get(id);
    if (!e || !e.alive) return;
    e.alive = false;
    e.hooked = false;
    this.shapesDirty = true;
    let value = collectValue(e.type, this.mods, e.carriesDiamond);
    let bag: BagOutcome | undefined;
    if (e.type === 'bag') {
      bag = rollBag(this.rng, this.mods);
      if (bag.kind === 'money') value = Math.round(bag.amount * (1 + this.upg.fortune * UPGRADES.fortune.perLevel));
      else if (bag.kind === 'item') this.blastCaps = Math.min(SHOP.maxBlastCaps, this.blastCaps + bag.blastCaps);
      else this.bagStrength = Math.max(this.bagStrength, BAG.strengthBoost);
    }
    // combo: back to back deliveries worth something raise the multiplier
    let mult = 1;
    if (value >= COMBO.minValue) {
      this.combo++;
      mult = Math.min(COMBO.max, 1 + COMBO.step * (this.combo - 1));
      value = Math.round(value * mult);
      if (this.combo > this.stats.bestCombo) this.stats.bestCombo = this.combo;
    } else if (value < COMBO.minValue && !(e.type === 'bag' && bag?.kind !== 'money')) {
      this.combo = 0;
    }
    this.stats.collected++;
    if (e.type === 'diamond' || (e.type === 'beetle' && e.carriesDiamond)) this.stats.diamonds++;
    if (e.type === 'rockS' || e.type === 'rockL') this.stats.rocks++;
    if (e.type === 'chest') this.stats.chests++;
    if (e.type === 'slime') this.stats.slimes++;
    if (e.type === 'beetle') this.stats.beetles++;
    this.earned = Math.max(0, this.earned + value);
    this.events.push({ type: 'collect', id, kind: e.type, value, x: e.x, y: e.y, bag, combo: this.combo, mult });
  }

  /** Ends the level only when the claw is home: a pull in progress always finishes first. */
  private checkEnd(): void {
    if (this.claw.state !== 'swinging') return;
    if (this.endlessSeed !== null && this.timeLeft > 0 && this.collectibleCount() === 0) {
      this.wave++;
      this.timeLeft += ENDLESS.waveBonusSec;
      this.loadObjects(endlessWave(this.endlessSeed, this.wave));
      this.events.push({ type: 'wave', wave: this.wave });
      return;
    }
    if (this.timeLeft > 0 && this.collectibleCount() > 0) return;
    this.status = this.earned >= this.level.target ? 'won' : 'lost';
    this.events.push({ type: 'end', won: this.status === 'won' });
  }

  stars(): number {
    return starsFor(this.earned, this.level.target, LEVEL_RULES.starMultipliers);
  }

  /** Value of a beetle that carries a diamond is reflected in the level estimate. */
  static readonly beetleDiamondValue = BEETLE_DIAMOND_VALUE;
}

const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);
