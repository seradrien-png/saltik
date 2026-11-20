#!/usr/bin/env python3
"""Bake compact hit rectangles from the exact registered native turn alpha.

Run from the repository root. Pillow/numpy/scipy are authoring dependencies;
no image parsing or extra dependencies are needed in the browser.
"""
import hashlib
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parent.parent
CELL = 24  # At most ~5 world units; merged runs keep every view <=40 boxes.
SOURCES = {
    'bt': 'bt-turn', 'desert-bt': 'desert-bt-turn',
    'modern-striker': 'modern-striker-turn-normal',
    'modern-gatling': 'modern-gatling-turn-normal',
    'desert-striker': 'desert-striker-turn',
}
metadata = subprocess.check_output(['node', '--input-type=module', '-e', """
import {nativeTurnView,nativeTurnLegs} from './src/character-turns.js';
const views=[];
for(const [character,visualModel,variant] of [['striker','modern-striker',null],['striker','modern-striker','desert'],['gatling','modern-gatling',null],['bt',null,null],['bt',null,'desert']]){
 const yaws=character==='striker'&&variant==='desert'?Array.from({length:8},(_,i)=>i*Math.PI/4):[Math.PI/4,Math.PI/2,Math.PI*.75];
 for(const yaw of yaws){const p={character,visualModel,...(character==='bt'?{btVariant:variant}:{strikerVariant:variant}),turn:{active:true,yaw}};const v=nativeTurnView(p);views.push({...v,legs:nativeTurnLegs(p,v)});}
}
console.log(JSON.stringify(views));
"""], cwd=ROOT, text=True)


def registered_alpha(name, view):
    image = Image.open(ROOT / 'dist/assets' / f'{name}.png').convert('RGBA')
    x, y, w, h = view['crop']
    image = image.crop((x, y, x+w, y+h))
    if view['model'] == 'modern-gatling':
        # Matches registerGatlingTurn: isolate the same connected opaque actor,
        # then register its standing height and feet to the native frame.
        labels, _ = label(np.asarray(image)[:, :, 3] >= 128, np.ones((3, 3)))
        sizes = np.bincount(labels.ravel()); sizes[0] = 0
        mask = labels == sizes.argmax()
        ys, xs = np.where(mask)
        left, top, right, bottom = xs.min(), ys.min(), xs.max()+1, ys.max()+1
        ratio = view['height'] / (bottom-top)
        dx = view['anchor'][0] - (left+right)/2 * ratio
        dy = view['anchor'][1] - bottom * ratio
        image.putalpha(Image.fromarray(np.uint8(mask)*255))
        image = image.transform((w, h), Image.Transform.AFFINE,
                                (1/ratio, 0, -dx/ratio, 0, 1/ratio, -dy/ratio))
    return np.asarray(image)[:, :, 3]


def split_polygon(points, y, lower):
    result = []
    inside = lambda p: p[1] >= y if lower else p[1] <= y
    for a, b in zip(points, points[1:]+points[:1]):
        aa, bb = inside(a), inside(b)
        if aa: result.append(a)
        if aa != bb:
            t = (y-a[1])/(b[1]-a[1])
            result.append([a[0]+(b[0]-a[0])*t, y])
    return result


def crouched_alpha(alpha, view):
    # Mirrors drawNativeTurn with crouch=true: stretch original struts,
    # retain rigid tire patches, then lower only the original cabin painting.
    h, w = alpha.shape
    source = Image.fromarray(alpha)
    output = Image.new('L', (w, h))
    drop = 12*view['height']/view['targetHeight']
    def masked(poly):
        mask = Image.new('L', (w, h)); ImageDraw.Draw(mask).polygon([tuple(p) for p in poly], fill=255)
        return Image.fromarray(np.minimum(np.asarray(source), np.asarray(mask)))
    for leg in view['legs']:
        hinge, seam = leg['hinge'], leg['wheelTop']
        ratio = max(.25, 1-drop/(seam-hinge))
        offset = hinge+drop-hinge*ratio
        strut = masked(split_polygon(leg['poly'], seam, False))
        strut = strut.transform((w, h), Image.Transform.AFFINE, (1, 0, 0, 0, 1/ratio, -offset/ratio))
        wheel = masked(split_polygon(leg['poly'], seam, True))
        output = Image.fromarray(np.maximum(np.asarray(output), np.maximum(np.asarray(strut), np.asarray(wheel))))
    desert = view['model'] in ['desert-striker', 'desert-bt']
    fixed_lower = min(l['wheelTop'] for l in view['legs']) if desert else None
    if fixed_lower is not None:
        lower = masked([[0,fixed_lower],[w,fixed_lower],[w,h],[0,h]])
        output = Image.fromarray(np.maximum(np.asarray(output), np.asarray(lower)))
    mask = Image.new('L', (w, h)); draw = ImageDraw.Draw(mask)
    draw.rectangle([0 if desert else 24, 0, w if desert else w-24,
                    fixed_lower if fixed_lower is not None else view['anchor'][1]+1], fill=255)
    for leg in view['legs']: draw.polygon([tuple(p) for p in leg['poly']], fill=0)
    body = Image.fromarray(np.minimum(np.asarray(source), np.asarray(mask)))
    body = body.transform((w, h), Image.Transform.AFFINE, (1,0,0,0,1,-drop))
    return np.maximum(np.asarray(output), np.asarray(body))


def rectangles(alpha):
    h, w = alpha.shape
    grid = [[alpha[y:min(h, y+CELL), x:min(w, x+CELL)].max() >= 128
             for x in range(0, w, CELL)] for y in range(0, h, CELL)]
    result, active = [], {}
    for y, row in enumerate(grid):
        runs, x = [], 0
        while x < len(row):
            if not row[x]:
                x += 1; continue
            end = x+1
            while end < len(row) and row[end]:
                end += 1
            runs.append((x, end)); x = end
        following = {}
        for run in runs:
            rect = active.get(run)
            if rect is None:
                rect = [run[0]*CELL, y*CELL, min(w, run[1]*CELL)-run[0]*CELL,
                        min(CELL, h-y*CELL)]
                result.append(rect)
            else:
                rect[3] += min(CELL, h-y*CELL)
            following[run] = rect
        active = following
    assert len(result) <= 40, f'{len(result)} rectangles exceeds mobile budget'
    return result


profiles = {}
for view in json.loads(metadata):
    model = view['model']
    alpha = registered_alpha(SOURCES[model], view)
    profiles.setdefault(model, {})[view['index']] = {
        'standing': rectangles(alpha), 'crouching': rectangles(crouched_alpha(alpha, view))}
source_hashes = {name: hashlib.sha256((ROOT/'dist/assets'/f'{name}.png').read_bytes()).hexdigest()
                 for name in SOURCES.values()}
output = '// Generated by scripts/generate-turn-hitboxes.py from registered opaque native art.\n'
output += '// 24-source-pixel cells, merged into <=40 rectangles per view; transparent gaps remain open.\n'
output += 'export const TURN_HITBOX_SOURCE_HASHES='+json.dumps(source_hashes, separators=(',', ':'))+';\n'
output += 'export const NATIVE_TURN_HITBOXES='+json.dumps(profiles, separators=(',', ':'))+';\n'
(ROOT/'src/native-turn-hitboxes.js').write_text(output)
print(f'Wrote {len(output)} bytes; '+str({m: max(len(posture) for frame in v.values() for posture in frame.values()) for m, v in profiles.items()}))
