import Phaser from 'phaser';
import { DESIGN } from '../config/game';
import { tutorialById } from '../data/tutorials';
import { getLang, t } from '../i18n';
import { services } from '../services';
import { Button, dim, panel } from './components';
import { COLORS, txt, type Layout } from './theme';

/** Tutorials can be switched off for automated tests with ?notut=1. */
export function tutorialsEnabled(): boolean {
  try {
    return new URLSearchParams(location.search).get('notut') !== '1';
  } catch {
    return true;
  }
}

export function tutorialSeen(id: string): boolean {
  return services.save.data.tipsSeen.includes('tut_' + id);
}

/** Shows a tutorial card once. Returns false when it was already seen (or disabled). */
export function showTutorial(scene: Phaser.Scene, layout: Layout, id: string, onClose?: () => void): boolean {
  const tut = tutorialById(id);
  if (!tut || !tutorialsEnabled() || tutorialSeen(id)) return false;
  const save = services.save;
  save.data.tipsSeen.push('tut_' + id);
  save.save();
  const lang = getLang() === 'tr' ? tut.tr : tut.en;
  const cx = DESIGN.width / 2;
  const cy = DESIGN.height / 2;
  const g = scene.add.container(0, 0).setDepth(900).setAlpha(0);
  const shade = dim(scene, layout, 0.72);
  const body = txt(scene, cx, cy + 20, lang.text, 30, { wrap: 500, strokeW: 4, shadow: false });
  const h = Math.max(560, body.height + 480);
  const p = panel(scene, cx, cy, 620, h);
  const icon = scene.add.image(cx, cy - h / 2 + 110, tut.icon).setDisplaySize(120, 120);
  const title = txt(scene, cx, cy - h / 2 + 215, lang.title, 42, { color: COLORS.textGold, strokeW: 7, wrap: 540 });
  body.setY(cy - h / 2 + 215 + 50 + body.height / 2 + 14);
  const close = () => {
    scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        g.destroy();
        onClose?.();
      },
    });
  };
  const ok = new Button(scene, cx, cy + h / 2 - 76, { w: 320, label: t('gotIt'), fontSize: 44, tint: COLORS.green, key: 'ENTER', onClick: close });
  g.add([shade, p, icon, title, body, ok]);
  scene.tweens.add({ targets: g, alpha: 1, duration: 220 });
  scene.tweens.add({ targets: icon, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  return true;
}

/** Forget all tutorial cards and tips so they show again. */
export function resetTutorials(): void {
  const save = services.save;
  save.data.tipsSeen = [];
  save.save();
}
