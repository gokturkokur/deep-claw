// One-time generator for the initial placeholder art (original SVG drawings).
// The files in public/assets/images/ are the source of truth: replace any of them with your own
// art (same file name and size) and the game picks it up. See docs/ASSETS.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'images');
mkdirSync(OUT_DIR, { recursive: true });

const INK = '#2b1608';
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>\n`;
const lg = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map((s, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${s}"/>`).join('')}</linearGradient>`;
const rg = (id, stops, cx = 0.4, cy = 0.35, r = 0.75) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map((s, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${s}"/>`).join('')}</radialGradient>`;
const put = (name, content) => writeFileSync(join(OUT_DIR, name), content);

// deterministic pseudo random
const rnd = (seed) => {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
};
const blob = (cx, cy, rx, ry, n, seed, jit = 0.18) => {
  const r = rnd(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - jit + r() * jit * 2;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)},${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return pts.join(' ');
};
const stroke = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const iconBase = (inner, defs = '') => svg(64, 64, inner, defs);

// ---------------------------------------------------------------- treasure
function nugget(name, w, h, seed, facets) {
  const cx = w / 2, cy = h / 2 + 2, rx = w / 2 - 6, ry = h / 2 - 7;
  let f = '';
  const r = rnd(seed + 7);
  for (let i = 0; i < facets; i++) {
    const x1 = cx + (r() - 0.5) * rx * 1.2, y1 = cy + (r() - 0.5) * ry * 1.1;
    f += `<path d="M${x1.toFixed(0)} ${y1.toFixed(0)} l${((r() - 0.3) * rx * 0.5).toFixed(0)} ${(r() * ry * 0.4 + 6).toFixed(0)}" stroke="#a86a08" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  put(
    name,
    svg(
      w,
      h,
      `<ellipse cx="${cx}" cy="${h - 7}" rx="${rx * 0.9}" ry="5" fill="#000" opacity=".25"/>
<polygon points="${blob(cx, cy, rx, ry, 11, seed)}" fill="url(#g)" ${stroke(4)}/>
<polygon points="${blob(cx - rx * 0.12, cy - ry * 0.18, rx * 0.62, ry * 0.5, 9, seed + 3, 0.12)}" fill="#fff3a8" opacity=".55"/>
${f}
<ellipse cx="${cx - rx * 0.42}" cy="${cy - ry * 0.42}" rx="${rx * 0.16}" ry="${ry * 0.1}" fill="#fff" opacity=".9" transform="rotate(-30 ${cx - rx * 0.42} ${cy - ry * 0.42})"/>`,
      lg('g', ['#ffe97a', '#f6bf1f', '#c47d08'], 0.2, 0, 0.8, 1),
    ),
  );
}
nugget('gold_s.svg', 72, 60, 11, 2);
nugget('gold_m.svg', 104, 88, 23, 3);
nugget('gold_l.svg', 148, 124, 37, 5);

put(
  'diamond.svg',
  svg(
    64,
    52,
    `<ellipse cx="32" cy="48" rx="20" ry="3.5" fill="#000" opacity=".25"/>
<polygon points="4,18 15,5 49,5 60,18 32,46" fill="url(#g)" ${stroke(3.5)}/>
<polygon points="4,18 60,18 32,46" fill="#1b8fd6" opacity=".5"/>
<polygon points="15,5 32,18 49,5" fill="#e8ffff" opacity=".8"/>
<path d="M15 5 L22 18 L32 46 M49 5 L42 18 L32 46 M4 18 L60 18" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>
<polygon points="10,17 17,8 22,8 15,17" fill="#fff" opacity=".7"/>`,
    lg('g', ['#c9fbff', '#58cdf5', '#1f7fd1'], 0.2, 0, 0.8, 1),
  ),
);

