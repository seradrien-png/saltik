"""Observe the enemy's two attacks, live locks and physical interception."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json

OUT=Path('/tmp/feral-arsenal-qa');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.evaluate("async()=>{window.readGameSnapshot=(await import('./src/main.js')).getSnapshot}")
    page.keyboard.down('ArrowRight');page.keyboard.down('KeyJ')
    page.wait_for_function('()=>window.readGameSnapshot().player.x>3200',timeout=22000)
    page.keyboard.up('KeyJ')
    page.evaluate('''()=>{
      window.enemyObservation={phases:[],gun:false,launch:null};
      function frame(){const s=window.readGameSnapshot(),o=window.enemyObservation,e=s.enemies.find(e=>e.type==='saltik');
        if(e){if(!o.phases.includes(e.attackPhase))o.phases.push(e.attackPhase);
          if(e.firePose>0)o.gun=true;
          const missiles=s.projectiles.filter(p=>p.kind==='enemy-missile');
          if(missiles.length>=2&&!o.launch)o.launch={enemy:e,missiles,time:s.time};}
        if(s.status==='playing')requestAnimationFrame(frame);
      }requestAnimationFrame(frame);
    }''')
    page.wait_for_function('()=>window.readGameSnapshot().player.x>4100',timeout=12000)
    page.keyboard.up('ArrowRight')
    page.wait_for_function('()=>window.enemyObservation.launch!==null',timeout=12000)
    observation=page.evaluate('()=>window.enemyObservation')
    assert observation['gun'] and {'lock','launch'}.issubset(observation['phases']),observation
    assert len(observation['launch']['missiles'])==2,observation
    page.screenshot(path=str(OUT/'enemy-saltik-two-locking-missiles.png'))
    page.keyboard.press('KeyL')
    page.wait_for_function('()=>window.readGameSnapshot().projectiles.filter(p=>p.kind==="homing").length===3',timeout=4000)
    locked=page.evaluate('''()=>{const s=window.readGameSnapshot();return {
      missiles:s.projectiles.filter(p=>p.kind==='homing'),
      liveTargets:s.enemies.filter(e=>s.projectiles.some(p=>p.kind==='homing'&&p.targetId===e.id))};}''')
    assert locked['liveTargets'] and all(e['hp']>0 for e in locked['liveTargets']),locked
    page.screenshot(path=str(OUT/'red-locks-and-separated-guided-salvo.png'))
    page.keyboard.down('KeyJ')
    page.wait_for_function('()=>window.readGameSnapshot().stats.interceptions>0',timeout=14000)
    state=page.evaluate('()=>window.readGameSnapshot()');page.keyboard.up('KeyJ')
    assert state['player']['hp']>0 and state['stats']['interceptions']>0,state['stats']
    page.screenshot(path=str(OUT/'physical-missile-interception.png'))
    assert not errors,errors
    report={'enemyAttack':observation,'lockedSalvo':locked,'interceptions':state['stats']['interceptions'],'hp':state['player']['hp'],'pageErrors':errors}
    (OUT/'enemy-results.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'twoEnemyAttacks':observation['phases'],'enemyLockingMissiles':2,'livingLockTargets':len(locked['liveTargets']),'interceptions':state['stats']['interceptions'],'errors':errors}))
    browser.close()
