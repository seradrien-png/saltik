"""Physical held rear control and instantly reusable manually timed parry."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
OUT=Path('/tmp/feral-held-defense-qa');OUT.mkdir(exist_ok=True)
def snap(page):return page.evaluate('()=>window.readGameSnapshot()')
def until(page,condition,timeout=18000):page.wait_for_function('()=>{const s=window.readGameSnapshot();return '+condition+'}',timeout=timeout)
def setup(browser,w,h):
 c=browser.new_context(viewport={'width':w,'height':h},has_touch=w<1000,is_mobile=w<1000);page=c.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('!document.querySelector("#start").disabled');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
 page.evaluate('async()=>window.readGameSnapshot=(await import("./src/main.js")).getSnapshot');return c,page,errors
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);results=[]
 c,page,errors=setup(b,1440,900)
 page.keyboard.down('KeyF');until(page,'s.player.evasion.active');began=snap(page)
 page.keyboard.down('KeyJ');until(page,'s.time>'+str(began['time']+10.2))
 held=snap(page);assert held['player']['evasion']['active'] and held['player']['evasion']['held'];assert held['player']['evasion']['cooldown']==0
 assert held['stats']['shots']==began['stats']['shots'];assert held['player']['y']==began['player']['y'];page.keyboard.up('KeyJ')
 page.screenshot(path=str(OUT/'desktop-held-ten-seconds.png'))
 page.keyboard.up('KeyF');assert snap(page)['player']['evasion']['active'] is False
 page.evaluate("()=>{for(const type of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(type,{code:'KeyF',bubbles:true}));}")
 page.wait_for_timeout(100);assert not snap(page)['player']['evasion']['active'],'released tiny tap cannot queue rear'
 page.keyboard.press('KeyH');until(page,'s.player.deflect.active');until(page,'s.player.deflect.elapsed>.14');old=snap(page)['player']['deflect']['elapsed']
 page.keyboard.press('KeyH');until(page,'s.player.deflect.elapsed<.09');assert snap(page)['player']['deflect']['cooldown']==0
 page.keyboard.down('KeyH');until(page,'s.player.deflect.active');at=snap(page)['time'];until(page,'s.time>'+str(at+1.1));assert not snap(page)['player']['deflect']['active'];page.keyboard.up('KeyH')
 page.keyboard.down('KeyF');until(page,'s.player.evasion.active');page.keyboard.press('Escape');assert not snap(page)['player']['evasion']['active'];page.keyboard.up('KeyF');page.click('#resume')
 assert not errors,errors;results.append({'device':'desktop','holdSeconds':10.2,'releaseImmediate':True,'noQueuedRearTap':True,'parryRepressDuringRecovery':True,'heldParryNeverRepeats':True,'pauseClearsRear':True,'errors':errors});c.close()
 for w,h in [(844,390),(667,375)]:
  c,page,errors=setup(b,w,h);client=c.new_cdp_session(page)
  rect=page.locator('#shift-button').bounding_box();assert rect['width']>=44 and rect['height']>=44
  touch={'x':rect['x']+rect['width']/2,'y':rect['y']+rect['height']/2,'id':1}
  client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[touch]});until(page,'s.player.evasion.active');at=snap(page)['time'];until(page,'s.time>'+str(at+2.4));assert snap(page)['player']['evasion']['active']
  page.screenshot(path=str(OUT/f'{w}-held.png'))
  client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[touch]});assert not snap(page)['player']['evasion']['active']
  for _ in range(3):
   page.locator('#deflect-button').click();until(page,'s.player.deflect.active&&s.player.deflect.elapsed<.12');page.wait_for_timeout(150)
  assert page.locator('#shift-reload,#shift-cooldown,#deflect-reload,#deflect-cooldown').count()==0
  assert abs(snap(page)['cameraZoom']-1.155)<.00001;assert not errors,errors
  results.append({'device':[w,h],'touchHoldRelease':True,'threeImmediateParries':True,'noRechargeUi':True,'errors':errors});c.close()
 (OUT/'results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results));b.close()
