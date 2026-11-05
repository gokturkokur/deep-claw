import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { LEVELS } from '../data/levels';
import { achText, missionText, money, t } from '../i18n';
import { services } from '../services';
import { missionIsRestriction, themeOf, type Mission } from '../systems/Campaign';
import { skipLevel } from '../systems/Progress';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, panel } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

interface Data {
  levelId: number;
  earned: number;
  target: number;
  unlocked?: string[];
  mission?: Mission | null;
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
    const save = services.save;
    services.audio.loop('reel', false);
    services.audio.sfx('lose');
    this.backdrop = createBackdrop(this, layout, { theme: themeOf(d.levelId) });
    this.add.rectangle(cx, cy, layout.width + 8, layout.height + 8, 0x0a0502, 0.6).setDepth(15);

    const unlocked = d.unlocked ?? [];
    const canSkip = save.data.inventory.skip > 0 && d.levelId < LEVELS.length;
    const h = 800 + unlocked.length * 46 + (canSkip ? 120 : 0);
    const top = cy - h / 2;
    const p = panel(this, cx, cy, 640, h).setDepth(20);
    p.setScale(0.8).setAlpha(0);
    this.tweens.add({ targets: p, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    txt(this, cx, top + 85, t('outOfTime'), 76, { color: COLORS.textRed, strokeW: 11 }).setDepth(21);
    txt(this, cx, top + 160, t('level', { n: d.levelId }), 38, { color: '#f4dba8' }).setDepth(21);

    // progress toward the target + "so close" message
    const barW = 500;
    const frac = Math.min(1, d.earned / Math.max(1, d.target));
    this.add.rectangle(cx, top + 235, barW, 44, 0x1a0e06).setStrokeStyle(5, 0x2b1608).setDepth(21);
    const fill = this.add.rectangle(cx - barW / 2 + 3, top + 235, 4, 34, frac >= 0.8 ? 0xffc21a : 0xe5483a).setOrigin(0, 0.5).setDepth(22);
    this.tweens.add({ targets: fill, width: Math.max(4, (barW - 6) * frac), duration: 800, delay: 250, ease: 'Cubic.Out' });
    txt(this, cx, top + 235, Math.round(frac * 100) + '%', 28, { strokeW: 5 }).setDepth(23);

    txt(this, cx - 270, top + 315, t('earned'), 40, { originX: 0, color: '#f4dba8' }).setDepth(21);
    txt(this, cx + 270, top + 315, money(d.earned), 56, { originX: 1, color: COLORS.textGold, strokeW: 8 }).setDepth(21);
    txt(this, cx - 270, top + 385, t('targetLabel'), 40, { originX: 0, color: '#f4dba8' }).setDepth(21);
    txt(this, cx + 270, top + 385, money(d.target), 48, { originX: 1, color: COLORS.textRed }).setDepth(21);
    let y = top + 450;
    if (frac >= 0.7) {
      const near = txt(this, cx, y, t('nearMiss', { n: money(d.target - d.earned) }), 34, { color: COLORS.textGold, wrap: 560 }).setDepth(21);
      this.tweens.add({ targets: near, scale: { from: 1, to: 1.06 }, duration: 500, yoyo: true, repeat: -1 });
    }
    y += 52;
    if (d.mission && !missionIsRestriction(d.mission)) {
      txt(this, cx, y, t('missionLabel', { text: missionText(d.mission.kind, d.mission.goal) }), 26, { color: '#d9c49a', wrap: 560, strokeW: 4 }).setDepth(21);
      y += 40;
    }
    for (const id of unlocked) {
      txt(this, cx, y, t('unlocked', { name: achText(id).name }), 30, { color: COLORS.textGold, wrap: 560 }).setDepth(21);
      y += 46;
    }

    let by = top + h - 330;
    new Button(this, cx, by, { w: 480, label: t('retry'), fontSize: 52, tint: COLORS.green, key: 'ENTER', onClick: () => goTo(this, 'Game', { levelId: d.levelId }) }).setDepth(22);
    by += 120;
    if (canSkip) {
      new Button(this, cx, by, {
        w: 480,
        label: t('skipLevel', { n: save.data.inventory.skip }),
        fontSize: 38,
        tint: COLORS.gold,
        onClick: () => {
          if (skipLevel(save.data, d.levelId)) {
            save.save();
            goTo(this, 'Game', { levelId: save.data.currentLevel });
          }
        },
      }).setDepth(22);
      by += 120;
    }
    new Button(this, cx - 150, by, { w: 270, label: t('levelSelect'), fontSize: 36, tint: COLORS.blue, onClick: () => goTo(this, 'LevelSelect') }).setDepth(22);
    new Button(this, cx + 150, by, { w: 270, label: t('menu'), fontSize: 36, tint: COLORS.brown, onClick: () => goTo(this, 'MainMenu') }).setDepth(22);
    fadeIn(this);
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
