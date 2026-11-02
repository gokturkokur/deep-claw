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
  mg_tire: svg(104, 104,
    shadow(104, 104, 40) +
    `<circle cx="52" cy="50" r="44" fill="#2e2a28" ${st}/><circle cx="52" cy="50" r="19" fill="#6b655f" ${st}/>` +
    `<path d="M52 10 V20 M52 80 V90 M12 50 H22 M82 50 H92 M24 22 l7 7 M73 71 l7 7 M80 22 l-7 7 M31 71 l-7 7" stroke="#5a5450" stroke-width="5" stroke-linecap="round"/>`),
  mg_boot: svg(96, 88,
    shadow(96, 88, 38) +
    `<path d="M22 8 H50 L52 46 Q80 48 88 62 V76 H12 V8 Z" fill="#6a4a2c" ${st}/><rect x="12" y="66" width="76" height="12" fill="#2e2a28" ${st}/>` +
    `<path d="M22 8 H50 V18 H22 Z" fill="#8a6540" ${st}/><path d="M30 28 H46 M30 38 H46" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>`),
  mg_stone: svg(100, 84,
    shadow(100, 84, 40) +
    `<polygon points="10,62 16,34 38,14 66,10 88,28 92,56 76,72 28,74" fill="#8a8f93" ${st}/>` +
    `<polygon points="30,26 50,20 66,22 52,40 34,44" fill="#b2b7ba" opacity=".7"/><path d="M60 46 l10 14 M34 56 l-6 -8" stroke="#6a6f73" stroke-width="3.5" stroke-linecap="round"/>`),
};

for (const [name, body] of Object.entries(files)) writeFileSync(OUT + name + '.svg', body);
console.log('wrote', Object.keys(files).length, 'magnet placeholder SVGs');