function rock(name, w, h, seed, tone) {
  const cx = w / 2, cy = h / 2 + 3;
  const r = rnd(seed);
  let cracks = '';
  for (let i = 0; i < 3; i++) {
    const x = cx + (r() - 0.5) * w * 0.5, y = cy + (r() - 0.5) * h * 0.4;
    cracks += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${(r() * 14 - 7).toFixed(0)} ${(10 + r() * 10).toFixed(0)} l${(r() * 12 - 6).toFixed(0)} ${(6 + r() * 8).toFixed(0)}" stroke="#3b3128" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  put(
    name,
    svg(
      w,
      h,
      `<ellipse cx="${cx}" cy="${h - 7}" rx="${w * 0.4}" ry="6" fill="#000" opacity=".28"/>
<polygon points="${blob(cx, cy, w / 2 - 6, h / 2 - 8, 9, seed, 0.14)}" fill="url(#g)" ${stroke(4.5)}/>
<polygon points="${blob(cx - w * 0.07, cy - h * 0.14, w * 0.3, h * 0.2, 7, seed + 4, 0.1)}" fill="#fff" opacity=".18"/>
${cracks}
<circle cx="${cx + w * 0.22}" cy="${cy + h * 0.15}" r="${w * 0.05}" fill="#7a9a4b" opacity=".8"/>
<circle cx="${cx + w * 0.28}" cy="${cy + h * 0.2}" r="${w * 0.035}" fill="#8fb05a" opacity=".8"/>`,
      lg('g', tone, 0.2, 0, 0.7, 1),
    ),
  );
}
rock('rock_s.svg', 84, 76, 5, ['#b3a594', '#857667', '#5a4d41']);
rock('rock_l.svg', 150, 130, 9, ['#a79988', '#776a5c', '#4d4237']);

put(
  'bag.svg',
  svg(
    96,
    104,
    `<ellipse cx="48" cy="98" rx="32" ry="5" fill="#000" opacity=".25"/>
<path d="M30 22 C10 44 4 70 14 86 C22 98 74 98 82 86 C92 70 86 44 66 22 Z" fill="url(#g)" ${stroke(4.5)}/>
<path d="M30 22 C34 12 40 8 38 2 L58 2 C56 8 62 12 66 22 Z" fill="#a1692f" ${stroke(4)}/>
<path d="M28 24 Q48 34 68 24" fill="none" stroke="#6b3d14" stroke-width="7" stroke-linecap="round"/>
<path d="M28 24 Q48 34 68 24" fill="none" stroke="#e7b865" stroke-width="3" stroke-linecap="round"/>
<path d="M36 52 C36 38 60 38 60 52 C60 62 48 62 48 72" fill="none" stroke="#fff3c8" stroke-width="8" stroke-linecap="round"/>
<circle cx="48" cy="84" r="5" fill="#fff3c8"/>
<path d="M22 60 q-4 12 4 20" stroke="#fff" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>`,
    lg('g', ['#e0b06a', '#bd8240', '#8c5724'], 0.2, 0, 0.8, 1),
  ),
);

put(
  'keg.svg',
  svg(
    96,
    116,
    `<ellipse cx="48" cy="110" rx="30" ry="5" fill="#000" opacity=".28"/>
<path d="M44 20 C44 10 52 8 56 2" fill="none" stroke="#3a2a1a" stroke-width="5" stroke-linecap="round"/>
<path d="M18 28 C4 48 4 84 18 104 L78 104 C92 84 92 48 78 28 Z" fill="url(#g)" ${stroke(4.5)}/>
<rect x="8" y="38" width="80" height="12" rx="4" fill="url(#m)" ${stroke(3.5)}/>
<rect x="8" y="82" width="80" height="12" rx="4" fill="url(#m)" ${stroke(3.5)}/>
<path d="M48 54 L64 80 L32 80 Z" fill="#ffd23a" ${stroke(3.5)}/>
<rect x="46" y="62" width="4" height="9" fill="${INK}"/><circle cx="48" cy="75" r="2.4" fill="${INK}"/>
<path d="M30 30 q-8 30 -2 66" stroke="#fff" stroke-width="3.5" fill="none" opacity=".3" stroke-linecap="round"/>
<ellipse cx="48" cy="26" rx="30" ry="7" fill="#a33a22" ${stroke(4)}/>`,
    lg('g', ['#d4553a', '#a8301f', '#6e1c12'], 0, 0, 1, 0) + lg('m', ['#9aa1a8', '#5d636a'], 0, 0, 0, 1),
  ),
);

