"""Generate only Gatling dialogue locally; leave the supplied A10 loop untouched.

Requires FFmpeg with flite, rubberband and libvorbis, plus Python NumPy.
Raw synthesis, pitch commands, masters, previous clips and QA stay outside the site.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
import wave

import numpy as np

SITE = Path(__file__).resolve().parents[1]
RATE = 44100
PHRASES = {
    'ready': 'Gatling online.',
    'target-lock': 'Target lock!',
    'enemy-brother': 'Enemy brother',
    'grab-him': 'Grab him!',
    'see-you-later': 'See you later',
    'carrier': "Saltik don't kill Saltik",
    'victory': 'Victory!',
}
# AWB has a separate source identity from Striker's SLT. Raise the vocal tract
# modestly, then lift pitch independently: a soft childlike register, no robot FX.
FORMANT_RATIO = 1.28
TEMPO = .97
CONTOUR = [(0, 1.68), (.20, 1.82), (.45, 1.78), (.72, 1.70), (.92, 1.62)]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ffmpeg(args):
    return subprocess.run(['ffmpeg', '-y', '-v', 'error', *args],
                          check=True, capture_output=True)


def inspect(path):
    metadata = json.loads(subprocess.run(
        ['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)],
        check=True, capture_output=True, text=True).stdout)
    decoded = ffmpeg(['-i', str(path), '-f', 'f32le', '-acodec', 'pcm_f32le', '-']).stdout
    samples = np.frombuffer(decoded, dtype='<f4')
    peak = float(np.max(np.abs(samples)))
    assert samples.size and np.isfinite(samples).all() and peak < 1, path
    stream = metadata['streams'][0]
    return {'codec': stream['codec_name'], 'sample_rate': int(stream['sample_rate']),
            'channels': stream['channels'], 'duration_seconds': float(metadata['format']['duration']),
            'decoded_samples': len(samples), 'peak_linear': peak,
            'peak_dbfs': round(float(20 * np.log10(max(peak, 1e-12))), 3),
            'clipped_samples': int(np.count_nonzero(np.abs(samples) >= 1)), 'finite': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--proof-dir', type=Path)
    options = parser.parse_args()
    proof = options.proof_dir or Path(tempfile.mkdtemp(prefix='saltik-gatling-child-'))
    proof.mkdir(parents=True, exist_ok=True)
    backup = proof / 'old-gatling-voices'
    backup.mkdir(exist_ok=True)
    protected = {p: sha(p) for p in (SITE / 'dist/audio').rglob('*')
                 if p.is_file() and not (p.parent.name == 'voices' and p.name.startswith('gatling-'))}
    report = json.loads((SITE / 'docs/gatling-audio-provenance.json').read_text())
    clips = []
    for key, phrase in PHRASES.items():
        name = 'gatling-' + key
        out = SITE / 'dist/audio/voices' / (name + '.ogg')
        if out.exists() and not (backup / out.name).exists():
            shutil.copy2(out, backup / out.name)
        textfile = proof / (name + '.txt')
        textfile.write_text(phrase)
        raw = proof / (name + '-awb.wav')
        ffmpeg(['-f', 'lavfi', '-i', f'flite=textfile={textfile}:voice=awb',
                '-ar', str(RATE), '-ac', '1', str(raw)])
        duration = float(subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of',
             'default=noprint_wrappers=1:nokey=1', str(raw)],
            check=True, capture_output=True, text=True).stdout) / FORMANT_RATIO
        commands = proof / (name + '-pitch.txt')
        commands.write_text('\n'.join(
            f'{fraction * duration:.5f} rubberband@child pitch {pitch};'
            for fraction, pitch in CONTOUR))
        chain = (f'asetrate={round(RATE * FORMANT_RATIO)},aresample={RATE},'
                 f'asendcmd=f={commands},rubberband@child=tempo={TEMPO / FORMANT_RATIO}:'
                 f'pitch={CONTOUR[0][1]}:formant=preserved:transients=smooth:'
                 'detector=soft:window=long:pitchq=quality:smoothing=on,'
                 'highpass=f=100,equalizer=f=300:t=o:w=1:g=-2.5,'
                 'equalizer=f=2800:t=o:w=1:g=-1.5,lowpass=f=6500,'
                 'afade=t=in:st=0:d=0.012,'
                 f'aresample={RATE},areverse,afade=t=in:st=0:d=0.025,areverse')
        master = proof / (name + '-child-master.wav')
        ffmpeg(['-i', str(raw), '-af', chain, '-ac', '1', str(master)])
        # Normalize short dialogue by active-speech RMS; integrated LUFS gating
        # is unreliable for these sub-three-second cues, especially the carrier.
        with wave.open(str(master), 'rb') as source:
            speech = np.frombuffer(source.readframes(source.getnframes()), dtype='<i2').astype(float) / 32768
        peak = float(np.max(np.abs(speech)))
        active = speech[np.abs(speech) > peak * .02]
        gain = min(10 ** (-21 / 20) / np.sqrt(np.mean(active ** 2)),
                   10 ** (-4.5 / 20) / peak)
        speech *= gain
        with wave.open(str(master), 'wb') as target:
            target.setnchannels(1)
            target.setsampwidth(2)
            target.setframerate(RATE)
            target.writeframes((speech * 32767).astype('<i2').tobytes())
        ffmpeg(['-i', str(master), '-c:a', 'libvorbis', '-q:a', '4', str(out)])
        clips.append({'path': str(out.relative_to(SITE)), 'text': phrase,
                      'sha256': sha(out), 'qa': inspect(out)})
    # The loop entry describes its earlier conversion; this script never encodes it.
    assert sha(SITE / report['loop']['asset']) == report['loop']['asset_sha256']
    assert all(sha(path) == digest for path, digest in protected.items())
    report['voice'] = {
        'provider': 'Local FFmpeg libflite + rubberband; no external service',
        'speaker': 'awb, raised to a soft childlike register; Striker retains slt',
        'available_flite_voices': ['awb', 'kal', 'kal16', 'rms', 'slt'],
        'method': 'Fresh text synthesis for all seven clips. Vocal-tract/formant scale 1.28; '
                  'formant-preserving pitch contour 1.68/1.82/1.78/1.70/1.62 '
                  '(combined pitch 2.07–2.33); total tempo 0.97. Soft EQ, smooth '
                  'transients, active-speech RMS -21 dBFS normalization with -4.5 dBFS peak cap and short fades. '
                  'No echo, tremolo, chorus, old recording input, or browser TTS. '
                  'Local Ogg Vorbis mono 44100 Hz, quality 4.',
        'preservation': 'A10 loop, original Striker voices and BT audio unchanged byte for byte.',
        'clips': clips,
    }
    serialized = json.dumps(report, indent=2) + '\n'
    (SITE / 'docs/gatling-audio-provenance.json').write_text(serialized)
    (proof / 'provenance.json').write_text(serialized)
    (proof / 'protected-audio.json').write_text(json.dumps(
        {str(p.relative_to(SITE)): digest for p, digest in protected.items()}, indent=2) + '\n')
    print(json.dumps({'proof_directory': str(proof), 'clips': clips}, indent=2))


if __name__ == '__main__':
    main()
