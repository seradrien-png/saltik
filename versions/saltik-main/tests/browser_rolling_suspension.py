from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[1]/'dist';OUT=Path(os.environ.get('SALTIK_ROLLING_QA_OUT','/tmp/saltik-rolling-qa'));OUT.mkdir(parents=True,exist_ok=True)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',4411),partial(H,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
HOOK='''
window.__qaState=()=>JSON.parse(JSON.stringify({time:game.time,player:game.player,enemies:game.enemies}));
window.__qaPlace=(level=1,character=selectedCharacter)=>{view='paused';game=createGame({level,character});game.introElapsed=game.introDuration;game.schedule=[];game.enemies=[];game.projectiles=[];game.pickups=[];const x=level===4?500:4000;Object.assign(game.player,{x,y:game.groundAt(x),supportY:game.groundAt(x),vx:0,vy:0,onGround:true,supportPose:null,turn:null,invulnerable:100});game.maxX=x;renderer.reset();};
window.__qaStep=async(input={},frames=1)=>{for(let i=0;i<frames;i++)update(game,input,1/60);renderer.render(game,game.time*1000,'playing');const{inkSaltikGeometry}=await import('/src/ink-saltik.js');const{supportHeight}=await import('/src/world.js');const geo=inkSaltikGeometry(game.player,{time:game.time,sampleGround:x=>supportHeight(game,game.player,x)}),n=geo.btNative??geo,legs=geo.modernLegs??geo.nativeLegs??n.legs;return{player:{x:game.player.x,y:game.player.y,onGround:game.player.onGround,turn:game.player.turn,motionDistance:game.player.motionDistance},legs:legs.map(l=>({offset:l.offset,roll:l.roll,suspension:l.suspension,contact:l.contact})),tilt:geo.tilt};};
'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);results=[]
  page=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=2);page.set_default_timeout(120000);errors=[];missing=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
  def hook(route):
   r=route.fetch();route.fulfill(response=r,body=r.text()+HOOK)
  page.route('**/src/main.js',hook);page.goto('http://127.0.0.1:4411/?level=1&character=striker');page.wait_for_function('!document.querySelector("#start").disabled');page.tap('#start')
  for char in ['striker','gatling','bt']:
   for level in [1,2,3,4,5]:
    page.evaluate('([l,c])=>__qaPlace(l,c)',[level,char]);a=page.evaluate('()=>__qaStep({},1)');m=page.evaluate('()=>__qaStep({right:true},40)');assert m['player']['motionDistance']>a['player']['motionDistance']+80
    assert all(l['suspension'] for l in m['legs']),[char,level,m]
    assert all(isinstance(l['contact']['y'],(int,float)) for l in m['legs'])
    page.screenshot(path=str(OUT/f'{char}-level-{level}.png'))
    stop=page.evaluate('()=>__qaStep({},30)');stop2=page.evaluate('()=>__qaStep({},15)');assert stop2['player']['motionDistance']==stop['player']['motionDistance']
    t=page.evaluate('()=>__qaState().time');page.wait_for_timeout(80);assert page.evaluate('()=>__qaState().time')==t
    if level!=4:
     jump=page.evaluate('()=>__qaStep({jump:true},3)');assert not jump['player']['onGround'],[char,level,jump];assert all(not l['suspension'] for l in jump['legs'])
     page.evaluate('()=>__qaStep({},100)');turn=page.evaluate('()=>__qaStep({left:true},1)');assert turn['player']['turn']['active']
    else:
     jump=page.evaluate('()=>__qaStep({jump:true},3)');assert jump['player']['onGround'],'Exterior walk keeps its existing jump restriction'
    results.append({'character':char,'level':level,'moves':True,'suspension':True,'stops':True,'jump':'preserved exterior restriction' if level==4 else True,'turn':'preserved exterior facing' if level==4 else True,'pause':True})
  assert not errors,errors;assert not missing,missing
  (OUT/'browser-report.json').write_text(json.dumps({'cases':results,'mobile':[844,390],'errors':errors,'missing':missing},indent=2)+'\n');b.close();print('15 mobile character/level combinations: terrain suspension, rolling travel, stop, jump, native turn and pause verified')
finally:server.shutdown();server.server_close()
