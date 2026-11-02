import { describe, expect, it } from 'vitest';
import { MAGNET, MAGNET_ITEMS, MAGNET_LEVEL, type MagnetLevelDef, type MagnetPlacement } from '../src/config/magnet';
import { WORLD } from '../src/config/game';
import { sweep } from '../src/systems/Collision';
import { defaultSettings, type MagnetSettings } from '../src/systems/MagnetSettings';
import { MagnetSession, pullSpeed, type MagnetEvent } from '../src/systems/MagnetSession';
import { makeRng } from '../src/systems/Rng';

/** Pull off by default so each test switches on only what it checks. */
const cfg = (o: Partial<MagnetSettings> = {}): MagnetSettings => ({ ...defaultSettings(), pullRadius: 0, capacity: 20, mode: 'sweep', ...o });
const level = (items: MagnetPlacement[]): MagnetLevelDef => ({ id: 't', name: 't', durationSec: 60, target: 1, swingMult: 1, items });
const make = (items: MagnetPlacement[], o: Partial<MagnetSettings> = {}) => new MagnetSession({ level: level(items), settings: cfg(o), rng: makeRng(7) });

/** One full dive at a fixed angle until the magnet is home again. Returns all events. */
function dive(s: MagnetSession, angleDeg = 90, dt = 1 / 60): MagnetEvent[] {
  const out: MagnetEvent[] = [];
  s.claw.angleDeg = angleDeg;
  expect(s.launch()).toBe(true);
  for (let t = 0; t < 40; t += dt) {
    s.update(dt);
    out.push(...s.events);
    s.events.length = 0;
    if (s.claw.state === 'swinging' || s.status !== 'playing') break;
  }
  return out;
}
const kinds = (ev: MagnetEvent[], type: MagnetEvent['type']) => ev.filter((e) => e.type === type);

describe('pull field', () => {
  it('pull speed falls with distance and with weight, and is zero outside the radius', () => {
    const near = pullSpeed(40, 240, 700, 1);
    const far = pullSpeed(200, 240, 700, 1);
    expect(near).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);
    expect(pullSpeed(240, 240, 700, 1)).toBe(0);
    expect(pullSpeed(500, 240, 700, 1)).toBe(0);
    expect(pullSpeed(100, 240, 700, 1)).toBeCloseTo(pullSpeed(100, 240, 700, 4) * 4, 6);
  });

  it('pulls metal that the magnet passes by, but never a non-metal item', () => {
    const s = make(
      [
        { kind: 'coins', x: 360 + 150, y: 600 },
        { kind: 'tire', x: 360 - 150, y: 600 },
      ],
      { pullRadius: 260, pullStrength: 1600 },
    );
    const ev = dive(s);
    // 150 px to the side is far outside the swept path (34 + 26): only the field can have taken it
    expect(kinds(ev, 'attach')).toHaveLength(1);
    expect(s.earned).toBe(MAGNET_ITEMS.coins.value);
    const tire = s.entities[1];
    expect(tire.alive).toBe(true);
    expect([tire.x, tire.y]).toEqual([210, 600]);
    expect(tire.pulled).toBe(false);
  });

  it('does not pull anything outside the radius', () => {
    const s = make([{ kind: 'coins', x: 360 + 300, y: 600 }], { pullRadius: 240, pullStrength: 1600 });
    const ev = dive(s);
    expect(kinds(ev, 'attach')).toHaveLength(0);
    expect(s.earned).toBe(0);
    expect([s.entities[0].x, s.entities[0].y]).toEqual([660, 600]);
  });

  it('heavy items come in more slowly than light ones from the same distance', () => {
    const s = make(
      [
        { kind: 'coins', x: 360 - 150, y: 600 },
        { kind: 'bike', x: 360 + 150, y: 600 },
      ],
      { pullRadius: 300, pullStrength: 700 },
    );
    s.claw.angleDeg = 90;
    s.launch();
    let n = 0;
    while (s.claw.state === 'launching' && s.claw.length < 560 - 40 && n++ < 600) s.update(1 / 60);
    const coin = s.entities[0];
    const bike = s.entities[1];
    expect(coin.pulled || coin.attached).toBe(true);
    const movedCoin = Math.hypot(coin.x - 210, coin.y - 600);
    const movedBike = Math.hypot(bike.x - 510, bike.y - 600);
    expect(movedCoin).toBeGreaterThan(movedBike * 3);
  });
});

