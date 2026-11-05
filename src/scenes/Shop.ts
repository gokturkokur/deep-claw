import Phaser from 'phaser';
import { ITEMS, SHOP, type BoostId, type ItemId } from '../config/economy';
import { DESIGN } from '../config/game';
import { LEVELS } from '../data/levels';
import { itemText, money, t } from '../i18n';
import { services } from '../services';
import { leaveShop } from '../systems/Progress';
import { randomSeed } from '../systems/Rng';
import { buy, dealOffers, reroll, rerollCost, supplyOffers, type CrateReward, type ShopOffer } from '../systems/Shop';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, FloatingTexts, dim, panel } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

type Tab = 'supplies' | 'deals';

interface Row {
  offer: ShopOffer;
  button: Button;
  status: Phaser.GameObjects.Text;
  owned?: Phaser.GameObjects.Text;
  container: Phaser.GameObjects.Container;
}

/** After a won level (or any time from the menu): consumables and rotating boost deals. */
export class Shop extends Phaser.Scene {
  private backdrop!: Backdrop;
  private rows: Row[] = [];
  private walletText!: Phaser.GameObjects.Text;
  private floats!: FloatingTexts;
  private list!: Phaser.GameObjects.Container;
  private tabButtons: Record<Tab, Button> | null = null;
  private layoutRef!: Layout;
  private topY = 0;

  constructor() {
    super('Shop');
  }

  create(): void {
    const save = services.save;
    const audio = services.audio;
    audio.loop('reel', false);
    audio.playMusic('music_menu');
    this.rows = [];
    const d = save.data;
    // Visiting from the menu before any level was won: make a shop for the current progress.
    if (!d.shop) {
      d.shop = { seed: randomSeed(), afterLevel: Math.max(1, d.currentLevel - 1), bought: [], rerolls: 0 };
      save.save();
    }
    const afterWin = d.phase === 'shop';
    const layout = new Layout(this);
    this.layoutRef = layout;
    this.backdrop = createBackdrop(this, layout);
    this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, layout.width + 8, layout.height + 8, 0x0a0502, 0.45).setDepth(15);
    const cx = DESIGN.width / 2;
    const topY = Math.max(layout.top + DESIGN.safeTop, 0);
    this.topY = topY;

    txt(this, cx, topY + 56, t('shop'), 84, { color: COLORS.textGold, strokeW: 12 }).setDepth(20);
    this.add.image(cx - 150, topY + 140, 'icon_coin').setDisplaySize(60, 60).setDepth(20);
    this.walletText = txt(this, cx - 106, topY + 142, money(d.wallet), 58, { originX: 0, color: COLORS.textGold, strokeW: 9 }).setDepth(20);
    this.floats = new FloatingTexts(this, 4, 60);

    const mkTab = (id: Tab, x: number, label: string) =>
      new Button(this, x, topY + 236, { w: 300, h: 96, label, fontSize: 38, tint: COLORS.brown, onClick: () => this.setTab(id) }).setDepth(21);
    this.tabButtons = { supplies: mkTab('supplies', cx - 160, t('tabSupplies')), deals: mkTab('deals', cx + 160, t('tabDeals')) };

    this.list = this.add.container(0, 0).setDepth(20);
    this.setTab('supplies');

