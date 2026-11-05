import { expect, type Page } from '@playwright/test';

export interface Pt {
  x: number;
  y: number;
}

/** Open the game in debug mode (exposes window.__game and window.__dc). */
export async function open(page: Page, query = '&norender=1&nostory=1&notut=1'): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  await page.goto('/?debug=1' + query);
  await waitScene(page, 'MainMenu');
  return errors;
}

export async function waitScene(page: Page, key: string, timeout = 90_000): Promise<void> {
  await page.waitForFunction(
    (k) => {
      const g = (window as unknown as { __game?: { scene: { isActive(k: string): boolean } } }).__game;
      return !!g && g.scene.isActive(k);
    },
    key,
    { timeout },
  );
  // let the fade-in finish
  await page.waitForTimeout(450);
}

/** Screen position (px) of the button whose label matches, searched in all active scenes (top scene first). */
export async function buttonPoint(page: Page, label: string): Promise<Pt> {
  const pt = await page.evaluate((lbl) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game;
    const scenes = g.scene.getScenes(true).slice().reverse();
    for (const sc of scenes) {
      const walk = (list: any[]): any => {
        for (const o of list) {
          if (o.type === 'Container' && o.input && o.visible && (o.name === lbl || o.list?.some((c: any) => c.type === 'Text' && c.text === lbl))) return o;
          if (o.type === 'Container' && o.list) {
            const r = walk(o.list);
            if (r) return r;
          }
        }
        return null;
      };
      const b = walk(sc.children.list);
      if (b) {
        const m = b.getWorldTransformMatrix();
        const cam = sc.cameras.main;
        const rect = g.canvas.getBoundingClientRect();
        const kx = rect.width / g.scale.gameSize.width;
        const ky = rect.height / g.scale.gameSize.height;
        return { x: rect.left + (m.tx - cam.scrollX) * kx, y: rect.top + (m.ty - cam.scrollY) * ky };
      }
    }
    return null;
  }, label);
  expect(pt, `button "${label}" not found`).not.toBeNull();
  return pt as Pt;
}

export async function clickButton(page: Page, label: string): Promise<void> {
  const p = await buttonPoint(page, label);
  await page.mouse.click(p.x, p.y);
}

/** Screen position of a design-space point. */
export async function designPoint(page: Page, x: number, y: number): Promise<Pt> {
  return page.evaluate(
    ([dx, dy]) => {
      const g = (window as any).__game; // eslint-disable-line @typescript-eslint/no-explicit-any
      const rect = g.canvas.getBoundingClientRect();
      const gs = g.scale.gameSize;
      const cam = g.scene.getScenes(true)[0].cameras.main;
      return { x: rect.left + (dx - cam.scrollX) * (rect.width / gs.width), y: rect.top + (dy - cam.scrollY) * (rect.height / gs.height) };
    },
    [x, y],
  );
}

type Dc = { session: Record<string, any>; services: Record<string, any>; game: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
export const dc = (page: Page) => ({
  eval: <T>(fn: (dc: Dc) => T) => page.evaluate(`(${fn.toString()})(window.__dc)`) as Promise<T>,
});

export async function sessionState(page: Page) {
  return page.evaluate(() => {
    const s = (window as any).__dc.session; // eslint-disable-line @typescript-eslint/no-explicit-any
    return { earned: s.earned as number, state: s.claw.state as string, status: s.status as string, time: s.timeLeft as number, target: s.level.target as number };
  });
}

export async function saveData(page: Page) {
  return page.evaluate(() => JSON.parse(JSON.stringify((window as any).__dc.services.save.data))); // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Fast-forward the running level without waiting for (slow, software rendered) frames.
 * Each step is a normal 1/60 s game update, exactly what a real frame does.
 */
export async function stepSession(page: Page, seconds: number): Promise<void> {
  await page.evaluate((sec) => {
    const s = (window as any).__dc.session; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (let t = 0; t < sec; t += 1 / 60) s.update(1 / 60);
  }, seconds);
}

export async function stepUntil(page: Page, stateName: string, maxSeconds = 20): Promise<void> {
  await page.evaluate(
    ([name, max]) => {
      const s = (window as any).__dc.session; // eslint-disable-line @typescript-eslint/no-explicit-any
      for (let t = 0; t < (max as number) && s.claw.state !== name; t += 1 / 60) s.update(1 / 60);
    },
    [stateName, maxSeconds] as const,
  );
}
