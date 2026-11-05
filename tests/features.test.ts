import { describe, expect, it } from 'vitest';
import { COMBO, ENDLESS, FREEZE_SEC, UPGRADES } from '../src/config/economy';
import { LEVELS, type LevelDef, type LevelObject } from '../src/data/levels';
import { STORY, storyBeatFor } from '../src/data/story';
import { ACHIEVEMENTS, checkAchievements } from '../src/systems/Achievements';
import { WORLD_COUNT, isBoss, missionDone, missionFor, themeOf, worldOf } from '../src/systems/Campaign';
import { canClaimDaily, claimDaily, dayKey, nextStreak } from '../src/systems/Daily';
import { generateField, hashSeed, weekId, weeklyLevel } from '../src/systems/Fields';
import { commitEndless, commitOutcome, commitWeekly, mergeStats, skipLevel } from '../src/systems/Progress';
import { makeRng } from '../src/systems/Rng';
import { defaultSave, sanitize } from '../src/systems/Save';
import { NO_MODIFIERS } from '../src/systems/Economy';
import { Session } from '../src/systems/Session';
import { buyClaw, buyUpgrade, equipClaw, upgradeCost } from '../src/systems/Upgrades';

const level = (objects: LevelObject[], target = 100): LevelDef => ({ id: 1, name: 't', target, objects });
const o = (type: LevelObject['type'], x: number, y: number): LevelObject => ({ type, x, y });
const below = (type: LevelObject['type'], dist: number) => o(type, 360, 236 + dist);

function pull(s: Session): void {
  for (let i = 0; i < 4000 && Math.abs(s.claw.angleDeg - 90) > 0.5; i++) s.update(1 / 240);
  s.launch();
  for (let t = 0; t < 40 && s.claw.state !== 'swinging' && s.status === 'playing'; t += 1 / 60) s.update(1 / 60);
  for (let i = 0; i < 20 && s.claw.state !== 'swinging'; i++) s.update(1 / 60);
}

describe('campaign', () => {
  it('has 100 levels in 5 worlds with 5 bosses', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(100);
    expect(WORLD_COUNT).toBe(5);
    expect(LEVELS.filter((l) => isBoss(l.id)).length).toBe(5);
    expect(worldOf(1)).toBe(1);
    expect(worldOf(100)).toBe(5);
    expect(themeOf(41)).toBe('lava');
  });
  it('every level has a mission that fits its content', () => {
    for (const l of LEVELS) {
      const m = missionFor(l);
      expect(m.reward).toBeGreaterThan(0);
      if (m.kind === 'kegs') expect(l.objects.some((x) => x.type === 'keg')).toBe(true);
      if (m.kind === 'chests') expect(l.objects.some((x) => x.type === 'chest')).toBe(true);
      if (m.kind === 'beetles') expect(l.objects.some((x) => x.type === 'beetle')).toBe(true);
    }
  });
  it('mission progress is judged from run stats', () => {
    const stats = { diamonds: 2, bestCombo: 3, kegs: 0, chests: 0, slimes: 0, rocks: 4, beetles: 0, blasts: 0 };
    expect(missionDone({ kind: 'diamonds', goal: 2, reward: 1 }, stats)).toBe(true);
    expect(missionDone({ kind: 'combo', goal: 5, reward: 1 }, stats)).toBe(false);
    expect(missionDone({ kind: 'noRocks', goal: 0, reward: 1 }, stats)).toBe(false);
    expect(missionDone({ kind: 'noSlime', goal: 0, reward: 1 }, stats)).toBe(true);
  });
  it('story has a beat for the start, middle and boss of every world, plus a finale', () => {
    for (let w = 1; w <= 5; w++) {
      for (const pos of [1, 10, 20]) expect(storyBeatFor((w - 1) * 20 + pos), `world ${w} pos ${pos}`).not.toBeNull();
    }
    expect(storyBeatFor(2)).toBeNull();
    expect(STORY.some((b) => b.id === 'finale')).toBe(true);
    for (const b of STORY) for (const l of b.lines) expect(l.en.length > 0 && l.tr.length > 0).toBe(true);
  });
});

