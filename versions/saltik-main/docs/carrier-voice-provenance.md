# Carrier unplug voice

The carrier's completed nonlethal unplug emits `carrier-disconnected`, mapped to the exact phrase **Saltik don't kill Saltik**. Ordinary carrier damage and bay destruction do not queue this line. It uses the existing local speech queue, destination, music ducking and cancellation behavior; the audio mix is unchanged.

Reproduce the clip with `python scripts/create-carrier-voice.py` (FFmpeg with flite, rubberband and libvorbis, and Python NumPy). The script creates only `dist/audio/voices/saltik-dont-kill-saltik.ogg`; masters, exact input text, processing commands and logs are retained in `/workspace/feral-audio-masters/carrier-20261102/`.

The source is `/workspace/feral-audio-masters/voice-lines-20261026/create_voice_lines.py`, originally derived from `/workspace/scratch/create_saltik_voice_v2.py`. The established English `flite` voice `slt` and processing chain are unchanged. The normalized pitch contour is the existing detection line's `(0,1.48), (.22,1.55), (.48,1.66), (.72,1.48), (.92,1.40)`. Processing uses the original 1.10 sample-rate speedup, rubberband tempo 1.07 with preserved formants, 140 Hz high-pass, +2.5 dB at 1750 Hz, 7500 Hz low-pass, `chorus=0.85:0.95:6:0.035:1.2:0.12`, loudness target −19 LUFS / −3 dBTP / LRA 6, silence trim and 8 ms fades. This is synthesized dialogue with no performer recording or voice clone.

The resulting mono 44,100 Hz Ogg Vorbis quality-3 clip is 1.731134 seconds and 16,105 bytes. All five pitch commands were applied. FFmpeg decodes the entire Ogg without errors. SHA-256: `222e9483132df7da4c468d63fa2b96df0cdc7a324a37306626e6b1e154bc7460`.

All six preexisting clips remain byte-for-byte exact, checked by SHA-256 in `tests/voice-lines.test.js`. The added integration test verifies event mapping, serial playback, no speech from damage events, pause cancellation and no replay on resume. The document-relative path literal remains compatible with standalone embedding.
