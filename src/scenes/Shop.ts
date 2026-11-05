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
import { Button, FloatingTexts, panel } from '../ui/components';
import { showTutorial } from '../ui/Tutorial';
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
    this.time.delayedCall(700, () => showTutorial(this, layout, 'scene_shop'));
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
    const offers = tab === 'supplies' ? supplyOffers(shop.afterLevel) : dealOffers(shop.seed, shop.rerolls, shop.afterLevel);
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

  /** Opening scene: black screen, a wooden door shakes and slides open, light rays pour out, the prize appears. */
  private showCrate(r: CrateReward): void {
    const cx = DESIGN.width / 2;
    const cy = DESIGN.height / 2 - 40;
    const L = this.layoutRef;
    let what = '';
    let icon = 'icon_crate';
    if (r.kind === 'money') {
      what = t('crateMoney', { n: money(r.amount).replace('$', '') });
      icon = 'icon_coin';
    } else if (r.kind === 'caps') {
      what = t('crateCaps', { n: r.amount });
      icon = 'icon_blast';
    } else if (r.kind === 'freeze') {
      what = t('crateFreeze');
      icon = 'icon_freeze';
    } else if (r.kind === 'skip') {
      what = t('crateSkip');
      icon = 'icon_ticket';
    } else {
      what = t('crateBoost', { name: itemText(r.boost).name });
      icon = ITEMS[r.boost].icon;
    }
    const big = r.kind === 'skip' || r.kind === 'boost' || (r.kind === 'money' && r.amount > 1500);

    const g = this.add.container(0, 0).setDepth(300);
    const black = this.add.rectangle(cx, DESIGN.height / 2, L.width + 8, L.height + 8, 0x000000, 1).setInteractive();
    black.setAlpha(0);
    g.add(black);
    this.tweens.add({ targets: black, alpha: 1, duration: 220 });

    // light rays + glow sit behind the doors
    const rays = this.add.container(cx, cy).setAlpha(0);
    for (let i = 0; i < 12; i++) {
      const ray = this.add.rectangle(0, 0, 26, 1800, 0xfff0b0, 0.17).setBlendMode(Phaser.BlendModes.ADD);
      ray.setAngle(i * 15);
      rays.add(ray);
    }
    const glow = this.add.image(cx, cy, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(40, 40).setAlpha(0);
    g.add([rays, glow]);

    // the prize, hidden until the door opens
    const prize = this.add.image(cx, cy, icon).setDisplaySize(170, 170).setVisible(false);
    const prizeScale = prize.scaleX;
    prize.setScale(0);
    const title = txt(this, cx, cy + 190, t('crateGot', { what }), 40, { wrap: 560, color: COLORS.textGold, strokeW: 7 }).setAlpha(0);
    g.add([prize, title]);

    // door: two halves with planks, a handle and a lit seam
    const door = this.add.container(cx, cy).setAlpha(0);
    const halfW = 215;
    const doorH = 560;
    const mkHalf = (dir: -1 | 1) => {
      const h = this.add.container(dir * (halfW / 2), 0);
      h.add(this.add.rectangle(0, 0, halfW, doorH, 0x7a4a22).setStrokeStyle(8, 0x2b1608));
      for (let i = 1; i < 4; i++) h.add(this.add.rectangle(0, -doorH / 2 + i * (doorH / 4), halfW - 12, 6, 0x4a2c14));
      h.add(this.add.rectangle(dir * -halfW / 2 + dir * 26, 0, 12, doorH - 20, 0xd9a020));
      h.add(this.add.circle(-dir * 40, 20, 18, 0xffd23a).setStrokeStyle(5, 0x2b1608));
      return h;
    };
    const left = mkHalf(-1);
    const right = mkHalf(1);
    const seam = this.add.rectangle(0, 0, 6, doorH, 0xfff0b0, 0).setBlendMode(Phaser.BlendModes.ADD);
    door.add([left, right, seam]);
    g.add(door);
    this.tweens.add({ targets: door, alpha: 1, duration: 260, delay: 160 });

    const audio = services.audio;
    audio.sfx('launch', 0.7, 0.5);
    // 1) rumble
    this.tweens.add({ targets: door, x: { from: cx - 6, to: cx + 6 }, duration: 55, yoyo: true, repeat: 14, delay: 500 });
    this.time.delayedCall(500, () => audio.sfx('tick', 0.8));
    this.time.delayedCall(800, () => audio.sfx('tick', 0.8));
    this.tweens.add({ targets: seam, alpha: 0.9, duration: 700, delay: 700 });
    // 2) doors slide open, light bursts
    this.time.delayedCall(1500, () => {
      door.x = cx;
      audio.sfx('bag');
      this.tweens.add({ targets: left, x: -halfW * 2.2, duration: 650, ease: 'Cubic.In' });
      this.tweens.add({ targets: right, x: halfW * 2.2, duration: 650, ease: 'Cubic.In' });
      this.tweens.add({ targets: seam, alpha: 0, duration: 200 });
      this.tweens.add({ targets: glow, alpha: 0.95, displayWidth: 900, displayHeight: 900, duration: 700, ease: 'Cubic.Out' });
      this.tweens.add({ targets: rays, alpha: 1, duration: 500 });
      this.tweens.add({ targets: rays, angle: 90, duration: 6000, ease: 'Linear' });
      this.cameras.main.flash(180, 255, 240, 180, true);
    });
    // 3) the prize rises out of the light
    this.time.delayedCall(2050, () => {
      prize.setVisible(true);
      this.tweens.add({ targets: prize, scale: prizeScale, duration: 520, ease: 'Back.Out' });
      this.tweens.add({ targets: prize, y: cy - 20, yoyo: true, duration: 900, repeat: -1, ease: 'Sine.InOut' });
      this.tweens.add({ targets: title, alpha: 1, y: cy + 180, duration: 400, delay: 250 });
      audio.sfx(big ? 'win' : 'gold');
      audio.vibrate(big ? 80 : 40);
      for (let i = 0; i < 10; i++) {
        const sp = this.add.image(cx, cy, 'spark').setBlendMode(Phaser.BlendModes.ADD).setScale(0.8);
        g.add(sp);
        const a = (i / 10) * Math.PI * 2;
        this.tweens.add({ targets: sp, x: cx + Math.cos(a) * 280, y: cy + Math.sin(a) * 280, alpha: 0, scale: 0, duration: 700, onComplete: () => sp.destroy() });
      }
    });
    this.time.delayedCall(2600, () => {
      const ok = new Button(this, cx, cy + 330, { w: 300, label: 'OK', fontSize: 44, tint: COLORS.green, key: 'ENTER', onClick: () => g.destroy() });
      g.add(ok);
    });
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
