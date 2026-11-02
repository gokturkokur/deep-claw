# Claw Mining Game - Phase 0: Technical Architecture

Working title: **DEEP CLAW** (placeholder - pick your own; do not use "Gold Miner" in the name, icon or store listing).
Engine: GDevelop 5 (desktop app), no JavaScript events.
Target: Android, portrait 9:16, low-end devices first.

This document is the reference for every later phase. Names written in `code style` are the exact names to type into GDevelop. Keep them identical, because every later event-sheet instruction will use them.

---

## 1. Technical architecture

### 1.1 Core principles

1. **One gameplay scene for all levels.** `Game` is a single scene. Each level is an *External layout* (`Level_01`, `Level_02`...) that only contains object placements. The scene loads the right layout at start. You design levels visually, and all logic lives in one place.
2. **Overlays are layers, not scenes.** Pause, Level Complete and Game Over are layers inside `Game`. Switching scenes destroys the current level state; showing a layer does not.
3. **Data drives behavior.** Every number you will want to tune (speeds, values, weights, targets, timers) is a variable, never typed directly into an event.
4. **State machines, not flags.** The claw has exactly one `State` at a time (`Swing`, `Extend`, `Retract`). The level has one `GameState` (`Intro`, `Playing`, `Paused`, `Won`, `Lost`). Every event checks the state first. This prevents 90% of "two things happen at once" bugs.
5. **Frame-rate independent.** Every movement is multiplied by `TimeDelta()` (seconds since last frame). The game must play the same at 30 FPS and 60 FPS.
6. **Create nothing per frame.** Collectibles are placed once per level. Effects reuse a small number of objects. The only deletions are collectibles that reach the surface.

### 1.2 Project settings (set these first)

| Setting (Project properties) | Value | Why |
|---|---|---|
| Game resolution | 720 × 1280 | 9:16 base, sharp enough, light on memory |
| Resize mode | Keep the same width and adapt the height | Taller phones (19.5:9, 20:9) show extra area above and below instead of black bars, so backgrounds extend from y -300 to 1580 |
| Adapt game resolution at runtime | On | |
| Orientation | Portrait | |
| Scale mode | Linear (smooth) for painted art, Nearest for pixel art | |
| Minimum FPS | 20 (default) | Caps `TimeDelta()` so a lag spike cannot teleport the claw |
| Maximum FPS | 60 | |
| Pixel rounding | Off (smooth claw movement) | |

**Safe zone rule:** all gameplay-critical content stays inside x 0-720, y 0-1280. Extra height on tall phones is decorative sky (top) and soil (bottom) only. HUD elements use the *Anchor* behavior to stick to screen edges, with 48 px margin at the top for notches and status bars.

### 1.3 Layers in the `Game` scene (bottom to top)