function beetle(name, legs) {
  const L = legs
    .map(([x1, y1, x2, y2, x3, y3]) => `<path d="M${x1} ${y1} L${x2} ${y2} L${x3} ${y3}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  put(
    name,
    svg(
      88,
      64,
      `<ellipse cx="44" cy="58" rx="30" ry="4" fill="#000" opacity=".25"/>
${L}
<path d="M64 24 L80 14 M66 30 L82 28" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
<ellipse cx="68" cy="34" rx="15" ry="13" fill="url(#h)" ${stroke(4)}/>
<circle cx="73" cy="30" r="4.2" fill="#fff"/><circle cx="74.5" cy="30" r="2" fill="${INK}"/>
<path d="M60 44 l6 4 l4 -5" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="38" cy="34" rx="31" ry="23" fill="url(#c)" ${stroke(4.5)}/>
<path d="M38 12 L38 56" stroke="${INK}" stroke-width="3.5"/>
<path d="M16 24 q10 -9 20 -9" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>
<circle cx="24" cy="38" r="3.5" fill="#ffd23a"/><circle cx="52" cy="38" r="3.5" fill="#ffd23a"/><circle cx="38" cy="46" r="3" fill="#ffd23a"/>`,
      lg('c', ['#4fb6a8', '#1f7a77', '#124a52']) + lg('h', ['#3c8f8c', '#1a5560']),
    ),
  );
}
beetle('beetle_a.svg', [[24, 48, 14, 56, 8, 62], [40, 52, 40, 60, 38, 63], [54, 50, 62, 58, 68, 62]]);
beetle('beetle_b.svg', [[24, 48, 22, 58, 12, 62], [40, 52, 46, 58, 50, 63], [54, 50, 54, 59, 60, 63]]);

// ---------------------------------------------------------------- claw & rig
function claw(name, open) {
  const a = open ? 26 : 8;
  put(
    name,
    svg(
      100,
      80,
      `<g ${stroke(4)}>
<path d="M50 24 C${50 - a - 14} 28 ${50 - a - 20} 52 ${50 - a - 6} 72 C${50 - a - 4} 74 ${50 - a + 4} 70 ${50 - a + 2} 66 C${50 - a - 8} 52 ${50 - a - 4} 40 50 38 Z" fill="url(#j)"/>
<path d="M50 24 C${50 + a + 14} 28 ${50 + a + 20} 52 ${50 + a + 6} 72 C${50 + a + 4} 74 ${50 + a - 4} 70 ${50 + a - 2} 66 C${50 + a + 8} 52 ${50 + a + 4} 40 50 38 Z" fill="url(#j)"/>
<rect x="38" y="6" width="24" height="32" rx="7" fill="url(#j)"/>
<circle cx="50" cy="8" r="9" fill="#d9dde0"/>
</g>
<circle cx="50" cy="8" r="3.5" fill="${INK}"/>
<rect x="42" y="12" width="5" height="18" rx="2" fill="#fff" opacity=".5"/>`,
      lg('j', ['#e9edf0', '#a3abb3', '#656c75'], 0, 0, 1, 1),
    ),
  );
}
claw('claw_open.svg', true);
claw('claw_closed.svg', false);

put(
  'rope.svg',
  svg(
    10,
    32,
    `<rect width="10" height="32" fill="#3b2412"/><rect x="2" width="6" height="32" fill="#9b7040"/>
<path d="M0 0 L10 8 M0 8 L10 16 M0 16 L10 24 M0 24 L10 32 M0 -8 L10 0" stroke="#5a3a1c" stroke-width="2.4"/>
<rect x="3" width="2" height="32" fill="#d9b27a" opacity=".6"/>`,
  ),
);

put(
  'winch.svg',
  svg(
    240,
    170,
    `<ellipse cx="120" cy="160" rx="110" ry="9" fill="#000" opacity=".3"/>
<path d="M30 156 L56 70 L184 70 L210 156 Z" fill="url(#w)" ${stroke(4.5)}/>
<path d="M62 70 L98 156 M178 70 L142 156 M54 112 L186 112" stroke="${INK}" stroke-width="4" fill="none"/>
<rect x="14" y="146" width="212" height="18" rx="6" fill="url(#m)" ${stroke(4.5)}/>
<rect x="70" y="58" width="100" height="18" rx="6" fill="url(#m)" ${stroke(4)}/>
<circle cx="28" cy="155" r="3" fill="#ffd23a"/><circle cx="212" cy="155" r="3" fill="#ffd23a"/>
<rect x="150" y="96" width="46" height="26" rx="6" fill="#d9a73a" ${stroke(3.5)}/><circle cx="173" cy="109" r="6" fill="#c8402a" ${stroke(3)}/>`,
    lg('w', ['#b9733a', '#8a4f26', '#5d3318']) + lg('m', ['#a9b0b6', '#656c74']),
  ),
);

put(
  'winch_drum.svg',
  svg(
    84,
    84,
    `<circle cx="42" cy="42" r="38" fill="url(#d)" ${stroke(4.5)}/>
<circle cx="42" cy="42" r="26" fill="none" stroke="${INK}" stroke-width="4"/>
<path d="M42 16 L42 68 M16 42 L68 42 M24 24 L60 60 M60 24 L24 60" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
<circle cx="42" cy="42" r="10" fill="#e8c14a" ${stroke(3.5)}/>
<path d="M18 30 A28 28 0 0 1 36 12" stroke="#fff" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/>`,
    rg('d', ['#c9cfd4', '#8a929a', '#565d65'], 0.35, 0.3, 0.85),
  ),
);

put(
  'miner.svg',
  svg(
    150,
    190,
    `<ellipse cx="75" cy="182" rx="52" ry="7" fill="#000" opacity=".3"/>
<rect x="38" y="140" width="28" height="40" rx="8" fill="#3b4a6b" ${stroke(4.5)}/><rect x="82" y="140" width="28" height="40" rx="8" fill="#3b4a6b" ${stroke(4.5)}/>
<rect x="30" y="170" width="40" height="14" rx="6" fill="#4a3220" ${stroke(4)}/><rect x="78" y="170" width="40" height="14" rx="6" fill="#4a3220" ${stroke(4)}/>
<path d="M30 80 C22 110 26 140 38 150 L112 150 C124 140 128 110 120 80 C110 66 40 66 30 80 Z" fill="url(#o)" ${stroke(4.5)}/>
<path d="M44 82 L44 148 M106 82 L106 148" stroke="#7a3a10" stroke-width="5" opacity=".55"/>
<rect x="30" y="108" width="90" height="12" fill="#ffd23a" opacity=".85"/><rect x="30" y="108" width="90" height="12" fill="none" ${stroke(0)}/>
<circle cx="75" cy="114" r="7" fill="#ffd23a" ${stroke(3.5)}/>
<path d="M118 90 C134 96 140 110 134 122" fill="none" stroke="#e9a050" stroke-width="16" stroke-linecap="round"/>
<path d="M118 90 C134 96 140 110 134 122" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
<circle cx="134" cy="124" r="11" fill="#f3b878" ${stroke(4)}/>
<circle cx="75" cy="50" r="30" fill="#f3b878" ${stroke(4.5)}/>
<ellipse cx="75" cy="62" rx="18" ry="9" fill="#d98b56" opacity=".35"/>
<rect x="40" y="38" width="70" height="26" rx="13" fill="#2f3b4d" ${stroke(4)}/>
<circle cx="58" cy="51" r="10" fill="#bfe9ff" ${stroke(3.5)}/><circle cx="92" cy="51" r="10" fill="#bfe9ff" ${stroke(3.5)}/>
<circle cx="60" cy="53" r="4" fill="${INK}"/><circle cx="94" cy="53" r="4" fill="${INK}"/>
<circle cx="55" cy="47" r="2.6" fill="#fff"/><circle cx="89" cy="47" r="2.6" fill="#fff"/>
<path d="M62 70 Q75 78 88 70" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<path d="M36 36 C34 6 116 6 114 36 Z" fill="url(#h)" ${stroke(4.5)}/>
<rect x="30" y="32" width="90" height="10" rx="5" fill="#d9a020" ${stroke(4)}/>
<rect x="60" y="8" width="30" height="20" rx="8" fill="#fff3a8" ${stroke(3.5)}/>
<circle cx="75" cy="18" r="6" fill="#ffd23a"/>`,
    lg('o', ['#ff9a3c', '#e0661a', '#a8420f']) + lg('h', ['#ffd23a', '#e0a010']),
  ),
);

// ---------------------------------------------------------------- backgrounds
put(
  'bg_sky.svg',
  svg(
    720,
    300,
    `<rect width="720" height="300" fill="url(#s)"/>
<path d="M0 226 C90 186 160 196 240 224 C330 184 420 192 500 224 C590 186 660 196 720 226 L720 300 L0 300 Z" fill="#7a4a3c" opacity=".55"/>
<path d="M0 258 C110 226 190 244 280 260 C390 226 480 240 570 260 C650 238 700 246 720 258 L720 300 L0 300 Z" fill="#5a3430"/>`,
    lg('s', ['#3a2a5c', '#a5576b', '#f2a65a', '#ffd9a0']),
  ),
);
put('deco_sun.svg', svg(180, 180, `<circle cx="90" cy="90" r="86" fill="#ffd9a0" opacity=".35"/><circle cx="90" cy="90" r="62" fill="#ffe3b0" opacity=".6"/><circle cx="90" cy="90" r="42" fill="#fff4d2"/>`));
put('deco_cloud.svg', svg(220, 70, `<g fill="#fff" opacity=".4"><ellipse cx="80" cy="44" rx="70" ry="18"/><ellipse cx="130" cy="34" rx="50" ry="18"/><ellipse cx="168" cy="48" rx="44" ry="14"/></g>`));
put('icon_sound.svg', iconBase(`<path d="M8 24 H20 L34 12 V52 L20 40 H8 Z" fill="#fff" ${stroke(3.5)}/><path d="M42 22 Q50 32 42 42 M48 14 Q62 32 48 50" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M42 22 Q50 32 42 42 M48 14 Q62 32 48 50" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>`));
put('icon_mute.svg', iconBase(`<path d="M8 24 H20 L34 12 V52 L20 40 H8 Z" fill="#fff" ${stroke(3.5)}/><path d="M42 24 L58 40 M58 24 L42 40" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M42 24 L58 40 M58 24 L42 40" stroke="#ff6a4a" stroke-width="5" stroke-linecap="round"/>`));
put('icon_gear.svg', iconBase(`<path d="M32 6 L38 10 L45 8 L48 15 L56 18 L54 26 L58 32 L54 38 L56 46 L48 49 L45 56 L38 54 L32 58 L26 54 L19 56 L16 49 L8 46 L10 38 L6 32 L10 26 L8 18 L16 15 L19 8 L26 10 Z" fill="#fff" ${stroke(3.5)}/><circle cx="32" cy="32" r="10" fill="#8a929a" ${stroke(3.5)}/>`));
put(
  'ground_top.svg',
  svg(
    128,
    72,
    `<rect y="26" width="128" height="46" fill="url(#d)"/>
<path d="M0 26 Q16 14 32 26 Q48 12 64 26 Q80 14 96 26 Q112 12 128 26 L128 38 L0 38 Z" fill="url(#g)" ${stroke(0)}/>
<path d="M0 26 Q16 14 32 26 Q48 12 64 26 Q80 14 96 26 Q112 12 128 26" fill="none" stroke="${INK}" stroke-width="4"/>
<path d="M12 22 l4 -12 l4 12 M52 22 l4 -14 l4 14 M92 22 l4 -12 l4 12" fill="#7fbf4a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<circle cx="24" cy="54" r="4" fill="#4a2e1a"/><circle cx="76" cy="60" r="3" fill="#4a2e1a"/><circle cx="108" cy="50" r="3.5" fill="#4a2e1a"/>`,
    lg('g', ['#9ad45a', '#5e9a34']) + lg('d', ['#8a5a36', '#5b3820']),
  ),
);

(function soil() {
  const r = rnd(99);
  let s = '';
  for (let i = 0; i < 26; i++) {
    const x = 14 + r() * 228, y = 14 + r() * 228, k = 3 + r() * 6;
    s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${k.toFixed(1)}" ry="${(k * 0.7).toFixed(1)}" fill="${r() > 0.5 ? '#2c190d' : '#5e3b22'}" opacity=".75"/>`;
  }
  for (let i = 0; i < 5; i++) {
    const x = 30 + r() * 190, y = 30 + r() * 190;
    s += `<polygon points="${blob(x, y, 13, 10, 7, i + 40, 0.2)}" fill="#6c5646" stroke="#2c190d" stroke-width="2.5"/>`;
  }
  put('soil_tile.svg', svg(256, 256, `<rect width="256" height="256" fill="url(#d)"/>${s}`, lg('d', ['#4a2c18', '#3f2514'])));
})();

put('soil_shade.svg', svg(64, 512, `<rect width="64" height="512" fill="url(#v)"/>`, `<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>`));
put('glow.svg', svg(256, 256, `<circle cx="128" cy="128" r="128" fill="url(#g)"/>`, `<radialGradient id="g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff1b0" stop-opacity=".9"/><stop offset=".5" stop-color="#ffb64a" stop-opacity=".4"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>`));
put('vignette.svg', svg(64, 64, `<rect width="64" height="64" fill="url(#g)"/>`, `<radialGradient id="g" cx=".5" cy=".5" r=".75"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>`));

put('deco_fossil.svg', svg(120, 70, `<g fill="#cdbfa8" ${stroke(3)}><path d="M10 52 Q60 8 110 52" fill="none" stroke-width="8"/><path d="M26 44 L22 62 M46 28 L44 54 M70 26 L72 54 M92 40 L96 60" fill="none" stroke-width="6"/></g>`));
put('deco_roots.svg', svg(110, 90, `<g fill="none" stroke="#7a4a28" stroke-width="7" stroke-linecap="round"><path d="M55 0 C58 24 30 36 22 62 C18 74 20 84 14 90"/><path d="M55 20 C70 34 86 44 90 66"/><path d="M40 40 C52 52 60 62 62 84"/></g>`));

// ---------------------------------------------------------------- particles
put('spark.svg', svg(48, 48, `<path d="M24 2 L29 19 L46 24 L29 29 L24 46 L19 29 L2 24 L19 19 Z" fill="#fff6c8"/><circle cx="24" cy="24" r="5" fill="#fff"/>`));
put('dust.svg', svg(24, 24, `<circle cx="12" cy="12" r="11" fill="url(#g)"/>`, `<radialGradient id="g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9b8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9b8" stop-opacity="0"/></radialGradient>`));
put('debris.svg', svg(20, 20, `<polygon points="3,12 8,2 17,6 16,16 6,18" fill="#8a7662" ${stroke(2)}/>`));
put('smoke.svg', svg(96, 96, `<circle cx="48" cy="48" r="46" fill="url(#g)"/>`, `<radialGradient id="g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6d6258" stop-opacity=".85"/><stop offset="1" stop-color="#6d6258" stop-opacity="0"/></radialGradient>`));
put('drop.svg', svg(20, 30, `<path d="M10 2 C16 12 18 18 10 28 C2 18 4 12 10 2 Z" fill="#7fd4ff" stroke="#1c6a9c" stroke-width="2"/>`));

// ---------------------------------------------------------------- UI
put(
  'btn.svg',
  svg(
    192,
    112,
    `<rect x="4" y="12" width="184" height="96" rx="28" fill="#000" opacity=".3"/>
<rect x="4" y="4" width="184" height="96" rx="28" fill="url(#e)" stroke="${INK}" stroke-width="5"/>
<rect x="12" y="10" width="168" height="40" rx="20" fill="#fff" opacity=".4"/>
<rect x="9" y="9" width="174" height="86" rx="24" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>`,
    lg('e', ['#ffffff', '#e9e9e9', '#b8b8b8']),
  ),
);
put(
  'btn_round.svg',
  svg(
    112,
    112,
    `<circle cx="56" cy="62" r="48" fill="#000" opacity=".3"/>
<circle cx="56" cy="54" r="48" fill="url(#e)" stroke="${INK}" stroke-width="5"/>
<ellipse cx="56" cy="34" rx="34" ry="20" fill="#fff" opacity=".4"/>`,
    lg('e', ['#ffffff', '#e9e9e9', '#b8b8b8']),
  ),
);
put(
  'panel.svg',
  svg(
    192,
    192,
    `<rect x="4" y="10" width="184" height="178" rx="34" fill="#000" opacity=".35"/>
<rect x="4" y="4" width="184" height="178" rx="34" fill="url(#f)" stroke="${INK}" stroke-width="5"/>
<rect x="16" y="16" width="160" height="154" rx="24" fill="url(#i)" stroke="#2a170b" stroke-width="3"/>
<rect x="20" y="20" width="152" height="146" rx="21" fill="none" stroke="#fff" stroke-width="2" opacity=".12"/>`,
    lg('f', ['#f2c55c', '#c98a22', '#8a5512']) + lg('i', ['#5a3a21', '#33200f']),
  ),
);
put('bar.svg', svg(64, 160, `<rect width="64" height="160" fill="url(#b)"/><rect y="150" width="64" height="6" fill="#f2c55c" opacity=".8"/><rect y="156" width="64" height="4" fill="${INK}"/>`, lg('b', ['#1e1008', '#3a2412'])));
put('slider_track.svg', svg(96, 36, `<rect x="2" y="6" width="92" height="24" rx="12" fill="#1c0f06" stroke="${INK}" stroke-width="3"/><rect x="6" y="9" width="84" height="8" rx="4" fill="#000" opacity=".35"/>`));
put('slider_fill.svg', svg(96, 36, `<rect x="2" y="6" width="92" height="24" rx="12" fill="url(#g)"/><rect x="8" y="9" width="80" height="7" rx="3.5" fill="#fff" opacity=".4"/>`, lg('g', ['#ffd86a', '#e39a1c'])));
put('slider_knob.svg', svg(64, 64, `<circle cx="32" cy="35" r="26" fill="#000" opacity=".3"/><circle cx="32" cy="32" r="26" fill="url(#g)" stroke="${INK}" stroke-width="4"/><ellipse cx="32" cy="22" rx="14" ry="8" fill="#fff" opacity=".45"/>`, lg('g', ['#fff', '#d8d8d8', '#a8a8a8'])));

const star = (fill, edge) => `<polygon points="48,6 60,34 90,36 66,56 74,86 48,70 22,86 30,56 6,36 36,34" fill="${fill}" stroke="${edge}" stroke-width="5" stroke-linejoin="round"/>`;
put('star_full.svg', svg(96, 96, star('url(#g)', INK) + `<polygon points="48,16 55,34 70,36 58,45" fill="#fff" opacity=".55"/>`, lg('g', ['#fff08a', '#ffc21a', '#e08a0a'])));
put('star_empty.svg', svg(96, 96, star('#4a3523', '#1c0f06') + `<polygon points="48,16 55,34 70,36 58,45" fill="#fff" opacity=".08"/>`));

put('icon_pause.svg', iconBase(`<rect x="16" y="12" width="12" height="40" rx="4" fill="#fff" ${stroke(3.5)}/><rect x="36" y="12" width="12" height="40" rx="4" fill="#fff" ${stroke(3.5)}/>`));
put('icon_blast.svg', iconBase(`<rect x="12" y="22" width="22" height="34" rx="6" fill="#d4402a" ${stroke(3.5)} transform="rotate(-18 23 39)"/><rect x="28" y="18" width="22" height="34" rx="6" fill="#e8552f" ${stroke(3.5)} transform="rotate(14 39 35)"/><path d="M44 16 C46 8 52 8 54 3" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><circle cx="54" cy="4" r="4" fill="#ffd23a" stroke="#ff7a1a" stroke-width="2"/><path d="M20 30 l4 -4 M36 26 l4 -4" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>`));
put('icon_turbo.svg', iconBase(`<circle cx="32" cy="32" r="26" fill="url(#g)" ${stroke(3.5)}/><path d="M36 6 L18 36 H30 L26 58 L46 26 H34 Z" fill="#ffe34a" ${stroke(3)}/>`, lg('g', ['#7fd0ff', '#2a86d6'])));
put('icon_lantern.svg', iconBase(`<rect x="22" y="4" width="20" height="8" rx="4" fill="#6b4a2a" ${stroke(3)}/><path d="M20 14 H44 L48 52 H16 Z" fill="url(#g)" ${stroke(3.5)}/><rect x="14" y="50" width="36" height="10" rx="4" fill="#6b4a2a" ${stroke(3)}/><ellipse cx="32" cy="34" rx="8" ry="12" fill="#fff6c0"/><path d="M26 18 v34 M38 18 v34" stroke="${INK}" stroke-width="2.4" opacity=".6"/>`, lg('g', ['#ffd86a', '#ff9a2a'])));
put('icon_gem.svg', iconBase(`<circle cx="26" cy="26" r="18" fill="#cdf3ff" opacity=".55" stroke="${INK}" stroke-width="5"/><path d="M39 39 L56 56" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M39 39 L56 56" stroke="#c98a22" stroke-width="5" stroke-linecap="round"/><polygon points="16,24 21,16 31,16 36,24 26,38" fill="#58cdf5" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`));
put('icon_crusher.svg', iconBase(`<rect x="29" y="22" width="8" height="38" rx="3" fill="#a5702c" ${stroke(3)} transform="rotate(20 33 41)"/><rect x="10" y="8" width="38" height="22" rx="6" fill="url(#g)" ${stroke(3.5)} transform="rotate(20 29 19)"/><path d="M16 14 l12 4" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`, lg('g', ['#c8ced4', '#6d757d'])));
put('icon_coin.svg', iconBase(`<circle cx="32" cy="32" r="26" fill="url(#g)" ${stroke(4)}/><circle cx="32" cy="32" r="17" fill="none" stroke="#a86a08" stroke-width="4"/><path d="M26 32 L32 22 L38 32 L32 42 Z" fill="#a86a08"/><path d="M16 22 A18 18 0 0 1 28 12" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`, lg('g', ['#fff08a', '#f2b81c', '#c47d08'])));
put('icon_clock.svg', iconBase(`<circle cx="32" cy="34" r="24" fill="#fff" ${stroke(4)}/><rect x="26" y="4" width="12" height="8" rx="3" fill="#c98a22" ${stroke(3)}/><path d="M32 34 V18 M32 34 L44 40" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`));
put('icon_target.svg', iconBase(`<circle cx="32" cy="32" r="26" fill="#fff" ${stroke(4)}/><circle cx="32" cy="32" r="17" fill="#e8472a" stroke="${INK}" stroke-width="3"/><circle cx="32" cy="32" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="32" cy="32" r="3" fill="#e8472a"/>`));
put('icon_lock.svg', iconBase(`<path d="M20 28 V20 a12 12 0 0 1 24 0 V28" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M20 28 V20 a12 12 0 0 1 24 0 V28" fill="none" stroke="#c4c9cf" stroke-width="4.5" stroke-linecap="round"/><rect x="12" y="28" width="40" height="30" rx="8" fill="url(#g)" ${stroke(4)}/><circle cx="32" cy="42" r="4.5" fill="${INK}"/>`, lg('g', ['#ffd86a', '#c98a22'])));
put('logo_claw.svg', svg(240, 240, `<g transform="translate(120 20) scale(1.6) translate(-50 0)"><path d="M50 24 C10 28 0 60 14 88 C16 92 24 88 22 84 C12 62 20 44 50 40 Z" fill="url(#j)" ${stroke(5)}/><path d="M50 24 C90 28 100 60 86 88 C84 92 76 88 78 84 C88 62 80 44 50 40 Z" fill="url(#j)" ${stroke(5)}/><rect x="36" y="2" width="28" height="36" rx="8" fill="url(#j)" ${stroke(5)}/><circle cx="50" cy="8" r="9" fill="#d9dde0" ${stroke(4)}/></g><polygon points="120,150 150,170 138,205 102,205 90,170" fill="url(#d)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M104 172 L120 160 L136 172" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>`, lg('j', ['#e9edf0', '#a3abb3', '#656c75'], 0, 0, 1, 1) + lg('d', ['#c9fbff', '#58cdf5', '#1f7fd1'])));

put('icon_hourglass.svg', iconBase(`<path d="M16 6 H48 M16 58 H48" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M18 8 H46 C46 24 36 28 32 32 C36 36 46 40 46 56 H18 C18 40 28 36 32 32 C28 28 18 24 18 8 Z" fill="#cfeeff" opacity=".7" ${stroke(3.5)}/><path d="M24 12 H40 C38 22 32 26 32 30 C32 26 26 22 24 12 Z" fill="#ffd23a"/><path d="M32 34 L22 54 H42 Z" fill="#ffd23a"/>`));
put('icon_goldrush.svg', iconBase(`<polygon points="${blob(32, 40, 24, 16, 9, 7)}" fill="url(#g)" ${stroke(3.5)}/><polygon points="${blob(22, 24, 14, 10, 8, 3)}" fill="url(#g)" ${stroke(3)}/><polygon points="${blob(44, 20, 12, 9, 8, 5)}" fill="url(#g)" ${stroke(3)}/><path d="M50 4 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z" fill="#fff6c8"/>`, lg('g', ['#ffe97a', '#f6bf1f', '#c47d08'])));
put('icon_miner.svg', iconBase(`<circle cx="32" cy="38" r="20" fill="#f3b878" ${stroke(3.5)}/><rect x="14" y="32" width="36" height="14" rx="7" fill="#2f3b4d" ${stroke(3)}/><circle cx="24" cy="39" r="5" fill="#bfe9ff"/><circle cx="40" cy="39" r="5" fill="#bfe9ff"/><path d="M12 30 C12 6 52 6 52 30 Z" fill="#ffd23a" ${stroke(3.5)}/><rect x="26" y="8" width="12" height="9" rx="4" fill="#fff3a8" ${stroke(2.5)}/><path d="M24 50 Q32 56 40 50" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`));

console.log('art written to', OUT_DIR);
