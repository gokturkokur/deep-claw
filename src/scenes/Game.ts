import Phaser from 'phaser';
import { IMAGES } from '../assets/manifest';
import { OBJECTS, type ObjType } from '../config/economy';
import { CLAW, DESIGN, FX, LEVEL_RULES, WORLD } from '../config/game';
import { LEVELS, type LevelDef } from '../data/levels';
import { money, t } from '../i18n';
import { services } from '../services';
import { Session, type SessionEvent } from '../systems/Session';
import { commitOutcome } from '../systems/Progress';
import { activeModifiers } from '../systems/Shop';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, FloatingTexts } from '../ui/components';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

const D = { entity: 10, rig: 15, rope: 19, held: 20.5, claw: 21, fx: 30, float: 40, hud: 60, flash: 80 };

export class Game extends Phaser.Scene {
  private levelId = 1;
  private level!: LevelDef;
  private session!: Session;
  private layout!: Layout;
  private backdrop!: Backdrop;
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  private clawImg!: Phaser.GameObjects.Image;
  private rope!: Phaser.GameObjects.TileSprite;
  private drum!: Phaser.GameObjects.Image;
  private miner!: Phaser.GameObjects.Image;
  private ending = false;
  private paused = false;
  private floats!: FloatingTexts;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private debris!: Phaser.GameObjects.Particles.ParticleEmitter;
  private smoke!: Phaser.GameObjects.Particles.ParticleEmitter;
  private glintPool: Phaser.GameObjects.Image[] = [];
  private glintTimer = 0;
  private fuseTimer = 0;
  private beetleFrame = 0;
  private reelOn = false;
  private lastSwingSide = 0;

  // HUD
  private hudBar!: Phaser.GameObjects.Image;
  private moneyText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Image;
  private clockIcon!: Phaser.GameObjects.Image;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private pauseBtn!: Button;
  private blastBtn!: Button;
  private blastCount!: Phaser.GameObjects.Text;
  private boostIcons: Phaser.GameObjects.Image[] = [];
  private hint?: Phaser.GameObjects.Text;
  private shownMoney = 0;
  private moneyFrom = 0;
  private moneyT = 1;
  private lastMoneyTxt = '';
  private lastTimeTxt = '';
  private lastCaps = -1;
  private lastTargetOk = false;
  private lastBlastReady = false;
  private warnPulse = -1;

  constructor() {
    super('Game');
  }

  init(data: { levelId?: number }): void {
    this.levelId = Math.min(LEVELS.length, Math.max(1, data?.levelId ?? 1));
    this.sprites = new Map();
    this.boostIcons = [];
    this.glintPool = [];
    this.ending = false;
    this.paused = false;
    this.reelOn = false;
    this.lastSwingSide = 0;
    this.shownMoney = 0;
    this.moneyFrom = 0;
    this.moneyT = 1;
    this.lastMoneyTxt = '';
    this.lastTimeTxt = '';
    this.lastCaps = -1;
    this.lastTargetOk = false;
    this.lastBlastReady = true;
    this.warnPulse = -1;
    this.hint = undefined;
  }

