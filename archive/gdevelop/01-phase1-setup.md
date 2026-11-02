# Phase 1 - Project setup, scenes and navigation

**Goal:** an empty but correctly configured project. You can tap through Boot → Main Menu → Level Select → Game → back to the menu on your phone, and the Game scene loads Level 1 from an external layout.

**No gameplay yet.** The claw comes in Phase 2.

**Time:** about 1.5-2 hours if this is your first time in GDevelop.

**Assumption:** a recent GDevelop 5 desktop version (2025-2026). If a menu name below doesn't match what you see, send me a screenshot and I'll adjust the step.

**Placeholder art is ready.** I generated every image Phases 1-5 need in `gold-miner-game/DeepClaw/assets/` (sprites, buttons, panel, stars, logo). They are simple shapes. You'll replace them with real art in Phase 6, and because file names stay the same, no events will need changing.

---

## Step 1 - Install and create the project

1. Download or update GDevelop from **gdevelop.io/download**. Open it and write down the version (top menu **Help → About GDevelop**).
2. On the Home screen, choose **Create** → start a **new empty project** (often shown as "Empty project" or "Blank").
   - If the dialog asks for orientation or resolution, choose **Portrait** / mobile.
   - **Name:** `DeepClaw`
   - **Location:** the folder `Desktop/AE/Flow İstanbul/Web/gold-miner-game/DeepClaw`
3. Check in Finder: the project file (`game.json` or `DeepClaw.json`) must sit **next to the `assets` folder**:
   ```
   DeepClaw/
   ├── game.json
   └── assets/
   ```
   If GDevelop created an extra subfolder (`DeepClaw/DeepClaw/game.json`), close GDevelop, move the `assets` folder into that subfolder, and reopen the project.
4. Save with **Cmd + S**. Do this often.

---

## Step 2 - Project properties

Open the **Project manager** (the icon at the top left, or the menu **File → Project manager**) → **Game settings** → **Properties**.

| Section / field | Set to |
|---|---|
| Name | `Deep Claw` |
| Package name | `com.yourname.deepclaw` (lowercase, no spaces. **Write it down: it can never change after the first Play Store upload.**) |
| Version | `0.1.0` |
| Author / Publisher | Your name |
| Game resolution width | `720` |
| Game resolution height | `1280` |
| Update resolution during the game to fit the screen | ✅ On |
| Game resolution resize mode | **Keep the same width and adapt the height** |
| Device orientation (mobile) | **Portrait** |
| Scale mode | **Linear** (smooth) |
| Pixel rounding | ❌ Off |
| Minimum FPS | `20` |
| Maximum FPS | `60` |

Click **Apply**.

---

## Step 3 - Global variables

Project manager → **Global variables** (some versions: Game settings → Global variables).

For each row: click **Add variable**, type the name, choose the type in the type dropdown, then set the value.

| Name | Type | Value |
|---|---|---|
| `CurrentLevel` | Number | `1` |
| `DebugMode` | Boolean | `false` |
| `Levels` | Array | (children below) |
| `Save` | Structure | (children below) |

**`Levels` children.** Select `Levels`, click the **+** on its row to add a child. Array children are numbered automatically (0, 1, 2...). Make child **0** a **Structure** with these children:

| Child of `Levels[0]` | Type | Value |
|---|---|---|
| `Target` | Number | `650` |
| `Time` | Number | `60` |
| `Layout` | String | `Level_01` |
| `Star3` | Number | `1.6` |

(Only Level 1 for now. Levels 2-15 come in Phase 5.)

**`Save` children** (all directly under `Save`):

| Child | Type | Value |
|---|---|---|
| `Version` | Number | `1` |
| `Unlocked` | Number | `1` |
| `Best` | Array | (empty) |
| `Stars` | Array | (empty) |
| `TotalGold` | Number | `0` |
| `Music` | Boolean | `true` |
| `Sfx` | Boolean | `true` |
| `Vibration` | Boolean | `true` |

---

## Step 4 - Create the 5 scenes

Project manager → **Scenes**.

1. A new project already has one scene (often "Untitled scene"). Right-click it → **Rename** → `Boot`.
2. Click **+ / Add scene** four times and rename them: `MainMenu`, `LevelSelect`, `Settings`, `Game`.
3. Right-click `Boot` → **Set as start scene** (a flag/home icon appears next to it).
4. Set a background colour for every scene: open the scene, right-click on an empty part of the canvas → **Scene properties** → **Background color** = `#2B1A10` (dark brown). This colour shows wherever no art covers the screen, so it's never ugly black.

---

## Step 5 - Layers in the `Game` scene

