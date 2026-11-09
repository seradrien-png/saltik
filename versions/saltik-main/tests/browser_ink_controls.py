"""Ink control placement and independent real touch ownership at release sizes."""
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
import json, os, pathlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path(os.environ.get('INK_QA_OUT','/tmp/saltik-v2-finishing-ink-controls'))
OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('FERAL_PREVIEW_URL','http://127.0.0.1:4295')

def overlay(route):
    path=urlparse(route.request.url).path.lstrip('/') or 'index.html'
    local=ROOT/path
    if local.is_file() and (path in ['index.html','style.css'] or path.startswith('src/')):
        route.fulfill(path=str(local))
    else:route.continue_()

def want(page,**expected):
    page.wait_for_function('want=>Object.entries(want).every(([key,value])=>window.inkSnapshot().inputs[key]===value)',arg=expected,timeout=2000)

class Touch:
    def __init__(self,context,page):self.page=page;self.cdp=context.new_cdp_session(page);self.held={}
    def point(self,selector,id):
        r=self.page.locator(selector).bounding_box()
        return {'id':id,'x':r['x']+r['width']/2,'y':r['y']+r['height']/2}
    def down(self,id,selector):
        self.held[id]=self.point(selector,id)
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':list(self.held.values())})
    def move(self,id,selector):
        self.held[id]=self.point(selector,id)
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':list(self.held.values())})
    def up(self,id):
        released=self.held.pop(id)
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[released]})
    def clear(self):
        for id in list(self.held):self.up(id)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    errors=[];results=[]
    for width,height in [(667,375),(851,393),(1280,720)]:
        context=browser.new_context(viewport={'width':width,'height':height},has_touch=True,is_mobile=width<900,device_scale_factor=1)
        page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        if os.environ.get('INK_SOURCE_OVERLAY')=='1':page.route('**/*',overlay)
        page.goto(URL,wait_until='networkidle');page.click('#start')
        page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
        page.evaluate("async()=>{window.inkSnapshot=(await import('./src/main.js')).getSnapshot}")
        boxes=page.locator('.pad-cell,#shift-button,#drop-button,.action-controls .control').evaluate_all("els=>els.map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.dataset.padActions,x:r.x,y:r.y,w:r.width,h:r.height}})")
        assert len(boxes)==13,boxes
        for i,a in enumerate(boxes):
            assert min(a['w'],a['h'])>=44,a
            assert a['x']>=0 and a['y']>=0 and a['x']+a['w']<=width+.1 and a['y']+a['h']<=height+.1,a
            for b in boxes[i+1:]:
                assert a['x']+a['w']<=b['x']+.1 or b['x']+b['w']<=a['x']+.1 or a['y']+a['h']<=b['y']+.1 or b['y']+b['h']<=a['y']+.1,(a,b)
        pad=page.locator('#directional-pad').bounding_box();evade=page.locator('#shift-button').bounding_box()
        assert abs(evade['x']+evade['width']/2-pad['x']-pad['width']/2)<1
        assert abs(evade['y']+evade['height']/2-pad['y']-pad['height']/2)<1
        assert evade['x']+evade['width']<width/2
        assert page.locator('.action-controls #shift-button').count()==0
        assert page.locator('#directional-pad #shift-button').count()==1
        assert page.locator('#deflect-button').count()==0
        touch=Touch(context,page)
        touch.down(1,'.east');touch.down(2,'#fire-button');touch.down(3,'#missile-button');touch.down(4,'#homing-button')
        want(page,right=True,fire=True,missile=True,homing=True)
        touch.move(1,'.north-east');want(page,right=True,jump=True,fire=True,missile=True,homing=True)
        touch.move(1,'#shift-button');want(page,right=False,jump=False,shift=False,fire=True,missile=True,homing=True)
        touch.move(1,'.south-west');want(page,left=True,crouch=True,fire=True,missile=True,homing=True)
        touch.down(5,'#shift-button');want(page,left=True,crouch=True,shift=True,fire=True,missile=True,homing=True)
        touch.up(5);want(page,left=True,crouch=True,shift=False,fire=True,missile=True,homing=True)
        touch.up(2);want(page,fire=False,missile=True,homing=True,left=True,crouch=True)
        touch.up(1);want(page,left=False,right=False,jump=False,crouch=False,missile=True,homing=True)
        page.keyboard.press('Escape');assert page.evaluate('()=>Object.values(window.inkSnapshot().inputs).every(value=>!value)')
        touch.clear();page.click('#resume')
        touch.down(1,'.east');touch.down(2,'#shift-button')
        page.set_viewport_size({'width':height,'height':width});page.wait_for_function("document.querySelector('#app').classList.contains('state-paused')")
        assert page.locator('#rotate').is_visible()
        assert page.evaluate('()=>Object.values(window.inkSnapshot().inputs).every(value=>!value)')
        touch.clear();page.set_viewport_size({'width':width,'height':height});page.click('#resume')
        qte=page.locator('#qte-button,#boss-action-button').evaluate_all("els=>els.map(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,radius:s.borderRadius,outline:s.borderColor}})")
        assert all(button['background']=='rgb(161, 44, 39)' and button['radius']=='50%' for button in qte),qte
        page.screenshot(path=str(OUT/f'controls-{width}x{height}.png'))
        results.append({'width':width,'height':height,'minimumTarget':min(min(box['w'],box['h']) for box in boxes),'esquive':'independent center hold','multitouch':'4 controls plus independent hub, neutral crossing, release, pause, portrait passed'})
        context.close()
    assert not errors,errors
    report={'layouts':results,'pageErrors':errors,'sourceOverlay':os.environ.get('INK_SOURCE_OVERLAY')=='1'}
    (OUT/'results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));browser.close()
