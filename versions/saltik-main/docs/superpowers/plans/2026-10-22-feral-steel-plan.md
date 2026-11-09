# Feral Steel implementation plan

Spec: ../specs/2026-10-22-feral-steel-design.md

1. Write deterministic simulation acceptance tests for movement/jump, collision, weapon recharge, enemy damage, pickups, pause, restart, no timeout and boss victory. Implement `createGame`, `update`, `terrainHeight`, `PARALLAX_LAYERS` in `src/engine.js`. Run `npm test`.
2. Build `src/renderer.js` around the exact eight layer definitions, local generated imagery with procedural fallback, tank and enemy silhouettes, projectiles, particles and camera. Render at fixed logical height with adaptive landscape width.
3. Build `index.html`, `style.css`, `src/main.js` for title/briefing, HUD, accessible controls, simultaneous pointer input, keyboard, pause, mute and outcome/replay. Audio starts only after interaction. Focus/visibility loss pauses and clears held inputs.
4. Run portable Chromium QA at desktop and mobile sizes: start, shoot, jump, pause/resume, restart, touch multi-button behavior, portrait overlay, no console errors. Run deterministic end-to-end simulation to victory and assess expected run length. Inspect screenshots.
5. Prepare buildless `dist/` using `scripts/build.mjs`, document commands and verified behavior, then hand off to parent for review and publishing. Do not modify the original Tachikoma site or its remote.

Review focus: mobile pointer cancellation; background tab pause; collision across fast projectile steps; boss damage and completion; no timer or elapsed-time defeat. Browser rendering and art are verified visually; tests target meaningful simulation behavior.
