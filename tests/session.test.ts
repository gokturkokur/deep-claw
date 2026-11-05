import { describe, expect, it } from 'vitest';
import { KEG } from '../src/config/game';
import type { LevelDef, LevelObject } from '../src/data/levels';
import { Session } from '../src/systems/Session';
import { makeRng } from '../src/systems/Rng';
import { NO_MODIFIERS } from '../src/systems/Economy';

const level = (objects: LevelObject[], target = 100): LevelDef => ({ id: 1, name: 't', target, objects });
const o = (type: LevelObject['type'], x: number, y: number): LevelObject => ({ type, x, y });

/** Run the session until the claw is swinging again. */
function pull(s: Session, angleDeg?: number, maxSec = 40): void {
  if (angleDeg !== undefined) {
    // wait until the swing passes close to the wanted angle
    for (let i = 0; i < 2000 && Math.abs(s.claw.angleDeg - angleDeg) > 0.4; i++) s.update(1 / 240);
  }
  s.launch();
  for (let t = 0; t < maxSec && s.claw.state !== 'swinging' && s.status === 'playing'; t += 1 / 60) s.update(1 / 60);
  // let the 'collecting' pause finish
  for (let i = 0; i < 20 && s.claw.state !== 'swinging'; i++) s.update(1 / 60);
}
/** Object straight below the winch. */
const below = (type: LevelObject['type'], dist: number) => o(type, 360, 236 + dist);

