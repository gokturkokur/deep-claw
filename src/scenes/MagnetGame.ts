import Phaser from 'phaser';
import { IMAGES } from '../assets/manifest';
import { CLAW, DESIGN, FX, WORLD } from '../config/game';
import { MAGNET, MAGNET_ITEMS, MAGNET_LEVEL } from '../config/magnet';
import { money } from '../i18n';
import { mt } from '../i18n/magnet';
import { services } from '../services';
import { loadSettings, type MagnetSettings } from '../systems/MagnetSettings';
import { MagnetSession, type MagnetEvent } from '../systems/MagnetSession';
import { safeStore, type KeyValueStore } from '../systems/Save';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, FloatingTexts, dim, panel } from '../ui/components';
import { MagnetPanel } from '../ui/MagnetPanel';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

const D = { entity: 10, rig: 15, rope: 19, held: 20.5, magnet: 21, fx: 30, float: 40, hud: 60, end: 150 };
const WATER = { color: 0x4f7a5e, alpha: 0.5, deepColor: 0x1f3a33, deepAlpha: 0.35, ringColor: 0x6fd8ff, bridge: 0x6b4a2b, bridgeDark: 0x3c2813 };

/**
 * "Magnet Test": one-level prototype of the magnet-fishing idea.
 * Rules live in systems/MagnetSession.ts; this scene only draws and plays sounds.
 */
export class MagnetGame extends Phaser.Scene {
  private session!: MagnetSession;
  private settings!: MagnetSettings;
  private store!: KeyValueStore;
  private layout!: Layout;
  private backdrop!: Backdrop;
  private panelUi!: MagnetPanel;
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  private magnetImg!: Phaser.GameObjects.Image;
  private rope!: Phaser.GameObjects.TileSprite;
  private drum!: Phaser.GameObjects.Image;
  private ring!: Phaser.GameObjects.Arc;
  private floats!: FloatingTexts;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private debris!: Phaser.GameObjects.Particles.ParticleEmitter;
  private smoke!: Phaser.GameObjects.Particles.ParticleEmitter;
  private ending = false;
  private reelOn = false;
  private shownMoney = 0;
  private moneyFrom = 0;
  private moneyT = 1;
  private lastMoneyTxt = '';
  private lastTimeTxt = '';
  private lastLoadTxt = '';
  private lastRingR = -1;
  private lastTargetOk = false;

  // HUD
  private hudBar!: Phaser.GameObjects.Image;
  private moneyText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Image;
  private clockIcon!: Phaser.GameObjects.Image;
  private timerText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private loadText!: Phaser.GameObjects.Text;
  private gearBtn!: Button;

  constructor() {
    super('MagnetGame');
  }

  init(): void {
    this.sprites = new Map();
    this.ending = false;
    this.reelOn = false;
    this.shownMoney = 0;
    this.moneyFrom = 0;
    this.moneyT = 1;
    this.lastMoneyTxt = '';
    this.lastTimeTxt = '';
    this.lastLoadTxt = '';
    this.lastRingR = -1;
    this.lastTargetOk = false;
  }

