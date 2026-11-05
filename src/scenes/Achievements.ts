import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { achText, money, t } from '../i18n';
import { services } from '../services';
import { ACHIEVEMENTS } from '../systems/Achievements';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { showTutorial } from '../ui/Tutorial';
import { Button, panel } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

const ROW = 126;

/** Scrollable list of achievements with progress. */
export class Achievements extends Phaser.Scene {
  private backdrop!: Backdrop;

  constructor() {
    super('Achievements');
  }

  create(): void {
    const layout = new Layout(this);
    const save = services.save.data;
    this.backdrop = createBackdrop(this, layout);
    this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, layout.width + 8, layout.height + 8, 0x0a0502, 0.5).setDepth(15);
    const cx = DESIGN.width / 2;
    const topY = Math.max(layout.top + DESIGN.safeTop, 0);
    const done = save.achievements.length;
    txt(this, cx, topY + 56, t('achievements').toUpperCase(), 80, { color: COLORS.textGold, strokeW: 12 }).setDepth(20);
    txt(this, cx, topY + 130, `${done} / ${ACHIEVEMENTS.length}`, 40, { color: COLORS.textGreen }).setDepth(20);

    const viewTop = topY + 175;
    const bottom = layout.bottom - 190;
    const viewH = bottom - viewTop;
    const list = this.add.container(0, 0).setDepth(20);
    ACHIEVEMENTS.forEach((a, i) => {
      const y = viewTop + 60 + i * ROW;
      const has = save.achievements.includes(a.id);
      const [cur, goal] = a.progress(save);
      const tx = achText(a.id);
      const c = this.add.container(0, 0);
      c.add(panel(this, cx, y, 660, ROW - 12));
      const icon = this.add.image(cx - 272, y, 'icon_trophy').setDisplaySize(72, 72);
      if (!has) icon.setTint(0x555555);
      c.add(icon);
      c.add(txt(this, cx - 215, y - 30, tx.name, 32, { originX: 0, color: has ? COLORS.textGold : '#cfcfcf', strokeW: 5 }));
      c.add(txt(this, cx - 215, y + 6, tx.desc, 21, { originX: 0, strokeW: 3, wrap: 330, align: 'left', shadow: false }));
      const bar = this.add.rectangle(cx - 215, y + 38, 280, 14, 0x1a0e06).setOrigin(0, 0.5).setStrokeStyle(2, 0x2b1608);
      c.add(bar);
      if (cur > 0) c.add(this.add.rectangle(cx - 215, y + 38, Math.max(6, 280 * Math.min(1, cur / goal)), 10, has ? 0x58c24a : 0xffc21a).setOrigin(0, 0.5));
      c.add(txt(this, cx + 290, y - 22, has ? 'OK' : `${Math.min(cur, goal).toLocaleString()}/${goal.toLocaleString()}`, 24, { originX: 1, color: has ? COLORS.textGreen : '#f4dba8', strokeW: 4 }));
      c.add(txt(this, cx + 290, y + 20, '+' + money(a.reward), 28, { originX: 1, color: COLORS.textGold, strokeW: 5 }));
      list.add(c);
    });

    // scrolling inside a clipped window
    const maskG = this.make.graphics({ x: 0, y: 0 });
    maskG.fillRect(0, viewTop, DESIGN.width + 4000, viewH);
    maskG.x = -2000;
    list.setMask(maskG.createGeometryMask());
    const contentH = ACHIEVEMENTS.length * ROW + 20;
    const minY = Math.min(0, viewH - contentH);
    let dragging = false;
    let lastY = 0;
    const clamp = () => (list.y = Phaser.Math.Clamp(list.y, minY, 0));
    const zone = this.add.zone(cx, viewTop + viewH / 2, DESIGN.width + 2000, viewH).setInteractive().setDepth(19);
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragging = true;
      lastY = p.y;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      list.y += p.y - lastY;
      lastY = p.y;
      clamp();
    });
    this.input.on('pointerup', () => (dragging = false));
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      list.y -= dy;
      clamp();
    });

    const back = new Button(this, cx, layout.bottom - 100, { w: 360, label: t('back'), fontSize: 44, tint: COLORS.green, key: 'ESC', onClick: () => goTo(this, 'MainMenu') }).setDepth(22);
    layout.onChange(() => back.setY(layout.bottom - 100));
    fadeIn(this);
    this.time.delayedCall(700, () => showTutorial(this, layout, 'unlock_awards'));
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
