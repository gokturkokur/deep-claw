/** Live-tunable magnet settings, remembered in localStorage (separate from the Deep Claw save). */
import { MAGNET_SETTINGS as S, type MagnetMode } from '../config/magnet';
import { MemoryStore, type KeyValueStore } from './Save';

export interface MagnetSettings {
  pullRadius: number;
  pullStrength: number;
  capacity: number;
  descentSpeed: number;
  mode: MagnetMode;
  showRing: boolean;
}

export type NumericSetting = 'pullRadius' | 'pullStrength' | 'capacity' | 'descentSpeed';
export const NUMERIC_SETTINGS: readonly NumericSetting[] = ['pullRadius', 'pullStrength', 'capacity', 'descentSpeed'];

export function defaultSettings(): MagnetSettings {
  return {
    pullRadius: S.pullRadius.def,
    pullStrength: S.pullStrength.def,
    capacity: S.capacity.def,
    descentSpeed: S.descentSpeed.def,
    mode: S.mode.def,
    showRing: S.showRing.def,
  };
}

/** Clamp to range and snap to the step. */
export function clampSetting(key: NumericSetting, v: number): number {
  const r = S[key];
  const snapped = Math.round((v - r.min) / r.step) * r.step + r.min;
  return Math.min(r.max, Math.max(r.min, Number(snapped.toFixed(4))));
}

/** Turns anything (a corrupted string, an old version, missing fields) into valid settings. */
export function sanitizeSettings(raw: unknown): MagnetSettings {
  const out = defaultSettings();
  if (!raw || typeof raw !== 'object') return out;
  const o = raw as Record<string, unknown>;
  for (const k of NUMERIC_SETTINGS) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = clampSetting(k, v);
  }
  if (o.mode === 'firstStick' || o.mode === 'sweep') out.mode = o.mode;
  if (typeof o.showRing === 'boolean') out.showRing = o.showRing;
  return out;
}

export function loadSettings(store: KeyValueStore = new MemoryStore()): MagnetSettings {
  try {
    const txt = store.getItem(S.storageKey);
    return sanitizeSettings(txt ? JSON.parse(txt) : null);
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: MagnetSettings, store: KeyValueStore): void {
  try {
    store.setItem(S.storageKey, JSON.stringify(s));
  } catch {
    /* storage full or blocked: settings just won't be remembered */
  }
}

/** Reset to defaults (also forgets the stored values). Mutates and returns the same object. */
export function resetSettings(s: MagnetSettings, store: KeyValueStore): MagnetSettings {
  Object.assign(s, defaultSettings());
  saveSettings(s, store);
  return s;
}
