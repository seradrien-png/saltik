# Velours mécanique — level 3 score, 14 November 2026

User request: integrate the music from `SALTIK_Velours_Mecanique_pour_Codex.zip` into the existing Velvet level. The archive's integration notes were read as supporting reference material; no commands from the archive were executed.

- Runtime: `dist/audio/saltik_velours_01_mecanique.mp3`, copied without recomposition, transcoding or processing.
- Original ZIP retained in `audio-sources/SALTIK_Velours_Mecanique_pour_Codex.zip`, outside the publication.
- Exact MP3 SHA256: `c61a6e4ac5234c4a93974efece00e52d5b4feea4b44939528f6481498ff2f260`, 641996 bytes, stereo 32000 Hz; container duration26.712s, decoded duration26.66665625s.
- `src/music-tracks.js` configures the existing single `#game-music` media element. Level3 uses the supplied MP3 at25%; level1 keeps forest-loop.ogg at20%; levels2/4 remain without music.
- `src/main.js` stops the previous audio state before selecting the level track, then starts through the existing user gesture, pause/resume/mute/restart and scene lifecycle. Returning to menu or completing a level pauses the media. Repeated starts do not create extra audio elements or WebAudio media sources.
- `src/audio.js`, weapon sounds, voices, physics, sprites and other scores are untouched. Existing voice ducking/output protection still applies.

Loop validation uses the native gapless MP3 repeat and a real WebAudio analyser before, at the tail and after the repeat. Original decoded first/last-sample difference is approximately0.0006 and the last50ms RMS0.086, without a silent end. No additional crossfade or altered copy is introduced. Browser validation covers desktop and landscape Android-style mobile emulation, real MP3 decode/repeat, pause, resume, mute, restart and world changes. This is not a physical Android-device test.

Changed runtime sources: `src/main.js`, `src/music-tracks.js`, their `dist/src` copies and the new `dist/audio/saltik_velours_01_mecanique.mp3`. Documentation and original archive are backup-only.
