import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { itemText, money, rankName, t } from '../i18n';
import { rankIndex, totalStars } from '../systems/Campaign';
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

    const play = new Button(this, cx, 665, {
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
    new Button(this, cx, 780, {
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

    new Button(this, cx, 885, {
      w: 460,
      label: t('levelSelect'),
      fontSize: 46,
      tint: COLORS.green,
      onClick: () => goTo(this, 'LevelSelect'),
    }).setDepth(20);

    // bottom dock: one round icon per mode, label underneath
    const dockY = 1010;
    const dock: Array<[string, string, string, number, string, object | undefined]> = [
      ['shop', 'icon_shop', t('shopBtn'), COLORS.gold, 'Shop', undefined],
      ['workshop', 'icon_wrench', t('workshop'), COLORS.blue, 'Workshop', { back: 'MainMenu' }],
      ['endless', 'icon_infinity', t('endless'), 0x7a5ad8, 'Game', { mode: 'endless' }],
      ['weekly', 'icon_calendar', t('weekly'), 0x2aa8b8, 'Game', { mode: 'weekly' }],
      ['awards', 'icon_trophy', t('achievements'), COLORS.green, 'Achievements', undefined],
      ['wheel', 'icon_wheel', t('wheelShort'), COLORS.red, 'Wheel', undefined],
    ];
    dock.forEach(([name, icon, label, tint, scene, data], i) => {
      const x = cx + (i - 2.5) * 116;
      const b = new Button(this, x, dockY, { round: true, w: 100, h: 100, icon: icon as never, tint, onClick: () => goTo(this, scene, data) }).setDepth(20).setName(name);
      txt(this, x, dockY + 68, label, 22, { strokeW: 4, wrap: 112 }).setDepth(20);
      if (name === 'wheel' && save.data.spins > 0) {
        this.tweens.add({ targets: b, scale: { from: 1, to: 1.08 }, duration: 600, yoyo: true, repeat: -1 });
        this.add.circle(x + 38, dockY - 38, 18, 0xe5483a).setStrokeStyle(4, 0x2b1608).setDepth(26);
        txt(this, x + 38, dockY - 38, String(save.data.spins), 24, { strokeW: 4 }).setDepth(27);
      }
    });

    // info pills at the top: rank and stars on the left, wallet on the right
    const stars = totalStars(save.data.levels);
    const ri = rankIndex(stars);
    const topY = Math.max(layout.top + 48, 0) + 36;
    this.add.nineslice(24, topY, 'slider_track', undefined, 270, 64, 18, 18, 12, 12).setOrigin(0, 0.5).setDepth(24);
    txt(this, 40, topY - 12, rankName(ri), 28, { originX: 0, color: COLORS.textGold, strokeW: 5 }).setDepth(25);
    txt(this, 40, topY + 16, `${stars} / ${LEVELS.length * 3} ${t('stars')}`, 20, { originX: 0, color: '#f4dba8', strokeW: 3 }).setDepth(25);
    this.add.nineslice(DESIGN.width - 24, topY, 'slider_track', undefined, 250, 64, 18, 18, 12, 12).setOrigin(1, 0.5).setDepth(24);
    this.add.image(DESIGN.width - 24 - 250 + 36, topY, 'icon_coin').setDisplaySize(40, 40).setDepth(25);
    txt(this, DESIGN.width - 24 - 16, topY, money(save.data.wallet), 30, { originX: 1, color: COLORS.textGold, strokeW: 5 }).setDepth(25);

    // daily gift: only while there is something to claim
    const today = dayKey(new Date());
    if (canClaimDaily(save.data, today)) {
      const gift = new Button(this, DESIGN.width - 80, topY + 100, { round: true, icon: 'icon_gift', tint: COLORS.red, onClick: () => this.openGift(layout, today) }).setDepth(25).setName('gift');
      this.tweens.add({ targets: gift, scale: { from: 1, to: 1.1 }, angle: { from: -6, to: 6 }, duration: 500, yoyo: true, repeat: -1 });
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
