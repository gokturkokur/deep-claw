import { describe, expect, it } from 'vitest';
import { ITEMS, SAVE, SHOP } from '../src/config/economy';
import { LEVELS } from '../src/data/levels';
import { starsFor, rollBag, bagExpectedValue, NO_MODIFIERS } from '../src/systems/Economy';
import { commitOutcome, leaveShop } from '../src/systems/Progress';
import { makeRng } from '../src/systems/Rng';
import { defaultSave, MemoryStore, migrate, sanitize, SaveManager } from '../src/systems/Save';
import { activeModifiers, blastCapPrice, buy, buyCosmetic, dealOffers, equipCosmetic, openCrate, reroll, rerollCost, supplyOffers } from '../src/systems/Shop';

describe('shop', () => {
  it('deals: 4 boosts, one on sale; same seed and reroll count = same shop', () => {
    const a = dealOffers(42);
    expect(a.length).toBe(SHOP.boostSlots);
    expect(a.filter((o) => o.sale).length).toBe(1);
    expect(dealOffers(42)).toEqual(a);
    expect(dealOffers(42, 1)).not.toEqual(a);
    const ids = new Set<string>();
    for (let seed = 0; seed < 200; seed++) dealOffers(seed).forEach((o) => ids.add(o.id));
    expect(ids.size).toBe(9); // every boost can show up
  });

  it('supplies: five fixed items', () => {
    expect(supplyOffers(3).map((o) => o.id)).toEqual(['blastCap', 'blastPack', 'freeze', 'crate', 'skip']);
  });

  it('prices stay inside the configured ranges and are expensive', () => {
    for (let seed = 0; seed < 100; seed++) {
      for (const o of dealOffers(seed)) {
        const def = ITEMS[o.id];
        expect(o.price).toBeGreaterThanOrEqual(Math.round(def.priceMin * (o.sale ? 1 - SHOP.saleDiscount : 1)) - 10);
        expect(o.price).toBeLessThanOrEqual(def.priceMax);
      }
    }
    expect(blastCapPrice(1)).toBe(700);
    expect(blastCapPrice(100)).toBe(2500);
    expect(supplyOffers(100).find((o) => o.id === 'blastPack')!.price).toBeLessThan(3 * 2500);
    expect(dealOffers(1, 0, 100)[0].price).toBeGreaterThan(dealOffers(1, 0, 0)[0].price);
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
    expect(buy(save, { id: 'blastPack', price: 150 })).toEqual({ ok: false, reason: 'max' });
  });

  it('pack gives 3 caps, freeze and skip tickets stack with limits', () => {
    const save = defaultSave();
    save.wallet = 99999;
    buy(save, { id: 'blastPack', price: 1800 });
    expect(save.inventory.blastCaps).toBe(SHOP.blastPackSize);
    for (let i = 0; i < 10; i++) buy(save, { id: 'freeze', price: 1000 });
    expect(save.inventory.freeze).toBe(SHOP.maxFreeze);
    for (let i = 0; i < 10; i++) buy(save, { id: 'skip', price: 6000 });
    expect(save.inventory.skip).toBe(SHOP.maxSkip);
  });

  it('crate pays out something real and costs money', () => {
    for (let seed = 1; seed < 60; seed++) {
      const save = defaultSave();
      save.wallet = 2000;
      const r = buy(save, { id: 'crate', price: 1500 }, makeRng(seed));
      expect(r.ok).toBe(true);
      const gained = save.wallet - 500 + save.inventory.blastCaps + save.inventory.freeze + save.inventory.skip + Object.values(save.boosts).filter(Boolean).length;
      expect(gained).toBeGreaterThan(0);
    }
  });

  it('crate: usually 600, about a third of money prizes are a profit, average value stays well below the price', () => {
    let moneyPrizes = 0;
    let profit = 0;
    let small = 0;
    let value = 0;
    const n = 20000;
    const rng = makeRng(99);
    for (let i = 0; i < n; i++) {
      const save = defaultSave();
      const r = openCrate(save, rng);
      if (r.kind === 'money') {
        moneyPrizes++;
        value += r.amount;
        if (r.amount > 1500) profit++;
        if (r.amount === 600) small++;
      } else if (r.kind === 'caps') value += 700;
      else if (r.kind === 'freeze') value += 1000;
      else if (r.kind === 'boost') value += 1300;
      else value += 6000;
    }
    expect(profit / moneyPrizes).toBeGreaterThan(0.28);
    expect(profit / moneyPrizes).toBeLessThan(0.38);
    expect(small / moneyPrizes).toBeGreaterThan(0.6);
    expect(value / n / ITEMS.crate.priceMin).toBeLessThan(0.8);
  });

  it('reroll costs more each time and changes the deals', () => {
    const save = defaultSave();
    save.wallet = 5000;
    save.shop = { seed: 9, afterLevel: 1, bought: [], rerolls: 0 };
    expect(reroll(save)).toBe(true);
    expect(save.wallet).toBe(5000 - rerollCost(0));
    expect(rerollCost(1)).toBeGreaterThan(rerollCost(0));
    save.wallet = 10;
    expect(reroll(save)).toBe(false);
  });

  it('cosmetics: buy once, equip, cannot equip what you do not own', () => {
    const save = defaultSave();
    expect(equipCosmetic(save, 'outfit_blue')).toBe(false);
    expect(buyCosmetic(save, 'outfit_blue')).toEqual({ ok: false, reason: 'funds' });
    save.wallet = 5000;
    expect(buyCosmetic(save, 'outfit_blue').ok).toBe(true);
    expect(save.cosmetics.equipped.outfit).toBe('outfit_blue');
    expect(buyCosmetic(save, 'outfit_blue')).toEqual({ ok: false, reason: 'owned' });
    expect(equipCosmetic(save, 'outfit_orange')).toBe(true);
    expect(save.cosmetics.equipped.outfit).toBe('outfit_orange');
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
    m.data.levels['2'] = { stars: 3, best: 2222, mission: false };
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
      levels: { '1': { stars: 9, best: -1 }, '199': { stars: 1, best: 1 }, x: {} },
      inventory: { blastCaps: 500 },
      settings: { music: 5, sfx: -1, lang: 'fr', vibration: 'yes' },
    });
    expect(s.unlockedLevel).toBe(LEVELS.length);
    expect(s.currentLevel).toBe(1);
    expect(s.wallet).toBe(0);
    expect(s.levels['1']).toMatchObject({ stars: 3, best: 0 });
    expect(s.levels['199']).toBeUndefined();
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
    expect(s.levels['2']).toMatchObject({ stars: 2, best: 1200 });
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
