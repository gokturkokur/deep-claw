import Phaser from 'phaser';
import { IMAGES, type ImageKey } from '../assets/manifest';
import { DESIGN } from '../config/game';
import { t } from '../i18n';
import { services } from '../services';
import { COLORS, FONT, img, txt, type Layout } from './theme';

// ---------------------------------------------------------------- Panel
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.NineSlice {
  return scene.add.nineslice(x, y, 'panel', undefined, w, h, 56, 56, 56, 56);
}

// ---------------------------------------------------------------- Button
export interface ButtonOpts {
  w?: number;
  h?: number;
  label?: string;
  icon?: ImageKey;
  tint?: number;
  fontSize?: number;
  round?: boolean;
  onClick: () => void;
  /** Keyboard shortcut (Phaser key code string, e.g. 'ENTER'). */
  key?: string;
  silent?: boolean;
}

/** A chunky button: min 96 x 96, pressed state, click sound. */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice | Phaser.GameObjects.Image;
  private labelText?: Phaser.GameObjects.Text;
  private iconImg?: Phaser.GameObjects.Image;
  private enabled = true;
  private baseTint: number;
  private pressed = false;
  private readonly onClick: () => void;
  private readonly silent: boolean;
  private bw: number;
  private bh: number;

  constructor(scene: Phaser.Scene, x: number, y: number, o: ButtonOpts) {
    super(scene, x, y);
    this.onClick = o.onClick;
    this.silent = !!o.silent;
    this.baseTint = o.tint ?? COLORS.gold;
    const round = !!o.round;
    this.bw = Math.max(DESIGN.minButton, o.w ?? (round ? 104 : 300));
    this.bh = Math.max(DESIGN.minButton, o.h ?? (round ? 104 : 104));
    if (round) {
      this.bg = scene.add.image(0, 0, 'btn_round').setDisplaySize(this.bw, this.bh);
    } else {
      this.bg = scene.add.nineslice(0, 0, 'btn', undefined, this.bw, this.bh, 48, 48, 40, 40);
    }
    this.bg.setTint(this.baseTint);
    this.add(this.bg);
    if (o.icon) {
      const a = IMAGES[o.icon];
      const k = Math.min(1, (this.bh * 0.62) / a.h);
      this.iconImg = scene.add.image(o.label ? -this.bw / 2 + this.bh * 0.5 : 0, -4, o.icon).setDisplaySize(a.w * k, a.h * k);
      this.add(this.iconImg);
    }
    if (o.label) {
      const size = o.fontSize ?? 40;
      this.labelText = txt(scene, this.iconImg ? this.bh * 0.25 : 0, -5, o.label, size, { strokeW: 5 });
      // keep long labels inside the button
      const maxW = this.bw - (this.iconImg ? this.bh * 1.0 : 36);
      if (this.labelText.width > maxW) this.labelText.setScale(maxW / this.labelText.width);
      this.add(this.labelText);
    }
    this.setSize(this.bw, this.bh);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => this.press(true));
    this.on('pointerout', () => this.press(false));
    this.on('pointerup', () => {
      if (!this.pressed || !this.enabled) return;
      this.press(false);
      if (!this.silent) services.audio.sfx('click');
      this.onClick();
    });
    if (o.key && scene.input.keyboard) {
      const k = scene.input.keyboard.addKey(o.key);
      k.on('down', () => {
        if (!this.enabled || !this.active || !this.visible) return;
        if (!this.silent) services.audio.sfx('click');
        this.onClick();
      });
    }
    scene.add.existing(this);
  }

  private press(down: boolean): void {
    if (!this.enabled) return;
    this.pressed = down;
    this.bg.setTint(down ? Phaser.Display.Color.ValueToColor(this.baseTint).darken(25).color : this.baseTint);
    this.setScale(down ? 0.94 : 1);
    this.bg.y = down ? 4 : 0;
    if (this.labelText) this.labelText.y = down ? -1 : -5;
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.bg.setTint(on ? this.baseTint : COLORS.grey);
    this.setAlpha(on ? 1 : 0.7);
    return this;
  }

  setLabel(s: string): void {
    this.labelText?.setText(s);
  }

  setTintColor(c: number): void {
    this.baseTint = c;
    this.bg.setTint(this.enabled ? c : COLORS.grey);
  }

  /** Simple "pop" animation. */
  pop(): void {
    this.scene.tweens.add({ targets: this, scale: { from: 1, to: 1.12 }, duration: 110, yoyo: true });
  }
}

