// Placeholder SVG art for the magnet prototype. Run: npm run assets:magnet-art
// Simple flat shapes on purpose: replace with real art later (same file names / sizes, see docs/MAGNET_PROTOTYPE.md).
import { writeFileSync } from 'node:fs';

const OUT = 'public/assets/images/';
const INK = '#2b1608';
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;
const shadow = (w, h, rx) => `<ellipse cx="${w / 2}" cy="${h - 5}" rx="${rx}" ry="4" fill="#000" opacity=".25"/>`;
const st = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

const files = {
  // horseshoe magnet, poles pointing down. The collision point is the bottom of the poles.
  mg_magnet: svg(88, 72,
    `<path d="M20 66 V34 a24 24 0 0 1 48 0 V66" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="butt"/>` +
    `<path d="M20 66 V34 a24 24 0 0 1 48 0 V66" fill="none" stroke="#d8392b" stroke-width="18" stroke-linecap="butt"/>` +
    `<path d="M20 50 V68 M68 50 V68" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="butt"/>` +
    `<path d="M20 50 V68 M68 50 V68" fill="none" stroke="#c9d1d8" stroke-width="18" stroke-linecap="butt"/>` +
    `<path d="M14 30 a30 30 0 0 1 20 -16" fill="none" stroke="#fff" stroke-width="4" opacity=".4" stroke-linecap="round"/>`),
  mg_coins: svg(72, 56,
    shadow(72, 56, 26) +
    `<ellipse cx="26" cy="38" rx="20" ry="9" fill="#b9bfc6" ${st}/><ellipse cx="46" cy="34" rx="20" ry="9" fill="#d3d8dd" ${st}/>` +
    `<ellipse cx="34" cy="24" rx="20" ry="9" fill="#e6c14a" ${st}/><ellipse cx="34" cy="21" rx="9" ry="3.5" fill="#fff3a8" opacity=".7"/>`),
  mg_keys: svg(76, 64,
    shadow(76, 64, 26) +
    `<circle cx="20" cy="22" r="12" fill="none" ${st}/><circle cx="20" cy="22" r="12" fill="none" stroke="#c9d1d8" stroke-width="5"/>` +
    `<path d="M26 30 L60 54 M52 48 v8 M44 42 v8" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M26 30 L60 54 M52 48 v8 M44 42 v8" fill="none" stroke="#dfe4e8" stroke-width="5" stroke-linecap="round"/>` +
    `<circle cx="48" cy="20" r="10" fill="none" ${st}/><circle cx="48" cy="20" r="10" fill="none" stroke="#e6c14a" stroke-width="5"/>`),
  mg_knife: svg(84, 48,
    shadow(84, 48, 28) +
    `<path d="M8 22 L52 14 Q66 18 60 26 L8 30 Z" fill="#dfe4e8" ${st}/>` +
    `<rect x="54" y="14" width="22" height="14" rx="5" fill="#7a4a24" ${st}/>` +
    `<path d="M14 24 L48 18" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>`),
  mg_bike: svg(150, 96,
    shadow(150, 96, 56) +
    `<circle cx="34" cy="62" r="24" fill="none" stroke="${INK}" stroke-width="9"/><circle cx="34" cy="62" r="24" fill="none" stroke="#a0643a" stroke-width="4"/>` +
    `<circle cx="116" cy="62" r="24" fill="none" stroke="${INK}" stroke-width="9"/><circle cx="116" cy="62" r="24" fill="none" stroke="#a0643a" stroke-width="4"/>` +
    `<path d="M34 62 L58 30 L96 30 L116 62 M58 30 L72 62 L34 62 M72 62 L96 30 M52 22 H66 M94 24 L100 12 H112" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M34 62 L58 30 L96 30 L116 62 M58 30 L72 62 L34 62 M72 62 L96 30 M52 22 H66 M94 24 L100 12 H112" fill="none" stroke="#b5532e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`),
  mg_cart: svg(110, 100,
    shadow(110, 100, 42) +
    `<path d="M8 14 H26 L36 62 H92 L102 26 H30" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M8 14 H26 L36 62 H92 L102 26 H30" fill="none" stroke="#b9bfc6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M44 30 V58 M58 30 V60 M72 30 V60 M86 30 V60 M34 42 H98" stroke="#8d949b" stroke-width="3.5"/>` +
    `<circle cx="44" cy="80" r="9" fill="#5b5f66" ${st}/><circle cx="86" cy="80" r="9" fill="#5b5f66" ${st}/>`),
  mg_safe: svg(96, 96,
    shadow(96, 96, 36) +
    `<rect x="10" y="8" width="76" height="78" rx="8" fill="#5f666e" ${st}/><rect x="20" y="18" width="56" height="58" rx="5" fill="#7d858e" ${st}/>` +
    `<circle cx="48" cy="47" r="14" fill="#c9d1d8" ${st}/><path d="M48 36 V58 M37 47 H59" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
    `<rect x="16" y="84" width="12" height="8" fill="${INK}"/><rect x="68" y="84" width="12" height="8" fill="${INK}"/>`),
  mg_grenade: svg(56, 72,
    shadow(56, 72, 20) +
    `<ellipse cx="28" cy="44" rx="20" ry="24" fill="#5d6b3a" ${st}/><path d="M12 40 H44 M12 50 H44 M28 22 V66" stroke="${INK}" stroke-width="3" opacity=".6"/>` +
    `<rect x="20" y="12" width="16" height="12" rx="3" fill="#9aa1a8" ${st}/><path d="M36 14 q10 -2 10 8" fill="none" stroke="#c9d1d8" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="46" cy="24" r="5" fill="none" stroke="#c9d1d8" stroke-width="3"/>`),
  // Heavy cheap scrap: rust browns and dull iron, so it reads as junk next to the bright valuables.
  mg_pipe: svg(128, 44,
    shadow(128, 44, 54) +
    `<rect x="14" y="9" width="102" height="24" rx="3" fill="#77716b" ${st}/>` +
    `<rect x="108" y="5" width="14" height="32" rx="3" fill="#5f5a55" ${st}/>` +
    `<path d="M30 25 q8 -6 18 -1 q6 4 12 0 M74 15 q10 6 22 0" stroke="#a5582a" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<path d="M22 14 H102" stroke="#b9b3ad" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
    `<ellipse cx="14" cy="21" rx="8" ry="13" fill="#77716b" ${st}/><ellipse cx="14" cy="21" rx="4" ry="8" fill="${INK}"/>`),
  mg_manhole: svg(96, 96,
    shadow(96, 96, 38) +
    `<circle cx="48" cy="46" r="40" fill="#4c4f52" ${st}/><circle cx="48" cy="46" r="30" fill="none" stroke="#6c7074" stroke-width="5"/>` +
    `<path d="M26 34 H70 M22 46 H74 M26 58 H70" stroke="#2e3133" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M20 22 a34 34 0 0 1 20 -12" fill="none" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>` +
    `<circle cx="66" cy="70" r="6" fill="#8a4a22" opacity=".8"/><circle cx="30" cy="68" r="4" fill="#8a4a22" opacity=".7"/>`),
  mg_chain: svg(88, 84,
    shadow(88, 84, 36) +
    [[22, 58, 0], [44, 64, 90], [66, 56, 0], [32, 40, 90], [56, 38, 0], [44, 20, 90]]
      .map(([x, y, r]) => `<rect x="${x - 13}" y="${y - 8}" width="26" height="16" rx="8" fill="none" stroke="${INK}" stroke-width="9" transform="rotate(${r} ${x} ${y})"/>` +
        `<rect x="${x - 13}" y="${y - 8}" width="26" height="16" rx="8" fill="none" stroke="#a5582a" stroke-width="4.5" transform="rotate(${r} ${x} ${y})"/>`)
      .join('')),
  mg_engine: svg(112, 92,
    shadow(112, 92, 46) +
    `<rect x="12" y="28" width="88" height="52" rx="6" fill="#55504a" ${st}/>` +
    `<rect x="20" y="10" width="72" height="22" rx="4" fill="#6b625a" ${st}/>` +
    `<path d="M32 10 V32 M50 10 V32 M68 10 V32" stroke="${INK}" stroke-width="3.5"/>` +
    `<rect x="4" y="40" width="10" height="26" rx="2" fill="#3b3733" ${st}/><rect x="98" y="40" width="10" height="26" rx="2" fill="#3b3733" ${st}/>` +
    `<circle cx="38" cy="56" r="9" fill="#3b3733" ${st}/><circle cx="74" cy="56" r="9" fill="#3b3733" ${st}/>` +
    `<path d="M16 76 q20 -10 34 0 M64 34 q14 4 30 -2" stroke="#9a5a2e" stroke-width="6" stroke-linecap="round" fill="none" opacity=".85"/>`),
};

for (const [name, body] of Object.entries(files)) writeFileSync(OUT + name + '.svg', body);
console.log('wrote', Object.keys(files).length, 'magnet placeholder SVGs');