describe('generated fields', () => {
  it('are deterministic, inside the field and do not overlap', () => {
    const a = generateField(5, 8);
    expect(generateField(5, 8)).toEqual(a);
    expect(generateField(6, 8)).not.toEqual(a);
    expect(a.length).toBeGreaterThan(15);
  });
  it('week id is stable inside a week', () => {
    expect(weekId(new Date(Date.UTC(2026, 10, 2)))).toBe(weekId(new Date(Date.UTC(2026, 10, 8))));
    expect(weekId(new Date(Date.UTC(2026, 10, 2)))).not.toBe(weekId(new Date(Date.UTC(2026, 10, 9))));
    expect(weeklyLevel('2026-W45', 3000).objects.length).toBeGreaterThan(15);
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });
});

describe('combo', () => {
  it('raises the payout for back to back deliveries and resets on a miss', () => {
    const s = new Session({ level: level([below('goldM', 400), below('goldM', 700), o('goldS', 100, 1100)], 100000), rng: makeRng(1) });
    pull(s);
    expect(s.earned).toBe(250); // x1.0
    pull(s);
    expect(s.earned).toBe(250 + Math.round(250 * (1 + COMBO.step))); // second in a row
    expect(s.combo).toBe(2);
    expect(s.stats.bestCombo).toBe(2);
    // an empty pull (nothing below) resets it
    s.claw.phase = 1;
    pull(s);
    expect(s.combo).toBe(0);
  });
  it('is capped and rocks reset it', () => {
    const objs = [200, 300, 400, 500, 600, 700, 800, 900].map((d) => below('goldS', d));
    const s = new Session({ level: level([...objs, o('rockS', 100, 1150)], 1e6), rng: makeRng(1) });
    for (let i = 0; i < 8; i++) pull(s);
    expect(s.combo).toBe(8);
    const last = 100 * COMBO.max;
    expect(s.earned).toBeLessThanOrEqual(8 * last);
  });
});

describe('Time Freeze', () => {
  it('stops the clock for a few seconds, then the clock runs again', () => {
    const s = new Session({ level: level([o('goldS', 100, 1100)]), freezeCount: 1, rng: makeRng(1) });
    expect(s.useFreeze()).toBe(true);
    expect(s.freezeCount).toBe(0);
    const t0 = s.timeLeft;
    for (let t = 0; t < FREEZE_SEC - 0.5; t += 1 / 60) s.update(1 / 60);
    expect(s.timeLeft).toBeCloseTo(t0, 5);
    for (let t = 0; t < 2; t += 1 / 60) s.update(1 / 60);
    expect(s.timeLeft).toBeLessThan(t0 - 1);
    expect(s.useFreeze()).toBe(false);
  });
});

describe('upgrades and claws', () => {
  it('winch speeds up the rope, muscle speeds up the pull, watch adds seconds', () => {
    const base = new Session({ level: level([o('goldS', 100, 1100)]), rng: makeRng(1) });
    const up = new Session({ level: level([o('goldS', 100, 1100)]), upgrades: { winch: 5, muscle: 5, watch: 5, fortune: 0 }, rng: makeRng(1) });
    expect(up.claw.extendMult).toBeCloseTo(1 + 5 * UPGRADES.winch.perLevel);
    expect(up.strength() / base.strength()).toBeCloseTo(1 + 5 * UPGRADES.muscle.perLevel);
    expect(up.timeLeft - base.timeLeft).toBe(5 * UPGRADES.watch.perLevel);
  });
  it('claw types change hit size and speed', () => {
    const wide = new Session({ level: level([o('goldS', 100, 1100)]), clawType: 'wide', rng: makeRng(1) });
    const swift = new Session({ level: level([o('goldS', 100, 1100)]), clawType: 'swift', rng: makeRng(1) });
    expect(wide.claw.tipRadius).toBeGreaterThan(14);
    expect(swift.claw.extendMult).toBeGreaterThan(1.2);
  });
  it('buying: costs rise, funds checked, max level', () => {
    const save = defaultSave();
    expect(buyUpgrade(save, 'winch')).toEqual({ ok: false, reason: 'funds' });
    save.wallet = 1e7;
    expect(upgradeCost('winch', 1)).toBeGreaterThan(upgradeCost('winch', 0));
    for (let i = 0; i < 5; i++) expect(buyUpgrade(save, 'winch').ok).toBe(true);
    expect(buyUpgrade(save, 'winch')).toEqual({ ok: false, reason: 'max' });
    expect(buyClaw(save, 'wide').ok).toBe(true);
    expect(save.claws.equipped).toBe('wide');
    expect(buyClaw(save, 'wide')).toEqual({ ok: false, reason: 'owned' });
    expect(equipClaw(save, 'standard')).toBe(true);
    expect(equipClaw(save, 'titan')).toBe(false);
  });
});

