# Libres. Ensemble. — asset provenance and reproduction

The thirty-second ending uses the canonical `dist/assets/ink-saltik.png` and `ink-enemy-saltik.png`. `epilogue-missile-pair.png` is a generated faithful Ink adaptation of the user's two missile Saltik attachments, provided on 3 November 2026. Both retain eight exposed missiles, cobra emblems, radar, pincer and wheeled legs; dark and ivory distinguish the original color variants. `epilogue-foundry.png` is an original generated environment for this film.

Music: the user's existing **Feral_Steel_Saltik_Foret_Epique_ORIGINAL.ogg**, recovered from their project Drive folder, file ID `1EE7eq_BmHXE6e7zLtPYrVh3fEF--rfyD`. The first thirty seconds are mixed to -17 LUFS with opening and closing fades. There is no spoken narration; French cards carry the complete story.

Reproduce: serve the repository root on port 4173, then run `python scripts/render-epilogue.py --music /absolute/path/to/Feral_Steel_Saltik_Foret_Epique_ORIGINAL.ogg`. Requires Python Playwright, Chromium and ffmpeg. The render source supplies 900 deterministic frames at 1280×720; output is H.264 yuv420p / AAC with faststart. The standalone film page is `epilogue.html` and its downloadable film is `video/saltik-libres-ensemble.mp4`.

Integration keeps the original victory flourish before the film. Defeat retains the original result flow. Skip/end/error return to results, which offer replay. Muting is shared with the game; backgrounding pauses the media. The film is fetched only when opened.
