from playwright.sync_api import sync_playwright
import json, pathlib
OUT=pathlib.Path('/tmp/feral-steel-qa');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:4173',wait_until='networkidle')
    page.wait_for_function("!document.querySelector('#start').disabled")
    page.screenshot(path=str(OUT/'desktop-title.png'))
    page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.keyboard.down('ArrowRight');page.keyboard.down('KeyJ');page.keyboard.down('KeyK')
    page.wait_for_timeout(6500)
    page.keyboard.up('ArrowRight');page.keyboard.up('KeyJ');page.keyboard.up('KeyK')
    snap=page.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert snap['player']['x']>1000 and snap['stats']['shots']>25, snap
    page.keyboard.press('Space');page.wait_for_timeout(140)
    jump=page.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert jump['player']['vy']<0,jump
    page.screenshot(path=str(OUT/'desktop-action.png'))
    page.keyboard.press('Escape')
    paused=page.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert paused['status']=='paused'
    page.wait_for_timeout(250)
    again=page.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert paused['time']==again['time']
    page.click('#resume')
    assert page.evaluate("async()=> (await import('./src/main.js')).getSnapshot().status")=='playing'
    page.keyboard.press('Escape');page.click('#restart-pause');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    restarted=page.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert restarted['player']['x']<200 and restarted['stats']['score']==0
    page.click('#sound');assert page.locator('#sound').get_attribute('aria-pressed')=='true'
    mobile=browser.new_context(viewport={'width':844,'height':390},device_scale_factor=1,is_mobile=True,has_touch=True)
    phone=mobile.new_page();phone.on('pageerror',lambda error:errors.append(str(error)))
    phone.goto('http://127.0.0.1:4173',wait_until='networkidle');phone.screenshot(path=str(OUT/'mobile-title.png'))
    phone.tap('#start');phone.wait_for_timeout(300)
    # Dispatch independent real pointer event sources to verify touch ownership.
    phone.evaluate("""()=>{for(const [action,id] of [['right',1],['fire',2],['missile',3]])document.querySelector(`[data-action=${action}]`).dispatchEvent(new PointerEvent('pointerdown',{pointerId:id,pointerType:'touch',button:0,bubbles:true}));}""")
    phone.wait_for_timeout(1800)
    snap=phone.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert snap['player']['x']>450 and snap['stats']['shots']>10 and snap['stats']['mirvs']>=1,snap
    phone.evaluate("""()=>document.querySelector('[data-action=fire]').dispatchEvent(new PointerEvent('pointercancel',{pointerId:2,pointerType:'touch',bubbles:true}))""")
    snap=phone.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert snap['inputs']['right'] and not snap['inputs']['fire'],snap
    phone.evaluate("""()=>{for(const [action,id] of [['right',1],['missile',3]])document.querySelector(`[data-action=${action}]`).dispatchEvent(new PointerEvent('pointerup',{pointerId:id,pointerType:'touch',bubbles:true}));}""")
    phone.screenshot(path=str(OUT/'mobile-action.png'))
    # Also exercise Chromium's actual touch-to-pointer mapping and pointer capture.
    session=mobile.new_cdp_session(phone)
    points=[]
    before=phone.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    for i,action in enumerate(['right','fire']):
        rect=phone.locator(f'[data-action={action}]').bounding_box()
        points.append({'x':rect['x']+rect['width']/2,'y':rect['y']+rect['height']/2,'id':i+11})
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points})
    phone.wait_for_timeout(600)
    during=phone.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert during['inputs']['right'] and during['inputs']['fire'],during
    assert during['player']['x']>before['player']['x']+50 and during['stats']['shots']>before['stats']['shots'],during
    session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    phone.wait_for_timeout(50)
    after=phone.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert not any(after['inputs'].values()),after
    phone.set_viewport_size({'width':390,'height':844});phone.wait_for_timeout(200)
    assert phone.locator('#rotate').is_visible()
    snap=phone.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert snap['status']=='paused' and not any(snap['inputs'].values()),snap
    phone.screenshot(path=str(OUT/'mobile-portrait.png'))
    phone.set_viewport_size({'width':844,'height':390});phone.wait_for_timeout(200);phone.tap('#resume')
    assert phone.evaluate("async()=> (await import('./src/main.js')).getSnapshot().status")=='playing'
    assert not errors,errors
    print(json.dumps({'desktop':'movement, shooting, jump, pause/resume, restart, sound passed','mobile':'real simultaneous touch, pointer capture/release, independent cancellation, portrait auto-pause/resume passed','errors':errors,'screenshots':str(OUT)}))
    browser.close()
