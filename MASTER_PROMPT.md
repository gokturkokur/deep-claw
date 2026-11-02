# MASTER PROMPT - Deep Claw (Phaser 3 build)

> This file is the single source of truth for building the game. If anything in the repo contradicts it, this file wins. `CLAUDE.md` holds the working rules; this file holds the product.

## ROLE

You are a senior HTML5 game developer, game designer and technical director. You build polished, commercially viable 2D arcade games for mobile.

The owner of this repo is a motion designer with no programming knowledge. **You write 100% of the code.** Never ask them to write, edit or debug code. Work autonomously and make reasonable technical decisions yourself.

## FINAL OBJECTIVE

A complete, polished, playable mobile-first arcade game built around the classic "swinging claw" mining loop (the genre made famous by Gold Miner), with an **original identity**: original name, art, sounds, item names and level layouts.

The owner must be able to open the game, play through multiple levels, buy items in the shop, lose, restart, close the browser, come back and continue with their money, inventory and unlocked levels intact.

It must be a real game, not a prototype, mockup or demonstration. **Never claim a feature works if it is only visually represented.**

---

## 1. Identity and originality (hard rules)

- Working title: **DEEP CLAW**. Use it in the menu, page title and `package.json`.
- Do **not** copy art, logos, character designs, sounds, code, level layouts or item names from any Gold Miner release.
- The player character is an **original cartoon character**: a stocky mining-rig operator with a headlamp helmet and goggles, operating a mechanical winch. Not an old man with a beard, not a copy of any existing mascot.
- The shop uses the original item names in section 5, not the names from the classic game.

## 2. Tech stack

- **Phaser 3** (latest 3.x, exact version pinned in `package.json`), **TypeScript** (strict), **Vite**.
- No other runtime dependencies. Dev dependencies allowed: Vitest, Playwright, ESLint/Prettier if useful.
- `vite.config.ts` must use `base: './'` so the `dist/` build runs from any folder, any URL subpath and inside Capacitor without changes.
- Scripts: `npm run dev`, `npm run build`, `npm run preview`, `npm test` (unit), `npm run test:e2e` (browser).
- Prepare for **Capacitor** (Android) packaging, but do not add Capacitor packages yet. Write the steps in `docs/ANDROID.md`.

## 3. Screen and input

- Portrait. Logical design resolution **720 × 1280**. Use `Phaser.Scale.EXPAND` (or FIT plus background extension) so there are **no black bars** on 19.5:9, 20:9 and tablet screens. All gameplay-critical content stays in the 720 × 1280 safe area; extra space shows decorative sky (top) and soil (bottom).
- The HUD respects notches: keep 48 logical px of top margin, and use `env(safe-area-inset-*)` in CSS where relevant.
- Touch: tap anywhere in the play area to launch. HUD buttons must **not** also launch the claw.
- Desktop testing: **Space** or **Down arrow** = launch, **D** = use Blast Cap, **P** or **Esc** = pause, mouse click = launch.
- Buttons: minimum 96 × 96 logical px, clear pressed state, click sound.
- Pause automatically when the page or app loses visibility (`visibilitychange`, `blur`), and mute audio while hidden.

## 4. Gameplay specification

### 4.1 Claw state machine (most important system)

States: `Swinging → Launching → (Hooked | Missed) → Retracting → Collecting → Swinging`.
Exactly one state at a time. Every transition is explicit and unit tested. No impossible states (e.g. hooked with nothing attached, two objects hooked, launch while retracting).

- **Swinging:** pendulum with `angle = 90° + amplitude × sin(phase)`, `phase += swingSpeed × dt`. Amplitude about 70°, about 2.6 s per full cycle (configurable). Fastest in the centre, slows at the edges. The phase freezes while launched and resumes from the same angle (no jump).
- **Launching:** rope length grows at `extendSpeed` px/s along the frozen angle. Tip position = pivot + length × (cos, sin).
- **Collision:** **swept detection** every frame, as a segment from the previous tip to the current tip against every object's collision shape (circles and rectangles slightly smaller than the art). The first object along the segment wins. This guarantees no tunnelling at low frame rates. Use custom maths, not Arcade/Matter physics, for the claw.
- **Missed:** the tip leaves the play area (left, right, bottom) or reaches max length → retract empty at a fast speed.
- **Hooked:** attach the first object hit. It hangs below the claw jaws along the rope direction and follows every frame. An object can be hooked only once and collected only once.
- **Retracting:** `speed = baseRetractSpeed × strengthMultiplier / weight`. Empty: fast fixed speed.
- **Collecting:** at the surface add value, play feedback (sound, particles, floating "+$value", money counter tick-up), remove the object, return to Swinging.
- **Time step:** clamp `dt` to at most 50 ms so a lag spike cannot teleport the claw. All movement is frame-rate independent.
- The claw and rope must never teleport. The rope visually extends and retracts with a winch animation.

### 4.2 Objects (all values and weights in the central config)

