# Deep Claw - guidance for Claude

## What this repo is
An original portrait mobile arcade game in the "swinging claw mining" genre, built with **Phaser 3 + TypeScript + Vite**, later packaged for Android with Capacitor.

**`MASTER_PROMPT.md` is the product spec and the task.** Read it fully before doing anything. If anything else in the repo contradicts it, `MASTER_PROMPT.md` wins.

`archive/gdevelop/` is an abandoned earlier plan for the GDevelop engine. Do not build anything for GDevelop. Its section 5 (claw maths) is still a useful reference.

## The owner
- A motion designer (After Effects) with no programming knowledge. **You write all code.** Never ask them to write or edit code, run complex commands, or debug.
- They usually write in Turkish: answer in Turkish unless they write in English. Explain results in plain language, no jargon.
- They will replace the art and sounds later with their own files, so keep the asset pipeline (`src/assets/manifest.ts`, `docs/ASSETS.md`) clean and stable.

## Working rules
- Work autonomously through the workflow in `MASTER_PROMPT.md` section 11. Do not stop after scaffolding, and do not wait for approval between steps.
- Commit after each meaningful step. When done, push your branch and open a PR into `main`; do not merge it yourself.
- Test for real (Vitest + Playwright + looking at screenshots). Never claim a feature works unless you have tested it. Report what is unfinished in `docs/REPORT.md`.
- Originality: no Gold Miner art, names, sounds, code, logos or level layouts. Use the original item names from `MASTER_PROMPT.md` section 5.
- Economy and feel numbers live only in `src/config/`. No magic numbers in scenes.

## Writing style
- No em dashes or en dashes in docs, UI text or replies; use "-" instead.
- Plain, direct language.

## Status (update this section when it changes)
- 2026-11-02: repo restructured for the Phaser build. `MASTER_PROMPT.md` written. No game code yet.
- 2026-11-02: first full build done on branch `claude/sharp-turing-k259yo` (PR into `main`): all 8 screens, 20 levels, shop with 5 items, save system, original SVG art and synthesized audio, unit tests (Vitest) and browser tests (Playwright). See `docs/REPORT.md` for what is done, test results and known gaps.

## How things are organised
- Pure game logic (no Phaser, unit tested): `src/systems/` (Claw, Collision, Session, Economy, Shop, Progress, Save, Balance). Phaser scenes only draw and forward input.
- All numbers: `src/config/game.ts` (feel, layout) and `src/config/economy.ts` (values, weights, prices, effects).
- Levels: `src/data/levels.ts`. After changing a level run `npx vite-node tools/balance-report.ts` and `npm test` (balance check).
- Art / sound files: `public/assets/`, listed in `src/assets/manifest.ts` and `docs/ASSETS.md`. The generators in `tools/` made the first version only.
- Test hooks: open the game with `?debug=1` to get `window.__game` and `window.__dc` (session, services). Playwright tests use them.
- Software-rendered headless Chromium runs the game at about 6 fps, so browser tests step the session by code (`stepSession`) instead of waiting for real time.
- Magnet Test prototype (branch `claude/magnet-prototype`): separate one-level mode, opened from the main menu or `?mode=magnet`. Details in `docs/MAGNET_PROTOTYPE.md`. Not part of the 20-level game and does not touch the save.