describe('sticking and capacity', () => {
  it('several items can stick in one dive and are all delivered', () => {
    const s = make([
      { kind: 'coins', x: 360, y: 500 },
      { kind: 'keys', x: 360, y: 640 },
      { kind: 'knife', x: 360, y: 780 },
    ]);
    const ev = dive(s);
    expect(kinds(ev, 'attach')).toHaveLength(3);
    expect(kinds(ev, 'collect')).toHaveLength(3);
    expect(s.earned).toBe(MAGNET_ITEMS.coins.value + MAGNET_ITEMS.keys.value + MAGNET_ITEMS.knife.value);
  });

  it('turns back when the capacity is full', () => {
    const s = make(
      [
        { kind: 'keys', x: 360, y: 500 },
        { kind: 'keys', x: 360, y: 640 },
        { kind: 'keys', x: 360, y: 780 },
        { kind: 'keys', x: 360, y: 920 },
      ],
      { capacity: 2 },
    );
    const ev = dive(s);
    expect(kinds(ev, 'attach')).toHaveLength(2);
    expect(ev.find((e) => e.type === 'recall')).toMatchObject({ reason: 'full' });
    expect(s.earned).toBe(2 * MAGNET_ITEMS.keys.value);
    expect(s.entities.filter((e) => e.alive)).toHaveLength(2);
  });

  it('metal that is too heavy for the remaining capacity is an obstacle, not a pickup', () => {
    const s = make([{ kind: 'cart', x: 360, y: 600 }], { capacity: 4 });
    const ev = dive(s);
    expect(kinds(ev, 'attach')).toHaveLength(0);
    expect(kinds(ev, 'stuck')).toHaveLength(1);
    expect(s.entities[0].alive).toBe(true);
  });

  it('retract speed follows the Deep Claw formula with the total carried weight', () => {
    const s = make([
      { kind: 'keys', x: 360, y: 500 },
      { kind: 'bike', x: 360, y: 700 },
    ]);
    s.claw.angleDeg = 90;
    s.launch();
    for (let i = 0; i < 600 && s.claw.state !== 'retracting'; i++) s.update(1 / 60);
    s.update(1 / 60);
    const w = MAGNET_ITEMS.keys.weight + MAGNET_ITEMS.bike.weight;
    expect(s.load).toBeCloseTo(w, 9);
    expect(-s.claw.speed).toBeCloseTo((MAGNET.claw.baseRetractSpeed * MAGNET.retractStrength) / w, 6);
  });

  it('an empty magnet returns at the fast empty speed', () => {
    const s = make([]);
    s.claw.angleDeg = 90;
    s.launch();
    for (let i = 0; i < 600 && s.claw.state !== 'retracting'; i++) s.update(1 / 60);
    s.update(1 / 60);
    expect(-s.claw.speed).toBe(MAGNET.claw.emptyRetractSpeed);
  });
});

describe('non-metal items', () => {
  it('the magnet gets stuck on a tyre and comes home with what it already carries', () => {
    const s = make([
      { kind: 'keys', x: 360, y: 450 },
      { kind: 'tire', x: 360, y: 650 },
      { kind: 'coins', x: 360, y: 850 },
    ]);
    const ev = dive(s);
    expect(kinds(ev, 'stuck')).toHaveLength(1);
    expect(kinds(ev, 'collect')).toHaveLength(1);
    expect(s.earned).toBe(MAGNET_ITEMS.keys.value);
    expect(s.entities[1].alive).toBe(true);
    expect(s.entities[2].alive).toBe(true);
    expect(s.entities[2].attached).toBe(false);
    expect(s.claw.length).toBeLessThan(90);
  });

  it('boots and stones stop it too', () => {
    for (const kind of ['boot', 'stone'] as const) {
      const s = make([{ kind, x: 360, y: 600 }]);
      expect(kinds(dive(s), 'stuck')).toHaveLength(1);
      expect(s.earned).toBe(0);
    }
  });
});

describe('one stick, one delivery', () => {
  it('a long messy game never sticks or delivers anything twice', () => {
    const s = new MagnetSession({ level: MAGNET_LEVEL, settings: cfg({ pullRadius: 300, pullStrength: 900, capacity: 8 }), rng: makeRng(3) });
    const collected: number[] = [];
    let sum = 0;
    for (let i = 0; i < 80 && s.status === 'playing'; i++) {
      const ev = dive(s, 25 + ((i * 37) % 130), i % 3 === 0 ? 0.05 : 1 / 60);
      for (const e of kinds(ev, 'collect') as Array<Extract<MagnetEvent, { type: 'collect' }>>) {
        collected.push(e.id);
        sum += e.value;
      }
      s.timeLeft = 60;
    }
    expect(new Set(collected).size).toBe(collected.length);
    expect(collected.length).toBeGreaterThan(3);
    expect(sum).toBe(s.earned);
    for (const e of s.entities) expect(e.attachCount).toBeLessThanOrEqual(1);
  });

  it('a delivered item is gone for good', () => {
    const s = make([{ kind: 'coins', x: 360, y: 500 }, { kind: 'keys', x: 150, y: 900 }]);
    dive(s);
    expect(s.entities[0].alive).toBe(false);
    expect(s.entities[0].collected).toBe(true);
    dive(s);
    expect(s.earned).toBe(MAGNET_ITEMS.coins.value);
  });
});

