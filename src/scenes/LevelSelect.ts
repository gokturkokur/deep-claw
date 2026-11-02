import Phaser from 'phaser';
import { IMAGES } from '../assets/manifest';
import { DESIGN } from '../config/game';
import { LEVELS } from '../data/levels';
import { money, t } from '../i18n';
import { services } from '../services';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

const COLS = 4;
const CELL_W = 156;
const CELL_H = 176;
const GAP = 12;

export class LevelSelect extends Phaser.Scene {
  private backdrop!: Backdrop;

  constructor() {
    super('LevelSelect');
  }

  create(): void {
    const layout = new Layout(this);
    const save = services.save;
    const audio = services.audio;
    audio.playMusic('music_menu');
    this.backdrop = createBackdrop(this, layout);
    const cx = DESIGN.width / 2;

    txt(this, cx, Math.max(layout.top + 48, 0) + 90, t('levelSelect').toUpperCase(), 84, { color: COLORS.textGold, strokeW: 12 }).setDepth(20);

    const rows = Math.ceil(LEVELS.length / COLS);
    const gridW = COLS * CELL_W + (COLS - 1) * GAP;
    const startX = cx - gridW / 2 + CELL_W / 2;
    const startY = Math.max(layout.top + 48, 0) + 250;
    void rows;

    LEVELS.forEach((lvl, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * (CELL_W + GAP);
      const y = startY + row * (CELL_H + GAP);
      const unlocked = lvl.id <= save.data.unlockedLevel;
      const stars = save.stars(lvl.id);
      const cell = this.add.container(x, y).setDepth(20);
      const bg = this.add.nineslice(0, 0, 'btn', undefined, CELL_W, CELL_H, 48, 48, 40, 40);
      bg.setTint(!unlocked ? COLORS.grey : stars >= 3 ? 0xffd23a : stars > 0 ? 0x7cc86a : 0xf0a850);
      cell.add(bg);
      if (unlocked) {
        cell.add(txt(this, 0, -44, String(lvl.id), 66, { strokeW: 8 }));
        for (let s = 0; s < 3; s++) {
          const star = this.add
            .image((s - 1) * 38, 22, s < stars ? 'star_full' : 'star_empty')
            .setDisplaySize(IMAGES.star_full.w * 0.38, IMAGES.star_full.h * 0.38);
          cell.add(star);
        }
        const best = save.best(lvl.id);
        cell.add(txt(this, 0, 62, best > 0 ? money(best) : money(lvl.target), 24, { color: best > 0 ? COLORS.textGreen : '#f4dba8', strokeW: 4 }));
      } else {
        cell.add(this.add.image(0, -8, 'icon_lock').setDisplaySize(72, 72));
        cell.add(txt(this, 0, 52, String(lvl.id), 36, { color: '#d9d9d9', strokeW: 5 }));
      }
      cell.setSize(CELL_W, CELL_H);
      cell.setInteractive({ useHandCursor: unlocked });
      cell.on('pointerdown', () => unlocked && cell.setScale(0.95));
      cell.on('pointerout', () => cell.setScale(1));
      cell.on('pointerup', () => {
        cell.setScale(1);
        if (!unlocked) {
          audio.sfx('deny');
          this.tweens.add({ targets: cell, x: x + 8, duration: 50, yoyo: true, repeat: 2, onComplete: () => cell.setX(x) });
          return;
        }
        audio.sfx('click');
        goTo(this, 'Game', { levelId: lvl.id });
      });
    });

    const back = new Button(this, cx, layout.bottom - 90, {
      w: 320,
      label: t('back'),
      fontSize: 46,
      tint: COLORS.brown,
      key: 'ESC',
      onClick: () => goTo(this, 'MainMenu'),
    }).setDepth(20);
    layout.onChange(() => back.setY(layout.bottom - 90));
    fadeIn(this);
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
