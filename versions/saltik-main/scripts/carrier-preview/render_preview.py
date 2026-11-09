from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import functools,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=Path('/workspace/recovery-saltik/carrier-preview');OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith('/assets/'):self.path='/dist'+self.path
  return super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4180),functools.partial(Handler,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1920,'height':1160})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def hook(route):
   response=route.fetch();source=(ROOT/'scripts/carrier-preview/carrier-v15.js').read_text()
   source="import {drawProposal} from '/scripts/carrier-preview/proposal.js';\n"+source
   marker="export function drawInkCarrier(c,image,e,{camera=0,time=0,scale=1,handsImage=null}={}){"
   assert marker in source
   source=source.replace(marker,marker+"\n if(globalThis.carrierPreviewMode==='new')return drawProposal(c,e,{camera,scale});")
   route.fulfill(response=response,body=source)
  page.route('**/src/ink-carrier.js',hook)
  page.goto('http://127.0.0.1:4180/scripts/carrier-preview/preview.html');page.evaluate('window.ready')
  for mode in ['before','after','compare','detail','drones']:
   page.evaluate('(m)=>window.show(m)',mode);page.locator('#output').screenshot(path=str(OUT/(mode+'.png')))
  assert not errors,errors
  (OUT/'validation.json').write_text(json.dumps({'errors':errors,'modes':['before','after','compare','detail','drones'],'productionChanged':False,'published':False},indent=2));b.close()
finally:server.shutdown()
