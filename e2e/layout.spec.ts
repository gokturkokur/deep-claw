import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { clickButton, open, waitScene } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.setTimeout(300_000);

const SIZES: Array<[string, number, number]> = [
  ['360x640', 360, 640],
  ['390x844', 390, 844],
  ['412x915', 412, 915],
  ['768x1024', 768, 1024],
  ['1280x720-desktop', 1280, 720],
];

const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

for (const [name, w, h] of SIZES) {
  test(`layout ${name}: no bars, HUD inside the screen, nothing overlaps`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const errors = await open(page);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${name}-menu.png` });

    // the canvas fills the whole window: no black bars
    const box = await page.evaluate(() => {
      const r = (window as any).__game.canvas.getBoundingClientRect();
      return { l: r.left, t: r.top, w: r.width, h: r.height };
    });
    expect(Math.abs(box.l)).toBeLessThan(1.5);
    expect(Math.abs(box.t)).toBeLessThan(1.5);
    expect(Math.abs(box.w - w)).toBeLessThan(1.5);
    expect(Math.abs(box.h - h)).toBeLessThan(1.5);

    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${name}-game.png` });

    const report = await page.evaluate(() => {
      const sc = (window as any).__game.scene.getScene('Game');
      const cam = sc.cameras.main;
      const view = { l: cam.worldView.x, r: cam.worldView.right, t: cam.worldView.y, b: cam.worldView.bottom };
      const items: Record<string, any> = {
        money: sc.moneyText,
        timer: sc.timerText,
        level: sc.levelText,
        target: sc.targetText,
        pause: sc.pauseBtn,
        blast: sc.blastBtn,
        coin: sc.coinIcon,
        clock: sc.clockIcon,
      };
      const rects: Record<string, { l: number; t: number; r: number; b: number }> = {};
      for (const [k, o] of Object.entries(items)) {
        const b = o.getBounds();
        rects[k] = { l: b.x, t: b.y, r: b.right, b: b.bottom };
      }
      const outside = Object.entries(rects)
        .filter(([, r]) => r.l < view.l - 1 || r.r > view.r + 1 || r.t < view.t - 1 || r.b > view.b + 1)
        .map(([k]) => k);
      const keys = Object.keys(rects);
      const overlaps: string[] = [];
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const a = rects[keys[i]];
          const c = rects[keys[j]];
          if (a.l < c.r - 2 && a.r > c.l + 2 && a.t < c.b - 2 && a.b > c.t + 2) overlaps.push(`${keys[i]}/${keys[j]}`);
        }
      }
      const gs = (window as any).__game.scale.gameSize;
      return { outside, overlaps, view, game: { w: gs.width, h: gs.height }, pauseSize: [sc.pauseBtn.width, sc.pauseBtn.height], blastSize: [sc.blastBtn.width, sc.blastBtn.height], top: rects.pause.t - view.t };
    });
    expect(report.outside).toEqual([]);
    expect(report.overlaps).toEqual([]);
    expect(Math.min(...report.pauseSize)).toBeGreaterThanOrEqual(96);
    expect(Math.min(...report.blastSize)).toBeGreaterThanOrEqual(96);
    // game area is never smaller than the 720 x 1280 design area
    expect(report.game.w).toBeGreaterThanOrEqual(719);
    expect(report.game.h).toBeGreaterThanOrEqual(1279);
    expect(errors).toEqual([]);
  });
}

test('screens gallery (shop, level select, complete, game over, pause, settings) at 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await open(page);
  const goto = async (key: string, data?: object) => {
    await page.evaluate(([k, d]) => {
      const g = (window as any).__game;
      g.scene.getScenes(true).forEach((s: any) => g.scene.stop(s.scene.key));
      g.scene.start(k, d);
    }, [key, data ?? {}] as const);
    await waitScene(page, key);
    await page.waitForTimeout(1200);
  };
  // some progress so the screens show real data
  await page.evaluate(() => {
    const d = (window as any).__dc;
    const s = d.services.save.data;
    s.unlockedLevel = 8;
    s.currentLevel = 8;
    s.wallet = 820;
    s.hasProgress = true;
    s.inventory.blastCaps = 2;
    s.levels = { '1': { stars: 3, best: 1900 }, '2': { stars: 2, best: 2100 }, '3': { stars: 1, best: 1800 }, '4': { stars: 3, best: 3100 }, '5': { stars: 2, best: 2900 }, '6': { stars: 1, best: 2600 }, '7': { stars: 2, best: 3000 } };
    s.phase = 'shop';
    s.shop = { seed: 11, afterLevel: 7, bought: [] };
    d.services.save.save();
  });
  await goto('Shop');
  await page.screenshot({ path: `${OUT}/screen-shop.png` });
  await goto('LevelSelect');
  await page.screenshot({ path: `${OUT}/screen-levelselect.png` });
  await goto('LevelComplete', { levelId: 7, earned: 3600, target: 2700, won: true, blastCapsLeft: 2, stars: 3, firstClear: true, newBest: true, walletGain: 3600 });
  await page.screenshot({ path: `${OUT}/screen-levelcomplete.png` });
  await goto('GameOver', { levelId: 7, earned: 1900, target: 2700 });
  await page.screenshot({ path: `${OUT}/screen-gameover.png` });
  await page.evaluate(() => {
    const d = (window as any).__dc;
    d.services.save.data.phase = 'level';
    d.services.save.data.boosts.turbo = true;
    d.services.save.data.boosts.gemLens = true;
  });
  await goto('Game', { levelId: 10 });
  await page.evaluate(() => {
    const s = (window as any).__dc.session;
    s.claw.phase = 0.4;
    s.earned = 1200;
    s.timeLeft = 8.4;
    s.launch();
    for (let i = 0; i < 40; i++) s.update(1 / 60);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/screen-game-level10.png` });
  await page.evaluate(() => {
    const g = (window as any).__game;
    g.scene.pause('Game');
    g.scene.launch('Pause', { levelId: 10 });
  });
  await waitScene(page, 'Pause');
  await page.screenshot({ path: `${OUT}/screen-pause.png` });
  await page.evaluate(() => {
    const g = (window as any).__game;
    g.scene.pause('Pause');
    g.scene.launch('Settings', { from: 'Pause', levelId: 10 });
  });
  await waitScene(page, 'Settings');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/screen-settings.png` });
  expect(errors).toEqual([]);
});
