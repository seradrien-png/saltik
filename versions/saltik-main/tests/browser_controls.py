"""Real touch input checks for the thumb pad; run against the built preview."""
from playwright.sync_api import sync_playwright
import json, pathlib, os

OUT=pathlib.Path('/tmp/saltik-v2-finishing-ui-qa');OUT.mkdir(exist_ok=True,parents=True)
SNAP="async()=> (await import('./src/main.js')).getSnapshot()"

def snap(page):return page.evaluate(SNAP)
def assert_inputs(page, **want):
    # CDP acknowledges the touch command before Chromium necessarily delivers
    # its coalesced pointermove. Wait for the observable input, not a delay.
    page.wait_for_function("want=>{const actual=window.readGameSnapshot().inputs;return Object.entries(want).every(([key,value])=>actual[key]===value)}",arg=want,timeout=1500)
    actual=snap(page)['inputs']
    for key,value in want.items():assert actual[key]==value,(key,value,actual)

def layout(page):
    boxes=page.locator('.pad-cell,#shift-button,#drop-button,.action-controls .control').evaluate_all("els=>els.map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),actions:e.dataset.padActions||e.dataset.action,x:r.x,y:r.y,w:r.width,h:r.height}})")
    size=page.viewport_size
    assert len(boxes)==13,boxes
    for i,a in enumerate(boxes):
        assert a['w']>=44 and a['h']>=44,a
        assert a['x']>=0 and a['y']>=0 and a['x']+a['w']<=size['width'] and a['y']+a['h']<=size['height'],a
        for b in boxes[i+1:]:assert a['x']+a['w']<=b['x'] or b['x']+b['w']<=a['x'] or a['y']+a['h']<=b['y'] or b['y']+b['h']<=a['y'],(a,b)
    assert boxes[4]['actions']=='shift',boxes[4]
    for b in boxes[:10]:assert b['x']+b['w']<size['width']/2,b
    for b in boxes[10:]:assert b['x']>size['width']/2,b
    return boxes

