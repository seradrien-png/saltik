"""Reach real enemy Saltiks and complete the grapple with ordinary inputs."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,base64,os
OUT=Path('/tmp/feral-saltik-duel-qa');OUT.mkdir(exist_ok=True)

def snap(page):return page.evaluate('()=>window.readGameSnapshot()')
def until(page,condition,timeout=20000):page.wait_for_function('()=>{const s=window.readGameSnapshot();return '+condition+'}',timeout=timeout)
def release(page):
 for key in ['ArrowRight','KeyJ','KeyK','KeyL']:page.keyboard.up(key)

with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 results=[]
 for w,h in json.loads(os.environ.get('FERAL_DUEL_VIEWPORTS','[[1440,900],[844,390]]')):
  c=b.new_context(viewport={'width':w,'height':h},has_touch=w<1000,is_mobile=w<1000);page=c.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:4173',wait_until='networkidle')
  page.wait_for_function('!document.querySelector("#start").disabled');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
  page.evaluate('async()=>window.readGameSnapshot=(await import("./src/main.js")).getSnapshot')
  for key in ['ArrowRight','KeyJ','KeyK','KeyL']:page.keyboard.down(key)
  until(page,'s.enemies.some(e=>e.type==="saltik"&&e.guard)||s.status!=="playing"',timeout=45000)
  state=snap(page);assert state['status']=='playing',state['status'];page.keyboard.up('ArrowRight')
  enemy=next(e for e in state['enemies'] if e['type']=='saltik' and e['guard']);enemy_id=enemy['id']
  assert enemy['hp']==6 and enemy['maxHp']==24,enemy
  at=state['time'];until(page,f's.time>{at+1.1}')
  enemy=next(e for e in snap(page)['enemies'] if e['id']==enemy_id);assert enemy['hp']==6
  page.screenshot(path=str(OUT/f'{w}-guard-approach.png'));release(page)
  page.keyboard.down('ArrowRight');until(page,'!!s.duel',timeout=16000);release(page)
  until(page,'s.duel?.phase==="qte"');before=snap(page);assert before['duel']['taps']==0
  assert page.locator('#qte-button').is_visible() and not page.locator('#controls').is_visible()
  qte_box=page.locator('#qte-button').bounding_box();assert qte_box['x']>w*.7 and qte_box['x']+qte_box['width']<=w,qte_box
  assert page.evaluate('document.querySelector("#game-music").paused') is False
  page.screenshot(path=str(OUT/f'{w}-hands-locked-qte.png'))
  # Track actual render-facing state for every queued effort, without mutation.
  page.evaluate('''async()=>{
   const {duelVisual}=await import('./src/duel-art.js');window.effortPeaks={};
   function observe(){const s=window.readGameSnapshot(),d=s.duel;
    if(!d)return;const v=duelVisual(d,{width:s.viewport.w,height:s.viewport.h,camera:s.camera,cameraY:s.cameraY});
    if(v?.pair?.effortIndex)window.effortPeaks[v.pair.effortIndex]=Math.max(window.effortPeaks[v.pair.effortIndex]||0,v.pair.effort);
    requestAnimationFrame(observe);
   }requestAnimationFrame(observe);
  }''')
  # One held key counts once and browser autorepeat cannot fill the contest.
  page.keyboard.down('Space');until(page,'s.duel?.taps===1');page.wait_for_timeout(350)
  assert snap(page)['duel']['taps']==1;page.keyboard.up('Space')
  page.keyboard.press('Escape');frozen=snap(page);page.wait_for_timeout(200)
  assert snap(page)['duel']==frozen['duel'];assert page.evaluate('document.querySelector("#game-music").paused')
  page.click('#resume');page.wait_for_timeout(90)
  page.evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',repeat:true,bubbles:true}))")
  assert snap(page)['duel']['taps']==1
  # Four real new presses, including the fifth that begins projection.
  for count in [2,3,4]:
   page.locator('#qte-button').click();until(page,f's.duel?.taps==={count}');page.wait_for_timeout(90)
  assert snap(page)['duel']['phase']=='qte'
  page.evaluate('''()=>{
   window.duelCapture=new Promise((resolve,reject)=>{const phases=[],images={},start=performance.now();
    function frame(){const s=window.readGameSnapshot(),d=s.duel;
     if(!d){resolve({phases,images,final:s});return;}
     if(!phases.includes(d.phase))phases.push(d.phase);
     if(['throw','impact','slide'].includes(d.phase)&&!images[d.phase]&&(d.phase!=='slide'||d.elapsed>.4))images[d.phase]=document.querySelector('#game').toDataURL();
     if(performance.now()-start>15000){reject(Error('Cinematic did not release'));return;}requestAnimationFrame(frame);
    }requestAnimationFrame(frame);
   });return true;
  }''')
  page.locator('#qte-button').click();capture=page.evaluate('()=>window.duelCapture');images=capture.pop('images')
  for phase,data in images.items():(OUT/f'{w}-{phase}.png').write_bytes(base64.b64decode(data.split(',')[1]))
  peaks=page.evaluate('()=>window.effortPeaks');assert set(peaks)=={'1','2','3','4','5'} and all(v>.7 for v in peaks.values()),peaks
  after=capture['final'];assert all(phase in capture['phases'] for phase in ['throw','impact','slide','recover']),capture['phases']
  assert after['stats']['kills']==before['stats']['kills']+1
  assert after['player']['x']==before['player']['x'] and after['player']['y']==before['player']['y']
  assert after['player']['hp']==before['player']['hp']
  assert page.locator('#controls').is_visible();assert not page.locator('#duel-ui').is_visible()
  page.keyboard.down('ArrowRight');until(page,f's.player.x>{after["player"]["x"]+20}');page.keyboard.up('ArrowRight')
  assert not errors,errors
  results.append({'viewport':[w,h],'enemyHp':24,'guardRemaining':6,'fiveDistinctPresses':True,'fiveVisibleEfforts':peaks,'heldAndRepeatIgnored':True,'pauseFreezes':True,'phases':capture['phases'],'physicalSupportPreserved':True,'hp':after['player']['hp'],'errors':errors})
  c.close()
 (OUT/'results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results));b.close()
