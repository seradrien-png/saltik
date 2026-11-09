from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import functools,base64,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];WORK=Path('/workspace/recovery-saltik/promo-v2');(WORK/'action').mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith('/assets/'):self.path='/dist'+self.path
  return super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4178),functools.partial(Handler,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1920,'height':1080})
  page.goto('http://127.0.0.1:4178/scripts/promo-v2/action.html');page.evaluate('window.ready')
  for i in range(180):
   data=page.evaluate('window.nextAction()');(WORK/'action'/f'{i:03}.jpg').write_bytes(base64.b64decode(data))
   if i%30==0:print(f'Native action frames {i}/180',flush=True)
  (WORK/'action-evidence.json').write_text(json.dumps(page.evaluate('window.actionEvidence()'),indent=2));b.close()
finally:server.shutdown()
