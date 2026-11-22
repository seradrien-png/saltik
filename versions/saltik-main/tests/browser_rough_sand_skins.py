from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[1]/'dist';OUT=Path(os.environ.get('SALTIK_ROUGH_QA_OUT','/tmp/saltik-rough-qa'));OUT.mkdir(parents=True,exist_ok=True)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',4411),partial(H,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
HOOK='''
window.__qaState=()=>JSON.parse(JSON.stringify({time:game.time,player:game.player,enemies:game.enemies}));
window.__qaPlace=(level=1,character=selectedCharacter)=>{view='paused';game=createGame({level,character});game.introElapsed=game.introDuration;game.schedule=[];game.enemies=[];game.projectiles=[];game.pickups=[];const x=600;Object.assign(game.player,{x,y:game.groundAt(x),supportY:game.groundAt(x),vx:0,vy:0,onGround:true,supportPose:null,turn:null,invulnerable:0});game.maxX=x;renderer.reset();};
window.__qaStep=async(input={},frames=1)=>{for(let i=0;i<frames;i++)update(game,input,1/60);renderer.render(game,game.time*1000,'playing');const{inkSaltikGeometry}=await import('/src/ink-saltik.js');const{supportHeight}=await import('/src/world.js');const geo=inkSaltikGeometry(game.player,{time:game.time,sampleGround:x=>supportHeight(game,game.player,x)}),n=geo.btNative??geo,legs=geo.modernLegs??geo.nativeLegs??n.legs;return{player:{x:game.player.x,y:game.player.y,onGround:game.player.onGround,turn:game.player.turn,motionDistance:game.player.motionDistance},legs:legs.map(l=>({offset:l.offset,roll:l.roll,suspension:l.suspension,contact:l.contact})),tilt:geo.tilt};};
'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);results=[]
  page=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=2);page.set_default_timeout(120000);errors=[];missing=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  def hook(route):
   r=route.fetch();route.fulfill(response=r,body=r.text()+HOOK)
  page.route('**/src/main.js',hook);page.goto('http://127.0.0.1:4411/?level=1&character=striker');page.wait_for_function('!document.querySelector("#start").disabled');page.tap('#start')
  # Return to the real menu; verify default choices and explicit alternatives.
  page.reload();page.wait_for_function('!document.querySelector("#start").disabled')
  for char,skins in [('striker',['default','dragon','military']),('gatling',['default','military']),('bt',['default'])]:
   page.click(f'[data-character="{char}"]')
   options=page.locator('#cosmetic-skin option').evaluate_all('(nodes)=>nodes.map(n=>n.value)');assert options==skins,[char,options]
   for level in [1,2,3,4,5]:
    page.click(f'[data-level="{level}"]');assert page.locator('#cosmetic-skin').input_value()=='default'
    for skin in skins:
     
     if char!='bt':page.select_option('#cosmetic-skin',skin)
     snap=page.evaluate("async()=>{const m=await import('/src/main.js');return m.getSnapshot()}")
     assert snap['cosmeticSkin']==skin and snap['level']==level
     assert snap['player'].get('strikerVariant')==('desert' if char=='striker' and skin=='military' else None)
     if level in [2,3,5]:page.screenshot(path=str(OUT/f'menu-{char}-{skin}-{level}.png'))
     results.append({'character':char,'skin':skin,'level':level,'menu':True})
  page.tap('#start')
  for char in ['striker','gatling','bt']:
   page.evaluate('([l,c])=>__qaPlace(l,c)',[5,char]);samples=[]
   for phase in range(6):
    q=page.evaluate('()=>__qaStep({right:true},35)');assert q['player']['onGround'];assert all(l['suspension'] for l in q['legs']);samples.append(q)
    if phase in [1,4]:page.screenshot(path=str(OUT/f'rough-{char}-{phase}.png'))
   assert samples[-1]['player']['motionDistance']>700
   assert len({round(q['legs'][0]['offset'],1) for q in samples})>=4
   jump=page.evaluate('()=>__qaStep({jump:true},3)');assert not jump['player']['onGround']
   results.append({'character':char,'roughMotion':True,'jump':True,'samples':samples})
  assert not errors,errors;assert not missing,missing
  (OUT/'browser-report.json').write_text(json.dumps({'cases':results,'mobile':[844,390],'errors':errors,'missing':missing},indent=2)+'\n');b.close();print('30 menu combinations, default resets, explicit military/Dragon, and three rough-sand runs verified')
finally:server.shutdown();server.server_close()
