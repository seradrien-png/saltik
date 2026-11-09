# Platform carrier release validation

## Delivered behavior

The approved blue two-cradle platform replaces the old four tiny fan nests and forehead gun. The normal-size existing game drones dock for0.8s, lift off for0.75s, screen between carrier and player, and replenish with bounded occupancy/recharge. At most three linked drones exist. Native drone-anchor clearance is derived from the actual66px sprite's lower chassis, preventing embedded/miniature drones.

Carrier equipment starts120HP. A single physical impact/blast applies damage once, not per cosmetic pad. At48HP (60% damage), both cradles are visibly wrecked/dark, deployment ceases, and the carrier keeps firing/moving. At18HP (85% damage), a native damaged-leg frame appears and the carrier immobilizes, stops firing and keeps its chassis orientation. Close approach after escort neutralization makes the single red unplug action available. Body survives; cabin never enters the generic kill/explosion path. The hero uses the original small hand to open the side cover and pull its coupling, then says exactly “Saltik don't kill Saltik” through the retained synthesized voice chain.

Nine-round enemy bursts at0.13s cadence are followed by a1.8s reload. The lateral native gun tracks a bounded elevation toward the hero; physical shots always originate along its actual painted bore. Medium distance is held by advancing or retreating on real terrain. Existing regular missile Saltik escort and its nonlethal duel are retained.

All red interactions occupy the right weapon dock, including availability, the regular five-press duel, both boss three-press actions and carrier unplug. Weapon inputs are independently cleared when replaced; movement remains usable before an action. Main fire is a larger amber circle; guided and MIRV are smaller cyan/coral squares. Existing pause, held two-second evade and distinct-press semantics remain.

MIRV preparation lasts0.64s in the current ink/pastel game: complete native upper housing rises16world units over0.30s on two2D hydraulic supports, then the barrel elevates before real launch, recoils and returns. Legacy generic createGame timing is retained. Priming is canceled at interaction entry and evade; pause freezes it. Idle native imagery is byte-identical across18 native pixel comparisons.

## Verification

- `npm test`:531 passed, zero failed (11.52s).
- `npm run build`:passed; all src/dist modules match.
- `git diff --check`:passed.
- Root live browser: normal three-drone swarm, real60%/85% sprite states, single-touch unplug, occupied body retained, established voice actually decoded/played once, no JS errors or failed asset responses. Mobile851×393 and667×375.
- `tests/browser_action_dock.py`:passed at667×375,851×393,1280×576. Actual mobile multitouch held/queued weapon transition/release, movements, five/three distinct presses, pause and recovery all pass; targets≥44px.
- Existing control smoke at1440×900,844×390,667×375 and actual live small-screen regular Saltik duel passed.
- Full protected-armor simulation reaches boss victory in98.95s, including both boss actions. This proves progression, not player difficulty.

## Measured performance

Reproduced crowded checkpoint with37 actors,360 projectiles and48 effects in headless Chromium. Shared native checkpoint roof/turn descriptors painted no pixels, but allocated full2083×833 transparent cache surfaces, evicting actual terrain every frame. Skipping only those shared empty surfaces gives byte-identical world screenshots at three landmarks and avoids810 surface allocations over90 warm frames. Native brightness flashes are baked once into a bounded3.2M-pixel cache instead of repeatedly filtering full atlases on each hit.

Matched checkpoint median command submission82.7→20.5ms; forced Canvas completion127.8→38.2ms. These are browser CPU/raster measurements, not physical-phone FPS. Native ordinary actor pixels remain unchanged; hit flash edges can differ slightly due to prefiltered texture resampling. Collision, damage, guidance and projectile counts are unchanged by the rendering optimizations. Realistic14-actor/43-projectile simulation was separately measured; no synthetic120-homing-missile stress claim is used as gameplay performance.

Evidence: `/workspace/deliverables/saltik-platform-combat-qa`, `/tmp/saltik-action-dock-qa`, `/workspace/deliverables/saltik-carrier-qa/hydraulic-turret` and matching crowded before/after JSON/screenshots. Previous V2 is retained at backup/v2-before-carrier-combat-20261102 (066b335de040111063b0fa5bd897f07c0a6062e1), prior saved release/source archives, and both original V1 repositories remain unchanged.

## Review decisions

- The60% threshold stops new drones; surviving airborne drones remain combatants until defeated or carrier immobilization. This preserves the visible swarm without spawning after deck failure.
- Committed missiles may finish when red controls merely become eligible; queued/held future input is discarded. Entering the actual cinematic cancels priming/pending salvos. This avoids erasing a paid shot before the player presses the action.
- Frozen immobilized chassis orientation, normal drone landing clearance and single shared blast damage were each verified by failing then passing integration regressions.
