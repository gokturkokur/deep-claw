# Assets

Every picture and sound the game loads is listed in `src/assets/manifest.ts`. This file explains what each one is.

## How to replace art with your own

1. Make your picture (Illustrator, After Effects, any tool) at the **same pixel size** listed below.
2. Save it into `public/assets/images/` with the **same file name** (`gold_m.svg` and so on) and overwrite the old file.
3. If you export a **PNG** instead of an SVG, save it as `gold_m.png` and change the one word `file: 'gold_m.svg'` to `file: 'gold_m.png'` in `src/assets/manifest.ts`. Nothing else changes.
4. Keep the anchor point the same (see the table): for most pictures the middle of the picture is the point the game uses.

SVGs are drawn by the game at the listed size. PNGs should be exactly that size (or 2x if you also keep the proportions).

The 9-slice pictures (`btn`, `panel`, `slider_*`) are stretched by the game: only the middle part stretches, the corners stay sharp. Keep the corner size listed in the notes.

Fonts: the game uses **Lilita One** (SIL Open Font License, bundled in `src/fonts/`).

## Images

| Key | File | Size (px) | Anchor | Frames | What it shows |
|---|---|---|---|---|---|
| `bag` | `public/assets/images/bag.svg` | 96 x 104 | center | 1 (idle wobble is done in code) | Mystery bag: burlap sack with a "?" |
| `bar` | `public/assets/images/bar.svg` | 64 x 160 | top-left | 1 | HUD strip behind the top row (stretched to screen width) |
| `beetle_a` | `public/assets/images/beetle_a.svg` | 88 x 64 | center | 2 frames: beetle_a, beetle_b | Burrow beetle, walk frame 1 (faces right, code flips it) |
| `beetle_b` | `public/assets/images/beetle_b.svg` | 88 x 64 | center | (see beetle_a) | Burrow beetle, walk frame 2 |
| `bg_sky` | `public/assets/images/bg_sky.svg` | 720 x 300 | bottom edge sits on the ground line | 1 | Sky and distant hills, tiles sideways |
| `btn` | `public/assets/images/btn.svg` | 192 x 112 | - | 1 | Button body, 9-slice (48/48/40/40 px corners), tinted by code |
| `btn_round` | `public/assets/images/btn_round.svg` | 112 x 112 | center | 1 | Round button body, tinted by code |
| `claw_closed` | `public/assets/images/claw_closed.svg` | 100 x 80 | top centre = rope attach point; jaw tip near the bottom | 1 | Claw with closed jaws (hooked / retracting) |
| `claw_open` | `public/assets/images/claw_open.svg` | 100 x 80 | top centre = rope attach point | 1 | Claw with open jaws (swinging / launching) |
| `debris` | `public/assets/images/debris.svg` | 20 x 20 | center | 1 | Small rock chip particle |
| `deco_cloud` | `public/assets/images/deco_cloud.svg` | 220 x 70 | center | 1 | Drifting cloud |
| `deco_fossil` | `public/assets/images/deco_fossil.svg` | 120 x 70 | center | 1 | Fossil ribs decoration in the soil |
| `deco_roots` | `public/assets/images/deco_roots.svg` | 110 x 90 | center | 1 | Tree roots decoration in the soil |
| `deco_sun` | `public/assets/images/deco_sun.svg` | 180 x 180 | center | 1 | Low sun glow |
| `diamond` | `public/assets/images/diamond.svg` | 64 x 52 | center | 1 (sparkle added in code) | Diamond ($600) |
| `drop` | `public/assets/images/drop.svg` | 20 x 30 | center | 1 | Water drip particle |
| `dust` | `public/assets/images/dust.svg` | 24 x 24 | center | 1 | Soft dust mote particle |
| `glow` | `public/assets/images/glow.svg` | 256 x 256 | center | 1 | Warm lantern glow, additive blend |
| `gold_l` | `public/assets/images/gold_l.svg` | 148 x 124 | center | 1 | Large gold nugget ($500) |
| `gold_m` | `public/assets/images/gold_m.svg` | 104 x 88 | center | 1 | Medium gold nugget ($250) |
| `gold_s` | `public/assets/images/gold_s.svg` | 72 x 60 | center | 1 | Small gold nugget ($100) |
| `ground_top` | `public/assets/images/ground_top.svg` | 128 x 72 | center | 1 | Grass and dirt edge of the ground line, tiles sideways |
| `icon_blast` | `public/assets/images/icon_blast.svg` | 64 x 64 | center | 1 | Blast Cap icon (dynamite sticks) |
| `icon_clock` | `public/assets/images/icon_clock.svg` | 64 x 64 | center | 1 | Timer icon |
| `icon_coin` | `public/assets/images/icon_coin.svg` | 64 x 64 | center | 1 | Money icon |
| `icon_crusher` | `public/assets/images/icon_crusher.svg` | 64 x 64 | center | 1 | Ore Crusher icon (hammer) |
| `icon_gear` | `public/assets/images/icon_gear.svg` | 64 x 64 | center | 1 | Settings icon |
| `icon_gem` | `public/assets/images/icon_gem.svg` | 64 x 64 | center | 1 | Gem Lens icon (magnifier with gem) |
| `icon_hourglass` | `public/assets/images/icon_hourglass.svg` | 64 x 64 | center | 1 | Hourglass icon |
| `icon_goldrush` | `public/assets/images/icon_goldrush.svg` | 64 x 64 | center | 1 | Gold Fever icon |
| `icon_miner` | `public/assets/images/icon_miner.svg` | 64 x 64 | center | 1 | Extra Miner icon |
| `icon_lantern` | `public/assets/images/icon_lantern.svg` | 64 x 64 | center | 1 | Lucky Lantern icon |
| `icon_lock` | `public/assets/images/icon_lock.svg` | 64 x 64 | center | 1 | Locked level icon |
| `icon_mute` | `public/assets/images/icon_mute.svg` | 64 x 64 | center | 1 | Sound off icon |
| `icon_pause` | `public/assets/images/icon_pause.svg` | 64 x 64 | center | 1 | Pause icon |
| `icon_sound` | `public/assets/images/icon_sound.svg` | 64 x 64 | center | 1 | Sound on icon |
| `icon_target` | `public/assets/images/icon_target.svg` | 64 x 64 | center | 1 | Target icon (not used yet) |
| `icon_turbo` | `public/assets/images/icon_turbo.svg` | 64 x 64 | center | 1 | Turbo Winch Oil icon (lightning) |
| `keg` | `public/assets/images/keg.svg` | 96 x 116 | center | 1 (fuse sparks added in code) | Powder keg (explodes on touch) |
| `logo_claw` | `public/assets/images/logo_claw.svg` | 240 x 240 | top centre = rope | 1 | Menu emblem: claw holding a gem; also the favicon |
| `miner` | `public/assets/images/miner.svg` | 150 x 190 | bottom centre = feet | 1 | The player character: stocky rig operator with headlamp helmet and goggles |
| `panel` | `public/assets/images/panel.svg` | 192 x 192 | - | 1 | Panel frame, 9-slice (56 px corners) |
| `rock_l` | `public/assets/images/rock_l.svg` | 150 x 130 | center | 1 | Large rock ($20, heavy, blocks paths) |
| `rock_s` | `public/assets/images/rock_s.svg` | 84 x 76 | center | 1 | Small rock ($10) |
| `rope` | `public/assets/images/rope.svg` | 10 x 32 | top | 1 | Rope tile (repeats along the rope length) |
| `slider_fill` | `public/assets/images/slider_fill.svg` | 96 x 36 | - | 1 | Slider filled part, 9-slice |
| `slider_knob` | `public/assets/images/slider_knob.svg` | 64 x 64 | center | 1 | Slider knob |
| `slider_track` | `public/assets/images/slider_track.svg` | 96 x 36 | - | 1 | Slider track, 9-slice |
| `smoke` | `public/assets/images/smoke.svg` | 96 x 96 | center | 1 | Smoke puff particle |
| `soil_shade` | `public/assets/images/soil_shade.svg` | 64 x 512 | center | 1 | Dark gradient that deepens the soil downwards |
| `soil_tile` | `public/assets/images/soil_tile.svg` | 256 x 256 | - | 1 | Seamless soil texture |
| `spark` | `public/assets/images/spark.svg` | 48 x 48 | center | 1 | Four point glint / spark particle |
| `star_empty` | `public/assets/images/star_empty.svg` | 96 x 96 | center | 1 | Empty star |
| `star_full` | `public/assets/images/star_full.svg` | 96 x 96 | center | 1 | Filled star |
| `vignette` | `public/assets/images/vignette.svg` | 64 x 64 | center | 1 | Dark corner overlay |
| `winch` | `public/assets/images/winch.svg` | 240 x 170 | top centre; the drum centre is 40 px below the top edge in the 240x170 art | 1 | Winch frame the rope hangs from (drum is drawn on top by code) |
| `winch_drum` | `public/assets/images/winch_drum.svg` | 84 x 84 | center = rope pivot | 1 (rotated by code) | Rotating winch drum |

