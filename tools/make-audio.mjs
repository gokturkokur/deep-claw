// One-time generator for the original placeholder sounds (pure synthesis, no samples).
// The .wav files in public/assets/audio/ are the source of truth: replace any of them with your
// own sound (same file name) and the game uses it. See docs/ASSETS.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'audio');
mkdirSync(OUT, { recursive: true });
const SR = 22050;
const TAU = Math.PI * 2;

// ---- post processing: warmth (soft clip), a small room reverb and a gentle low-pass
function comb(x, delay, fb) {
  const d = Math.floor(delay * SR);
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] + (i >= d ? y[i - d] * fb : 0);
  return y;
}
function allpass(x, delay, g) {
  const d = Math.floor(delay * SR);
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const xd = i >= d ? x[i - d] : 0;
    const yd = i >= d ? y[i - d] : 0;
    y[i] = -g * x[i] + xd + g * yd;
  }
  return y;
}
function roomReverb(x, mix) {
  let wet = new Float32Array(x.length);
  for (const [d, fb] of [[0.0297, 0.74], [0.0371, 0.72], [0.0411, 0.7], [0.0437, 0.68]]) {
    const c = comb(x, d, fb);
    for (let i = 0; i < wet.length; i++) wet[i] += c[i] * 0.25;
  }
  wet = allpass(allpass(wet, 0.005, 0.5), 0.0017, 0.5);
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] * (1 - mix * 0.4) + wet[i] * mix;
  return out;
}
function lowpass(x, a) {
  const y = new Float32Array(x.length);
  let p = 0;
  for (let i = 0; i < x.length; i++) {
    p += (x[i] - p) * a;
    y[i] = p;
  }
  return y;
}
function finish(name, data) {
  const isLoop = name.startsWith('music_') || name === 'reel.wav';
  const wetMix = name.startsWith('music_') ? 0.22 : name === 'reel.wav' ? 0 : 0.2;
  let x = data;
  if (isLoop) {
    // run the reverb over two copies and keep the second, so the loop point is seamless
    if (wetMix > 0) {
      const two = new Float32Array(x.length * 2);
      two.set(x, 0);
      two.set(x, x.length);
      x = roomReverb(two, wetMix).slice(x.length);
    }
  } else {
    const padded = new Float32Array(x.length + Math.floor(0.4 * SR));
    padded.set(x, 0);
    x = roomReverb(padded, wetMix);
  }
  x = lowpass(x, name.startsWith('music_') ? 0.55 : 0.85);
  for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * 1.4) / Math.tanh(1.4);
  return x;
}

const wav = (name, raw) => {
  const data = finish(name, raw);
  const n = data.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
  const g = peak > 0.95 ? 0.95 / peak : 1;
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * g)) * 32767), 44 + i * 2);
  writeFileSync(join(OUT, name), buf);
};
const make = (sec) => new Float32Array(Math.floor(sec * SR));
let seed = 12345;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 2147483648 - 1;
};
const env = (t, a, d, sus, dur) => (t < a ? t / a : t < a + d ? 1 - (1 - sus) * ((t - a) / d) : Math.max(0, sus * (1 - (t - a - d) / Math.max(0.001, dur - a - d))));
const sq = (p) => (Math.sin(p) > 0 ? 1 : -1);
const tri = (p) => (2 / Math.PI) * Math.asin(Math.sin(p));
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

function tone(buf, start, dur, freq, vol, shape = 'sin', a = 0.005, d = 0.05, sus = 0.4, slide = 0) {
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  let ph = 0;
  let ph2 = 0;
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / SR;
    const f = freq * (1 + slide * (t / dur));
    ph += (TAU * f) / SR;
    const w = shape === 'sq' ? sq(ph) * 0.6 : shape === 'tri' ? tri(ph) : shape === 'saw' ? ((ph / TAU) % 1) * 2 - 1 : Math.sin(ph);
    ph2 += (TAU * f * 1.006) / SR;
    const w2 = shape === 'sq' ? sq(ph2) * 0.6 : shape === 'tri' ? tri(ph2) : shape === 'saw' ? ((ph2 / TAU) % 1) * 2 - 1 : Math.sin(ph2);
    buf[s0 + i] += (w * 0.65 + w2 * 0.45) * vol * env(t, a, d, sus, dur);
  }
}
function burst(buf, start, dur, vol, lp = 0.2, decay = 4) {
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  let y = 0;
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    y += (noise() - y) * lp;
    buf[s0 + i] += y * vol * Math.exp((-decay * i) / n);
  }
}

