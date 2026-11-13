"""Bake small transparent menu portraits from the game's actual native renderer.

Requires Python Pillow, Playwright and /usr/bin/chromium. Run from any directory.
Only dist/menu/*.webp is written inside the project. The temporary local HTTP
server serves current src and dist/assets; a browser-only route exposes loadArt's
private images after successful loading, without modifying production sources.
"""
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argparse
import base64
import io
import json
import mimetypes
import threading

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

SITE = Path(__file__).resolve().parents[1]
INJECTION = ' setInkLandmarkArt(inkLandmarkArt(images));'


class SourceHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/':
            data = b'<!doctype html><title>Native menu portrait baking</title>'
            content_type = 'text/html'
        else:
            if path.startswith('/assets/'):
                root, relative = SITE / 'dist', path.lstrip('/')
            elif path.startswith('/src/'):
                root, relative = SITE, path.lstrip('/')
            else:
                self.send_error(404)
                return
            target = (root / relative).resolve()
            if not target.is_relative_to(root.resolve()) or not target.is_file():
                self.send_error(404)
                return
            data = target.read_bytes()
            content_type = mimetypes.guess_type(target.name)[0] or 'application/octet-stream'
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *_):
        pass


RENDER = """async()=>{
 const {loadArt,inkTitlePlayer}=await import('/src/ink-renderer.js');
 const {createInkScene}=await import('/src/ink-scene.js');
 const {sceneArtImages}=await import('/src/enemy-styles.js');
 const {drawInkSaltik}=await import('/src/ink-saltik.js');
 await loadArt();
 if(!window.__portraitImages)throw new Error('Native image cache unavailable');
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const c=canvas.getContext('2d'),result=[];
 for(const level of [1,2,3,4])for(const [character,skin] of [
  ['striker','default'],['striker','dragon'],['gatling','default'],['gatling','limule'],['bt','default']]){
  const player=createInkScene({level,character,skin}).player;
  const art=sceneArtImages(window.__portraitImages,level,character,skin,player.visualModel);
  if(!art['ink-saltik'])throw new Error(`Missing ${level}/${character}/${skin} native texture`);
  c.clearRect(0,0,512,512);
  drawInkSaltik(c,art['ink-saltik'],inkTitlePlayer(player,256,490),{time:0,scale:3});
  result.push({name:`level${level}-${character}-${skin}.webp`,level,character,skin,
   visualModel:player.visualModel??'bt-native',png:canvas.toDataURL('image/png').split(',')[1]});
 }
 return result;
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--proof-dir', type=Path, default=Path('/tmp/saltik-v45/menu-portraits'))
    options = parser.parse_args()
    options.proof_dir.mkdir(parents=True, exist_ok=True)
    output = SITE / 'dist/menu'
    output.mkdir(parents=True, exist_ok=True)
    renderer = (SITE / 'src/ink-renderer.js').read_text()
    assert renderer.count(INJECTION) == 1, 'loadArt end marker changed; inspect before regenerating'
    injected = renderer.replace(INJECTION, INJECTION + '\n window.__portraitImages=images;', 1)
    server = ThreadingHTTPServer(('127.0.0.1', 0), SourceHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                                 args=['--no-sandbox', '--disable-dev-shm-usage'])
            page = browser.new_page()
            page.set_default_timeout(300000)
            page.route('**/src/ink-renderer.js', lambda route: route.fulfill(
                status=200, content_type='text/javascript', body=injected))
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
            records = page.evaluate(RENDER)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
    assert len(records) == 20
    summary = []
    sheet = Image.new('RGB', (5 * 256, 4 * 276), '#e9e0cc')
    labels = ImageDraw.Draw(sheet)
    for index, record in enumerate(records):
        rgba = Image.open(io.BytesIO(base64.b64decode(record.pop('png')))).convert('RGBA')
        assert rgba.size == (512, 512)
        alpha = rgba.getchannel('A')
        box = alpha.getbbox()
        assert box and box[0] > 0 and box[1] > 0 and box[2] < 512 and box[3] < 512, (record, box)
        assert (box[3] - box[1]) > 250 and (box[2] - box[0]) > 200, (record, box)
        path = output / record['name']
        rgba.save(path, 'WEBP', lossless=True, exact=True, method=6)
        decoded = Image.open(path).convert('RGBA')
        assert decoded.tobytes() == rgba.tobytes(), f'Lossless RGBA roundtrip failed: {path}'
        assert alpha.getextrema() == (0, 255), record
        record.update({'bytes': path.stat().st_size, 'alpha_bounds': box, 'size': rgba.size,
                       'lossless_rgba_verified': True})
        summary.append(record)
        x, y = index % 5 * 256, index // 5 * 276
        sheet.paste(rgba.resize((256, 256), Image.Resampling.LANCZOS), (x, y),
                    rgba.resize((256, 256), Image.Resampling.LANCZOS))
        labels.text((x + 5, y + 256), record['name'].removesuffix('.webp'), fill='#252320')
    total = sum(record['bytes'] for record in summary)
    sheet.save(options.proof_dir / 'contact-sheet.jpg', quality=94)
    report = {'portraits': summary, 'total_bytes': total, 'count': len(summary),
              'render': 'Native drawInkSaltik; inkTitlePlayer x256 footY490; scale3; time0; grounded idle',
              'source_cache': 'One successful loadArt call; browser-response injection only',
              'size_target_bytes': 2_000_000, 'within_size_target': total < 2_000_000}
    (options.proof_dir / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
