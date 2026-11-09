# Native art/support correction — 2026-11-01

User corrections: faithful supplied enemySaltik, foreground plants stay drawn when player passes behind, native illustrated stairs usable without a second overlay, and gravity where visible paths end.

Root causes/fixes:
- Removed both player-proximity skips in foreground vegetation painters; draw-command regression compares near/far player positions.
- Replaced enemy atlas with transparent adaptation of actual supplied reference, including two tall raised four-missile pods on jointed struts. Calibrated both facings, front impact view, native small hands, cannon and pod launch geometry. Cabin width70world; full height137. Guard/dodge/lock cues retained.
- Traced native observatory, checkpoint switchback and right breach treads. Native-art entries skip synthetic stair painter. Finite checkpoint-turn supports both flights; existing down+crouch diagonal chooses descent at its junction. Unsupported wheel samples return no floor; low-ceiling cabin lowering moves original suspension rather than scaling face.
- Replaced continuous turbine-to-building support with accessible low native shelf15040..15385 and separate building landing15715..16060. The330world gap has no physical roof. Original outer metal turbine crown is scenery, avoiding an unreachable355unit approach. Original obstacle-22barricade remains on the real shelf at15315; narrow landings do not invent repair/obstacle supports.

Validation:
- Root fullsuite418/418pass,0fail,45.25s; diffcheckclean.
- Real-engine regressions: every native flight, diagonaljump+direction landing, checkpoint switchback ascent and down-selected descent, ground-start shelfaccess then actual edgefall. Native painter adds no duplicate stair strokes. Native-wheel overhang/low112unit ceiling and immutable face tests pass.
- Browser source-level native traversal6cases: ordinaryground14860→singlejump→shelf15170.5/y451.2; fall aftershelf15385 (x15415.8/y418.94 airborne), no errors. Four native stair views and visual fall screenshots inspected.
- Built Chromium fullcampaign QA:9finite route views, native enemy/defense/lock, fivepressduel, both threepressboss actions, actual victory, viewport targetchecks1280×576/851×393/667×375; zeroJSerrors/failedresponses.
- Full simulation progression with protectedarmor to isolate geometry: victory106.07s,3duels, bothbossactions,39kills,13destroyedobstacles,640primaryshots,13MIRVs,5guided salvos.
- Review found unreachable old turbine crown afterinitialgapfix; corrected to ground-accessible visible low ledge and new ground-start regression beforepublication.

Evidence: /workspace/deliverables/saltik-ink-native-fixes-qa; /workspace/deliverables/saltik-ink-v1-qa/native-routes; /tmp/ink-native-release-tests.log; /tmp/ink-native-release-traverse.log. Separate original V1 and preceding Ink releases preserved. Artifacts use /workspace/deliverables/saltik-ink-native-fixes.
