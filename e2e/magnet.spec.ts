import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { clickButton, designPoint, open, waitScene } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.setTimeout(240_000);

const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });
const SETTINGS_KEY = 'deepclaw.magnet.settings';

/** Fast-forward the magnet session with normal 1/60 s updates until it is home again. */
const finishDive = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__dc.magnet;
    for (let i = 0; i < 4000 && s.claw.state !== 'swinging'; i++) s.update(1 / 60);
  });

const launchDown = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__dc.magnet;
    s.claw.angleDeg = 90;
    return s.launch();
  });

const state = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__dc.magnet;
    const sc = (window as any).__dc.magnetScene;
    return { earned: s.earned as number, claw: s.claw.state as string, frozen: s.timerFrozen as boolean, panel: sc.panelUi.isOpen as boolean, hud: sc.moneyText.text as string };
  });

test.describe('Magnet Test (prototype)', () => {
  test('main menu button opens it; tap launches; metal is collected; money goes up', async ({ page }) => {
    const errors = await open(page);
    await clickButton(page, 'Magnet Test');
    await waitScene(page, 'MagnetGame');
    expect((await state(page)).claw).toBe('swinging');

    // a real tap in the play area launches the magnet
    const p = await designPoint(page, 360, 900);
    await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => (window as any).__dc.magnet.claw.state !== 'swinging');
    await finishDive(page);

    // deterministic dive: the key bunch hangs straight below the start
    expect(await launchDown(page)).toBe(true);
    await finishDive(page);
    const after = await state(page);
    expect(after.earned).toBeGreaterThanOrEqual(90);
    await page.waitForFunction(() => (window as any).__dc.magnetScene.moneyText.text !== '$0');
    expect((await state(page)).hud).not.toBe('$0');
    expect(errors).toEqual([]);
  });

  test('?mode=magnet opens it directly', async ({ page }) => {
    const errors = await open(page, '&norender=1&mode=magnet', 'MagnetGame');
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as any).__game.scene.isActive('MainMenu'))).toBe(false);
    expect(errors).toEqual([]);
  });

  test('Deep Claw still starts normally from the same menu', async ({ page }) => {
    const errors = await open(page);
    await clickButton(page, 'Play');
    await waitScene(page, 'Game');
    expect(errors).toEqual([]);
  });

  test('settings panel: opens, sliders and toggles change live, values are remembered, reset works', async ({ page }) => {
    const errors = await open(page, '&norender=1&mode=magnet', 'MagnetGame');

    await clickButton(page, 'gear');
    await page.waitForFunction(() => (window as any).__dc.magnetScene.panelUi.isOpen);
    let st = await state(page);
    expect(st.panel).toBe(true);
    expect(st.frozen).toBe(true); // the clock waits while the panel is open

    // drag the pull-radius slider all the way right with the mouse
    const pos = await page.evaluate(() => {
      const sl = (window as any).__dc.magnetScene.panelUi.sliders.get('pullRadius');
      const m = sl.getWorldTransformMatrix();
      return { x: m.tx, y: m.ty };
    });
    const from = await designPoint(page, pos.x, pos.y);
    const to = await designPoint(page, pos.x + 170, pos.y);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 6 });
    await page.mouse.up();
    expect(await page.evaluate(() => (window as any).__dc.magnet.settings.pullRadius)).toBe(420);

    // the two toggle buttons show readable labels
    const labels = await page.evaluate(() => {
      const ui = (window as any).__dc.magnetScene.panelUi;
      return [ui.modeBtn.list.find((c: any) => c.type === 'Text').text, ui.ringBtn.list.find((c: any) => c.type === 'Text').text];
    });
    expect(labels[0]).toMatch(/Sweep/);
    expect(labels[1]).toMatch(/Ring: On/);

    // mode toggle + ring toggle
    await clickButton(page, 'mode');
    await clickButton(page, 'ring');
    const live = await page.evaluate(() => ({ ...(window as any).__dc.magnet.settings }));
    expect(live.mode).toBe('firstStick');
    expect(live.showRing).toBe(false);
    expect(await page.evaluate(() => (window as any).__dc.magnetScene.ring.visible)).toBe(false);
    const stored = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), SETTINGS_KEY)) as string);
    expect(stored).toMatchObject({ pullRadius: 420, mode: 'firstStick', showRing: false });

    // tapping the panel does not launch the magnet
    const pp = await page.evaluate(() => {
      const c = (window as any).__dc.magnetScene.panelUi.container;
      return { x: c.x, y: c.y + 300 };
    });
    const pt = await designPoint(page, pp.x - 250, pp.y);
    await page.mouse.click(pt.x, pt.y);
    expect((await state(page)).claw).toBe('swinging');

    // close, reload: the values are still there
    await clickButton(page, 'close');
    expect((await state(page)).frozen).toBe(false);
    await page.reload();
    await waitScene(page, 'MagnetGame');
    expect(await page.evaluate(() => ({ ...(window as any).__dc.magnet.settings }))).toMatchObject({ pullRadius: 420, mode: 'firstStick', showRing: false });

    // reset to defaults
    await clickButton(page, 'gear');
    await page.waitForFunction(() => (window as any).__dc.magnetScene.panelUi.isOpen);
    await clickButton(page, 'reset');
    st = await page.evaluate(() => ({ ...(window as any).__dc.magnet.settings }));
    expect(st).toMatchObject({ pullRadius: 260, capacity: 6, mode: 'sweep', showRing: true });
    expect(JSON.parse((await page.evaluate((k) => localStorage.getItem(k), SETTINGS_KEY)) as string)).toMatchObject({ pullRadius: 260, mode: 'sweep' });
    expect(errors).toEqual([]);
  });

  test('screenshots (rendered) at a phone size', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = await open(page, '&mode=magnet', 'MagnetGame');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/magnet-game.png` });
    // magnet mid-dive with the ring visible
    await page.evaluate(() => {
      const s = (window as any).__dc.magnet;
      s.claw.angleDeg = 84;
      s.launch();
      for (let i = 0; i < 22; i++) s.update(1 / 60);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/magnet-dive.png` });
    await clickButton(page, 'gear');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/magnet-panel.png` });
    expect(errors).toEqual([]);
  });

  test('screenshot of the main menu with the new button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/magnet-menu.png` });
  });
});
