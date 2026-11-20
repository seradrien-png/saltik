"""Render the supplied MIDI unchanged with FluidSynth + a General MIDI SoundFont.

Authoring utility only; no MIDI parser or synthesizer is shipped to the browser.
Requires libfluidsynth, ffmpeg and the Debian TimGM6mb SoundFont.
"""
import argparse
import array
import ctypes as C
import ctypes.util
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'audio-sources/Saltik_Sable_Rouge_La_Plaine_des_Ombres_V2.mid'
OUTPUT = ROOT / 'dist/audio/saltik_sable_rouge_v2.ogg'
SOUNDFONT = Path('/usr/share/sounds/sf2/TimGM6mb.sf2')
RATE = 44100
TAIL = 2.0  # Allow the supplied final notes to release naturally.


def read_midi(path):
    data = path.read_bytes()
    assert data[:4] == b'MThd'
    size = int.from_bytes(data[4:8], 'big')
    fmt, count, division = struct.unpack('>HHH', data[8:14])
    assert fmt in (0, 1) and not division & 0x8000
    pos, events, names = 8 + size, [], []
    for track in range(count):
        assert data[pos:pos + 4] == b'MTrk'
        length = int.from_bytes(data[pos + 4:pos + 8], 'big')
        stream = data[pos + 8:pos + 8 + length]
        pos += 8 + length
        index, tick, running = 0, 0, None

        def vlq():
            nonlocal index
            value = 0
            while True:
                byte = stream[index]
                index += 1
                value = (value << 7) | (byte & 127)
                if byte < 128:
                    return value

        while index < len(stream):
            tick += vlq()
            status = stream[index]
            if status >= 128:
                index += 1
            else:
                assert running is not None
                status = running
            if status == 255:
                kind = stream[index]
                index += 1
                length = vlq()
                payload = stream[index:index + length]
                index += length
                events.append((tick, track, len(events), 'meta', kind, payload))
                if kind == 3:
                    names.append({'track': track, 'name': payload.decode('utf8', errors='replace')})
            elif status in (240, 247):
                length = vlq()
                payload = stream[index:index + length]
                index += length
                events.append((tick, track, len(events), 'sysex', status, payload))
                running = None
            else:
                assert 128 <= status < 240
                running = status
                length = 1 if status >> 4 in (12, 13) else 2
                payload = stream[index:index + length]
                index += length
                events.append((tick, track, len(events), 'channel', status, payload))
    assert pos == len(data)
    events.sort(key=lambda e: e[:3])
    tempo, previous, seconds, timeline = 500000, 0, 0.0, []
    for event in events:
        seconds += (event[0] - previous) * tempo / division / 1_000_000
        previous = event[0]
        timeline.append((round(seconds * RATE), event))
        if event[3:5] == ('meta', 81):
            tempo = int.from_bytes(event[5], 'big')
    metadata = {
        'source': SOURCE.name, 'source_sha256': hashlib.sha256(data).hexdigest(),
        'source_bytes': len(data), 'format': fmt, 'tracks': count, 'ticks_per_quarter': division,
        'track_names': names, 'duration_seconds': seconds,
        'note_on_count': sum(e[3] == 'channel' and e[4] >> 4 == 9 and e[5][1] > 0 for e in events),
        'tempos': [{'tick': e[0], 'microseconds_per_quarter': int.from_bytes(e[5], 'big')} for e in events if e[3:5] == ('meta', 81)],
        'program_changes': [{'tick': e[0], 'channel': e[4] & 15, 'program_zero_based': e[5][0]} for e in events if e[3] == 'channel' and e[4] >> 4 == 12],
        'sysex_events': sum(e[3] == 'sysex' for e in events),
    }
    return timeline, metadata


