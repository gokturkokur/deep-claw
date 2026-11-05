import { describe, expect, it } from 'vitest';
import { EGGS } from '../src/config/game';
import { MAX_SPINS } from '../src/config/economy';
import type { LevelDef, LevelObject } from '../src/data/levels';
import { ACHIEVEMENTS, checkAchievements } from '../src/systems/Achievements';
import { wishOnStar } from '../src/systems/Eggs';
import { recordEggs } from '../src/systems/Progress';
import { makeRng } from '../src/systems/Rng';
import { defaultSave, sanitize } from '../src/systems/Save';
import { Session, type SessionOptions } from '../src/systems/Session';

const level = (objects: LevelObject[], target = 100): LevelDef => ({ id: 1, name: 't', target, objects });
const o = (type: LevelObject['type'], x: number, y: number, extra: Partial<LevelObject> = {}): LevelObject => ({ type, x, y, ...extra });
const below = (type: LevelObject['type'], dist: number) => o(type, 360, 236 + dist);
const mk = (objects: LevelObject[], opts: Partial<SessionOptions> = {}) => new Session({ level: level(objects), rng: makeRng(1), ...opts });

/** Aim straight down, throw, and wait until the claw is home again. */
function pullDown(s: Session): void {
  for (let i = 0; i < 4000 && Math.abs(s.claw.angleDeg - 90) > 0.4; i++) s.update(1 / 240);
  s.launch();
  for (let t = 0; t < 40 && s.claw.state !== 'swinging' && s.status === 'playing'; t += 1 / 60) s.update(1 / 60);
  for (let i = 0; i < 20 && s.claw.state !== 'swinging'; i++) s.update(1 / 60);
}
const eggMoments = (s: Session) => s.events.filter((e) => e.type === 'egg').map((e) => (e.type === 'egg' ? e.egg : ''));

describe('easter egg: the beetle gives up its diamond', () => {
  // a diamond beetle standing 60 px right of the straight-down line: every straight throw misses it narrowly
  const field = () => [o('beetle', 420, 640, { laneMinX: 420, laneMaxX: 420, speed: 1, carriesDiamond: true }), o('goldS', 100, 1150)];

  it('3 near misses: the beetle stops and waves; the next throw makes it drop the diamond', () => {
    const s = mk(field());
    const beetle = s.entities.find((e) => e.type === 'beetle')!;
    pullDown(s);
    pullDown(s);
    expect(beetle.nearMisses).toBe(2);
    expect(beetle.waving).toBe(false);
    s.events.length = 0;
    pullDown(s);
    expect(beetle.waving).toBe(true);
    expect(beetle.vx).toBe(0);
    expect(eggMoments(s)).toContain('beetleWave');
    // 4th throw: the diamond drops next to the beetle, the beetle walks on
    s.events.length = 0;
    for (let i = 0; i < 4000 && Math.abs(s.claw.angleDeg - 90) > 0.4; i++) s.update(1 / 240);
    s.launch();
    expect(eggMoments(s)).toContain('beetleDrop');
    expect(beetle.carriesDiamond).toBe(false);
    expect(beetle.waving).toBe(false);
    const gem = s.entities.find((e) => e.type === 'diamond');
    expect(gem?.alive).toBe(true);
    expect(s.events.some((e) => e.type === 'spawn' && e.id === gem?.id)).toBe(true);
    expect(s.eggsFound).toContain('beetle');
  });

  it('throws far from the beetle do not count, and the egg can be turned off', () => {
    const far = mk([o('beetle', 620, 640, { laneMinX: 620, laneMaxX: 620, speed: 1, carriesDiamond: true }), o('goldS', 100, 1150)]);
    for (let i = 0; i < 4; i++) pullDown(far);
    expect(far.entities.find((e) => e.type === 'beetle')!.nearMisses).toBe(0);
    const off = mk(field(), { eggs: false });
    for (let i = 0; i < 4; i++) pullDown(off);
    expect(off.entities.find((e) => e.type === 'beetle')!.waving).toBe(false);
  });
});

