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
