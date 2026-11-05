import { expect, test } from '@playwright/test';
import { clickButton, designPoint, open, saveData, stepSession, waitScene } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.setTimeout(240_000);

test.describe('new features', () => {
  test('story: the first level opens with a dialogue that can be played through and is shown only once', async ({ page }) => {
    const errors = await open(page, '&norender=1');
    await clickButton(page, 'Play');
    await waitScene(page, 'Story');
    // the claw does not move while the story plays
    expect(await page.evaluate(() => (window as any).__dc.session.timeLeft)).toBe(60);
    await page.waitForFunction(() => (window as any).__game.scene.getScene('Story').ready === true);
    for (let i = 0; i < 12; i++) {
      const still = await page.evaluate(() => (window as any).__game.scene.isActive('Story'));
      if (!still) break;
      await page.keyboard.press('Space'); // finish typing
      await page.keyboard.press('Space'); // next line
      await page.waitForTimeout(150);
    }
    await waitScene(page, 'Game');
    expect((await saveData(page)).storySeen).toContain('w1_intro');
    // second time: no dialogue
    await page.evaluate(() => (window as any).__game.scene.getScene('Game').scene.start('Game', { levelId: 1 }));
    await waitScene(page, 'Game');
    expect(await page.evaluate(() => (window as any).__game.scene.isActive('Story'))).toBe(false);
    expect(errors).toEqual([]);
  });

  test('a one-time tip appears for something new (powder keg) and is remembered', async ({ page }) => {
    await open(page, '&norender=1');
    await page.evaluate(() => {
      const d = (window as any).__dc;
      d.services.save.data.storySeen = ['w1_intro'];
      d.game.scene.getScene('MainMenu').scene.start('Game', { levelId: 5 });
    });
    await waitScene(page, 'Game');
    await page.waitForTimeout(1200);
    expect((await saveData(page)).tipsSeen).toContain('keg');
    // the level does not run while the tip is open
    expect(await page.evaluate(() => (window as any).__dc.session.timeLeft)).toBe(60);
    await clickButton(page, 'Got it!');
    await page.waitForFunction(() => (window as any).__dc.session.timeLeft < 60);
  });

  test('tutorial cards: a new menu button explains itself once', async ({ page }) => {
    await open(page, '&norender=1&nostory=1');
    await page.evaluate(() => {
      (window as any).__dc.services.save.data.unlockedLevel = 3;
      (window as any).__game.scene.getScene('MainMenu').scene.restart();
    });
    await waitScene(page, 'MainMenu');
    await page.waitForTimeout(1500);
    await clickButton(page, 'Got it!');
    await page.waitForTimeout(500);
    expect((await saveData(page)).tipsSeen).toContain('tut_unlock_shop');
    // the next visit explains the next feature, never the same card twice
    await page.evaluate(() => (window as any).__game.scene.getScene('MainMenu').scene.restart());
    await waitScene(page, 'MainMenu');
    await page.waitForTimeout(1500);
    await clickButton(page, 'Got it!');
    await page.waitForTimeout(500);
    const seen = (await saveData(page)).tipsSeen as string[];
    expect(seen).toContain('tut_unlock_awards');
    expect(seen.filter((x) => x === 'tut_unlock_shop').length).toBe(1);
  });

  test('story: Skip ends the dialogue at once', async ({ page }) => {
    await open(page, '&norender=1');
    await clickButton(page, 'Play');
    await waitScene(page, 'Story');
    await clickButton(page, 'Skip');
    await waitScene(page, 'Game');
  });

  test('endless mode starts, clears a wave and moves to the next', async ({ page }) => {
    const errors = await open(page);
    await page.evaluate(() => (window as any).__game.scene.getScene('MainMenu').scene.start('Game', { mode: 'endless' }));
    await waitScene(page, 'Game');
    await page.evaluate(() => {
      const s = (window as any).__dc.session;
      for (const e of s.entities) e.alive = false;
    });
    await stepSession(page, 0.2);
    await page.waitForFunction(() => (window as any).__dc.session.wave === 2);
    // let it end
    await page.evaluate(() => {
      const s = (window as any).__dc.session;
      s.earned = 777;
      s.timeLeft = 0.05;
    });
    await stepSession(page, 0.5);
    await waitScene(page, 'Results');
    const save = await saveData(page);
    expect(save.endless.best).toBe(777);
    expect(save.wallet).toBe(Math.round(777 * 0.3));
    expect(errors).toEqual([]);
  });

  test('weekly challenge runs and pays its reward once', async ({ page }) => {
    await open(page);
    await page.evaluate(() => (window as any).__game.scene.getScene('MainMenu').scene.start('Game', { mode: 'weekly' }));
    await waitScene(page, 'Game');
    await page.evaluate(() => {
      const s = (window as any).__dc.session;
      s.earned = s.level.target + 10;
      s.timeLeft = 0.05;
    });
    await stepSession(page, 0.5);
    await waitScene(page, 'Results');
    const save = await saveData(page);
    expect(save.weekly.claimed).toBe(true);
    expect(save.wallet).toBeGreaterThanOrEqual(1500);
  });

  test('workshop: buy an upgrade, claw and outfit with real money', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = (window as any).__dc;
      d.services.save.data.wallet = 50000;
      d.services.save.data.hasProgress = true;
      d.game.scene.getScene('MainMenu').scene.start('Workshop', { back: 'MainMenu' });
    });
    await waitScene(page, 'Workshop');
    // first upgrade row: price button shows the money value
    const price = await page.evaluate(() => {
      const sc = (window as any).__game.scene.getScene('Workshop');
      const texts: string[] = [];
      const walk = (list: any[]) => list.forEach((o) => { if (o.type === 'Text') texts.push(o.text); if (o.list) walk(o.list); });
      walk(sc.list.list);
      return texts.find((x) => /^\$[\d,]+$/.test(x)) as string;
    });
    await clickButton(page, price);
    await page.waitForTimeout(300);
    let save = await saveData(page);
    expect(Object.values(save.upgrades as Record<string, number>).reduce((a, b) => a + b, 0)).toBe(1);
    await clickButton(page, 'Claws');
    await page.waitForTimeout(300);
    await clickButton(page, '$25,000');
    await page.waitForTimeout(300);
    save = await saveData(page);
    expect(save.claws.owned).toContain('wide');
    await clickButton(page, 'Style');
    await page.waitForTimeout(300);
    await clickButton(page, '$12,000');
    await page.waitForTimeout(300);
    save = await saveData(page);
    expect(save.cosmetics.owned.some((c: string) => c.startsWith('outfit_') && c !== 'outfit_orange')).toBe(true);
  });

  test('daily gift can be claimed once', async ({ page }) => {
    await open(page);
    await clickButton(page, 'gift');
    await page.waitForTimeout(400);
    await clickButton(page, 'Claim');
    await page.waitForTimeout(400);
    const save = await saveData(page);
    expect(save.daily.streak).toBe(1);
    expect(save.wallet + save.inventory.blastCaps + Object.values(save.boosts).filter(Boolean).length).toBeGreaterThan(0);
  });

  test('lucky wheel: spend a token and get a real prize', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = (window as any).__dc;
      d.services.save.data.spins = 1;
      d.game.scene.getScene('MainMenu').scene.start('Wheel');
    });
    await waitScene(page, 'Wheel');
    await clickButton(page, 'SPIN');
    await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('Wheel').result.text), { timeout: 60_000 }).toContain(':');
    const save = await saveData(page);
    expect(save.spins).toBe(0);
    expect(save.wallet + save.inventory.blastCaps + save.inventory.freeze + save.inventory.skip + Object.values(save.boosts).filter(Boolean).length).toBeGreaterThan(0);
  });

  test('achievements screen opens and lists the awards', async ({ page }) => {
    await open(page);
    // a fresh game shows the Awards button locked: it opens after level 1
    await clickButton(page, 'awards');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as any).__game.scene.isActive('Achievements'))).toBe(false);
    await page.evaluate(() => {
      (window as any).__dc.services.save.data.unlockedLevel = 6;
      (window as any).__game.scene.getScene('MainMenu').scene.restart();
    });
    await waitScene(page, 'MainMenu');
    await clickButton(page, 'awards');
    await waitScene(page, 'Achievements');
  });

  test('level select pages through the 5 worlds and locks later worlds', async ({ page }) => {
    await open(page);
    await clickButton(page, 'Levels');
    await waitScene(page, 'LevelSelect');
    await clickButton(page, '>');
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => (window as any).__game.scene.getScene('LevelSelect').world)).toBe(2);
  });

  test('Time Freeze button stops the clock', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = (window as any).__dc;
      d.services.save.data.inventory.freeze = 2;
      d.game.scene.getScene('MainMenu').scene.start('Game', { levelId: 1 });
    });
    await waitScene(page, 'Game');
    await page.keyboard.press('f');
    await page.waitForFunction(() => (window as any).__dc.session.freezeLeft > 0);
    const t0 = await page.evaluate(() => (window as any).__dc.session.timeLeft);
    await stepSession(page, 1);
    expect(await page.evaluate(() => (window as any).__dc.session.timeLeft)).toBeCloseTo(t0, 3);
    expect(await page.evaluate(() => (window as any).__dc.session.freezeCount)).toBe(1);
  });

  test('shop: deals tab, reroll and a mystery crate', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = (window as any).__dc;
      d.services.save.data.wallet = 20000;
      d.services.save.data.hasProgress = true;
      d.game.scene.getScene('MainMenu').scene.start('Shop');
    });
    await waitScene(page, 'Shop');
    await clickButton(page, '$1,500'); // Mystery Crate
    await page.waitForTimeout(500);
    let save = await saveData(page);
    expect(save.wallet).not.toBe(20000);
    await page.waitForTimeout(3600); // the opening animation
    await clickButton(page, 'OK');
    await clickButton(page, 'Deals');
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => (window as any).__game.scene.getScene('Shop').rows.map((r: any) => r.offer.id).join(','));
    await clickButton(page, 'New deals $250');
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => (window as any).__game.scene.getScene('Shop').rows.map((r: any) => r.offer.id).join(','));
    expect(after).not.toBe(before);
    save = await saveData(page);
    expect(save.shop.rerolls).toBe(1);
  });

  test('easter egg: Blast Cap on a carried keg blows up the mine and loses the level', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = (window as any).__dc;
      d.services.save.data.boosts.defuser = true;
      d.services.save.data.boosts.magnet = true;
      d.services.save.data.inventory.blastCaps = 2;
      d.game.scene.getScene('MainMenu').scene.start('Game', { levelId: 5 });
    });
    await waitScene(page, 'Game');
    // level 5 has a powder keg straight below the winch: aim down, launch, wait until it is on the claw
    const hooked = await page.evaluate(() => {
      const s = (window as any).__dc.session;
      for (let i = 0; i < 4000 && Math.abs(s.claw.angleDeg - 90) > 0.4; i++) s.update(1 / 240);
      s.launch();
      for (let i = 0; i < 600 && s.claw.state !== 'retracting'; i++) s.update(1 / 60);
      return s.get(s.claw.hookedId)?.type;
    });
    expect(hooked).toBe('keg');
    await page.keyboard.press('d');
    await expect.poll(() => page.evaluate(() => (window as any).__dc.session.status)).toBe('lost');
    expect(await page.evaluate(() => (window as any).__dc.session.entities.filter((e: any) => e.alive).length)).toBe(0);
    await waitScene(page, 'GameOver');
    const texts = await page.evaluate(() => {
      const sc = (window as any).__game.scene.getScene('GameOver');
      return sc.children.list.filter((o: any) => o.type === 'Text').map((o: any) => o.text);
    });
    expect(texts).toContain('KABOOOM!');
    // like any lost level, nothing used in it is taken from the saved inventory
    expect((await saveData(page)).inventory.blastCaps).toBe(2);
  });

  test('easter egg: 10 taps on the menu sky = shooting star, one spin a day, secret award', async ({ page }) => {
    await open(page);
    const sky = await designPoint(page, 450, 140);
    for (let i = 0; i < 10; i++) await page.mouse.click(sky.x, sky.y);
    await expect.poll(async () => (await saveData(page)).spins).toBe(1);
    let save = await saveData(page);
    expect(save.eggs.found).toContain('star');
    expect(save.achievements).toContain('egg_star');
    // a second wish the same day gives nothing
    for (let i = 0; i < 10; i++) await page.mouse.click(sky.x, sky.y);
    await page.waitForTimeout(500);
    save = await saveData(page);
    expect(save.spins).toBe(1);
  });

  test('easter egg: Dusty throws by himself after 30 idle seconds and it is saved', async ({ page }) => {
    await open(page);
    await page.evaluate(() => (window as any).__dc.game.scene.getScene('MainMenu').scene.start('Game', { levelId: 1 }));
    await waitScene(page, 'Game');
    expect(await page.evaluate(() => (window as any).__dc.session.claw.state)).toBe('swinging');
    await stepSession(page, 31);
    expect(await page.evaluate(() => (window as any).__dc.session.eggsFound)).toContain('idle');
    // finish the level fast and check the save
    await page.evaluate(() => {
      const s = (window as any).__dc.session;
      s.timeLeft = 0.01;
    });
    await stepSession(page, 20);
    await expect.poll(async () => (await saveData(page)).eggs.found).toContain('idle');
    expect((await saveData(page)).achievements).toContain('egg_idle');
  });
});