Collision shapes (not the art!) are set in `src/config/economy.ts`. They are slightly smaller than the art on purpose, so near misses feel fair. If your new art has a very different shape, adjust the numbers there.

Drawn sizes in the world: claw 90 x 72, winch 168 x 119, miner 96 x 122, drum 62 x 62 (set in `src/scenes/Game.ts`).

### Magnet Test prototype images

Only used by the separate Magnet Test mode (see `docs/MAGNET_PROTOTYPE.md`). They are drawn at exactly the listed size. `npm run assets:magnet-art` rewrites all of them from `tools/make-magnet-art.mjs`, so run it only if you want the first placeholder versions back: it overwrites your own files with the same names. Collision shapes and values are in `src/config/magnet.ts`.

| Key | File | Size (px) | Anchor | Frames | What it shows |
|---|---|---|---|---|---|
| `mg_bike` | `public/assets/images/mg_bike.svg` | 150 x 96 | center | 1 | Rusty bicycle (valuable, heavy) |
| `mg_cart` | `public/assets/images/mg_cart.svg` | 110 x 100 | center | 1 | Shopping cart (valuable, very heavy) |
| `mg_chain` | `public/assets/images/mg_chain.svg` | 88 x 84 | center | 1 | Pile of rusty chain (cheap heavy scrap) |
| `mg_coins` | `public/assets/images/mg_coins.svg` | 72 x 56 | center | 1 | Bunch of coins (light) |
| `mg_engine` | `public/assets/images/mg_engine.svg` | 112 x 92 | center | 1 | Old engine block (cheap, heaviest scrap) |
| `mg_grenade` | `public/assets/images/mg_grenade.svg` | 56 x 72 | center | 1 | Old grenade (explodes on a direct touch) |
| `mg_keys` | `public/assets/images/mg_keys.svg` | 76 x 64 | center | 1 | Key bunch (light) |
| `mg_knife` | `public/assets/images/mg_knife.svg` | 84 x 48 | center | 1 | Pocket knife (light) |
| `mg_magnet` | `public/assets/images/mg_magnet.svg` | 88 x 72 | top centre = rope end; the poles at the bottom are the touching face | 1 (rotated by code) | Horseshoe magnet |
| `mg_manhole` | `public/assets/images/mg_manhole.svg` | 96 x 96 | center | 1 | Manhole cover (cheap heavy scrap) |
| `mg_pipe` | `public/assets/images/mg_pipe.svg` | 128 x 44 | center | 1 | Rusty iron pipe lying sideways (cheap heavy scrap) |
| `mg_safe` | `public/assets/images/mg_safe.svg` | 96 x 96 | center | 1 | Locked safe (valuable, random money) |

