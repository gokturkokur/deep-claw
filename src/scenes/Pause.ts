import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { t } from '../i18n';
import { services } from '../services';
import { Button, dim, panel } from '../ui/components';
import { COLORS, Layout, txt } from '../ui/theme';

/** Overlay scene shown while the Game scene is paused. */
export class Pause extends Phaser.Scene {
  private levelId = 1;
  private mode: 'campaign' | 'weekly' | 'endless' = 'campaign';

  constructor() {
    super('Pause');
  }

  init(data: { levelId: number; mode?: 'campaign' | 'weekly' | 'endless' }): void {
    this.levelId = data.levelId;
    this.mode = data.mode ?? 'campaign';
  }

  create(): void {
    const layout = new Layout(this);
    const cx = DESIGN.width / 2;
    const cy = DESIGN.height / 2;
    dim(this, layout, 0.66);
    panel(this, cx, cy, 600, 780);
    txt(this, cx, cy - 300, t('paused').toUpperCase(), 72, { color: COLORS.textGold, strokeW: 10 });
    txt(this, cx, cy - 230, this.mode === 'campaign' ? t('level', { n: this.levelId }) : this.mode === 'weekly' ? t('weeklyTitle') : t('endless'), 36, { color: '#f4dba8' });

    const resume = () => {
      this.scene.stop();
      this.scene.resume('Game');
    };
    new Button(this, cx, cy - 130, { w: 440, label: t('resume'), fontSize: 48, tint: COLORS.green, key: 'P', onClick: resume });
    // Esc also resumes
    this.input.keyboard?.addKey('ESC').on('down', resume);
    new Button(this, cx, cy - 10, {
      w: 440,
      label: t('restart'),
      fontSize: 48,
      tint: COLORS.gold,
      onClick: () => {
        this.scene.stop();
        this.scene.start('Game', { levelId: this.levelId, mode: this.mode });
      },
    });
    new Button(this, cx, cy + 110, {
      w: 440,
      label: t('settings'),
      fontSize: 48,
      tint: COLORS.blue,
      onClick: () => {
        this.scene.pause();
        this.scene.launch('Settings', { from: 'Pause', levelId: this.levelId, mode: this.mode });
      },
    });
    new Button(this, cx, cy + 230, {
      w: 440,
      label: t('menu'),
      fontSize: 48,
      tint: COLORS.red,
      onClick: () => {
        services.audio.loop('reel', false);
        this.scene.stop();
        this.scene.stop('Game');
        this.scene.start('MainMenu');
      },
    });
  }
}
