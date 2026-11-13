# Modern Gatling Implementation Plan

> **For agentic workers:** Execute inline using superpowers:executing-plans. Bounded asset-only delegation and final independent review.

**Goal:** Replace Gatling artwork and all mission/turn variants with the supplied new form while preserving gameplay.
**Architecture:** Add a measured native profile selected only by modern-gatling visualModel; reuse the existing Gatling rig, emission and encounter interfaces. Add new body/turn/cosmetic image aliases. Legacy raw fixtures retain archived rig.
**Tech Stack:** Existing buildless JS/Canvas2D, node:test, Playwright/Chromium; no dependencies.
**Spec:** docs/superpowers/specs/2026-11-13-modern-gatling-design.md

## Global Constraints

- Foreground height126 and all four mission baseline scales1, preserve deliberate perspective.
-30Hz/two-second recoil/five-second heat and cooldown,8unguided rockets unchanged.
- Preserve original resources, other characters, worlds and four independent archived editions.
- Exact committed source/build before Sites save/deploy; preserve public audience; back up in existing GitHub repository.

## Review Focus

- Palette/silhouette continuity through all3turn views in4missions.
- Guns, heat and missiles must follow their new painted mouths, including reverse facing and crouch.
- Whole claws and wheel masks must remain clean under motion, not leave old resting fragments.
- Boss/duel/carrier/title/desert must use new profile without Striker or old Gatling crops.
- Optional Limule uses the new chassis and cannot leak to another character.

### Task1: Registered assets and model routing
Files: new src/modern-gatling-profile.js; src/gatling-art.js, src/ink-scene.js, src/enemy-styles.js, src/player-skins.js, src/ink-renderer.js; tests/modern-gatling.test.js.
- [ ] Red test actual model/4scale1; measured two guns/8rockets and planted wheels; optional image aliases.
- [ ] Create four-body atlas and4turn atlases plus beige optional body/turns. Measure profile and inspect alpha. Keep original images.
- [ ] Parameterize existing Gatling rig by profile, native dimensions/pivots/masks and rocket radius; route actual scenes/images and title thumbnail. Preserve combat engine.
- [ ] Run tests geometry/art/title/combat and inspect faithful actual native body/limbs.

### Task2: Turn continuity and validation
Files: src/character-turns.js, src/character-turn-sockets.js; tests/modern-gatling.test.js; docs/modern-gatling-art.md.
- [ ] Red tests native view/socket selection for new model, spent8socket state and finite contacts; adapt old archive-crop assertions only where actual new visual requirement supersedes them.
- [ ] Add measured true turn views/slots/legs. Keep width and height, crouch/foot baseline and rocket budget coherent. No shot during active turn.
- [ ] Build, run fullsuite once; browser all4themes/default+Limule, turn sequence/heat/rocket/crouch/encounters and phone menu. Fix observed failures, then only affected checks.
- [ ] Independent final review and resolve findings. Verify previous resource hashes untouched.

### Task3: Publish and backup
- [ ] Commit tested source and dist; package matching .openai/hosting.json+dist archive. Push exact source with hidden credential; source helper fallback retained if native helper unavailable.
- [ ] Save/deploy public site, record exact returned IDs/status, verify changed live files against build.
- [ ] Update only versions/saltik-main and root manifest/release docs in existing seradrien-png/saltik, verify all5exports/history hashes and push main. Record actual commits/deployment in recovery ledger.