| Layer | Contents | Camera |
|---|---|---|
| `Background` | Sky strip, soil texture, rock decorations | Static |
| `Base` (GDevelop's default "Base layer", already exists, has no name) | Collectibles, obstacles, winch, rope, claw, particles | Static |
| `HUD` | Money, target, timer, level number, pause button | Static |
| `Overlay` | Pause panel, Level Complete panel, Game Over panel (hidden by default) | Static |

### 1.4 Event-sheet organization

The `Game` scene event sheet is divided into **groups** (right-click → Add group), each collapsible. Larger groups are moved into **External events** so other scenes can reuse them.

```
Game (scene events)
├── [Group] 00 INIT            - At beginning of scene: load level data, load layout, reset variables
├── [Group] 10 INPUT           - Tap detection, ignores taps on HUD buttons
├── [Group] 20 CLAW            - Link external events: EV_Claw
│     ├── Swing
│     ├── Extend
│     ├── Retract
│     └── Draw rope + place claw (runs every frame, all states)
├── [Group] 30 GRAB            - Collision / raycast, attach object
├── [Group] 40 DELIVERY        - Object reaches surface: add money, effects, delete object
├── [Group] 50 TIMER & END     - Countdown, win/lose check
├── [Group] 60 HUD             - Update texts only when values change
├── [Group] 70 OVERLAYS        - Pause, Complete, Game Over buttons
└── [Group] 90 DEBUG           - Visible only when DebugMode = true
```

External events (shared):

| Name | Used by | Purpose |
|---|---|---|
| `EV_Claw` | Game | All claw movement math |
| `EV_Save` | Game, LevelSelect, Settings | Write / read save data |
| `EV_Audio` | All scenes | Apply music/SFX settings, play music |
| `EV_ButtonFX` | All menu scenes | Button press scale animation + click sound |

Groups 10-50 sit inside a parent condition **`GameState` = "Playing"** so pausing simply stops them from running.

### 1.5 Data flow

```
Global variables (survive scene changes)          Storage (survives app restart)
  Levels[]  ── level definitions                    "deepclaw_save" / "data"  ← ToJSON(Save)
  Save      ── progress, best scores, settings  ◄──► loaded once in Boot scene
  CurrentLevel

Game scene start:
  Levels[CurrentLevel] → Target, TimeLimit → scene variables
  Create objects from external layout "Level_" + two-digit CurrentLevel
Game end:
  Money, stars → Save → Storage
```

### 1.6 Asset folder structure

```
DeepClaw/
├── game.json                 (the GDevelop project)
├── assets/
│   ├── sprites/claw/         claw_open.png, claw_closed.png
│   ├── sprites/items/        gold_s.png, gold_l.png, chest.png, diamond.png, stone_s.png, stone_l.png, bag.png
│   ├── sprites/env/          soil_tile.png, sky.png, winch_*.png
│   ├── ui/                   panel.png (9-slice), btn_*.png, icons
│   ├── fonts/                one display font, one UI font (both with OFL / free commercial licence)
│   ├── sfx/                  .ogg (or .mp3) short effects
│   └── music/                .ogg/.mp3 loops
└── docs/                     these phase documents
```

Your After Effects skills apply directly: claw open/close, winch spin, sparkles and the mystery-bag reveal can be animated in AE and exported as PNG sequences (12-15 fps, small frame counts).

---

## 2. Scenes

| # | Scene | Purpose | Notes |
|---|---|---|---|
| 1 | `Boot` | Load save from Storage into `Save`, apply settings, show logo 1 s, go to `MainMenu` | Runs once per app start. The only place that reads Storage. |
| 2 | `MainMenu` | Play, Levels, Settings | Play = continue at highest unlocked level. First tap here also unlocks audio. |
| 3 | `LevelSelect` | Grid of level buttons with lock state and stars | Built from `Save.Unlocked` and `Save.Stars[]` |
| 4 | `Settings` | Music on/off, SFX on/off, vibration on/off, reset progress (with confirm) | Saves on leaving |
| 5 | `Game` | All gameplay + layers `HUD`, `Overlay` | Overlays: `Pause`, `Complete`, `GameOver` |

Screens 4-6 from your list (Pause, Level Completed, Game Over) are **panels on the `Overlay` layer of `Game`**, so the scene count stays at 5.

External layouts (levels): `Level_01` ... `Level_15` for the first release. Each one only contains collectibles and obstacles placed on the `Base` layer.

---

## 3. Game objects

Naming: PascalCase, no spaces. UI objects start with `UI_`, buttons with `Btn_`.

### 3.1 Gameplay objects (Game scene)

| Object name | GDevelop type | Purpose |
|---|---|---|
| `Claw` | Sprite (animations `Open`, `Closed`) | The hook. Origin point AND Center point at the rope attachment (top). Custom point `Grab` between the jaws. |
| `Rope` | Shape painter | Draws the cable from pivot to claw every frame (1 draw call, no rotation maths). |
| `Winch` | Sprite (animations `Idle`, `Reel`) | Machine at the top that "pulls". Original design: a mechanical winch / mining rig, not a character copy. |
| `GoldSmall` | Sprite | Collectible |
| `GoldLarge` | Sprite | Collectible |
| `GoldChest` | Sprite | Collectible |
| `Diamond` | Sprite | Collectible |
| `StoneSmall` | Sprite | Collectible (low value, slow) |
| `StoneLarge` | Sprite | Collectible (near-zero value, very slow) |
| `MysteryBag` | Sprite | Collectible, random reward |
| `Bedrock` | Sprite | Obstacle (Phase 5): claw bounces back empty |
| `Critter` | Sprite | Optional moving obstacle (Phase 5): walks left/right, low value, can be grabbed |
| `SoilBG` | Tiled sprite | Background soil texture |
| `SparkFX` | Particle emitter | Pickup/delivery sparkle, *one instance, moved and re-fired* |
| `FloatText` | Bitmap text | "+250" popup at the surface (max 3 instances alive) |

**Object group `Collectibles`:** GoldSmall, GoldLarge, GoldChest, Diamond, StoneSmall, StoneLarge, MysteryBag, Critter.
Every member declares the same object variables (section 4.3). Then all grab/delivery events are written once, for the group.

**Collision masks:** use a simple rectangle or polygon slightly *smaller* than the visible art on every collectible (players forgive near-misses, not "it touched air"). Claw mask: a small box around the jaws only, not the arms.

### 3.2 HUD objects (Game scene, `HUD` layer)

| Object | Type | Notes |
|---|---|---|
| `UI_MoneyText` | Bitmap text | "$ 1250" |
| `UI_TargetText` | Bitmap text | "Target $ 2000", turns green when reached |
| `UI_TimeText` | Bitmap text | "45", flashes red under 10 s |
| `UI_LevelText` | Bitmap text | "Level 3" |
| `Btn_Pause` | Sprite (or Panel sprite button) | 96 × 96 minimum |
| `UI_TopBar` | Panel sprite (9-slice) | Background strip behind HUD |

Bitmap text is used for numbers because normal Text objects rebuild a texture every time their content changes, which is expensive on low-end phones.

### 3.3 Overlay objects (Game scene, `Overlay` layer)

| Object | Type |
|---|---|
| `UI_Dim` | Sprite, black 1×1 pixel stretched full screen, 60 % opacity |
| `UI_Panel` | Panel sprite (9-slice) |
| `UI_PanelTitle` | Text ("Paused", "Level Complete", "Out of Time") |
| `UI_PanelInfo` | Text (score, target, stars) |
| `UI_Star` | Sprite (animations `Empty`, `Full`) × 3 instances |
| `Btn_Resume`, `Btn_Restart`, `Btn_Next`, `Btn_Menu` | Sprite buttons, min 320 × 110 |

### 3.4 Menu scene objects

| Scene | Objects |
|---|---|
| MainMenu | `UI_Logo`, `Btn_Play`, `Btn_Levels`, `Btn_Settings`, `SoilBG`, decorative `Claw` swinging (reuses the swing maths) |
| LevelSelect | `Btn_LevelTile` (sprite, animations `Locked`, `Open`), `UI_TileNumber` (bitmap text), `UI_TileStars` (sprite, animations `0`-`3`), `Btn_Back` |
| Settings | `Btn_Toggle` (animations `On`, `Off`, instance variable `Setting` = "Music"/"Sfx"/"Vibration"), `UI_Label` texts, `Btn_Reset`, `Btn_Back` |

All buttons: minimum **96 × 96 px** at 720 width (≈ 48 dp on a real phone), 24 px spacing between them.

### 3.5 Behaviors used

| Behavior | On | For |
|---|---|---|
| Anchor | HUD objects, `Btn_Pause` | Stick to screen edges on any aspect ratio |
| Tween | Buttons, panels, `FloatText`, `Claw` scale | All UI animation and juice (Phase 6) |
| (none) Physics | - | **Not used.** The claw is kinematic: we move it with maths. Physics engines are unpredictable and heavier. |

---

## 4. Variables and data types

GDevelop types: **Number**, **String (text)**, **Boolean**, **Structure** (named children), **Array** (indexed children).

### 4.1 Global variables (Project → Global variables)

| Name | Type | Default | Meaning |
|---|---|---|---|
| `CurrentLevel` | Number | 1 | Level being played (1-based) |
| `DebugMode` | Boolean | false | Shows collision masks + state text |
| `Levels` | Array of Structure | see 4.4 | Level definitions |
| `Save` | Structure | | Everything written to disk |
| `Save.Version` | Number | 1 | Lets us change the save format later without crashes |
| `Save.Unlocked` | Number | 1 | Highest level unlocked |
| `Save.Best` | Array of Number | [] | Best money per level (index 0 = level 1) |
| `Save.Stars` | Array of Number | [] | 0-3 per level |
| `Save.TotalGold` | Number | 0 | Lifetime money (reserved for a future shop) |
| `Save.Music` | Boolean | true | |
| `Save.Sfx` | Boolean | true | |
| `Save.Vibration` | Boolean | true | |

### 4.2 Scene variables (`Game`)

| Name | Type | Default | Meaning |
|---|---|---|---|
| `GameState` | String | "Intro" | Intro / Playing / Paused / Won / Lost |
| `Money` | Number | 0 | Earned this level |
| `Target` | Number | 0 | Copied from `Levels[...]` |
| `TimeLeft` | Number | 0 | Seconds, counts down with `TimeDelta()` |
| `ItemsLeft` | Number | 0 | Count of `Collectibles` on screen; level ends early at 0 |
| `PivotX` | Number | 360 | Where the rope hangs from |
| `PivotY` | Number | 230 | |
| `SwingAmplitude` | Number | 70 | Degrees left/right from straight down |
| `SwingSpeed` | Number | 2.4 | Radians per second of the swing phase (2.4 ≈ 2.6 s per full cycle) |
| `MinLength` | Number | 60 | Rope length at rest |
| `MaxLength` | Number | 1400 | Safety limit |
| `ExtendSpeed` | Number | 600 | px/s going down |
| `EmptyRetractSpeed` | Number | 1000 | px/s coming back with nothing |
| `BaseRetractSpeed` | Number | 650 | px/s coming back with a weight-1 object |
| `StrengthBonus` | Number | 1 | Multiplier for power-ups (1 = none) |
| `HudDirty` | Boolean | true | Set true when a HUD value changes; HUD redraws once then resets it |
| `LastTimeShown` | Number | -1 | Whole seconds last written to `UI_TimeText` |

### 4.3 Object variables

**`Claw`**

| Name | Type | Default | Meaning |
|---|---|---|---|
| `State` | String | "Swing" | Swing / Extend / Retract |
| `Phase` | Number | 0 | Swing phase in radians (advances only while swinging) |
| `Angle` | Number | 90 | Current direction in degrees (90 = straight down) |
| `Length` | Number | 60 | Current rope length in px |
| `TipX`, `TipY` | Number | 0 | Calculated tip position (rope end) |
| `PrevTipX`, `PrevTipY` | Number | 0 | Tip position last frame (for raycast) |
| `HasItem` | Boolean | false | |
| `ItemWeight` | Number | 0 | Copied from grabbed object |
| `ItemValue` | Number | 0 | Copied from grabbed object |
| `ItemType` | String | "" | Copied from grabbed object |

**Every object in `Collectibles`** (same names on each object, different defaults)

| Name | Type | Meaning |
|---|---|---|
| `Type` | String | "GoldSmall", "Diamond"... used for sound/effect choice |
| `Value` | Number | Money on delivery |
| `Weight` | Number | Retrieval divider. 1 = light. Higher = slower |
| `IsCarried` | Boolean | true only for the one object hanging on the claw |
| `HoldOffset` | Number | Distance from `Grab` point to the object's centre (≈ half its height) |
| `ValueMin`, `ValueMax` | Number | MysteryBag only (others 0) |

Default values (starting point, tuned in Phase 5):

| Object | Value | Weight | Size (px) | Retrieve time at 700 px* |
|---|---|---|---|---|
| GoldSmall | 50 | 1.0 | 48 | 1.1 s |
| GoldLarge | 250 | 2.5 | 110 | 2.7 s |
| GoldChest | 600 | 4.0 | 130 × 100 | 4.3 s |
| Diamond | 500 | 1.3 | 44 | 1.4 s |
| StoneSmall | 20 | 2.5 | 70 | 2.7 s |
| StoneLarge | 10 | 5.0 | 140 | 5.4 s |
| MysteryBag | 30-700 random | 1.5 | 64 | 1.6 s |

\*700 px = typical mid-screen distance. Instances can override any default in the instance properties panel (e.g. one extra-valuable chest).

### 4.4 Level definition (`Levels`, Array of Structure)

Each child:

| Child | Type | Example |
|---|---|---|
| `Target` | Number | 650 |
| `Time` | Number | 60 |
| `Layout` | String | "Level_01" |
| `Star3` | Number | 1.6 (3 stars if Money ≥ Target × 1.6) |

`Levels[0]` is Level 1 (GDevelop arrays start at 0, so we read `Levels[CurrentLevel - 1]`).

---

## 5. Claw rotation and retrieval mathematics

### 5.1 Coordinate system

GDevelop: x grows to the right, **y grows downward**, angles in degrees, **0° = pointing right, 90° = pointing down**, 180° = pointing left. `sin()` and `cos()` take **radians**, so we convert with `ToRad(angle)`.

```
            PivotX,PivotY (360,230)
                   ●
                  /|\
          20° ..  / | \  .. 160°
                 /  |  \
           angle=160  90  20   (only 20°...160° are used)
```

### 5.2 Swing (State = "Swing")

We do not add or subtract a fixed speed and "bounce" at the edges. We use a sine wave:

```
Phase  = Phase + SwingSpeed × TimeDelta()
Angle  = 90 + SwingAmplitude × sin(Phase)
```

- `sin()` gives a smooth value between -1 and 1, so `Angle` moves between 90-70 = **20°** and 90+70 = **160°**.
- It moves fastest at the centre and slows at the edges, like a real pendulum. That looks natural and makes edge shots aimable.
- Full cycle time = 2π / SwingSpeed = 6.283 / 2.4 ≈ **2.6 s**. Higher `SwingSpeed` = harder levels.
- `Phase` only advances while swinging. When the claw comes back, swinging resumes from the exact same angle with no jump.
- To prevent `Phase` growing forever: when `Phase` > 6.2832, subtract 6.2832 (one full turn).

### 5.3 Tip position (every frame, every state)

```
TipX = PivotX + Length × cos(ToRad(Angle))
TipY = PivotY + Length × sin(ToRad(Angle))
```

Example: Angle 120°, Length 500 → cos(120°) = -0.5, sin(120°) = 0.866
TipX = 360 + 500 × -0.5 = **110**, TipY = 230 + 500 × 0.866 = **663**.

Then:
- `Rope`: clear, then draw a line from (PivotX, PivotY) to (TipX, TipY), thickness 6. (Draw a 10 px dark line, then a 4 px lighter one on top for a cable look.)
- `Claw`: position = (TipX, TipY), angle = `Angle - 90`. (The art is drawn pointing down, which is 90° in GDevelop, so we subtract 90.) Because the Claw's origin and centre points are both at the rope attachment, it rotates around the rope end, not around its middle.

### 5.4 Launch (tap)

Conditions: `GameState` = "Playing" AND `Claw.State` = "Swing" AND a new touch started AND the touch is not on `Btn_Pause`.
Action: `Claw.State` = "Extend". `Angle` is frozen automatically because only the Swing events change it.

### 5.5 Extend (State = "Extend")

```
PrevTip = Tip
Length  = Length + ExtendSpeed × TimeDelta()
(recompute Tip)
```

Switch to `Retract` (empty) when any of these is true:
- TipX < 0 or TipX > 720 (left/right edge)
- TipY > SceneBottom (use `CameraBorderBottom()` so tall phones work)
- Length ≥ MaxLength
- Claw collides with `Bedrock` (Phase 5)

### 5.6 Grab (collision)

Two-layer detection, so fast claws never pass through small objects:

1. **Raycast** (built-in condition "Raycast") from (PrevTipX, PrevTipY) towards `Angle` for distance `ExtendSpeed × TimeDelta()` against `Collectibles`. A ray covers the *whole path* travelled this frame, not just the end point. Raycast picks the **closest** hit.
2. **Fallback**: `Claw` in collision with `Collectibles` → *Pick nearest* `Collectibles` to (TipX, TipY).

When either fires (and `Claw.HasItem` = false):
```
Collectibles.IsCarried = true
Claw.HasItem      = true
Claw.ItemWeight   = Collectibles.Weight
Claw.ItemValue    = Collectibles.Value
Claw.ItemType     = Collectibles.Type
Claw.State        = "Retract"
Claw animation    = "Closed"
```
Only **one** object can be grabbed per launch, because the condition requires `State` = "Extend" and the action immediately leaves that state.

Why per-frame movement matters: at 600 px/s and 60 FPS the claw moves 10 px per frame; at 20 FPS it moves 30 px per frame. A 44 px diamond could be skipped by a point check at very low frame rates. The raycast closes that gap.

### 5.7 Retract (State = "Retract")

```
If HasItem:  RetractSpeed = BaseRetractSpeed × StrengthBonus / ItemWeight
Else:        RetractSpeed = EmptyRetractSpeed
Length = Length - RetractSpeed × TimeDelta()
```

Carried object follows the claw every frame (pick `Collectibles` with `IsCarried` = true):
```
centreX = Claw.PointX("Grab") + HoldOffset × cos(ToRad(Angle))
centreY = Claw.PointY("Grab") + HoldOffset × sin(ToRad(Angle))
Object X = centreX - Object.Width() / 2
Object Y = centreY - Object.Height() / 2
```
(This keeps the object hanging *below* the jaws along the rope direction. Keep the origin of collectibles at the default top-left so this formula stays correct.)

Weight → time, at 700 px distance:

| Weight | Speed (650 / W) | Return time |
|---|---|---|
| 1.0 | 650 px/s | 1.1 s |
| 1.3 | 500 px/s | 1.4 s |
| 2.5 | 260 px/s | 2.7 s |
| 4.0 | 163 px/s | 4.3 s |
| 5.0 | 130 px/s | 5.4 s |

### 5.8 Delivery (Length ≤ MinLength)

```
Length = MinLength
If HasItem:
    Money = Money + ItemValue        (MysteryBag: RandomInRange(ValueMin, ValueMax), or a bonus)
    play sound by ItemType, fire SparkFX, show FloatText "+value"
    delete the Collectibles with IsCarried = true
    ItemsLeft = ItemsLeft - 1
    HasItem = false, HudDirty = true
Claw.State = "Swing", animation "Open"
```

### 5.9 Economy check: money per second

A throw costs extend time + return time. Extend to 700 px ≈ 1.17 s.

| Item | Cycle time | Money / second |
|---|---|---|
| GoldSmall | 2.3 s | 22 |
| GoldLarge | 3.9 s | 65 |
| GoldChest | 5.5 s | 109 |
| Diamond | 2.6 s | **195** (best: rare, small, hard to hit) |
| StoneSmall | 3.9 s | 5 |
| StoneLarge | 6.6 s | **1.5** (trap) |

This is the design core: skill = hitting small valuable targets and avoiding stones that sit in front of them. In Phase 5 every level target is set from this table (e.g. Level 1: 60 s, with ~1 s aiming per throw, ≈ 12-15 throws; target 650 = a couple of large nuggets plus small ones).

### 5.10 Countdown and level end

```
TimeLeft = TimeLeft - TimeDelta()         (only while GameState = "Playing")
```
End conditions (checked only when `Claw.State` = "Swing", so a pull in progress always finishes; that feels fair):
- `TimeLeft` ≤ 0, or
- `ItemsLeft` = 0

Then: `Money` ≥ `Target` → `Won`, otherwise `Lost`. While `TimeLeft` ≤ 0 new launches are blocked.

### 5.11 Pause

Pause = `GameState` = "Paused" + show `Overlay` panel. Because groups 10-50 only run when `Playing`, and the timer is a variable reduced by `TimeDelta()` inside those groups, everything freezes with no scene timers to pause. Tweens on the Overlay layer keep animating.

---

## 6. Development roadmap

Rule: a phase is "done" only when its test checklist passes on your phone (GDevelop network preview or a debug APK), not only on the computer.

| Phase | Deliverable | Depends on | Done when |
|---|---|---|---|
| **1 - Architecture & scenes** | Project created with settings from 1.2, 5 empty scenes, layers, global variables, placeholder art (coloured rectangles are fine), scene navigation buttons working | - | Tapping through Boot → Menu → LevelSelect → Game → back works on phone |
| **2 - Claw** | Swing, tap launch, extend, edge detection, empty retract, rope drawing | 1 | Claw swings smoothly, every tap launches exactly once, returns from every edge, never gets stuck |
| **3 - Collection** | Collectibles group, raycast grab, carry, weight-based retract, delivery, deletion | 2 | Each item type grabs reliably, heavy ones are visibly slower, never 2 items at once |
| **4 - Scoring & targets** | Money, target, countdown, HUD, win/lose logic, Level Complete/Game Over panels (plain) | 3 | Win and lose both reachable; timer correct at 30 and 60 FPS |
| **5 - Levels & balance** | `Levels` data, 15 external layouts, MysteryBag, Bedrock, Critter, stars, save/unlock | 4 | Level 1 winnable by a new player with no instructions; difficulty rises without spikes; progress survives app restart |
| **6 - Menus, UI, animation** | Final UI art, LevelSelect grid, Settings, button tweens, claw/winch animations, transitions | 5 | Every screen usable with one thumb; no button under 96 px |
| **7 - Audio, polish, optimisation** | SFX + music, particles, screen shake on heavy pulls, vibration, profiler pass | 6 | Stable 60 FPS (min 30) on your weakest test phone; no sound overlaps |
| **8 - Android & Play release** | Signed AAB, icon, store listing, privacy policy, closed test, production | 7 | App live on Google Play |

Suggested first-release scope: **15 levels**. Shop, upgrades, daily rewards, ads and in-app purchases are deliberately out of scope until the core loop is fun. `Save.TotalGold` is already stored so a shop can be added later without breaking saves.

---

## 7. Biggest technical risks

| # | Risk | What goes wrong | Mitigation (built into this architecture) |
|---|---|---|---|
| 1 | **Frame-rate dependence** | Game is faster on good phones, timer drifts | Every speed × `TimeDelta()`; timer is a variable, not "every frame minus 1" |
| 2 | **Collision tunnelling** | Claw passes through a small diamond on a laggy frame | Raycast along the path + Minimum FPS 20 + small items ≥ 44 px |
| 3 | **Double grabs / wrong object** | Two overlapping items, both attached, or the far one is picked | State machine (grab only in `Extend`), *Pick nearest*, `IsCarried` flag on exactly one instance |
| 4 | **Tap problems** | Pause button also launches the claw; one tap fires twice | Single "new touch started" condition, ignore taps on HUD buttons, launch only in `Swing` |
| 5 | **Event-sheet spaghetti** | After 3 phases nobody (including AI) can follow the logic | Fixed groups 00-90, external events, exact names from this doc, one state variable |
| 6 | **Low-end performance** | Stutter on cheap phones | Bitmap text for numbers, HUD updates only on change, no Physics, few particles, textures ≤ 1024 px each, collision checks only during `Extend` |
| 7 | **Different screen shapes** | HUD under the notch, black bars, cropped items | Adapt-height resize mode, Anchor behavior, safe zone 720×1280, `CameraBorderBottom()` for the bottom edge |
| 8 | **Android audio** | No sound until first tap, delay on effects, music restarts | Start music after first menu tap, short .ogg/.mp3 SFX preloaded, music on a fixed channel, check `Save.Music` before playing |
| 9 | **App backgrounded** | Timer keeps running or audio keeps playing when a call comes in | Auto-pause when the game loses focus (verified in Phase 7 on device) |
| 10 | **Save corruption / format change** | Update wipes progress or crashes on old save | Single JSON blob with `Save.Version`; Boot checks the version and fills missing fields with defaults |
| 11 | **Level edge cases** | Time ends mid-pull; last item delivered at 0.0 s; all items gone early | End check only in `Swing` state; `ItemsLeft` early finish; rules in 5.10 |
| 12 | **Google Play requirements** | Can't publish to production | New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before production access. Also needed: privacy policy URL, Data safety form, content rating, target API level (GDevelop's Android export keeps this current, so use the latest GDevelop version). Start recruiting testers at Phase 6. |
| 13 | **IP / trademark** | Rejection or takedown for resembling the original | Original name, original miner/winch design, own level layouts and sounds, no "Gold Miner" in the title or keywords |
| 14 | **Instructions vs your GDevelop version** | Menu names in instructions differ from what you see | Tell me your GDevelop version; send a screenshot whenever a menu item doesn't match and I'll adapt the step |
| 15 | **Scope creep** | Polishing features before the claw feels good | Phase gates: nothing from Phase 6-7 before Phase 3 feels fun with rectangles |
