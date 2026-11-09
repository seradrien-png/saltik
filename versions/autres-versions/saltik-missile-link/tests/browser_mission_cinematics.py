"""Read-only presentation observations with normal start/pause/key inputs."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
OUT=Path('/tmp/feral-refined-cinematics-qa');OUT.mkdir(exist_ok=True)
def snap(page):return page.evaluate('()=>window.readGameSnapshot()')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);results=[]
 for w,h in [(1440,900),(667,375)]:
  page=b.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:4173',wait_until='networkidle');page.wait_for_function('!document.querySelector("#start").disabled')
  page.evaluate('async()=>window.readGameSnapshot=(await import("./src/main.js")).getSnapshot')
  page.click('#start');page.wait_for_function('()=>window.readGameSnapshot().introElapsed>.08')
  initial=snap(page);assert initial['cameraZoom']>1.9 and initial['player']['x']==180
  assert not page.locator('#controls').is_visible() and not page.locator('#hud').is_visible()
  assert page.locator('#tutorial,#notice,#objective,#duel-instruction').count()==0
  page.screenshot(path=str(OUT/f'{w}-intro-close.png'))
  page.keyboard.down('ArrowRight');page.keyboard.down('KeyJ');page.wait_for_timeout(120)
  page.keyboard.press('Escape');frozen=snap(page);page.wait_for_timeout(160)
  assert snap(page)['introElapsed']==frozen['introElapsed'] and snap(page)['cameraZoom']==frozen['cameraZoom']
  page.click('#resume');page.wait_for_function('()=>window.readGameSnapshot().introElapsed===2.2')
  page.evaluate("()=>{for(const code of ['ArrowRight','KeyJ'])window.dispatchEvent(new KeyboardEvent('keydown',{code,repeat:true,bubbles:true}));}")
  page.wait_for_timeout(180);after=snap(page)
  assert after['player']['x']==180 and after['stats']['shots']==0
  assert abs(after['cameraZoom']-1.155)<.00001
  assert abs(after['viewport']['w']-w/h*720/1.155)<.001
  assert page.locator('#controls').is_visible()
  page.keyboard.up('ArrowRight');page.keyboard.up('KeyJ')
  page.screenshot(path=str(OUT/f'{w}-intro-released.png'))
  page.keyboard.down('ArrowRight');page.wait_for_function('()=>window.readGameSnapshot().player.x>190');page.keyboard.up('ArrowRight')
  assert not errors,errors;results.append({'viewport':[w,h],'introZoom':initial['cameraZoom'],'normalZoom':after['cameraZoom'],'pauseAndHeldInput':'passed','noHelpPopups':True,'errors':errors});page.close()
 (OUT/'intro-results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results));b.close()
