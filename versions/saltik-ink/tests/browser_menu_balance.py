"""Saltik menu credit, usable layouts and the deliberately reduced combat HUD."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json

URL=os.environ.get('FERAL_PREVIEW_URL','http://127.0.0.1:4173')
OUT=Path('/workspace/deliverables/saltik-menu-qa');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 results=[]
 for w,h in [(1440,900),(844,390),(667,375)]:
  context=browser.new_context(viewport={'width':w,'height':h},has_touch=w<1000,is_mobile=w<1000)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL,wait_until='networkidle');page.wait_for_function('!document.querySelector("#start").disabled')
  assert page.locator('.title-credit').inner_text()=='by limule & regalec'
  title=page.locator('#title').bounding_box();credit=page.locator('.title-credit').bounding_box()
  card=page.locator('.title-content').bounding_box();start=page.locator('#start').bounding_box();footer=page.locator('.title-footer').bounding_box()
  assert credit['y']>=title['y']+title['height']-1,(title,credit)
  assert credit['y']+credit['height']<start['y'],(credit,start)
  assert card['y']+card['height']<=footer['y']-2,(w,h,card,footer)
  assert start['width']>=44 and start['height']>=44
  assert start['x']>=0 and start['x']+start['width']<=w and start['y']+start['height']<h
  page.screenshot(path=str(OUT/f'{w}-menu.png'))
  page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
  page.evaluate('async()=>window.readGame=(await import("./src/main.js")).getSnapshot')
  page.wait_for_function('()=>readGame().speech.played.ready===1')
  assert page.locator('#hud').is_visible() and page.locator('#hp-value').is_visible()
  assert page.locator('#score-value,#progress-value,#progress-bar,#weapon-status,#weapon-indicator,#zone-name').count()==0
  assert '/ 3 s' in page.locator('#fire-cooldown').inner_text()
  page.screenshot(path=str(OUT/f'{w}-clean-hud.png'))
  page.keyboard.press('Escape');assert page.locator('#pause-screen').is_visible()
  assert '3 s, recharge 1,32 s' in page.locator('.pause-help').inner_text()
  page.screenshot(path=str(OUT/f'{w}-pause.png'))
  page.click('#resume');page.keyboard.down('ArrowRight');page.keyboard.down('KeyJ')
  page.wait_for_function('()=>readGame().stats.shots>0&&readGame().player.x>185')
  page.keyboard.up('ArrowRight');page.keyboard.up('KeyJ')
  assert not errors,errors
  results.append({'device':[w,h],'credit':page.locator('.title-credit').inner_text(),'start':start,'titleCard':card,'footer':footer,'hudRemoved':True,'playResumeFire':'passed','pageErrors':errors})
  context.close()
 (OUT/'menu-results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results));browser.close()
