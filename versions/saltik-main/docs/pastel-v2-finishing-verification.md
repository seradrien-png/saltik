# V2 finishing verification

Scope approved in the seven-point user request and docs/superpowers/specs/2026-11-01-v2-finishing-design.md. Original Encre V1 and original colored V1 remain unchanged. The first Matin Doré release source/archive/standalone remain in deliverables/saltik-pastel-v2; this update is packaged separately in saltik-pastel-v2-finishing.

## Behavior and appearance
- Player amber/ivory/petroleum, enemy olive/orange, three native aligned material maps. Other enemy maps unchanged. A two-native-pixel black exterior silhouette is baked once for Saltiks only.
- Pencil SVG strokes and grain, ivory linework/translucent charcoal, amber press. Shift replaces deflect at directional hub, H and manual player reflection removed. Rear hold ends immediately on release or at 2 seconds; a continued hold cannot restart. Swept projectile collision handles expiry inside the body-overlap interval. Same-task release/repress verified after review found stale input state.
- Partial pad opacity .36 only when its screen rectangle overlaps actual rendered player bounds; touch targets unchanged. Five-press red duel action placed above the actors and constrained to visible bounds.
- Enemy Saltik 40 HP, guard threshold 8 (20%), seeded gun/missile variety and grounded bounded route motion. Guard approaches automatically and can clear blocking destructibles before gripping. Native weapon mouths retained.
- Native small-claw efforts for three boss presses, native hatch/pod tear, six recoiling flashes into the hole, finite roof support/tucked overhangs. Large branched glass fracture reaches screen edges.
- Foundations connect native cutout alpha edges to existing earth within original footprints, preserving arches and finite gaps. Covers clip/pack to actual sloped support, with native stone/metal grain; collision tops unchanged.

## Evidence
- Fresh full Node suite: 447 passed, zero failed/skipped.
- Complete campaign simulation: victory at 99.18 seconds, both optional boss actions used. Player armor protected in this traversal fixture; not a difficulty measurement.
- Browser final built-dist campaign: nine routes, enemy five-press duel, both three-press boss actions, victory, viewports 1280x576/851x393/667x375. No page errors or failed responses. Evidence deliverables/saltik-pastel-finishing-qa.
- Real pointer/touch tests at 1440x900,844x390,667x375 and ink controls at667/851/1280: target sizes >=44, diagonal input, hub drag neutrality, independent held weapons, partial-opacity click, pause/orientation release. Held defense browser verifies cap, rearm, same-task release/repress, H removal.
- Native boss eight-stage Chromium capture and geometry report: deliverables/saltik-pastel-finishing-boss, errors empty. World native traversal six cases and nine screenshots: deliverables/saltik-pastel-finishing-world.
- Independent review:57 focused tests and all three actual Saltik spawns against same-ground stationary players600 units on either side. One important rapid repress issue corrected and verified in browser.
- Missile CPU benchmark: equal scene fixtures at x900/3800/10300,360 fixed steps at1/120, alternating before/after order, three repetitions. Median totals413.63/410.48/450.62ms become203.41/196.02/257.28ms (43–52% lower), all salvos retain three hits and target HP76. Static navigation context1000 calls565.4ms becomes2.9ms. This measures simulation CPU, not physical phone FPS. Exact terrain samples cached only for bounded grid searches; live destructibles remain uncached.

Source/dist and source/archive byte identity, unchanged V1 commits, offline bundle and native deployment result are verified during release. No claims of physical Android/iOS testing.