describe('easter egg: Dusty gets bored', () => {
  // a fan of small gold all around, so the claw hits something wherever it points
  const fan = () => Array.from({ length: 15 }, (_, i) => {
    const a = ((20 + i * 10) * Math.PI) / 180;
    return o('goldS', 360 + Math.cos(a) * 300, 236 + Math.sin(a) * 300);
  });

  it(`after ${EGGS.idle.afterSec} s without a throw the claw goes by itself and that pull pays +${EGGS.idle.bonus * 100}%`, () => {
    const s = mk(fan());
    for (let i = 0; i < (EGGS.idle.afterSec - 1) * 60; i++) s.update(1 / 60);
    expect(s.claw.state).toBe('swinging');
    for (let i = 0; i < 90 && s.claw.state === 'swinging'; i++) s.update(1 / 60);
    expect(s.claw.state).not.toBe('swinging');
    expect(eggMoments(s)).toContain('idle');
    expect(s.eggsFound).toContain('idle');
    for (let i = 0; i < 600 && s.claw.state !== 'swinging'; i++) s.update(1 / 60);
    expect(s.earned).toBe(Math.round(100 * (1 + EGGS.idle.bonus)));
    // the next pull is paid normally
    const before = s.earned;
    pullDown(s);
    expect(s.earned - before).toBeLessThanOrEqual(100 * 1.5); // combo only, no idle bonus
  });

  it('does not happen once the player has thrown, or when eggs are off', () => {
    const s = mk(fan());
    pullDown(s);
    for (let i = 0; i < 40 * 60; i++) s.update(1 / 60);
    expect(s.eggsFound).not.toContain('idle');
    const off = mk(fan(), { eggs: false });
    for (let i = 0; i < 40 * 60; i++) off.update(1 / 60);
    expect(off.claw.state).toBe('swinging');
  });
});

describe('easter egg: keg fireworks', () => {
  it(`${EGGS.fireworks.minKegs} kegs in one chain = fireworks`, () => {
    const s = mk([below('keg', 400), o('keg', 480, 636), o('keg', 600, 636), o('keg', 600, 780), o('goldS', 100, 1150)]);
    pullDown(s);
    const fw = s.events.find((e) => e.type === 'egg' && e.egg === 'fireworks');
    expect(fw).toBeTruthy();
    expect(fw?.type === 'egg' && fw.n).toBe(4);
    expect(s.eggsFound).toContain('fireworks');
  });

  it('a smaller chain is just a normal explosion', () => {
    const s = mk([below('keg', 400), o('keg', 480, 636), o('keg', 600, 636), o('goldS', 100, 1150)]);
    pullDown(s);
    expect(s.stats.kegs).toBe(3);
    expect(s.eggsFound).not.toContain('fireworks');
  });
});

describe("easter egg: Baron's vault", () => {
  const field = () => [below('rockS', 300), below('rockL', 600), o('goldL', 100, 1100)];

  it('boss level: every rock up before any gold makes the vault appear', () => {
    const s = mk(field(), { boss: true });
    pullDown(s);
    expect(s.eggsFound).not.toContain('vault');
    pullDown(s);
    const vault = s.entities.find((e) => e.type === 'chest');
    expect(vault?.alive).toBe(true);
    expect(vault?.valueOverride).toBe(EGGS.vault.value);
    expect(eggMoments(s)).toContain('vault');
    expect(s.eggsFound).toContain('vault');
  });

  it('pays the vault value when pulled up', () => {
    const s2 = mk([below('rockS', 250), below('rockS', 450), o('goldL', 620, 1150)], { boss: true });
    pullDown(s2);
    pullDown(s2);
    const vault = s2.entities.find((e) => e.type === 'chest')!;
    // move the vault straight below and pull it up
    vault.x = 360;
    vault.y = 236 + 300;
    vault.shape.x = vault.x;
    vault.shape.y = vault.y;
    (s2 as unknown as { shapesDirty: boolean }).shapesDirty = true;
    const before = s2.earned;
    pullDown(s2);
    expect(s2.earned - before).toBe(EGGS.vault.value);
  });

  it('not on normal levels, and not if gold was taken first', () => {
    const normal = mk(field(), { boss: false });
    pullDown(normal);
    pullDown(normal);
    expect(normal.entities.some((e) => e.type === 'chest')).toBe(false);
    const greedy = mk([below('goldS', 200), below('rockS', 400), below('rockL', 650), o('goldL', 100, 1100)], { boss: true });
    pullDown(greedy);
    pullDown(greedy);
    pullDown(greedy);
    expect(greedy.entities.some((e) => e.type === 'chest')).toBe(false);
  });
});

