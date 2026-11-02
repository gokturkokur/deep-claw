import Phaser from 'phaser';
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
}

export class GameOver extends Phaser.Scene {
  private d!: Data;
  private backdrop!: Backdrop;

  constructor() {
    super('GameOver');
  }

  init(data: Data): void {
    this.d = data;
  }

  create(): void {
    const layout = new Layout(this);
    const cx = DESIGN.width / 2;
    const cy = DESIGN.height / 2;
    const d = this.d;
    services.audio.loop('reel', false);
    services.audio.sfx('lose');
    this.backdrop = createBackdrop(this, layout);
    this.add.rectangle(cx, cy, layout.width + 8, layout.height + 8, 0x0a0502, 0.6).setDepth(15);

    const p = panel(this, cx, cy, 640, 760).setDepth(20);
    p.setScale(0.8).setAlpha(0);
    this.tweens.add({ targets: p, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    txt(this, cx, cy - 290, t('outOfTime'), 76, { color: COLORS.textRed, strokeW: 11 }).setDepth(21);
    txt(this, cx, cy - 215, t('level', { n: d.levelId }), 38, { color: '#f4dba8' }).setDepth(21);

    // progress toward the target
    const barW = 500;
    this.add.rectangle(cx, cy - 110, barW, 44, 0x1a0e06).setStrokeStyle(5, 0x2b1608).setDepth(21);
    const fill = this.add.rectangle(cx - barW / 2 + 3, cy - 110, 4, 34, 0xe5483a).setOrigin(0, 0.5).setDepth(22);
    this.tweens.add({ targets: fill, width: Math.max(4, (barW - 6) * Math.min(1, d.earned / d.target)), duration: 800, delay: 250, ease: 'Cubic.Out' });

    txt(this, cx - 270, cy - 30, t('earned'), 40, { originX: 0, color: '#f4dba8' }).setDepth(21);
    txt(this, cx + 270, cy - 30, money(d.earned), 56, { originX: 1, color: COLORS.textGold, strokeW: 8 }).setDepth(21);
    txt(this, cx - 270, cy + 45, t('targetLabel'), 40, { originX: 0, color: '#f4dba8' }).setDepth(21);
    txt(this, cx + 270, cy + 45, money(d.target), 48, { originX: 1, color: COLORS.textRed }).setDepth(21);

    new Button(this, cx, cy + 160, { w: 480, label: t('retry'), fontSize: 52, tint: COLORS.green, key: 'ENTER', onClick: () => goTo(this, 'Game', { levelId: d.levelId }) }).setDepth(22);
    new Button(this, cx - 150, cy + 285, { w: 270, label: t('levelSelect'), fontSize: 38, tint: COLORS.blue, onClick: () => goTo(this, 'LevelSelect') }).setDepth(22);
    new Button(this, cx + 150, cy + 285, { w: 270, label: t('menu'), fontSize: 38, tint: COLORS.brown, onClick: () => goTo(this, 'MainMenu') }).setDepth(22);
    fadeIn(this);
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