Open the `Game` scene. Open the **Layers** panel (a toolbar button that looks like stacked sheets, or the menu **View → Layers**).

There is already one layer called **Base layer**. Don't rename or delete it.

1. Click **Add a layer** three times. Name them `Background`, `HUD`, `Overlay`.
2. Arrange them by dragging. **The list shows the top layer first**, so the final order should be:
   ```
   Overlay        ← drawn on top
   HUD
   Base layer
   Background     ← drawn at the back
   ```

The other scenes use only the Base layer.

---

## Step 6 - Scene variables of `Game`

Project manager → right-click `Game` → **Edit variables** (some versions: open the scene, then the **Variables** button in the toolbar → Scene variables).

| Name | Type | Value |
|---|---|---|
| `GameState` | String | `Intro` |
| `Money` | Number | `0` |
| `Target` | Number | `0` |
| `TimeLeft` | Number | `0` |
| `ItemsLeft` | Number | `0` |
| `PivotX` | Number | `360` |
| `PivotY` | Number | `230` |
| `SwingAmplitude` | Number | `70` |
| `SwingSpeed` | Number | `2.4` |
| `MinLength` | Number | `60` |
| `MaxLength` | Number | `1400` |
| `ExtendSpeed` | Number | `600` |
| `EmptyRetractSpeed` | Number | `1000` |
| `BaseRetractSpeed` | Number | `650` |
| `StrengthBonus` | Number | `1` |
| `HudDirty` | Boolean | `true` |
| `LastTimeShown` | Number | `-1` |

Most of these aren't used until Phases 2-4. Creating them now means later instructions only say "use `SwingSpeed`".

---

## Step 7 - How to create an object (you'll repeat this many times)

**Sprite object:**
1. In the scene editor, in the **Objects** panel (right side), click **+ Add a new object**.
2. Choose **Sprite**.
3. Type the object name exactly (e.g. `Btn_Play`).
4. Click **Add an animation**, then click the **+** in the empty frame box → choose the PNG from `assets/...`.
5. To add a second animation (e.g. `Open` / `Closed`), click **Add an animation** again and name it in the animation's name field.
6. Click **Apply**.

**Tiled sprite object:** same, but choose **Tiled Sprite** and pick one image. It repeats the image to fill whatever size you give it.

**Text object:** choose **Text**, type the default text, set size and colour in its properties.

**Placing an instance:** drag the object from the Objects panel onto the canvas. Then, in the **Properties** panel (instance properties), type exact **X**, **Y**, and when needed **Width/Height** (tick "custom size" if needed). **Check the layer dropdown** in the instance properties and the active layer in the Layers panel. New instances go onto the layer selected there.

---

## Step 8 - Build the `Boot` scene

**Objects:**

| Object | Type | Image | Instance X, Y |
|---|---|---|---|
| `UI_Logo` | Sprite | `assets/ui/logo.png` | 80, 540 |

**Events** (open the **Boot (Events)** tab, next to the scene tab):

Click **Add a new event**. Then:

- **Condition:** click "Add condition" → search **At the beginning of the scene** → OK.
- **Action 1:** click "Add action" → search **Wait** → `1` seconds.
- **Action 2:** "Add action" → search **Change the scene** → scene name `"MainMenu"` (keep the quotes; GDevelop usually adds them).

```
┌───────────────────────────────┬──────────────────────────────────┐
│ At the beginning of the scene │ Wait 1 seconds                   │
│                               │ Change the scene to "MainMenu"   │
└───────────────────────────────┴──────────────────────────────────┘
```

Action order matters: Wait must come first.

---

## Step 9 - Build the `MainMenu` scene

**Objects:**

| Object | Type | Image | Instance X, Y | Size |
|---|---|---|---|---|
| `SoilBG` | Tiled Sprite | `assets/sprites/env/soil_tile.png` | 0, -300 | 720 × 1880 |
| `UI_Logo` | Sprite | `assets/ui/logo.png` | 80, 260 | |
| `Btn_Play` | Sprite | `assets/ui/btn_play.png` | 180, 640 | |
| `Btn_Levels` | Sprite | `assets/ui/btn_levels.png` | 180, 790 | |
| `Btn_Settings` | Sprite | `assets/ui/btn_settings.png` | 180, 940 | |

Tip: once an object like `UI_Logo` exists in one scene, you can right-click it in the Objects panel → **Copy**, and **Paste** it into another scene's Objects panel.

`SoilBG` starts at y -300 and is 1880 tall, so it also covers the extra area on tall phones (section 1.2 of the architecture).

**Events.** Each button is one event with **two conditions** and one or two actions:

