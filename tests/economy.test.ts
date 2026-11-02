import { describe, expect, it } from 'vitest';
import { ITEMS, SAVE, SHOP } from '../src/config/economy';
import { LEVELS } from '../src/data/levels';
import { starsFor, rollBag, bagExpectedValue, NO_MODIFIERS } from '../src/systems/Economy';
import { commitOutcome, leaveShop } from '../src/systems/Progress';
import { makeRng } from '../src/systems/Rng';
import { defaultSave, MemoryStore, migrate, sanitize, SaveManager } from '../src/systems/Save';
import { activeModifiers, blastCapPrice, buy, rollShop } from '../src/systems/Shop';

describe('shop', () => {
  it('always offers Blast Cap plus 3 of the 4 boosts; same seed = same shop', () => {
    const a = rollShop(42, 3);
    expect(a.length).toBe(1 + SHOP.boostSlots);
    expect(a[0].id).toBe('blastCap');
    expect(rollShop(42, 3)).toEqual(a);
    const ids = new Set<string>();
    for (let seed = 0; seed < 200; seed++) rollShop(seed, 1).forEach((o) => ids.add(o.id));
    expect(ids.size).toBe(8); // every item can show up
  });

  it('prices stay inside the configured ranges and are expensive', () => {
    for (let seed = 0; seed < 100; seed++) {
      for (const o of rollShop(seed, 10)) {
        const def = ITEMS[o.id];
        if (o.id === 'blastCap') continue;
        expect(o.price).toBeGreaterThanOrEqual(def.priceMin);
        expect(o.price).toBeLessThanOrEqual(def.priceMax);
      }
    }
    expect(blastCapPrice(1)).toBe(400);
    expect(blastCapPrice(100)).toBe(900);
    expect(ITEMS.extraMiner.priceMin).toBeGreaterThanOrEqual(3000);
  });

  it('cannot buy without money', () => {
    const save = defaultSave();
    save.wallet = 149;
    expect(buy(save, { id: 'blastCap', price: 150 })).toEqual({ ok: false, reason: 'funds' });
    expect(save.wallet).toBe(149);
    expect(save.inventory.blastCaps).toBe(0);
  });

  it('Blast Caps stack, boosts are bought once', () => {
    const save = defaultSave();
    save.wallet = 2000;
    expect(buy(save, { id: 'blastCap', price: 150 }).ok).toBe(true);
    expect(buy(save, { id: 'blastCap', price: 150 }).ok).toBe(true);
    expect(save.inventory.blastCaps).toBe(2);
    expect(save.wallet).toBe(1700);
    expect(buy(save, { id: 'turbo', price: 300 }).ok).toBe(true);
    expect(buy(save, { id: 'turbo', price: 300 })).toEqual({ ok: false, reason: 'owned' });
    expect(save.wallet).toBe(1400);
    expect(activeModifiers(save).turbo).toBe(true);
  });

  it('stops at the max number of Blast Caps', () => {
    const save = defaultSave();
    save.wallet = 99999;
    save.inventory.blastCaps = SHOP.maxBlastCaps;
    expect(buy(save, { id: 'blastCap', price: 150 })).toEqual({ ok: false, reason: 'max' });
  });
});

describe('progress and one-level effects', () => {
  const won = (levelId: number, earned: number, caps = 0) => ({ levelId, earned, target: LEVELS[levelId - 1].target, won: true, blastCapsLeft: caps });

  it('winning adds earnings to the wallet, unlocks the next level and opens the shop', () => {
    const save = defaultSave();
    const t = LEVELS[0].target;
    const r = commitOutcome(save, won(1, Math.ceil(t * 1.3)), 7)!;
    expect(r.stars).toBe(2);
    expect(save.wallet).toBe(Math.round(Math.ceil(t * 1.3) * SHOP.walletShare));
    expect(save.unlockedLevel).toBe(2);
    expect(save.currentLevel).toBe(2);
    expect(save.phase).toBe('shop');
    expect(save.shop?.seed).toBe(7);
    leaveShop(save);
    expect(save.phase).toBe('level');
  });

  it('losing changes nothing: no earnings, boosts and caps kept', () => {
    const save = defaultSave();
    save.wallet = 50;
    save.boosts.turbo = true;
    save.inventory.blastCaps = 2;
    const r = commitOutcome(save, { levelId: 1, earned: 400, target: 600, won: false, blastCapsLeft: 0 });
    expect(r).toBeNull();
    expect(save.wallet).toBe(50);
    expect(save.boosts.turbo).toBe(true);
    expect(save.inventory.blastCaps).toBe(2);
  });

  it('boosts last for one level only; Blast Caps persist', () => {
    const save = defaultSave();
    save.boosts.gemLens = true;
    save.boosts.crusher = true;
    save.inventory.blastCaps = 3;
    commitOutcome(save, won(1, 1200, 2));
    expect(Object.values(save.boosts).some(Boolean)).toBe(false);
    expect(save.inventory.blastCaps).toBe(2);
  });

  it('replaying a cleared level cannot be farmed for money, but a better score is kept', () => {
    const save = defaultSave();
    commitOutcome(save, won(1, 1200));
    const wallet = save.wallet;
    leaveShop(save);
    const r = commitOutcome(save, won(1, 1800))!;
    expect(r.firstClear).toBe(false);
    expect(r.newBest).toBe(true);
    expect(save.wallet).toBe(wallet);
    expect(save.levels['1'].best).toBe(1800);
    expect(save.phase).toBe('level');
  });

  it('bag odds improve with the lantern', () => {
    const rng = makeRng(5);
    let moneyBase = 0;
    let moneyLucky = 0;
    for (let i = 0; i < 500; i++) {
      const a = rollBag(rng, NO_MODIFIERS);
      const b = rollBag(rng, { ...NO_MODIFIERS, lantern: true });
      if (a.kind === 'money') moneyBase += a.amount;
      if (b.kind === 'money') moneyLucky += b.amount;
    }
    expect(moneyLucky).toBeGreaterThan(moneyBase);
    expect(bagExpectedValue({ ...NO_MODIFIERS, lantern: true })).toBeGreaterThan(bagExpectedValue(NO_MODIFIERS));
  });

  it('star thresholds', () => {
    expect(starsFor(99, 100, [1, 1.25, 1.5])).toBe(0);
    expect(starsFor(125, 100, [1, 1.25, 1.5])).toBe(2);
    expect(starsFor(150, 100, [1, 1.25, 1.5])).toBe(3);
  });
});

