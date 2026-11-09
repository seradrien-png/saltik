"""Exercise evasion, cannon elevation and reload using actual browser inputs."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import base64,json,os

OUT=Path('/workspace/deliverables/saltik-menu-qa');OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('FERAL_PREVIEW_URL','http://127.0.0.1:4173')
def snap(page):return page.evaluate('()=>window.readGameSnapshot()')
def until(page,condition,timeout=12000):
    page.wait_for_function('()=>{const s=window.readGameSnapshot();return '+condition+'}',timeout=timeout)
def restart(page):
    if snap(page)['view']=='playing':page.keyboard.press('Escape')
    page.click('#restart-pause');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL,wait_until='networkidle')
    page.wait_for_function("!document.querySelector('#start').disabled")
    page.screenshot(path=str(OUT/'menu.png'));page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.evaluate("async()=>{window.readGameSnapshot=(await import('./src/main.js')).getSnapshot}")
    assert 'ESQUIVE' in page.locator('#shift-button').inner_text()
    assert page.locator('#tutorial').count()==0
    moves={'tilt':'covered by browser_manual_defense.py held/release checks'}
    # The barrel visibly raises before the carrier is created; its true native
    # direction agrees with the carrier's gravity-corrected launch velocity.
    restart(page)
    page.evaluate('''async()=>{
      const {tachikomaGeometry}=await import('./src/tachikoma-pose.js');
      window.cannonCapture=new Promise((resolve,reject)=>{
        const samples=[];let seen=false,count=0;
        function frame(){const s=window.readGameSnapshot(),g=tachikomaGeometry(s.player,s.time);
          samples.push({time:s.time,elevation:s.player.cannonElevation,pending:s.player.mirvPending,
            shots:s.stats.mirvs,muzzle:g.cannon,direction:g.cannonDirection,
            carrier:s.projectiles.find(p=>p.kind==='mirv')??null});
          if(s.stats.mirvs)seen=true;
          if(seen&&s.player.cannonElevation===0){resolve(samples);return;}
          if(++count>180){reject(Error('Cannon preparation did not complete'));return;}
          requestAnimationFrame(frame);
        }requestAnimationFrame(frame);
      });return true;
    }''')
    page.keyboard.press('KeyK');cannon=page.evaluate('()=>window.cannonCapture')
    raised=[s for s in cannon if s['pending'] and s['elevation']>0 and s['shots']==0]
    assert len(raised)>=2,cannon
    first=next(s for s in cannon if s['shots'] and s['carrier']);carrier=first['carrier']
    vx,vy=carrier['vx'],carrier['vy']-125*carrier['age'];length=(vx*vx+vy*vy)**.5
    assert abs(vx/length-first['direction']['x'])<.002,(first,vx,vy)
    assert abs(vy/length-first['direction']['y'])<.002,(first,vx,vy)
    assert first['elevation']>1,cannon
    # Only actual firing consumes the three-second magazine; paused reload
    # freezes, and a released reload tap produces no delayed primary shot.
    restart(page)
    page.evaluate('''()=>{window.reloadStarted=new Promise(resolve=>{
      let before=window.readGameSnapshot();
      function frame(){const s=window.readGameSnapshot();
        if(s.player.reloadIn>0){resolve({before,after:s});return;}
        before=s;requestAnimationFrame(frame);
      }requestAnimationFrame(frame);
    })}''')
    page.keyboard.down('KeyJ')
    until(page,'s.player.reloadIn>0',timeout=10000);page.keyboard.up('KeyJ')
    crossing=page.evaluate('()=>window.reloadStarted');reloading=crossing['after']
    assert reloading['player']['fireSpent']==3,reloading['player']
    assert 1.17<reloading['player']['reloadIn']<=1.32,reloading['player']['reloadIn']
    reload_shots=reloading['stats']['shots']
    page.keyboard.press('Escape');frozen=snap(page);page.wait_for_timeout(250)
    assert snap(page)['player']['reloadIn']==frozen['player']['reloadIn']
    assert snap(page)['stats']['shots']==reload_shots
    page.click('#resume');page.keyboard.press('KeyJ')
    until(page,'s.player.reloadIn>0&&s.player.reloadIn<.25')
    assert snap(page)['stats']['shots']==reload_shots,'reload allowed a shot before completion'
    until(page,'s.player.reloadIn===0');ready=snap(page)
    assert ready['stats']['shots']==reload_shots,(reloading['stats'],ready['stats'])
    assert ready['player']['fireSpent']==0
    elapsed=ready['time']-reloading['time']
    assert abs(elapsed-reloading['player']['reloadIn'])<=.05,(elapsed,reloading['player']['reloadIn'])
    total_elapsed=ready['time']-crossing['before']['time']
    assert 1.32<=total_elapsed<=1.46,total_elapsed
    page.wait_for_timeout(150)
    assert snap(page)['stats']['shots']==reload_shots
    page.keyboard.down('KeyJ');until(page,f"s.stats.shots>{frozen['stats']['shots']}");page.keyboard.up('KeyJ')
    page.screenshot(path=str(OUT/'primary-reloaded.png'))
    assert not errors,errors
    report={'evasions':moves,'raisedCannonBeforeLaunch':raised,'launch':first,
      'primaryReload':{'spent':reloading['player']['fireSpent'],'duration':1.32,
                       'observedRemaining':reloading['player']['reloadIn'],'observedGameElapsed':elapsed,
                       'transitionToReadyGameElapsed':total_elapsed,
                       'shotsDuringReload':ready['stats']['shots']-reload_shots,
                       'pauseFreezes':True,'releasedTapDiscarded':True},'pageErrors':errors}
    (OUT/'arsenal-controls-results.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'evasions':list(moves),'nativeCannon':'preparation and axis passed',
                      'reload':'3s fire, 1.32s reload, pause and released tap passed','errors':errors}))
    browser.close()
