/** Texts of the magnet prototype (kept apart from the Deep Claw string tables). */
import { getLang } from './index';

const tr = {
  menuButton: 'Magnet Test',
  levelName: 'Kanal Testi',
  target: 'Hedef: {n}',
  load: 'Yük {a}/{b}',
  panelTitle: 'Mıknatıs Ayarları',
  radius: 'Çekim yarıçapı',
  strength: 'Çekim gücü',
  capacity: 'Kapasite',
  descent: 'İniş hızı',
  modeFirst: 'Davranış: İlk yapışmada dur',
  modeSweep: 'Davranış: Süpürme',
  ringOn: 'Halka: Açık',
  ringOff: 'Halka: Kapalı',
  reset: 'Varsayılana dön',
  close: 'Kapat',
  menu: 'Menü',
  timeUp: 'SÜRE DOLDU',
  full: 'DOLU',
  stuck: 'SIĞMADI',
  boom: 'BOOM',
  won: 'Hedef tamam!',
  lost: 'Hedef olmadı',
  result: 'Kazanç {a} / {b}',
  retry: 'Tekrar',
};
export type MagnetText = typeof tr;
const en: MagnetText = {
  menuButton: 'Magnet Test',
  levelName: 'Canal Test',
  target: 'Target: {n}',
  load: 'Load {a}/{b}',
  panelTitle: 'Magnet Settings',
  radius: 'Pull radius',
  strength: 'Pull strength',
  capacity: 'Capacity',
  descent: 'Dive speed',
  modeFirst: 'Mode: Stop on first stick',
  modeSweep: 'Mode: Sweep',
  ringOn: 'Ring: On',
  ringOff: 'Ring: Off',
  reset: 'Reset to defaults',
  close: 'Close',
  menu: 'Menu',
  timeUp: "TIME'S UP",
  full: 'FULL',
  stuck: 'TOO HEAVY',
  boom: 'BOOM',
  won: 'Target reached!',
  lost: 'Target missed',
  result: 'Earned {a} / {b}',
  retry: 'Retry',
};

export function mt(key: keyof MagnetText, params?: Record<string, string | number>): string {
  let s = (getLang() === 'tr' ? tr : en)[key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}
