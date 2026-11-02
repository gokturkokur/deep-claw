import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { MAGNET_SETTINGS as S } from '../config/magnet';
import { mt } from '../i18n/magnet';
import { clampSetting, resetSettings, saveSettings, type MagnetSettings, type NumericSetting } from '../systems/MagnetSettings';
import type { KeyValueStore } from '../systems/Save';
import { Button, Slider, panel } from './components';
import { COLORS, txt, type Layout } from './theme';

const PANEL = { w: 690, h: 690, margin: 10, rowTop: 110, rowGap: 84, depth: 100 } as const;

const SLIDERS: ReadonlyArray<{ key: NumericSetting; label: 'radius' | 'strength' | 'capacity' | 'descent'; unit: string }> = [
  { key: 'pullRadius', label: 'radius', unit: '' },
  { key: 'pullStrength', label: 'strength', unit: '' },
  { key: 'capacity', label: 'capacity', unit: '' },
  { key: 'descentSpeed', label: 'descent', unit: '' },
];

/**
 * Bottom sheet with live sliders. The game keeps running behind it (semi-transparent),
 * so changes can be felt at once. Edits the shared settings object in place.
 */
export class MagnetPanel {
  readonly container: Phaser.GameObjects.Container;
  isOpen = false;
  private readonly sliders = new Map<NumericSetting, Slider>();
  private readonly values = new Map<NumericSetting, Phaser.GameObjects.Text>();
  private modeBtn!: Button;
  private ringBtn!: Button;

  constructor(
    scene: Phaser.Scene,
    private readonly layout: Layout,
    private readonly settings: MagnetSettings,
    private readonly store: KeyValueStore,
    private readonly onToggle: (open: boolean) => void,
    onMenu: () => void,
  ) {
    const c = scene.add.container(DESIGN.width / 2, 0).setDepth(PANEL.depth).setVisible(false);
    this.container = c;
    const H = PANEL.h;
    const bg = panel(scene, 0, 0, PANEL.w, H).setAlpha(0.88).setInteractive(); // swallows taps: they must not launch the magnet
    c.add(bg);
    c.add(txt(scene, 0, -H / 2 + 46, mt('panelTitle'), 44, { color: COLORS.textGold, strokeW: 7 }));

    SLIDERS.forEach((row, i) => {
      const y = -H / 2 + PANEL.rowTop + i * PANEL.rowGap;
      c.add(txt(scene, -318, y, mt(row.label), 30, { originX: 0, strokeW: 5 }));
      const v = txt(scene, 322, y, '', 32, { originX: 1, color: COLORS.textGold, strokeW: 5 });
      this.values.set(row.key, v);
      const r = S[row.key];
      const sl = new Slider(
        scene,
        40,
        y,
        290,
        (settings[row.key] - r.min) / (r.max - r.min),
        (n) => {
          settings[row.key] = clampSetting(row.key, r.min + n * (r.max - r.min));
          this.refreshValues();
        },
        () => saveSettings(settings, store),
        76,
      );
      this.sliders.set(row.key, sl);
      c.add([v, sl]);
    });

    const yMode = -H / 2 + PANEL.rowTop + 4 * PANEL.rowGap - 6;
    this.modeBtn = new Button(scene, -170, yMode, {
      w: 330,
      h: 104,
      label: '-', // real text is set in refreshValues(); a button needs a non-empty label to get a text object
      fontSize: 28,
      tint: COLORS.blue,
      onClick: () => {
        settings.mode = settings.mode === 'sweep' ? 'firstStick' : 'sweep';
        saveSettings(settings, store);
        this.refreshValues();
      },
    }).setName('mode');
    this.ringBtn = new Button(scene, 175, yMode, {
      w: 330,
      h: 104,
      label: '-',
      fontSize: 32,
      tint: COLORS.green,
      onClick: () => {
        settings.showRing = !settings.showRing;
        saveSettings(settings, store);
        this.refreshValues();
      },
    }).setName('ring');
    const yFoot = yMode + 118;
    const reset = new Button(scene, -215, yFoot, {
      w: 250,
      label: mt('reset'),
      fontSize: 30,
      tint: COLORS.red,
      onClick: () => {
        resetSettings(settings, store);
        this.refreshValues();
      },
    }).setName('reset');
    const close = new Button(scene, 0, yFoot, { w: 190, label: mt('close'), fontSize: 34, tint: COLORS.gold, onClick: () => this.close() }).setName('close');
    const menu = new Button(scene, 215, yFoot, { w: 220, label: mt('menu'), fontSize: 34, tint: COLORS.brown, onClick: onMenu }).setName('menu');
    c.add([this.modeBtn, this.ringBtn, reset, close, menu]);

    this.refreshValues();
    this.place();
    layout.onChange(() => this.place());
  }

  private place(): void {
    this.container.y = this.layout.bottom - PANEL.h / 2 - PANEL.margin;
  }

  /** Redraws every label and knob from the settings object (also after Reset). */
  refreshValues(): void {
    const s = this.settings;
    for (const row of SLIDERS) {
      const r = S[row.key];
      const v = s[row.key];
      this.values.get(row.key)?.setText(Number.isInteger(v) ? String(v) : v.toFixed(1));
      this.sliders.get(row.key)?.setValue((v - r.min) / (r.max - r.min));
    }
    this.modeBtn.setLabel(s.mode === 'sweep' ? mt('modeSweep') : mt('modeFirst'));
    this.ringBtn.setLabel(s.showRing ? mt('ringOn') : mt('ringOff'));
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.refreshValues();
    this.container.setVisible(true);
    this.onToggle(true);
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.setVisible(false);
    saveSettings(this.settings, this.store);
    this.onToggle(false);
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }
}
