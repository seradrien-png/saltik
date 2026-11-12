# Modern Striker visual reference — 12 November 2026

The user's three latest orange/anthracite angular reference illustrations supersede the older round Striker. Generated assets are additive; original atlases remain archived and unmodified. Gameplay remains primary small coax, heavy upper MIRV cannon and three guided rockets.

New transparent native atlases in dist/assets:
- modern-striker-atlas.png: 2172×724, normal, velvet, lunar body costumes.
- modern-striker-turn-normal.png, modern-striker-turn-velvet.png, modern-striker-turn-lunar.png: independently illustrated quarter-right/front/quarter-left views.
- modern-striker-dragon-atlas.png: same three costume cells, gold/turquoise/emerald Dragon option.
- modern-striker-dragon-turn-material.png: three Dragon perspective views.

Body native scale126/689, anchor365/706; missile centers and cannon/claw/leg masks live in modern-striker-art.js. Body costumes are cropped at runtime. Dragon body is normalized from native y16–713 to y17–706; its clean own outlines are retained to avoid double pupils/rings caused by overlaying slightly misregistered black ink. Turns use measured separate foot anchors371/706,362/706,351/705 and heights690/691/691. Registration is within a few source pixels; cell edges clip the small generated fringe. Level4 adds subtle dust to the normal model.

All foreground player scales are1 across four missions; level2 enemies also use baseline1. Royal bridge depth and desert approach/return deliberately keep perspective reduction. True turn sheets, title thumbnail, crouch/suspension, tread animation, claw reach, primary/heavy recoil/elevation and boss/duel/carrier actor paths use the new model. Native source and emission geometry share transforms. Striker weapon counts and timing are unchanged.

This release also includes the documented BT/Gatling turn sheets, friendly/crouching playable BT16-round reserve and character-specific cosmetic menu. Review: no Critical/Important findings; exported modern socket helper Minor was corrected and covered by a new regression.

Source-generation artifacts and browser proof remain in /workspace/modern-striker-art and /workspace/turns-v33. No QA route injection or helper is shipped.

Final verification: full suite736/736; after the final mask-only refinements,24 focused geometry/turn/encounter tests passed. Chromium: eight body/costume combinations across4missions,9turn views, primary/MIRV/reversal controls and no JavaScript error. Separate native-part probes verified removal of stationary barrel fragments and crouched lower-limb residue. Original80asset/audio files from v32 remain byte-identical. A physical phone/gamepad was not exercised.
