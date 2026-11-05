import Phaser from 'phaser';
import { IMAGES, type SoundKey } from '../assets/manifest';
import { COSMETICS, OBJECTS, WEEKLY, type ObjType } from '../config/economy';
import { CLAW, DESIGN, FX, LEVEL_RULES, MEGA_BLAST, WORLD } from '../config/game';
import { CLAW_TYPES, COMBO } from '../config/economy';
import { LEVELS, type LevelDef } from '../data/levels';
import { storyBeatFor } from '../data/story';
import { missionText, money, t, tipText } from '../i18n';
import { services } from '../services';
import { Session, type SessionEvent } from '../systems/Session';
import { estimateLevel } from '../systems/Balance';
import { TWIST, twistFor, isBoss, missionDone, missionFor, missionGoal, missionIsRestriction, missionProgress, themeOf, tipFor, worldOf, type Mission, type ThemeId } from '../systems/Campaign';
import { weekId, weeklyLevel } from '../systems/Fields';
import { checkAchievements, commitEndless, commitOutcome, commitWeekly, mergeStats } from '../systems/Progress';
import { activeModifiers } from '../systems/Shop';
import { createBackdrop, type Backdrop } from '../ui/Backdrop';
import { Button, FloatingTexts, dim, panel } from '../ui/components';
import { showTutorial } from '../ui/Tutorial';
import { COLORS, Layout, fadeIn, goTo, txt } from '../ui/theme';

const D = { entity: 10, rig: 15, rope: 19, held: 20.5, claw: 21, fx: 30, float: 40, hud: 60, flash: 80 };

export type GameMode = 'campaign' | 'weekly' | 'endless';

export class Game extends Phaser.Scene {
  private mode: GameMode = 'campaign';
  private theme: ThemeId = 'mine';
  private weekKey = '';
  private mission: Mission | null = null;
  private missionShown = false;
  private missionText!: Phaser.GameObjects.Text;
  private freezeBtn!: Button;
  private freezeCount!: Phaser.GameObjects.Text;
  private lastFreeze = -1;
  private lastWave = 0;
  private lastMission = '';
  private comboText!: Phaser.GameObjects.Text;
  private bonusText!: Phaser.GameObjects.Text;
  private bonusSum = 0;
  private bonusTimer?: Phaser.Time.TimerEvent;
  private missionDoneAt = -1;
  private lastCombo = 0;
  private tip?: Phaser.GameObjects.Container;
  private storyPending = false;
  private introLock = 0;
  private dark!: Phaser.GameObjects.Rectangle;
  private wasRushing = false;
  private twist = { rush: false, blackout: false };
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

