"""Physical two-second ESQUIVE: release, expiry, keyboard and center touch."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,os
OUT=Path('/tmp/saltik-v2-held-defense-qa');OUT.mkdir(exist_ok=True)
def snap(page):return page.evaluate('()=>window.readGameSnapshot()')
def until(page,condition,timeout=18000):page.wait_for_function('()=>{const s=window.readGameSnapshot();return '+condition+'}',timeout=timeout)
def setup(browser,w,h):
 c=browser.new_context(viewport={'width':w,'height':h},has_touch=w<1000,is_mobile=w<1000);page=c.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto(os.environ.get('FERAL_PREVIEW_URL','http://127.0.0.1:4173'),wait_until='networkidle');page.wait_for_function('!document.querySelector("#start").disabled');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
 page.evaluate('async()=>window.readGameSnapshot=(await import("./src/main.js")).getSnapshot');return c,page,errors
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);results=[]
 c,page,errors=setup(b,1440,900)
 page.keyboard.down('KeyF');until(page,'s.player.evasion.active');began=snap(page)
 page.keyboard.down('KeyJ');until(page,'s.time>'+str(began['time']+1.5))
 assert snap(page)['player']['evasion']['active'];assert snap(page)['stats']['shots']==began['stats']['shots']
 page.keyboard.up('KeyJ');until(page,'s.time>'+str(began['time']+2.5));held=snap(page)
 assert not held['player']['evasion']['active'] and held['inputs']['shift']
 page.evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF',repeat:true,bubbles:true}))")
 page.wait_for_timeout(250);assert not snap(page)['player']['evasion']['active']
 page.keyboard.up('KeyF');page.keyboard.down('KeyF');until(page,'s.player.evasion.active')
 # A genuine release/repress in one event-loop task must start a fresh hold,
 # without relying on a fixed simulation tick between two thumb/key events.
 page.evaluate("()=>{window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyF',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF',bubbles:true}));}")
 until(page,'s.player.evasion.active')
 page.screenshot(path=str(OUT/'desktop-pressed-amber.png'))
 page.keyboard.up('KeyF');assert not snap(page)['player']['evasion']['active']
 page.evaluate("()=>{for(const type of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(type,{code:'KeyF',bubbles:true}));}")
 page.wait_for_timeout(100);assert not snap(page)['player']['evasion']['active'],'released tiny tap cannot queue rear'
 page.keyboard.press('KeyH');assert 'deflect' not in snap(page)['inputs'] and not snap(page)['player'].get('deflect',{}).get('active')
 page.keyboard.down('KeyF');until(page,'s.player.evasion.active');page.keyboard.press('Escape');assert not snap(page)['player']['evasion']['active'];page.keyboard.up('KeyF');page.click('#resume')
 assert not errors,errors;results.append({'device':'desktop','expiresAtTwoSeconds':True,'releaseImmediate':True,'releaseBeforeRestart':True,'sameTickRepress':True,'noQueuedRearTap':True,'HRemoved':True,'pauseClearsRear':True,'errors':errors});c.close()
 for w,h in [(844,390),(667,375)]:
  c,page,errors=setup(b,w,h);client=c.new_cdp_session(page)
  rect=page.locator('#shift-button').bounding_box();assert rect['width']>=44 and rect['height']>=44
  touch={'x':rect['x']+rect['width']/2,'y':rect['y']+rect['height']/2,'id':1}
  def down():client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[touch]})
  def up():client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[touch]})
  down();until(page,'s.player.evasion.active');at=snap(page)['time'];until(page,'s.time>'+str(at+2.4))
  assert not snap(page)['player']['evasion']['active'] and snap(page)['inputs']['shift']
  up();down();until(page,'s.player.evasion.active');page.screenshot(path=str(OUT/f'{w}-hub-held.png'))
  up();assert not snap(page)['player']['evasion']['active']
  assert page.locator('#deflect-button,#shift-reload,#shift-cooldown').count()==0
  assert abs(snap(page)['cameraZoom']-1.155)<.00001;assert not errors,errors
  results.append({'device':[w,h],'touchHoldExpires':True,'releaseRepress':True,'centerHub':True,'errors':errors});c.close()
 (OUT/'results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results));b.close()
