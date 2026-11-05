import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { achText, money, t } from '../i18n';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, panel } from '../ui/components';
import { services } from '../services';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

type Data =
  | { kind: 'endless'; score: number; waves: number; newBest: boolean; walletGain: number; best: number; bestWaves: number; unlocked: string[] }
  | { kind: 'weekly'; score: number; target: number; won: boolean; newBest: boolean; reward: number; best: number; unlocked: string[] };

/** Result screen for Endless runs and the Weekly Challenge. */
export class Results extends Phaser.Scene {
  private d!: Data;
  private backdrop!: Backdrop;

  constructor() {
    super('Results');
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
    const good = d.kind === 'weekly' ? d.won : d.newBest;
    services.audio.sfx(good ? 'win' : 'lose');
    this.backdrop = createBackdrop(this, layout, { theme: d.kind === 'weekly' ? 'ice' : 'abyss' });
    this.add.rectangle(cx, cy, layout.width + 8, layout.height + 8, 0x0a0502, 0.6).setDepth(15);
    const unlocked = d.unlocked ?? [];
    const h = 760 + unlocked.length * 50;
    panel(this, cx, cy, 640, h).setDepth(20);
    const top = cy - h / 2;
    const title = d.kind === 'weekly' ? (d.won ? t('weeklyDone') : t('weeklyTitle')) : t('endlessOver');
    txt(this, cx, top + 90, title, 54, { color: d.kind === 'weekly' && !d.won ? COLORS.textRed : COLORS.textGold, strokeW: 9, wrap: 560 }).setDepth(21);

    let y = top + 190;
    const row = (label: string, value: string, color: string = COLORS.textGold) => {
      txt(this, cx - 270, y, label, 38, { originX: 0, color: '#f4dba8' }).setDepth(21);
      txt(this, cx + 270, y, value, 48, { originX: 1, color, strokeW: 7 }).setDepth(21);
      y += 78;
    };
    row(t('score'), money(d.score));
    if (d.kind === 'endless') {
      row(t('waves'), String(d.waves), COLORS.textLight);
      row(t('wallet'), '+' + money(d.walletGain), COLORS.textGreen);
      txt(this, cx, y, t('endlessBest', { n: money(d.best), w: d.bestWaves }), 30, { color: '#f4dba8', wrap: 560 }).setDepth(21);
    } else {
      row(t('targetLabel'), money(d.target), d.won ? COLORS.textGreen : COLORS.textRed);
      if (d.reward > 0) row(t('bonus'), '+' + money(d.reward), COLORS.textGreen);
      txt(this, cx, y, t('weeklyBest', { n: money(d.best) }), 30, { color: '#f4dba8', wrap: 560 }).setDepth(21);
    }
    y += 50;
    if (good) {
      const nb = txt(this, cx, y, t('newRecord'), 44, { color: COLORS.textGreen }).setDepth(21);
      this.tweens.add({ targets: nb, scale: { from: 1, to: 1.12 }, duration: 450, yoyo: true, repeat: -1 });
    }
    y += 60;
    for (const id of unlocked) {
      txt(this, cx, y, t('unlocked', { name: achText(id).name }), 32, { color: COLORS.textGold, wrap: 560 }).setDepth(21);
      y += 50;
    }

    const mode = d.kind;
    new Button(this, cx, cy + h / 2 - 190, { w: 480, label: t('retry'), fontSize: 50, tint: COLORS.green, key: 'ENTER', onClick: () => goTo(this, 'Game', { mode }) }).setDepth(22);
    new Button(this, cx, cy + h / 2 - 70, { w: 320, label: t('menu'), fontSize: 40, tint: COLORS.brown, onClick: () => goTo(this, 'MainMenu') }).setDepth(22);
    fadeIn(this);
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
