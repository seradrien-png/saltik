# Fossiles rouges — supplied MIDI score

The supplied `Saltik_Sable_Rouge_La_Plaine_des_Ombres_V2.mid` is retained unchanged in `audio-sources/`, outside the published runtime. SHA256: `ec7328b897e7a53ddeb380096ddb54f8c2857edd77b7aed11fa9fdc56167d9b4` (8,979 bytes).

`scripts/render-red-sand-music.py` renders its original notes, velocities, MIDI channels, program changes, controllers and tempo using libfluidsynth and `/usr/share/sounds/sf2/TimGM6mb.sf2`, then encodes stereo 44.1 kHz Vorbis quality 5 with ffmpeg. Run `python scripts/render-red-sand-music.py` from the repository to regenerate. No arrangement, quantization, instrument substitution beyond General MIDI SoundFont interpretation, added notes, cuts, fades or tempo changes are applied. MIDI track names describe author intent; playback follows the source channel/program messages literally, including the two tracks that share channel 0. There are no SysEx events. The MIDI ends at 89.3752 seconds; two seconds allow the final voices/reverb to release, giving 91.3752 seconds total.

The published file is `dist/audio/saltik_sable_rouge_v2.ogg` (approximately 1.57 MB). Exact source, SoundFont, output hashes and MIDI/render measurements are in `red-sand-music-validation.json`. The raw render peak is 0.758 and RMS 0.104; the encoded file is additionally decoded by the automated check to verify audible finite samples, duration and absence of clipping. SoundFont rendering preserves MIDI musical instructions; the original author's exact synthesizer timbre is not specified in the MIDI.

`src/music-tracks.js` selects this score only for level 5, Fossiles rouges, at the existing 25% music level. It reuses the existing single `#game-music` element and audio bus: loop, pause/resume, mute, restart and menu transitions retain their established behavior. Levels 1 and 3 keep their existing files and levels 2 and 4 remain silent. No weapon sounds, A10, voices or audio-bus code change.

Validation: `node --test tests/red-sand-music.test.js tests/audio.test.js`. Browser validation is recorded separately when performed; the native MIDI and this authoring script are excluded from `dist/`.