Scrap uses rust browns and dull iron on purpose, so it reads as junk next to the brighter valuables. Keep that contrast if you redraw them.

## Sounds

All sounds were synthesised for this project (no samples, no licences needed). Replace any file with your own `.wav` of the same name.

| Key | File | When it plays |
|---|---|---|
| `click` | `public/assets/audio/click.wav` | Button press |
| `tick` | `public/assets/audio/tick.wav` | Claw swing tick (reserved) |
| `launch` | `public/assets/audio/launch.wav` | Claw launched |
| `reel` | `public/assets/audio/reel.wav` | Rope winch ratchet, plays in a loop while the rope moves |
| `hook` | `public/assets/audio/hook.wav` | Claw grabs something |
| `gold` | `public/assets/audio/gold.wav` | Gold collected (also star pop in the results screen) |
| `diamond` | `public/assets/audio/diamond.wav` | Diamond collected (distinct sparkle) |
| `rock` | `public/assets/audio/rock.wav` | Rock collected (dull thud) |
| `bag` | `public/assets/audio/bag.wav` | Mystery bag revealed |
| `explosion` | `public/assets/audio/explosion.wav` | Powder keg explosion |
| `blast` | `public/assets/audio/blast.wav` | Blast Cap used |
| `win` | `public/assets/audio/win.wav` | Level complete jingle |
| `lose` | `public/assets/audio/lose.wav` | Game over jingle |
| `buy` | `public/assets/audio/buy.wav` | Shop purchase |
| `deny` | `public/assets/audio/deny.wav` | Not enough money / cannot do that |
| `music_menu` | `public/assets/audio/music_menu.wav` | Menu and shop music loop (about 23 s) |
| `music_game` | `public/assets/audio/music_game.wav` | Gameplay music loop (about 17 s) |

To regenerate the placeholder art or sounds from scratch: `npm run assets:art` and `npm run assets:audio` (this overwrites your replacements, so only do it on purpose).
