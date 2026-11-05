import Phaser from 'phaser';
import { WHEEL, type WheelPrize } from '../config/economy';
import { DESIGN } from '../config/game';
import { itemText, money, t } from '../i18n';
import { services } from '../services';
import { spinWheel, type SpinResult } from '../systems/Wheel';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { showTutorial } from '../ui/Tutorial';
import { Button } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

const R = 250;

/** Lucky Wheel: spend a spin token, win a prize. */
export class Wheel extends Phaser.Scene {
  private backdrop!: Backdrop;
  private wheel!: Phaser.GameObjects.Container;
  private spinBtn!: Button;
  private info!: Phaser.GameObjects.Text;
  private result!: Phaser.GameObjects.Text;
  private spinning = false;

  constructor() {
    super('Wheel');
  }

  create(): void {
    const layout = new Layout(this);
    const cx = DESIGN.width / 2;
    const cy = 600;
    this.spinning = false;
    this.backdrop = createBackdrop(this, layout, { theme: 'abyss' });
    this.add.rectangle(cx, DESIGN.height / 2, layout.width + 8, layout.height + 8, 0x0a0502, 0.5).setDepth(15);
    const topY = Math.max(layout.top + DESIGN.safeTop, 0);
    txt(this, cx, topY + 70, t('wheel').toUpperCase(), 78, { color: COLORS.textGold, strokeW: 12 }).setDepth(20);
    this.info = txt(this, cx, topY + 150, '', 36, { color: '#f4dba8' }).setDepth(20);

    // wheel: slices drawn once with Graphics
    const g = this.add.graphics();
    const n = WHEEL.length;
    const step = (Math.PI * 2) / n;
    WHEEL.forEach((w, i) => {
      const a0 = -Math.PI / 2 - step / 2 + i * step;
      g.fillStyle(w.color, 1);
      g.lineStyle(5, 0x2b1608, 1);
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, R, a0, a0 + step, false);
      g.closePath();
      g.fillPath();
      g.strokePath();
    });
    g.lineStyle(10, 0x2b1608, 1);
    g.strokeCircle(0, 0, R);
    this.wheel = this.add.container(cx, cy, [g]).setDepth(20);
    WHEEL.forEach((w, i) => {
      const a = i * step; // clockwise from the top
      const rx = Math.sin(a) * R * 0.66;
      const ry = -Math.cos(a) * R * 0.66;
      let label: Phaser.GameObjects.GameObject;
      if (w.icon) label = this.add.image(rx, ry, w.icon).setDisplaySize(78, 78).setAngle((a * 180) / Math.PI);
      else label = txt(this, rx, ry, money((w.prize as { amount: number }).amount), 34, { strokeW: 6 }).setAngle((a * 180) / Math.PI);
      this.wheel.add(label);
    });
    this.add.circle(cx, cy, 44, 0xffc21a).setStrokeStyle(8, 0x2b1608).setDepth(21);
    // pointer
    this.add.triangle(cx, cy - R - 6, 0, 0, 44, 0, 22, 56, 0xe5483a).setStrokeStyle(6, 0x2b1608).setDepth(22).setOrigin(0.5, 0.5);

    this.result = txt(this, cx, cy + R + 90, '', 40, { color: COLORS.textGreen, wrap: 600 }).setDepth(20);
    this.spinBtn = new Button(this, cx, cy + R + 190, { w: 400, label: t('spin'), fontSize: 56, tint: COLORS.green, key: 'ENTER', onClick: () => this.spin() }).setDepth(22);
    const back = new Button(this, cx, layout.bottom - 100, { w: 320, label: t('back'), fontSize: 42, tint: COLORS.brown, key: 'ESC', onClick: () => goTo(this, 'MainMenu') }).setDepth(22);
    layout.onChange(() => back.setY(layout.bottom - 100));
    this.refresh();
    fadeIn(this);
    this.time.delayedCall(700, () => showTutorial(this, layout, 'unlock_wheel'));
  }

  private refresh(): void {
    const n = services.save.data.spins;
    this.info.setText(n > 0 ? t('spinsLeft', { n }) : t('noSpins'));
    this.info.setWordWrapWidth(620);
    this.spinBtn.setEnabled(n > 0 && !this.spinning);
  }

  private describe(r: SpinResult): string {
    const p: WheelPrize = r.prize;
    if (r.converted) return money(r.converted);
    if (p.kind === 'money') return money(p.amount);
    if (p.kind === 'caps') return t('crateCaps', { n: p.amount });
    if (p.kind === 'freeze') return t('crateFreeze');
    if (p.kind === 'skip') return t('crateSkip');
    return r.boost ? itemText(r.boost).name : '';
  }

  private spin(): void {
    if (this.spinning) return;
    const save = services.save;
    const r = spinWheel(save.data, Math.random);
    if (!r) {
      services.audio.sfx('deny');
      return;
    }
    save.save();
    this.spinning = true;
    this.spinBtn.setEnabled(false);
    this.result.setText('');
    const step = 360 / WHEEL.length;
    const target = 360 * 5 - r.index * step;
    this.wheel.angle = this.wheel.angle % 360;
    services.audio.sfx('launch');
    this.tweens.add({
      targets: this.wheel,
      angle: target,
      duration: 4200,
      ease: 'Cubic.Out',
      onUpdate: (tw) => {
        if (Math.floor(tw.progress * 40) % 2 === 0 && Math.random() < 0.25) services.audio.sfx('tick', 0.4);
      },
      onComplete: () => {
        this.spinning = false;
        services.audio.sfx('win');
        services.audio.vibrate(60);
        this.result.setText(t('wheelWin', { what: this.describe(r) }));
        this.tweens.add({ targets: this.result, scale: { from: 0.6, to: 1 }, duration: 300, ease: 'Back.Out' });
        this.refresh();
      },
    });
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
