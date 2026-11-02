import { describe, expect, it } from 'vitest';
import { CLAW } from '../src/config/game';
import { Claw, canTransition, TRANSITIONS, type ClawHost } from '../src/systems/Claw';
import type { ClawState } from '../src/config/game';

const noHost: ClawHost = { sweep: () => null, weightOf: () => 1, strength: () => 1, hookable: () => true };

function hostWith(hitAtLen: number, weight: number, strength = 1, hookable = true): ClawHost {
  return {
    sweep: (ax, ay, bx, by) => {
      const prev = Math.hypot(ax - 360, ay - 236);
      const cur = Math.hypot(bx - 360, by - 236);
      if (cur >= hitAtLen && prev <= hitAtLen) return { id: 7, t: (hitAtLen - prev) / (cur - prev) };
      return null;
    },
    weightOf: () => weight,
    strength: () => strength,
    hookable: () => hookable,
  };
}

const run = (claw: Claw, host: ClawHost, seconds: number, dt = 1 / 60) => {
  const events: string[] = [];
  for (let t = 0; t < seconds; t += dt) {
    claw.update(dt, host, 1);
    events.push(...claw.events);
  }
  return events;
};

describe('swing', () => {
  it('angle stays inside 90 +/- amplitude and is fastest in the centre', () => {
    const c = new Claw(360, 236);
    let min = 999;
    let max = -999;
    let centreStep = 0;
    let edgeStep = Infinity;
    let prev = c.angleDeg;
    for (let i = 0; i < 600; i++) {
      c.update(1 / 60, noHost, 1);
      min = Math.min(min, c.angleDeg);
      max = Math.max(max, c.angleDeg);
      const step = Math.abs(c.angleDeg - prev);
      prev = c.angleDeg;
      if (Math.abs(c.angleDeg - 90) < 5) centreStep = Math.max(centreStep, step);
      if (Math.abs(c.angleDeg - 90) > 65) edgeStep = Math.min(edgeStep, step);
    }
    expect(min).toBeGreaterThanOrEqual(90 - CLAW.swingAmplitudeDeg - 1e-9);
    expect(max).toBeLessThanOrEqual(90 + CLAW.swingAmplitudeDeg + 1e-9);
    expect(min).toBeLessThan(25);
    expect(max).toBeGreaterThan(155);
    expect(centreStep).toBeGreaterThan(edgeStep * 4);
  });

  it('a full cycle takes about 2.6 s', () => {
    const c = new Claw(360, 236);
    let crossings = 0;
    let prev = c.angleDeg - 90;
    let t = 0;
    for (; t < 6; t += 1 / 120) {
      c.update(1 / 120, noHost, 1);
      const cur = c.angleDeg - 90;
      if (prev < 0 && cur >= 0) crossings++;
      prev = cur;
    }
    expect(crossings).toBe(2); // two upward crossings in two periods (starting at the centre)
  });

  it('phase freezes while launched and resumes from the same angle', () => {
    const c = new Claw(360, 236);
    run(c, noHost, 0.7);
    const phase = c.phase;
    const angle = c.angleDeg;
    expect(c.launch()).toBe(true);
    let sawMiss = false;
    let guard = 0;
    while (c.state !== 'swinging' && guard++ < 1000) {
      c.update(1 / 60, noHost, 1);
      if (c.events.includes('missed')) sawMiss = true;
      if (c.state !== 'swinging') expect(c.phase).toBeCloseTo(phase, 9);
    }
    expect(sawMiss).toBe(true);
    expect(c.state).toBe('swinging');
    // resumes from the frozen phase: no jump (one frame of swing at most)
    expect(Math.abs(c.angleDeg - angle)).toBeLessThan(3);
  });
});

describe('tip position', () => {
  it('is pivot + length * (cos, sin)', () => {
    const c = new Claw(360, 236);
    run(c, noHost, 0.5);
    c.launch();
    const a = c.angleDeg * (Math.PI / 180);
    for (let i = 0; i < 10; i++) c.update(1 / 60, noHost, 1);
    expect(c.tipX).toBeCloseTo(360 + Math.cos(a) * c.length, 6);
    expect(c.tipY).toBeCloseTo(236 + Math.sin(a) * c.length, 6);
  });
});