    const finished = afterWin && (d.shop?.afterLevel ?? 0) >= LEVELS.length;
    const bottom = layout.bottom - 100;
    const workshop = new Button(this, cx - 170, bottom, { w: 320, label: t('workshop'), fontSize: 40, tint: COLORS.blue, onClick: () => goTo(this, 'Workshop', { back: afterWin ? 'Shop' : 'Shop' }) }).setDepth(22);
    const next = new Button(this, cx + 170, bottom, {
      w: 320,
      label: afterWin ? (finished ? t('menu') : t('nextLevel')) : t('back'),
      fontSize: 40,
      tint: COLORS.green,
      key: 'ENTER',
      onClick: () => {
        if (!afterWin) {
          goTo(this, 'MainMenu');
          return;
        }
        leaveShop(d);
        save.save();
        if (finished) goTo(this, 'MainMenu');
        else goTo(this, 'Game', { levelId: d.currentLevel });
      },
    }).setDepth(22);
    layout.onChange(() => {
      workshop.setY(layout.bottom - 100);
      next.setY(layout.bottom - 100);
    });
    fadeIn(this);
  }

  private setTab(tab: Tab): void {
    if (this.tabButtons) {
      this.tabButtons.supplies.setTintColor(tab === 'supplies' ? COLORS.gold : COLORS.brown);
      this.tabButtons.deals.setTintColor(tab === 'deals' ? COLORS.gold : COLORS.brown);
    }
    this.list.removeAll(true);
    this.rows = [];
    const shop = services.save.data.shop;
    if (!shop) return;
    const cx = DESIGN.width / 2;
    const offers = tab === 'supplies' ? supplyOffers(shop.afterLevel) : dealOffers(shop.seed, shop.rerolls);
    const cardH = 138;
    const step = 146;
    const y0 = this.topY + 346 + cardH / 2;
    offers.forEach((offer, i) => this.buildRow(offer, cx, y0 + i * step, cardH));
    if (tab === 'deals') {
      const y = y0 + offers.length * step + 8;
      const cost = rerollCost(shop.rerolls);
      const b = new Button(this, cx, y + 20, {
        w: 520,
        h: 96,
        label: t('reroll', { n: money(cost) }),
        fontSize: 36,
        tint: COLORS.blue,
        onClick: () => {
          if (reroll(services.save.data)) {
            services.audio.sfx('buy');
            services.save.save();
            this.setTab('deals');
            this.refresh();
          } else services.audio.sfx('deny');
        },
        silent: true,
      });
      this.list.add(b);
    }
    this.refresh();
  }

  private buildRow(offer: ShopOffer, cx: number, y: number, h: number): void {
    const id = offer.id;
    const text = itemText(id);
    const c = this.add.container(0, 0);
    c.add(panel(this, cx, y, 660, h));
    c.add(this.add.image(cx - 272, y, ITEMS[id].icon).setDisplaySize(86, 86));
    c.add(txt(this, cx - 215, y - 38, text.name, 31, { originX: 0, color: COLORS.textGold, strokeW: 5, wrap: 290, align: 'left' }));
    c.add(txt(this, cx - 215, y + 12, text.desc, 19, { originX: 0, strokeW: 3, wrap: 300, align: 'left', shadow: false }));
    const stackable = ITEMS[id].kind === 'stack' || ITEMS[id].kind === 'pack';
    const owned = stackable ? txt(this, cx + 232, y + 52, '', 21, { color: COLORS.textGreen, strokeW: 4 }) : undefined;
    if (owned) c.add(owned);
    const button = new Button(this, cx + 232, y - 8, {
      w: 200,
      h: 96,
      label: money(offer.price),
      fontSize: 32,
      tint: COLORS.gold,
      onClick: () => this.tryBuy(offer),
      silent: true,
    });
    c.add(button);
    if (offer.sale) {
      const tag = txt(this, cx + 130, y - 52, t('sale'), 24, { color: '#ffffff', strokeW: 5 });
      const bg = this.add.rectangle(cx + 130, y - 52, 90, 32, 0xe5483a).setStrokeStyle(3, 0x2b1608);
      bg.setAngle(-8);
      tag.setAngle(-8);
      c.add([bg, tag]);
    }
    const status = txt(this, cx + 232, y - 8, '', 38, { color: COLORS.textGreen, strokeW: 6 }).setVisible(false);
    c.add(status);
    this.list.add(c);
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
        this.floats.show(this, DESIGN.width / 2, row.button.y - 20, t('noMoney'), COLORS.textRed, 40);
        this.tweens.add({ targets: this.walletText, x: this.walletText.x + 8, duration: 50, yoyo: true, repeat: 3, onComplete: () => this.walletText.setX(DESIGN.width / 2 - 106) });
      }
      return;
    }
    audio.sfx('buy');
    audio.vibrate(30);
    save.save();
    if (row) {
      this.floats.show(this, DESIGN.width / 2 + 192, row.button.y - 40, '-' + money(offer.price), COLORS.textRed, 44);
      this.tweens.add({ targets: row.container, scale: { from: 1, to: 1.03 }, duration: 110, yoyo: true });
    }
    if (result.reward) this.showCrate(result.reward);
    this.refresh();
  }

  private showCrate(r: CrateReward): void {
    const cx = DESIGN.width / 2;
    const cy = DESIGN.height / 2;
    let what = '';
    if (r.kind === 'money') what = t('crateMoney', { n: money(r.amount).replace('$', '') });
    else if (r.kind === 'caps') what = t('crateCaps', { n: r.amount });
    else if (r.kind === 'freeze') what = t('crateFreeze');
    else if (r.kind === 'skip') what = t('crateSkip');
    else what = t('crateBoost', { name: itemText(r.boost).name });
    const g = this.add.container(0, 0).setDepth(300);
    const shade = dim(this, this.layoutRef, 0.7);
    const p = panel(this, cx, cy, 600, 480);
    const icon = this.add.image(cx, cy - 120, 'icon_crate').setDisplaySize(150, 150);
    const title = txt(this, cx, cy + 10, t('crateGot', { what }), 38, { wrap: 520, color: COLORS.textGold, strokeW: 6 });
    const ok = new Button(this, cx, cy + 150, { w: 300, label: 'OK', fontSize: 44, tint: COLORS.green, key: 'ENTER', onClick: () => g.destroy() });
    g.add([shade, p, icon, title, ok]);
    this.tweens.add({ targets: icon, angle: { from: -12, to: 12 }, duration: 300, yoyo: true, repeat: 3 });
    services.audio.sfx('bag');
  }

  private refresh(): void {
    const d = services.save.data;
    this.walletText.setText(money(d.wallet));
    for (const r of this.rows) {
      const id: ItemId = r.offer.id;
      const def = ITEMS[id];
      let full = false;
      if (def.kind === 'boost') full = d.boosts[id as BoostId];
      else if (id === 'blastCap' || id === 'blastPack') full = d.inventory.blastCaps >= SHOP.maxBlastCaps;
      else if (id === 'freeze') full = d.inventory.freeze >= SHOP.maxFreeze;
      else if (id === 'skip') full = d.inventory.skip >= SHOP.maxSkip;
      if (r.owned) {
        const n = id === 'freeze' ? d.inventory.freeze : id === 'skip' ? d.inventory.skip : d.inventory.blastCaps;
        r.owned.setText(t('owned', { n }));
      }
      r.button.setVisible(!full);
      r.status.setVisible(full).setText(def.kind === 'boost' ? t('active') : t('max'));
      r.button.setEnabled(true);
      r.button.setTintColor(d.wallet < r.offer.price ? COLORS.grey : COLORS.gold);
    }
  }

  update(time: number, delta: number): void {
    this.backdrop?.update(time, delta / 1000);
  }
}
