# Gatling audio and combat, V43

Historical V43 release notes: the seven dialogue recordings were replaced by the childlike voice in [V45](gatling-audio-v45.md). The supplied A10 loop remains unchanged.

The supplied `A10_BRRRT_boucle.wav` is the source of `dist/audio/gatling-brrrt-loop.ogg`. The complete 3.2 second stereo, 48 kHz file was encoded as Ogg Vorbis quality 5, without trimming, added fades or pitch changes. The original WAV is also retained in `audio-sources/A10_BRRRT_boucle.wav`; `scripts/create-gatling-audio.py` now regenerates only the seven V45 voice clips with FFmpeg/libflite; it preserves the existing loop. Hashes are in `docs/gatling-audio-provenance.json`. Original upload, conversion script and voice masters used for this release are preserved in `/workspace/saltik-finale-v43/gatling-audio/` (`provenance.json` and `decode-qa.json`). Original upload SHA-256: `f6778dd1ec910a3dbaa24c045ea4559cbf25c8dcdfed19e49a691938f391eba0`.

`audio.setGatlingFiring` follows the current combat firing flag. It creates one looping buffer source and reuses the decoded asset between bursts. Release, pause/home, character changes, mute and overheat stop the source. A release while loading prevents late playback. Individual bullet events produce no additional synthetic gun sound. A missing file fails silently; there is no substituted imitation of the uploaded sound.

All seven Gatling dialogue recordings were synthesized anew from text with local FFmpeg/libflite's **rms male voice**, distinct from the original **slt female voice**. The processing uses a 180–4200 Hz voice band, a short 12 ms metallic echo and subtle 45 Hz tremolo. Original Striker and BT recordings and playback profiles are retained. Gatling plays the finished recordings at their native rate. The new clips are local Ogg Vorbis mono, 44.1 kHz; browser speech synthesis and old voice recordings are not used as inputs.

| Event | Gatling spoken text |
| --- | --- |
| Start | Gatling online. |
| Target lock | Target lock! |
| Enemy detection | Enemy brother |
| Grab ready | Grab him! |
| Duel throw | See you later |
| Carrier disconnect | Saltik don't kill Saltik |
| Victory | Victory! |

Captions follow actual playback and use the same text; Gatling's speaker label is GATLING. The first shot immediately pushes against the facing direction at 12 world units per second. Continuous fire overheats at four seconds (120 rounds at 30 Hz); cooldown remains five seconds.

Targeted validation: Gatling combat boundaries and release/lock behavior; voice queue routing and retained clip SHA-256 values; captions; one source during a burst; stop on release/overheat/pause/mute/chassis change; cancellation during decode; existing audio mix tests. The original Striker mix also passes its existing byte preservation normalization with the explicitly authorized Gatling additions removed. FFmpeg decoded the supplied loop and all new voice assets successfully, with finite samples and peaks below full scale. Loop duration and decoded frame count match the original. Subjective speaker/mix preference and final browser playback require listening in the integrated site.