// ---------------------------------------------------------------- Slider
export class Slider extends Phaser.GameObjects.Container {
  private fill: Phaser.GameObjects.NineSlice;
  private knob: Phaser.GameObjects.Image;
  private value: number;
  private readonly trackW: number;
  private dragging = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    initial: number,
    private readonly onChange: (v: number) => void,
    private readonly onRelease: () => void,
  ) {
    super(scene, x, y);
    this.trackW = w;
    this.value = initial;
    const track = scene.add.nineslice(0, 0, 'slider_track', undefined, w, 36, 18, 18, 12, 12);
    this.fill = scene.add.nineslice(-w / 2, 0, 'slider_fill', undefined, w, 36, 18, 18, 12, 12).setOrigin(0, 0.5);
    this.knob = scene.add.image(0, 0, 'slider_knob').setDisplaySize(64, 64);
    this.add([track, this.fill, this.knob]);
    this.setSize(w + 64, 100);
    this.setInteractive({ useHandCursor: true, draggable: false });
    this.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.setFromPointer(p);
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragging) this.setFromPointer(p);
    });
    const up = () => {
      if (!this.dragging) return;
      this.dragging = false;
      this.onRelease();
    };
    scene.input.on('pointerup', up);
    scene.input.on('pointerupoutside', up);
    this.layoutKnob();
    scene.add.existing(this);
  }

  private setFromPointer(p: Phaser.Input.Pointer): void {
    const m = this.getWorldTransformMatrix();
    const lx = p.worldX - m.tx;
    this.value = Phaser.Math.Clamp((lx + this.trackW / 2) / this.trackW, 0, 1);
    this.layoutKnob();
    this.onChange(this.value);
  }

  private layoutKnob(): void {
    this.knob.x = -this.trackW / 2 + this.value * this.trackW;
    this.fill.width = Math.max(36, this.value * this.trackW);
    this.fill.setVisible(this.value > 0.01);
  }
}

// ---------------------------------------------------------------- Dim + dialogs
export function dim(scene: Phaser.Scene, layout: Layout, alpha = 0.62): Phaser.GameObjects.Rectangle {
  const r = scene.add
    .rectangle(DESIGN.width / 2, DESIGN.height / 2, layout.width + 4, layout.height + 4, 0x0a0502, alpha)
    .setInteractive(); // swallow taps so nothing behind reacts
  layout.onChange(() => r.setSize(layout.width + 4, layout.height + 4).setPosition(DESIGN.width / 2, DESIGN.height / 2));
  return r;
}

export interface Confirm {
  show(title: string, text: string, onYes: () => void): void;
}

/** Small yes/no dialog drawn inside a scene. */
export function createConfirm(scene: Phaser.Scene, layout: Layout, depth = 500): Confirm {
  const group = scene.add.container(0, 0).setDepth(depth).setVisible(false);
  const shade = dim(scene, layout, 0.7);
  const p = panel(scene, DESIGN.width / 2, DESIGN.height / 2, 600, 440);
  const title = txt(scene, DESIGN.width / 2, DESIGN.height / 2 - 140, '', 46, { color: COLORS.textGold, wrap: 520 });
  const body = txt(scene, DESIGN.width / 2, DESIGN.height / 2 - 40, '', 34, { wrap: 520 });
  let yes: () => void = () => undefined;
  const bYes = new Button(scene, DESIGN.width / 2 - 140, DESIGN.height / 2 + 120, { w: 230, label: '', tint: COLORS.green, onClick: () => { group.setVisible(false); yes(); } });
  const bNo = new Button(scene, DESIGN.width / 2 + 140, DESIGN.height / 2 + 120, { w: 230, label: '', tint: COLORS.red, onClick: () => group.setVisible(false) });
  group.add([shade, p, title, body, bYes, bNo]);
  return {
    show(tt, text, onYes) {
      title.setText(tt);
      body.setText(text);
      yes = onYes;
      bYes.setLabel(t('yes'));
      bNo.setLabel(t('no'));
      group.setVisible(true);
    },
  };
}

// ---------------------------------------------------------------- Floating text (pooled)
export class FloatingTexts {
  private pool: Phaser.GameObjects.Text[] = [];
  private cursor = 0;

  constructor(scene: Phaser.Scene, size: number, depth: number) {
    for (let i = 0; i < size; i++) {
      const t = txt(scene, 0, 0, '', 48, { strokeW: 7 }).setDepth(depth).setVisible(false);
      this.pool.push(t);
    }
  }

  show(scene: Phaser.Scene, x: number, y: number, text: string, color: string, size = 52): void {
    const t = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.pool.length;
    scene.tweens.killTweensOf(t);
    t.setText(text).setColor(color).setFontSize(size).setPosition(x, y).setAlpha(1).setScale(0.6).setVisible(true);
    scene.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.Out' });
    scene.tweens.add({
      targets: t,
      y: y - 110,
      alpha: 0,
      delay: 380,
      duration: 650,
      ease: 'Sine.In',
      onComplete: () => t.setVisible(false),
    });
  }
}

export { FONT, img };