| Object | Value | Weight (retract divider) | Notes |
|---|---:|---:|---|
| Small gold | $100 | 1.2 | |
| Medium gold | $250 | 2.2 | |
| Large gold | $500 | 4.0 | |
| Diamond | $600 | 1.0 | Small hitbox, hard to hit |
| Small rock | $10 | 3.0 | Value boosted by Ore Crusher |
| Large rock | $20 | 5.5 | Obstacle that blocks paths |
| Mystery bag | random | 1.0-4.0 random | Outcomes in config: money, a free item, or a strength boost. Lucky Lantern improves the odds |
| Powder keg | special | n/a | When hit, explodes: destroys every object in a radius (not collected), claw returns with nothing. Chain reactions with other kegs |
| Burrow beetle | $50 (or carries a diamond: $650) | 1.0 | Moving obstacle from mid-game levels on: walks left/right in a lane |

Each object: unique original look, idle micro-animation (sparkle, wobble), collision shape, pull speed from weight, collection animation and value popup.

Tune weights so pull times feel like this at mid-screen distance: light about 1 s, medium about 2 s, heavy 4-6 s. Rocks must be a clear trap; diamonds must be the best money per second.

### 4.3 Level rules

- **60-second** countdown per level.
- **Per-level target:** the player must earn the level's target **during that level**. Money earned is also added to the wallet (shop currency). Failing a level does **not** add that attempt's earnings to the wallet.
- The level ends when time runs out (a pull in progress finishes first) or when no collectible objects remain.
- Win → Level Complete screen (stars, earnings), then Shop, then next level. Lose → Game Over screen (Retry, Level Select, Menu).
- Stars: 1 = target reached, 2 = 125 % of target, 3 = 150 % (configurable).

### 4.4 Levels

- At least **20 hand-designed levels** stored as data (`src/data/levels.ts` or JSON): object positions, types, target, optional modifiers.
- Difficulty rises through layout, not value inflation: more and larger rocks shielding treasure, heavier gold, diamonds in harder spots, kegs near valuables, beetles, deeper treasure, slightly faster swing in late levels.
- Level 1 teaches the game without a tutorial: mostly gold, open space, low target. Show only a short "Tap to drop the claw" hint on the first launch ever.
- Include a **balance check** (unit test or script) that, for every level, estimates the money obtainable in 60 s from object values, weights and distances, and fails if a target is impossible or trivially easy. Targets should need roughly 55-75 % of the obtainable value at the start, rising later.

## 5. Shop and items

Shown after every won level. Prices, effects and stock rules come from the central config. Some items appear with random availability so choices matter.

| Item (original name) | Effect | Suggested price |
|---|---|---:|
| **Blast Cap** | Usable during retract (button or D key): destroys the hooked object, the claw returns empty at full speed. Stackable inventory | $150-250 scaling |
| **Turbo Winch Oil** | Next level: pull speed × 1.5 | $300-500 |
| **Lucky Lantern** | Next level: better Mystery Bag outcomes | $200-400 |
| **Gem Lens** | Next level: diamond value × 1.5 | $350-600 |
| **Ore Crusher** | Next level: rock value × 3 | $50-150 |

Each item needs: price, purchase validation (cannot buy without money), inventory (Blast Caps persist; the other items apply to the next level only), a clear icon, purchase feedback, an active-effect indicator in the HUD, and a real gameplay effect covered by unit tests.

## 6. Screens

1. **Main Menu:** Play (new game, confirm if a save exists), Continue (disabled when no save), Level Select, Settings, sound toggle.
2. **Level Select:** grid of 20+ levels, lock state, stars, best score.
3. **Gameplay:** HUD with money, target (turns green when reached), timer (pulses red under 10 s), level number, pause button, Blast Cap button with count, active-item icons.
4. **Pause:** Resume, Restart level, Settings, Menu.
5. **Level Complete:** stars animation, earnings, wallet, Continue to Shop.
6. **Game Over:** earned vs target, Retry, Level Select, Menu.
7. **Shop:** items, prices, wallet, owned counts, Next Level.
8. **Settings:** music volume, SFX volume (separate sliders), vibration toggle (`navigator.vibrate` where supported), language (English / Türkçe), reset progress (with confirmation).

Smooth transitions between screens (fade or slide, 200-300 ms).

**Language:** all UI text in one strings module with English and Turkish. Default from the device language; changeable in Settings.

## 7. Visual design

- Warm underground mine: rich golds, earthy browns, deep shadows, lantern light, subtle parallax or ambient details (dust motes, dripping water, glints).
- Cartoon style, clean silhouettes, every treasure readable at a glance.
- Professional casual-game UI: custom panels, chunky readable typography (a free OFL font, bundled locally, no external CDN at runtime), consistent iconography. It must not look like a generic AI-generated interface or a school project.
- **Art pipeline (required):** author all art as original **SVG files** in `public/assets/images/` (or generate textures at boot from those SVGs). One file per sprite or frame, stable file names, loaded through a single asset manifest (`src/assets/manifest.ts`). The owner will later replace them with their own PNG/SVG art made in After Effects or Illustrator, so a replacement with the same key and size must work without code changes.
- Write `docs/ASSETS.md`: every asset key, file path, pixel size, anchor/pivot point, frame count, and what it depicts.

## 8. Sound design

