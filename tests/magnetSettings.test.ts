import { describe, expect, it } from 'vitest';
import { MAGNET_SETTINGS } from '../src/config/magnet';
import { MemoryStore } from '../src/systems/Save';
import { clampSetting, defaultSettings, loadSettings, resetSettings, sanitizeSettings, saveSettings } from '../src/systems/MagnetSettings';

describe('magnet settings', () => {
  it('start at the suggested defaults', () => {
    const d = defaultSettings();
    expect(d.pullRadius).toBe(MAGNET_SETTINGS.pullRadius.def);
    expect(d.mode).toBe(MAGNET_SETTINGS.mode.def);
    expect(loadSettings(new MemoryStore())).toEqual(d);
  });

  it('are remembered between sessions', () => {
    const store = new MemoryStore();
    const s = defaultSettings();
    s.pullRadius = 150;
    s.capacity = 12.5;
    s.mode = 'firstStick';
    s.showRing = false;
    saveSettings(s, store);
    expect(loadSettings(store)).toEqual(s);
  });

  it('reset brings back the defaults and forgets the stored values', () => {
    const store = new MemoryStore();
    const s = defaultSettings();
    s.pullStrength = 1500;
    saveSettings(s, store);
    resetSettings(s, store);
    expect(s).toEqual(defaultSettings());
    expect(loadSettings(store)).toEqual(defaultSettings());
  });

  it('survive garbage: bad json, wrong types, out of range, missing fields', () => {
    const store = new MemoryStore();
    store.setItem(MAGNET_SETTINGS.storageKey, '{not json');
    expect(loadSettings(store)).toEqual(defaultSettings());
    const s = sanitizeSettings({ pullRadius: 99999, pullStrength: 'x', capacity: -3, mode: 'zzz', showRing: 'yes', descentSpeed: 777 });
    expect(s.pullRadius).toBe(MAGNET_SETTINGS.pullRadius.max);
    expect(s.pullStrength).toBe(MAGNET_SETTINGS.pullStrength.def);
    expect(s.capacity).toBe(MAGNET_SETTINGS.capacity.min);
    expect(s.mode).toBe(MAGNET_SETTINGS.mode.def);
    expect(s.showRing).toBe(MAGNET_SETTINGS.showRing.def);
    expect(s.descentSpeed).toBe(775);
    expect(sanitizeSettings(null)).toEqual(defaultSettings());
  });

  it('ignore values remembered under the old storage key (the old, much bigger radius)', () => {
    const store = new MemoryStore();
    store.setItem('deepclaw.magnet.settings', JSON.stringify({ ...defaultSettings(), pullRadius: 420 }));
    expect(MAGNET_SETTINGS.storageKey).not.toBe('deepclaw.magnet.settings');
    expect(loadSettings(store).pullRadius).toBe(MAGNET_SETTINGS.pullRadius.def);
  });

  it('snap to the slider step', () => {
    expect(clampSetting('capacity', 7.3)).toBe(7.5);
    expect(clampSetting('pullRadius', 123)).toBe(120);
  });
});
