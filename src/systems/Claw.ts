import { CLAW, type ClawConfig, type ClawState } from '../config/game';

/** Explicit, exhaustive transition table. Anything else throws. */
export const TRANSITIONS: Record<ClawState, readonly ClawState[]> = {
  swinging: ['launching'],
  launching: ['hooked', 'missed'],
  hooked: ['retracting'],
  missed: ['retracting'],
  retracting: ['collecting'],
  collecting: ['swinging'],
};

export function canTransition(from: ClawState, to: ClawState): boolean {
  return TRANSITIONS[from].includes(to);
}

export type ClawEvent = 'launched' | 'hit' | 'missed' | 'retractStart' | 'collected';

/** What the claw needs to know about the world. */
export interface ClawHost {
  /** Sweep A->B. Return the first hit as {id, t} or null. */
  sweep(ax: number, ay: number, bx: number, by: number): { id: number; t: number } | null;
  weightOf(id: number): number;
  /** False for things that explode instead of being hooked (powder keg). */
  hookable(id: number): boolean;
  /** Multiplier on pull speed (Turbo oil, strength bag...). */
  strength(): number;
  /**
   * Optional: total weight of everything riding on the claw when it carries more than one thing
   * (magnet mode). If defined it replaces the single hooked object's weight in the retract formula;
   * 0 means "empty". Deep Claw does not implement it.
   */
  carriedWeight?(): number;
}

const DEG = Math.PI / 180;

export class Claw {
  state: ClawState = 'swinging';
  phase = 0;
  /** Distance from pivot to the jaw tip. */
  length: number;
  angleDeg = 90;
  /** Direction the claw was launched in (frozen). */
  dirX = 0;
  dirY = 1;
  hookedId = -1;
  /** 0..1 while the jaws close on the object. */
  hookProgress = 0;
  /** Jaw tip world position. */
  tipX = 0;
  tipY = 0;
  /** Events raised during the last update(); cleared at the start of each update. */
  events: ClawEvent[] = [];
  /** Id of the object delivered by the last 'collected' event (-1 = nothing). */
  deliveredId = -1;
  /** Id of the object touched by the last 'hit' event. */
  hitId = -1;
  /** Current speed of the rope (px/s, negative while retracting). */
  speed = 0;

  private stateTimer = 0;
  private prevTipX = 0;
  private prevTipY = 0;

  constructor(
    readonly pivotX: number,
    readonly pivotY: number,
    private readonly cfg: ClawConfig = CLAW,
  ) {
    this.length = cfg.homeLength;
    this.updateTip();
  }

  private transition(to: ClawState): void {
    if (!canTransition(this.state, to)) {
      throw new Error(`Illegal claw transition ${this.state} -> ${to}`);
    }
    this.state = to;
    this.stateTimer = 0;
  }

  private updateTip(): void {
    const a = this.angleDeg * DEG;
    const dx = this.state === 'swinging' ? Math.cos(a) : this.dirX;
    const dy = this.state === 'swinging' ? Math.sin(a) : this.dirY;
    this.tipX = this.pivotX + dx * this.length;
    this.tipY = this.pivotY + dy * this.length;
  }

  /** Current unit direction of the rope. */
  get dx(): number {
    return this.state === 'swinging' ? Math.cos(this.angleDeg * DEG) : this.dirX;
  }
  get dy(): number {
    return this.state === 'swinging' ? Math.sin(this.angleDeg * DEG) : this.dirY;
  }

  /** Try to launch. Only possible while swinging. */
  launch(): boolean {
    if (this.state !== 'swinging') return false;
    const a = this.angleDeg * DEG;
    this.dirX = Math.cos(a);
    this.dirY = Math.sin(a);
    this.transition('launching');
    this.prevTipX = this.tipX;
    this.prevTipY = this.tipY;
    this.events.push('launched');
    return true;
  }

  /**
   * Ends a launch early without a collision (magnet mode: load is full, or the first item stuck).
   * Goes through the normal 'missed' -> 'retracting' path, so no new states are needed.
   */
  recall(): boolean {
    if (this.state !== 'launching') return false;
    this.hookedId = -1;
    this.transition('missed');
    return true;
  }

