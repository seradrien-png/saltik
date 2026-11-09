"""Exercise the real Tachikoma controls and required atlas failure UI.

Run against the built preview on port 4173. Game state is observed through the
read-only snapshot; all gameplay actions come from real CDP touch or keyboard.
"""
from playwright.sync_api import sync_playwright
import base64, json, pathlib

OUT=pathlib.Path('/tmp/feral-tachikoma-qa');OUT.mkdir(exist_ok=True)
URL='http://127.0.0.1:4173'
SNAP="async()=> (await import('./src/main.js')).getSnapshot()"

def snapshot(page):return page.evaluate(SNAP)
def until(page,condition,timeout=6000):
    page.wait_for_function("()=>{const s=window.readGameSnapshot();return "+condition+"}",timeout=timeout)
def inputs(page,**want):
    page.wait_for_function("want=>Object.entries(want).every(([k,v])=>window.readGameSnapshot().inputs[k]===v)",arg=want,timeout=1500)

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
    results=[];errors=[]
    for name,width,height in [('desktop',1440,900),('mobile',844,390),('small-mobile',667,375)]:
        context=browser.new_context(viewport={'width':width,'height':height},has_touch=True,is_mobile=name!='desktop',device_scale_factor=1)
        page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(URL,wait_until='networkidle');page.click('#start');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
        page.evaluate("async()=>{window.readGameSnapshot=(await import('./src/main.js')).getSnapshot}")
        touch=Touch(context,page)

        # GUIDÉS must explain why it cannot fire before a target appears, and
        # must keep its independent charge available for the next attempt.
        touch.down(4,'#homing-button')
        until(page,"document.querySelector('#notice').textContent==='AUCUNE CIBLE ENNEMIE'")
        assert snapshot(page)['player']['homingIn']==0
        touch.up(4)

        touch.down(2,'#fire-button');touch.down(3,'#missile-button')
        touch.down(1,'.east');inputs(page,right=True,fire=True,missile=True)
        touch.move(1,'#shift-button')
        inputs(page,left=False,right=False,jump=False,crouch=False,shift=False,fire=True,missile=True)
        assert snapshot(page)['player']['evasion']['cooldown']==0,'crossing the neutral hub must not dodge'
        touch.move(1,'.south-west');inputs(page,left=True,crouch=True,shift=False,fire=True,missile=True)
        touch.up(1);inputs(page,left=False,crouch=False,fire=True,missile=True)
        touch.clear()

        until(page,'!s.player.turn?.active')
        # ESQUIVE activates only on a direct press and never repeats while held.
        touch.down(1,'#shift-button');until(page,'s.player.evasion.active')
        page.wait_for_function("document.querySelector('#shift-button').classList.contains('active')")
        assert page.locator('#shift-cooldown').inner_text()=='ESQUIVE'
        until(page,'s.player.evasion.cooldown===0')
        held=snapshot(page)
        assert held['inputs']['shift'] and not held['player']['evasion']['active'],held
        touch.up(1)
        touch.down(1,'#shift-button');until(page,'s.player.evasion.active');touch.up(1)
        until(page,'!s.player.evasion.active')

        # Start a fresh run to measure both independent weapon recharges from
        # their ready state, without changing any simulation state directly.
        page.keyboard.press('Escape');page.click('#restart-pause');page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
        touch.down(1,'.east');until(page,'s.enemies.some(e=>e.hp>0&&e.x<s.camera+s.worldWidth-80&&e.x>s.camera+100)');touch.up(1)
        page.evaluate('''()=>{
          window.chargeObservations={};
          function observe(){
            const s=window.readGameSnapshot(),o=window.chargeObservations;
            for(const [stat,field] of [['homingSalvos','homingIn'],['mirvs','mirvIn']])
              if(s.stats[stat]>0&&!o[field])o[field]={time:s.time,remaining:s.player[field]};
            if(!o.homingIn||!o.mirvIn)requestAnimationFrame(observe);
          }
          requestAnimationFrame(observe);
        }''')
        touch.down(4,'#homing-button');until(page,'s.stats.homingSalvos===1')
        touch.down(3,'#missile-button');until(page,'s.stats.mirvs===1')
        touch.down(2,'#fire-button');until(page,'s.stats.shots>0')
        inputs(page,homing=True,missile=True,fire=True)
        salvo=snapshot(page)
        observed=page.evaluate('()=>window.chargeObservations')
        # Capture launch frames before later CDP calls consume simulation time;
        # elapsed input/RPC time cannot shorten the actual weapon recharge.
        for field,total in [('homingIn',9.5),('mirvIn',5.2)]:
            charge=observed[field]
            assert total-.2<charge['remaining']<=total,(field,charge)
            expected=max(0,charge['remaining']-(salvo['time']-charge['time']))
            assert abs(salvo['player'][field]-expected)<1e-6,(field,expected,salvo['player'][field])
        page.wait_for_function("document.querySelector('#homing-cooldown').textContent.endsWith('s')&&document.querySelector('#mirv-cooldown').textContent.endsWith('s')")
        assert page.locator('#homing-button').get_attribute('class').find('recharging')>=0
        assert page.locator('#missile-button').get_attribute('class').find('recharging')>=0
        touch.up(3);inputs(page,missile=False,homing=True,fire=True)
        touch.up(4);inputs(page,missile=False,homing=False,fire=True)
        page.screenshot(path=str(OUT/f'{name}-independent-recharges.png'))

        # Pause must release all fingers, freeze both cooldowns, and ignore
        # weapon keys until resumed. Resuming never replays a paused press.
        touch.down(1,'.south-east');inputs(page,right=True,crouch=True,fire=True)
        page.keyboard.press('Escape');until(page,"s.status==='paused'")
        paused=snapshot(page);assert not any(paused['inputs'].values()),paused
        page.keyboard.press('KeyL');page.keyboard.press('KeyK');page.keyboard.press('KeyF')
        page.wait_for_timeout(150);after=snapshot(page)
        assert after['time']==paused['time']
        assert after['player']['mirvIn']==paused['player']['mirvIn']
        assert after['player']['homingIn']==paused['player']['homingIn']
        touch.clear();page.click('#resume');until(page,"s.status==='playing'")
        resumed=snapshot(page)
        assert not any(resumed['inputs'].values()) and not resumed['player']['evasion']['active'],resumed
        assert resumed['stats']['homingSalvos']==1 and resumed['stats']['mirvs']==1,resumed
        results.append({'device':name,'neutralHub':True,'directPlan':'one dodge per press','threeIndependentTouches':True,'cooldowns':{'mirv':salvo['player']['mirvIn'],'guided':salvo['player']['homingIn']},'pause':'clears and freezes'})
        context.close()

    # A decoded 1px image cannot supply any required action, melee or cover
    # atlas. Missing and malformed images must both keep deployment disabled.
    tiny_png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
    failures=[]
    cases=[(atlas,name,status,body) for atlas in ['tachikoma','saltik-melee','destructibles','saltik-evasion','enemy-saltik','combat-blast']
        for name,status,body in [('missing',404,b'not found'),('malformed',200,tiny_png)]]
    for atlas,name,status,body in cases:
        context=browser.new_context(viewport={'width':1440,'height':900});page=context.new_page();logs=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('console',lambda message:logs.append(message.text) if message.type=='error' else None)
        context.route(f'**/assets/{atlas}.webp',lambda route:route.fulfill(status=status,body=body,content_type='image/png'))
        page.goto(URL,wait_until='networkidle')
        page.wait_for_function("document.querySelector('#start span').textContent==='CONNEXION INTERROMPUE'")
        assert page.locator('#start').is_disabled()
        assert page.locator('#toast').is_visible() and 'Striker' in page.locator('#toast').inner_text()
        if name=='malformed':assert any(('1254' in line if atlas=='saltik-evasion' else '1536' in line and '1024' in line) for line in logs),logs
        page.keyboard.press('Enter');page.keyboard.press('Space')
        state=snapshot(page);assert state['view']=='title' and state['status']=='title' and state['time']==0,state
        page.screenshot(path=str(OUT/f'{atlas}-{name}.png'))
        failures.append({'atlas':atlas,'failure':name,'deploymentDisabled':True,'visibleError':True})
        context.close()
    assert not errors,errors
    print(json.dumps({'tachikomaControls':results,'requiredAtlasFailures':failures,'pageErrors':errors,'screenshots':str(OUT)}))
    browser.close()
