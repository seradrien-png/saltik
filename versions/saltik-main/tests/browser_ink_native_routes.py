"""Render source-native stairs and roof-gap falling through the actual engine."""
from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlparse
import json, os
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('INK_QA_OUT','/workspace/deliverables/saltik-ink-v1-qa/native-routes'));OUT.mkdir(parents=True,exist_ok=True)
def overlay(route):
 path=urlparse(route.request.url).path.lstrip('/') or 'index.html'
 if path=='__native-qa.html':route.fulfill(body='<html><body></body></html>',content_type='text/html');return
 local=ROOT/('dist/'+path if path.startswith('assets/') else path)
 if local.is_file() and (path in ['index.html','style.css'] or path.startswith(('src/','assets/'))):route.fulfill(path=str(local))
 else:route.continue_()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1280,'height':720});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('**/*',overlay)
 page.goto(os.environ.get('FERAL_PREVIEW_URL','http://127.0.0.1:4295').rstrip('/')+'/__native-qa.html',wait_until='networkidle')
 page.evaluate('''async()=>{
 const {createInkScene}=await import('./src/ink-scene.js'),{createRenderer,loadArt}=await import('./src/ink-renderer.js'),{update}=await import('./src/engine.js'),{surfaceHeight}=await import('./src/world.js'),{INK_STAIRS}=await import('./src/ink-demo-layout.js');
 document.body.innerHTML='<canvas id="qa" style="width:1280px;height:720px;display:block"></canvas>';document.body.style.margin='0';await loadArt();
 window.qa={createInkScene,createRenderer,update,surfaceHeight,INK_STAIRS,renderer:createRenderer(document.querySelector('#qa'))};
 window.startStair=id=>{const entry=INK_STAIRS.find(e=>e.id===id),g=createInkScene(),dir=Math.sign(entry.points.at(-1)[0]-entry.points[0][0]),lower=g.platforms.find(p=>p.id===entry.lowerId),x=entry.points[0][0]-dir*8;
 g.schedule=[];g.enemies=[];g.obstacles=[];g.pickups=[];g.introElapsed=g.introDuration;Object.assign(g.player,{x,y:lower?surfaceHeight(lower,x):g.groundAt(x),onGround:true,platformId:lower?.id??null,rampId:null,dir,turn:null});qa.g=g;qa.dir=dir;return entry;};
 window.step=(input,frames)=>{for(let i=0;i<frames;i++){qa.update(qa.g,input,1/60);qa.renderer.render(qa.g,qa.g.time*1000,'playing');}return {x:qa.g.player.x,y:qa.g.player.y,onGround:qa.g.player.onGround,platformId:qa.g.player.platformId,rampId:qa.g.player.rampId};};
}''')
 results=[]
 for name,entry,frames in [('observatory-native','observatory-stairs',48),('checkpoint-lower-native','checkpoint-lower-stairs',35),('checkpoint-upper-native','checkpoint-west-stairs',35),('breach-native','breach-east-stairs',50)]:
  page.evaluate('(id)=>startStair(id)',entry)
  state=page.evaluate('(frames)=>step({[qa.dir===1?"right":"left"]:true},frames)',frames)
  assert state['onGround'],(name,state)
  assert state['rampId']==entry,(name,state)
  page.screenshot(path=str(OUT/(name+'.png')));results.append({'name':name,**state})
 # Access the low native shelf from ordinary forward play, rather than
 # assigning the player to an unreachable decorative metal crown.
 page.evaluate("""()=>{const g=qa.createInkScene();g.schedule=[];g.enemies=[];g.obstacles=[];g.pickups=[];g.introElapsed=g.introDuration;Object.assign(g.player,{x:14860,y:g.groundAt(14860),onGround:true,platformId:null,rampId:null,dir:1,turn:null});qa.g=g;}""")
 page.evaluate('()=>step({right:true},11)');page.evaluate('()=>step({right:true,jump:true},1)')
 state=page.evaluate("""()=>{for(let i=0;i<120;i++){const state=step({right:true},1);if(state.platformId==='ledge-5'&&state.x>15170)return state;}throw Error('forward jump failed to reach native shelf');}""")
 assert state['onGround'] and state['platformId']=='ledge-5',state
 page.screenshot(path=str(OUT/'breach-forward-ledge-access.png'));results.append({'name':'breach-forward-ledge-access',**state})
 state=page.evaluate("""()=>{const roof=qa.g.platforms.find(p=>p.id==='ledge-5');for(let i=0;i<120;i++){const state=step({right:true},1);if(state.x>roof.x2+30&&!state.onGround&&state.platformId===null)return state;}throw Error('real ledge end did not release support');}""")
 assert not state['onGround'] and state['platformId'] is None,state
 page.screenshot(path=str(OUT/'breach-roof-gap-fall.png'));results.append({'name':'breach-roof-gap-fall',**state})
 assert not errors,errors
 (OUT/'results.json').write_text(json.dumps({'routes':results,'errors':errors},indent=2));print(json.dumps(results));b.close()