  /** Blast Cap: drop whatever is hooked. The claw keeps retracting, now empty and fast. */
  dropHooked(): boolean {
    if ((this.state !== 'hooked' && this.state !== 'retracting') || this.hookedId < 0) return false;
    this.hookedId = -1;
    return true;
  }

  /** Swing phase advance and state machine step. */
  update(dtRaw: number, host: ClawHost, swingMult: number): void {
    const dt = Math.min(Math.max(dtRaw, 0), this.cfg.maxDt);
    this.events.length = 0;

    switch (this.state) {
      case 'swinging': {
        this.phase += ((Math.PI * 2) / this.cfg.swingPeriodSec) * swingMult * dt;
        if (this.phase > Math.PI * 2) this.phase -= Math.PI * 2;
        this.angleDeg = 90 + this.cfg.swingAmplitudeDeg * Math.sin(this.phase);
        this.length = this.cfg.homeLength;
        this.speed = 0;
        break;
      }
      case 'launching': {
        this.prevTipX = this.tipX;
        this.prevTipY = this.tipY;
        const step = this.cfg.extendSpeed * dt;
        const prevLen = this.length;
        this.length += step;
        this.speed = this.cfg.extendSpeed;
        let nx = this.pivotX + this.dirX * this.length;
        let ny = this.pivotY + this.dirY * this.length;
        const hit = host.sweep(this.prevTipX, this.prevTipY, nx, ny);
        if (hit) {
          // Stop exactly at the contact point (never tunnel through, never overshoot).
          this.length = prevLen + step * hit.t;
          nx = this.pivotX + this.dirX * this.length;
          ny = this.pivotY + this.dirY * this.length;
          this.tipX = nx;
          this.tipY = ny;
          this.hitId = hit.id;
          this.events.push('hit');
          if (host.hookable(hit.id)) {
            this.hookedId = hit.id;
            this.hookProgress = 0;
            this.transition('hooked');
          } else {
            this.hookedId = -1;
            this.transition('missed');
            this.events.push('missed');
          }
          break;
        }
        if (this.length >= this.cfg.maxLength || nx < 0 || nx > 720 || ny > 1280) {
          this.transition('missed');
          this.hookedId = -1;
          this.events.push('missed');
        }
        break;
      }
      case 'hooked': {
        this.stateTimer += dt;
        this.speed = 0;
        this.hookProgress = Math.min(1, this.stateTimer / this.cfg.hookPauseSec);
        if (this.stateTimer >= this.cfg.hookPauseSec) {
          this.transition('retracting');
          this.events.push('retractStart');
        }
        break;
      }
      case 'missed': {
        this.stateTimer += dt;
        this.speed = 0;
        this.transition('retracting');
        this.events.push('retractStart');
        break;
      }
      case 'retracting': {
        let v: number = this.cfg.emptyRetractSpeed;
        const load = host.carriedWeight ? host.carriedWeight() : 0;
        if (load > 0) {
          v = Math.max(this.cfg.minRetractSpeed, (this.cfg.baseRetractSpeed * host.strength()) / Math.max(0.1, load));
        } else if (this.hookedId >= 0) {
          const w = Math.max(0.1, host.weightOf(this.hookedId));
          v = Math.max(this.cfg.minRetractSpeed, (this.cfg.baseRetractSpeed * host.strength()) / w);
        }
        this.speed = -v;
        this.length -= v * dt;
        if (this.length <= this.cfg.homeLength) {
          this.length = this.cfg.homeLength;
          this.deliveredId = this.hookedId;
          this.transition('collecting');
          this.events.push('collected');
        }
        break;
      }
      case 'collecting': {
        this.stateTimer += dt;
        this.speed = 0;
        if (this.stateTimer >= this.cfg.collectPauseSec) {
          this.hookedId = -1;
          this.deliveredId = -1;
          this.hookProgress = 0;
          this.transition('swinging');
          // Resume the swing from the same phase: no jump.
          this.angleDeg = 90 + this.cfg.swingAmplitudeDeg * Math.sin(this.phase);
        }
        break;
      }
    }
    this.updateTip();
  }
}
