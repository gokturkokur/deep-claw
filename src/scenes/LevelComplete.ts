import Phaser from 'phaser';
import { IMAGES } from '../assets/manifest';
import { DESIGN } from '../config/game';
import { money, t } from '../i18n';
import { services } from '../services';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, panel } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

interface Data {
  levelId: number;
  earned: number;
  target: number;
  stars: number;
  firstClear: boolean;
  newBest: boolean;
  walletGain: number;
}

export class LevelComplete extends Phaser.Scene {
  private d!: Data;
  private backdrop!: Backdrop;

  constructor() {
    super('LevelComplete');
  }

  init(data: Data): void {
    this.d = data;
  }

  create(): void {
    const layout = new Layout(this);
    const audio = services.audio;
    const cx = DESIGN.width / 2;
    const cy = DESIGN.height / 2;
    const d = this.d;
    audio.loop('reel', false);
    audio.sfx('win');
    this.backdrop = createBackdrop(this, layout);
    this.add.rectangle(cx, cy, layout.width + 8, layout.height + 8, 0x0a0502, 0.55).setDepth(15);

    const p = panel(this, cx, cy, 640, 900).setDepth(20);
    p.setScale(0.8).setAlpha(0);
    this.tweens.add({ targets: p, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    txt(this, cx, cy - 370, t('levelComplete'), 62, { color: COLORS.textGold, strokeW: 9 }).setDepth(21);
    txt(this, cx, cy - 305, t('level', { n: d.levelId }), 36, { color: '#f4dba8' }).setDepth(21);

    // stars pop in one by one
    const starSize = 150;
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * 170;
      const y = cy - 190 + (i === 1 ? -22 : 0);
      this.add.image(x, y, 'star_empty').setDisplaySize(starSize, starSize).setDepth(21);
      if (i < d.stars) {
        const star = this.add.image(x, y, 'star_full').setDisplaySize(starSize, starSize).setDepth(22).setScale(0);
        this.tweens.add({
          targets: star,
          scale: starSize / IMAGES.star_full.w,
          angle: { from: -30, to: 0 },
          delay: 500 + i * 420,
          duration: 380,
          ease: 'Back.Out',
          onStart: () => audio.sfx('gold', 1, 1 + i * 0.2),
        });
      }
    }

    const rowY = cy - 30;
    txt(this, cx - 270, rowY, t('earned'), 40, { originX: 0, color: '#f4dba8' }).setDepth(21);
    const earnedText = txt(this, cx + 270, rowY, money(0), 56, { originX: 1, color: COLORS.textGold, strokeW: 8 }).setDepth(21);
    txt(this, cx - 270, rowY + 70, t('targetLabel'), 36, { originX: 0, color: '#f4dba8' }).setDepth(21);
    txt(this, cx + 270, rowY + 70, money(d.target), 40, { originX: 1, color: COLORS.textGreen }).setDepth(21);
    const counter = { v: 0 };
    this.tweens.add({
      targets: counter,
      v: d.earned,
      duration: 900,
      delay: 300,
      onUpdate: () => earnedText.setText(money(counter.v)),
      onComplete: () => earnedText.setText(money(d.earned)),
    });

    if (d.firstClear) {
      txt(this, cx - 270, rowY + 140, t('wallet'), 36, { originX: 0, color: '#f4dba8' }).setDepth(21);
      txt(this, cx + 270, rowY + 140, money(services.save.data.wallet), 44, { originX: 1, color: COLORS.textGold }).setDepth(21);
    } else {
      txt(this, cx, rowY + 150, t('replayNoCoins'), 30, { color: '#f4dba8', wrap: 540 }).setDepth(21);
    }
    if (d.newBest && !d.firstClear) {
      const nb = txt(this, cx, rowY + 205, t('newBest'), 40, { color: COLORS.textGreen }).setDepth(21);
      this.tweens.add({ targets: nb, scale: { from: 1, to: 1.12 }, duration: 500, yoyo: true, repeat: -1 });
    }

    const by = cy + 335;
    if (d.firstClear) {
      new Button(this, cx, by, { w: 480, label: t('toShop'), fontSize: 50, tint: COLORS.green, key: 'ENTER', onClick: () => goTo(this, 'Shop') }).setDepth(22);
    } else {
      new Button(this, cx - 150, by, { w: 270, label: t('retry'), fontSize: 38, tint: COLORS.green, key: 'ENTER', onClick: () => goTo(this, 'Game', { levelId: d.levelId }) }).setDepth(22);
      new Button(this, cx + 150, by, { w: 270, label: t('levelSelect'), fontSize: 38, tint: COLORS.blue, onClick: () => goTo(this, 'LevelSelect') }).setDepth(22);
    }
    fadeIn(this);
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
