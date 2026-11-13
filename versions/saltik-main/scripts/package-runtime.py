"""Create a lean, pixel-lossless publication without deleting source assets.

Run npm run build first. Requires Pillow; output/archive must not already exist.
The dist tree remains the complete, playable original edition and backup.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {
    'ink-boss', 'ink-boss-parts', 'ink-carrier', 'ink-carrier-dr01',
    'ink-carrier-platform', 'ink-carrier-profile-dr01', 'ink-carrier-support-dr01',
    'ink-carrier-two-eyes-dr01', 'lunar-archives-sky', 'lunar-archives-stone',
    'lunar-carrier-material', 'lunar-coherent-world', 'lunar-sky-layer',
}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def copy_asset(source, dest):
    try:
        os.link(source, dest)
    except OSError:
        shutil.copy2(source, dest)

def same_pixels(a, b):
    # Transparent RGB does not participate in rendering; alpha and every visible
    # color channel must remain exact. Never resize/crop sprite atlases.
    a, b = a.convert('RGBA'), b.convert('RGBA')
    if a.size != b.size:
        return False
    if a.tobytes() == b.tobytes():
        return True
    return all(x[3] == y[3] and (not x[3] or x == y)
               for x, y in zip(a.getdata(), b.getdata()))

def package(output, archive, cache=None):
    dist = ROOT / 'dist'
    output.mkdir(parents=True, exist_ok=False)
    public = output / 'out'
    public.mkdir()
    active = set(json.loads(subprocess.check_output([
        'node', '--input-type=module', '-e',
        "import {INK_ART_NAMES} from './src/ink-renderer.js';console.log(JSON.stringify([...new Set(INK_ART_NAMES)]))",
    ], cwd=ROOT)))
    assert not active & EXCLUDED, 'An archived asset became active; re-audit first'
    source_text = '\n'.join(p.read_text() for p in [
        *list((ROOT / 'src').glob('*.js')), ROOT / 'index.html', ROOT / 'promo.html',
        ROOT / 'style.css', ROOT / 'manifest.webmanifest',
    ])
    for name in EXCLUDED:
        assert not re.search(r'assets/' + re.escape(name) + r'\.(png|webp)', source_text), name
    before = sum(p.stat().st_size for p in dist.rglob('*') if p.is_file())
    images, excluded, replacements = [], [], {}
    for p in sorted(dist.rglob('*')):
        if not p.is_file():
            continue
        rel = p.relative_to(dist)
        if rel.parent == Path('assets') and p.suffix == '.png':
            if p.stem in EXCLUDED:
                excluded.append({'path': str(rel), 'bytes': p.stat().st_size, 'sha256': digest(p),
                                 'reason': 'Absent from resolved art registry and direct runtime URLs; historical original retained in dist and Git'})
                continue
            assert p.stem in active, f'Unclassified image: {rel}'
            dest = public / rel.with_suffix('.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            cached = cache / dest.name if cache else None
            if cached and cached.exists():
                copy_asset(cached, dest)
            else:
                with Image.open(p) as im:
                    im.save(dest, format='WEBP', lossless=True, exact=True, method=4)
            with Image.open(p) as original, Image.open(dest) as compressed:
                assert same_pixels(original, compressed), f'Pixel mismatch: {p}'
                size = list(original.size)
            if dest.stat().st_size >= p.stat().st_size:
                dest.unlink()
                dest = public / rel
                copy_asset(p, dest)
            else:
                replacements[str(rel)] = str(rel.with_suffix('.webp'))
            images.append({'original': str(rel), 'published': str(dest.relative_to(public)),
                           'before': p.stat().st_size, 'after': dest.stat().st_size,
                           'dimensions': size, 'visible_pixels_identical': True,
                           'original_sha256': digest(p), 'published_sha256': digest(dest)})
        else:
            dest = public / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            copy_asset(p, dest)
    assert {p['path'].removeprefix('assets/').removesuffix('.png') for p in excluded} == EXCLUDED
    # Only URL serialization changes in the generated output. Canonical source,
    # gameplay, timing and original graphics remain byte-for-byte unchanged.
    for p in public.rglob('*'):
        if p.suffix not in {'.js', '.html', '.css', '.webmanifest'}:
            continue
        text = p.read_text()
        changed = text
        for old, new in replacements.items():
            changed = changed.replace(old, new)
        if p == public / 'src/ink-renderer.js':
            old = 'new URL(`../assets/${name}.png`,import.meta.url).href'
            assert old in changed
            urls = {n: '../' + replacements.get(f'assets/{n}.png', f'assets/{n}.png') for n in sorted(active)}
            changed = changed.replace(old, 'new URL((' + json.dumps(urls, separators=(',', ':')) + ')[name],import.meta.url).href')
        if changed != text:
            p.unlink()  # Break the hard link before changing generated text.
            p.write_text(changed)
    protected = ['assets/royal-eel-swim.png', 'assets/royal-eel.png',
                 'audio/gatling-brrrt-loop.ogg']
    protected += [str(p.relative_to(dist)) for p in (dist / 'audio/voices').glob('*') if p.is_file()]
    for rel in protected:
        assert (public / replacements.get(rel, rel)).is_file(), rel
    for folder in ['audio', 'video', 'icons']:
        for p in (dist / folder).rglob('*'):
            if p.is_file():
                assert digest(p) == digest(public / p.relative_to(dist)), str(p)
    after = sum(p.stat().st_size for p in public.rglob('*') if p.is_file())
    report = {'before_bytes': before, 'after_bytes': after, 'saved_bytes': before-after,
              'reduction_percent': round(100*(before-after)/before, 3),
              'excluded_files': excluded, 'images': images,
              'protected_assets': protected, 'all_audio_video_icons_unchanged': True,
              'originals_retained': True, 'output': str(public)}
    (output / 'asset-audit.json').write_text(json.dumps(report, indent=2) + '\n')
    with tarfile.open(archive, 'x') as tar:
        tar.add(ROOT / '.openai/hosting.json', arcname='.openai/hosting.json')
        tar.add(public, arcname='out')
    print(json.dumps({k: report[k] for k in ['before_bytes', 'after_bytes', 'saved_bytes', 'reduction_percent']}))
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--archive', required=True, type=Path)
    parser.add_argument('--cache', type=Path)
    args = parser.parse_args()
    package(args.output, args.archive, args.cache)
