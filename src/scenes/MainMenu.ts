import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { t } from '../i18n';
import { services } from '../services';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, createConfirm } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

export class MainMenu extends Phaser.Scene {
  private backdrop!: Backdrop;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    const layout = new Layout(this);
    const save = services.save;
    const audio = services.audio;
    const cx = DESIGN.width / 2;
    audio.playMusic('music_menu');
    audio.loop('reel', false);

    this.backdrop = createBackdrop(this, layout, { surface: true });

    // swinging claw emblem hanging from the top of the screen
    const anchorY = layout.top - 100;
    const clawTop = 120;
    const holder = this.add.container(cx, anchorY).setDepth(20);
    const rope = this.add.tileSprite(0, 0, 10, clawTop - anchorY, 'rope').setOrigin(0.5, 0);
    const claw = this.add.image(0, clawTop - anchorY - 4, 'logo_claw').setOrigin(0.5, 0).setDisplaySize(190, 190);
    holder.add([rope, claw]);
    holder.rotation = -0.09;
    this.tweens.add({ targets: holder, rotation: 0.09, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // title
    const deep = txt(this, cx, 410, 'DEEP', 150, { color: COLORS.textGold, strokeW: 16 }).setDepth(20);
    const clawT = txt(this, cx, 548, 'CLAW', 150, { color: '#fff6dc', strokeW: 16 }).setDepth(20);
    this.tweens.add({ targets: [deep, clawT], scale: { from: 1, to: 1.03 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const confirm = createConfirm(this, layout);
    const startNew = () => {
      save.resetProgress();
      goTo(this, 'Game', { levelId: 1 });
    };

    const play = new Button(this, cx, 760, {
      w: 460,
      h: 118,
      label: t('play'),
      fontSize: 56,
      tint: COLORS.gold,
      key: 'ENTER',
      onClick: () => {
        if (save.data.hasProgress) confirm.show(t('confirmNewTitle'), t('confirmNewText'), startNew);
        else startNew();
      },
    }).setDepth(20);
    play.setScale(1);
    this.tweens.add({ targets: play, scale: { from: 1, to: 1.04 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const hasSave = save.data.hasProgress;
    new Button(this, cx, 900, {
      w: 460,
      label: t('continue'),
      fontSize: 46,
      tint: COLORS.blue,
      onClick: () => {
        if (save.data.phase === 'shop') goTo(this, 'Shop');
        else goTo(this, 'Game', { levelId: save.data.currentLevel });
      },
    })
      .setEnabled(hasSave)
      .setDepth(20);

    new Button(this, cx, 1030, {
      w: 460,
      label: t('levelSelect'),
      fontSize: 46,
      tint: COLORS.green,
      onClick: () => goTo(this, 'LevelSelect'),
    }).setDepth(20);

    // bottom corners: sound toggle and settings
    const muted = () => save.data.settings.music <= 0.001 && save.data.settings.sfx <= 0.001;
    const sound = new Button(this, 110, layout.bottom - 100, {
      round: true,
      icon: muted() ? 'icon_mute' : 'icon_sound',
      tint: COLORS.brown,
      onClick: () => {
        const off = !muted();
        save.data.settings.music = off ? 0 : 0.6;
        save.data.settings.sfx = off ? 0 : 0.8;
        audio.applyVolumes();
        save.save();
        goTo(this, 'MainMenu');
      },
    }).setDepth(20);
    layout.onChange(() => sound.setY(layout.bottom - 100));
    const gear = new Button(this, DESIGN.width - 110, layout.bottom - 100, {
      round: true,
      icon: 'icon_gear',
      tint: COLORS.brown,
      onClick: () => {
        this.scene.pause();
        this.scene.launch('Settings', { from: 'MainMenu' });
      },
    }).setDepth(20);
    layout.onChange(() => gear.setY(layout.bottom - 100));

    this.events.on('resume', () => services.audio.playMusic('music_menu'));
    fadeIn(this);
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