  init(data: { levelId?: number; mode?: GameMode }): void {
    this.mode = data?.mode ?? 'campaign';
    this.levelId = this.mode === 'campaign' ? Math.min(LEVELS.length, Math.max(1, data?.levelId ?? 1)) : 0;
    this.missionShown = false;
    this.lastFreeze = -1;
    this.lastWave = 0;
    this.introLock = 0;
    this.lastCombo = 0;
    this.bonusSum = 0;
    this.missionDoneAt = -1;
    this.lastMission = '';
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
    if (this.mode === 'campaign') this.level = LEVELS[this.levelId - 1];
    else if (this.mode === 'weekly') {
      this.weekKey = weekId(new Date());
      const probe = weeklyLevel(this.weekKey, 1);
      const target = Math.max(500, Math.round((estimateLevel(probe).estimate * WEEKLY.targetShare) / 50) * 50);
      this.level = weeklyLevel(this.weekKey, target);
    } else this.level = { id: 0, name: 'Endless', target: 0, objects: [] };
    this.mission = this.mode === 'campaign' ? missionFor(this.level) : null;
    this.session = new Session({
      level: this.level,
      modifiers: activeModifiers(save.data),
      blastCaps: save.data.inventory.blastCaps,
      freezeCount: save.data.inventory.freeze,
      upgrades: save.data.upgrades,
      clawType: save.data.claws.equipped,
      perfectBonus: true,
      permanentHelper: save.data.helper,
      endlessSeed: this.mode === 'endless' ? Math.floor(Math.random() * 1e9) : undefined,
    });
    this.lastWave = this.session.wave;
    this.twist = this.mode === 'campaign' ? twistFor(this.levelId) : { rush: false, blackout: false };
    this.wasRushing = false;
    this.theme = this.mode === 'campaign' ? themeOf(this.levelId) : this.mode === 'weekly' ? 'ice' : 'abyss';

    const trackFor: Record<ThemeId, SoundKey> = { mine: 'music_game', cave: 'music_cave', lava: 'music_lava', ice: 'music_ice', abyss: 'music_abyss' };
    this.storyPending = this.mode === 'campaign' && !!storyBeatFor(this.levelId) && !save.data.storySeen.includes(storyBeatFor(this.levelId)?.id ?? '') && !this.skipStory();
    audio.playMusic(this.mode === 'campaign' && isBoss(this.levelId) ? 'music_boss' : trackFor[this.theme]);
    this.backdrop = createBackdrop(this, this.layout, { theme: this.theme });
    this.createRig();
    this.createEntities();
    this.createEffects();
    this.createHud();
    this.createInput();
    this.dark = this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, this.layout.width + 8, this.layout.height + 8, 0x000000, 0).setDepth(D.hud - 5);

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
    // story beat before the level (once), boss banner
    const storyBeat = this.mode === 'campaign' ? storyBeatFor(this.levelId) : null;
    const playStory = !!storyBeat && !save.data.storySeen.includes(storyBeat.id) && !this.skipStory();
    // a fade that gets paused halfway would leave the field black behind the dialogue
    if (!playStory) fadeIn(this);
    if (this.mode === 'campaign') {
      const beat = storyBeat;
      if (beat && playStory) {
        this.paused = true;
        this.scene.pause();
        this.scene.launch('Story', { beat: beat.id, from: 'Game' });
      } else {
        const tip = tipFor(this.level, save.data.tipsSeen) ?? (save.data.inventory.freeze > 0 && !save.data.tipsSeen.includes('freeze') ? 'freeze' : null);
        if (tip && !this.skipStory()) this.showTip(tip);
        else this.afterIntro();
      }
    } else {
      // first Endless / Weekly run explains itself; the clock waits until the card is closed
      const id = this.mode === 'endless' ? 'unlock_endless' : 'unlock_weekly';
      this.paused = true;
      if (!showTutorial(this, this.layout, id, () => {
        this.paused = false;
        this.afterIntro();
      })) {
        this.paused = false;
        this.afterIntro();
      }
    }
  }

  /** One-time tip from Pebble: appears at the start of a level, fades after a few seconds or when the claw launches. */
  private showTip(id: string): void {
    const save = services.save;
    save.data.tipsSeen.push(id);
    save.save();
    const cx = DESIGN.width / 2;
    const cy = 640;
    this.paused = true; // the level does not run while the tip is open
    const g = this.add.container(0, 0).setDepth(D.flash + 10).setAlpha(0);
    const shade = dim(this, this.layout, 0.55);
    const text = txt(this, cx - 160, cy - 20, tipText(id), 30, { originX: 0, align: 'left', wrap: 400, strokeW: 4, shadow: false });
    const h = Math.max(300, text.height + 200);
    const bg = panel(this, cx, cy, 640, h);
    const face = this.add.image(cx - 245, cy - 20, 'char_pebble').setDisplaySize(120, 120);
    const ok = new Button(this, cx, cy + h / 2 - 70, {
      w: 300,
      label: t('gotIt'),
      fontSize: 42,
      tint: COLORS.green,
      key: 'ENTER',
      onClick: () => {
        this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
        this.paused = false;
        this.afterIntro();
      },
    });
    g.add([shade, bg, face, text, ok]);
    this.tweens.add({ targets: g, alpha: 1, duration: 220 });
  }

  /** Short banner plus a moment to look at the field before the clock starts. */
  private afterIntro(): void {
    if (this.mode === 'campaign' && isBoss(this.levelId)) {
      this.showBanner(t('boss'));
      this.introLock = 1.3;
    } else if (this.mode === 'endless') {
      this.showBanner(t('wave', { n: 1 }));
      this.introLock = 1.0;
    }
  }

  /** Debug / test switch: ?nostory=1 skips dialogue. */
  private skipStory(): boolean {
    return new URLSearchParams(location.search).get('nostory') === '1';
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
    const eq = services.save.data.cosmetics.equipped;
    const outfit = COSMETICS.find((c) => c.id === eq.outfit)?.texture ?? 'miner';
    this.miner = this.add
      .image(px + 158, WORLD.surfaceY + 4, outfit).setFlipX(true)
      .setOrigin(0.5, 1)
      .setDisplaySize(118, 150)
      .setDepth(D.rig + 1);
    if (this.session.helpers > 0) {
      this.add.image(px - 150, WORLD.surfaceY + 4, 'miner').setOrigin(0.5, 1).setDisplaySize(96, 122).setDepth(D.rig + 1).setTint(0xb8d8ff);
    }
    this.rope = this.add.tileSprite(px, py, 10, 4, 'rope').setOrigin(0.5, 0).setDepth(D.rope);
    this.drum = this.add.image(px, py, 'winch_drum').setDisplaySize(70, 70).setDepth(D.rope + 0.2);
    this.clawImg = this.add.image(px, py, 'claw_open').setOrigin(0.5, 0).setDisplaySize(90, 72).setDepth(D.claw);
    const skin = COSMETICS.find((c) => c.id === eq.clawSkin);
    const ropeSkin = COSMETICS.find((c) => c.id === eq.rope);
    this.clawImg.setTint(skin?.tint ?? CLAW_TYPES[services.save.data.claws.equipped].tint);
    if (ropeSkin?.tint) this.rope.setTint(ropeSkin.tint);
    this.tweens.add({ targets: this.miner, scaleY: this.miner.scaleY * 1.025, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  private createEntities(): void {
    let i = 0;
    for (const e of this.session.entities) {
      const def = OBJECTS[e.type];
      const a = IMAGES[def.texture as keyof typeof IMAGES];
      const s = this.add.image(e.x, e.y, def.texture).setDisplaySize(a.w, a.h).setDepth(D.entity + e.y / 10000);
      const base = s.scaleX;
      // while a dialogue is about to pause the scene the field must already be visible
      if (!this.storyPending) {
        s.setScale(0);
        this.tweens.add({ targets: s, scaleX: base, scaleY: base, duration: 260, delay: 80 + i * 22, ease: 'Back.Out' });
      }
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
    const icons: Array<[boolean, 'icon_turbo' | 'icon_lantern' | 'icon_gem' | 'icon_crusher' | 'icon_hourglass' | 'icon_goldrush' | 'icon_miner' | 'icon_magnet' | 'icon_defuse']> = [
      [mods.turbo, 'icon_turbo'],
      [mods.lantern, 'icon_lantern'],
      [mods.gemLens, 'icon_gem'],
      [mods.crusher, 'icon_crusher'],
      [mods.hourglass, 'icon_hourglass'],
      [mods.goldRush, 'icon_goldrush'],
      [mods.extraMiner, 'icon_miner'],
      [mods.magnet, 'icon_magnet'],
      [mods.defuser, 'icon_defuse'],
    ];
    let bx = E.left + 24 + 26;
    for (const [on, key] of icons) {
      if (!on) continue;
      this.boostIcons.push(this.add.image(bx, top + 300, key).setDisplaySize(52, 52).setDepth(D.hud + 1));
      bx += 58;
    }

    this.comboText = txt(this, E.right - 20, top + 178, '', 26, { originX: 1, color: COLORS.textGreen, strokeW: 5 }).setDepth(D.hud + 1).setVisible(false);
    this.bonusText = txt(this, E.left + 300, top + 98, '', 34, { originX: 0, color: COLORS.textGreen, strokeW: 6 }).setDepth(D.hud + 1).setVisible(false);
    this.missionText = txt(this, E.left + 24, top + 352, '', 26, { originX: 0, color: '#f4dba8', strokeW: 5 }).setDepth(D.hud + 1);
    this.freezeBtn = new Button(this, E.right - 70, top + 380, {
      round: true,
      icon: 'icon_freeze',
      tint: COLORS.blue,
      onClick: () => this.useFreeze(),
    }).setDepth(D.hud + 2).setName('freeze');
    this.freezeCount = txt(this, E.right - 70 + 34, top + 380 + 34, 'x0', 34, { strokeW: 6, color: COLORS.textGold }).setDepth(D.hud + 3);

    L.onChange(() => this.relayoutHud());
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
    this.missionText.setPosition(E.left + 24, top + 352);
    this.comboText.setPosition(E.right - 20, top + 178);
    this.freezeBtn.setPosition(E.right - 70, top + 380);
    this.freezeCount.setPosition(E.right - 70 + 34, top + 380 + 34);
    let bx = E.left + 24 + 26;
    for (const i of this.boostIcons) {
      i.setPosition(bx, top + 300);
      bx += 58;
    }
  }

  private refreshLabels(): void {
    if (this.mode === 'campaign') {
      this.levelText.setText(t('levelShort', { n: this.levelId }) + (isBoss(this.levelId) ? '  - ' + t('boss') : ''));
      this.targetText.setText(t('target', { n: money(this.level.target) }));
    } else if (this.mode === 'weekly') {
      this.levelText.setText(t('weeklyTitle'));
      this.targetText.setText(t('target', { n: money(this.level.target) }));
    } else {
      this.levelText.setText(t('endless').toUpperCase());
      this.targetText.setText(t('wave', { n: this.session.wave }));
    }
    this.lastTargetOk = !this.lastTargetOk; // force colour refresh
    this.lastMoneyTxt = '';
    this.lastMission = '';
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
    kb.on('keydown-F', () => this.useFreeze());
    kb.on('keydown-P', () => this.openPause());
    kb.on('keydown-ESC', () => this.openPause());
  }

  // ------------------------------------------------------------------ actions
  private tryLaunch(): void {
    if (this.paused || this.ending) return;
    if (this.session.launch()) {
      if (this.tip) {
        const tp = this.tip;
        this.tip = undefined;
        this.tweens.add({ targets: tp, alpha: 0, duration: 250, onComplete: () => tp.destroy() });
      }
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

  private useFreeze(): void {
    if (this.paused || this.ending) return;
    if (!this.session.useFreeze()) services.audio.sfx('deny', 0.6);
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
    this.scene.launch('Pause', { levelId: this.levelId, mode: this.mode });
  }

  // ------------------------------------------------------------------ loop
  update(time: number, delta: number): void {
    const dt = Math.min(delta, CLAW.maxDt * 1000) / 1000;
    this.backdrop.update(time, dt);
    if (this.introLock > 0) this.introLock -= dt;
    if (!this.ending && !this.paused && this.introLock <= 0) this.session.update(dt);
    this.handleEvents();
    this.syncWorld(time, dt);
    this.syncHud(dt);
    this.syncTwist();
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
      case 'megaBlast':
        this.onMegaBlast(ev.x, ev.y);
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
      case 'wave':
        this.onWave(ev.wave);
        break;
      case 'freeze': {
        audio.sfx('blast', 0.6, 0.6);
        const ice = this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, this.layout.width + 8, this.layout.height + 8, 0x9fe0ff, 0.22).setDepth(D.flash - 5);
        this.tweens.add({ targets: ice, alpha: { from: 0.3, to: 0 }, delay: ev.seconds * 1000 - 600, duration: 600, onComplete: () => ice.destroy() });
        this.showBanner(t('frozen'));
        break;
      }
      case 'end':
        this.onEnd(ev.won, ev.reason);
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
    if (ev.value < 0) {
      audio.sfx('deny');
      this.cameras.main.shake(180, 0.008);
      this.floats.show(this, px, py - 30, money(ev.value), COLORS.textRed, 56);
      return;
    }
    if (ev.bonus > 0) this.addBonus(ev.bonus);
    if (ev.kind === 'diamond' || ev.kind === 'chest') {
      this.cameras.main.flash(110, 255, 255, 255, true);
      this.cameras.main.shake(140, 0.004);
    } else if (ev.kind === 'goldL') this.cameras.main.shake(120, 0.004);
    if (ev.kind === 'diamond' || (ev.kind === 'beetle' && ev.value > 100)) audio.sfx('diamond');
    else if (ev.kind === 'chest') audio.sfx('bag');
    else if (ev.kind === 'rockS' || ev.kind === 'rockL') audio.sfx('rock');
    else audio.sfx('gold', 1, Math.min(1.5, 1 + 0.05 * ev.combo));
    if (ev.value > 0) this.floats.show(this, px, py - 30, '+' + money(ev.value), COLORS.textGold, ev.value >= 500 ? 64 : 52);
    audio.vibrate(ev.value >= 500 ? 35 : 15);
  }

  /** Extra money from the combo shows as a green "+N" next to the main money for a moment. */
  private addBonus(n: number): void {
    this.bonusSum += n;
    this.bonusText.setText('+' + this.bonusSum.toLocaleString()).setVisible(true).setAlpha(1);
    this.bonusText.setX(this.moneyText.x + this.moneyText.width + 14);
    this.tweens.add({ targets: this.bonusText, scale: { from: 1.3, to: 1 }, duration: 160 });
    this.bonusTimer?.remove();
    this.bonusTimer = this.time.delayedCall(1400, () => {
      this.tweens.add({ targets: this.bonusText, alpha: 0, duration: 300, onComplete: () => { this.bonusText.setVisible(false); this.bonusSum = 0; } });
    });
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

  /** Easter egg: Blast Cap on a carried keg. Chain of explosions over the whole mine. */
  private onMegaBlast(x: number, y: number): void {
    const audio = services.audio;
    this.onExplode(-1, x, y);
    audio.sfx('explosion', 1, 0.55);
    audio.vibrate(500);
    const cam = this.cameras.main;
    cam.shake(MEGA_BLAST.endDelayMs - 300, 0.03, true);
    cam.flash(600, 255, 236, 190, true);
    const glow = this.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, this.layout.width + 8, this.layout.height + 8, 0xff6a1a, 0).setDepth(D.flash - 1);
    this.tweens.add({ targets: glow, alpha: 0.45, duration: 500, yoyo: true, hold: 900 });
    for (let i = 1; i <= MEGA_BLAST.extraBursts; i++) {
      this.time.delayedCall(i * MEGA_BLAST.burstGapMs, () => {
        const bx = Phaser.Math.Between(WORLD.fieldMinX, WORLD.fieldMaxX);
        const by = Phaser.Math.Between(WORLD.fieldMinY, WORLD.fieldMaxY);
        audio.sfx(i % 2 ? 'blast' : 'explosion', 0.8, 0.7 + 0.1 * (i % 3));
        this.debris.explode(14, bx, by);
        this.sparks.explode(14, bx, by);
        this.smoke.explode(5, bx, by);
        const ring = this.add.circle(bx, by, 20, 0xffe07a, 0).setStrokeStyle(12, 0xff8a2a).setDepth(D.fx);
        this.tweens.add({ targets: ring, scale: 12, alpha: 0, duration: 520, ease: 'Quad.Out', onComplete: () => ring.destroy() });
      });
    }
    const b = txt(this, DESIGN.width / 2, 600, t('megaBlast'), 112, { color: COLORS.textRed, strokeW: 16 }).setDepth(D.float + 5).setScale(0.2).setAngle(-6);
    this.tweens.add({ targets: b, scale: 1, duration: 420, ease: 'Back.Out' });
    this.tweens.add({ targets: b, angle: 6, duration: 90, yoyo: true, repeat: 8, delay: 420 });
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

  private onWave(wave: number): void {
    for (const spr of this.sprites.values()) spr.destroy();
    this.sprites.clear();
    this.createEntities();
    this.showBanner(t('wave', { n: wave }));
    services.audio.sfx('win', 0.5);
    this.targetText.setText(t('wave', { n: wave }));
  }

  private onEnd(won: boolean, reason?: 'megaBlast'): void {
    if (this.ending) return;
    this.ending = true;
    const audio = services.audio;
    audio.loop('reel', false);
    this.reelOn = false;
    const s = this.session;
    this.time.delayedCall(reason === 'megaBlast' ? MEGA_BLAST.endDelayMs : won ? 700 : 900, () => {
      const save = services.save;
      const data = save.data;
      const run = s.stats;
      const missionOk = !!this.mission && missionDone(this.mission, { ...run, slimes: run.slimes, beetles: run.beetles });
      mergeStats(data, run, s.earned);

      if (this.mode === 'endless') {
        const res = commitEndless(data, s.earned, s.wave);
        const fresh = checkAchievements(data).map((a) => a.id);
        save.save();
        goTo(this, 'Results', { kind: 'endless', score: s.earned, waves: s.wave, newBest: res.newBest, walletGain: res.walletGain, best: data.endless.best, bestWaves: data.endless.bestWaves, unlocked: fresh });
        return;
      }
      if (this.mode === 'weekly') {
        const res = commitWeekly(data, this.weekKey, s.earned, this.level.target);
        const fresh = checkAchievements(data).map((a) => a.id);
        save.save();
        goTo(this, 'Results', { kind: 'weekly', score: s.earned, target: this.level.target, won: res.won, newBest: res.newBest, reward: res.reward, best: data.weekly.best, unlocked: fresh });
        return;
      }
      const bossBonus = won && isBoss(this.levelId) ? 1500 * worldOf(this.levelId) : 0;
      const outcome = {
        levelId: this.levelId,
        earned: s.earned,
        target: this.level.target,
        won,
        blastCapsLeft: s.blastCaps,
        freezeLeft: s.freezeCount,
        missionDone: missionOk,
        missionReward: this.mission?.reward ?? 0,
        extraBonus: bossBonus,
      };
      const result = commitOutcome(data, outcome);
      const fresh = checkAchievements(data).map((a) => a.id);
      save.save();
      if (won && result) goTo(this, 'LevelComplete', { ...outcome, ...result, unlocked: fresh, mission: this.mission, missionOk });
      else goTo(this, 'GameOver', { ...outcome, unlocked: fresh, mission: this.mission, missionOk: false, kaboom: reason === 'megaBlast' });
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

  /** Boss twists: warn when the rush starts, darken the field during blackouts. */
  private syncTwist(): void {
    if (this.twist.rush) {
      const r = this.session.rushing;
      if (r && !this.wasRushing) {
        this.showBanner(t('rush'));
        this.cameras.main.shake(200, 0.006);
      }
      this.wasRushing = r;
    }
    if (this.twist.blackout) {
      const c = this.session.elapsed % TWIST.blackoutCycle;
      const into = c - TWIST.blackoutStart;
      const a = into < 0 || into > TWIST.blackoutSec ? 0 : Math.min(0.82, Math.sin((into / TWIST.blackoutSec) * Math.PI) * 1.2);
      this.dark.setAlpha(a);
    }
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
    // combo meter
    if (s.combo !== this.lastCombo) {
      this.lastCombo = s.combo;
      if (s.combo >= 2) {
        const m = Math.min(COMBO.max, 1 + COMBO.step * (s.combo - 1));
        this.comboText.setText(t('combo', { m: m.toFixed(1) })).setVisible(true);
        this.tweens.add({ targets: this.comboText, scale: { from: 1.25, to: 1 }, duration: 200, ease: 'Back.Out' });
      } else this.comboText.setVisible(false);
    }
    // mission line
    if (this.mission) {
      const m = this.mission;
      const st = s.stats;
      const done = !missionIsRestriction(m) && missionDone(m, st);
      const failed = missionIsRestriction(m) && !missionDone(m, st);
      const prog = missionIsRestriction(m) ? '' : ` ${Math.min(missionProgress(m, st), missionGoal(m))}/${missionGoal(m)}`;
      const line = t('missionLabel', { text: missionText(m.kind, m.goal) }) + prog + (done ? '  OK' : failed ? '  X' : '');
      if (line !== this.lastMission) {
        this.lastMission = line;
        this.missionText.setText(line).setColor(done ? COLORS.textGreen : failed ? COLORS.textRed : '#f4dba8');
        if (done && !this.missionShown) {
          this.missionShown = true;
          this.missionDoneAt = this.session.elapsed;
          this.floats.show(this, DESIGN.width / 2, 520, t('missionDone', { n: m.reward }), COLORS.textGreen, 40);
        }
      }
    } else if (this.missionText.text !== '') this.missionText.setText('');
    // a finished mission disappears 2 s after it was reached
    if (this.missionDoneAt >= 0 && s.elapsed - this.missionDoneAt > 2 && this.missionText.visible) this.missionText.setVisible(false);
    if (this.mode === 'endless' && s.wave !== this.lastWave) this.lastWave = s.wave;
    // freeze button
    if (s.freezeCount !== this.lastFreeze) {
      this.lastFreeze = s.freezeCount;
      this.freezeCount.setText('x' + s.freezeCount);
      this.freezeBtn.setVisible(s.freezeCount > 0).setActive(s.freezeCount > 0);
      this.freezeCount.setVisible(s.freezeCount > 0);
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