| Conditions (both) | Actions |
|---|---|
| **The cursor/touch is on an object** → `Btn_Play` <br> **Mouse button released** → Left | **Change variable value** → `CurrentLevel` set to `1` <br> **Change the scene** → `"Game"` |
| The cursor/touch is on `Btn_Levels` <br> Mouse button released → Left | Change the scene → `"LevelSelect"` |
| The cursor/touch is on `Btn_Settings` <br> Mouse button released → Left | Change the scene → `"Settings"` |

Notes:
- On a phone, a finger tap counts as the left mouse button. This is on by default ("touches simulate mouse"). Don't turn it off.
- We use **released**, not pressed. That's how real menu buttons behave: you can slide your finger off to cancel.
- To find the conditions, search "cursor on object" and "mouse button released" in the condition picker.
- In older GDevelop versions the variable action is called **"Change the global variable value"** under Variables → Global.

---

## Step 10 - Build the `LevelSelect` scene

**Objects:**

| Object | Type | Image | Instance X, Y |
|---|---|---|---|
| `SoilBG` | Tiled Sprite (paste) | | 0, -300, size 720 × 1880 |
| `Btn_Back` | Sprite | `assets/ui/btn_back.png` | 40, 80 |
| `Btn_LevelTile` | Sprite, 2 animations: `Open` = `tile_open.png`, `Locked` = `tile_locked.png` | | 290, 400 |
| `UI_TileNumber` | Text, text `1`, size 56, colour white, bold | | about 340, 430 (centre it on the tile by eye) |

Only one tile for now. Phase 5 builds the full grid automatically.

**Events:**

| Conditions | Actions |
|---|---|
| Cursor/touch is on `Btn_Back` + Mouse button released | Change the scene → `"MainMenu"` |
| Cursor/touch is on `Btn_LevelTile` + Mouse button released | Change variable value → `CurrentLevel` = `1` <br> Change the scene → `"Game"` |

---

## Step 11 - Build the `Settings` scene

**Objects:**

| Object | Type | Instance X, Y |
|---|---|---|
| `SoilBG` | Tiled Sprite (paste) | 0, -300, 720 × 1880 |
| `Btn_Back` | Sprite (paste) | 40, 80 |
| `UI_SettingsTitle` | Text, `SETTINGS`, size 64, colour `#F0B428` | 200, 260 |

**Events:**

| Conditions | Actions |
|---|---|
| Cursor/touch is on `Btn_Back` + Mouse button released | Change the scene → `"MainMenu"` |

Toggles are added in Phase 6.

---

## Step 12 - Build the `Game` scene

**Objects** (pay attention to the layer column; select the layer in the Layers panel before dragging):

| Object | Type | Image | Layer | X, Y | Size |
|---|---|---|---|---|---|
| `SkyBG` | Sprite | `assets/sprites/env/sky.png` | Background | 0, -300 | 720 × 560 |
| `SoilBG` | Tiled Sprite | `soil_tile.png` | Background | 0, 260 | 720 × 1320 |
| `Winch` | Sprite, animations `Idle` = `winch_idle.png`, `Reel` = `winch_reel.png` | | Base layer | 280, 110 | |
| `UI_LevelText` | Text, `Level 1`, size 40, white, bold | | HUD | 30, 60 | |
| `Btn_Pause` | Sprite | `assets/ui/btn_pause.png` | HUD | 594, 48 | |

**Anchor behavior** (keeps HUD in the corners on every phone shape):
1. Double-click `Btn_Pause` in the Objects panel → **Behaviors** tab → **Add a behavior** → **Anchor**.
2. Set **Right edge anchor** = Window right, **Top edge anchor** = Window top. Leave left and bottom as "No anchor".
3. Do the same for `UI_LevelText` with **Left edge** = Window left, **Top edge** = Window top.

(If GDevelop asks to install the Anchor extension, accept. It's official.)

**Collectible objects for the level test** (create them in the `Game` scene's Objects panel but **don't place them in the scene**):

| Object | Image |
|---|---|
| `GoldSmall` | `assets/sprites/items/gold_s.png` |
| `GoldLarge` | `assets/sprites/items/gold_l.png` |
| `StoneLarge` | `assets/sprites/items/stone_l.png` |
| `Diamond` | `assets/sprites/items/diamond.png` |

Their variables are added in Phase 3.

---

## Step 13 - External layout `Level_01`

1. Project manager → **External layouts** → **+ Add**. Name it `Level_01`.
2. Open it. GDevelop asks which scene's objects to use → choose **Game**. (If it doesn't ask, look for "Choose the associated scene" in its toolbar or right-click menu.)
3. On the **Base layer**, place:

