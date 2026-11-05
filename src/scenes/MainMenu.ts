import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { itemText, money, rankName, t } from '../i18n';
import { RANK_STARS, rankIndex, totalStars } from '../systems/Campaign';
import { LEVELS } from '../data/levels';
import { canClaimDaily, claimDaily, dayKey, nextStreak, type DailyResult } from '../systems/Daily';
import { services } from '../services';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, createConfirm, dim, panel } from '../ui/components';
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

    const play = new Button(this, cx, 690, {
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
    new Button(this, cx, 805, {
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

    new Button(this, cx, 910, {
      w: 460,
      label: t('levelSelect'),
      fontSize: 46,
      tint: COLORS.green,
      onClick: () => goTo(this, 'LevelSelect'),
    }).setDepth(20);

    // second row: shop, workshop and the extra modes
    const small = (i: number, label: string, tint: number, scene: string, data?: object) =>
      new Button(this, cx + (i - 2) * 142, 1030, { w: 134, h: 104, label, fontSize: 25, tint, onClick: () => goTo(this, scene, data) }).setDepth(20);
    small(0, t('shopBtn'), COLORS.gold, 'Shop');
    small(1, t('workshop'), COLORS.blue, 'Workshop', { back: 'MainMenu' });
    small(2, t('endless'), 0x7a5ad8, 'Game', { mode: 'endless' });
    small(3, t('weekly'), 0x2aa8b8, 'Game', { mode: 'weekly' });
    small(4, t('achievements'), COLORS.green, 'Achievements');

    // rank by total stars
    const stars = totalStars(save.data.levels);
    const ri = rankIndex(stars);
    const rankY = Math.max(layout.top + 48, 0) + 40;
    txt(this, 24, rankY, rankName(ri), 36, { originX: 0, color: COLORS.textGold, strokeW: 6 }).setDepth(25);
    const next = RANK_STARS[ri + 1];
    txt(this, 24, rankY + 40, `${stars} / ${LEVELS.length * 3}` + (next ? `  (${next})` : ''), 26, { originX: 0, color: '#f4dba8', strokeW: 4 }).setDepth(25);

    // daily gift
    const today = dayKey(new Date());
    if (canClaimDaily(save.data, today)) {
      const gift = new Button(this, DESIGN.width - 100, 330, { round: true, icon: 'icon_gift', tint: COLORS.red, onClick: () => this.openGift(layout, today) }).setDepth(25).setName('gift');
      this.tweens.add({ targets: gift, scale: { from: 1, to: 1.12 }, angle: { from: -6, to: 6 }, duration: 500, yoyo: true, repeat: -1 });
    }

    // lucky wheel
    const wheelBtn = new Button(this, DESIGN.width - 100, 455, { round: true, icon: 'icon_wheel', tint: 0x7a5ad8, onClick: () => goTo(this, 'Wheel') }).setDepth(25).setName('wheel');
    if (save.data.spins > 0) {
      this.tweens.add({ targets: wheelBtn, scale: { from: 1, to: 1.1 }, duration: 600, yoyo: true, repeat: -1 });
      txt(this, DESIGN.width - 62, 488, String(save.data.spins), 30, { color: COLORS.textGold, strokeW: 6 }).setDepth(26);
    }

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

  private openGift(layout: Layout, today: string): void {
    const save = services.save;
    const cx = DESIGN.width / 2;
    const cy = DESIGN.height / 2;
    const g = this.add.container(0, 0).setDepth(400);
    const streak = nextStreak(save.data, today);
    const shade = dim(this, layout, 0.7);
    const p = panel(this, cx, cy, 600, 560);
    const icon = this.add.image(cx, cy - 150, 'icon_gift').setDisplaySize(150, 150);
    const title = txt(this, cx, cy - 20, t('dailyGift'), 50, { color: COLORS.textGold, strokeW: 8 });
    const sub = txt(this, cx, cy + 40, t('giftDay', { n: streak }), 32, { color: '#f4dba8' });
    const resultText = txt(this, cx, cy + 100, '', 38, { wrap: 520, color: COLORS.textGreen });
    const close = new Button(this, cx + 250, cy - 250, { w: 96, h: 96, label: 'X', fontSize: 40, tint: COLORS.brown, key: 'ESC', onClick: () => g.destroy() });
    const claim: Button = new Button(this, cx, cy + 200, {
      w: 360,
      label: t('claimGift'),
      fontSize: 46,
      tint: COLORS.green,
      key: 'ENTER',
      onClick: () => {
        const r = claimDaily(save.data, today);
        if (!r) return;
        save.save();
        services.audio.sfx('buy');
        resultText.setText(this.describe(r));
        claim.destroy();
        close.destroy();
        const ok = new Button(this, cx, cy + 200, { w: 300, label: 'OK', fontSize: 44, tint: COLORS.green, key: 'ENTER', onClick: () => goTo(this, 'MainMenu') });
        g.add(ok);
        this.tweens.add({ targets: icon, angle: { from: -15, to: 15 }, yoyo: true, duration: 150, repeat: 3 });
      },
    });
    g.add([shade, p, icon, title, sub, resultText, claim, close]);
  }

  private describe(r: DailyResult): string {
    if (r.reward.kind === 'money') return t('giftMoney', { n: money(r.reward.amount).replace('$', '') });
    if (r.reward.kind === 'caps') return t('giftCaps', { n: r.reward.amount });
    return t('giftBoost', { name: r.boost ? itemText(r.boost).name : '' });
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, delta / 1000);
  }
}