describe('hooking and collecting', () => {
  it('collects gold and adds its value once', () => {
    const s = new Session({ level: level([below('goldS', 400), o('goldS', 100, 1100)]), rng: makeRng(1) });
    pull(s, 90);
    expect(s.earned).toBe(100);
    expect(s.entities.filter((e) => e.alive).length).toBe(1);
  });

  it('hooks only the first object on the path', () => {
    const s = new Session({ level: level([below('goldL', 700), below('rockS', 300), o('goldS', 100, 1100)]), rng: makeRng(1) });
    pull(s, 90);
    expect(s.earned).toBe(10); // rock first
    const gold = s.entities.find((e) => e.type === 'goldL');
    expect(gold?.alive).toBe(true);
  });

  it('hits small objects even with 50 ms frames', () => {
    const s = new Session({ level: level([below('diamond', 500), o('goldS', 100, 1100)]), rng: makeRng(1) });
    for (let i = 0; i < 2000 && Math.abs(s.claw.angleDeg - 90) > 0.5; i++) s.update(1 / 240);
    s.launch();
    for (let i = 0; i < 600 && s.claw.state !== 'swinging'; i++) s.update(0.05);
    expect(s.earned).toBe(600);
  });

  it('an object is never collected twice', () => {
    const s = new Session({ level: level([below('goldM', 400), o('goldS', 100, 1100)]), rng: makeRng(1) });
    pull(s, 90);
    pull(s, 90);
    expect(s.earned).toBe(250);
  });

  it('carried object follows the jaws', () => {
    const s = new Session({ level: level([below('goldM', 600), o('goldS', 100, 1100)]), rng: makeRng(1) });
    for (let i = 0; i < 2000 && Math.abs(s.claw.angleDeg - 90) > 0.5; i++) s.update(1 / 240);
    s.launch();
    let checked = 0;
    for (let i = 0; i < 600 && s.claw.state !== 'swinging'; i++) {
      s.update(1 / 60);
      if (s.claw.state === 'retracting') {
        const e = s.entities[0];
        expect(Math.hypot(e.x - s.claw.tipX, e.y - s.claw.tipY)).toBeLessThan(40);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
});

describe('powder keg', () => {
  it('destroys everything in the radius, returns empty, chains to other kegs', () => {
    const s = new Session({
      level: level([
        below('keg', 400),
        o('goldS', 360 + 100, 636), // in radius of the first keg
        o('keg', 360 + 150, 700), // chain keg
        o('goldM', 360 + 150 + 120, 760), // in radius of the chain keg only
        o('goldL', 80, 1150), // far away, survives
      ]),
      rng: makeRng(1),
    });
    pull(s, 90);
    expect(s.earned).toBe(0);
    const alive = s.entities.filter((e) => e.alive).map((e) => e.type);
    expect(alive).toEqual(['goldL']);
    expect(s.events.some((e) => e.type === 'explode')).toBe(true);
    expect(s.events.filter((e) => e.type === 'explode').length).toBe(2);
  });

  it('leaves objects outside the radius alone', () => {
    const s = new Session({
      level: level([below('keg', 400), o('goldS', 360 + KEG.blastRadius + 40, 636), o('goldL', 80, 1150)]),
      rng: makeRng(1),
    });
    pull(s, 90);
    expect(s.entities.filter((e) => e.alive).map((e) => e.type)).toEqual(['goldS', 'goldL']);
  });
});

describe('mega blast easter egg', () => {
  /** Defused keg straight below, gold far away; launch and wait until the keg is on the claw. */
  const carryKeg = (caps: number) => {
    const s = new Session({
      level: level([below('keg', 400), o('goldS', 100, 1100), o('goldL', 620, 1150)], 100),
      modifiers: { ...NO_MODIFIERS, defuser: true, magnet: true },
      blastCaps: caps,
      rng: makeRng(1),
    });
    for (let i = 0; i < 2000 && Math.abs(s.claw.angleDeg - 90) > 0.4; i++) s.update(1 / 240);
    s.launch();
    for (let i = 0; i < 600 && s.claw.state !== 'retracting'; i++) s.update(1 / 60);
    return s;
  };

  it('Blast Cap on a carried keg destroys the whole mine and loses the level', () => {
    const s = carryKeg(2);
    expect(s.claw.state).toBe('retracting');
    expect(s.get(s.claw.hookedId)?.type).toBe('keg');
    s.events.length = 0;
    expect(s.useBlastCap()).toBe(true);
    expect(s.blastCaps).toBe(1);
    expect(s.status).toBe('lost');
    expect(s.entities.every((e) => !e.alive)).toBe(true);
    const types = s.events.map((e) => e.type);
    expect(types).toContain('megaBlast');
    expect(types).not.toContain('blast');
    expect(s.events.find((e) => e.type === 'end')).toEqual({ type: 'end', won: false, reason: 'megaBlast' });
    // nothing moves or scores after the end
    s.update(1);
    expect(s.earned).toBe(0);
  });

  it('a lost level stays lost even if the target was already reached', () => {
    const s = carryKeg(1);
    s.earned = 500;
    s.useBlastCap();
    expect(s.status).toBe('lost');
  });

  it('pulling the defused keg up without a Blast Cap is still safe', () => {
    const s = carryKeg(0);
    for (let i = 0; i < 1200 && s.claw.state !== 'swinging'; i++) s.update(1 / 60);
    expect(s.status).toBe('playing');
    expect(s.earned).toBeGreaterThan(0);
  });
});

describe('Blast Cap', () => {
  it('destroys the carried object and the claw returns empty, faster', () => {
    const mk = (caps: number) => new Session({ level: level([below('rockL', 700), o('goldS', 100, 1100)]), blastCaps: caps, rng: makeRng(1) });
    const timeHome = (s: Session, useCap: boolean) => {
      for (let i = 0; i < 2000 && Math.abs(s.claw.angleDeg - 90) > 0.5; i++) s.update(1 / 240);
      s.launch();
      let t = 0;
      let used = false;
      while (s.claw.state !== 'swinging' && t < 60) {
        s.update(1 / 60);
        t += 1 / 60;
        if (useCap && !used && s.claw.state === 'retracting') used = s.useBlastCap();
      }
      return t;
    };
    const slow = mk(0);
    const fast = mk(2);
    const tSlow = timeHome(slow, true);
    const tFast = timeHome(fast, true);
    expect(slow.earned).toBe(20); // no cap: normal pull
    expect(fast.earned).toBe(0);
    expect(fast.blastCaps).toBe(1);
    expect(tFast).toBeLessThan(tSlow / 2);
    expect(fast.entities.find((e) => e.type === 'rockL')?.alive).toBe(false);
  });

  it('does nothing without caps or without a load', () => {
    const s = new Session({ level: level([below('goldM', 500), o('goldS', 100, 1100)]), blastCaps: 0, rng: makeRng(1) });
    expect(s.useBlastCap()).toBe(false);
    const s2 = new Session({ level: level([below('goldM', 500)]), blastCaps: 3, rng: makeRng(1) });
    expect(s2.useBlastCap()).toBe(false); // nothing hooked
    expect(s2.blastCaps).toBe(3);
  });
});

describe('timer, win and lose', () => {
  it('loses when time runs out below the target and wins at or above it', () => {
    const lose = new Session({ level: level([o('goldS', 100, 1100)], 100), durationSec: 1, rng: makeRng(1) });
    for (let i = 0; i < 100; i++) lose.update(1 / 60);
    expect(lose.status).toBe('lost');

    const win = new Session({ level: level([o('goldS', 100, 1100)], 100), durationSec: 1, rng: makeRng(1) });
    win.earned = 100;
    for (let i = 0; i < 100; i++) win.update(1 / 60);
    expect(win.status).toBe('won');
  });

  it('a pull in progress finishes before the level ends', () => {
    const s = new Session({ level: level([below('goldL', 700), o('goldS', 100, 1100)], 400), durationSec: 1, rng: makeRng(1) });
    for (let i = 0; i < 2000 && Math.abs(s.claw.angleDeg - 90) > 0.5; i++) s.update(1 / 240);
    // we may have used some of the 1 s; restart the clock for a clean test
    s.timeLeft = 0.2;
    s.launch();
    for (let i = 0; i < 30; i++) s.update(1 / 60);
    expect(s.timeLeft).toBe(0);
    expect(s.status).toBe('playing'); // still pulling
    for (let i = 0; i < 1200 && s.status === 'playing'; i++) s.update(1 / 60);
    expect(s.earned).toBe(500);
    expect(s.status).toBe('won');
  });

  it('ends early when no collectible objects remain (kegs do not count)', () => {
    const s = new Session({ level: level([below('goldS', 400), o('keg', 100, 1100)], 100), rng: makeRng(1) });
    pull(s, 90);
    for (let i = 0; i < 10; i++) s.update(1 / 60);
    expect(s.status).toBe('won');
    expect(s.timeLeft).toBeGreaterThan(40);
  });

  it('stars: 1 at target, 2 at 125 %, 3 at 150 %', () => {
    const s = new Session({ level: level([o('goldS', 100, 1100)], 1000), rng: makeRng(1) });
    s.earned = 999;
    expect(s.stars()).toBe(0);
    s.earned = 1000;
    expect(s.stars()).toBe(1);
    s.earned = 1250;
    expect(s.stars()).toBe(2);
    s.earned = 1500;
    expect(s.stars()).toBe(3);
  });
});

describe('modifiers', () => {
  const play = (type: LevelObject['type'], mods: Partial<typeof NO_MODIFIERS>, seed = 1) => {
    const s = new Session({
      level: level([below(type, 450), o('goldS', 100, 1100)]),
      modifiers: { ...NO_MODIFIERS, ...mods },
      rng: makeRng(seed),
    });
    let t = 0;
    for (let i = 0; i < 2000 && Math.abs(s.claw.angleDeg - 90) > 0.5; i++) s.update(1 / 240);
    s.launch();
    while (s.claw.state !== 'swinging' && t < 60) {
      s.update(1 / 60);
      t += 1 / 60;
    }
    return { earned: s.earned, t };
  };

  it('Gem Lens: diamond x1.5', () => {
    expect(play('diamond', {}).earned).toBe(600);
    expect(play('diamond', { gemLens: true }).earned).toBe(900);
  });
  it('Ore Crusher: rocks x3', () => {
    expect(play('rockS', {}).earned).toBe(10);
    expect(play('rockS', { crusher: true }).earned).toBe(30);
    expect(play('rockL', { crusher: true }).earned).toBe(60);
  });
  it('Turbo Winch Oil: pull speed x1.5', () => {
    const a = play('goldL', {}).t;
    const b = play('goldL', { turbo: true }).t;
    expect(a / b).toBeGreaterThan(1.3);
  });
  it('Lucky Lantern: bag odds and amounts improve', () => {
    let base = 0;
    let lucky = 0;
    for (let seed = 1; seed <= 200; seed++) {
      base += play('bag', {}, seed).earned;
      lucky += play('bag', { lantern: true }, seed).earned;
    }
    expect(lucky).toBeGreaterThan(base * 1.4);
  });
  it('Gem Lens also boosts the diamond a beetle carries', () => {
    const s = new Session({
      level: level([{ type: 'beetle', x: 360, y: 686, laneMinX: 360, laneMaxX: 360, speed: 0, carriesDiamond: true }, o('goldS', 100, 1100)]),
      modifiers: { ...NO_MODIFIERS, gemLens: true },
      rng: makeRng(1),
    });
    pull(s, 90);
    expect(s.earned).toBe(50 + 900);
  });
});

describe('new shop items', () => {
  it('Hourglass adds 15 seconds', () => {
    const a = new Session({ level: level([o('goldS', 100, 1100)]), rng: makeRng(1) });
    const b = new Session({ level: level([o('goldS', 100, 1100)]), modifiers: { ...NO_MODIFIERS, hourglass: true }, rng: makeRng(1) });
    expect(b.timeLeft - a.timeLeft).toBe(15);
  });
  it('Gold Fever: gold x1.5, rocks and diamonds unchanged', () => {
    const play = (type: LevelObject['type']) => {
      const s = new Session({ level: level([below(type, 450), o('goldS', 100, 1100)]), modifiers: { ...NO_MODIFIERS, goldRush: true }, rng: makeRng(1) });
      pull(s, 90);
      return s.earned;
    };
    expect(play('goldM')).toBe(375);
    expect(play('diamond')).toBe(600);
    expect(play('rockS')).toBe(10);
  });
  it('Extra Miner collects the nearest gold on a timer and never takes rocks', () => {
    const s = new Session({
      level: level([o('goldS', 200, 500), o('goldM', 500, 900), o('rockS', 360, 400)], 100000),
      modifiers: { ...NO_MODIFIERS, extraMiner: true },
      rng: makeRng(1),
    });
    for (let t = 0; t < 7.2; t += 1 / 60) s.update(1 / 60);
    expect(s.earned).toBe(100);
    for (let t = 0; t < 7.2; t += 1 / 60) s.update(1 / 60);
    expect(s.earned).toBe(350);
    for (let t = 0; t < 20; t += 1 / 60) s.update(1 / 60);
    expect(s.earned).toBe(350);
    expect(s.entities.find((e) => e.type === 'rockS')?.alive).toBe(true);
  });
});

describe('beetles', () => {
  it('walk inside their lane and bounce at the ends', () => {
    const s = new Session({
      level: level([{ type: 'beetle', x: 200, y: 700, laneMinX: 150, laneMaxX: 250, speed: 80 }, o('goldS', 100, 1100)]),
      rng: makeRng(1),
    });
    let min = 999;
    let max = -999;
    for (let i = 0; i < 600; i++) {
      s.update(1 / 60);
      const b = s.entities[0];
      min = Math.min(min, b.x);
      max = Math.max(max, b.x);
    }
    expect(min).toBeGreaterThanOrEqual(150);
    expect(max).toBeLessThanOrEqual(250);
    expect(max - min).toBeGreaterThan(90);
  });
});
