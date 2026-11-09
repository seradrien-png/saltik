# Carrier release validation

- Existing Matin Doré V2 updated; original Encre and colored V1 repositories untouched. Previous V2 retained at `backup/v2-before-carrier-20261102` / c6c4111bd06a72faf2b5c296d373305f680ee473 and its prior published version/archive.
- Approved blue carrier PNG retained exactly. Cabin footprint is comparable to the player. Four equipment bays, same native drone model at half scale, maximum three simultaneous linked drones, staggered undock and replacement timers.
- One of the three existing regular missile Saltiks guards the midpoint carrier. Existing regular Saltik defenses and five-press nonlethal throw remain unchanged. Destroyed bays stop deployment; one nearby red action unplugs the carrier after its guardian is neutralized. Cabin remains whole, powered down, grounded, with no kill/explosion; linked drones retire harmlessly.
- The hero hops to an external hanging connector, avoiding body overlap, uses the original small hand, and plants wheels on the actual sloped terrain. Approach/unplug/settle are pause-safe and freeze combat. Input clears at entry/exit.
- Boss hull choreography references the original colored V1: crouched planted body, complete native roof housing aims into the opening, six short firing beats, safe cannon-sweep ejection. The former whole-body headstand and retained-lid pose are removed. Both three-press actions retain their actual timing and damage.
- Primary coax has its own native patch and continuous recoil. MIRV recoil and small enemy launcher deployment share drawing/projectile geometry. Solid cyan/ivory or orange loaded noses fill all visible bores; discharged groups remain dark until refill. Physical missile counts remain three/two.
- Existing complete audio mix is byte-identical after removing three additive carrier mechanical cues. No new voice model or music.

## Evidence

`npm test`: 506 passed, zero failed. `npm run build` passed. `git diff --check` passed.

Browser evidence: `/workspace/deliverables/saltik-carrier-qa`. Actual touch action tested at 851×393 and 667×375; no JS errors or failed asset responses. Independent native boss contact sheets exercise all six pulses and both assaults. Original campaign browser checks covered nine routes, five-press duel, both three-press assaults, victory and three viewports.

A protected-armor full simulation reaches victory in 100.52 seconds, including both boss actions. This is progression verification, not a difficulty or physical phone FPS measurement. Guided missile CPU fixtures compare the previous V2 with this release: 360 steps per case, three repetitions, median totals 208→213 ms, 226→214 ms, 258→256 ms. Carrier damage uses clipped ink washes, not expensive per-frame image filters.