// ---- SFX
{ const b = make(0.09); tone(b, 0, 0.09, 880, 0.5, 'tri', 0.002, 0.02, 0.3, -0.3); wav('click.wav', b); }
{ const b = make(0.12); burst(b, 0, 0.04, 0.5, 0.5, 5); tone(b, 0, 0.1, 140, 0.35, 'sq', 0.001, 0.03, 0.2, -0.4); wav('tick.wav', b); }
{ const b = make(0.35); burst(b, 0, 0.35, 0.4, 0.08, 3); tone(b, 0, 0.3, 700, 0.3, 'sin', 0.01, 0.1, 0.3, -0.6); wav('launch.wav', b); }
{ const b = make(0.36); for (let k = 0; k < 6; k++) { burst(b, k * 0.06, 0.03, 0.55, 0.6, 6); tone(b, k * 0.06, 0.04, 220 + (k % 2) * 40, 0.25, 'sq', 0.001, 0.01, 0.3); } wav('reel.wav', b); }
{ const b = make(0.25); burst(b, 0, 0.12, 0.7, 0.4, 6); tone(b, 0, 0.2, 180, 0.6, 'sq', 0.001, 0.05, 0.3, -0.4); wav('hook.wav', b); }
{ const b = make(0.6); [[0, 88], [0.07, 91], [0.14, 95], [0.21, 100]].forEach(([t, m]) => tone(b, t, 0.3, midi(m - 12), 0.35, 'tri', 0.003, 0.1, 0.35)); wav('gold.wav', b); }
{ const b = make(0.9); [[0, 96], [0.07, 100], [0.14, 103], [0.21, 108], [0.3, 112]].forEach(([t, m]) => { tone(b, t, 0.5, midi(m - 12), 0.28, 'sin', 0.002, 0.15, 0.3); tone(b, t, 0.5, midi(m - 12) * 2.01, 0.12, 'sin', 0.002, 0.1, 0.2); }); wav('diamond.wav', b); }
{ const b = make(0.35); tone(b, 0, 0.3, 90, 0.8, 'sin', 0.001, 0.1, 0.2, -0.5); burst(b, 0, 0.2, 0.5, 0.15, 5); wav('rock.wav', b); }
{ const b = make(0.8); tone(b, 0, 0.25, 330, 0.3, 'tri', 0.01, 0.1, 0.4, 1); [[0.25, 84], [0.33, 88], [0.41, 91], [0.49, 96]].forEach(([t, m]) => tone(b, t, 0.3, midi(m - 12), 0.25, 'sin', 0.002, 0.12, 0.3)); wav('bag.wav', b); }
{ const b = make(1.2); burst(b, 0, 1.0, 1.0, 0.07, 3.5); tone(b, 0, 0.8, 70, 0.9, 'sin', 0.002, 0.3, 0.3, -0.6); burst(b, 0, 0.12, 0.9, 0.5, 8); wav('explosion.wav', b); }
{ const b = make(0.25); tone(b, 0, 0.2, 300, 0.5, 'sin', 0.001, 0.05, 0.2, 1.2); burst(b, 0, 0.1, 0.3, 0.3, 6); wav('blast.wav', b); }
{ const b = make(1.6); [[0, 72], [0.18, 76], [0.36, 79], [0.54, 84], [0.9, 79], [1.05, 84]].forEach(([t, m], i) => { tone(b, t, i === 3 ? 0.5 : 0.3, midi(m), 0.3, 'sq', 0.005, 0.06, 0.5); tone(b, t, 0.4, midi(m - 12), 0.25, 'tri', 0.005, 0.06, 0.5); }); wav('win.wav', b); }
{ const b = make(1.5); [[0, 67], [0.3, 64], [0.6, 60], [0.95, 55]].forEach(([t, m]) => { tone(b, t, 0.45, midi(m), 0.3, 'tri', 0.01, 0.1, 0.5); tone(b, t, 0.45, midi(m) * 0.5, 0.25, 'sq', 0.01, 0.1, 0.4); }); wav('lose.wav', b); }
{ const b = make(0.7); tone(b, 0, 0.12, midi(83), 0.35, 'sq', 0.002, 0.04, 0.4); tone(b, 0.1, 0.5, midi(88), 0.35, 'sq', 0.002, 0.2, 0.3); for (let i = 0; i < 4; i++) burst(b, 0.1 + i * 0.04, 0.05, 0.15, 0.7, 6); wav('buy.wav', b); }
{ const b = make(0.3); tone(b, 0, 0.12, 200, 0.4, 'sq', 0.002, 0.05, 0.3); tone(b, 0.1, 0.18, 150, 0.4, 'sq', 0.002, 0.05, 0.3); wav('deny.wav', b); }

