"""Drive every authored route with normal keyboard events in the real loop."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
OUT=Path('/tmp/feral-arsenal-routes-qa');OUT.mkdir(exist_ok=True)

def snap(page):return page.evaluate('()=>window.readGameSnapshot()')
def until(page,condition,timeout=20000):page.wait_for_function('()=>{const s=window.readGameSnapshot();return '+condition+'}',timeout=timeout)
def setup(browser,width,height):
    context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<1000,is_mobile=width<1000)
    page=context.new_page();page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.evaluate('''async()=>{
      window.readGameSnapshot=(await import('./src/main.js')).getSnapshot;
      const {createRoutes}=await import('./src/world.js'),{tachikomaGeometry}=await import('./src/tachikoma-pose.js');
      const routes=createRoutes();window.routeObservation={visited:[],minimumTop:Infinity,enabled:true,metadata:routes.map(p=>({id:p.id,x1:p.x1,x2:p.x2,tier:p.tier}))};
      let jumpHeld=false,qteHeld=false,driving=true;
      const driveKeys=['ArrowRight','KeyJ','KeyK','KeyL'];
      function control(){const s=window.readGameSnapshot(),p=s.player,o=window.routeObservation;
        if(jumpHeld){window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));jumpHeld=false;}
        if(s.duel){
          if(driving){for(const code of driveKeys)window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));driving=false;}
          if(qteHeld){window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));qteHeld=false;}
          else if(s.duel.phase==='qte'){window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));qteHeld=true;}
        }else if(!driving){for(const code of driveKeys)window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));driving=true;}
        if(!s.duel&&o.enabled&&p.onGround&&routes.some(r=>p.x>r.x1+22&&p.x<r.x1+118&&(p.platformId??null)===(r.lower?.id??null))){
          // This dispatch goes through the normal key/input buffer. No game
          // state, physics positions, damage or support is assigned by QA.
          window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));jumpHeld=true;
        }
        if(p.onGround&&p.platformId&&!o.visited.includes(p.platformId))o.visited.push(p.platformId);
        o.minimumTop=Math.min(o.minimumTop,tachikomaGeometry(p,s.time).top+s.cameraY);
        if(s.status==='playing')requestAnimationFrame(control);
      }requestAnimationFrame(control);
    }''')
    for key in ['ArrowRight','KeyJ','KeyK','KeyL']:page.keyboard.down(key)
    return context,page

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    errors=[];results=[]
    context,page=setup(browser,1440,900);page.on('pageerror',lambda e:errors.append(str(e)))
    for name,x in [('rooted-arch',1480),('broken-deck',4480),('wreck-perch',5570),('gorge-arch',7750),('military-crossing',10300),('ground-only-scree',13600),('final-spur',15550)]:
        until(page,f's.player.x>{x}||s.status!=="playing"',timeout=32000)
        assert snap(page)['status']=='playing',snap(page)['status']
        page.screenshot(path=str(OUT/f'desktop-{name}.png'))
    until(page,'s.status==="won"',timeout=35000)
    state=snap(page);observed=page.evaluate('()=>window.routeObservation')
    assert page.evaluate('document.querySelector("#game-music").paused'),'victory must pause the soundtrack'
    until(page,'s.presentationAge>2.3',timeout=15000)
    victory=snap(page);assert abs(victory['cameraZoom']-2.1)<.00001
    assert [victory['player'][k] for k in ['x','y']]==[state['player'][k] for k in ['x','y']]
    assert not page.locator('#result-screen').is_visible(),'the victory pose must hold before results'
    page.screenshot(path=str(OUT/'desktop-victory-close.png'))
    page.wait_for_function('!document.querySelector("#result-screen").hidden');page.click('#return-home')
    assert page.evaluate('document.querySelector("#game-music").paused'),'home must remain quiet'
    for key in ['ArrowRight','KeyJ','KeyK','KeyL']:page.keyboard.up(key)
    assert set(observed['visited'])=={r['id'] for r in observed['metadata']},observed
    assert state['player']['hp']>0 and 75<=state['time']<=110,(state['time'],state['player']['hp'])
    assert observed['minimumTop']>=84,observed['minimumTop']
    results.append({'device':'desktop','visited':observed['visited'],'campaignTime':state['time'],'hp':state['player']['hp'],'minimumTop':observed['minimumTop'],'victoryZoom':victory['cameraZoom'],'victoryPoseHold':'passed'})
    context.close()
    context,page=setup(browser,844,390);page.on('pageerror',lambda e:errors.append(str(e)))
    until(page,'s.player.onGround&&s.player.platformId==="bridge-3"',timeout=90000)
    page.keyboard.up('ArrowRight');page.evaluate('()=>{window.routeObservation.enabled=false}')
    page.screenshot(path=str(OUT/'mobile-military-roof.png'))
    page.keyboard.down('KeyE');until(page,'s.player.onGround&&s.player.platformId==="ledge-3"')
    landed=snap(page)['time'];until(page,f's.time>{landed+.6}')
    assert snap(page)['player']['platformId']=='ledge-3','held descend must drop only once'
    page.keyboard.up('KeyE');page.screenshot(path=str(OUT/'mobile-military-gallery.png'))
    page.keyboard.down('KeyE');until(page,'s.player.onGround&&s.player.tier===0');page.keyboard.up('KeyE')
    page.screenshot(path=str(OUT/'mobile-ground-apron.png'))
    state=snap(page)
    for key in ['KeyJ','KeyK','KeyL']:page.keyboard.up(key)
    assert state['player']['hp']>0,state['player']['hp']
    results.append({'device':'mobile','threeTiers':[2,1,0],'heldDrop':'one tier per press','hp':state['player']['hp']})
    context.close();assert not errors,errors
    report={'routes':results,'errors':errors,'screenshots':str(OUT)}
    (OUT/'results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));browser.close()
