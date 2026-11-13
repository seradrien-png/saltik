# Gatling reference refit — 13 November 2026

The user's four new images define the angular G-01 Gatling: two rotary seven-barrel guns, one high eight-rocket cassette, twin amber beacons, four wheeled legs, two small claws and friendly eyes. Existing gameplay and audio are unchanged.

New files in dist/assets (original resources retained):
- modern-gatling-atlas.png:1254×1254, four627-square cells; metal/red level1, celestial level2, quilt level3, rusty olive/desert level4.
- modern-gatling-turn-{normal,lunar,velvet,desert}.png:2172×724, independently drawn quarter-right/front/quarter-left.
- modern-gatling-limule-atlas.png and modern-gatling-limule-turn.png: new chassis in the existing optional beige Limule & Régalec appearance, with four body finishes.

Native profile in modern-gatling-profile.js: anchor314/560, standing543px mapped to126world units, two measured gun mouths/face ellipses and eight red-cap centers. Wheel suspension/rigid tires, heat/spin/steam, recoil/aim, crouch-folded claws and encounter reach use this profile. Legacy raw fixtures retain the archived1536×1024 rig.

The source art is not resampled or overwritten on disk. At load, gatling-registration.js thresholds alpha128 and retains the largest connected silhouette per cell, removing disconnected neighboring strips. All turn costumes are uniformly registered to common measured foot anchors/heights. Beige body heights are normalized from552/551px to543px. Runtime registration transforms also follow spin/heat/socket overlays. Each left-quarter rocket row reverses its display order to preserve the identity of partially spent rounds at the left-facing endpoint.

All four levels retain foreground scale1/126-unit height. Deliberate royal bridge and desert perspective changes remain. Menu thumbnail and all actual scene/encounter art paths use the new model; Striker, BT, environment, combat timing, rocket budget and audio remain intact.

Verification:745tests pass. Chromium:8body/skin combinations,24native turn views,8crouched body combinations,24registered partially spent/heat views, live controls and844×390phone menu; no JS errors. Numeric independent review verified both claw targets for boss/duel/carrier, error under1e-12. Review's rocket-index issue and overlay registration were verified RED→GREEN. No physical phone/gamepad test.

Generation metadata/notes and proof are in /workspace/modern-gatling-art/. No QA helpers, overlay canvas or injected browser routes are shipped.
