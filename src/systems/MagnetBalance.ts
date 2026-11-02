/**
 * Balance tools for the magnet prototype (no Phaser). Plays "Kanal Testi" by code:
 * - a perfect player who always waits for the best launch moment (looks two dives ahead),
 * - a casual player who taps at random moments,
 * - an angle scan that tells which launch angles bring a given item home.
 * Money is counted at the expected value (the safe counts as its average), so runs are repeatable.
 * Used by tools/magnet-balance.ts and the unit tests.
 */
import { CLAW } from '../config/game';
import { MAGNET_ITEMS, type MagnetItemId, type MagnetLevelDef } from '../config/magnet';
import type { MagnetSettings } from './MagnetSettings';
import { MagnetSession, type MagnetEvent } from './MagnetSession';
import { makeRng, type Rng } from './Rng';

const DT = 1 / 60;
/** One full swing, in frames: every launch moment inside it is worth considering. */
const swingFrames = (level: MagnetLevelDef) => Math.round(CLAW.swingPeriodSec / level.swingMult / DT);

export interface Shot {
  /** Seconds into the level when the magnet was launched. */
  at: number;
  angle: number;
  /** Expected money brought home by this dive. */
  gain: number;
  kinds: string[];
}

export interface PlayResult {
  /** Seconds of level time when the target was reached, or null if it never was. */
  targetAt: number | null;
  /** Seconds of level time when the canal was empty (or the clock ran out). */
  endAt: number;
  earned: number;
  shots: Shot[];
}

/** Copy of a session that is resting between dives (nothing on the magnet). */
export function cloneSession(src: MagnetSession, rng: Rng = makeRng(1)): MagnetSession {
  const s = new MagnetSession({ level: src.level, settings: { ...src.settings }, rng });
  s.timeLeft = src.timeLeft;
  s.earned = src.earned;
  s.elapsed = src.elapsed;
  s.status = src.status;
  s.claw.phase = src.claw.phase;
  s.claw.angleDeg = src.claw.angleDeg;
  s.claw.update(0, s, src.level.swingMult);
  for (let i = 0; i < src.entities.length; i++) {
    const a = src.entities[i];
    const b = s.entities[i];
    b.x = a.x;
    b.y = a.y;
    b.shape.x = a.x;
    b.shape.y = a.y;
    b.alive = a.alive;
    b.collected = a.collected;
    b.attachCount = a.attachCount;
  }
  return s;
}

interface DiveOutcome {
  wait: number;
  angle: number;
  /** Seconds from now until the magnet is home again. */
  time: number;
  gain: number;
  /** Expected money destroyed by a grenade. */
  lost: number;
  kinds: string[];
  key: string;
  after: MagnetSession;
}

type PriceOf = (kind: MagnetItemId) => number;
const expected: PriceOf = (kind) => MAGNET_ITEMS[kind].value;

/** Steps a resting session `wait` frames, launches, and runs it until the magnet is home. */
function diveAfter(base: MagnetSession, wait: number, priceOf: PriceOf): DiveOutcome {
  const s = cloneSession(base);
  for (let i = 0; i < wait; i++) s.update(DT);
  const angle = s.claw.angleDeg;
  s.launch();
  let gain = 0;
  let lost = 0;
  const kinds: string[] = [];
  const done: number[] = [];
  let frames = wait;
  for (let i = 0; i < 4000 && s.claw.state !== 'swinging' && s.status === 'playing'; i++) {
    s.update(DT);
    frames++;
    for (const ev of s.events) collectEv(ev, s, priceOf, (v, k, id) => {
      gain += v;
      kinds.push(k);
      done.push(id);
    }, (v, id) => {
      lost += v;
      done.push(id);
    });
    s.events.length = 0;
  }
  return { wait, angle, time: frames * DT, gain, lost, kinds, key: done.sort((a, b) => a - b).join(','), after: s };
}

function collectEv(
  ev: MagnetEvent,
  s: MagnetSession,
  priceOf: PriceOf,
  onCollect: (v: number, kind: string, id: number) => void,
  onLost: (v: number, id: number) => void,
): void {
  if (ev.type === 'collect') onCollect(priceOf(ev.kind), ev.kind, ev.id);
  else if (ev.type === 'destroyed') {
    const e = s.get(ev.id);
    if (e) onLost(priceOf(e.kind), ev.id);
  } else if (ev.type === 'explode') onLost(0, ev.id);
}

/** Every distinct result of launching during the next full swing (earliest moment for each). */
function options(s: MagnetSession, step: number, priceOf: PriceOf): DiveOutcome[] {
  const seen = new Map<string, DiveOutcome>();
  for (let w = 0; w < swingFrames(s.level); w += step) {
    const o = diveAfter(s, w, priceOf);
    const prev = seen.get(o.key);
    if (!prev || o.time < prev.time) seen.set(o.key, o);
  }
  return [...seen.values()];
}