describe('easter egg: lucky bag', () => {
  it(`after ${EGGS.bag.streak} identical prizes the next bag is a jackpot`, () => {
    const s = mk([below('bag', 400), o('goldS', 100, 1150)], { bagStreak: { kind: 'item', count: EGGS.bag.streak } });
    pullDown(s);
    expect(s.earned).toBe(EGGS.bag.jackpot);
    expect(eggMoments(s)).toContain('jackpot');
    expect(s.bagStreak).toEqual({ kind: '', count: 0 });
    expect(s.eggsFound).toContain('bag');
  });

  it('the streak counts same kinds in a row and restarts on a different kind', () => {
    const s = mk([below('bag', 400), o('goldS', 100, 1150)], { bagStreak: { kind: 'nothing', count: 2 } });
    pullDown(s);
    const kind = s.events.find((e) => e.type === 'collect')!;
    expect(kind.type === 'collect' && kind.bag).toBeTruthy();
    expect(s.bagStreak.count).toBe(1);
    expect(s.bagStreak.kind).toBe(kind.type === 'collect' ? kind.bag?.kind : '');
    const same = mk([below('bag', 400), o('goldS', 100, 1150)], { bagStreak: { kind: s.bagStreak.kind, count: 1 } });
    pullDown(same);
    // same seed, same roll: the streak grows
    expect(same.bagStreak).toEqual({ kind: s.bagStreak.kind, count: 2 });
  });
});

describe('easter egg: shooting star', () => {
  it('first wish of the day gives one spin, later ones that day do not', () => {
    const save = defaultSave();
    expect(wishOnStar(save, '2026-11-05')).toBe('spin');
    expect(save.spins).toBe(1);
    expect(save.eggs.found).toContain('star');
    expect(wishOnStar(save, '2026-11-05')).toBe('already');
    expect(save.spins).toBe(1);
    expect(wishOnStar(save, '2026-11-06')).toBe('spin');
    expect(save.spins).toBe(2);
    save.spins = MAX_SPINS;
    wishOnStar(save, '2026-11-07');
    expect(save.spins).toBe(MAX_SPINS);
  });
});

describe('easter eggs: save and hidden achievements', () => {
  it('found eggs and the bag streak are saved and survive a reload', () => {
    const save = defaultSave();
    recordEggs(save, ['vault', 'idle', 'vault'], { kind: 'money', count: 2 });
    const back = sanitize(JSON.parse(JSON.stringify(save)));
    expect(back.eggs.found.sort()).toEqual(['idle', 'vault']);
    expect(back.eggs.bagKind).toBe('money');
    expect(back.eggs.bagCount).toBe(2);
    expect(sanitize({ ...save, eggs: 'broken' }).eggs).toEqual(defaultSave().eggs);
  });

  it('each egg unlocks one hidden achievement and pays it once', () => {
    const save = defaultSave();
    const hidden = ACHIEVEMENTS.filter((a) => a.hidden);
    expect(hidden.map((a) => a.id).sort()).toEqual(['egg_bag', 'egg_beetle', 'egg_fireworks', 'egg_idle', 'egg_kaboom', 'egg_star', 'egg_vault']);
    expect(checkAchievements(save).filter((a) => a.hidden)).toEqual([]);
    save.eggs.found.push('fireworks');
    const fresh = checkAchievements(save);
    expect(fresh.map((a) => a.id)).toEqual(['egg_fireworks']);
    expect(save.wallet).toBe(fresh[0].reward);
    expect(checkAchievements(save)).toEqual([]);
  });

  it('the mega blast counts as an egg too', () => {
    const s = new Session({
      level: level([below('keg', 400), o('goldS', 100, 1150)]),
      modifiers: { turbo: false, lantern: false, gemLens: false, crusher: false, hourglass: false, goldRush: false, extraMiner: false, magnet: false, defuser: true },
      blastCaps: 1,
      rng: makeRng(1),
    });
    for (let i = 0; i < 4000 && Math.abs(s.claw.angleDeg - 90) > 0.4; i++) s.update(1 / 240);
    s.launch();
    for (let i = 0; i < 600 && s.claw.state !== 'retracting'; i++) s.update(1 / 60);
    s.useBlastCap();
    expect(s.eggsFound).toEqual(['kaboom']);
  });
});
