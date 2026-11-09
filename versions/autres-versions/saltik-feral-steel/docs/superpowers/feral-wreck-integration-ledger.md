# Integration ledger — plan: docs/superpowers/plans/2026-10-24-feral-wreck-plan.md

Parent approved the contracts and assigned this shared feature checkout. Scoped workers must not commit, build, publish or create further agents; parent owns final review.

Pre-flight: Task1 supplies turn state/frame API to Tasks3/4; Task2 supplies shared projection to Tasks3/4; Task3 supplies measured mounts to Tasks4/5. Names and values match the design. Root final asset keys override the initial proposals: `tachikoma`, `tachikoma-turn`, `enemies`, `wreck`.

Ruling: Keep direct `p.dir` test setup compatible by lazily initializing `p.turn` before a requested direction change. Turn queues are discarded through the existing `main.js` clear-input path, avoiding input-controller changes.

Task 1: complete. New turn module and three focused checks passed after the missing-module RED. Both directions traverse every front octant, retargets remain continuous and invalid deltas preserve finite orientation.

Task 4: complete. Turn-delayed weapons, released taps, held cadence, retargeting, no-target consumption and PLAN/pause cancellation passed after the new behavioral tests first failed. Engine tracks canonical support and shared projection, retains exact grounded PLAN entry/return on all tiers/obstacles and preserves the complete airborne arc. Baseline projectile physics are explicit and independent of artwork scale.

Ruling: Preserve the baseline physical player hull and damage hitbox with `PLAYER_COLLISION_SCALE=1.25`, independently of `PLAYER_SCALE=1.0` artwork. The new art has the same approximately97.5-unit visible height as the old art; using its changed atlas scale for physics shrank the standing hitbox and caused the existing high-shot/crouch regression to fail. Restoring the original physical dimensions fixes that demonstrated regression without weakening the test. Cost if wrong: collision dimensions would require deliberate retuning against art rather than another global artwork scale change.

Task 5: complete. Measured enemy rows/feet/rifle mouths, all three scheduled classes, required action/turn/enemy/wreck assets and shared vertical camera framing passed. Foreground terrain roots/lips render after entities and before projectiles/effects. Camera follows the measured pod top at an85-unit upper margin, caps at180 and eases its return; the read-only snapshot exposes cameraY.

Verification: `npm test` passed92/92 before the player worker's final additional measured-mouth check. Ordinary deterministic campaign won in80.3667seconds with40armor,46kills,23obstacles. The elevated campaign won in80.9667seconds with40armor,39kills,19obstacles and all six upper sections; tiers0/1/2 were visited through ordinary controls. Final fresh suite results are reported in the integration handoff.

Final integration self-review: no known unresolved integration defects. Parent retains independent whole-change/browser review, final asset inspection, build and publication. This worker did not commit, build, push, publish or create other agents.

Bounded browser-readability follow-up: the parent observed skipped intermediate turn views in software Chromium after removing observer/capture overhead. Parent ruling: increase `TURN_DURATION` from 0.30 to 0.60 seconds, making each intermediate octant last 0.15 seconds rather than 0.075. This exceeds the main loop's maximum approximately 0.133-second batch while preserving immediate movement and delayed weapons. Cost: an additional 0.30 seconds before a complete reversal becomes weapon-ready. New endpoint and eight-step sampling regressions both failed at the original duration; existing all-five-views 60 Hz assertions remain intact. Combat queue waits now derive from the exported duration. No art, world, build or publication changes are included in this follow-up.

Follow-up verification: focused turn/combat tests passed 28/28; the single subsequent full `npm test` run passed 95/95; `git diff --check` was clean. Rear-fascia occlusion was reviewed from scenery source and parent captures and reported separately; no terrain or rendering change was made.

Latest user steering: the vehicle is SALTIK, model STRIKER, with two cyan eyes, orange/ivory armor, roof turret with large MIRV barrel and smaller coaxial rapid-fire barrel, and two lateral box missile pods. Visible French deployment, introduction, vehicle label, HUD accessibility, tutorial, load messages and damage/result status now use Saltik Striker or STRIKER. Compatibility module filenames, asset keys and exported APIs remain unchanged. The 0.60-second turn and physical weapon behavior remain unchanged. Detailed playable ground matching the canyon background is a priority, with required `ground-surface` artwork coordinated by the parent and world worker.

Ground material loader: parent supplied canonical `ground-surface.png`, RGB, exactly 2172x724. Renderer now requires and caches `ground-surface` with exact dimension validation. The missing-ground regression failed before implementation, then passed; malformed 1x1, 2172x723 and 2171x724 assets are rejected. Focused loader suite passed 6/6. Final integration verification follows the player worker's new Striker measurements.

UI/ground-loader verification: syntax checks and `git diff --check` were clean; current full `npm test` passed 96/96. That run preceded the new Striker atlas remeasurement, so it verifies the completed UI/loader changes while final pose integration remains with the player worker and parent. No engine physics, build, commit or publishing change was made.
