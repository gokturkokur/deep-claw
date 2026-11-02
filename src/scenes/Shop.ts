import Phaser from 'phaser';
import { IMAGES } from '../assets/manifest';
import { ITEMS, SHOP, type BoostId, type ItemId } from '../config/economy';
import { DESIGN } from '../config/game';
import { LEVELS } from '../data/levels';
import { itemText, money, t } from '../i18n';
import { services } from '../services';
import { leaveShop } from '../systems/Progress';
import { buy, rollShop, type ShopOffer } from '../systems/Shop';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, FloatingTexts, panel } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

interface Row {
  offer: ShopOffer;
  button: Button;
  status: Phaser.GameObjects.Text;
  owned?: Phaser.GameObjects.Text;
  container: Phaser.GameObjects.Container;
}

export class Shop extends Phaser.Scene {
  private backdrop!: Backdrop;
  private rows: Row[] = [];
  private walletText!: Phaser.GameObjects.Text;
  private floats!: FloatingTexts;

  constructor() {
    super('Shop');
  }

  create(): void {
    const save = services.save;
    const audio = services.audio;
    audio.loop('reel', false);
    audio.playMusic('music_menu');
    this.rows = [];
    // No pending shop (e.g. after a reset): go straight to the next level.
    if (save.data.phase !== 'shop' || !save.data.shop) {
      this.scene.start('Game', { levelId: save.data.currentLevel });
      return;
    }
    const shop = save.data.shop;
    const layout = new Layout(this);
    this.backdrop = createBackdrop(this, layout);
    this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, layout.width + 8, layout.height + 8, 0x0a0502, 0.45).setDepth(15);
    const cx = DESIGN.width / 2;
    const topY = Math.max(layout.top + DESIGN.safeTop, 0);

    txt(this, cx, topY + 70, t('shop'), 92, { color: COLORS.textGold, strokeW: 13 }).setDepth(20);
    this.add.image(cx - 150, topY + 176, 'icon_coin').setDisplaySize(64, 64).setDepth(20);
    this.walletText = txt(this, cx - 104, topY + 178, money(save.data.wallet), 62, { originX: 0, color: COLORS.textGold, strokeW: 9 }).setDepth(20);
    this.floats = new FloatingTexts(this, 4, 60);

    const offers = rollShop(shop.seed, shop.afterLevel);
    const cardH = 146;
    const gap = 10;
    const y0 = topY + 296;
    offers.forEach((offer, i) => this.buildRow(offer, cx, y0 + i * (cardH + gap), cardH));

    const finished = shop.afterLevel >= LEVELS.length;
    if (finished) txt(this, cx, y0 + offers.length * (cardH + gap) + 20, t('allDone'), 32, { color: COLORS.textGreen, wrap: 560 }).setDepth(20);

    const next = new Button(this, cx, layout.bottom - 100, {
      w: 520,
      label: finished ? t('menu') : t('nextLevel'),
      fontSize: 54,
      tint: COLORS.green,
      key: 'ENTER',
      onClick: () => {
        leaveShop(save.data);
        save.save();
        if (finished) goTo(this, 'MainMenu');
        else goTo(this, 'Game', { levelId: save.data.currentLevel });
      },
    }).setDepth(22);
    layout.onChange(() => next.setY(layout.bottom - 100));
    this.refresh();
    fadeIn(this);
  }

  private buildRow(offer: ShopOffer, cx: number, y: number, h: number): void {
    const id = offer.id;
    const text = itemText(id);
    const c = this.add.container(0, 0).setDepth(20);
    c.add(panel(this, cx, y, 660, h));
    const icon = IMAGES.icon_blast; // all icons share the 64x64 size
    c.add(this.add.image(cx - 270, y, ITEMS[id].icon).setDisplaySize(icon.w * 1.45, icon.h * 1.45));
    c.add(txt(this, cx - 205, y - 42, text.name, 32, { originX: 0, color: COLORS.textGold, strokeW: 5, wrap: 270, align: 'left' }));
    c.add(txt(this, cx - 205, y + 14, text.desc, 20, { originX: 0, strokeW: 3, wrap: 290, align: 'left', shadow: false }));
    const owned = ITEMS[id].kind === 'stack' ? txt(this, cx + 232, y + 58, '', 22, { color: COLORS.textGreen, strokeW: 4 }) : undefined;
    if (owned) c.add(owned);
    const button = new Button(this, cx + 232, y - 10, {
      w: 200,
      h: 96,
      label: money(offer.price),
      fontSize: 32,
      tint: COLORS.gold,
      onClick: () => this.tryBuy(offer),
      silent: true,
    });
    c.add(button);
    const status = txt(this, cx + 232, y - 10, '', 40, { color: COLORS.textGreen, strokeW: 6 }).setVisible(false);
    c.add(status);
    this.rows.push({ offer, button, status, owned, container: c });
  }

  private tryBuy(offer: ShopOffer): void {
    const save = services.save;
    const audio = services.audio;
    const row = this.rows.find((r) => r.offer === offer);
    const result = buy(save.data, offer);
    if (!result.ok) {
      audio.sfx('deny');
      if (result.reason === 'funds' && row) {
        this.floats.show(this, DESIGN.width / 2, row.container.y + 0, t('noMoney'), COLORS.textRed, 40);
        this.tweens.add({ targets: this.walletText, x: this.walletText.x + 8, duration: 50, yoyo: true, repeat: 3, onComplete: () => this.walletText.setX(DESIGN.width / 2 - 104) });
      }
      return;
    }
    audio.sfx('buy');
    audio.vibrate(30);
    save.save();
    if (row) {
      this.floats.show(this, DESIGN.width / 2 + 232 - 40, this.cardY(row), '-' + money(offer.price), COLORS.textRed, 44);
      this.tweens.add({ targets: row.container, scale: { from: 1, to: 1.03 }, duration: 110, yoyo: true });
    }
    this.refresh();
  }

  private cardY(row: Row): number {
    return row.button.y;
  }

  private refresh(): void {
    const save = services.save.data;
    this.walletText.setText(money(save.wallet));
    for (const r of this.rows) {
      const id: ItemId = r.offer.id;
      const def = ITEMS[id];
      if (def.kind === 'stack') {
        r.owned?.setText(t('owned', { n: save.inventory.blastCaps }));
        const maxed = save.inventory.blastCaps >= SHOP.maxBlastCaps;
        r.button.setVisible(!maxed);
        r.status.setVisible(maxed).setText(t('max'));
        r.button.setEnabled(save.wallet >= r.offer.price);
      } else {
        const have = save.boosts[id as BoostId];
        r.button.setVisible(!have);
        r.status.setVisible(have).setText(t('active'));
        r.button.setEnabled(save.wallet >= r.offer.price);
      }
      // keep the button pressable when too poor so the player gets the "not enough" feedback
      if (r.button.visible && save.wallet < r.offer.price) r.button.setEnabled(true).setTintColor(COLORS.grey);
      else if (r.button.visible) r.button.setTintColor(COLORS.gold);
    }
  }

  update(time: number, delta: number): void {
    this.backdrop?.update(time, delta / 1000);
  }
}
