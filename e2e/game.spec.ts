import { expect, test } from '@playwright/test';
import { clickButton, designPoint, open, saveData, sessionState, stepSession, stepUntil, waitScene } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.setTimeout(240_000);

/** Point the claw straight down (level 1 has medium gold right below the winch) and launch. */
const launchDown = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const s = (window as any).__dc.session;
    s.claw.phase = 0;
    s.claw.angleDeg = 90;
    s.launch();
  });

test.describe('Deep Claw', () => {
  test('boots without console errors and shows the menu', async ({ page }) => {
    const errors = await open(page);
    await page.waitForTimeout(1500);
    expect(await page.title()).toBe('DEEP CLAW');
    expect(errors).toEqual([]);
    expect((await saveData(page)).hasProgress).toBe(false);
  });

  test('menu -> level 1 -> a real tap launches the claw; the HUD pause button does not', async ({ page }) => {
    const errors = await open(page);
    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    await clickButton(page, 'pause');
    await waitScene(page, 'Pause');
    expect((await sessionState(page)).state).toBe('swinging');
    await clickButton(page, 'Resume');
    await waitScene(page, 'Game');
    expect((await sessionState(page)).state).toBe('swinging');
    const p = await designPoint(page, 360, 900);
    await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => (window as any).__dc.session.claw.state !== 'swinging');
    expect(errors).toEqual([]);
  });

  test('keyboard: Space launches, P pauses', async ({ page }) => {
    await open(page);
    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window as any).__dc.session.claw.state !== 'swinging');
    await page.keyboard.press('p');
    await waitScene(page, 'Pause');
    await page.keyboard.press('Escape');
    await waitScene(page, 'Game');
  });

  test('a launched claw collects an object and money increases', async ({ page }) => {
    const errors = await open(page);
    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    await launchDown(page);
    await stepUntil(page, 'retracting');
    expect((await sessionState(page)).state).toBe('retracting');
    await stepUntil(page, 'swinging');
    const st = await sessionState(page);
    expect(st.earned).toBe(250);
    // the HUD counts up to the new amount
    await expect
      .poll(() => page.evaluate(() => (window as any).__game.scene.getScene('Game').moneyText.text), { timeout: 40_000 })
      .toBe('$250');
    expect(errors).toEqual([]);
  });

  test('win -> level complete -> shop -> buy -> next level; progress survives a reload', async ({ page }) => {
    const errors = await open(page);
    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    await page.evaluate(() => {
      const s = (window as any).__dc.session;
      s.earned = s.level.target + 300;
      s.timeLeft = 0.05;
    });
    await stepSession(page, 0.5);
    await waitScene(page, 'LevelComplete');
    let save = await saveData(page);
    expect(save.wallet).toBeGreaterThanOrEqual(1400);
    expect(save.phase).toBe('shop');
    const walletBefore = save.wallet;
    await clickButton(page, 'To the shop');
    await waitScene(page, 'Shop');
    const price = await page.evaluate(() => (window as any).__game.scene.getScene('Shop').rows[0].offer.price as number);
    await clickButton(page, '$' + price);
    await page.waitForTimeout(600);
    save = await saveData(page);
    expect(save.inventory.blastCaps).toBe(1);
    expect(save.wallet).toBe(walletBefore - price);
    await clickButton(page, 'Next level');
    await waitScene(page, 'Game');
    expect(await page.evaluate(() => (window as any).__dc.session.level.id)).toBe(2);

    await page.reload();
    await waitScene(page, 'MainMenu');
    await clickButton(page, 'Continue');
    await waitScene(page, 'Game');
    save = await saveData(page);
    expect(save.currentLevel).toBe(2);
    expect(save.wallet).toBe(walletBefore - price);
    expect(save.inventory.blastCaps).toBe(1);
    expect(await page.evaluate(() => (window as any).__dc.session.level.id)).toBe(2);
    expect(await page.evaluate(() => (window as any).__dc.session.blastCaps)).toBe(1);
    expect(errors).toEqual([]);
  });

  test('cannot buy without money; wallet stays the same', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = (window as any).__dc;
      const save = d.services.save;
      save.data.phase = 'shop';
      save.data.shop = { seed: 5, afterLevel: 1, bought: [] };
      save.data.currentLevel = 2;
      save.data.unlockedLevel = 2;
      save.data.hasProgress = true;
      save.data.wallet = 20;
      save.save();
      d.game.scene.getScene('MainMenu').scene.start('Shop');
    });
    await waitScene(page, 'Shop');
    const price = await page.evaluate(() => (window as any).__game.scene.getScene('Shop').rows[0].offer.price as number);
    await clickButton(page, '$' + price);
    await page.waitForTimeout(500);
    const save = await saveData(page);
    expect(save.wallet).toBe(20);
    expect(save.inventory.blastCaps).toBe(0);
  });

  test('reload while in the shop returns to the shop', async ({ page }) => {
    await open(page);
    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    await page.evaluate(() => {
      const s = (window as any).__dc.session;
      s.earned = s.level.target;
      s.timeLeft = 0.05;
    });
    await stepSession(page, 0.5);
    await waitScene(page, 'LevelComplete');
    await page.reload();
    await waitScene(page, 'MainMenu');
    await clickButton(page, 'Continue');
    await waitScene(page, 'Shop');
  });

  test('lose -> game over -> retry; nothing is added to the wallet', async ({ page }) => {
    const errors = await open(page);
    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    await page.evaluate(() => {
      const s = (window as any).__dc.session;
      s.earned = 400;
      s.timeLeft = 0.05;
    });
    await stepSession(page, 0.5);
    await waitScene(page, 'GameOver');
    expect((await saveData(page)).wallet).toBe(0);
    await clickButton(page, 'Retry');
    await waitScene(page, 'Game');
    const st = await sessionState(page);
    expect(st.earned).toBe(0);
    expect(st.status).toBe('playing');
    expect(errors).toEqual([]);
  });

  test('Blast Cap (D key) destroys the carried object and the claw returns empty', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = (window as any).__dc;
      d.services.save.data.inventory.blastCaps = 2;
      d.services.save.save();
    });
    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    await launchDown(page);
    await stepUntil(page, 'retracting');
    await page.keyboard.press('d');
    await page.waitForFunction(() => (window as any).__dc.session.blastCaps === 1);
    await stepUntil(page, 'swinging');
    const st = await sessionState(page);
    expect(st.earned).toBe(0);
  });

  test('settings: switch the language to Turkish', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const g = (window as any).__game;
      g.scene.pause('MainMenu');
      g.scene.launch('Settings', { from: 'MainMenu' });
    });
    await waitScene(page, 'Settings');
    await clickButton(page, 'Türkçe');
    await waitScene(page, 'MainMenu');
    expect((await saveData(page)).settings.lang).toBe('tr');
    await clickButton(page, 'Oyna'); // Turkish "Play" button exists
  });

  test('Play with an existing save asks for confirmation', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = (window as any).__dc;
      d.services.save.data.hasProgress = true;
      d.services.save.data.wallet = 999;
      d.services.save.save();
      d.game.scene.start('MainMenu');
    });
    await waitScene(page, 'MainMenu');
    await clickButton(page, 'Play');
    await page.waitForTimeout(500);
    await clickButton(page, 'No');
    await page.waitForTimeout(300);
    expect((await saveData(page)).wallet).toBe(999);
  });
});
