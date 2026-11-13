# Saltik jump leg spread

User asks a small outward leg movement on takeoff, with extra in-between frames returning to rest. Apply to all three playable Saltiks and all their existing level/cosmetic skins, including turn views. Reuse the native rig masks; do not redraw sprites or change jump physics, controls, weapons or levels.

Chosen approach: a fixed-simulation cosmetic envelope in the existing motor-motion update. Ease from0 to a modest4.5-world-unit lateral offset per side over.10s; ease toward65% through flight, then return smoothly to0 over.18s after landing. Falling without an upward jump uses35% amplitude. Pause freezes it. Distal wheels move outward while their existing struts shear at the root; landing support is sampled at the shifted wheel location. Native front/quarter views use their leg masks. Scripted staged grips/KO/victory keep their authored poses.

Existing inline workflow and publishing/GitHub authorization continue. This is visual motion only, not a new jump action or asset generation task.
