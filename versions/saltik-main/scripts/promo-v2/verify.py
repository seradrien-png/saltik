from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import functools,json
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2];WORK=Path('/workspace/recovery-saltik/promo-v2')
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4177),functools.partial(Handler,directory=str(ROOT/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
reports=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for phone in [False,True]:
   page=browser.new_page(viewport={'width':851 if phone else 1440,'height':393 if phone else 1000},is_mobile=phone,has_touch=phone)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:4177/promo.html',wait_until='networkidle')
   page.wait_for_function('document.querySelector("video").readyState>=1')
   meta=page.locator('video').evaluate('(v)=>({duration:v.duration,w:v.videoWidth,h:v.videoHeight})')
   assert meta=={'duration':22,'w':1920,'h':1080},meta
   page.locator('h1').click()
   page.locator('video').evaluate('(v)=>v.play()')
   page.wait_for_function('document.querySelector("video").currentTime>0.3')
   if not phone:page.wait_for_function('document.querySelector("video").ended',timeout=30000)
   page.locator('video').evaluate('(v)=>v.pause()')
   page.screenshot(path=str(WORK/('phone-page.png' if phone else 'desktop-page.png')))
   link=page.locator('a[download]');assert link.get_attribute('href')=='./video/saltik-gameplay-promo.mp4'
   response=page.request.get('http://127.0.0.1:4177/video/saltik-gameplay-promo.mp4')
   assert response.status==200 and len(response.body())>100000
   page.locator('.play').click()
   expect(page.locator('#start')).to_be_enabled(timeout=25000)
   assert not errors,errors
   reports.append({'device':'phone' if phone else 'desktop',**meta,'playback':True,'naturalEnd':not phone,'download':True,'gameLink':True,'errors':errors})
   page.close()
  browser.close()
finally:server.shutdown()
(WORK/'browser-report.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
