# Niveau 3 — Les Jardins de velours

Goal: build a third independent full mission matching the supplied saturated blue / emerald / burgundy velvet and golden embroidered landscape, with a golden player skin only in this level. Add a few fully opaque lunar middle-distance elements to level 2.
Architecture: independent royal-layout registry owns artwork bounds, terrain foundations, bridge decks and stairs. Dedicated world renderer paints far panorama, sparse opaque parallax islands, tactile ground, native structures and low foreground foliage. Golden skin material maps retain native silhouette, animation and weapon coordinates. Existing engine and input are reused.

- [x] Generate/inspect panorama, four native structures, hero/turn material maps.
- [x] Write and run failing selection/objective/preservation tests.
- [x] Implement registered scene, three distinct shrine encounters through the journey, checkpoint recovery, final sanctuary.
- [x] Add third menu choice, level2->3 transition, direct ?level=3, result copy, golden native player in all interactions.
- [x] Add sparse opaque lunar middle layer, preserve existing painting and playable architecture.
- [x] Verify all stairs/decks, ordinary-control campaign duration, desktop/phone UI and screenshots; independent code review.
- [ ] Run full tests/build, publish and back up main edition to GitHub without changing other editions.

Constraints: no generic thin platforms; all visible playable architecture has measured collisions. No translucent scenic buildings; transparency only outside cutout silhouettes. Preserve level1 boss and wreck, native weapons/control timings, level2 terrain/structures, other editions and existing history. Target mission length 17800 world units and roughly 80–120 seconds of active play. Three geographically separate shrine encounters rather than level2's final three-wave defense. User approved gold skin only on level3.
Review focus: grounded stair and bridge joins; no unkillable or despawn-cleared shrine enemies; pause/restart; gold texture in turn/duel/victory without altering native geometry; moon and head still visible in level2; third menu accessible on phone.

Review corrections: dedicated continuous velvet material with mirrored seams, dedicated flora-only atlas, narrow native bridge rope occlusion. Browser fixtures keep selected level and game level synchronized. All six stairs and four bridge entries verified physically; browser walked four representative entries including both directions of one bridge.
