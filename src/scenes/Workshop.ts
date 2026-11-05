import Phaser from 'phaser';
import { CLAW_IDS, CLAW_TYPES, COSMETICS, HELPER, UPGRADES, UPGRADE_IDS, type ClawId, type CosmeticSlot, type UpgradeId } from '../config/economy';
import { DESIGN } from '../config/game';
import { clawText, cosmeticName, helperText, money, t, upgradeText } from '../i18n';
import { services } from '../services';
import { buyClaw, buyHelper, buyUpgrade, equipClaw, upgradeCost } from '../systems/Upgrades';
import { buyCosmetic, equipCosmetic } from '../systems/Shop';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { showTutorial } from '../ui/Tutorial';
import { Button, FloatingTexts, panel } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

type Tab = 'upgrades' | 'claws' | 'style';

/** Permanent purchases, any time: upgrades, claw types and cosmetics. */
export class Workshop extends Phaser.Scene {
  private backdrop!: Backdrop;
  private tab: Tab = 'upgrades';
  private slot: CosmeticSlot = 'outfit';
  private list!: Phaser.GameObjects.Container;
  private walletText!: Phaser.GameObjects.Text;
  private tabButtons!: Record<Tab, Button>;
  private slotButtons!: Record<CosmeticSlot, Button>;
  private floats!: FloatingTexts;
  private topY = 0;
  private back = 'MainMenu';

  constructor() {
    super('Workshop');
  }

  init(data: { back?: string }): void {
    this.back = data?.back ?? 'MainMenu';
  }

  create(): void {
    const layout = new Layout(this);
    const save = services.save;
    services.audio.playMusic('music_menu');
    this.backdrop = createBackdrop(this, layout);
    this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, layout.width + 8, layout.height + 8, 0x0a0502, 0.45).setDepth(15);
    const cx = DESIGN.width / 2;
    const topY = Math.max(layout.top + DESIGN.safeTop, 0);
    this.topY = topY;
    this.tab = 'upgrades';
    this.slot = 'outfit';

    txt(this, cx, topY + 56, t('workshop').toUpperCase(), 80, { color: COLORS.textGold, strokeW: 12 }).setDepth(20);
    this.add.image(cx - 150, topY + 140, 'icon_coin').setDisplaySize(60, 60).setDepth(20);
    this.walletText = txt(this, cx - 106, topY + 142, money(save.data.wallet), 58, { originX: 0, color: COLORS.textGold, strokeW: 9 }).setDepth(20);
    this.floats = new FloatingTexts(this, 4, 60);

    const mk = (id: Tab, x: number, label: string) => new Button(this, x, topY + 236, { w: 220, h: 96, label, fontSize: 32, tint: COLORS.brown, onClick: () => this.setTab(id) }).setDepth(21);
    this.tabButtons = { upgrades: mk('upgrades', cx - 232, t('tabUpgrades')), claws: mk('claws', cx, t('tabClaws')), style: mk('style', cx + 232, t('tabStyle')) };
    const slotLabel: Record<CosmeticSlot, string> = { outfit: 'Outfit', clawSkin: 'Claw', rope: 'Rope' };
    const mkSlot = (id: CosmeticSlot, x: number) => new Button(this, x, topY + 334, { w: 200, h: 96, label: slotLabel[id], fontSize: 30, tint: COLORS.brown, onClick: () => this.setSlot(id) }).setDepth(21);
    this.slotButtons = { outfit: mkSlot('outfit', cx - 220), clawSkin: mkSlot('clawSkin', cx), rope: mkSlot('rope', cx + 220) };

    this.list = this.add.container(0, 0).setDepth(20);
    this.setTab('upgrades');