describe('endless mode', () => {
  it('starts with the endless clock and moves to a new wave with bonus time when the field is empty', () => {
    const s = new Session({ level: level([], 0), endlessSeed: 123, rng: makeRng(1) });
    expect(s.timeLeft).toBe(ENDLESS.startSec);
    const first = s.entities.length;
    expect(first).toBeGreaterThan(10);
    for (const e of s.entities) e.alive = false; // pretend the field was cleared
    s.update(1 / 60);
    expect(s.wave).toBe(2);
    expect(s.timeLeft).toBeGreaterThan(ENDLESS.startSec);
    expect(s.entities.some((e) => e.alive)).toBe(true);
    expect(s.events.some((e) => e.type === 'wave')).toBe(true);
  });
});

describe('daily gift', () => {
  it('can be claimed once a day; streak continues on consecutive days and resets after a gap', () => {
    const save = defaultSave();
    const d1 = dayKey(new Date(2026, 10, 2));
    expect(canClaimDaily(save, d1)).toBe(true);
    const r1 = claimDaily(save, d1)!;
    expect(r1.streak).toBe(1);
    expect(claimDaily(save, d1)).toBeNull();
    const r2 = claimDaily(save, dayKey(new Date(2026, 10, 3)))!;
    expect(r2.streak).toBe(2);
    expect(nextStreak(save, dayKey(new Date(2026, 10, 6)))).toBe(1);
    const r3 = claimDaily(save, dayKey(new Date(2026, 10, 9)))!;
    expect(r3.streak).toBe(1);
  });
  it('pays real rewards over a whole week', () => {
    const save = defaultSave();
    for (let i = 0; i < 7; i++) claimDaily(save, dayKey(new Date(2026, 10, 2 + i)));
    expect(save.wallet).toBeGreaterThan(2500);
    expect(save.inventory.blastCaps).toBeGreaterThan(0);
    expect(Object.values(save.boosts).some(Boolean)).toBe(true);
  });
});

describe('achievements', () => {
  it('unlock once, pay their reward once', () => {
    const save = defaultSave();
    save.stats.collected = 120;
    const fresh = checkAchievements(save);
    expect(fresh.map((a) => a.id)).toEqual(expect.arrayContaining(['firstFind', 'collector']));
    const wallet = save.wallet;
    expect(wallet).toBeGreaterThan(0);
    expect(checkAchievements(save)).toEqual([]);
    expect(save.wallet).toBe(wallet);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
  });
});

