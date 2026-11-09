"""Bounded right-dock checks against source; fixture hooks exist only in this route.
Assets missing from the source root are served from dist without rebuilding it.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json, os

ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/tmp/saltik-action-dock-qa');OUT.mkdir(exist_ok=True)
class SourceHandler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        source=Path(super().translate_path(path))
        return str(source if source.exists() else ROOT/'dist'/source.relative_to(ROOT))
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SourceHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=os.environ.get('FERAL_PREVIEW_URL',f'http://127.0.0.1:{server.server_port}')
SOURCE=(ROOT/'src/main.js').read_text()
for call in ['update(game,input.consume(),1/60);','update(game,consumeInput(),1/60);']:
    SOURCE=SOURCE.replace(call,'if(!window.__dockFreeze)'+call)
SOURCE+='''\nwindow.__dockFreeze=true;
window.__dockFixture={
 get game(){return game;},
 sync(){syncDuelPhase();syncBreachPhase();syncCarrierState();syncIntroState();updateUI();},
 reset(){clearInput();game=createGame();game.schedule=[];game.enemies=[];setView('playing');this.sync();},
 consume(){return consumeInput();},
 step(dt=1/60){update(game,consumeInput(),dt);this.sync();}
};\n'''

class Touch:
    def __init__(self,context,page):self.page=page;self.cdp=context.new_cdp_session(page);self.held={}
    def down(self,id,selector):
        r=self.page.locator(selector).bounding_box();self.held[id]={'id':id,'x':r['x']+r['width']/2,'y':r['y']+r['height']/2}
        self.cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':list(self.held.values())})
    def up(self,id):
        released=self.held.pop(id);self.cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[released]})

def wait_inputs(page,**want):
    page.wait_for_function('want=>Object.entries(want).every(([k,v])=>window.readGameSnapshot().inputs[k]===v)',arg=want)

def snapshot(page):return page.evaluate("()=>window.readGameSnapshot()")
def sync(page):page.evaluate('()=>window.__dockFixture.sync()')
def layout(page,selector):
    return page.locator(selector).evaluate_all('els=>els.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.id,x:r.x,y:r.y,w:r.width,h:r.height,color:s.color,bg:s.backgroundColor,radius:s.borderTopLeftRadius}})')
def right_action(page,mode,selector,width,height):
    assert page.locator('#action-dock').get_attribute('data-mode')==mode
    assert not page.locator('.action-controls').is_visible()
    assert page.locator(selector).is_visible()
    b=layout(page,selector)[0]
    assert min(b['w'],b['h'])>=44,b
    assert b['x']>=width/2 and b['x']+b['w']<=width and b['y']>=0 and b['y']+b['h']<=height,b
    pad=page.locator('#directional-pad').bounding_box()
    assert pad['x']+pad['width']<b['x'],(pad,b)
    assert len(page.locator('#action-dock #qte-button,#action-dock #boss-action-button').all())==2
    return b

def key(page,code,down=True):
    getattr(page.keyboard,'down' if down else 'up')(code)

def step(page,dt=1/60):page.evaluate('(dt)=>window.__dockFixture.step(dt)',dt)

def preset(page,name):
    page.evaluate('''async name=>{
      const f=window.__dockFixture;f.reset();const g=f.game,p=g.player;
      if(name==='duel'){
        const {createEnemySaltik}=await import('./src/enemy-saltik.js');
        const {createSaltikDuel}=await import('./src/saltik-duel.js');
        const e=createEnemySaltik({id:'fixture-saltik',x:p.x+100},{y:p.y});e.guard=true;g.enemies=[e];
        g.duel=createSaltikDuel(p,e);g.duel.phase='qte';g.duel.qteArmed=true;
      }else if(name==='pod'||name==='hull'){
        const {createBossTank}=await import('./src/boss-tank.js');
        g.boss=createBossTank(p.x+200,()=>p.y);g.boss.podVolleysFired=1;
        if(name==='hull')g.boss.hp=80;
      }else if(name==='carrier'){
        const {createDroneCarrier}=await import('./src/drone-carrier.js');
        const e=createDroneCarrier({id:'fixture-carrier',x:p.x+100},{y:p.y});
        Object.assign(e,{disabled:true,immobilized:true,backDestroyed:true,legDestroyed:true,hp:18});g.enemies=[e];
      }f.sync();
    }''',name)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    results=[]
    for width,height in [(667,375),(851,393),(1280,576)]:
        context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<1000,is_mobile=width<1000)
        page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('**/src/main.js',lambda route:route.fulfill(status=200,content_type='text/javascript',body=SOURCE))
        page.goto(URL,wait_until='networkidle');page.wait_for_function("!document.querySelector('#start').disabled")
        page.evaluate("async()=>window.readGameSnapshot=(await import('./src/main.js')).getSnapshot")
        preset(page,'weapons')
        assert page.locator('#action-dock').count()==1,'all red actions need a shared right dock'
        boxes=layout(page,'.pad-cell,#drop-button,.action-controls .control,.utility button')
        for b in boxes:
            assert min(b['w'],b['h'])>=44,b
            assert b['x']>=0 and b['y']>=0 and b['x']+b['w']<=width and b['y']+b['h']<=height,b
        for a in boxes:
            for b in boxes:
                if a is b:continue
                assert a['x']+a['w']<=b['x']+.1 or b['x']+b['w']<=a['x']+.1 or a['y']+a['h']<=b['y']+.1 or b['y']+b['h']<=a['y']+.1,(a,b)
        weapons=layout(page,'.action-controls .control');fire=next(b for b in weapons if b['id']=='fire-button')
        assert abs(fire['w']-fire['h'])<.1 and fire['radius']=='50%',fire
        assert all(fire['w']>b['w'] for b in weapons if b is not fire),weapons
        assert len({b['color'] for b in weapons})==3,weapons
        for b in weapons:
            if b is not fire:assert abs(b['w']-b['h'])<.1,b
        page.screenshot(path=str(OUT/f'{width}-weapons.png'))
        # A held direction survives availability; all weapon sources and their
        # queued taps are discarded before the next simulation update.
        key(page,'ArrowRight');key(page,'KeyJ');key(page,'KeyK');key(page,'KeyL')
        page.evaluate('''async()=>{
          const {createBossTank}=await import('./src/boss-tank.js');const g=window.__dockFixture.game;
          g.boss=createBossTank(g.player.x+200,()=>g.player.y);g.boss.podVolleysFired=1;window.__dockFixture.sync();
        }''')
        action=right_action(page,'boss','#boss-action-button',width,height)
        held=snapshot(page)['inputs'];assert held['right'] and not any(held[a] for a in ['fire','missile','homing']),held
        consumed=page.evaluate('()=>window.__dockFixture.consume()');assert consumed['right'] and not any(consumed[a] for a in ['fire','missile','homing']),consumed
        page.evaluate('''()=>{window.__dockFixture.game.boss.podVolleysFired=0;window.__dockFixture.sync();window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',repeat:true,bubbles:true}));}''')
        assert not snapshot(page)['inputs']['fire'],'a replaced held key must release before weapons rearm'
        for code in ['ArrowRight','KeyJ','KeyK','KeyL']:key(page,code,False)
        key(page,'KeyJ');assert snapshot(page)['inputs']['fire'];key(page,'KeyJ',False)
        # Clear a released weapon tap as well as held levels.
        page.evaluate('''()=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyK',bubbles:true}));window.__dockFixture.game.boss.podVolleysFired=1;window.__dockFixture.sync();}''')
        assert not page.evaluate('()=>window.__dockFixture.consume().missile')
        # Physical multitouch: the same held weapon contact becomes the red
        # dock location, then releases without triggering or sticking anything.
        if width<1000:
            preset(page,'weapons');thumb=Touch(context,page)
            for id,selector in [(1,'.east'),(2,'#fire-button'),(3,'#missile-button'),(4,'#homing-button')]:thumb.down(id,selector)
            wait_inputs(page,right=True,fire=True,missile=True,homing=True)
            page.evaluate('''async()=>{
              const {createBossTank}=await import('./src/boss-tank.js');const f=window.__dockFixture,g=f.game;
              g.boss=createBossTank(g.player.x+200,()=>g.player.y);g.boss.podVolleysFired=1;f.sync();
            }''')
            wait_inputs(page,right=True,fire=False,missile=False,homing=False)
            assert not any(page.evaluate('()=>window.__dockFixture.consume()')[a] for a in ['fire','missile','homing'])
            for id in [2,3,4]:thumb.up(id)
            wait_inputs(page,right=True,fire=False,missile=False,homing=False)
            assert snapshot(page)['bossBreach'] is None,'lifting the old trigger cannot enter the new red action'
            thumb.up(1);wait_inputs(page,right=False)
            page.locator('#fire-button').dispatch_event('pointerdown',{'pointerId':66,'button':0})
            assert not snapshot(page)['inputs']['fire'],'a hidden weapon cannot queue a synthetic press'
            page.locator('#fire-button').dispatch_event('pointerup',{'pointerId':66,'button':0})
        # Both boss entries use B and preserve three distinct presses.
        stages=[]
        for kind in ['pod','hull']:
            preset(page,kind);right_action(page,'boss','#boss-action-button',width,height)
            assert page.locator('#boss-action-name').inner_text()==('POD' if kind=='pod' else 'ARRACHER')
            key(page,'KeyB');step(page);key(page,'KeyB',False)
            assert snapshot(page)['bossBreach']['phase']=='leap'
            right_action(page,'boss','#boss-action-button',width,height)
            assert page.locator('#boss-action-button').is_disabled()
            while snapshot(page)['bossBreach']['phase']=='leap':step(page,.1)
            step(page)
            key(page,'KeyB');step(page);step(page,.1);assert snapshot(page)['bossBreach']['taps']==1
            key(page,'KeyB',False);step(page)
            page.keyboard.press('Escape');before=snapshot(page)['bossBreach'];page.wait_for_timeout(100);assert snapshot(page)['bossBreach']==before
            assert not page.locator('#controls').is_visible();page.click('#resume');sync(page);step(page)
            for count in [2,3]:
                page.locator('#boss-action-button').dispatch_event('pointerdown',{'pointerId':41,'button':0});step(page)
                page.locator('#boss-action-button').dispatch_event('pointerup',{'pointerId':41,'button':0});step(page)
                assert snapshot(page)['bossBreach']['taps']==count
            right_action(page,'boss','#boss-action-button',width,height)
            page.screenshot(path=str(OUT/f'{width}-{kind}-qte.png'));stages.append(kind)
        # Five presses remain five; Space and Enter retain their meanings.
        preset(page,'duel');right_action(page,'duel','#qte-button',width,height)
        assert page.evaluate('document.activeElement.id')=='qte-button','the enabled QTE must receive keyboard focus'
        key(page,'Space');step(page);step(page,.1);assert snapshot(page)['duel']['taps']==1
        key(page,'Space',False);step(page)
        key(page,'Enter');step(page);key(page,'Enter',False);step(page)
        assert snapshot(page)['duel']['taps']==2
        for count in [3,4,5]:
            page.locator('#qte-button').dispatch_event('pointerdown',{'pointerId':42,'button':0});step(page)
            page.locator('#qte-button').dispatch_event('pointerup',{'pointerId':42,'button':0});step(page)
            assert snapshot(page)['duel']['taps']==count
        page.screenshot(path=str(OUT/f'{width}-duel-qte.png'))
        while snapshot(page)['duel']['phase']=='qte':step(page,.1)
        right_action(page,'duel','#qte-button',width,height);assert page.locator('#qte-button').is_disabled()
        for _ in range(120):
            if not snapshot(page)['duel']:break
            step(page,.1)
        assert snapshot(page)['duel'] is None,snapshot(page)
        assert page.locator('.action-controls').is_visible() and not any(snapshot(page)['inputs'].values())
        preset(page,'carrier');right_action(page,'carrier','#boss-action-button',width,height)
        assert page.locator('#boss-action-name').inner_text()=='DÉBRANCHER'
        key(page,'ArrowRight');assert snapshot(page)['inputs']['right'];key(page,'ArrowRight',False)
        key(page,'KeyB');step(page);key(page,'KeyB',False)
        assert snapshot(page)['carrierShutdown'];right_action(page,'carrier','#boss-action-button',width,height)
        assert page.locator('#boss-action-button').is_disabled()
        page.screenshot(path=str(OUT/f'{width}-carrier-active.png'))
        for _ in range(120):
            if not snapshot(page)['carrierShutdown']:break
            step(page,.1)
        assert snapshot(page)['carrierShutdown'] is None
        assert page.locator('.action-controls').is_visible() and not any(snapshot(page)['inputs'].values())
        assert not errors,errors
        results.append({'viewport':[width,height],'minimumTarget':min(min(b['w'],b['h']) for b in boxes),'weapons':weapons,'rightAction':action,'bossStages':stages,'fiveDistinctDuelPresses':True,'heldWeaponsCleared':True,'queuedWeaponsCleared':True,'movementPreservedWhileEligible':True,'physicalTouchRelease':width<1000,'sceneRestoresWeapons':True,'pause':True,'errors':errors})
        context.close()
    browser.close()
server.shutdown()
(OUT/'results.json').write_text(json.dumps(results,indent=2));print(json.dumps({'results':results,'screenshots':str(OUT)}))
