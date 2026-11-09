"""Normal-input desktop pod-first and phone hull-first boss campaigns."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import os
import traceback
from urllib.parse import urlparse

OUT = Path('/workspace/deliverables/calm-boss-qa')
OUT.mkdir(parents=True, exist_ok=True)
URL = os.environ.get('FERAL_PREVIEW_URL', 'http://127.0.0.1:4213')
VIEWPORTS = json.loads(os.environ.get('FERAL_DUAL_VIEWPORTS', '[[1440,900],[844,390]]'))
CONTROL = r"""async order=>{
  window.readGameSnapshot=(await import('./src/main.js')).getSnapshot;
  const held=new Set();
  const o=window.dualBossProbe={order,stage:'drive',podPhases:[],hullPhases:[],podRaiseMax:0,
    cannonRecoilMax:0,volleys:[],cannonVolleys:[],chargeTransitions:[],podRocketLaunch:null,
    bossSeen:null,podButtonVisible:null,earlyPodButtonViolation:null,hullEligible:null,hullFar:null,
    podStart:null,podEnd:null,hullStart:null,hullEnd:null,hullShotsMax:0,duelCount:0,frames:0};
  function keys(wanted){
    const next=new Set(wanted);
    for(const code of [...held])if(!next.has(code)){
      window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.delete(code);
    }
    for(const code of next)if(!held.has(code)){
      window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));held.add(code);
    }
  }
  let duelTap=false,lastAssault=null,lastPodCount=0,lastCannonCount=0,lastChargePhase=null;
  function frame(){
    const s=readGameSnapshot(),p=s.player,b=s.boss,q=s.bossBreach;
    o.frames++;
    if(b){
      const actionButton=document.querySelector('#boss-action-button');
      const distance=Math.abs(p.x-b.x),label=document.querySelector('#boss-action-name').textContent;
      if(!o.bossSeen)o.bossSeen={time:s.time,hp:b.hp,distance};
      if(b.podVolleysFired===0&&b.hp>b.maxHp*.45&&!actionButton.hidden&&!o.earlyPodButtonViolation)
        o.earlyPodButtonViolation={time:s.time,distance,label};
      if(b.podVolleysFired>lastPodCount){
        o.volleys.push({time:s.time,count:b.podVolleysFired,raise:b.podRaise,
          rockets:s.projectiles.filter(x=>x.kind==='enemy-missile'&&
            Math.abs(x.launchX-(b.x+56))<5&&Math.abs(x.launchY-(b.y-245))<5).length,
          cannonCount:b.attack});
        lastPodCount=b.podVolleysFired;
      }
      if(b.attack>lastCannonCount){
        o.cannonVolleys.push({time:s.time,count:b.attack,podCount:b.podVolleysFired,
          plasma:s.projectiles.filter(x=>x.kind==='plasma'&&x.team==='enemy').length});
        lastCannonCount=b.attack;
      }
      if(b.chargePhase!==lastChargePhase){
        o.chargeTransitions.push({phase:b.chargePhase,time:s.time,x:b.x,startX:b.chargeStartX,
          targetX:b.chargeTargetX,duration:b.chargeDuration});lastChargePhase=b.chargePhase;
      }
      if(!actionButton.hidden&&label==='POD'&&!o.podButtonVisible)
        o.podButtonVisible={time:s.time,count:b.podVolleysFired,distance};
      if(s.bossAssaultAvailable==='hull'){
        const state={time:s.time,hp:b.hp,distance,podDestroyed:b.podDestroyed,
          podCount:b.podVolleysFired,visible:!actionButton.hidden,label,
          red:getComputedStyle(actionButton).backgroundColor};
        if(!o.hullEligible)o.hullEligible=state;
        if(distance>430&&!actionButton.hidden&&label==='ARRACHER'&&!o.hullFar)o.hullFar=state;
      }
      o.podRaiseMax=Math.max(o.podRaiseMax,b.podRaise||0);
      o.cannonRecoilMax=Math.max(o.cannonRecoilMax,b.cannonRecoil||0);
      if(!o.podRocketLaunch){const shot=s.projectiles.find(x=>x.kind==='enemy-missile'&&
        Math.abs(x.launchX-(b.x+56))<5&&Math.abs(x.launchY-(b.y-245))<5);
        if(shot)o.podRocketLaunch={x:shot.launchX,y:shot.launchY,bossX:b.x,bossY:b.y,time:s.time};}
    }
    if(s.status==='paused'){keys([]);requestAnimationFrame(frame);return;}
    if(s.status!=='playing'){keys([]);o.final={status:s.status,hp:p.hp,time:s.time};return;}
    if(q){
      const path=q.kind==='pod'?o.podPhases:o.hullPhases;
      if(lastAssault!==q.kind+':'+q.phase){
        path.push({phase:q.phase,time:s.time,hp:b.hp,x:p.x,y:p.y});
        lastAssault=q.kind+':'+q.phase;
      }
      if(q.kind==='pod'&&!o.podStart)o.podStart={hp:b.hp,time:s.time};
      if(q.kind==='hull'){
        if(!o.hullStart)o.hullStart={hp:b.hp,time:s.time};
        o.hullShotsMax=Math.max(o.hullShotsMax,q.shotsFired||0);
      }
    }else if(lastAssault){
      if(lastAssault.startsWith('pod:'))o.podEnd={hp:b.hp,time:s.time,onGround:p.onGround,support:p.bossSupport,podDestroyed:b.podDestroyed};
      if(lastAssault.startsWith('hull:'))o.hullEnd={hp:b.hp,time:s.time,onGround:p.onGround,support:p.bossSupport,breached:b.breached};
      lastAssault=null;
    }
    let wanted=[];
    if(s.duel){
      o.duelCount=Math.max(o.duelCount,1);
      duelTap=!duelTap;wanted=duelTap&&s.duel.phase==='qte'?['Space']:[];
    }else if(o.stage==='drive'){
      if(!b)wanted=['ArrowRight','KeyJ','KeyK','KeyL'];
      else if(order==='pod-first'){
        if(b.podVolleysFired>=1&&b.attack>=1&&!actionHidden()&&s.bossAssaultAvailable==='pod')o.stage='podReady';
        else wanted=['telegraph','charge','recover'].includes(b.chargePhase)?['KeyF']:
          [b.x<p.x?'ArrowLeft':'ArrowRight'];
      }else if(b.hp<=b.maxHp*.45)o.stage='hullObserve';
      else wanted=['telegraph','charge','recover'].includes(b.chargePhase)?['KeyF']:
        b.hp>125?['ArrowRight','KeyJ','KeyK','KeyL']:['ArrowRight','KeyJ'];
    }else if(o.stage==='hullRoute'){
      if(b&&b.hp<=90&&!actionHidden())o.stage='hullReady';
      else wanted=['telegraph','charge','recover'].includes(b?.chargePhase)?['KeyF']:
        b?.hp>125?['ArrowRight','KeyJ','KeyK','KeyL']:['ArrowRight','KeyJ'];
    }else if(o.stage==='hullObserve'){
      if(o.hullFar&&!actionHidden())o.stage='hullReady';
      else wanted=['telegraph','charge','recover'].includes(b?.chargePhase)?['KeyF']:
        [b?.x<p.x?'ArrowRight':'ArrowLeft'];
    }else if(o.stage==='finish'&&!q){
      wanted=b?.chargePhase==='telegraph'||b?.chargePhase==='charge'?['KeyF']:
        [b?.x<p.x?'ArrowLeft':'ArrowRight','KeyJ','KeyK','KeyL'];
    }
    keys(wanted);requestAnimationFrame(frame);
  }
  function actionHidden(){return document.querySelector('#boss-action-button').hidden;}
  requestAnimationFrame(frame);
}"""

def snap(page):
    return page.evaluate('()=>window.readGameSnapshot()')

def until(page, condition, timeout=15000):
    page.wait_for_function('()=>{const s=window.readGameSnapshot();return '+condition+'}', timeout=timeout)

def button(page, mobile):
    target=page.locator('#boss-action-button')
    target.wait_for(state='visible',timeout=2000)
    box=target.bounding_box()
    assert box and box['width']>=44 and box['height']>=44, box
    if mobile:target.tap()
    else:page.keyboard.press('KeyB')

def assault(page, kind, mobile, prefix):
    before=snap(page)
    assert before['boss'] and before['boss']['hp']>0
    assert page.locator('#boss-action-button').is_visible()
    button(page,mobile)
    until(page, f's.bossBreach?.kind==="{kind}"&&s.bossBreach.phase==="leap"')
    leap=snap(page)
    base_hp=leap['boss']['hp']
    until(page, 's.bossBreach?.phase==="qte"')
    page.wait_for_timeout(180)
    assert snap(page)['bossBreach']['taps']==0, 'launch input leaked into QTE'
    page.screenshot(path=str(OUT/f'{prefix}-{kind}-qte.png'))
    button(page,mobile)
    until(page, 's.bossBreach?.taps===1')
    page.keyboard.press('Escape')
    frozen=snap(page)['bossBreach']
    page.wait_for_timeout(250)
    assert snap(page)['bossBreach']==frozen, 'pause advanced the assault'
    page.locator('#resume').click()
    for taps in (2,3):
        button(page,mobile)
        until(page, f's.bossBreach?.taps==={taps}')
        page.wait_for_timeout(80)
    until(page, 's.bossBreach?.phase==="fire"', timeout=6000)
    page.screenshot(path=str(OUT/f'{prefix}-{kind}-fire.png'))
    if kind=='hull':
        until(page, 's.bossBreach?.shotsFired>=4', timeout=3000)
        page.screenshot(path=str(OUT/f'{prefix}-{kind}-burst.png'))
    # The pod's fire and eject frames are brief; the RAF observer records
    # every phase even if a full-page screenshot spans those transitions.
    page.screenshot(path=str(OUT/f'{prefix}-{kind}-after-fire.png'))
    until(page, '!s.bossBreach', timeout=9000)
    after=snap(page)
    page.screenshot(path=str(OUT/f'{prefix}-{kind}-ground-return.png'))
    expected=20 if kind=='pod' else 60
    assert after['boss']['hp']==base_hp-expected, (kind,base_hp,after['boss']['hp'])
    assert after['player']['onGround'] and not after['player']['bossSupport']
    assert after['boss']['podDestroyed'] if kind=='pod' else after['boss']['breached']
    return {'beforeHp':base_hp,'afterHp':after['boss']['hp'],'returnTime':after['time'],
            'playerHp':after['player']['hp'],'onGround':after['player']['onGround'],
            'podDestroyed':after['boss']['podDestroyed']}

def run_one(browser,w,h):
    mobile=w<1000
    order='hull-first' if mobile else 'pod-first'
    context=browser.new_context(viewport={'width':w,'height':h},has_touch=mobile,is_mobile=mobile)
    page=context.new_page()
    errors=[];voice_requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:voice_requests.append(r.url) if '/audio/voices/' in r.url else None)
    prefix=f'{w}x{h}'
    try:
        page.goto(URL,wait_until='networkidle')
        page.wait_for_function('!document.querySelector("#start").disabled')
        page.locator('#start').click()
        page.wait_for_function("document.querySelector('#app').dataset.cinematic!=='intro'")
        page.evaluate(CONTROL,order)
        pod=None
        if order=='pod-first':
            page.wait_for_function('()=>window.dualBossProbe.stage==="podReady"',timeout=150000)
            assert snap(page)['bossAssaultAvailable']=='pod'
            pod=assault(page,'pod',mobile,prefix)
            page.evaluate('()=>window.dualBossProbe.stage="hullRoute"')
        page.wait_for_function('()=>window.dualBossProbe.stage==="hullReady"',timeout=180000 if order=='hull-first' else 90000)
        before_hull=snap(page)
        page.screenshot(path=str(OUT/f'{prefix}-red-hull-action.png'))
        assert before_hull['bossAssaultAvailable']=='hull'
        assert page.locator('#boss-action-name').inner_text()=='ARRACHER'
        if order=='hull-first':
            assert not before_hull['bossPodUsed'] and not before_hull['boss']['podDestroyed']
        hull=assault(page,'hull',mobile,prefix)
        observation=page.evaluate('()=>window.dualBossProbe')
        assert not observation['earlyPodButtonViolation'],observation['earlyPodButtonViolation']
        assert observation['volleys'] and observation['volleys'][0]['count']==1,observation
        assert observation['volleys'][0]['rockets']==8,observation['volleys'][0]
        assert observation['podRaiseMax']>=.99, observation['podRaiseMax']
        assert observation['podRocketLaunch'], 'no physical boss-pod volley observed'
        assert observation['hullShotsMax']==6, observation['hullShotsMax']
        assert [v['phase'] for v in observation['hullPhases']]==['leap','qte','tear','fire','eject','return']
        assert observation['hullEligible'] and observation['hullEligible']['hp']<=90,observation
        if order=='pod-first':
            assert observation['podButtonVisible'] and observation['podButtonVisible']['count']>=1
            assert observation['volleys'][0]['time']<=observation['podButtonVisible']['time']<=observation['podStart']['time']
            assert observation['cannonVolleys'] and observation['cannonRecoilMax']>=.99
            first_cannon=observation['cannonVolleys'][0]
            assert first_cannon['podCount']==1 and observation['volleys'][0]['cannonCount']==0
            assert abs(first_cannon['time']-observation['volleys'][0]['time']-4.5)<.14
            assert [v['phase'] for v in observation['podPhases']]==['leap','qte','tear','fire','eject','return']
        else:
            assert not observation['podStart'] and not observation['podPhases']
            far=observation['hullFar']
            assert far and far['distance']>430 and not far['podDestroyed'],far
            assert far['visible'] and far['label']=='ARRACHER' and far['red']=='rgb(232, 50, 36)',far
        transitions=observation['chargeTransitions']
        for index,item in enumerate(transitions):
            if item['phase']=='charge' and index+1<len(transitions) and transitions[index+1]['phase']=='recover':
                charge=item,transitions[index+1]
                break
        else:raise AssertionError(f'no complete physical charge: {transitions}')
        assert abs(charge[0]['duration']-1.65/.85)<1e-8,charge
        assert abs(charge[1]['time']-charge[0]['time']-1.65/.85)<.14,charge
        # A RAF snapshot can skip the exact turnaround and see up to two
        # physics ticks of the return; unit coverage asserts the exact endpoint.
        return_step=abs(charge[0]['startX']-charge[0]['targetX'])/1.5/30
        assert abs(charge[1]['x']-charge[0]['targetX'])<=return_step+2,charge
        page.evaluate('()=>window.dualBossProbe.stage="finish"')
        until(page,'s.status==="won"',timeout=55000)
        until(page,'s.presentationAge>2.3',timeout=9000)
        until(page,'s.speech.played.victory===1',timeout=8000)
        page.screenshot(path=str(OUT/f'{prefix}-victory.png'))
        final=snap(page)
        assert final['player']['onGround'] and final['player']['hp']>0
        assert final['speech']['failed']==0,final['speech']
        played=final['speech']['played']
        for line,count in {'ready':1,'saltik-detected':3,'grab-him':3,
                           'goodbye':3,'victory':1}.items():
            assert played.get(line,0)==count,(line,final['speech'])
        assert played.get('target-lock',0)>=1,final['speech']
        requested_clips={Path(urlparse(url).path).name for url in voice_requests}
        assert requested_clips=={'ready.ogg','target-lock.ogg','saltik-detected.ogg',
                                 'grab-him.ogg','goodbye.ogg','victory.ogg'},requested_clips
        assert not errors,errors
        result={'viewport':[w,h],'order':order,'pod':pod,'hull':hull,'observation':observation,
                'final':{'status':final['status'],'hp':final['player']['hp'],'time':final['time']},
                'finalSpeech':final['speech'],'requestedVoiceClips':sorted(requested_clips),
                'voiceRequests':voice_requests,'pageErrors':errors}
        (OUT/f'{prefix}-result.json').write_text(json.dumps(result,indent=2))
        return result
    except Exception:
        report={'traceback':traceback.format_exc(),'errors':errors,'voiceRequests':voice_requests}
        try:report['state']=snap(page);report['observation']=page.evaluate('()=>window.dualBossProbe')
        except Exception:pass
        (OUT/f'{prefix}-failure.json').write_text(json.dumps(report,indent=2))
        try:page.screenshot(path=str(OUT/f'{prefix}-failure.png'))
        except Exception:pass
        raise
    finally:context.close()

if __name__=='__main__':
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                  args=['--no-sandbox','--disable-dev-shm-usage'])
        results=[]
        try:
            for w,h in VIEWPORTS:results.append(run_one(browser,w,h))
            (OUT/'results.json').write_text(json.dumps(results,indent=2))
            print(json.dumps({'passed':[r['viewport'] for r in results],
                              'bossPhases':[r['observation']['hullPhases'] for r in results]}))
        finally:browser.close()
