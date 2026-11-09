from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
import json
from playwright.sync_api import sync_playwright,expect
ROOT=Path('/workspace/sites/saltik-v2-matin-dore');OUT=Path('/workspace/level-two-saltik/qa');OUT.mkdir(exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4187),partial(Handler,directory=str(ROOT/'dist')));Thread(target=server.serve_forever,daemon=True).start()
reports=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for device,w,h,touch in [('desktop',1366,768,False),('phone',844,390,True)]:
   ctx=b.new_context(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch,device_scale_factor=1);pg=ctx.new_page();errors=[];bad=[]
   pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=400 else None)
   # The only state injection is a browser response fixture for result/film UI.
   # No test control or setters are written into production main.js.
   def hook(route):
    response=route.fetch();code=response.text();code+='\nwindow.__qaWin=()=>{game.status="won";finish();};\n';route.fulfill(response=response,body=code)
   pg.route('**/src/main.js',hook);pg.goto('http://127.0.0.1:4187/');expect(pg.locator('#start')).to_be_enabled(timeout=45000)
   pg.locator('[data-level="2"]').click();pg.screenshot(path=str(OUT/(device+'-menu.png')));pg.locator('#start').click();pg.evaluate("async()=>{window.__read=(await import('./src/main.js')).getSnapshot}");pg.wait_for_function('()=>window.__read().introElapsed>=window.__read().introDuration',timeout=30000)
   snapshot=lambda:pg.evaluate("async()=>{const m=await import('./src/main.js');return m.getSnapshot()}")
   first=snapshot();assert first['level']==2 and first['view']=='playing' and first['boss'] is None
   pg.keyboard.down('ArrowRight');pg.keyboard.down('KeyJ');pg.wait_for_timeout(1800);pg.keyboard.up('ArrowRight');pg.keyboard.up('KeyJ');playing=snapshot();assert playing['player']['x']>first['player']['x'];assert playing['stats']['shots']>0
   pg.screenshot(path=str(OUT/(device+'-level2.png')))
   pg.locator('#pause').click();paused=snapshot();pg.wait_for_timeout(450);frozen=snapshot();assert frozen['time']==paused['time'] and frozen['lunar']==paused['lunar']
   pg.locator('#restart-pause').click();again=snapshot();assert again['level']==2 and again['time']<1 and again['lunar']['wave']==0
   pg.locator('#pause').click();pg.locator('#restart-pause').click();pg.wait_for_function('()=>window.__read().introElapsed>=window.__read().introDuration',timeout=30000)
   pg.evaluate('window.__qaWin()');pg.wait_for_timeout(4800);expect(pg.locator('#result-screen')).to_be_visible();expect(pg.locator('#next-level')).to_be_hidden();assert snapshot()['victoryFilm']['state']=='idle'
   pg.locator('#return-home').click();pg.locator('[data-level="1"]').click();pg.locator('#start').click();pg.wait_for_function('()=>window.__read().introElapsed>=window.__read().introDuration',timeout=30000);assert snapshot()['level']==1
   pg.evaluate('window.__qaWin()');pg.wait_for_timeout(4800);expect(pg.locator('#victory-film')).to_be_visible();pg.locator('#victory-film-skip').click();expect(pg.locator('#next-level')).to_be_visible();pg.locator('#next-level').click();next=snapshot();assert next['level']==2 and next['view']=='playing'
   assert not errors and not bad,(errors,bad)
   reports.append({'device':device,'menu_choice':True,'level2_movement_and_fire':True,'paused_simulation_frozen':True,'restart_same_level':True,'level2_result_without_film':True,'level1_film_preserved':True,'next_level_after_film':True,'errors':errors,'bad_responses':bad,'first_level2':{'x':first['player']['x'],'hp':first['player']['hp']},'played_level2':{'x':playing['player']['x'],'shots':playing['stats']['shots']}});ctx.close()
  b.close()
finally:server.shutdown()
(OUT/'ui-report.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports),flush=True)