// ---- Music (procedural, original): bass + arpeggio + a little percussion
function music(name, bpm, bars, chords, arpPattern, lead, rootShift = 0, drive = 1) {
  const beat = 60 / bpm;
  const total = bars * 4 * beat;
  const b = make(total);
  for (let bar = 0; bar < bars; bar++) {
    const chord = chords[bar % chords.length];
    for (let s = 0; s < 8; s++) {
      const t = (bar * 4 + s * 0.5) * beat;
      const note = chord[arpPattern[s % arpPattern.length] % chord.length] + 12 + rootShift;
      tone(b, t, beat * 0.45, midi(note), 0.13, 'tri', 0.004, 0.08, 0.35);
    }
    tone(b, bar * 4 * beat, beat * 1.8, midi(chord[0] - 12 + rootShift), 0.3, 'tri', 0.01, 0.2, 0.7);
    tone(b, (bar * 4 + 2) * beat, beat * 1.8, midi(chord[0] - 12 + rootShift), 0.26, 'tri', 0.01, 0.2, 0.7);
    // soft pad under the chord
    for (const nt of chord) tone(b, bar * 4 * beat, beat * 4, midi(nt + rootShift), 0.035, 'saw', 0.4, 0.5, 0.7);
    for (let h = 0; h < 8; h++) burst(b, (bar * 4 + h * 0.5) * beat, 0.025, drive ? 0.07 : 0.03, 0.95, 9);
    if (drive) {
      for (const sn of [1, 3]) burst(b, (bar * 4 + sn) * beat, 0.12, 0.16, 0.5, 6);
      for (let k = 0; k < 4; k++) {
        const t = (bar * 4 + k) * beat;
        tone(b, t, 0.12, 60, 0.35, 'sin', 0.001, 0.05, 0.1, -0.5);
        burst(b, t + 0.5 * beat, 0.05, 0.1, 0.6, 7);
      }
    }
    if (lead[bar % lead.length] !== null) tone(b, (bar * 4 + 0.5) * beat, beat * 2.5, midi(lead[bar % lead.length] + rootShift), 0.1, 'sin', 0.05, 0.2, 0.5);
  }
  // soft fade at loop point to avoid clicks
  const f = Math.floor(0.01 * SR);
  for (let i = 0; i < f; i++) { b[i] *= i / f; b[b.length - 1 - i] *= i / f; }
  wav(name, b);
}
// A minor / pentatonic-ish mine feel
music('music_menu.wav', 84, 8, [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], [0, 1, 2, 1, 0, 2, 1, 2], [76, null, 72, null, 69, null, 71, null], 0, 0);
music('music_game.wav', 116, 8, [[57, 60, 64], [60, 64, 67], [53, 57, 60], [55, 59, 62]], [0, 2, 1, 2, 0, 1, 2, 1], [81, 79, 76, 79, 77, 76, 72, 74], 0, 1);
// one track per world + the boss theme
music('music_cave.wav', 96, 6, [[52, 55, 59], [48, 52, 55], [50, 53, 57], [47, 52, 55]], [0, 1, 2, 1, 2, 1, 0, 2], [79, null, 76, null, 74, null, 71, null], 0, 0);
music('music_lava.wav', 132, 6, [[45, 48, 52], [47, 50, 54], [48, 52, 55], [50, 53, 57]], [0, 2, 1, 2, 0, 1, 2, 1], [81, 83, 81, 79, 84, 83, 81, 79], 0, 1);
music('music_ice.wav', 78, 6, [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], [0, 1, 2, 2, 1, 0, 2, 1], [88, null, 86, null, 84, null, 83, null], 0, 0);
music('music_abyss.wav', 70, 6, [[40, 43, 47], [38, 41, 45], [36, 40, 43], [41, 44, 48]], [0, 2, 1, 2, 0, 2, 1, 0], [71, null, null, 69, null, null, 67, null], 0, 0);
music('music_boss.wav', 150, 6, [[45, 48, 52], [44, 47, 51], [43, 46, 50], [44, 47, 51]], [0, 1, 2, 1, 0, 2, 1, 2], [84, 81, 84, 88, 86, 84, 81, 79], 0, 1);
console.log('audio written to', OUT);
