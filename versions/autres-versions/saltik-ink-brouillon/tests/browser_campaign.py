from playwright.sync_api import sync_playwright
import json, pathlib
OUT=pathlib.Path('/tmp/feral-steel-qa');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
    page.keyboard.down('ArrowRight');page.keyboard.down('KeyJ');page.keyboard.down('KeyK');page.keyboard.down('KeyL')
    page.wait_for_function("document.querySelector('#boss-hud').hidden===false",timeout=100000)
    page.wait_for_timeout(3500);page.screenshot(path=str(OUT/'desktop-boss.png'))
    page.wait_for_function("document.querySelector('#app').className==='state-won'",timeout=30000)
    page.keyboard.up('ArrowRight');page.keyboard.up('KeyJ');page.keyboard.up('KeyK');page.keyboard.up('KeyL')
    page.wait_for_timeout(1800);assert page.locator('#result-screen').is_visible()
    page.screenshot(path=str(OUT/'desktop-victory.png'))
    snap=page.evaluate("async()=> (await import('./src/main.js')).getSnapshot()")
    assert snap['status']=='won' and snap['player']['hp']>0,snap
    assert snap['stats']['mirvs']>0 and snap['stats']['homingSalvos']>0,snap
    assert 75<=snap['time']<=110,snap
    page.click('#replay');assert page.evaluate("async()=> (await import('./src/main.js')).getSnapshot().stats.score")==0
    assert not errors,errors
    print(json.dumps({'browserCampaign':snap,'errors':errors,'replay':'passed'}))
    browser.close()
