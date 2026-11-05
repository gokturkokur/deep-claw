/** Feel, layout and timing of the game. All gameplay numbers live in src/config/. */

export const DESIGN = {
  width: 720,
  height: 1280,
  /** Margin kept free at the top for notches / status bars (logical px). */
  safeTop: 48,
  /** Minimum size of any tappable button (logical px). */
  minButton: 96,
} as const;

export const WORLD = {
  pivotX: 360,
  pivotY: 236,
  /** y of the ground line where the rig stands. */
  surfaceY: 320,
  /** Treasure may only be placed inside this box. */
  fieldMinX: 40,
  fieldMaxX: 680,
  fieldMinY: 380,
  fieldMaxY: 1200,
} as const;

export const CLAW = {
  /** Swing: angle = 90deg + amplitude * sin(phase). 90deg = straight down. */
  swingAmplitudeDeg: 70,
  swingPeriodSec: 2.6,
  /** Rope growth speed (px/s). */
  extendSpeed: 900,
  /** Retract speed with nothing attached (px/s). */
  emptyRetractSpeed: 1500,
  /** Retract speed = baseRetractSpeed * strength / weight (px/s). Weight 1 -> 500 px/s. */
  baseRetractSpeed: 500,
  minRetractSpeed: 60,
  /** Distance from the pivot to the jaw tip when the claw is home. */
  homeLength: 84,
  maxLength: 1160,
  /** Collision radius of the jaw tip. */
  tipRadius: 14,
  /** Length of the claw body drawn between rope end and jaw tip. */
  bodyLength: 64,
  /** Short beat while the jaws close (s). */
  hookPauseSec: 0.09,
  /** Short beat while the load is delivered (s). */
  collectPauseSec: 0.14,
  /** A lag spike can never move things further than this (s). */
  maxDt: 0.05,
} as const;

export const LEVEL_RULES = {
  durationSec: 60,
  /** Stars: 1 = target, 2 = 125 % of target, 3 = 150 %. */
  starMultipliers: [1, 1.25, 1.5] as readonly number[],
  /** Seconds the timer turns red and pulses. */
  warnSec: 10,
} as const;

export const BEETLE = {
  speedMin: 55,
  speedMax: 95,
} as const;

export const KEG = {
  /** Everything with its centre inside this radius is destroyed. */
  blastRadius: 175,
} as const;

/**
 * Easter egg: using a Blast Cap on a powder keg you are carrying (only possible with the
 * Keg Defuser) sets off a mega blast. The whole mine is destroyed and the level is lost.
 */
/** Hidden easter eggs. Each one also unlocks a hidden achievement the first time. */
export const EGGS = {
  /** A diamond beetle gives up after this many near misses: it stops, waves, and drops the diamond on the next throw. */
  beetle: { missesToGiveUp: 3, nearPx: 95 },
  /** No throw at all for this long after the level starts: Dusty throws by himself, that pull pays a bonus. */
  idle: { afterSec: 30, bonus: 0.1 },
  /** This many kegs in one chain explosion = fireworks. */
  fireworks: { minKegs: 4 },
  /** Boss level: pull up every rock (at least minRocks) before any gold and Baron's vault appears. */
  vault: { minRocks: 2, value: 3000 },
  /** Main menu: this many taps on the sky = shooting star (+1 wheel spin, once a day). */
  star: { taps: 10 },
  /** Mystery bags: the same kind of prize this many times in a row makes the next bag a jackpot. */
  bag: { streak: 3, jackpot: 2000 },
} as const;

export const MEGA_BLAST = {
  enabled: true,
  /** How long the explosion plays before the Game Over screen (ms). */
  endDelayMs: 2600,
  /** Extra explosions spread over the screen after the first one. */
  extraBursts: 7,
  burstGapMs: 140,
} as const;

export const FX = {
  fadeMs: 240,
  moneyTickSec: 0.45,
  floatTextPool: 8,
  maxParticles: 120,
} as const;

/** Stable ids for the 6 claw states. */
export type ClawState = 'swinging' | 'launching' | 'hooked' | 'missed' | 'retracting' | 'collecting';
