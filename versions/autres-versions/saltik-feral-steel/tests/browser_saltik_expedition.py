"""Observe real melee and the six environments using normal player controls."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import base64
import json
import sys

OUT = Path('/tmp/feral-saltik-expedition-qa')
OUT.mkdir(exist_ok=True)

def observe(page):
    page.evaluate("async()=>{window.readGameSnapshot=(await import('./src/main.js')).getSnapshot}")

def snap(page):
    return page.evaluate('()=>window.readGameSnapshot()')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':1440, 'height':900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:4173', wait_until='networkidle')
    page.wait_for_function("!document.querySelector('#start').disabled")
    assert 'SALTIK' in page.locator('#start').inner_text()
    assert 'CLASSE STRIKER' in page.locator('.vehicle-label').inner_text()
    page.screenshot(path=str(OUT/'saltik-menu.png'))
    page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    observe(page)
    page.evaluate('''async()=>{
      const {tachikomaGeometry}=await import('./src/tachikoma-pose.js');
      window.meleeObservation={samples:[],phases:[],image:null,enemyStrike:false};
      const started=performance.now();
      function frame(){
        const s=window.readGameSnapshot(),m=s.player.melee,o=window.meleeObservation;
        if(m.phase!=='idle'&&m.targetKey?.startsWith('enemy:')){
          o.enemyStrike=true;
          if(!o.phases.includes(m.phase))o.phases.push(m.phase);
          const geo=tachikomaGeometry(s.player,s.time);
          o.samples.push({time:s.time,phase:m.phase,target:m.targetKey,hp:s.player.hp,
            atlas:geo.atlas,frame:geo.frame,swings:s.stats.meleeSwings,hits:s.stats.meleeHits});
          if(m.phase==='impact'&&!o.image)o.image=document.querySelector('#game').toDataURL();
        }
        if(o.enemyStrike&&o.phases.includes('recovery')&&m.phase==='idle')o.done=true;
        if(!o.done&&performance.now()-started<25000&&s.status==='playing')requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }''')
    page.keyboard.down('ArrowRight')
    page.wait_for_function('()=>window.meleeObservation.done||window.readGameSnapshot().status!=="playing"', timeout=28000)
    page.keyboard.up('ArrowRight')
    melee = page.evaluate('()=>window.meleeObservation')
    image_data=melee.pop('image',None)
    if image_data:
        (OUT/'saltik-enemy-impact.png').write_bytes(base64.b64decode(image_data.split(',')[1]))
    state = snap(page)
    assert melee['enemyStrike'] and set(melee['phases'])=={'windup','impact','recovery'}, (melee,state)
    for phase in ['windup','impact','recovery']:
        assert any(s['phase']==phase and s['atlas']=='saltik-melee' for s in melee['samples']),melee
    assert state['stats']['meleeHits']>0 and state['stats']['shots']==0,state
    page.keyboard.press('Escape')
    frozen=snap(page)
    page.wait_for_timeout(450)
    after=snap(page)
    assert frozen['time']==after['time'] and frozen['player']['melee']==after['player']['melee'],(frozen,after)
    if '--melee-only' in sys.argv:
        (OUT/'melee-results.json').write_text(json.dumps({'melee':melee,'state':state,'errors':errors},indent=2))
        assert not errors,errors
        print(json.dumps({'meleePhases':melee['phases'],'enemyMeleeWithoutGunfire':True,'stats':state['stats'],'errors':errors}))
        browser.close()
        sys.exit(0)
    page.click('#restart-pause');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    # One complete real campaign also supplies comparable screenshots of all
    # authored scenarios; the simulation is never repositioned by this check.
    for key in ['ArrowRight','KeyJ','KeyK','KeyL']:
        page.keyboard.down(key)
    scenes=[]
    for name,x in [('rooted-talus',1700),('wreck-hull',4700),('wet-gorge',7800),
                   ('checkpoint',10800),('scree',13900),('final-approach',15800)]:
        page.wait_for_function('x=>window.readGameSnapshot().player.x>=x||window.readGameSnapshot().status!=="playing"',arg=x,timeout=26000)
        state=snap(page)
        assert state['status']=='playing',state
        page.screenshot(path=str(OUT/f'{name}.png'))
        contacts=state['player']['supportPose']['contacts']
        scenes.append({'name':name,'x':state['player']['x'],'hp':state['player']['hp'],
            'tilt':state['player']['tilt'],'heave':state['player']['supportPose']['heave'],
            'contacts':contacts})
    page.wait_for_function('()=>window.readGameSnapshot().status==="won"',timeout=35000)
    campaign=snap(page)
    for key in ['ArrowRight','KeyJ','KeyK','KeyL']:
        page.keyboard.up(key)
    assert campaign['player']['hp']>0 and 75<=campaign['time']<=110,campaign
    assert campaign['stats']['mirvs']>0 and campaign['stats']['homingSalvos']>0,campaign
    assert not errors,errors
    report={'melee':melee,'scenes':scenes,'campaign':campaign,'pageErrors':errors}
    (OUT/'results.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'meleePhases':melee['phases'],'enemyMeleeWithoutGunfire':True,
        'campaignTime':campaign['time'],'hp':campaign['player']['hp'],
        'stats':campaign['stats'],'scenes':[s['name'] for s in scenes],
        'errors':errors,'screenshots':str(OUT)}))
    browser.close()
