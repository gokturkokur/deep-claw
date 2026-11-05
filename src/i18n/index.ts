import { en, type Strings } from './en';
import { tr } from './tr';
import type { Lang } from '../systems/Save';

const TABLES: Record<Lang, Strings> = { en, tr };
let current: Lang = 'en';

export function detectLang(): Lang {
  try {
    const l = (navigator.language || 'en').toLowerCase();
    return l.startsWith('tr') ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

export function setLang(l: Lang): void {
  current = l;
  try {
    document.documentElement.lang = l;
  } catch {
    /* ignore */
  }
}

export function getLang(): Lang {
  return current;
}

type Key = { [K in keyof Strings]: Strings[K] extends string ? K : never }[keyof Strings];

/** Look up a UI string; `{n}` style placeholders are replaced from `params`. */
export function t(key: Key, params?: Record<string, string | number>): string {
  let s = TABLES[current][key] as string;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function itemText(id: keyof Strings['items']): { name: string; desc: string } {
  return TABLES[current].items[id];
}

export function upgradeText(id: keyof Strings['upgrades']): { name: string; desc: string } {
  return TABLES[current].upgrades[id];
}
export function clawText(id: keyof Strings['claws']): { name: string; desc: string } {
  return TABLES[current].claws[id];
}
export function cosmeticName(id: string): string {
  return (TABLES[current].cosmetics as Record<string, string>)[id] ?? id;
}
export function achText(id: string): { name: string; desc: string; hint?: string } {
  return (TABLES[current].ach as Record<string, { name: string; desc: string; hint?: string }>)[id] ?? { name: id, desc: '' };
}
export function missionText(kind: string, n = 0): string {
  return (TABLES[current].missions as Record<string, string>)[kind].replace('{n}', String(n));
}
export function worldName(world: number): string {
  return TABLES[current].worlds[(world - 1) % TABLES[current].worlds.length];
}

/** Format money with thousands separators using the active language. */
export function money(n: number): string {
  return '$' + Math.round(n).toLocaleString(current === 'tr' ? 'tr-TR' : 'en-US');
}

export function tipText(id: string): string {
  return (TABLES[current].tips as Record<string, string>)[id] ?? '';
}

export function rankName(i: number): string {
  const r = TABLES[current].ranks;
  return r[Math.min(i, r.length - 1)];
}

export function quips(): readonly string[] {
  return TABLES[current].quips;
}

export function helperText(): { name: string; desc: string } {
  return TABLES[current].helper;
}
