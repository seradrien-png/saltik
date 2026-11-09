"""Reach, mount, shoot and leave the charging boss using normal inputs only."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json

OUT=Path('/tmp/feral-boss-ride-qa');OUT.mkdir(exist_ok=True)
CONTROL="""async()=>{
 window.readGameSnapshot=(await import('./src/main.js')).getSnapshot;
 const {victoryGeometry}=await import('./src/victory-art.js');
 const held=new Set(),o=window.bossObservation={stage:'campaign',events:[],phases:[],victoryFrames:[],mountedShots:[],chargeEvaded:false,carried:false};
 function keys(wanted){const next=new Set(wanted);for(const code of held)if(!next.has(code)){window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.delete(code);}for(const code of next)if(!held.has(code)){window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));held.add(code);}}
 function record(type,s){o.events.push({type,time:s.time,hp:s.player.hp,bossHp:s.boss?.hp,x:s.player.x,y:s.player.y,bossX:s.boss?.x,support:s.player.bossSupport,riderTime:s.boss?.riderTime,spin:s.boss?.turretSpin});}
 let qte=false,jump=false,mountedAt=0,mountedHp=0,mountedDelta=0,evadeHp=0,evadeStarted=false,lastPhase=null;
 function frame(){const s=readGameSnapshot(),p=s.player,b=s.boss;let wanted=[];
  if(s.status==='won'){
   keys([]);o.stage='victory';const f=victoryGeometry(p,{age:s.presentationAge}).frame;
   if(!o.victoryFrames.includes(f))o.victoryFrames.push(f);
   if(s.presentationAge<4)requestAnimationFrame(frame);return;
  }
  if(s.status!=='playing'){keys([]);o.failed=s.status;return;}
  if(b&&b.chargePhase!==lastPhase){lastPhase=b.chargePhase;o.phases.push({phase:lastPhase,x:b.x,target:b.chargeTargetX,start:b.chargeStartX,width:s.worldWidth,time:s.time});}
  if(o.stage==='campaign'){
   if(s.duel){qte=!qte;wanted=qte&&s.duel.phase==='qte'?['Space']:[];}
   else if(!b)wanted=p.x>15900?['ArrowRight','KeyJ']:['ArrowRight','KeyJ','KeyK','KeyL'];
   else{o.stage='first-charge';record('encounter',s);}
  }
  if(o.stage==='first-charge'){
   if(b.chargePhase==='telegraph'||b.chargePhase==='charge'){
    wanted=['KeyF'];if(!evadeStarted){evadeStarted=true;evadeHp=p.hp;record('rear-start',s);}
   }else if(evadeStarted&&b.chargePhase==='recover'){
    o.chargeEvaded=p.hp===evadeHp;record('rear-complete',s);o.stage='approach';
   }
  }
  if(o.stage==='approach'){
   if(b.chargePhase!=='idle')wanted=['KeyF'];
   else if(p.x<b.x-237)wanted=['ArrowRight'];
   else if(p.onGround&&b.chargeClock>1.8&&b.chargeClock<2.7){wanted=['ArrowRight','Space'];jump=true;o.stage='jump';record('jump',s);}
   else wanted=['KeyF'];
  }else if(o.stage==='jump'){
   wanted=['ArrowRight'];if(jump)jump=false;
   if(p.bossSupport){wanted=[];mountedAt=s.time;mountedHp=b.hp;mountedDelta=p.x-b.x;o.stage='mounted';record('mounted',s);}
   else if(p.onGround){o.stage='approach';record('jump-retry',s);}
  }
  if(o.stage==='mounted'){
   wanted=s.time-mountedAt<.8?['KeyJ']:['KeyF'];
   for(const shot of s.projectiles)if(shot.team==='player'&&shot.kind==='bullet'&&shot.vy>0&&!o.mountedShots.some(q=>q.id===shot.id))o.mountedShots.push(shot);
   if(p.bossSupport&&b.dx<0&&Math.abs(p.x-b.x-mountedDelta)<4)o.carried=true;
   if(b.turretSpin>0&&!o.events.some(e=>e.type==='turret'))record('turret',s);
   if(!p.bossSupport){o.roofDamage=mountedHp-b.hp;record('ejected',s);o.stage='landing';}
  }else if(o.stage==='landing'){
   wanted=[];if(p.onGround){record('landed',s);o.stage='finish';}
  }else if(o.stage==='finish'){
   wanted=b.chargePhase==='telegraph'||b.chargePhase==='charge'?['KeyF']:[(b.x<p.x?'ArrowLeft':'ArrowRight'),'KeyJ','KeyK','KeyL'];
  }
  keys(wanted);requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
}"""

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('!document.querySelector("#start").disabled');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
 page.evaluate(CONTROL)
 try:
  page.wait_for_function('()=>window.bossObservation.stage==="mounted"',timeout=180000)
  page.screenshot(path=str(OUT/'mounted.png'))
  page.wait_for_function('()=>window.bossObservation.events.some(e=>e.type==="turret")',timeout=15000)
  page.screenshot(path=str(OUT/'turret-eject.png'))
  page.wait_for_function('()=>window.bossObservation.events.some(e=>e.type==="landed")',timeout=15000)
  page.screenshot(path=str(OUT/'landed.png'))
  page.wait_for_function('()=>window.readGameSnapshot().status==="won"',timeout=45000)
  page.wait_for_function('()=>window.bossObservation.victoryFrames.length===4',timeout=15000)
  page.screenshot(path=str(OUT/'native-victory.png'))
  o=page.evaluate('()=>window.bossObservation');s=page.evaluate('()=>window.readGameSnapshot()')
  assert o['chargeEvaded'] and o['carried'],o
  assert o['roofDamage']>0 and len(o['mountedShots'])>0,o
  mounted=next(e for e in o['events'] if e['type']=='mounted');ejected=next(e for e in o['events'] if e['type']=='ejected');landed=next(e for e in o['events'] if e['type']=='landed')
  assert 3.1<ejected['time']-mounted['time']<3.4,o
  assert ejected['hp']==landed['hp'] and s['player']['onGround'] and s['player']['hp']>0,o
  assert set(o['victoryFrames'])=={0,1,2,3} and not errors,(o,errors)
  o.update(finalTime=s['time'],finalHp=s['player']['hp'],pageErrors=errors)
  (OUT/'results.json').write_text(json.dumps(o,indent=2));print(json.dumps(o))
 except Exception:
  (OUT/'failure.json').write_text(json.dumps(page.evaluate('()=>({observation:window.bossObservation,snapshot:window.readGameSnapshot()})'),indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 browser.close()
