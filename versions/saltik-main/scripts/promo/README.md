# SALTIK gameplay trailer — production notes

Historical first cut. The user requested a much denser voiced revision; current media is produced by `scripts/promo-v2/` (22 seconds), not this original 20-second exporter. Do not overwrite the current runtime MP4 by rerunning this older cut.

20 seconds, 1920×1080, 30 fps. The only character source is the current Matin Doré game: `createInkScene`, `updateInkScene`, `createRenderer`. Ordinary movement/fire/missile/rear-shift/QTE/boss-action inputs drive the same simulation; no position, health, damage, spawn or weapon edits are used. The 64:27 gameplay viewport is rendered whole between scope bars, not cropped from a 16:9 frame. Only the title, short editorial cards, vignette and edit transitions are added. No extra missile Saltiks from the separate ending film appear.

The final cut comprises nine excerpts from a reproducible native playthrough and a three-second SALTIK / by limule & régalec brand reveal with smartphone CTA. It ends on an assault rather than revealing the boss's defeat. `evidence.json` records source times, live actors, HP and emitted gameplay events. Ordinary source-time gaps render at lower pixel resolution with the same projection, keeping camera/physics updates deterministic; selected frames use full HD.

Original music: synthesized pulse-driven minor score resolving to a wide heroic chord, kick/snare/tick percussion, risers and edit impacts. Synthetic combat effects are timed from emitted gameplay events. No third-party music, samples or narration. Final AAC is normalized to -15 LUFS / -1.5 dBTP target.

Reproduce in this workspace: `python scripts/promo/export.py`. It runs a temporary local server on port 4176 and requires NumPy, SciPy, Playwright, Chromium `/usr/bin/chromium` and ffmpeg. Work products and evidence are under `/workspace/recovery-saltik/promo`. `pickup.py` is the retained efficient edit-patch helper used to replace the original aftermath shot; a fresh full export already contains the final shot and does not require this helper. `verify.py` checks browser playback, duration, Full HD dimensions, download and game link on desktop and emulated phone, using port 4177.

Delivery is separate from the victory film: `dist/video/saltik-gameplay-promo.mp4`, poster and `promo.html`. No gameplay or victory controller changes. Page added to the existing build copy list.
