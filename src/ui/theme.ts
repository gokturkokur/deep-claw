import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { IMAGES, type ImageKey } from '../assets/manifest';

export const FONT = '"Lilita One", "Arial Black", Impact, sans-serif';

export const COLORS = {
  gold: 0xffc21a,
  green: 0x58c24a,
  red: 0xe5483a,
  blue: 0x3a8fe0,
  brown: 0x8a5a2e,
  grey: 0x8f8f8f,
  white: 0xffffff,
  textLight: '#fff6dc',
  textGold: '#ffd23a',
  textGreen: '#7dff6a',
  textRed: '#ff6a5a',
  ink: '#2b1608',
} as const;

/** Visible rectangle in design coordinates (grows on tall / wide screens). */
export class Layout {
  left: number = 0;
  right: number = DESIGN.width;
  top: number = 0;
  bottom: number = DESIGN.height;
  width: number = DESIGN.width;
  height: number = DESIGN.height;
  private readonly cbs: Array<() => void> = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.apply();
    const onResize = () => {
      this.apply();
      for (const cb of this.cbs) cb();
    };
    scene.scale.on('resize', onResize);
    scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
  }

  /** Called whenever the screen size changes. */
  onChange(cb: () => void): void {
    this.cbs.push(cb);
  }

  private apply(): void {
    const s = this.scene.scale.gameSize;
    this.width = s.width;
    this.height = s.height;
    this.left = DESIGN.width / 2 - s.width / 2;
    this.right = DESIGN.width / 2 + s.width / 2;
    this.top = DESIGN.height / 2 - s.height / 2;
    this.bottom = DESIGN.height / 2 + s.height / 2;
    this.scene.cameras.main.setSize(s.width, s.height);
    this.scene.cameras.main.centerOn(DESIGN.width / 2, DESIGN.height / 2);
  }
}

/** Image drawn at its nominal (manifest) size. */
export function img(scene: Phaser.Scene, key: ImageKey, x: number, y: number): Phaser.GameObjects.Image {
  const a = IMAGES[key];
  return scene.add.image(x, y, key).setDisplaySize(a.w, a.h);
}

export interface TextOpts {
  color?: string;
  stroke?: string;
  strokeW?: number;
  originX?: number;
  originY?: number;
  align?: string;
  wrap?: number;
  shadow?: boolean;
}

export function txt(scene: Phaser.Scene, x: number, y: number, str: string, size: number, o: TextOpts = {}): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color: o.color ?? COLORS.textLight,
    stroke: o.stroke ?? COLORS.ink,
    strokeThickness: o.strokeW ?? Math.max(3, Math.round(size / 7)),
    align: o.align ?? 'center',
    wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
    padding: { x: 2, y: 4 },
  });
  t.setOrigin(o.originX ?? 0.5, o.originY ?? 0.5);
  if (o.shadow !== false) t.setShadow(0, Math.max(2, Math.round(size / 14)), '#000', 0, true, true);
  t.setResolution(2);
  return t;
}

/** Fade the scene in. Call at the end of create(). */
export function fadeIn(scene: Phaser.Scene): void {
  scene.cameras.main.fadeIn(240, 20, 10, 4);
}

let transitioning = false;

/** Fade out, then start another scene. Ignores extra calls while a transition runs. */
export function goTo(scene: Phaser.Scene, key: string, data?: object): void {
  if (transitioning) return;
  transitioning = true;
  scene.cameras.main.fadeOut(240, 20, 10, 4);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    transitioning = false;
    scene.scene.start(key, data);
  });
  // safety: never stay locked if the fade event is lost (e.g. hidden tab)
  scene.time.delayedCall(900, () => {
    transitioning = false;
  });
}
