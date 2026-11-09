"""Native browser evidence for the restored V1 planted hull sequence."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import functools

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/workspace/deliverables/saltik-carrier-qa/boss-v1')
OUT.mkdir(parents=True, exist_ok=True)
server = ThreadingHTTPServer(('127.0.0.1', 4327), functools.partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:4327/tests/', wait_until='domcontentloaded')
    result = page.evaluate('''async () => {
      const poses=await import('/src/ink-encounters.js'),clock=await import('/src/boss-breach.js'),{bakePastelArt}=await import('/src/pastel-paint.js');
      const images={};
      for(const [name,path] of Object.entries({'ink-boss':'pastel-boss','ink-boss-parts':'pastel-boss-parts','ink-saltik':'ink-saltik'})){
        const im=new Image();im.src='/dist/assets/'+path+'.png';await im.decode();images[name]=im;
        if(name==='ink-saltik'){const paint=new Image();paint.src='/dist/assets/ink-saltik-paint.png';await paint.decode();images[name]=bakePastelArt(im,paint,{strength:1,outline:2});}
      }
      const boss={x:0,y:0,hp:200,maxHp:200,podRaise:0,podPhase:'stowed',cannonRecoil:0};
      const state=(phase,elapsed,taps=3,extra={})=>({kind:'hull',phase,elapsed,taps,effortsCompleted:taps-1,effortElapsed:0,shotsFired:phase==='fire'?1:0,deckX:-85,deckY:-85,...extra});
      let q={...clock.createBossBreach({x:-300,y:0},boss,false,'hull'),phase:'qte',elapsed:0,qteArmed:true};const events=[];
      for(let tap=1;tap<=3;tap++){let r=clock.advanceBossBreach(q,true,.01);q=r.breach;events.push(...r.events);r=clock.advanceBossBreach(q,false,.31);q=r.breach;events.push(...r.events);}
      const pulses=[];
      for(let frame=0;frame<110;frame++){const r=clock.advanceBossBreach(q,false,1/60);q=r.breach;events.push(...r.events);if(r.events.some(e=>e.type==='breach-shot'))pulses.push(structuredClone(q));}
      document.body.innerHTML='<canvas width="1920" height="1080"></canvas>';document.body.style='margin:0;background:#f2e5cc';
      const c=document.querySelector('canvas').getContext('2d');
      function sheet(states,columns=4){c.fillStyle='#f2e5cc';c.fillRect(0,0,1920,1080);const rows=Math.ceil(states.length/columns),w=1920/columns,h=1080/rows,metrics=[];
       states.forEach(([label,q],i)=>{const x=(i%columns+.5)*w,y=(Math.floor(i/columns)+1)*h-45,scale=Math.min((w-14)/370,(h-85)/300),b={...boss,breached:q.kind==='hull'&&q.phase==='fire',podDestroyed:q.kind==='pod'&&q.phase==='fire'};
        c.fillStyle='#38434a';c.font='bold 21px sans-serif';c.fillText(label,i%columns*w+20,Math.floor(i/columns)*h+30);
        c.save();c.translate(x,y);c.scale(scale,scale);poses.drawInkBossTank(c,images,b,{breach:q});poses.drawInkBossBreach(c,images,q,b,{player:q.player??{}});c.restore();
        const g=poses.inkBreachPoseGeometry(q,b,{player:q.player??{}});metrics.push({label,phase:q.phase,elapsed:q.elapsed,tilt:g.geo.tilt,barrelTrim:g.fire.rotation,recoil:g.fire.recoil*g.geo.k,hands:g.handPoints,targets:g.targets,hinge:g.lid?.hinge,feet:g.geo.legs.map(l=>({id:l.id,grounded:l.grounded,contact:l.contact})),muzzle:g.fire.muzzle,target:g.fire.target,flash:g.v.shotFlash});
       });return metrics;
      }
      window.bossEvidence={sheet,state,pulses};
      const stages=sheet([['Grip · native hands',state('qte',1,1)],['Press 2 · effort',state('qte',1,2,{effortElapsed:.16})],['Press 3 · effort',state('qte',1,3,{effortElapsed:.16})],['Tear · lid lifts',state('tear',.10)],['Tear · claws release',state('tear',.22)],['Brace · planted recovery',state('tear',.40)],['Fire · roof gun aims down',pulses[0]],['Recovery · short axial recoil',state('fire',.26,3,{shotsFired:1})]]);
      return {events,stages,pulses:pulses.map(p=>({elapsed:p.elapsed,shot:p.shotsFired})),errors:[]};
    }''')
    page.screenshot(path=str(OUT / 'live-hull-stages.png'))
    result['sixPulses'] = page.evaluate('''()=>bossEvidence.sheet(bossEvidence.pulses.map((q,i)=>['Actual shot '+(i+1),q]),3)''')
    page.screenshot(path=str(OUT / 'live-hull-six-pulses.png'))
    result['pod'] = page.evaluate('''()=>bossEvidence.sheet([['POD · arrival shot',bossEvidence.state('qte',.01,0,{kind:'pod',deckX:35,deckY:-151})],['POD · effort 2',bossEvidence.state('qte',1,2,{kind:'pod',deckX:35,deckY:-151,effortElapsed:.16})],['POD · tear',bossEvidence.state('tear',.18,3,{kind:'pod',deckX:35,deckY:-151})],['POD · destroyed',bossEvidence.state('fire',.10,3,{kind:'pod',deckX:35,deckY:-151})]],2)''')
    page.screenshot(path=str(OUT / 'live-boss-pod-regression.png'))
    result['ejection'] = page.evaluate('''()=>bossEvidence.sheet([0,.1,.25,.4].map(t=>['Safe ejection · '+t.toFixed(2)+'s',bossEvidence.state('eject',t,3,{x:-85-156*t/.4,y:-85-50*t/.4,player:{x:-85-156*t/.4,y:-85-50*t/.4,podCycle:{elapsed:5,duration:9.5,fired:[true,true,true],firedAt:[0,.085,.17]}}})]),2)''')
    page.screenshot(path=str(OUT / 'live-boss-ejection-spent-pods.png'))
    result['errors'] = errors
    (OUT / 'live-boss-geometry.json').write_text(json.dumps(result, indent=2))
    assert not errors, errors
    assert len(result['pulses']) == 6
    assert sum(e['type'] == 'breach-tap' for e in result['events']) == 3
    assert all(abs(s['tilt']) <= .25 and abs(s['barrelTrim'])<1.2 for s in result['sixPulses'])
    print(json.dumps({'errors': errors, 'actualPulses': len(result['pulses']), 'output': str(OUT)}))
    browser.close()
server.shutdown()