const score = (gain: number, lost: number, time: number) => (gain - lost) / Math.max(0.05, time);

/**
 * A player with perfect judgement. Before each dive it tries every launch moment of the next swing,
 * and for the most promising ones also the best follow-up dive, then takes the best money per second.
 * `lateFrames` > 0 makes its thumb imprecise: each tap lands up to that many frames early or late.
 */
export function playPerfect(
  level: MagnetLevelDef,
  settings: MagnetSettings,
  opts: { step?: number; lookahead?: number; priceOf?: PriceOf; lateFrames?: number; seed?: number } = {},
): PlayResult {
  const step = opts.step ?? 2;
  const look = opts.lookahead ?? 5;
  const priceOf = opts.priceOf ?? expected;
  const late = opts.lateFrames ?? 0;
  const thumb = makeRng(opts.seed ?? 1);
  let s = new MagnetSession({ level, settings: { ...settings }, rng: makeRng(1) });
  const shots: Shot[] = [];
  let targetAt: number | null = null;
  let earned = 0;
  const t0 = level.durationSec;
  while (s.status === 'playing' && s.timeLeft > 0) {
    const first = options(s, step, priceOf).filter((o) => o.gain > 0 || o.after.collectibleCount() < s.collectibleCount());
    if (first.length === 0) break;
    first.sort((a, b) => score(b.gain, b.lost, b.time) - score(a.gain, a.lost, a.time));
    let best = first[0];
    let bestScore = -Infinity;
    for (const o of first.slice(0, look)) {
      let v = score(o.gain, o.lost, o.time);
      if (o.after.status === 'playing' && o.after.collectibleCount() > 0) {
        for (const p of options(o.after, step * 2, priceOf)) v = Math.max(v, score(o.gain + p.gain, o.lost + p.lost, o.time + p.time));
      }
      if (v > bestScore) {
        bestScore = v;
        best = o;
      }
    }
    if (late > 0) best = diveAfter(s, Math.max(0, best.wait + Math.round((thumb() * 2 - 1) * late)), priceOf);
    shots.push({ at: round1(t0 - s.timeLeft + best.wait * DT), angle: round1(best.angle), gain: best.gain, kinds: best.kinds });
    earned += best.gain;
    if (targetAt === null && earned >= level.target) targetAt = round1(t0 - best.after.timeLeft);
    s = best.after;
  }
  return { targetAt, endAt: round1(t0 - s.timeLeft), earned, shots };
}

/** A player who taps at a random moment of each swing and never aims. Returns the expected money. */
export function playCasual(level: MagnetLevelDef, settings: MagnetSettings, seed: number): number {
  const rng = makeRng(seed);
  const s = new MagnetSession({ level, settings: { ...settings }, rng: makeRng(seed + 1) });
  let money = 0;
  while (s.status === 'playing') {
    const wait = Math.floor(rng() * swingFrames(level));
    for (let i = 0; i < wait && s.status === 'playing'; i++) step(s, (v) => (money += v));
    s.launch();
    for (let i = 0; i < 4000 && s.status === 'playing' && s.claw.state !== 'swinging'; i++) step(s, (v) => (money += v));
    if (s.claw.state === 'swinging') step(s, (v) => (money += v));
  }
  return money;
}

function step(s: MagnetSession, onMoney: (v: number) => void): void {
  s.update(DT);
  for (const ev of s.events) if (ev.type === 'collect') onMoney(MAGNET_ITEMS[ev.kind].value);
  s.events.length = 0;
}

/** Launch angles (from the fresh level) whose dive brings the item with index `idx` home. */
export function winningAngles(level: MagnetLevelDef, settings: MagnetSettings, idx: number, stepDeg = 0.25): number[] {
  const out: number[] = [];
  const lo = 90 - CLAW.swingAmplitudeDeg;
  const hi = 90 + CLAW.swingAmplitudeDeg;
  for (let a = lo; a <= hi + 1e-9; a += stepDeg) {
    const s = new MagnetSession({ level, settings: { ...settings }, rng: makeRng(1) });
    s.claw.angleDeg = a;
    s.launch();
    for (let i = 0; i < 4000 && s.claw.state !== 'swinging'; i++) {
      s.update(DT);
      s.events.length = 0;
    }
    if (s.entities[idx].collected) out.push(a);
  }
  return out;
}

/** Widest run of consecutive angles in a sorted list (degrees). */
export function widestWindow(angles: number[], stepDeg = 0.25): number {
  let best = 0;
  let run = 0;
  for (let i = 0; i < angles.length; i++) {
    run = i > 0 && angles[i] - angles[i - 1] <= stepDeg + 1e-6 ? run + stepDeg : stepDeg;
    best = Math.max(best, run);
  }
  return best;
}

const round1 = (v: number) => Math.round(v * 10) / 10;