describe('no tunnelling at low frame rates', () => {
  it('50 ms steps at the fastest descent still catch a small item at every depth and offset', () => {
    let missed = 0;
    for (let y = 400; y <= 470; y += 3) {
      for (const dx of [0, 30, 55]) {
        const s = make([{ kind: 'coins', x: 360 + dx, y }], { descentSpeed: 1500, mode: 'firstStick' });
        const ev = dive(s, 90, 0.05);
        if (kinds(ev, 'attach').length !== 1) missed++;
      }
    }
    expect(missed).toBe(0);
  });

  it('50 ms steps still stop the magnet on a non-metal item', () => {
    for (let y = 450; y <= 520; y += 4) {
      const s = make([{ kind: 'tire', x: 360, y }, { kind: 'coins', x: 360, y: y + 200 }], { descentSpeed: 1500 });
      const ev = dive(s, 90, 0.05);
      expect(kinds(ev, 'stuck')).toHaveLength(1);
      expect(s.entities[1].alive).toBe(true);
    }
  });

  it('a pulled item never overshoots the magnet face', () => {
    const s = make([{ kind: 'coins', x: 420, y: 330 }], { pullRadius: 400, pullStrength: 1600, descentSpeed: 300 });
    dive(s, 90, 0.05);
    expect(s.entities[0].attachCount).toBe(1);
    expect(s.earned).toBe(MAGNET_ITEMS.coins.value);
  });
});

describe('the two behaviours', () => {
  const column: MagnetPlacement[] = [
    { kind: 'coins', x: 360, y: 500 },
    { kind: 'keys', x: 360, y: 700 },
    { kind: 'knife', x: 360, y: 900 },
  ];

  it('first-stick: turns back after the very first item', () => {
    const s = make(column, { mode: 'firstStick' });
    const ev = dive(s);
    expect(kinds(ev, 'attach')).toHaveLength(1);
    expect(ev.find((e) => e.type === 'recall')).toMatchObject({ reason: 'first' });
    expect(s.earned).toBe(MAGNET_ITEMS.coins.value);
  });

  it('sweep: keeps diving through everything until the edge of the play area', () => {
    const s = make(column, { mode: 'sweep' });
    const ev = dive(s);
    expect(kinds(ev, 'attach')).toHaveLength(3);
    expect(kinds(ev, 'recall')).toHaveLength(0);
    expect(kinds(ev, 'miss')).toHaveLength(1);
  });

  it('sweep: also ends on a full load or on a non-metal item', () => {
    const full = make(column, { mode: 'sweep', capacity: 1.4 });
    expect(dive(full).find((e) => e.type === 'recall')).toMatchObject({ reason: 'full' });
    const blocked = make([column[0], { kind: 'boot', x: 360, y: 650 }, column[2]], { mode: 'sweep' });
    const ev = dive(blocked);
    expect(kinds(ev, 'stuck')).toHaveLength(1);
    expect(kinds(ev, 'attach')).toHaveLength(1);
  });

  it('switching the mode between dives takes effect immediately', () => {
    const s = make(column, { mode: 'sweep' });
    s.settings.mode = 'firstStick';
    expect(kinds(dive(s), 'attach')).toHaveLength(1);
  });
});