def render(soundfont, output):
    timeline, metadata = read_midi(SOURCE)
    lib = C.CDLL(C.util.find_library('fluidsynth'))

    def bind(name, restype, *args):
        fn = getattr(lib, name)
        fn.restype, fn.argtypes = restype, args
        return fn

    ptr, integer = C.c_void_p, C.c_int
    settings = bind('new_fluid_settings', ptr)()
    bind('fluid_settings_setnum', integer, ptr, C.c_char_p, C.c_double)(settings, b'synth.sample-rate', RATE)
    bind('fluid_settings_setnum', integer, ptr, C.c_char_p, C.c_double)(settings, b'synth.gain', .5)
    bind('fluid_settings_setint', integer, ptr, C.c_char_p, integer)(settings, b'synth.cpu-cores', 1)
    synth = bind('new_fluid_synth', ptr, ptr)(settings)
    assert bind('fluid_synth_sfload', integer, ptr, C.c_char_p, integer)(synth, str(soundfont).encode(), 1) >= 0
    dispatch = {8: ('noteoff', 2), 9: ('noteon', 3), 10: ('key_pressure', 3),
                11: ('cc', 3), 12: ('program_change', 2), 13: ('channel_pressure', 2), 14: ('pitch_bend', 2)}
    functions = {kind: bind('fluid_synth_' + name, integer, ptr, *([integer] * argc)) for kind, (name, argc) in dispatch.items()}
    write = bind('fluid_synth_write_s16', integer, ptr, integer, ptr, integer, integer, ptr, integer, integer)
    peak, squares, sample_count = 0, 0, 0
    with tempfile.TemporaryDirectory() as temporary:
        wav = Path(temporary) / 'score.wav'
        with wave.open(str(wav), 'wb') as audio:
            audio.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))

            def samples(count):
                nonlocal peak, squares, sample_count
                while count:
                    chunk = min(count, 8192)
                    buffer = (C.c_short * (chunk * 2))()
                    assert write(synth, chunk, buffer, 0, 2, buffer, 1, 2) == 0
                    audio.writeframes(bytes(buffer))
                    values = array.array('h', bytes(buffer))
                    peak = max(peak, max(abs(v) for v in values))
                    squares += sum(v * v for v in values)
                    sample_count += len(values)
                    count -= chunk

            cursor = 0
            for sample, event in timeline:
                samples(sample - cursor)
                cursor = sample
                _, _, _, kind, status, payload = event
                if kind == 'channel':
                    op, channel = status >> 4, status & 15
                    args = list(payload)
                    if op == 8:
                        args = args[:1]
                    elif op == 14:
                        args = [args[0] | args[1] << 7]
                    result = functions[op](synth, channel, *args)
                    # FluidSynth returns -1 for note-offs without an active voice,
                    # including velocity-zero note-ons; these are valid MIDI.
                    assert result == 0 or op == 8 or (op == 9 and args[1] == 0), (event, result)
                elif kind == 'sysex':
                    # The supplied source currently contains none. Fail explicitly
                    # rather than silently discarding a future source's messages.
                    raise ValueError('SysEx requires explicit FluidSynth routing')
            samples(round(RATE * TAIL))
        output.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-c:a', 'libvorbis', '-q:a', '5', '-metadata', 'title=Saltik Sable Rouge - La Plaine des Ombres V2', str(output)], check=True)
    bind('delete_fluid_synth', None, ptr)(synth)
    bind('delete_fluid_settings', None, ptr)(settings)
    metadata.update({'soundfont': soundfont.name, 'soundfont_sha256': hashlib.sha256(soundfont.read_bytes()).hexdigest(),
                     'sample_rate': RATE, 'channels': 2, 'release_tail_seconds': TAIL,
                     'rendered_duration_seconds': sample_count / (2 * RATE), 'pcm_peak': peak / 32768,
                     'pcm_rms': (squares / sample_count) ** .5 / 32768,
                     'output': str(output.relative_to(ROOT)), 'output_bytes': output.stat().st_size,
                     'output_sha256': hashlib.sha256(output.read_bytes()).hexdigest()})
    assert .001 < metadata['pcm_rms'] < .5 and 0 < peak < 32767, metadata
    (ROOT / 'docs/red-sand-music-validation.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(json.dumps(metadata, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--soundfont', type=Path, default=SOUNDFONT)
    args = parser.parse_args()
    render(args.soundfont, OUTPUT)
