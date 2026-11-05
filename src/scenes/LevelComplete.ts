import Phaser from 'phaser';
import { IMAGES } from '../assets/manifest';
import { DESIGN } from '../config/game';
import { achText, missionText, money, t } from '../i18n';
import { LEVELS } from '../data/levels';
import { themeOf, type Mission } from '../systems/Campaign';
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
  missionBonus?: number;
  unlocked?: string[];
  mission?: Mission | null;
  missionOk?: boolean;
  extraBonus?: number;
  spinEarned?: boolean;
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
    const d = this.d;
    const cy0 = DESIGN.height / 2;
    const unlockedN = (d.unlocked ?? []).length;
    const extra = (d.mission ? 1 : 0) + ((d.missionBonus ?? 0) > 0 ? 1 : 0) + ((d.extraBonus ?? 0) > 0 && d.firstClear ? 1 : 0) + (d.spinEarned ? 1 : 0) + unlockedN;
    // content is laid out from the panel's top edge, so a taller panel grows both up and down
    const cy = cy0 - extra * 20;
    audio.loop('reel', false);
    audio.sfx('win');
    this.backdrop = createBackdrop(this, layout, { theme: themeOf(d.levelId) });
    this.add.rectangle(cx, cy0, layout.width + 8, layout.height + 8, 0x0a0502, 0.55).setDepth(15);

    const unlocked = d.unlocked ?? [];
    const p = panel(this, cx, cy0, 640, 900 + extra * 40).setDepth(20);
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

    let ay0 = 0;
    if (d.spinEarned) {
      ay0 = 38;
    }
    let ay = rowY + 205 + (d.newBest && !d.firstClear ? 45 : 0);
    if (d.mission && d.firstClear !== undefined) {
      const ok = !!d.missionOk;
      txt(this, cx, ay, t('missionLabel', { text: missionText(d.mission.kind, d.mission.goal) }) + (ok ? '  OK' : ''), 26, { color: ok ? COLORS.textGreen : '#d9c49a', wrap: 560, strokeW: 4 }).setDepth(21);
      ay += 36;
      if (ok && (d.missionBonus ?? 0) > 0) {
        txt(this, cx, ay, t('missionDone', { n: money(d.missionBonus ?? 0) }), 28, { color: COLORS.textGreen, wrap: 560 }).setDepth(21);
        ay += 38;
      }
    }
    if ((d.extraBonus ?? 0) > 0 && d.firstClear) {
      txt(this, cx, ay, t('boss') + ' ' + t('bonus') + ': +' + money(d.extraBonus ?? 0), 30, { color: COLORS.textGold, wrap: 560 }).setDepth(21);
      ay += 40;
    }
    if (d.spinEarned) {
      txt(this, cx, ay, t('spinEarned'), 28, { color: COLORS.textGreen, wrap: 560 }).setDepth(21);
      ay += ay0;
    }
    for (const id of unlocked) {
      txt(this, cx, ay, t('unlocked', { name: achText(id).name }), 28, { color: COLORS.textGold, wrap: 560 }).setDepth(21);
      ay += 40;
    }
    const by = cy + 335 + extra * 40;
    if (d.firstClear) {
      new Button(this, cx, by, { w: 480, label: t('toShop'), fontSize: 50, tint: COLORS.green, key: 'ENTER', onClick: () => goTo(this, 'Shop') }).setDepth(22);
    } else {
      new Button(this, cx - 150, by, { w: 270, label: t('retry'), fontSize: 38, tint: COLORS.green, key: 'ENTER', onClick: () => goTo(this, 'Game', { levelId: d.levelId }) }).setDepth(22);
      new Button(this, cx + 150, by, { w: 270, label: t('levelSelect'), fontSize: 38, tint: COLORS.blue, onClick: () => goTo(this, 'LevelSelect') }).setDepth(22);
    }
    fadeIn(this);

    // the story ends here: play the finale once after the last level
    if (d.levelId >= LEVELS.length && d.firstClear && !services.save.data.storySeen.includes('finale')) {
      this.time.delayedCall(1800, () => {
        this.scene.pause();
        this.scene.launch('Story', { beat: 'finale', from: 'LevelComplete' });
      });
    }
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
