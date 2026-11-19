# Recorded Striker weapon sounds

The Striker primary cannon, mortar launch, and guided launch use excerpts of actual weapon recordings. The falling-shell whistle uses a digitized archival cinema recording: its original live-weapon origin cannot be verified and is not claimed here. No generated noise or oscillators were added to these four shipped files.

| Runtime sound | Recording, creator, and license |
| --- | --- |
| Primary cannon | [m1a1_abrams_canon_shot_3.flac](https://freesound.org/people/qubodup/sounds/67522/) by qubodup. Public-domain US military government footage extraction, CC0. |
| MIRV mortar departure | [M-327 Mortar Shots.flac](https://freesound.org/people/qubodup/sounds/187542/) by qubodup. Actual M-327 firing during military training, US government video extraction, CC0. |
| Guided missile ignition | [BGM 71 TOW Missile Launch 1 (less echo)](https://freesound.org/people/qubodup/sounds/67542/) by qubodup. Public-domain US military government footage extraction, CC0. |
| Falling-shell whistle | [R18-04-Artillery Shells Fly Overhead.wav](https://freesound.org/people/craigsmith/sounds/486035/) digitized by craigsmith. Hollywood optical/magnetic archival effects from the 1930s–1960s, transferred via USC Cinema, CC0. Actual live-shell origin unverified. |

License: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Retrieved 2026-11-14. The publicly served HQ MP3 previews were downloaded from the source pages; these are not the lossless originals. Exact URLs, download SHA-256 hashes, shipped OGG hashes, and FFmpeg filters are in `real-weapon-audio-provenance.json`. Downloaded source previews and their manifest are preserved in `audio-sources/real-weapons-source-kit.zip`.

Processing consists of excerpts, fixed gain, high-pass filtering, short edge fades, mono downmix, and Ogg Vorbis encoding. The primary cannon lasts 260 ms, allowing at most three overlapping reports at the existing 95 ms engine cadence. The M-327 excerpt contains only the first shot, avoiding an unrelated second discharge. Playback never starts when a decode finishes: only a live event can start a transient. Pause, mute, restart, and leaving Striker cancel existing recording sources.

MIRV recording paths are optional overrides of the existing lifecycle manager. The seven original user-supplied MIRV OGGs and original `Saltik_MIRV_kit_audio.zip` remain intact as fallback. Flight, separation, and all three impact variations retain the user's kit. Only the existing falling loop changes pitch according to downward velocity. The loaded primary/guided recording path adds no procedural layers; the previous synthesis remains a fallback if its recording is unavailable. BT, Gatling A10, and voices retain their existing audio paths.

Runtime-readable credits are shipped as `dist/audio/real-weapons/CREDITS.txt`.

## V51: recorded main reload and guided enemy detonations

All Striker firing sounds now receive exactly 0.9 of their previous linear gain: the cannon report, both missile launch paths (including offline synthetic fallbacks), and the complete existing MIRV bus. BT, the Gatling A10 loop, speech and their buses retain their previous gains. This is an amplitude trim before the existing output limiter; the limiter can reduce differences during very crowded peaks.

The existing **main-fire** `reload-start` event plays a 1.10 s excerpt of [Machine_Gun_Reload.wav by ken788](https://freesound.org/people/ken788/sounds/386777/), a real machine-gun reload recording released under CC0. It contains the original latch and feed movement with its intervening silence. A separate 330 ms rack/return excerpt starts only on the engine's `reload-end`, after the unchanged 1.32 s cycle. Shooting, guided launches and MIRV cooldowns do not trigger these clips. These are mechanical recordings, not generated metallic noises; they are not claimed to be a recording of a fictional Striker mechanism. If unavailable, the previous mechanical synthesis remains available.

Guided Striker missiles that actually damage an enemy play [Fire Explosion by qubodup](https://freesound.org/people/qubodup/sounds/855898/); a lethal blast instead plays [Blow Up Sound by qubodup](https://freesound.org/people/qubodup/sounds/855896/). Both are CC0 excerpts of actual explosive ordnance disposal detonations from [EOD Broll package, Seaman Kelly Meyer / AFN Okinawa, November 18, 2020](https://www.dvidshub.net/video/774073/eod-broll-package), identified as public domain by DVIDS. The source editor denoised the first and limited the second. We apply only trims, gain, filtering, fades, mono conversion and Ogg encoding. These are real detonation recordings used for missile impacts, not claims of recording the fictional enemy's destruction.

The engine adds audio metadata after the existing damage calculation. One recording represents a guided blast and its enemy destruction reports. Empty-world detonations, other weapons, BT rockets, Gatling and hostile missiles retain their existing effects. MIRV recordings, their seven-file fallback kit, firing cadence, damage, targets, ammunition and all reload timings are unchanged. Recorded reports use a pool capped at 16 sources; new reports retire the oldest source if necessary. Pause, mute, restart and character changes cancel recorded reloads and detonations. Decoding never replays a past event.

The four additive runtime OGGs, exact preview URLs, source and output SHA-256 hashes, source footage URL, processing filters and credits are in `real-weapon-audio-provenance.json`. `audio-sources/striker-v51-source-kit.zip` preserves the three downloaded HQ MP3 previews, corresponding Freesound HTML snapshots, manifest and processing script outside the published `dist` tree. Original source recordings are archived as downloaded previews; Freesound's lossless original downloads require login and are not misrepresented as acquired here.