  create(): void {
    this.layout = new Layout(this);
    this.store = safeStore();
    this.settings = loadSettings(this.store);
    this.session = new MagnetSession({ level: MAGNET_LEVEL, settings: this.settings });

    services.audio.playMusic('music_game');
    this.backdrop = createBackdrop(this, this.layout);
    this.createCanal();
    this.createRig();
    this.createEntities();
    this.createEffects();
    this.createHud();
    this.floats = new FloatingTexts(this, FX.floatTextPool, D.float);
    this.panelUi = new MagnetPanel(
      this,
      this.layout,
      this.settings,
      this.store,
      (open) => {
        this.session.timerFrozen = open; // the clock waits while you tune; the magnet keeps working
      },
      () => this.leave(),
    );
    this.createInput();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => services.audio.loop('reel', false));
    const dbg = (window as unknown as { __dc?: Record<string, unknown> }).__dc;
    if (dbg) {
      dbg.magnet = this.session;
      dbg.magnetScene = this;
    }
    fadeIn(this);
  }

  // ------------------------------------------------------------------ build
  /** Murky canal under a bridge deck (placeholder shapes). */
  private createCanal(): void {
    const cx = DESIGN.width / 2;
    const s = WORLD.surfaceY;
    this.add.rectangle(cx, s + 1400, 5200, 2800, WATER.color, WATER.alpha).setDepth(5.5);
    this.add.rectangle(cx, s + 1000, 5200, 1400, WATER.deepColor, WATER.deepAlpha).setDepth(5.6);
    const shimmer = this.add.rectangle(cx, s + 8, 5200, 10, 0xcdeee0, 0.35).setDepth(5.7);
    this.tweens.add({ targets: shimmer, alpha: 0.1, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // bridge deck with railing
    this.add.rectangle(cx, s - 14, 5200, 30, WATER.bridge).setStrokeStyle(4, 0x2b1608).setDepth(D.rig - 2);
    this.add.rectangle(cx, s - 62, 5200, 8, WATER.bridgeDark).setDepth(D.rig - 3);
    for (let x = -1000; x <= 1700; x += 120) this.add.rectangle(x, s - 40, 12, 56, WATER.bridgeDark).setDepth(D.rig - 3);
  }

  private createRig(): void {
    const px = WORLD.pivotX;
    const py = WORLD.pivotY;
    this.add.image(px, py - 34, 'winch').setOrigin(0.5, 0).setDisplaySize(204, 144).setDepth(D.rig);
    this.add.image(px + 158, WORLD.surfaceY + 4, 'miner').setFlipX(true).setOrigin(0.5, 1).setDisplaySize(118, 150).setDepth(D.rig + 1);
    this.rope = this.add.tileSprite(px, py, 10, 4, 'rope').setOrigin(0.5, 0).setDepth(D.rope);
    this.drum = this.add.image(px, py, 'winch_drum').setDisplaySize(70, 70).setDepth(D.rope + 0.2);
    const m = IMAGES.mg_magnet;
    this.magnetImg = this.add.image(px, py, 'mg_magnet').setOrigin(0.5, 0).setDisplaySize(m.w, m.h).setDepth(D.magnet);
    this.ring = this.add
      .circle(px, py, 100, WATER.ringColor, 0.13)
      .setStrokeStyle(5, WATER.ringColor, 0.55)
      .setDepth(D.magnet + 1);
  }

  private createEntities(): void {
    let i = 0;
    for (const e of this.session.entities) {
      const def = MAGNET_ITEMS[e.kind];
      const a = IMAGES[def.texture as keyof typeof IMAGES];
      const s = this.add.image(e.x, e.y, def.texture).setDisplaySize(a.w, a.h).setDepth(D.entity + e.y / 10000);
      const base = s.scaleX;
      s.setScale(0);
      this.tweens.add({ targets: s, scaleX: base, scaleY: base, duration: 260, delay: 80 + i * 22, ease: 'Back.Out' });
      this.sprites.set(e.id, s);
      i++;
    }
  }

  private createEffects(): void {
    const common = { emitting: false, maxAliveParticles: FX.maxParticles / 2 } as const;
    this.sparks = this.add
      .particles(0, 0, 'spark', { lifespan: { min: 280, max: 620 }, speed: { min: 80, max: 260 }, scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: Phaser.BlendModes.ADD, ...common })
      .setDepth(D.fx);
    this.debris = this.add
      .particles(0, 0, 'debris', { lifespan: { min: 500, max: 900 }, speed: { min: 120, max: 460 }, gravityY: 900, angle: { min: -160, max: -20 }, rotate: { start: 0, end: 360 }, scale: { start: 1.2, end: 0.4 }, ...common })
      .setDepth(D.fx);
    this.smoke = this.add
      .particles(0, 0, 'smoke', { lifespan: { min: 600, max: 1100 }, speed: { min: 20, max: 120 }, scale: { start: 0.8, end: 2.2 }, alpha: { start: 0.7, end: 0 }, emitting: false, maxAliveParticles: 24 })
      .setDepth(D.fx - 1);
  }

  private hudEdges(): { left: number; right: number } {
    return { left: Math.max(this.layout.left, DESIGN.width / 2 - 480), right: Math.min(this.layout.right, DESIGN.width / 2 + 480) };
  }

  private createHud(): void {
    const L = this.layout;
    const cx = DESIGN.width / 2;
    this.hudBar = this.add.image(cx, L.top, 'bar').setOrigin(0.5, 0).setDepth(D.hud);
    this.coinIcon = this.add.image(0, 0, 'icon_coin').setDisplaySize(52, 52).setDepth(D.hud + 1);
    this.moneyText = txt(this, 0, 0, money(0), 50, { color: COLORS.textGold, originX: 0, strokeW: 7 }).setDepth(D.hud + 1);
    this.clockIcon = this.add.image(0, 0, 'icon_clock').setDisplaySize(52, 52).setDepth(D.hud + 1);
    this.timerText = txt(this, 0, 0, String(MAGNET_LEVEL.durationSec), 56, { originX: 0, strokeW: 8 }).setDepth(D.hud + 1);
    this.gearBtn = new Button(this, 0, 0, { round: true, icon: 'icon_gear', tint: COLORS.brown, onClick: () => this.panelUi.toggle() })
      .setDepth(D.hud + 2)
      .setName('gear');
    this.nameText = txt(this, 0, 0, mt('levelName'), 30, { originX: 0, color: '#f4dba8' }).setDepth(D.hud + 1);
    this.targetText = txt(this, 0, 0, mt('target', { n: money(MAGNET_LEVEL.target) }), 34, { originX: 0, strokeW: 6 }).setDepth(D.hud + 1);
    this.loadText = txt(this, 0, 0, '', 34, { originX: 1, strokeW: 6 }).setDepth(D.hud + 1);
    this.relayoutHud();
    L.onChange(() => this.relayoutHud());
  }

  private relayoutHud(): void {
    const L = this.layout;
    const E = this.hudEdges();
    const top = L.top;
    const rowA = top + DESIGN.safeTop + 48;
    this.hudBar.setPosition(DESIGN.width / 2, top).setDisplaySize(L.width + 8, 160);
    this.coinIcon.setPosition(E.left + 46, rowA);
    this.moneyText.setPosition(E.left + 82, rowA + 2);
    this.clockIcon.setPosition(DESIGN.width / 2 - 70, rowA);
    this.timerText.setPosition(DESIGN.width / 2 - 30, rowA + 2);
    this.gearBtn.setPosition(E.right - 66, rowA);
    this.nameText.setPosition(E.left + 24, top + 186);
    this.targetText.setPosition(E.left + 24, top + 246);
    this.loadText.setPosition(E.right - 24, top + 246);
  }

  private createInput(): void {
    // Full screen zone at the lowest depth: HUD buttons and the panel sit on top and swallow their own taps.
    this.add.zone(DESIGN.width / 2, DESIGN.height / 2, 5200, 3000).setInteractive().setDepth(0).on('pointerdown', () => this.tryLaunch());
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.on('keydown-SPACE', () => this.tryLaunch());
    kb.on('keydown-DOWN', () => this.tryLaunch());
    kb.on('keydown-G', () => this.panelUi.toggle());
    kb.on('keydown-ESC', () => (this.panelUi.isOpen ? this.panelUi.close() : this.leave()));
  }

  // ------------------------------------------------------------------ actions
  private tryLaunch(): void {
    if (!this.ending) this.session.launch();
  }

  private leave(): void {
    goTo(this, 'MainMenu');
  }

  // ------------------------------------------------------------------ loop
  update(time: number, delta: number): void {
    const dt = Math.min(delta, CLAW.maxDt * 1000) / 1000;
    this.backdrop.update(time, dt);
    if (!this.ending) this.session.update(dt);
    const evs = this.session.events;
    for (let i = 0; i < evs.length; i++) this.onEvent(evs[i]);
    evs.length = 0;
    this.syncWorld(time, dt);
    this.syncHud(dt);
  }

  private onEvent(ev: MagnetEvent): void {
    const audio = services.audio;
    switch (ev.type) {
      case 'launch':
        audio.sfx('launch');
        break;
      case 'attach': {
        const heavy = MAGNET_ITEMS[ev.kind].weight;
        audio.sfx('hook', 0.9, Phaser.Math.Clamp(1.25 - heavy * 0.08, 0.7, 1.3));
        audio.vibrate(15);
        this.sparks.explode(5, ev.x, ev.y);
        break;
      }
      case 'stuck':
        audio.sfx('rock');
        audio.vibrate(25);
        this.smoke.explode(4, this.session.claw.tipX, this.session.claw.tipY);
        this.floats.show(this, this.session.claw.tipX, this.session.claw.tipY - 40, mt('stuck'), COLORS.textRed, 44);
        break;
      case 'recall':
        if (ev.reason === 'full') {
          audio.sfx('deny', 0.7);
          this.floats.show(this, this.session.claw.tipX, this.session.claw.tipY - 40, mt('full'), COLORS.textRed, 48);
        }
        break;
      case 'collect':
        this.onCollect(ev);
        break;
      case 'explode':
        this.onExplode(ev.id, ev.x, ev.y);
        break;
      case 'destroyed': {
        const s = this.sprites.get(ev.id);
        if (s) this.popAway(ev.id, s);
        this.debris.explode(6, ev.x, ev.y);
        break;
      }
      case 'timeUp':
        this.banner(mt('timeUp'));
        break;
      case 'end':
        this.onEnd(ev.won);
        break;
      default:
        break;
    }
  }

  private onCollect(ev: Extract<MagnetEvent, { type: 'collect' }>): void {
    const audio = services.audio;
    const px = WORLD.pivotX;
    const py = WORLD.pivotY + 20;
    const s = this.sprites.get(ev.id);
    if (s) {
      this.sprites.delete(ev.id);
      s.setDepth(D.float - 1);
      this.tweens.add({ targets: s, x: px, y: py, scaleX: 0.15, scaleY: 0.15, alpha: 0, duration: 220, ease: 'Quad.In', onComplete: () => s.destroy() });
    }
    this.sparks.explode(ev.value >= 300 ? 14 : 8, px, py);
    this.moneyFrom = this.shownMoney;
    this.moneyT = 0;
    audio.sfx(ev.kind === 'safe' ? 'bag' : ev.value >= 300 ? 'diamond' : 'gold');
    audio.vibrate(ev.value >= 300 ? 35 : 15);
    this.floats.show(this, px + Phaser.Math.Between(-40, 40), py - 30, '+' + money(ev.value), COLORS.textGold, ev.value >= 300 ? 64 : 48);
  }

  private onExplode(id: number, x: number, y: number): void {
    services.audio.sfx('explosion');
    services.audio.vibrate(120);
    this.cameras.main.shake(260, 0.012);
    this.debris.explode(18, x, y);
    this.sparks.explode(18, x, y);
    this.smoke.explode(6, x, y);
    this.floats.show(this, x, y - 60, mt('boom'), COLORS.textRed, 64);
    const ringFx = this.add.circle(x, y, 20, 0xffe07a, 0).setStrokeStyle(10, 0xffd23a).setDepth(D.fx);
    this.tweens.add({ targets: ringFx, scale: MAGNET.blastRadius / 20, alpha: 0, duration: 380, ease: 'Quad.Out', onComplete: () => ringFx.destroy() });
    const g = this.sprites.get(id);
    if (g) this.popAway(id, g);
  }

  private popAway(id: number, s: Phaser.GameObjects.Image): void {
    this.sprites.delete(id);
    this.tweens.add({ targets: s, scaleX: 0, scaleY: 0, angle: 90, alpha: 0, duration: 200, ease: 'Back.In', onComplete: () => s.destroy() });
  }

  private banner(text: string): void {
    const b = txt(this, DESIGN.width / 2, 560, text, 100, { color: COLORS.textRed, strokeW: 14 }).setDepth(D.float).setScale(0.3);
    this.tweens.add({ targets: b, scale: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: b, alpha: 0, delay: 900, duration: 300, onComplete: () => b.destroy() });
  }

  /** Result card. Deliberately not saved anywhere: this mode never touches the Deep Claw save. */
  private onEnd(won: boolean): void {
    if (this.ending) return;
    this.ending = true;
    this.panelUi.close();
    services.audio.loop('reel', false);
    this.reelOn = false;
    services.audio.sfx(won ? 'win' : 'lose');
    this.time.delayedCall(700, () => {
      const cx = DESIGN.width / 2;
      const cy = DESIGN.height / 2;
      dim(this, this.layout, 0.6).setDepth(D.end);
      panel(this, cx, cy, 600, 520).setDepth(D.end + 1);
      txt(this, cx, cy - 170, won ? mt('won') : mt('lost'), 56, { color: won ? COLORS.textGreen : COLORS.textRed, strokeW: 9 }).setDepth(D.end + 2);
      txt(this, cx, cy - 60, mt('result', { a: money(this.session.earned), b: money(MAGNET_LEVEL.target) }), 42).setDepth(D.end + 2);
      new Button(this, cx - 140, cy + 100, { w: 250, label: mt('retry'), fontSize: 40, tint: COLORS.green, onClick: () => goTo(this, 'MagnetGame') }).setDepth(D.end + 2).setName('retry');
      new Button(this, cx + 140, cy + 100, { w: 250, label: mt('menu'), fontSize: 40, tint: COLORS.brown, onClick: () => this.leave() }).setDepth(D.end + 2).setName('endmenu');
    });
  }

  // ------------------------------------------------------------------ rendering
  private syncWorld(time: number, dt: number): void {
    const c = this.session.claw;
    const dx = c.dx;
    const dy = c.dy;
    const rot = Math.atan2(dy, dx) - Math.PI / 2;
    const ropeEnd = Math.max(0, c.length - CLAW.bodyLength);
    this.rope.setRotation(rot);
    this.rope.height = ropeEnd;
    this.rope.setVisible(ropeEnd > 0.5);
    this.magnetImg.setPosition(WORLD.pivotX + dx * ropeEnd, WORLD.pivotY + dy * ropeEnd).setRotation(rot);
    this.drum.rotation += Phaser.Math.Clamp(c.speed / 40, -14, 14) * dt;

    const reeling = c.state === 'launching' || c.state === 'retracting';
    if (reeling !== this.reelOn) {
      this.reelOn = reeling;
      services.audio.loop('reel', reeling, 0.45);
    }

    // pull ring, centred on the magnet face
    const R = this.settings.pullRadius;
    this.ring.setVisible(this.settings.showRing).setPosition(c.tipX, c.tipY);
    if (R !== this.lastRingR) {
      this.lastRingR = R;
      this.ring.setRadius(R);
    }

    const jitter = MAGNET.pullJitterPx;
    for (const e of this.session.entities) {
      const s = this.sprites.get(e.id);
      if (!s || !e.alive) continue;
      if (e.attached) {
        s.setPosition(e.x, e.y).setRotation(rot);
        if (s.depth !== D.held) s.setDepth(D.held);
      } else if (e.pulled) {
        s.setPosition(e.x + Math.sin(time / 22 + e.id) * jitter, e.y + Math.cos(time / 27 + e.id) * jitter);
      } else {
        s.setPosition(e.x, e.y);
      }
    }
  }

  private syncHud(dt: number): void {
    const s = this.session;
    if (this.moneyT < 1) {
      this.moneyT = Math.min(1, this.moneyT + dt / FX.moneyTickSec);
      this.shownMoney = Math.round(this.moneyFrom + (s.earned - this.moneyFrom) * this.moneyT);
    } else this.shownMoney = s.earned;
    const mtxt = money(this.shownMoney);
    if (mtxt !== this.lastMoneyTxt) {
      this.lastMoneyTxt = mtxt;
      this.moneyText.setText(mtxt);
    }
    const ok = s.earned >= MAGNET_LEVEL.target;
    if (ok !== this.lastTargetOk) {
      this.lastTargetOk = ok;
      this.targetText.setColor(ok ? COLORS.textGreen : COLORS.textLight);
    }
    const secs = String(Math.ceil(s.timeLeft));
    if (secs !== this.lastTimeTxt) {
      this.lastTimeTxt = secs;
      this.timerText.setText(secs);
      this.timerText.setColor(Number(secs) <= 10 ? COLORS.textRed : COLORS.textLight);
    }
    const lt = mt('load', { a: s.load.toFixed(1), b: this.settings.capacity.toFixed(1) });
    if (lt !== this.lastLoadTxt) {
      this.lastLoadTxt = lt;
      this.loadText.setText(lt);
      this.loadText.setColor(s.isFull() ? COLORS.textRed : COLORS.textLight);
    }
  }
}
