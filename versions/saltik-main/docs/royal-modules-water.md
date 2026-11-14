# Velvet buildings and waterwheel — 14 November 2026

Request: vary the repeated climbable grand-stair module, add a real intermediate landing to reach three heights, animate the waterwheel and its driving water, and continue its river over the purple near plinth into a foreground waterfall.

## Two new painted buildings

- West site `royal-arch-west` at x4800: emerald conservatory/gallery, lower stair, broad middle balcony and separate upper stair/courtyard.
- Final site `royal-sanctuary` at x16300: round royal music pavilion with buttressed towers, two distinct flights, middle landing and upper courtyard.
- Bottom/ground, middle and upper are three actual walking heights. Each new landing is its own platform; the upper flight references its real `lowerId`. The ordinary route system handles ascending, stopping, jumping and descending. Foundations remain anchored to each site's original ground plinth; no new generic platform painting is drawn.
- New native1536×1024 transparent source paintings use the existing768×512 logical frame. Collision samples were authored against the visible treads/decks, rather than hiding a platform under an unrelated painting.
- Existing first building, organic hills, bridges, encounters, shrines, level length and final eel boarding remain. Only two repeated stair sites gain the new topology.

## Wheel and continuous water

- A separately painted golden rotor turns inside the original stationary rim and pedestal, at−0.18 radians per simulation second, following the downflow on its left. The original whole module is never rotated.
- Blue/foam masks are cached from the actual HD wheel drawing; moving highlights stay inside the original water and do not slide gold supports or plants. The near pedestal is restored over the rotor.
- A new reference-matched painted river/cascade continues the arch's river mouth across the purple near plinth. Its short perspective reach and falling curtain meet on the same source crest row. Animated water is masked against the fixed drawing; its banks stay still. The curtain begins within the visible purple band, below the walking lane; no foreground props conceal the hero.
- All movement uses simulation time, so pause stops it. Textures/masks and the animated water canvas are cached; no per-frame pixel reads or new audio sources.

## Preservation and validation

The previous v49 is retained on GitHub at8a20d3e4615006b5884e7973fbbd3dc0bc426f01. Original artwork remains unchanged; four additive PNGs provide two buildings, a rotor part and river/cascade. Existing character skins, scales, jumps, weapons, music (including the supplied Velvet score), A10 and voices remain intact. World1/2/4 geometry is untouched.

Tests cover real up/down stair traversal for Striker/Gatling/BT, grounded junctions, distinct intermediate and upper supports, independent rotor rotation and runoff registration. The existing ordinary-weapon Velvet campaign acceptance test remains required. Browser proof covers all three walking heights in both buildings and animated wheel/water at several simulation times; mobile-size proof is retained with the release validation report.

A duplicate old local deployment tar from v24 was relocated to `/tmp/saltik-velvet-modules/old-v24-deploy.tar` after a SHA256 comparison to free workspace space. No source, published version, GitHub backup or history was removed.
