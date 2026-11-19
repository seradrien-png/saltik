# Full wheel motion and playable royal flight — 19 November 2026

## Requested result

The former solid spinning disk is replaced by a complete connected wheel in fixed oblique perspective: near and far open rims/spokes and twelve paddle boxes rotate around the same axle. Original embossed artwork supplies their textures. Static supports, bridge and water are separate. The cached base removes the old frozen wheel parts while preserving the native wet areas and supports; the approved foreground river/cascade remains. Rotation uses simulation time, with no pixel reads after cache initialization. This is a textured projected model, not a new painted-frame sequence.

## Boarding clears the final building

The level's final trigger starts an automatic approach using the ordinary movement/gravity/support code. It runs along the upper courtyard, falls naturally from its edge and reaches ground beyond the building's right boundary plus100world units. Only then are the jump's starting coordinates captured. The camera follows this ground approach normally; the subsequent jump moves farther into open space. Canonical player/evasion/weapon objects are retained.

After the approach:1.4s run,1.6s jump,1.4s boarding transition,45s interactive flight and5s descent, total54.4s. The approaching player is still rendered on the real level; the mounted flight and descent remain in POV. The desert glimpse rises through a feathered cloud margin rather than a rectangular scene cut.

## Native weapons, manual trigger

`royal-pov-combat.js` uses the same canonical player and invokes the native engine's weapon, pod and projectile updates in an isolated flight corridor. It projects actual drones, shots, hit effects and BT locks into the mounted view. Travel and target aiming are automatic; no weapon fires on empty input. Touch/keyboard fire controls and HUD are available during combat; movement remains automatic.

Striker primary budget/reload, MIRV ballistic splitting, guided salvos/cooldowns, Gatling4s heat/5s cooling and chaotic rockets, BT three-round burst/hold-release locks/panic/remaining16-missile stock all use existing engine rules. Native damage and rewards apply. Wave enemies can damage the player when they reach the rider. Weapons continue their native clocks during boarding/descent. Combat projectile/target/lock state is cleared at descent without granting ammunition or resetting heat/recharge. Pause freezes time and mutes active loops normally.

Public snapshots omit guided projectiles' private navigation callbacks while retaining positions and presentation data. The no-target notification flag is preserved across sandbox frames and reset on trigger release, matching the ground engine and avoiding repeated denial tones.

## Striker sound

Shots and the MIRV bus use90% of their previous linear gain. Recorded main reload follows the existing reload-start and reload-end events; cycle remains1.32s. Recorded guided impacts/destruction are selected only on actual tagged enemy hits, and do not replace BT/Gatling/world impacts. Four additive OGGs, downloaded CC0 previews and provenance/credits are documented in `real-weapon-audio.md` and its JSON manifest. Other voices, A10, music and original audio assets remain.

## Evidence

869tests pass. New tests cover real ground clearance for all3characters, native weapon budgets/heat/locks, empty-input silence, actual MIRV defeats, cleanup, snapshot safety, no-target debounce, connected wheel geometry and event-scoped recorded sounds. Browser tests use the real game UI and keyboard for all3characters, plus BT multi-touch hold/release in Android-style landscape emulation. They verify live fire, pause,45s combat,5s descent and win. Physical Android hardware and a physical gamepad were not tested.

Before modification v50 is retained on GitHub at `f7ec8bd5a6f6316a3d6d73444b5ea5f3718a647a`. All original image/audio files and all other editions/history remain; only the existing main edition is updated. The pixel-lossless publication process remains active. A duplicate old temporary v25 deployment tar was hash-checked and relocated to `/tmp` to free space; no game source or GitHub history was deleted.
