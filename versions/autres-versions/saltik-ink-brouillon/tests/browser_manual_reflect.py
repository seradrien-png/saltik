"""Time the ordinary H action against a real scheduled enemy projectile."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
OUT=Path('/tmp/feral-manual-defense-qa');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('!document.querySelector("#start").disabled');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
 page.evaluate('async()=>window.readGameSnapshot=(await import("./src/main.js")).getSnapshot')
 page.keyboard.down('ArrowRight');page.keyboard.down('KeyJ')
 page.wait_for_function('()=>window.readGameSnapshot().stats.obstacles>0',timeout=15000);page.keyboard.up('KeyJ')
 page.wait_for_function('()=>window.readGameSnapshot().player.x>850',timeout=12000);page.keyboard.up('ArrowRight')
 page.evaluate('''()=>{
  window.reflectTrace=[];window.reflectObservation=new Promise((resolve,reject)=>{const attempted=new Set();let key=false,n=0;
   function frame(){const s=window.readGameSnapshot(),p=s.player;
    if(key){window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyH',bubbles:true}));key=false;}
    if(n%30===0)window.reflectTrace.push({time:s.time,x:p.x,y:p.y,hp:p.hp,deflect:p.deflect,projectiles:s.projectiles,enemies:s.enemies});
    const reflected=s.projectiles.find(q=>q.team==='player'&&q.kind==='plasma');
    if(p.deflect.deflected&&reflected){resolve({reflected,parry:p.deflect,playerHp:p.hp,time:s.time,attempted:[...attempted]});return;}
    if(!p.deflect.active&&p.deflect.cooldown===0&&!p.evasion.active&&!p.turn?.active){
     const incoming=s.projectiles.find(q=>{if(q.team!=='enemy'||q.kind!=='plasma'||q.vx>=0||attempted.has(q.id))return false;
      // Time the original combat shell, which is narrower than the artwork.
      const front=p.x+p.w*22.5/76+(q.radius||0);
      const t=(q.x-front)/(-q.vx);return t>.14&&t<.20&&q.y>p.y-p.h-15&&q.y<p.y+15;});
     if(incoming){attempted.add(incoming.id);window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH',bubbles:true}));key=true;}
    }
    if(s.status!=='playing'||++n>1800){reject(Error(JSON.stringify({status:s.status,attempted:[...attempted],hp:p.hp,projectiles:s.projectiles})));return;}
    requestAnimationFrame(frame);
   }requestAnimationFrame(frame);
  });return true;
 }''')
 try:page.wait_for_function('()=>window.readGameSnapshot().player.deflect.deflected',timeout=25000)
 except Exception:
  (OUT/'reflection-diagnostic.json').write_text(json.dumps(page.evaluate('()=>({trace:window.reflectTrace,snapshot:window.readGameSnapshot()})'),indent=2));raise
 result=page.evaluate('()=>window.reflectObservation');assert result['reflected']['vx']>0 and result['playerHp']>0,result
 page.screenshot(path=str(OUT/'real-projectile-reflection.png'));assert not errors,errors
 result['errors']=errors;(OUT/'real-reflection.json').write_text(json.dumps(result,indent=2));print(json.dumps(result));b.close()