    const back = new Button(this, cx, layout.bottom - 100, { w: 360, label: t('back'), fontSize: 44, tint: COLORS.green, key: 'ESC', onClick: () => goTo(this, this.back) }).setDepth(22);
    layout.onChange(() => back.setY(layout.bottom - 100));
    fadeIn(this);
    this.time.delayedCall(700, () => showTutorial(this, layout, 'unlock_workshop'));
  }

  private setTab(tab: Tab): void {
    this.tab = tab;
    this.render();
  }

  private setSlot(slot: CosmeticSlot): void {
    this.slot = slot;
    this.render();
  }

  private render(): void {
    for (const [id, b] of Object.entries(this.tabButtons)) b.setTintColor(id === this.tab ? COLORS.gold : COLORS.brown);
    for (const [id, b] of Object.entries(this.slotButtons)) {
      b.setVisible(this.tab === 'style').setActive(this.tab === 'style');
      b.setTintColor(id === this.slot ? COLORS.gold : COLORS.brown);
    }
    this.list.removeAll(true);
    this.walletText.setText(money(services.save.data.wallet));
    if (this.tab === 'upgrades') {
      this.renderUpgrades();
      this.renderHelper();
    }
    else if (this.tab === 'claws') this.renderClaws();
    else this.renderStyle();
  }

  private actionButton(x: number, y: number, label: string, tint: number, enabled: boolean, onClick: () => void): Button {
    const b = new Button(this, x, y, { w: 200, h: 96, label, fontSize: 30, tint, onClick, silent: true });
    b.setTintColor(enabled ? tint : COLORS.grey);
    return b;
  }

  private row(y: number, iconKey: string, name: string, desc: string, extra: string): Phaser.GameObjects.Container {
    const cx = DESIGN.width / 2;
    const c = this.add.container(0, 0);
    c.add(panel(this, cx, y, 660, 142));
    c.add(this.add.image(cx - 272, y, iconKey).setDisplaySize(86, 86));
    c.add(txt(this, cx - 215, y - 44, name, 32, { originX: 0, color: COLORS.textGold, strokeW: 5, wrap: 300, align: 'left' }));
    c.add(txt(this, cx - 215, y + 6, desc, 20, { originX: 0, strokeW: 3, wrap: 300, align: 'left', shadow: false }));
    if (extra) c.add(txt(this, cx - 215, y + 50, extra, 22, { originX: 0, color: COLORS.textGreen, strokeW: 4 }));
    this.list.add(c);
    return c;
  }

  private denied(y: number, reason: string): void {
    services.audio.sfx('deny');
    if (reason === 'funds') this.floats.show(this, DESIGN.width / 2, y, t('noMoney'), COLORS.textRed, 40);
  }

  private renderUpgrades(): void {
    const d = services.save.data;
    const cx = DESIGN.width / 2;
    UPGRADE_IDS.forEach((id: UpgradeId, i) => {
      const y = this.topY + 380 + i * 152;
      const lvl = d.upgrades[id];
      const u = UPGRADES[id];
      const tx = upgradeText(id);
      const maxed = lvl >= u.max;
      const c = this.row(y, u.icon, tx.name, tx.desc, t('levelOf', { a: lvl, b: u.max }));
      const cost = upgradeCost(id, lvl);
      if (maxed) c.add(txt(this, cx + 232, y, t('maxed'), 40, { color: COLORS.textGreen, strokeW: 6 }));
      else
        c.add(
          this.actionButton(cx + 232, y, money(cost), COLORS.gold, d.wallet >= cost, () => {
            const r = buyUpgrade(d, id);
            if (!r.ok) return this.denied(y, r.reason);
            services.audio.sfx('buy');
            services.save.save();
            this.render();
          }),
        );
    });
  }

  /** Fifth row of the Upgrades tab: the permanent Helper Miner. */
  private renderHelper(): void {
    const d = services.save.data;
    const cx = DESIGN.width / 2;
    const y = this.topY + 380 + 4 * 152;
    const tx = helperText();
    const c = this.row(y, 'icon_miner', tx.name, tx.desc, '');
    if (d.helper) c.add(txt(this, cx + 232, y, t('soldOut'), 32, { color: COLORS.textGreen, strokeW: 6 }));
    else
      c.add(
        this.actionButton(cx + 232, y, money(HELPER.price), COLORS.gold, d.wallet >= HELPER.price, () => {
          const r = buyHelper(d);
          if (!r.ok) return this.denied(y, r.reason);
          services.audio.sfx('buy');
          services.save.save();
          this.render();
        }),
      );
  }

  private renderClaws(): void {
    const d = services.save.data;
    const cx = DESIGN.width / 2;
    CLAW_IDS.forEach((id: ClawId, i) => {
      const y = this.topY + 400 + i * 160;
      const tx = clawText(id);
      const def = CLAW_TYPES[id];
      const c = this.row(y, 'claw_open', tx.name, tx.desc, '');
      // tint the preview claw
      const icon = c.list[1] as Phaser.GameObjects.Image;
      icon.setTint(COSMETICS.find((x) => x.id === d.cosmetics.equipped.clawSkin)?.tint ?? def.tint);
      const owned = d.claws.owned.includes(id);
      const equipped = d.claws.equipped === id;
      if (equipped) c.add(txt(this, cx + 232, y, t('equipped'), 28, { color: COLORS.textGreen, strokeW: 5 }));
      else if (owned)
        c.add(
          this.actionButton(cx + 232, y, t('equip'), COLORS.green, true, () => {
            equipClaw(d, id);
            services.audio.sfx('click');
            services.save.save();
            this.render();
          }),
        );
      else
        c.add(
          this.actionButton(cx + 232, y, money(def.price), COLORS.gold, d.wallet >= def.price, () => {
            const r = buyClaw(d, id);
            if (!r.ok) return this.denied(y, r.reason);
            services.audio.sfx('buy');
            services.save.save();
            this.render();
          }),
        );
    });
  }

  private renderStyle(): void {
    const d = services.save.data;
    const cx = DESIGN.width / 2;
    const items = COSMETICS.filter((c) => c.slot === this.slot);
    items.forEach((it, i) => {
      const col = i % 2;
      const rowI = Math.floor(i / 2);
      const x = cx - 168 + col * 336;
      const y = this.topY + 500 + rowI * 190;
      const c = this.add.container(0, 0);
      c.add(panel(this, x, y, 322, 176));
      // preview
      if (it.slot === 'outfit') c.add(this.add.image(x - 90, y - 4, it.texture ?? 'miner').setDisplaySize(72, 91));
      else if (it.slot === 'clawSkin') c.add(this.add.image(x - 90, y - 6, 'claw_open').setDisplaySize(80, 64).setTint(it.tint ?? 0xffffff));
      else c.add(this.add.rectangle(x - 90, y - 4, 14, 80, it.tint ?? 0xc9a066).setStrokeStyle(3, 0x2b1608));
      c.add(txt(this, x + 30, y - 52, cosmeticName(it.id), 24, { color: COLORS.textGold, strokeW: 4, wrap: 150 }));
      const owned = d.cosmetics.owned.includes(it.id);
      const equipped = d.cosmetics.equipped[it.slot] === it.id;
      const by = y + 40;
      if (equipped) c.add(txt(this, x + 30, by, t('equipped'), 24, { color: COLORS.textGreen, strokeW: 5 }));
      else if (owned) {
        const b = new Button(this, x + 30, by, { w: 150, h: 96, label: t('equip'), fontSize: 26, tint: COLORS.green, silent: true, onClick: () => { equipCosmetic(d, it.id); services.audio.sfx('click'); services.save.save(); this.render(); } });
        c.add(b);
      } else {
        const b = new Button(this, x + 30, by, {
          w: 160,
          h: 96,
          label: money(it.price),
          fontSize: 26,
          tint: d.wallet >= it.price ? COLORS.gold : COLORS.grey,
          silent: true,
          onClick: () => {
            const r = buyCosmetic(d, it.id);
            if (!r.ok) return this.denied(y, r.reason);
            services.audio.sfx('buy');
            services.save.save();
            this.render();
          },
        });
        c.add(b);
      }
      this.list.add(c);
    });
  }

  update(time: number, delta: number): void {
    this.backdrop?.update(time, delta / 1000);
  }
}