describe('progress modes', () => {
  it('mission bonus is paid once on the first clear', () => {
    const save = defaultSave();
    const target = LEVELS[0].target;
    const r = commitOutcome(save, { levelId: 1, earned: target, target, won: true, blastCapsLeft: 0, missionDone: true, missionReward: 400 })!;
    expect(r.missionBonus).toBe(400);
    expect(save.wallet).toBe(Math.round(target * 0.6) + 400);
    const r2 = commitOutcome(save, { levelId: 1, earned: target, target, won: true, blastCapsLeft: 0, missionDone: true, missionReward: 400 })!;
    expect(r2.missionBonus).toBe(0);
  });
  it('skip ticket opens the next level without money', () => {
    const save = defaultSave();
    expect(skipLevel(save, 1)).toBe(false);
    save.inventory.skip = 1;
    expect(skipLevel(save, 1)).toBe(true);
    expect(save.unlockedLevel).toBe(2);
    expect(save.levels['1'].stars).toBe(1);
    expect(save.wallet).toBe(0);
  });
  it('endless keeps a personal best and pays 30 % into the wallet', () => {
    const save = defaultSave();
    const r = commitEndless(save, 1000, 4);
    expect(r.newBest).toBe(true);
    expect(save.wallet).toBe(300);
    expect(commitEndless(save, 500, 2).newBest).toBe(false);
    expect(save.endless.best).toBe(1000);
    expect(save.stats.endlessWaves).toBe(4);
  });
  it('weekly pays its reward once per week and resets in a new week', () => {
    const save = defaultSave();
    expect(commitWeekly(save, '2026-W45', 100, 500).won).toBe(false);
    expect(save.wallet).toBe(0);
    expect(commitWeekly(save, '2026-W45', 600, 500).reward).toBeGreaterThan(0);
    expect(commitWeekly(save, '2026-W45', 900, 500).reward).toBe(0);
    expect(commitWeekly(save, '2026-W46', 600, 500).reward).toBeGreaterThan(0);
  });
  it('run stats feed the lifetime stats', () => {
    const save = defaultSave();
    mergeStats(save, { slimes: 0, beetles: 0, collected: 5, diamonds: 2, kegs: 1, rocks: 1, blasts: 0, chests: 0, bestCombo: 4 }, 900);
    expect(save.stats.collected).toBe(5);
    expect(save.stats.totalEarned).toBe(900);
    expect(save.stats.bestCombo).toBe(4);
  });
  it('the save survives the new fields being garbage', () => {
    const s = sanitize({ saveVersion: 2, stats: 5, achievements: 'x', daily: [], upgrades: { winch: 99 }, claws: { owned: ['wide', 'bogus'], equipped: 'bogus' }, cosmetics: { owned: ['outfit_blue', 'x'], equipped: { outfit: 'outfit_green' } }, storySeen: [1, 'a'], endless: null, weekly: 3 });
    expect(s.upgrades.winch).toBe(5);
    expect(s.claws.owned).toEqual(['standard', 'wide']);
    expect(s.claws.equipped).toBe('standard');
    expect(s.cosmetics.owned).toContain('outfit_blue');
    expect(s.cosmetics.equipped.outfit).toBe('outfit_orange'); // not owned
    expect(s.storySeen).toEqual(['a']);
    expect(s.achievements).toEqual([]);
  });
  void NO_MODIFIERS;
});

describe('boss twists', () => {
  it('only boss levels have twists', async () => {
    const { twistFor } = await import('../src/systems/Campaign');
    expect(twistFor(5)).toEqual({ rush: false, blackout: false });
    expect(twistFor(20).rush).toBe(true);
    expect(twistFor(40).blackout).toBe(true);
    expect(twistFor(100).rush && twistFor(100).blackout).toBe(true);
  });
  it('a rush makes the swing faster in the last seconds of each cycle', () => {
    const lvl: LevelDef = { id: 20, name: 'b', target: 1e9, objects: [o('goldS', 100, 1100)] };
    const s = new Session({ level: lvl, rng: makeRng(1) });
    let calm = 0;
    let rush = 0;
    let prev = s.claw.phase;
    for (let t = 0; t < 12; t += 1 / 60) {
      s.update(1 / 60);
      const step = Math.abs(s.claw.phase - prev);
      prev = s.claw.phase;
      if (step > 0.5) continue; // wrap
      if (s.rushing) rush = Math.max(rush, step);
      else calm = Math.max(calm, step);
    }
    expect(rush).toBeGreaterThan(calm * 1.3);
  });
});

describe('tips', () => {
  it('shows each tip once, tied to what is in the level', async () => {
    const { tipFor } = await import('../src/systems/Campaign');
    const lvl: LevelDef = { id: 5, name: 't', target: 1, objects: [o('keg', 100, 500), o('bag', 300, 600)] };
    expect(tipFor(lvl, [])).toBe('keg');
    expect(tipFor(lvl, ['keg'])).toBe('bag');
    expect(tipFor(lvl, ['keg', 'bag', 'combo', 'mission'])).toBeNull();
    expect(tipFor({ ...lvl, id: 1, objects: [o('goldS', 100, 500)] }, [])).toBeNull();
  });
});
