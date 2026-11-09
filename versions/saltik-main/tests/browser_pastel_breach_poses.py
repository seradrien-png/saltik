from pathlib import Path
from playwright.sync_api import sync_playwright
import json
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import functools
server=ThreadingHTTPServer(('127.0.0.1',4322),functools.partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parents[1])))
Thread(target=server.serve_forever,daemon=True).start()
OUT=Path('/workspace/deliverables/saltik-pastel-finishing-boss')
OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1920,'height':1080});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:4322/tests/',wait_until='domcontentloaded')
 result=page.evaluate('''async()=>{
  const m=await import('/src/ink-encounters.js'),{bakePastelArt}=await import('/src/pastel-paint.js');
  const images={};
  for(const [name,path] of Object.entries({'ink-boss':'pastel-boss','ink-boss-parts':'pastel-boss-parts','ink-saltik':'ink-saltik','ink-enemy-saltik':'ink-enemy-saltik'})){
   const im=new Image();im.src='/dist/assets/'+path+'.png';await im.decode();images[name]=im;
   if(name==='ink-saltik'||name==='ink-enemy-saltik'){const paint=new Image();paint.src='/dist/assets/'+name+'-paint.png';await paint.decode();images[name]=bakePastelArt(im,paint,{strength:1,outline:2});}
  }
  window.poses=m;window.art=images;
  document.body.innerHTML='<canvas id="preview" width="1920" height="1080"></canvas>';document.body.style='margin:0;background:#f2e5cc';const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#f2e5cc';c.fillRect(0,0,1920,1080);
  const states=[['HULL · grip','hull','qte',0,0],['HULL · press 2','hull','qte',.16,2],['HULL · tear','hull','tear',.18,3],['HULL · burst','hull','fire',.11,3],['POD · grip','pod','qte',0,0],['POD · press 2','pod','qte',.16,2],['POD · tear','pod','tear',.18,3],['POD · destroyed','pod','fire',.1,3]];
  const results=[];
  for(let i=0;i<states.length;i++){
   const [label,kind,phase,t,taps]=states[i],b={x:0,y:0,hp:200,maxHp:200,podRaise:0,podPhase:'stowed',cannonRecoil:0,breached:kind==='hull'&&phase==='fire',podDestroyed:kind==='pod'&&phase==='fire'},q={kind,phase,elapsed:phase==='qte'?1:t,taps,effortsCompleted:taps-1,effortElapsed:phase==='qte'?t:0,shotsFired:phase==='fire'?1:0,deckX:kind==='pod'?35:-85,deckY:kind==='pod'?-151:-85};
   const x=240+i%4*480,y=460+Math.floor(i/4)*510;c.fillStyle='#38434a';c.font='bold 23px sans-serif';c.fillText(label,x-190,y-410);
   c.save();c.translate(x,y);c.scale(1.2,1.2);m.drawInkBossTank(c,images,b,{time:0,breach:q});m.drawInkBossBreach(c,images,q,b,{time:0});c.restore();
   const g=m.inkBreachPoseGeometry(q,b);results.push({label,hands:g.handPoints,targets:g.targets,feet:g.geo.legs.map(l=>({id:l.id,grounded:l.grounded,contact:l.contact})),fire:g.fire});
  }
  return results;
 }''')
 page.screenshot(path=str(OUT/'native-boss-breach-stages.png'))
 page.evaluate('''()=>{const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#f2e5cc';c.fillRect(0,0,1920,1080);poses.drawInkDuelScreen(c,art,{phase:'impact',elapsed:.08,dir:1,enemyX:300,enemyY:400},{width:1920,height:1080});}''')
 page.screenshot(path=str(OUT/'native-duel-screen-cracks.png'))
 (OUT/'native-boss-breach-geometry.json').write_text(json.dumps({'states':result,'errors':errors},indent=2))
 print(json.dumps({'errors':errors,'output':str(OUT)}));assert not errors; b.close()