describe('state machine', () => {
  const all = Object.keys(TRANSITIONS) as ClawState[];
  it('only the documented transitions are legal', () => {
    for (const from of all) for (const to of all) expect(canTransition(from, to)).toBe(TRANSITIONS[from].includes(to));
    expect(canTransition('swinging', 'retracting')).toBe(false);
    expect(canTransition('retracting', 'launching')).toBe(false);
    expect(canTransition('hooked', 'swinging')).toBe(false);
  });

  it('cannot launch while launching or retracting', () => {
    const c = new Claw(360, 236);
    expect(c.launch()).toBe(true);
    expect(c.launch()).toBe(false);
    const host = hostWith(400, 3);
    run(c, host, 0.6);
    expect(['hooked', 'retracting']).toContain(c.state);
    expect(c.launch()).toBe(false);
  });

  it('walks Swinging -> Launching -> Hooked -> Retracting -> Collecting -> Swinging', () => {
    const c = new Claw(360, 236);
    const seen: ClawState[] = [c.state];
    c.launch();
    const host = hostWith(400, 1);
    for (let i = 0; i < 600; i++) {
      c.update(1 / 60, host, 1);
      if (seen[seen.length - 1] !== c.state) seen.push(c.state);
    }
    expect(seen).toEqual(['swinging', 'launching', 'hooked', 'retracting', 'collecting', 'swinging']);
    expect(c.hookedId).toBe(-1);
  });

  it('a miss goes Launching -> Missed -> Retracting empty', () => {
    const c = new Claw(360, 236);
    c.launch();
    const seen: ClawState[] = [];
    for (let i = 0; i < 600; i++) {
      c.update(1 / 60, noHost, 1);
      if (seen[seen.length - 1] !== c.state) seen.push(c.state);
    }
    expect(seen.slice(0, 3)).toEqual(['launching', 'missed', 'retracting']);
  });

  it('never hooks without an object and never hooks twice', () => {
    const c = new Claw(360, 236);
    c.launch();
    const host = hostWith(400, 1);
    for (let i = 0; i < 400; i++) {
      c.update(1 / 60, host, 1);
      if (c.state === 'hooked' || c.state === 'retracting') {
        // hookedId is set if and only if something was really hit
        expect(c.hookedId === 7 || c.hookedId === -1).toBe(true);
      }
    }
  });

  it('a non-hookable hit (keg) ends the launch empty', () => {
    const c = new Claw(360, 236);
    c.launch();
    const host = hostWith(400, 1, 1, false);
    const ev = run(c, host, 1);
    expect(ev).toContain('hit');
    expect(ev).toContain('missed');
    expect(c.hookedId).toBe(-1);
  });
});

describe('retracting', () => {
  const timeToReturn = (weight: number, strength = 1) => {
    const c = new Claw(360, 236);
    c.launch();
    const host = hostWith(536, weight, strength); // 500 px from the pivot... plus
    let t = 0;
    let retractStart = -1;
    while (c.state !== 'swinging' || t === 0) {
      c.update(1 / 120, host, 1);
      t += 1 / 120;
      if (retractStart < 0 && c.state === 'retracting') retractStart = t;
      if (t > 30) break;
    }
    return t - retractStart;
  };

  it('heavier objects come back slower, proportional to weight', () => {
    const light = timeToReturn(1.2);
    const heavy = timeToReturn(5.5);
    expect(heavy).toBeGreaterThan(light * 3.5);
  });
  it('strength speeds the pull up', () => {
    const normal = timeToReturn(4);
    const turbo = timeToReturn(4, 1.5);
    expect(normal / turbo).toBeGreaterThan(1.35);
    expect(normal / turbo).toBeLessThan(1.6);
  });
  it('empty retract is fast', () => {
    const c = new Claw(360, 236);
    c.launch();
    run(c, noHost, 0.6);
    expect(c.state === 'retracting' || c.state === 'missed' || c.state === 'launching').toBe(true);
  });
  it('mid-screen pull times feel like light ~1 s, medium ~2 s, heavy 4-6 s', () => {
    const mid = (w: number) => (500 - CLAW.homeLength) / (CLAW.baseRetractSpeed / w);
    expect(mid(1.2)).toBeGreaterThan(0.8);
    expect(mid(1.2)).toBeLessThan(1.5);
    expect(mid(2.2)).toBeGreaterThan(1.6);
    expect(mid(2.2)).toBeLessThan(2.4);
    expect(mid(5.5)).toBeGreaterThan(3.5);
    expect(mid(5.5)).toBeLessThan(6.2);
  });
});

describe('frame rate independence', () => {
  it('a 50 ms spike cannot teleport the claw; dt above the cap is clamped', () => {
    const c = new Claw(360, 236);
    c.launch();
    const before = c.length;
    c.update(5, noHost, 1); // 5 s lag spike
    expect(c.length - before).toBeLessThanOrEqual(CLAW.extendSpeed * CLAW.maxDt + 1e-6);
  });
  it('reaches the same length at 30 fps and 60 fps', () => {
    const a = new Claw(360, 236);
    const b = new Claw(360, 236);
    a.launch();
    b.launch();
    for (let i = 0; i < 15; i++) a.update(1 / 30, noHost, 1);
    for (let i = 0; i < 30; i++) b.update(1 / 60, noHost, 1);
    expect(a.length).toBeCloseTo(b.length, 3);
  });
});