| Object | X, Y |
|---|---|
| `GoldSmall` | 150, 600 |
| `GoldLarge` | 480, 750 |
| `StoneLarge` | 280, 1000 |
| `Diamond` | 600, 1150 |

You'll see the Game scene's background faded behind it. That's normal and helps you place things.

---

## Step 14 - `Game` events (Phase 1 version)

Open **Game (Events)**.

**14.1 Create the group.** Click the **Add** dropdown (next to "Add a new event") → **Add a group**. Name it `00 INIT`. Every event in 14.2 goes **inside** this group (drag it in, or select the group before adding).

**14.2 Init event:**

| Condition | Actions |
|---|---|
| At the beginning of the scene | 1. **Create objects from an external layout** → name: `Levels[CurrentLevel - 1].Layout` , X: `0`, Y: `0` <br> 2. **Change the text** (of `UI_LevelText`) → set to `"Level " + ToString(CurrentLevel)` <br> 3. **Change variable value** → `GameState` set to `"Playing"` |

About the expression in action 1:
- It means: "look up item number `CurrentLevel - 1` in `Levels` and take its `Layout` text". For Level 1 that's `Levels[0].Layout` = `"Level_01"`.
- If GDevelop underlines it in red (older versions), use the old syntax instead:
  `GlobalVariableString(Levels[GlobalVariable(CurrentLevel) - 1].Layout)`

**14.3 Create a second group** named `90 TEMP`, with this event:

| Conditions | Actions |
|---|---|
| Cursor/touch is on `Btn_Pause` + Mouse button released | Change the scene → `"MainMenu"` |

This is temporary: in Phase 4 this button opens the pause menu instead.

---

## Step 15 - Test

**On the computer:**
1. Open the **Boot** scene tab (preview starts from the scene you're currently editing).
2. Click **Preview** (the ▶ play button in the toolbar).
3. Run the checklist below.

**On your phone (required before Phase 2):**
1. Click the small arrow next to Preview → **Start Network Preview (Preview over WiFi/LAN)**.
2. GDevelop shows an address like `http://192.168.1.23:2929`. If macOS asks whether to allow incoming connections, choose **Allow**.
3. Phone and Mac on the **same Wi-Fi**. Open that address in the phone's Chrome.

### Test checklist

| # | Test | Expected |
|---|---|---|
| 1 | Start preview from Boot | Logo for ~1 s, then Main Menu |
| 2 | Tap **PLAY** | Game scene opens, "Level 1" top left, pause button top right, 4 items (2 gold, 1 stone, 1 diamond) visible on the soil |
| 3 | Tap pause button | Back to Main Menu |
| 4 | Tap **LEVELS** | Level Select, one tile |
| 5 | Tap the tile | Game opens with the same Level 1 items |
| 6 | Tap **BACK** on Level Select | Main Menu |
| 7 | Tap **SETTINGS**, then **BACK** | Settings title shows, Back returns to menu |
| 8 | Press on PLAY, slide finger off, release | Nothing happens (correct "released" behaviour) |
| 9 | Go menu → game → menu → game 10 times | No slowdown, items never duplicated |
| 10 | Phone: rotate to landscape | Game stays portrait (or is letterboxed in the browser; the real app will lock portrait) |
| 11 | Phone: compare with a taller phone or resize the preview window taller | No black bars; sky above and soil below fill the extra space; HUD stays in the corners |
| 12 | Close and reopen GDevelop | All variables, scenes, layers still there |

### If something goes wrong

| Symptom | Likely cause |
|---|---|
| Stuck on Boot | Scene name typo: `"MainMenu"` must match exactly, including capital letters |
| Game scene is empty | External layout name typo in `Levels[0].Layout`, or the items were placed in the Game scene instead of in `Level_01`, or `Levels[0]` is not a Structure |
| Items appear twice | You placed them in **both** the Game scene and `Level_01`. They belong only in `Level_01` |
| Buttons don't react | The two conditions are in separate events instead of the same event, or the condition uses a different object |
| HUD hidden behind the soil | Layer order wrong (step 5) or the instance is on the wrong layer |
| Phone can't open the address | Not on the same Wi-Fi, or macOS firewall blocked it (System Settings → Network → Firewall) |

---

## Step 16 - Back up

When everything passes: close GDevelop, right-click the `DeepClaw` folder in Finder → **Compress**, and rename the zip `DeepClaw_phase1_done.zip`. Do this at the end of every phase. It's your undo button if a later phase breaks something.

---

## Report back

Send me:
1. Your GDevelop version.
2. Which checklist items passed / failed (just the numbers).
3. A screenshot of the **Game (Events)** sheet.

After that we start **Phase 2: the claw**: swing, tap to launch, extend, retract and rope drawing.
