/**
 * Single list of every picture and sound the game loads.
 * To replace art: drop your file into public/assets/images/ with the same name and size
 * (an .svg or a .png). If you use a .png, change `file` below to the new name. Nothing else changes.
 * See docs/ASSETS.md for what every key depicts.
 */

export interface ImageAsset {
  /** File inside public/assets/images/ (.svg is rasterised at w x h, .png is used as is). */
  file: string;
  /** Nominal size in logical pixels (the size the game draws it at). */
  w: number;
  h: number;
}

export const IMAGE_DIR = 'assets/images/';
export const AUDIO_DIR = 'assets/audio/';

export const IMAGES = {
  bag: { file: 'bag.svg', w: 96, h: 104 },
  bar: { file: 'bar.svg', w: 64, h: 160 },
  beetle_a: { file: 'beetle_a.svg', w: 88, h: 64 },
  beetle_b: { file: 'beetle_b.svg', w: 88, h: 64 },
  bg_sky: { file: 'bg_sky.svg', w: 720, h: 300 },
  btn: { file: 'btn.svg', w: 192, h: 112 },
  btn_round: { file: 'btn_round.svg', w: 112, h: 112 },
  claw_closed: { file: 'claw_closed.svg', w: 100, h: 80 },
  claw_open: { file: 'claw_open.svg', w: 100, h: 80 },
  debris: { file: 'debris.svg', w: 20, h: 20 },
  deco_cloud: { file: 'deco_cloud.svg', w: 220, h: 70 },
  deco_fossil: { file: 'deco_fossil.svg', w: 120, h: 70 },
  deco_roots: { file: 'deco_roots.svg', w: 110, h: 90 },
  deco_sun: { file: 'deco_sun.svg', w: 180, h: 180 },
  diamond: { file: 'diamond.svg', w: 64, h: 52 },
  drop: { file: 'drop.svg', w: 20, h: 30 },
  dust: { file: 'dust.svg', w: 24, h: 24 },
  glow: { file: 'glow.svg', w: 256, h: 256 },
  gold_l: { file: 'gold_l.svg', w: 148, h: 124 },
  gold_m: { file: 'gold_m.svg', w: 104, h: 88 },
  gold_s: { file: 'gold_s.svg', w: 72, h: 60 },
  ground_top: { file: 'ground_top.svg', w: 128, h: 72 },
  icon_blast: { file: 'icon_blast.svg', w: 64, h: 64 },
  icon_clock: { file: 'icon_clock.svg', w: 64, h: 64 },
  icon_coin: { file: 'icon_coin.svg', w: 64, h: 64 },
  icon_crusher: { file: 'icon_crusher.svg', w: 64, h: 64 },
  icon_gear: { file: 'icon_gear.svg', w: 64, h: 64 },
  icon_gem: { file: 'icon_gem.svg', w: 64, h: 64 },
  icon_hourglass: { file: 'icon_hourglass.svg', w: 64, h: 64 },
  icon_goldrush: { file: 'icon_goldrush.svg', w: 64, h: 64 },
  icon_miner: { file: 'icon_miner.svg', w: 64, h: 64 },
  chest: { file: 'chest.svg', w: 100, h: 80 },
  slime: { file: 'slime.svg', w: 64, h: 58 },
  icon_gift: { file: 'icon_gift.svg', w: 64, h: 64 },
  icon_trophy: { file: 'icon_trophy.svg', w: 64, h: 64 },
  icon_infinity: { file: 'icon_infinity.svg', w: 64, h: 64 },
  icon_calendar: { file: 'icon_calendar.svg', w: 64, h: 64 },
  icon_arrowup: { file: 'icon_arrowup.svg', w: 64, h: 64 },
  miner_blue: { file: 'miner_blue.svg', w: 150, h: 190 },
  miner_green: { file: 'miner_green.svg', w: 150, h: 190 },
  miner_purple: { file: 'miner_purple.svg', w: 150, h: 190 },
  miner_tycoon: { file: 'miner_tycoon.svg', w: 150, h: 190 },
  char_pebble: { file: 'char_pebble.svg', w: 160, h: 160 },
  char_baron: { file: 'char_baron.svg', w: 160, h: 160 },
  icon_freeze: { file: 'icon_freeze.svg', w: 64, h: 64 },
  icon_ticket: { file: 'icon_ticket.svg', w: 64, h: 64 },
  icon_crate: { file: 'icon_crate.svg', w: 64, h: 64 },
  icon_shop: { file: 'icon_shop.svg', w: 64, h: 64 },
  icon_wrench: { file: 'icon_wrench.svg', w: 64, h: 64 },
  icon_book: { file: 'icon_book.svg', w: 64, h: 64 },
  icon_lantern: { file: 'icon_lantern.svg', w: 64, h: 64 },
  icon_lock: { file: 'icon_lock.svg', w: 64, h: 64 },
  icon_mute: { file: 'icon_mute.svg', w: 64, h: 64 },
  icon_pause: { file: 'icon_pause.svg', w: 64, h: 64 },
  icon_sound: { file: 'icon_sound.svg', w: 64, h: 64 },
  icon_target: { file: 'icon_target.svg', w: 64, h: 64 },
  icon_turbo: { file: 'icon_turbo.svg', w: 64, h: 64 },
  keg: { file: 'keg.svg', w: 96, h: 116 },
  logo_claw: { file: 'logo_claw.svg', w: 240, h: 240 },
  miner: { file: 'miner.svg', w: 150, h: 190 },
  panel: { file: 'panel.svg', w: 192, h: 192 },
  rock_l: { file: 'rock_l.svg', w: 150, h: 130 },
  rock_s: { file: 'rock_s.svg', w: 84, h: 76 },
  rope: { file: 'rope.svg', w: 10, h: 32 },
  slider_fill: { file: 'slider_fill.svg', w: 96, h: 36 },
  slider_knob: { file: 'slider_knob.svg', w: 64, h: 64 },
  slider_track: { file: 'slider_track.svg', w: 96, h: 36 },
  smoke: { file: 'smoke.svg', w: 96, h: 96 },
  soil_shade: { file: 'soil_shade.svg', w: 64, h: 512 },
  soil_tile: { file: 'soil_tile.svg', w: 256, h: 256 },
  spark: { file: 'spark.svg', w: 48, h: 48 },
  star_empty: { file: 'star_empty.svg', w: 96, h: 96 },
  star_full: { file: 'star_full.svg', w: 96, h: 96 },
  vignette: { file: 'vignette.svg', w: 64, h: 64 },
  winch: { file: 'winch.svg', w: 240, h: 170 },
  winch_drum: { file: 'winch_drum.svg', w: 84, h: 84 },
} as const satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof IMAGES;

export const SOUNDS = [
  'click', 'tick', 'launch', 'reel', 'hook', 'gold', 'diamond', 'rock', 'bag', 'explosion',
  'blast', 'win', 'lose', 'buy', 'deny', 'music_menu', 'music_game', 'music_cave', 'music_lava', 'music_ice', 'music_abyss', 'music_boss',
] as const;

export type SoundKey = (typeof SOUNDS)[number];