describe('old grenade', () => {
  it('goes off when it sticks: destroys things inside the keg radius, spares the rest, ends the dive', () => {
    const s = make([
      { kind: 'grenade', x: 360, y: 500 },
      { kind: 'bike', x: 360 + 110, y: 560 },
      { kind: 'keys', x: 360, y: 1000 },
    ]);
    const ev = dive(s);
    expect(kinds(ev, 'explode')).toHaveLength(1);
    expect(kinds(ev, 'destroyed')).toHaveLength(1);
    expect(s.entities[1].alive).toBe(false);
    expect(s.entities[2].alive).toBe(true);
    expect(ev.find((e) => e.type === 'recall')).toMatchObject({ reason: 'explosion' });
    expect(s.earned).toBe(0);
  });

  it('chains into a second grenade', () => {
    const s = make([
      { kind: 'grenade', x: 360, y: 500 },
      { kind: 'grenade', x: 360 + 120, y: 540 },
      { kind: 'coins', x: 700, y: 540 },
    ]);
    const ev = dive(s);
    expect(kinds(ev, 'explode')).toHaveLength(2);
    expect(s.entities[2].alive).toBe(true);
  });

  it('also destroys what the magnet already carries (it hangs right next to it)', () => {
    const s = make([{ kind: 'keys', x: 360, y: 450 }, { kind: 'grenade', x: 360, y: 560 }]);
    dive(s);
    expect(s.earned).toBe(0);
    expect(s.load).toBe(0);
  });

  it('does nothing until it actually touches the magnet', () => {
    const s = make([{ kind: 'grenade', x: 600, y: 600 }, { kind: 'keys', x: 360, y: 500 }], { pullRadius: 100 });
    const ev = dive(s);
    expect(kinds(ev, 'explode')).toHaveLength(0);
    expect(s.earned).toBe(MAGNET_ITEMS.keys.value);
  });
});

describe('level "Kanal Testi"', () => {
  const items = MAGNET_LEVEL.items;
  const total = items.reduce((n, p) => n + MAGNET_ITEMS[p.kind].value, 0);

  it('keeps everything in the play field and nothing overlaps at the start', () => {
    for (const p of items) {
      expect(p.x).toBeGreaterThanOrEqual(WORLD.fieldMinX);
      expect(p.x).toBeLessThanOrEqual(WORLD.fieldMaxX);
      expect(p.y).toBeGreaterThanOrEqual(WORLD.fieldMinY);
      expect(p.y).toBeLessThanOrEqual(WORLD.fieldMaxY);
    }
    const r = (p: MagnetPlacement) => {
      const d = MAGNET_ITEMS[p.kind].shape;
      return d.kind === 'circle' ? d.r : Math.max(d.hw, d.hh);
    };
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++) expect(Math.hypot(items[i].x - items[j].x, items[i].y - items[j].y)).toBeGreaterThan(r(items[i]) + r(items[j]));
  });

  it('has metal and non-metal items, a target that is not trivial, and one of each trap', () => {
    expect(items.some((p) => !MAGNET_ITEMS[p.kind].metal)).toBe(true);
    expect(items.some((p) => p.kind === 'grenade')).toBe(true);
    expect(MAGNET_LEVEL.target).toBeLessThan(total * 0.7);
    expect(MAGNET_LEVEL.target).toBeGreaterThan(total * 0.3);
  });

  it('a valuable item can be reached by the straight shot from the start', () => {
    const shapes = items.map((p, i) => ({ ...shapeOf(p), id: i }));
    const ray = sweep(shapes, WORLD.pivotX, WORLD.pivotY + 84, WORLD.pivotX, 1300, 0);
    expect(ray).not.toBeNull();
    expect(MAGNET_ITEMS[items[ray!.id].kind].metal).toBe(true);
    expect(MAGNET_ITEMS[items[ray!.id].kind].value).toBeGreaterThanOrEqual(50);
  });

  it('the safe hides behind the tyre on the straight line, yet some angle still gets it (default settings)', () => {
    const safeIdx = items.findIndex((p) => p.kind === 'safe');
    const safe = items[safeIdx];
    const direct = Math.atan2(safe.y - WORLD.pivotY, safe.x - WORLD.pivotX) * (180 / Math.PI);
    const first = new MagnetSession({ level: MAGNET_LEVEL, settings: { ...defaultSettings(), mode: 'sweep' }, rng: makeRng(1) });
    const evDirect = dive(first, direct);
    expect(kinds(evDirect, 'stuck')).toHaveLength(1);
    expect(first.entities[safeIdx].alive).toBe(true);

    const winners: number[] = [];
    for (let a = 20; a <= 160; a += 0.5) {
      const s = new MagnetSession({ level: MAGNET_LEVEL, settings: { ...defaultSettings(), mode: 'sweep' }, rng: makeRng(1) });
      dive(s, a);
      if (s.entities[safeIdx].collected) winners.push(a);
    }
    expect(winners.length).toBeGreaterThan(0);
  });
});

function shapeOf(p: MagnetPlacement) {
  const d = MAGNET_ITEMS[p.kind].shape;
  return {
    kind: d.kind,
    x: p.x,
    y: p.y,
    r: d.kind === 'circle' ? d.r : 0,
    hw: d.kind === 'rect' ? d.hw : 0,
    hh: d.kind === 'rect' ? d.hh : 0,
  };
}
