import Phaser from 'phaser';
import { DESIGN, EGGS } from '../config/game';
import { itemText, money, quips, rankName, t } from '../i18n';
import { MENU_UNLOCK, rankIndex, totalStars, type MenuFeature } from '../systems/Campaign';
import { COSMETICS } from '../config/economy';
import { UNLOCK_TUTORIALS } from '../data/tutorials';
import { showTutorial } from '../ui/Tutorial';
import { LEVELS } from '../data/levels';
import { canClaimDaily, claimDaily, dayKey, nextStreak, type DailyResult } from '../systems/Daily';
import { services } from '../services';
import { wishOnStar } from '../systems/Eggs';
import { checkAchievements } from '../systems/Progress';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, createConfirm, dim, panel } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

export class MainMenu extends Phaser.Scene {
  private backdrop!: Backdrop;
  private dusty!: Phaser.GameObjects.Image;
  private pebble!: Phaser.GameObjects.Image;
  private dustyBase = 1;
  private pebbleBase = 1;
  private bubble!: Phaser.GameObjects.Container;
  private quipIndex = 0;
  /** Random chatter waits until this time so an important line stays readable. */
  private quietUntil = 0;
  private dockButtons: Record<string, Phaser.GameObjects.Container> = {};

  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.quietUntil = 0;
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

