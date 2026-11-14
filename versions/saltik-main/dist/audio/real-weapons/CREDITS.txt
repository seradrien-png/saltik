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