- Required sounds: background music loop (menu and gameplay can differ), claw swing tick/creak, launch, rope reel loop, hook hit, gold collect, diamond collect (distinct), rock thud, mystery bag reveal, explosion, level complete, game over, button click, purchase.
- No unlicensed audio. Generate original sounds yourself: synthesize them with a Node script into small `.wav`/`.ogg` files in `public/assets/audio/` (preferred, so they can be replaced), or synthesize with WebAudio at boot. The music can be a simple original procedural loop.
- Separate **music** and **SFX** volume, persisted. Audio unlocks on first user interaction. List every sound in `docs/ASSETS.md`.

## 9. Architecture

```
src/
  main.ts                 Phaser game config, scale, scenes
  config/                 game.ts (claw, timings), economy.ts (values, weights, prices, stars), audio.ts
  data/levels.ts          20+ level definitions
  scenes/                 Boot, Preload, MainMenu, LevelSelect, Game, Pause, LevelComplete, GameOver, Shop, Settings
  systems/                Claw (state machine + maths), Collision (swept tests), LevelLoader, Economy, Inventory, SaveManager, AudioManager, Input
  objects/                Collectible types, Beetle, PowderKeg, Rope, Miner
  ui/                     Button, Panel, Slider, Toggle, HUD, FloatingText, transitions
  i18n/                   en.ts, tr.ts, index.ts
  assets/manifest.ts
tests/                    Vitest unit tests
e2e/                      Playwright tests
docs/                     ASSETS.md, ANDROID.md, REPORT.md
```

- **One central configuration** for the whole economy and feel, as described above. No magic numbers in scenes.
- Game logic (claw maths, collision, economy, inventory, save) lives in plain TypeScript modules that are testable without Phaser.
- **Save system:** `localStorage`, one versioned JSON object (`saveVersion`, unlocked level, stars and best score per level, wallet, inventory, settings). Validate on load, fill missing fields with defaults, never crash on a corrupted or old save. Save after every level, purchase and settings change.
- **Performance:** 60 FPS target on mid/low-end Android. Pool particles and floating texts, avoid per-frame allocations, update HUD text only when values change, pack or generate textures once, keep draw calls low.

## 10. Quality assurance (you must actually test)

**Unit tests (Vitest), at minimum:**
- Swing angle stays within limits; phase freezes and resumes correctly.
- Tip position maths.
- Swept collision hits small objects even with a 50 ms frame step; the first object along the path wins; nothing is hooked twice.
- Retract speed scales with weight and strength; Blast Cap destroys the object and returns the claw.
- Powder keg radius and chain reaction.
- Timer, win/lose decision, pull-in-progress grace rule, early end when the field is empty.
- Shop: cannot overspend, inventory counts, one-level effects expire, Gem Lens / Ore Crusher / Lucky Lantern / Turbo Winch Oil change outcomes.
- Save: round trip, corrupted save, old-version migration.
- Level balance check for every level.

**Browser tests (Playwright, headless Chromium):**
- The game boots without console errors.
- Menu → Level 1 → launch claw → an object is collected and money increases.
- Win a level (a test-only debug hook such as `?debug=1` exposing `window.__game` may set the money or time) → shop → buy an item → wallet decreases → next level.
- Lose a level → Game Over → Retry works.
- Reload the page → Continue restores level, wallet and inventory.
- Screenshots at 360×640, 390×844, 412×915, 768×1024 and a desktop size; check that there are no black bars, no clipped HUD and no overlapping buttons. Look at the screenshots yourself.

Fix every critical bug you find. Run `npm run build` and confirm it succeeds with no TypeScript errors.

## 11. Workflow

1. Inspect the repo (the old GDevelop plan is in `archive/gdevelop/`; its claw maths in `00-architecture.md` section 5 is a useful reference).
2. Scaffold the project and architecture.
3. Core loop: swing, launch, swept collision, hook, retract, collect, money. Test it.
4. Objects, weights, kegs, bags, beetles.
5. Levels, timer, targets, win/lose, level select, save.
6. Shop and items.
7. All menus, UI polish, transitions, i18n.
8. Art pass (SVG), animations, particles, sounds, music.
9. Full QA pass, fix bugs, performance check.
10. Docs: `README.md` (how to run, in Turkish and English), `docs/ASSETS.md`, `docs/ANDROID.md` (Capacitor + Google Play steps for a non-programmer, including the closed test with 12 testers for 14 days rule for new personal developer accounts), `docs/REPORT.md` (what is implemented, test results, known limitations, ideas for later).

- Commit after each step with a clear message. Do not stop after scaffolding.
- If a feature is too ambitious, prioritize a complete, stable, playable game over a pile of unfinished features, and list what was cut in `docs/REPORT.md`.
- When finished, push your branch and open a **pull request into `main`** with a short summary, test results and screenshots. Do not merge it yourself.

## 12. Definition of done

- `npm install && npm run build` succeeds; `npm test` and `npm run test:e2e` pass.
- All 8 screens work with touch and with mouse/keyboard.
- 20+ levels playable start to finish; shop items have real effects; progress survives a reload.
- No console errors during a full play session.
- `docs/REPORT.md` honestly lists anything that is not finished.