    // living menu: Dusty and Pebble stand on the ground, breathe, blink and chat
    const outfit = COSMETICS.find((c) => c.id === save.data.cosmetics.equipped.outfit)?.texture ?? 'miner';
    const ground = 322;
    this.dusty = this.add.image(120, ground + 4, outfit).setOrigin(0.5, 1).setDisplaySize(118, 150).setDepth(18).setInteractive({ useHandCursor: true });
    this.dustyBase = this.dusty.scaleY;
    this.tweens.add({ targets: this.dusty, scaleY: this.dustyBase * 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.pebble = this.add.image(535, ground + 10, 'char_pebble').setOrigin(0.5, 1).setDisplaySize(110, 110).setDepth(18).setFlipX(true).setInteractive({ useHandCursor: true });
    this.pebbleBase = this.pebble.scaleY;
    this.tweens.add({ targets: this.pebble, y: ground - 4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.time.addEvent({ delay: 3200, loop: true, callback: () => this.tweens.add({ targets: this.pebble, scaleY: this.pebbleBase * 0.15, duration: 70, yoyo: true }) });
    this.dusty.on('pointerdown', () => {
      this.tweens.add({ targets: this.dusty, y: ground - 24, duration: 160, yoyo: true, ease: 'Quad.Out' });
      this.sayRandom();
    });
    this.pebble.on('pointerdown', () => {
      this.tweens.add({ targets: this.pebble, angle: { from: -10, to: 10 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => this.pebble.setAngle(0) });
      this.sayRandom();
    });
    this.bubble = this.add.container(0, 0).setDepth(30).setAlpha(0);
    this.createSkyEgg(layout, ground);
    this.time.delayedCall(1200, () => this.sayRandom());
    this.time.addEvent({ delay: 7000, loop: true, callback: () => this.sayRandom() });

    // bottom dock: one round icon per mode, label underneath
    const dockY = 1010;
    const dock: Array<[string, string, string, number, string, object | undefined]> = [
      ['shop', 'icon_shop', t('shopBtn'), COLORS.gold, 'Shop', undefined],
      ['awards', 'icon_trophy', t('achievements'), COLORS.green, 'Achievements', undefined],
      ['workshop', 'icon_wrench', t('workshop'), COLORS.blue, 'Workshop', { back: 'MainMenu' }],
      ['wheel', 'icon_wheel', t('wheelShort'), COLORS.red, 'Wheel', undefined],
      ['endless', 'icon_infinity', t('endless'), 0x7a5ad8, 'Game', { mode: 'endless' }],
      ['weekly', 'icon_calendar', t('weekly'), 0x2aa8b8, 'Game', { mode: 'weekly' }],
    ];
    dock.forEach(([name, icon, label, tint, scene, data], i) => {
      const x = cx + (i - 2.5) * 116;
      const need = MENU_UNLOCK[name as MenuFeature];
      const locked = save.data.unlockedLevel < need;
      const b = new Button(this, x, dockY, {
        round: true,
        w: 100,
        h: 100,
        icon: (locked ? 'icon_lock' : icon) as never,
        tint: locked ? COLORS.grey : tint,
        onClick: () => {
          if (!locked) return goTo(this, scene, data);
          audio.sfx('deny');
          this.tweens.add({ targets: b, x: x + 8, duration: 50, yoyo: true, repeat: 2, onComplete: () => b.setX(x) });
          this.say(t('unlocksAt', { n: need }), 'dusty');
        },
        silent: true,
      }).setDepth(20).setName(name);
      this.dockButtons[name] = b;
      txt(this, x, dockY + 68, locked ? String(need) : label, 22, { strokeW: 4, wrap: 112, color: locked ? '#b8b8b8' : undefined }).setDepth(20);
      if (!locked && name === 'wheel' && save.data.spins > 0) {
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

    // one tutorial card per visit, for the first unlocked feature that was not explained yet
    for (const { id, feature } of UNLOCK_TUTORIALS) {
      const open = feature === 'gift' ? save.data.unlockedLevel >= 2 : save.data.unlockedLevel >= MENU_UNLOCK[feature];
      if (!open) continue;
      if (save.data.tipsSeen.includes('tut_' + id)) continue;
      this.time.delayedCall(900, () =>
        showTutorial(this, layout, id, () => {
          const target = feature === 'gift' ? this.children.getByName('gift') : this.dockButtons[feature];
          if (target) this.tweens.add({ targets: target, scale: { from: 1, to: 1.35 }, duration: 260, yoyo: true, repeat: 3 });
        }),
      );
      break;
    }
  }

  /** Easter egg: tap the sky EGGS.star.taps times in a row and a shooting star crosses it. */
  private createSkyEgg(layout: Layout, ground: number): void {
    let taps = 0;
    let lastTap = 0;
    const skyTop = layout.top;
    const skyH = ground - 150 - skyTop;
    const zone = this.add.zone(DESIGN.width / 2, skyTop + skyH / 2, DESIGN.width, skyH).setInteractive().setDepth(1);
    layout.onChange(() => {
      const h = ground - 150 - layout.top;
      zone.setPosition(DESIGN.width / 2, layout.top + h / 2).setSize(DESIGN.width, h);
    });
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const now = this.time.now;
      taps = now - lastTap < 2500 ? taps + 1 : 1;
      lastTap = now;
      // a tiny twinkle where you tapped, the only clue that the sky reacts
      const tw = this.add.image(p.worldX, p.worldY, 'spark').setDisplaySize(26, 26).setDepth(2).setAlpha(0.9);
      this.tweens.add({ targets: tw, scale: 0, alpha: 0, angle: 90, duration: 500, onComplete: () => tw.destroy() });
      if (taps < EGGS.star.taps) return;
      taps = 0;
      this.shootingStar(layout);
    });
  }

  private shootingStar(layout: Layout): void {
    const save = services.save;
    const top = layout.top;
    const star = this.add.image(DESIGN.width + 40, top + 70, 'spark').setDisplaySize(54, 54).setDepth(3);
    services.audio.sfx('diamond', 1, 1.3);
    this.tweens.add({
      targets: star,
      x: -60,
      y: top + 250,
      angle: 360,
      duration: 1300,
      ease: 'Sine.In',
      onUpdate: () => {
        const tr = this.add.image(star.x, star.y, 'spark').setDisplaySize(22, 22).setDepth(2).setAlpha(0.8);
        this.tweens.add({ targets: tr, alpha: 0, scale: 0, duration: 450, onComplete: () => tr.destroy() });
      },
      onComplete: () => star.destroy(),
    });
    const result = wishOnStar(save.data, dayKey(new Date()));
    checkAchievements(save.data);
    save.save();
    this.quietUntil = this.time.now + 5000;
    this.time.delayedCall(700, () => this.say(result === 'spin' ? t('eggStar') : t('eggStarAgain'), 'pebble'));
  }

  /** A short speech bubble above Dusty or Pebble. */
  private say(text: string, who: 'dusty' | 'pebble' = 'pebble'): void {
    const src = who === 'dusty' ? this.dusty : this.pebble;
    const x = Phaser.Math.Clamp(src.x, 190, DESIGN.width - 190);
    const y = src.y - src.displayHeight - 40;
    this.bubble.removeAll(true);
    const label = txt(this, 0, 0, text, 26, { wrap: 300, strokeW: 4, shadow: false });
    const w = Math.max(160, label.width + 44);
    const h = label.height + 40;
    const bg = this.add.nineslice(0, 0, 'panel', undefined, w, h, 40, 40, 40, 40);
    this.bubble.add([bg, label]);
    this.bubble.setPosition(x, y).setAlpha(0);
    this.tweens.killTweensOf(this.bubble);
    this.tweens.add({ targets: this.bubble, alpha: 1, duration: 200 });
    this.tweens.add({ targets: this.bubble, alpha: 0, delay: 3200, duration: 300 });
  }

  private sayRandom(): void {
    if (this.time.now < this.quietUntil) return;
    const save = services.save.data;
    const list: string[] = [...quips()];
    if (canClaimDaily(save, dayKey(new Date()))) list.push(t('quipGift'), t('quipGift'));
    if (save.spins > 0) list.push(t('quipWheel'));
    this.quipIndex = (this.quipIndex + 1 + Math.floor(Math.random() * 3)) % list.length;
    this.say(list[this.quipIndex], Math.random() < 0.5 ? 'dusty' : 'pebble');
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
