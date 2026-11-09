from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import functools,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2];OUT=Path('/workspace/recovery-saltik/carrier-preview/integrated');OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith('/assets/'):self.path='/dist'+self.path
  return super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4181),functools.partial(Handler,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1920,'height':1080});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:4181/scripts/carrier-preview/validate.html');page.evaluate('window.ready')
  poses=[]
  for kind in ['idle','walking','fire','docked','ko','off']:
   for direction in [1,-1]:
    poses.append({'kind':kind,'dir':direction,**page.evaluate('([k,d])=>window.detail(k,d)',[kind,direction])});page.locator('#detail').screenshot(path=str(OUT/f'{kind}-{direction}.png'))
  play=[]
  for n in [60,65,75,100,200]:
   play.append(page.evaluate('(n)=>window.step(n)',n));page.locator('#game').screenshot(path=str(OUT/f'encounter-{len(play)}.png'))
  assert play[-1]['shots']>15 and play[-1]['deployments']>=3,play[-1]
  assert page.evaluate('window.pauseProbe()')
  page.evaluate('window.prepareShutdown()');page.evaluate('window.step(25)');page.locator('#game').screenshot(path=str(OUT/'unplug.png'));final=page.evaluate('window.step(180)');page.locator('#game').screenshot(path=str(OUT/'neutralized.png'))
  assert final['carrier']['neutralized'] and final['disconnects']==1,final
  # Real built UI loading and controls on desktop and a landscape phone.
  ui=[]
  for name,w,h,touch in [('desktop',1440,900,False),('phone',844,390,True)]:
   ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch,device_scale_factor=1);pg=ctx.new_page();pg.on('pageerror',lambda e:errors.append(str(e)));pg.goto('http://127.0.0.1:4181/dist/');expect(pg.locator('#start')).to_be_enabled(timeout=30000);pg.locator('#start').click();pg.wait_for_timeout(1200);pg.screenshot(path=str(OUT/f'ui-{name}.png'));snapshot=pg.evaluate("async()=>{const m=await import('./src/main.js');return m.getSnapshot()}");ui.append({'device':name,'snapshot':snapshot});ctx.close()
  assert not errors,errors
  (OUT/'validation.json').write_text(json.dumps({'poses':poses,'encounter':play,'shutdown':final,'ui':ui,'errors':errors},indent=2));b.close()
finally:server.shutdown()
