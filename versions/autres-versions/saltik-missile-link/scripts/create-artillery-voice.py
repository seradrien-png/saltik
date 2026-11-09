"""Generate only the artillery cue using the accepted Saltik V2 voice chain.

Requires ffmpeg with flite, rubberband and libvorbis, plus Python numpy.
Masters/logs stay outside the site; the final Ogg follows existing dist assets.
"""

from pathlib import Path
import hashlib
import json
import subprocess
import wave

import numpy as np


SITE = Path(__file__).resolve().parents[1]
MASTERS = Path('/workspace/feral-audio-masters/artillery-20261029')
NAME = 'long-range-saltik-detected'
TEXT = 'Long range Saltik detected'
RATE = 44100
# Same normalized contour as the retained saltik-detected.ogg.
CONTOUR = [(0, 1.48), (.22, 1.55), (.48, 1.66), (.72, 1.48), (.92, 1.40)]


def run(args, log=None):
    result = subprocess.run(args, check=True, capture_output=True, text=True)
    if log:
        log.write_text(result.stderr)
    return result.stderr


def samples(path):
    with wave.open(str(path), 'rb') as source:
        assert source.getnchannels() == 1 and source.getframerate() == RATE
        return np.frombuffer(source.readframes(source.getnframes()), dtype='<i2').astype(float) / 32768


def write(path, data):
    with wave.open(str(path), 'wb') as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(RATE)
        target.writeframes((np.clip(data, -.98, .98) * 32767).astype('<i2').tobytes())


def main():
    MASTERS.mkdir(parents=True, exist_ok=True)
    textfile = MASTERS / f'{NAME}.txt'
    textfile.write_text(TEXT)
    raw = MASTERS / f'{NAME}-raw.wav'
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', f'flite=textfile={textfile}:voice=slt',
         '-ar', str(RATE), '-ac', '1', '-c:a', 'pcm_s16le', str(raw)])
    duration = len(samples(raw)) / RATE / 1.10
    commands = MASTERS / f'{NAME}-pitch.txt'
    commands.write_text('\n'.join(f'{fraction * duration:.5f} rubberband@saltik pitch {pitch};'
                                  for fraction, pitch in CONTOUR))
    processed = MASTERS / f'{NAME}-processed.wav'
    chain = (f'asetrate=48510,aresample={RATE},asendcmd=f={commands},'
             f'rubberband@saltik=tempo=1.07:pitch={CONTOUR[0][1]}:formant=preserved:'
             'transients=smooth:detector=soft:window=short:pitchq=quality,'
             'highpass=f=140,equalizer=f=1750:t=o:w=1.2:g=2.5,lowpass=f=7500,'
             'chorus=0.85:0.95:6:0.035:1.2:0.12,'
             f'loudnorm=I=-19:TP=-3:LRA=6,aresample={RATE}')
    stderr = run(['ffmpeg', '-y', '-loglevel', 'verbose', '-i', str(raw), '-af', chain,
                  '-ac', '1', '-c:a', 'pcm_s16le', str(processed)], MASTERS / f'{NAME}-processing.log')
    applied = stderr.count('ret:Success')
    assert applied >= len(CONTOUR) - 1, applied
    speech = samples(processed)
    voiced = np.flatnonzero(np.abs(speech) > .0015)
    if voiced.size:
        speech = speech[max(0, voiced[0] - round(.025 * RATE)):
                        min(len(speech), voiced[-1] + round(.08 * RATE))].copy()
    fade = min(round(.008 * RATE), len(speech) // 3)
    speech[:fade] *= np.linspace(0, 1, fade)
    speech[-fade:] *= np.linspace(1, 0, fade)
    master = MASTERS / f'{NAME}-master.wav'
    write(master, speech)
    ogg = SITE / 'dist' / 'audio' / 'voices' / f'{NAME}.ogg'
    ogg.parent.mkdir(parents=True, exist_ok=True)
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(master), '-c:a', 'libvorbis', '-q:a', '3', str(ogg)])
    report = {
        'line': TEXT,
        'source': '/workspace/feral-audio-masters/voice-lines-20261026/create_voice_lines.py',
        'method': 'Original English flite slt synthesis; same V2 saltik-detected pitch contour, '
                  'formant-preserving rubberband, filters, light chorus, loudness and trimming.',
        'codec': 'Ogg Vorbis mono 44100 Hz quality 3',
        'seconds': round(len(speech) / RATE, 3),
        'pitch_commands_applied': applied,
        'ogg_bytes': ogg.stat().st_size,
        'ogg_sha256': hashlib.sha256(ogg.read_bytes()).hexdigest(),
        'scope': 'Only the new long-range-saltik-detected.ogg; all eight existing clips retained.'
    }
    (MASTERS / 'README.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
