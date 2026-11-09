# SALTIK V2 — Missile Link

## Requested result
Keep reference v24 untouched. This separate game adds the blue/lime allied missile battery and midnight/red hostile battery from the supplied images. The player speaks with the ally at the beginning. The ally stays behind, reappearing very far away in the canyon from halfway through the mission. A new control designates targets with a laser from the player's Saltik and calls allied missiles; these missiles also intercept the hostile battery's missiles.

## Implementation choices
Keep the Canvas engine, native player, natural routes, music, existing weapons, drones, ground Saltiks and final boss. Use a separate sprite atlas for both new batteries. Avoid adding limbs or animating the panel under the optics as a mouth. Use a separate Site and local repository derived from the preserved commit.

The APPUI control uses hold/drag/release on touch, M plus mouse aiming on desktop; a simple tap uses a target in front. A canceled touch, pause or cinematic cancels the designation without firing. A six-missile salvo recharges in 7.5 seconds. Threatening enemy missiles are assigned first, with remaining missiles aimed at the designated target. Individual trajectories differ. The hostile battery becomes active at 50% progress, warns before a four-missile salvo, and waits 9 seconds between salvos. It is targetable by the laser and can be destroyed by allied support. Its missiles are destructible by ordinary shots and support missiles.

Remote flight is a separate visual and physical phase which connects the distant battery to the foreground. Hostile missiles then enter the existing projectile simulation so deflection, evasion, terrain impacts and player damage retain their rules. Remote ally appears on an anchored rock outcrop, with full opaque silhouette and atmospheric color rather than see-through art. Intro and departure last about seven seconds; dialogue and small-hand/radar motion explain the partnership without replacing the existing controls.

## Approaches
Extend ordinary foreground homing missiles for all long-range behavior (simple but does not represent distant departure); fake a background salvo and apply instant damage (quick but not interceptable); use a separate distant-flight phase joined to the existing foreground simulation (chosen: coherent depth and genuine interception without rewriting the engine).

## Verification
Prove one salvo per release, cancellation across pause/QTE, cooldown, targeting when an enemy dies, real interception before damage, distant battery damage/destruction, mid-level activation, save/restart isolation, usable touch controls and visible laser. Run existing regressions and browser scenarios. Verify the original repository and public Site remain on reference v24.
