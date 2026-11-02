import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { getLang, setLang, t } from '../i18n';
import { services } from '../services';
import { Button, Slider, createConfirm, dim, panel } from '../ui/components';
import { COLORS, Layout, txt } from '../ui/theme';
import type { Lang } from '../systems/Save';

interface Data {
  from: 'MainMenu' | 'Pause';
  levelId?: number;
}

/** Overlay scene: music / SFX sliders, vibration, language, reset. */
export class Settings extends Phaser.Scene {
  private data0!: Data;

  constructor() {
    super('Settings');
  }

  init(data: Data): void {
    this.data0 = data;
  }

  create(): void {
    const layout = new Layout(this);
    const save = services.save;
    const audio = services.audio;
    const cx = DESIGN.width / 2;
    const cy = DESIGN.height / 2;

    dim(this, layout, 0.7);
    panel(this, cx, cy, 640, 980);
    txt(this, cx, cy - 410, t('settings').toUpperCase(), 64, { color: COLORS.textGold, strokeW: 9 });

    // sliders
    const sliderW = 420;
    txt(this, cx, cy - 320, t('music'), 38);
    new Slider(this, cx, cy - 265, sliderW, save.data.settings.music, (v) => audio.setMusicVolume(v), () => save.save());
    txt(this, cx, cy - 180, t('sfx'), 38);
    new Slider(
      this,
      cx,
      cy - 125,
      sliderW,
      save.data.settings.sfx,
      (v) => audio.setSfxVolume(v),
      () => {
        save.save();
        audio.sfx('gold', 0.8);
      },
    );

    // vibration
    txt(this, cx - 130, cy - 20, t('vibration'), 38);
    const vib = new Button(this, cx + 170, cy - 20, {
      w: 190,
      h: 96,
      label: save.data.settings.vibration ? t('on') : t('off'),
      fontSize: 38,
      tint: save.data.settings.vibration ? COLORS.green : COLORS.red,
      onClick: () => {
        save.data.settings.vibration = !save.data.settings.vibration;
        vib.setLabel(save.data.settings.vibration ? t('on') : t('off'));
        vib.setTintColor(save.data.settings.vibration ? COLORS.green : COLORS.red);
        save.save();
        audio.vibrate(40);
      },
    });

    // language
    txt(this, cx, cy + 80, t('language'), 38);
    const mk = (lang: Lang, label: string, x: number) => {
      const b = new Button(this, x, cy + 160, {
        w: 250,
        h: 96,
        label,
        fontSize: 40,
        tint: getLang() === lang ? COLORS.gold : COLORS.brown,
        onClick: () => {
          save.data.settings.lang = lang;
          setLang(lang);
          save.save();
          this.close(true);
        },
      });
      return b;
    };
    mk('en', 'English', cx - 140);
    mk('tr', 'Türkçe', cx + 140);

    // reset
    const confirm = createConfirm(this, layout);
    new Button(this, cx, cy + 290, {
      w: 480,
      h: 96,
      label: t('resetProgress'),
      fontSize: 38,
      tint: COLORS.red,
      onClick: () =>
        confirm.show(t('confirmResetTitle'), t('confirmResetText'), () => {
          save.resetProgress();
          this.close(true, true);
        }),
    });

    new Button(this, cx, cy + 400, {
      w: 320,
      h: 96,
      label: t('close'),
      fontSize: 42,
      tint: COLORS.brown,
      key: 'ESC',
      onClick: () => this.close(false),
    });
  }

  private close(refresh: boolean, toMenu = false): void {
    const { from, levelId } = this.data0;
    services.save.save();
    this.scene.stop();
    if (from === 'MainMenu') {
      if (refresh) this.scene.start('MainMenu');
      else this.scene.resume('MainMenu');
    } else {
      if (toMenu) {
        this.scene.stop('Pause');
        this.scene.stop('Game');
        this.scene.start('MainMenu');
        return;
      }
      this.scene.stop('Pause');
      this.scene.launch('Pause', { levelId });
    }
  }
}
