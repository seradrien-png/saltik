# Red desert level4 implementation plan

> Execute inline with superpowers:executing-plans, independent final reviewer.

Goal: calm depth walk→C-07 intense clearing→calm return, faithful red desert reference.
Architecture: new isolated layout/objective/world modules; scene options branch for4, exterior projected rendering bypass, interior uses native combat/camera. No legacy gameplay edits.
Tech: current CanvasJS, generated imageplates/atlas, Node/Chromium.
Spec: docs/superpowers/specs/2026-11-11-red-desert-design.md

## Constraints
Preserve three playable Saltiks and worlds1–3. Opaque depth; massive terrain/architecture. User controls movement; projection changes size. Interior completion never wins before return.
## Review focus
Backtracking must not duplicate rooms; camera/zoom aspect ratios must retain whole path; transition pause must freeze; old buffered weapons must not fire on interior entry; enemies must be visible/reachable and exit gates prevent skipping.

### Task1: layout and mission
Tests tests/desert-level.test.js first, observe red. Implement desert-layout.js constants DESERT_TRAVEL_END6200, DESERT_INTERIOR_END7800, desertDepthAt/projection sample; massive interior ramps/ground. desert-level.js apply/advance/inputFilter; new scene option/updates. Spawn18guards across3rooms using native engine schedule, reset clocks safely on phase transitions, preserve correct mission state. Run targeted tests, commit.
### Task2: artwork and rendering
Generate exterior from supplied model, matching indoorhall and nativeprops/structureatlas. Add loaders and desert-world.js. Tests tests/desert-world.test.js for pure projection, route/painting alignment, all3characters and scene masks, then implement. Native actor projection feet/size, foreground occlusion; indoor artwork/physicalmass maps shareanchors. Build and screenshot representative progresspoints.
### Task3: menu and delivery
Menu4+nextlevel/result/help. Browser keyboard/touch for3characters, walk inward/outward, actual native combat, endgates/transitions. Fullsuite, independentreview, fix verified issues, exactsourcepush/save/deploy/GitHub snapshot.
