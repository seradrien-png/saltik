# Long-range Saltik detection voice

The `long-range-saltik-detected` event plays the local line **“Long range Saltik detected”** from `dist/audio/voices/long-range-saltik-detected.ogg`. It uses the existing speech queue, music ducking, pause, mute and restart lifecycle. The engine owns the once-per-enemy visibility trigger; the audio dispatcher plays each emitted event.

Generate only this new clip with:

```sh
python scripts/create-artillery-voice.py
```

The script follows `/workspace/feral-audio-masters/voice-lines-20261026/create_voice_lines.py`, also used by the later menu and missile-link additions. It synthesizes English with ffmpeg `flite` voice `slt`, then applies the original detection line's normalized pitch contour: `(0,1.48), (.22,1.55), (.48,1.66), (.72,1.48), (.92,1.40)`. The accepted chain is unchanged: 1.10 sample-rate speedup; rubberband tempo 1.07 with preserved formants; 140 Hz high-pass, +2.5 dB at 1750 Hz, 7500 Hz low-pass; the same light chorus; loudness target −19 LUFS; original silence trim and 8 ms fades. The final encoder is mono 44100 Hz Ogg Vorbis, quality 3.

Masters, synthesis input, pitch commands and processing logs are retained in `/workspace/feral-audio-masters/artillery-20261029/`. This addition leaves all eight earlier clips byte-for-byte intact, checked by their SHA-256 hashes in the voice tests.

Generated on 2026-10-29: 1.655760 seconds, 14,719 bytes, SHA-256 `6a90c9e1bfbb913708e937d9cbe81cc54e12151ad6d50638b1703b6cec2845be`. ffprobe identifies mono 44100 Hz Vorbis; full ffmpeg decoding reports no errors. Decoded peak is −6.22 dBFS and RMS is −18.57 dBFS. Container hashes can change on regeneration because Ogg stream serials vary.

Validation: `node --test --test-isolation=none tests/voice-lines.test.js` passes all 14 tests, including new cue dispatch, queueing, ducking, pause/mute cancellation and stream completeness. The full `npm test` run passed 400 tests when this addition was completed.
