import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { CHAPTER_TITLE, STORY, WHO_NAME, type Beat, type Who } from '../data/story';
import { getLang, t, worldName } from '../i18n';
import { services } from '../services';
import { Button, dim, panel } from '../ui/components';
import { COLORS, Layout, txt } from '../ui/theme';

interface Data {
  beat: string;
  /** Scene to resume when the dialogue ends. */
  from: string;
}

const PORTRAIT: Record<Who, { key: string; w: number; h: number }> = {
  dusty: { key: 'miner', w: 150, h: 190 },
  pebble: { key: 'char_pebble', w: 190, h: 190 },
  baron: { key: 'char_baron', w: 190, h: 190 },
};

/** Dialogue overlay with a typewriter effect. Tap to advance, Skip to end. */
export class Story extends Phaser.Scene {
  private d!: Data;
  private beat!: Beat;
  private index = 0;
  private full = '';
  private shown = 0;
  private body!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image;
  private hint!: Phaser.GameObjects.Text;
  private ready = false;
  private done = false;

  constructor() {
    super('Story');
  }

  init(data: Data): void {
    this.d = data;
    this.index = 0;
    this.done = false;
    this.ready = false;
  }

  create(): void {
    const layout = new Layout(this);
    const cx = DESIGN.width / 2;
    this.beat = STORY.find((b) => b.id === this.d.beat) as Beat;
    const shade = dim(this, layout, 0.5);
    shade.on('pointerdown', () => this.advance());

    const py = 1020;
    panel(this, cx, py, 680, 300).setDepth(5);
    this.nameText = txt(this, cx - 300, py - 118, '', 40, { originX: 0, color: COLORS.textGold, strokeW: 6 }).setDepth(6);
    this.body = txt(this, cx - 300, py - 70, '', 34, { originX: 0, originY: 0, align: 'left', wrap: 600, strokeW: 4, shadow: false }).setDepth(6);
    this.hint = txt(this, cx + 290, py + 120, t('tapContinue'), 26, { originX: 1, color: '#f4dba8', strokeW: 4 }).setDepth(6);
    this.tweens.add({ targets: this.hint, alpha: { from: 1, to: 0.35 }, duration: 600, yoyo: true, repeat: -1 });
    this.portrait = this.add.image(150, py - 190, 'miner').setDepth(7).setVisible(false);

    new Button(this, DESIGN.width - 110, Math.max(layout.top + 48, 0) + 80, { w: 170, h: 96, label: t('skip'), fontSize: 36, tint: COLORS.brown, key: 'ESC', onClick: () => this.finish() }).setDepth(20);

    // chapter card on the first beat of a world
    const m = /^w(\d)_intro$/.exec(this.beat.id);
    if (m) {
      const w = Number(m[1]);
      const title = CHAPTER_TITLE[w - 1];
      const card1 = txt(this, cx, 420, t('chapter', { n: w }), 64, { color: COLORS.textGold, strokeW: 10 }).setDepth(30).setAlpha(0);
      const card2 = txt(this, cx, 510, getLang() === 'tr' ? title.tr : title.en || worldName(w), 56, { strokeW: 9 }).setDepth(30).setAlpha(0);
      this.tweens.add({ targets: [card1, card2], alpha: 1, duration: 450 });
      this.tweens.add({ targets: [card1, card2], alpha: 0, delay: 1900, duration: 500, onComplete: () => { card1.destroy(); card2.destroy(); } });
      this.time.delayedCall(2100, () => this.showLine());
    } else this.showLine();

    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
  }

  private showLine(): void {
    const line = this.beat.lines[this.index];
    const lang = getLang();
    this.full = lang === 'tr' ? line.tr : line.en;
    this.shown = 0;
    this.ready = true;
    const who = line.who;
    this.nameText.setText(lang === 'tr' ? WHO_NAME[who].tr : WHO_NAME[who].en);
    const p = PORTRAIT[who];
    const left = who === 'dusty';
    this.portrait.setTexture(p.key).setDisplaySize(p.w, p.h).setVisible(true).setPosition(left ? 130 : DESIGN.width - 130, 840);
    this.portrait.setFlipX(!left && who !== 'baron' ? true : false);
    this.portrait.setScale(this.portrait.scaleX * 0.9);
    this.tweens.add({ targets: this.portrait, scale: this.portrait.scaleX / 0.9, duration: 160, ease: 'Back.Out' });
  }

  update(_time: number, delta: number): void {
    if (!this.ready || this.shown >= this.full.length) return;
    this.shown = Math.min(this.full.length, this.shown + (delta / 1000) * 55);
    this.body.setText(this.full.slice(0, Math.floor(this.shown)));
  }

  private advance(): void {
    if (!this.ready || this.done) return;
    if (this.shown < this.full.length) {
      this.shown = this.full.length;
      this.body.setText(this.full);
      return;
    }
    services.audio.sfx('click', 0.5);
    this.index++;
    if (this.index >= this.beat.lines.length) this.finish();
    else this.showLine();
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const save = services.save;
    if (!save.data.storySeen.includes(this.beat.id)) save.data.storySeen.push(this.beat.id);
    save.save();
    this.scene.stop();
    this.scene.resume(this.d.from);
  }
}