class Touch:
    def __init__(self,context,page):self.page=page;self.cdp=context.new_cdp_session(page);self.held={}
    def point(self,selector,id):
        r=self.page.locator(selector).bounding_box()
        return {'id':id,'x':r['x']+r['width']/2,'y':r['y']+r['height']/2}
    def down(self,id,selector):
        self.held[id]=self.point(selector,id)
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':list(self.held.values())})
    def move(self,id,selector=None,x=None,y=None):
        self.held[id]=self.point(selector,id) if selector else {'id':id,'x':x,'y':y}
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':list(self.held.values())})
    def up(self,id):
        released=self.held.pop(id)
        # CDP touchEnd describes the point that ended, never remaining contacts.
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[released]})
    def clear(self):
        for id in list(self.held):self.up(id)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    errors=[];results=[]
    for name,width,height,touch in [('desktop',1440,900,False),('mobile',844,390,True),('small-mobile',667,375,True)]:
        context=browser.new_context(viewport={'width':width,'height':height},is_mobile=touch,has_touch=touch,device_scale_factor=1)
        page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(os.environ.get('FERAL_PREVIEW_URL','http://127.0.0.1:4253'),wait_until='networkidle');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
        page.evaluate("async()=>{window.readGameSnapshot=(await import('./src/main.js')).getSnapshot}")
        boxes=layout(page);page.screenshot(path=str(OUT/f'{name}-directional-pad.png'))
        # Move only the DOM pad over the actual rendered character. This catches
        # missing cameraY/CSS scaling and verifies fading preserves the hit box.
        page.evaluate("""async()=>{
          const s=window.readGameSnapshot(),{inkSaltikGeometry}=await import('./src/ink-saltik.js');
          const g=inkSaltikGeometry(s.player,{time:s.time}).bounds,c=document.querySelector('#game').getBoundingClientRect();
          const pad=document.querySelector('#directional-pad'),r=pad.getBoundingClientRect();
          const x=c.left+(g.x+g.w/2-s.camera)/s.viewport.w*c.width;
          const y=c.top+(g.y+g.h/2+s.cameraY)/s.viewport.h*c.height;
          pad.style.transform=`translate(${x-r.left-r.width/2}px,${y-r.top-r.height/2}px)`;
        }""")
        page.wait_for_function("()=>{const p=document.querySelector('#directional-pad');return p.classList.contains('over-player')&&Number(getComputedStyle(p).opacity)<.6}")
        assert page.locator('#directional-pad').evaluate("e=>getComputedStyle(e).pointerEvents")!='none'
        r=page.locator('.east').bounding_box();page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);page.mouse.down()
        assert_inputs(page,right=True);page.mouse.up();assert_inputs(page,right=False)
        page.screenshot(path=str(OUT/f'{name}-pad-over-player.png'))
        page.locator('#directional-pad').evaluate("e=>e.style.transform=''")
        if touch:
            thumb=Touch(context,page)
            thumb.down(2,'[data-action=fire]');thumb.down(3,'[data-action=missile]')
            for selector,want in [('.north-west',{'left':True,'right':False,'jump':True,'crouch':False}),('.north',{'left':False,'right':False,'jump':True,'crouch':False}),('.north-east',{'left':False,'right':True,'jump':True,'crouch':False}),('.east',{'left':False,'right':True,'jump':False,'crouch':False}),('.south-east',{'left':False,'right':True,'jump':False,'crouch':True}),('.south',{'left':False,'right':False,'jump':False,'crouch':True}),('.south-west',{'left':True,'right':False,'jump':False,'crouch':True}),('.west',{'left':True,'right':False,'jump':False,'crouch':False})]:
                thumb.down(1,selector);assert_inputs(page,**want,fire=True,missile=True);thumb.up(1)
                assert_inputs(page,left=False,right=False,jump=False,crouch=False,fire=True,missile=True)
            # Captured pointer drags between sectors and exits the pad without
            # disturbing the other two fingers.
            thumb.down(1,'.east');thumb.move(1,'.north-east');assert_inputs(page,right=True,jump=True,fire=True,missile=True)
            thumb.move(1,'#shift-button');assert_inputs(page,left=False,right=False,jump=False,crouch=False,shift=False,fire=True,missile=True)
            thumb.down(4,'#shift-button');assert_inputs(page,shift=True,fire=True,missile=True)
            thumb.up(4);assert_inputs(page,shift=False,fire=True,missile=True)
            thumb.move(1,'.south-west');assert_inputs(page,left=True,right=False,jump=False,crouch=True,fire=True,missile=True)
            thumb.move(1,x=width/2,y=height/2);assert_inputs(page,left=False,right=False,jump=False,crouch=False,fire=True,missile=True)
            thumb.move(1,'.north');assert_inputs(page,jump=True,fire=True,missile=True)
            thumb.move(1,'.east');page.wait_for_timeout(100);assert_inputs(page,jump=False,right=True)
            thumb.move(1,'.north');assert_inputs(page,jump=True,right=False)
            thumb.up(1)
            page.wait_for_function('()=>window.readGameSnapshot().player.onGround');page.wait_for_timeout(150)
            # Upper jump stays edge-latched for a full flight, then re-arms
            # when a held thumb slides away and returns.
            thumb.down(1,'.north');page.wait_for_timeout(150)
            assert not snap(page)['player']['onGround'],snap(page)
            page.wait_for_function('()=>window.readGameSnapshot().player.onGround')
            page.wait_for_timeout(300);assert snap(page)['player']['onGround'],snap(page)
            thumb.move(1,'.east');page.wait_for_timeout(100);thumb.move(1,'.north');page.wait_for_timeout(150)
            assert not snap(page)['player']['onGround'],snap(page)
            # A key and the pad can own the same movement simultaneously.
            thumb.move(1,'.east');page.keyboard.down('KeyD');thumb.up(1)
            assert_inputs(page,right=True,fire=True,missile=True);page.keyboard.up('KeyD')
            assert_inputs(page,right=False,fire=True,missile=True)
            thumb.up(2);assert_inputs(page,fire=False,missile=True)
            thumb.down(1,'.south-east');page.keyboard.press('Escape')
            assert snap(page)['status']=='paused' and not any(snap(page)['inputs'].values()),snap(page)
            thumb.clear();page.click('#resume')
            thumb.down(1,'.north-east');thumb.down(2,'[data-action=fire]')
            page.set_viewport_size({'width':height,'height':width});page.wait_for_timeout(150)
            assert page.locator('#rotate').is_visible()
            assert snap(page)['status']=='paused' and not any(snap(page)['inputs'].values()),snap(page)
            thumb.clear();page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(100);page.click('#resume')
            thumb.down(1,'.south-east');thumb.down(3,'[data-action=missile]')
            page.evaluate("window.dispatchEvent(new Event('blur'))")
            assert snap(page)['status']=='paused' and not any(snap(page)['inputs'].values()),snap(page)
            thumb.clear()
        else:
            # Both pointer events occur in one JavaScript task, before the next
            # animation frame: a quick upper tap must still reach simulation.
            page.evaluate("""()=>{const cell=document.querySelector('.north');for(const type of ['pointerdown','pointerup'])cell.dispatchEvent(new PointerEvent(type,{pointerId:99,pointerType:'mouse',button:0,bubbles:true}));}""")
            page.wait_for_function('()=>!window.readGameSnapshot().player.onGround')
            page.wait_for_function('()=>window.readGameSnapshot().player.onGround')
            page.keyboard.down('ArrowRight');page.keyboard.down('ArrowUp');page.keyboard.down('KeyJ');page.keyboard.down('KeyK')
            assert_inputs(page,right=True,jump=True,fire=True,missile=True)
            page.keyboard.up('ArrowUp');assert_inputs(page,right=True,jump=False,fire=True,missile=True)
            for key in ['ArrowRight','KeyJ','KeyK']:page.keyboard.up(key)
            page.locator('.north-west').focus();page.keyboard.down('Space')
            assert_inputs(page,left=True,jump=True);page.keyboard.up('Space');assert_inputs(page,left=False,jump=False)
        assert page.locator('#deflect-button').count()==0
        page.keyboard.press('KeyH');assert 'deflect' not in snap(page)['inputs']
        results.append({'device':name,'minimumTarget':min(min(b['w'],b['h']) for b in boxes),'sectors':9,'weapons':'right','multiTouch':touch,'checks':'eight directions, center, dragging, independent ownership, pause/portrait/blur' if touch else 'keyboard diagonal + focused pad button'})
        context.close()
    assert not errors,errors
    report={'controls':results,'errors':errors,'screenshots':str(OUT)}
    (OUT/'controls-results.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report))
    browser.close()
