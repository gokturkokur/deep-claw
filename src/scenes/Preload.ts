import Phaser from 'phaser';
import { AUDIO_DIR, IMAGE_DIR, IMAGES, SOUNDS, type ImageKey } from '../assets/manifest';
import { DESIGN } from '../config/game';
import { COLORS, txt } from '../ui/theme';

/** Loads every image and sound listed in src/assets/manifest.ts. */
export class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#2a170b');
    const cx = DESIGN.width / 2;
    const cy = DESIGN.height / 2;
    this.cameras.main.centerOn(cx, cy);
    txt(this, cx, cy - 90, 'DEEP CLAW', 84, { color: COLORS.textGold });
    const barBg = this.add.rectangle(cx, cy + 20, 440, 28, 0x1a0e06).setStrokeStyle(4, 0x2b1608);
    const bar = this.add.rectangle(cx - 216, cy + 20, 4, 18, 0xffc21a).setOrigin(0, 0.5);
    barBg.setDepth(0);
    this.load.on('progress', (p: number) => {
      bar.width = Math.max(4, 432 * p);
    });

    this.load.setPath('');
    for (const [key, a] of Object.entries(IMAGES) as Array<[ImageKey, (typeof IMAGES)[ImageKey]]>) {
      if (a.file.endsWith('.svg')) this.load.svg(key, IMAGE_DIR + a.file, { width: a.w, height: a.h });
      else this.load.image(key, IMAGE_DIR + a.file);
    }
    for (const s of SOUNDS) this.load.audio(s, AUDIO_DIR + s + '.wav');
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
