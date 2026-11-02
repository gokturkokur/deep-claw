import Phaser from 'phaser';
import { IMAGES } from '../assets/manifest';
import { DESIGN, WORLD } from '../config/game';
import { img, type Layout } from './theme';

const WIDE = 5200; // wide enough for ultra-wide screens
const TALL = 2600;

export interface Backdrop {
  /** Ambient update (call every frame). */
  update(time: number, dt: number): void;
}

/**
 * Warm underground mine: sky + hills above the ground line, soil below with depth shading,
 * fossils / crystals / roots, lantern glow, drifting dust motes and the odd water drip.
 * Everything is oversized so tall and wide screens show decoration instead of black bars.
 */
export function createBackdrop(scene: Phaser.Scene, layout: Layout, opts: { surface?: boolean } = {}): Backdrop {
  const cx = DESIGN.width / 2;
  const surface = WORLD.surfaceY;
  const sky = IMAGES.bg_sky;

  // sky: solid colour above the image, tiled image from y = surface - 300
  scene.add.rectangle(cx, surface - sky.h - TALL / 2, WIDE, TALL, 0x3a2a5c).setDepth(0);
  scene.add.tileSprite(cx, surface - sky.h / 2, WIDE, sky.h, 'bg_sky').setDepth(0);
  scene.add.image(560, surface - 150, 'deco_sun').setDepth(1).setDisplaySize(IMAGES.deco_sun.w, IMAGES.deco_sun.h);
  const clouds = [
    img(scene, 'deco_cloud', 140, surface - 240).setDepth(1),
    img(scene, 'deco_cloud', 470, surface - 190).setDepth(1),
  ];

  // soil
  scene.add.tileSprite(cx, surface + TALL / 2, WIDE, TALL, 'soil_tile').setOrigin(0.5, 0.5).setDepth(2);
  scene.add
    .image(cx, surface + 700, 'soil_shade')
    .setDisplaySize(WIDE, 1400)
    .setDepth(3);
  scene.add.tileSprite(cx, surface - 4, WIDE, IMAGES.ground_top.h, 'ground_top').setOrigin(0.5, 0.5).setTileScale(1, 1).setDepth(4).setY(surface - 14 + 0);

  // decorations in the soil (faint, not part of gameplay)
  const deco: Array<[string, number, number, number]> = [
    ['deco_fossil', 90, 1120, 0.5],
    ['deco_crystal', 640, 980, 0.8],
    ['deco_roots', 40, 470, 0.35],
    ['deco_roots', 690, 700, 0.35],
    ['deco_fossil', 600, 560, 0.4],
    ['deco_crystal', 70, 760, 0.7],
  ];
  for (const [k, x, y, a] of deco) {
    const d = scene.add.image(x, y, k).setAlpha(a).setDepth(5);
    if (k === 'deco_crystal') d.setBlendMode(Phaser.BlendModes.NORMAL);
  }

  // lantern glow near the rig
  const glow = scene.add
    .image(WORLD.pivotX, WORLD.pivotY + 40, 'glow')
    .setDisplaySize(620, 620)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(opts.surface ? 0.0 : 0.35)
    .setDepth(6);

  // dust motes
  const motes: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 14; i++) {
    const m = scene.add
      .image(Phaser.Math.Between(0, DESIGN.width), Phaser.Math.Between(surface + 40, DESIGN.height), 'dust')
      .setDepth(7)
      .setAlpha(Phaser.Math.FloatBetween(0.15, 0.5))
      .setScale(Phaser.Math.FloatBetween(0.5, 1.2))
      .setBlendMode(Phaser.BlendModes.ADD);
    motes.push(m);
  }

  // water drip
  const drip = scene.add.image(0, 0, 'drop').setDepth(7).setVisible(false).setAlpha(0.85);
  let nextDrip = 2;
  let dripT = -1;
  let dripX = 0;

  // vignette
  const vig = scene.add.image(DESIGN.width / 2, DESIGN.height / 2, 'vignette').setDepth(8).setScrollFactor(1);
  const fitVig = () => vig.setDisplaySize(layout.width + 8, layout.height + 8).setPosition(DESIGN.width / 2, DESIGN.height / 2);
  fitVig();
  layout.onChange(fitVig);

  return {
    update(time, dt) {
      glow.setAlpha((opts.surface ? 0.0 : 0.3) + Math.sin(time / 260) * 0.03 + Math.sin(time / 97) * 0.015);
      for (let i = 0; i < clouds.length; i++) {
        clouds[i].x += (6 + i * 3) * dt;
        if (clouds[i].x > layout.right + 160) clouds[i].x = layout.left - 160;
      }
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.y -= (6 + (i % 5) * 3) * dt;
        m.x += Math.sin(time / 1400 + i) * 8 * dt;
        if (m.y < surface + 20) {
          m.y = layout.bottom + 10;
          m.x = Phaser.Math.Between(Math.round(layout.left), Math.round(layout.right));
        }
      }
      nextDrip -= dt;
      if (nextDrip <= 0 && dripT < 0) {
        dripT = 0;
        dripX = Phaser.Math.Between(60, 660);
        nextDrip = Phaser.Math.FloatBetween(3, 7);
        drip.setVisible(true);
      }
      if (dripT >= 0) {
        dripT += dt;
        drip.setPosition(dripX, surface + 60 + dripT * dripT * 420);
        if (drip.y > surface + 360) {
          dripT = -1;
          drip.setVisible(false);
        }
      }
    },
  };
}