describe('save', () => {
  it('round trips', () => {
    const store = new MemoryStore();
    const m = new SaveManager(store);
    m.data.wallet = 1234;
    m.data.unlockedLevel = 5;
    m.data.currentLevel = 5;
    m.data.inventory.blastCaps = 3;
    m.data.levels['2'] = { stars: 3, best: 2222 };
    m.data.settings.lang = 'tr';
    m.save();
    const again = new SaveManager(store);
    expect(again.data).toEqual(m.data);
    expect(again.stars(2)).toBe(3);
  });

  it('survives garbage in storage', () => {
    for (const junk of ['', '{', 'null', '[]', '42', '"x"', '{"saveVersion":2,"wallet":"lots","levels":7,"inventory":null,"settings":[]}']) {
      const store = new MemoryStore();
      store.setItem(SAVE.key, junk);
      const m = new SaveManager(store);
      expect(m.data.wallet).toBe(0);
      expect(m.data.unlockedLevel).toBe(1);
      expect(m.data.inventory.blastCaps).toBe(0);
    }
  });

  it('clamps out-of-range values and drops unknown levels', () => {
    const s = sanitize({
      saveVersion: 2,
      unlockedLevel: 999,
      currentLevel: 0,
      wallet: -50,
      levels: { '1': { stars: 9, best: -1 }, '99': { stars: 1, best: 1 }, x: {} },
      inventory: { blastCaps: 500 },
      settings: { music: 5, sfx: -1, lang: 'fr', vibration: 'yes' },
    });
    expect(s.unlockedLevel).toBe(LEVELS.length);
    expect(s.currentLevel).toBe(1);
    expect(s.wallet).toBe(0);
    expect(s.levels['1']).toEqual({ stars: 3, best: 0 });
    expect(s.levels['99']).toBeUndefined();
    expect(s.inventory.blastCaps).toBe(SHOP.maxBlastCaps);
    expect(s.settings.music).toBe(1);
    expect(s.settings.sfx).toBe(0);
    expect(s.settings.lang).toBeNull();
    expect(s.settings.vibration).toBe(true);
  });

  it('fills missing fields from an old save version (v1 shape)', () => {
    const old = { saveVersion: 1, level: 4, money: 800, caps: 2, stars: [3, 2, 1], best: [1500, 1200, 900] };
    const s = sanitize(old);
    expect(s.saveVersion).toBe(SAVE.version);
    expect(s.unlockedLevel).toBe(4);
    expect(s.currentLevel).toBe(4);
    expect(s.wallet).toBe(800);
    expect(s.inventory.blastCaps).toBe(2);
    expect(s.levels['2']).toEqual({ stars: 2, best: 1200 });
    expect(s.hasProgress).toBe(true);
    expect(migrate('nope')).toEqual({});
  });

  it('a shop phase without shop data falls back to the level phase', () => {
    const s = sanitize({ saveVersion: 2, phase: 'shop' });
    expect(s.phase).toBe('level');
  });

  it('reset keeps settings but wipes progress', () => {
    const m = new SaveManager(new MemoryStore());
    m.data.wallet = 500;
    m.data.settings.music = 0.1;
    m.resetProgress();
    expect(m.data.wallet).toBe(0);
    expect(m.data.settings.music).toBe(0.1);
  });
});