  create(): void {
    const save = services.save;
    const audio = services.audio;
    this.layout = new Layout(this);
    this.level = LEVELS[this.levelId - 1];
    this.session = new Session({
      level: this.level,
      modifiers: activeModifiers(save.data),
      blastCaps: save.data.inventory.blastCaps,
    });

    audio.playMusic('music_game');
    this.backdrop = createBackdrop(this, this.layout);
    this.createRig();
    this.createEntities();
    this.createEffects();
    this.createHud();
    this.createInput();

    this.floats = new FloatingTexts(this, FX.floatTextPool, D.float);
    for (let i = 0; i < 6; i++) this.glintPool.push(this.add.image(0, 0, 'spark').setDepth(D.fx).setVisible(false).setBlendMode(Phaser.BlendModes.ADD));

    // auto-pause when the page / app goes to the background
    const autoPause = () => this.openPause();
    this.game.events.on(Phaser.Core.Events.HIDDEN, autoPause);
    this.game.events.on(Phaser.Core.Events.BLUR, autoPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, autoPause);
      this.game.events.off(Phaser.Core.Events.BLUR, autoPause);
      audio.loop('reel', false);
    });
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.paused = false;
      this.refreshLabels();
    });

    const dbg = (window as unknown as { __dc?: Record<string, unknown> }).__dc;
    if (dbg) {
      dbg.session = this.session;
      dbg.gameScene = this;
    }
    fadeIn(this);
  }

  // ------------------------------------------------------------------ build
  private createRig(): void {
    const px = WORLD.pivotX;
    const py = WORLD.pivotY;
    this.add
      .image(px, py - 34, 'winch')
      .setOrigin(0.5, 0)
      .setDisplaySize(204, 144)
      .setDepth(D.rig);
    this.miner = this.add
      .image(px + 158, WORLD.surfaceY + 4, 'miner').setFlipX(true)
      .setOrigin(0.5, 1)
      .setDisplaySize(118, 150)
      .setDepth(D.rig + 1);
    if (this.session.mods.extraMiner) {
      this.add.image(px - 150, WORLD.surfaceY + 4, 'miner').setOrigin(0.5, 1).setDisplaySize(96, 122).setDepth(D.rig + 1).setTint(0xb8d8ff);
    }
    this.rope = this.add.tileSprite(px, py, 10, 4, 'rope').setOrigin(0.5, 0).setDepth(D.rope);
    this.drum = this.add.image(px, py, 'winch_drum').setDisplaySize(70, 70).setDepth(D.rope + 0.2);
    this.clawImg = this.add.image(px, py, 'claw_open').setOrigin(0.5, 0).setDisplaySize(90, 72).setDepth(D.claw);
    this.tweens.add({ targets: this.miner, scaleY: this.miner.scaleY * 1.025, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  private createEntities(): void {
    let i = 0;
    for (const e of this.session.entities) {
      const def = OBJECTS[e.type];
      const a = IMAGES[def.texture as keyof typeof IMAGES];
      const s = this.add.image(e.x, e.y, def.texture).setDisplaySize(a.w, a.h).setDepth(D.entity + e.y / 10000);
      const base = s.scaleX;
      s.setScale(0);
      this.tweens.add({ targets: s, scaleX: base, scaleY: base, duration: 260, delay: 80 + i * 22, ease: 'Back.Out' });
      if (e.type === 'bag') {
        this.tweens.add({ targets: s, angle: { from: -5, to: 5 }, duration: 700 + (i % 3) * 120, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      this.sprites.set(e.id, s);
      i++;
    }
  }

  private createEffects(): void {
    this.sparks = this.add
      .particles(0, 0, 'spark', {
        lifespan: { min: 280, max: 620 },
        speed: { min: 80, max: 260 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
        maxAliveParticles: FX.maxParticles / 2,
      })
      .setDepth(D.fx);
    this.debris = this.add
      .particles(0, 0, 'debris', {
        lifespan: { min: 500, max: 900 },
        speed: { min: 120, max: 460 },
        gravityY: 900,
        angle: { min: -160, max: -20 },
        rotate: { start: 0, end: 360 },
        scale: { start: 1.2, end: 0.4 },
        emitting: false,
        maxAliveParticles: FX.maxParticles / 2,
      })
      .setDepth(D.fx);
    this.smoke = this.add
      .particles(0, 0, 'smoke', {
        lifespan: { min: 600, max: 1100 },
        speed: { min: 20, max: 120 },
        scale: { start: 0.8, end: 2.2 },
        alpha: { start: 0.7, end: 0 },
        emitting: false,
        maxAliveParticles: 24,
      })
      .setDepth(D.fx - 1);
  }

  private createHud(): void {
    const L = this.layout;
    const E = this.hudEdges();
    const top = L.top;
    const cx = DESIGN.width / 2;
    this.hudBar = this.add.image(cx, top, 'bar').setOrigin(0.5, 0).setDepth(D.hud);
    const fit = () => {
      this.hudBar.setPosition(cx, L.top).setDisplaySize(L.width + 8, 160);
    };
    fit();

    const rowA = top + DESIGN.safeTop + 48;
    this.coinIcon = this.add.image(E.left + 46, rowA, 'icon_coin').setDisplaySize(52, 52).setDepth(D.hud + 1);
    this.moneyText = txt(this, E.left + 82, rowA + 2, money(0), 50, { color: COLORS.textGold, originX: 0, strokeW: 7 }).setDepth(D.hud + 1);
    this.clockIcon = this.add.image(cx - 70, rowA, 'icon_clock').setDisplaySize(52, 52).setDepth(D.hud + 1);
    this.timerText = txt(this, cx - 30, rowA + 2, '60', 56, { originX: 0, strokeW: 8 }).setDepth(D.hud + 1);

    this.pauseBtn = new Button(this, E.right - 66, rowA, {
      round: true,
      icon: 'icon_pause',
      tint: COLORS.brown,
      onClick: () => this.openPause(),
    }).setDepth(D.hud + 2).setName('pause');

    this.levelText = txt(this, E.left + 24, top + 186, '', 30, { originX: 0, color: '#f4dba8' }).setDepth(D.hud + 1);
    this.targetText = txt(this, E.left + 24, top + 246, '', 34, { originX: 0, strokeW: 6 }).setDepth(D.hud + 1);

    this.blastBtn = new Button(this, E.right - 70, top + 262, {
      round: true,
      icon: 'icon_blast',
      tint: COLORS.red,
      onClick: () => this.useBlast(),
    }).setDepth(D.hud + 2).setName('blast');
    this.blastCount = txt(this, E.right - 70 + 34, top + 262 + 34, 'x0', 34, { strokeW: 6, color: COLORS.textGold }).setDepth(D.hud + 3);

    // active one-level boosts
    const mods = this.session.mods;
    const icons: Array<[boolean, 'icon_turbo' | 'icon_lantern' | 'icon_gem' | 'icon_crusher' | 'icon_hourglass' | 'icon_goldrush' | 'icon_miner']> = [
      [mods.turbo, 'icon_turbo'],
      [mods.lantern, 'icon_lantern'],
      [mods.gemLens, 'icon_gem'],
      [mods.crusher, 'icon_crusher'],
      [mods.hourglass, 'icon_hourglass'],
      [mods.goldRush, 'icon_goldrush'],
      [mods.extraMiner, 'icon_miner'],
    ];
    let bx = E.left + 24 + 26;
    for (const [on, key] of icons) {
      if (!on) continue;
      this.boostIcons.push(this.add.image(bx, top + 300, key).setDisplaySize(52, 52).setDepth(D.hud + 1));
      bx += 58;
    }

    L.onChange(() => {
      const dy = L.top - top;
      void dy;
      this.relayoutHud();
    });
    this.refreshLabels();

    if (!services.save.data.hintShown) {
      this.hint = txt(this, cx, 470, t('tapToDrop'), 46, { strokeW: 7, color: COLORS.textGold }).setDepth(D.float);
      this.tweens.add({ targets: this.hint, scale: { from: 1, to: 1.08 }, alpha: { from: 1, to: 0.7 }, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  /** HUD stays within a 960 px wide centre on very wide screens (desktop), edge to edge on phones. */
  private hudEdges(): { left: number; right: number } {
    return { left: Math.max(this.layout.left, DESIGN.width / 2 - 480), right: Math.min(this.layout.right, DESIGN.width / 2 + 480) };
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
    this.pauseBtn.setPosition(E.right - 66, rowA);
    this.levelText.setPosition(E.left + 24, top + 186);
    this.targetText.setPosition(E.left + 24, top + 246);
    this.blastBtn.setPosition(E.right - 70, top + 262);
    this.blastCount.setPosition(E.right - 70 + 34, top + 262 + 34);
    let bx = E.left + 24 + 26;
    for (const i of this.boostIcons) {
      i.setPosition(bx, top + 300);
      bx += 58;
    }
  }

  private refreshLabels(): void {
    this.levelText.setText(t('levelShort', { n: this.levelId }));
    this.targetText.setText(t('target', { n: money(this.level.target) }));
    this.lastTargetOk = !this.lastTargetOk; // force colour refresh
    this.lastMoneyTxt = '';
  }

  private createInput(): void {
    const kb = this.input.keyboard;
    // Full screen zone, lowest in the input order: HUD buttons sit on top of it and swallow their own taps.
    const zone = this.add.zone(DESIGN.width / 2, DESIGN.height / 2, 5200, 3000).setInteractive().setDepth(0);
    zone.on('pointerdown', () => this.tryLaunch());
    if (!kb) return;
    kb.on('keydown-SPACE', () => this.tryLaunch());
    kb.on('keydown-DOWN', () => this.tryLaunch());
    kb.on('keydown-D', () => this.useBlast());
    kb.on('keydown-P', () => this.openPause());
    kb.on('keydown-ESC', () => this.openPause());
  }

  // ------------------------------------------------------------------ actions
  private tryLaunch(): void {
    if (this.paused || this.ending) return;
    if (this.session.launch()) {
      const save = services.save;
      if (!save.data.hintShown) {
        save.data.hintShown = true;
        save.save();
      }
      if (this.hint) {
        this.tweens.killTweensOf(this.hint);
        this.tweens.add({ targets: this.hint, alpha: 0, duration: 200, onComplete: () => this.hint?.destroy() });
        this.hint = undefined;
      }
    }
  }

  private useBlast(): void {
    if (this.paused || this.ending) return;
    if (!this.session.useBlastCap()) services.audio.sfx('deny', 0.6);
  }

  private openPause(): void {
    if (this.paused || this.ending || this.session.status !== 'playing') return;
    if (!this.scene.isActive('Game')) return;
    this.paused = true;
    services.audio.loop('reel', false);
    this.reelOn = false;
    this.scene.pause();
    this.scene.launch('Pause', { levelId: this.levelId });
  }

  // ------------------------------------------------------------------ loop
  update(time: number, delta: number): void {
    const dt = Math.min(delta, CLAW.maxDt * 1000) / 1000;
    this.backdrop.update(time, dt);
    if (!this.ending) this.session.update(dt);
    this.handleEvents();
    this.syncWorld(time, dt);
    this.syncHud(dt);
  }

  private handleEvents(): void {
    const evs = this.session.events;
    if (evs.length === 0) return;
    for (let i = 0; i < evs.length; i++) this.onEvent(evs[i]);
    evs.length = 0;
  }

  private onEvent(ev: SessionEvent): void {
    const audio = services.audio;
    switch (ev.type) {
      case 'launch':
        audio.sfx('launch');
        break;
      case 'hit': {
        const e = this.session.get(ev.id);
        if (e && e.type !== 'keg') {
          audio.sfx('hook');
          this.dustAt(this.session.claw.tipX, this.session.claw.tipY, 4);
          audio.vibrate(15);
        }
        break;
      }
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
      case 'blast': {
        audio.sfx('blast');
        audio.vibrate(40);
        const s = this.sprites.get(ev.id);
        if (s) this.popAway(ev.id, s);
        this.debris.explode(10, ev.x, ev.y);
        this.sparks.explode(10, ev.x, ev.y);
        this.floats.show(this, ev.x, ev.y - 30, t('blastUsed'), COLORS.textRed, 56);
        break;
      }
      case 'timeUp':
        this.showBanner(t('timeUp'));
        break;
      case 'end':
        this.onEnd(ev.won);
        break;
      default:
        break;
    }
  }

  private onCollect(ev: Extract<SessionEvent, { type: 'collect' }>): void {
    const audio = services.audio;
    const s = this.sprites.get(ev.id);
    const px = WORLD.pivotX;
    const py = WORLD.pivotY + 20;
    if (s) {
      this.sprites.delete(ev.id);
      s.setDepth(D.float - 1);
      this.tweens.add({
        targets: s,
        x: px,
        y: py,
        scaleX: 0.15,
        scaleY: 0.15,
        alpha: 0,
        duration: 220,
        ease: 'Quad.In',
        onComplete: () => s.destroy(),
      });
    }
    this.sparks.explode(ev.kind === 'diamond' ? 16 : 9, px, py);
    this.moneyFrom = this.shownMoney;
    this.moneyT = 0;
    this.tweens.add({ targets: this.miner, angle: { from: -4, to: 4 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => this.miner.setAngle(0) });

    if (ev.kind === 'bag') {
      audio.sfx('bag');
      const b = ev.bag;
      if (b?.kind === 'money') this.floats.show(this, px, py - 30, '+' + money(ev.value), COLORS.textGold);
      else if (b?.kind === 'item') this.floats.show(this, px, py - 30, t('bagItem', { n: b.blastCaps }), COLORS.textRed, 46);
      else this.floats.show(this, px, py - 30, t('bagStrength'), COLORS.textGreen, 46);
      this.sparks.explode(14, px, py);
      audio.vibrate(30);
      return;
    }
    if (ev.kind === 'diamond' || (ev.kind === 'beetle' && ev.value > 100)) audio.sfx('diamond');
    else if (ev.kind === 'rockS' || ev.kind === 'rockL') audio.sfx('rock');
    else audio.sfx('gold');
    if (ev.value > 0) this.floats.show(this, px, py - 30, '+' + money(ev.value), COLORS.textGold, ev.value >= 500 ? 64 : 52);
    audio.vibrate(ev.value >= 500 ? 35 : 15);
  }

  private onExplode(id: number, x: number, y: number): void {
    const audio = services.audio;
    audio.sfx('explosion');
    audio.vibrate(120);
    this.cameras.main.shake(260, 0.012);
    this.debris.explode(18, x, y);
    this.sparks.explode(18, x, y);
    this.smoke.explode(6, x, y);
    const ring = this.add.circle(x, y, 20, 0xffe07a, 0.0).setStrokeStyle(10, 0xffd23a).setDepth(D.fx);
    this.tweens.add({ targets: ring, scale: 9, alpha: 0, duration: 380, ease: 'Quad.Out', onComplete: () => ring.destroy() });
    const flash = this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, this.layout.width + 8, this.layout.height + 8, 0xfff2c0, 0.5).setDepth(D.flash);
    this.tweens.add({ targets: flash, alpha: 0, duration: 260, onComplete: () => flash.destroy() });
    const keg = this.sprites.get(id);
    if (keg) this.popAway(id, keg);
  }

  private popAway(id: number, s: Phaser.GameObjects.Image): void {
    this.sprites.delete(id);
    this.tweens.add({ targets: s, scaleX: 0, scaleY: 0, angle: 90, alpha: 0, duration: 200, ease: 'Back.In', onComplete: () => s.destroy() });
  }

  private dustAt(x: number, y: number, n: number): void {
    this.smoke.explode(n, x, y);
  }

  private showBanner(text: string): void {
    const b = txt(this, DESIGN.width / 2, 560, text, 100, { color: COLORS.textRed, strokeW: 14 }).setDepth(D.float).setScale(0.3);
    this.tweens.add({ targets: b, scale: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: b, alpha: 0, delay: 900, duration: 300, onComplete: () => b.destroy() });
  }

  private onEnd(won: boolean): void {
    if (this.ending) return;
    this.ending = true;
    const audio = services.audio;
    audio.loop('reel', false);
    this.reelOn = false;
    const s = this.session;
    this.time.delayedCall(won ? 700 : 900, () => {
      const save = services.save;
      const outcome = { levelId: this.levelId, earned: s.earned, target: this.level.target, won, blastCapsLeft: s.blastCaps };
      const result = commitOutcome(save.data, outcome);
      save.save();
      if (won && result) {
        goTo(this, 'LevelComplete', { ...outcome, ...result });
      } else {
        goTo(this, 'GameOver', outcome);
      }
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
    const rx = WORLD.pivotX + dx * ropeEnd;
    const ry = WORLD.pivotY + dy * ropeEnd;
    this.clawImg.setPosition(rx, ry).setRotation(rot);
    const closed = c.state === 'hooked' || c.state === 'retracting' || c.state === 'collecting';
    const wantTex = closed ? 'claw_closed' : 'claw_open';
    if (this.clawImg.texture.key !== wantTex) this.clawImg.setTexture(wantTex);

    // winch drum + miner effort
    const spin = Phaser.Math.Clamp(c.speed / 40, -14, 14);
    this.drum.rotation += spin * dt;
    const reeling = c.state === 'launching' || c.state === 'retracting';
    this.miner.setRotation(reeling ? Math.sin(time / 70) * 0.04 : 0);

    // soft creak each time the swing passes the centre
    if (c.state === 'swinging') {
      const side = c.angleDeg >= 90 ? 1 : -1;
      if (this.lastSwingSide !== 0 && side !== this.lastSwingSide) services.audio.sfx('tick', 0.35);
      this.lastSwingSide = side;
    }

    // reel sound loop
    if (reeling !== this.reelOn) {
      this.reelOn = reeling;
      services.audio.loop('reel', reeling, 0.45);
    }

    // entities that move
    this.beetleFrame += dt * 7;
    const frame = Math.floor(this.beetleFrame) % 2 === 0 ? 'beetle_a' : 'beetle_b';
    for (const e of this.session.entities) {
      if (!e.alive) continue;
      const s = this.sprites.get(e.id);
      if (!s) continue;
      if (e.type === 'beetle') {
        s.setPosition(e.x, e.y);
        if (!e.hooked && s.texture.key !== frame) s.setTexture(frame);
        s.setFlipX(e.vx < 0);
      } else if (e.hooked) {
        s.setPosition(e.x, e.y).setRotation(rot);
      }
      if (e.hooked && s.depth !== D.held) s.setDepth(D.held);
    }

    // ambient glints on treasure + fuse sparks on kegs
    this.glintTimer -= dt;
    if (this.glintTimer <= 0) {
      this.glintTimer = 0.28;
      this.spawnGlint();
    }
    this.fuseTimer -= dt;
    if (this.fuseTimer <= 0) {
      this.fuseTimer = 0.14;
      for (const e of this.session.entities) if (e.type === 'keg' && e.alive) this.sparks.explode(1, e.x + 6, e.y - 52);
    }
  }

  private spawnGlint(): void {
    const list = this.session.entities;
    for (let tries = 0; tries < 6; tries++) {
      const e = list[Math.floor(Math.random() * list.length)];
      if (!e.alive || e.hooked || !this.isShiny(e.type)) continue;
      const g = this.glintPool.find((x) => !x.visible);
      if (!g) return;
      const r = e.shape.kind === 'circle' ? e.shape.r : 30;
      g.setPosition(e.x + Phaser.Math.Between(-r, r) * 0.6, e.y + Phaser.Math.Between(-r, r) * 0.6 - 4);
      g.setVisible(true).setScale(0).setAlpha(1).setAngle(0);
      this.tweens.add({ targets: g, scale: e.type === 'diamond' ? 0.9 : 0.6, angle: 60, duration: 220, yoyo: true, onComplete: () => g.setVisible(false) });
      return;
    }
  }

  private isShiny(t0: ObjType): boolean {
    return t0 === 'goldS' || t0 === 'goldM' || t0 === 'goldL' || t0 === 'diamond';
  }

  private syncHud(dt: number): void {
    const s = this.session;
    // money count-up
    if (this.moneyT < 1) {
      this.moneyT = Math.min(1, this.moneyT + dt / FX.moneyTickSec);
      this.shownMoney = Math.round(this.moneyFrom + (s.earned - this.moneyFrom) * this.moneyT);
    } else this.shownMoney = s.earned;
    const mt = money(this.shownMoney);
    if (mt !== this.lastMoneyTxt) {
      this.lastMoneyTxt = mt;
      this.moneyText.setText(mt);
    }
    // target colour
    const ok = s.earned >= this.level.target;
    if (ok !== this.lastTargetOk) {
      this.lastTargetOk = ok;
      this.targetText.setColor(ok ? COLORS.textGreen : COLORS.textLight);
      if (ok) {
        this.tweens.add({ targets: this.targetText, scale: { from: 1, to: 1.25 }, duration: 160, yoyo: true });
      }
    }
    // timer
    const secs = Math.ceil(s.timeLeft);
    const tt = String(secs);
    if (tt !== this.lastTimeTxt) {
      this.lastTimeTxt = tt;
      this.timerText.setText(tt);
      const warn = secs <= LEVEL_RULES.warnSec && secs > 0;
      this.timerText.setColor(warn ? COLORS.textRed : COLORS.textLight);
      if (warn && this.warnPulse !== secs) {
        this.warnPulse = secs;
        this.tweens.add({ targets: this.timerText, scale: { from: 1.35, to: 1 }, duration: 380, ease: 'Quad.Out' });
      }
    }
    // blast cap button
    if (s.blastCaps !== this.lastCaps) {
      this.lastCaps = s.blastCaps;
      this.blastCount.setText('x' + s.blastCaps);
    }
    const ready = s.blastCaps > 0 && s.claw.hookedId >= 0 && (s.claw.state === 'retracting' || s.claw.state === 'hooked');
    if (ready !== this.lastBlastReady) {
      this.lastBlastReady = ready;
      this.blastBtn.setEnabled(ready);
      if (ready) this.blastBtn.pop();
    }
  }
}
