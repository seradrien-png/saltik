from pathlib import Path
from playwright.sync_api import sync_playwright
import json

OUT=Path('/workspace/deliverables/saltik-pastel-boss-qa')
OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':1080},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:4288/tests/',wait_until='domcontentloaded')
    result=page.evaluate('''async()=>{
      const {drawInkBossTank,inkBossGeometry,inkBossPodGeometry}=await import('/src/ink-encounters.js');
      document.body.innerHTML='<canvas id="preview" width="1440" height="1080"></canvas>';
      document.body.style='margin:0;background:#f2e5cc';
      const c=document.querySelector('canvas').getContext('2d');
      const images={};
      for(const [name,path] of Object.entries({'ink-boss':'pastel-boss','ink-boss-parts':'pastel-boss-parts','ink-saltik':'ink-saltik'})){
        const im=new Image();im.src='/dist/assets/'+path+'.png';await im.decode();images[name]=im;
      }
      c.fillStyle='#f2e5cc';c.fillRect(0,0,1440,1080);
      const base={x:0,y:0,hp:200,maxHp:200,podRaise:0,podPhase:'stowed',cannonRecoil:0,turretSpin:0};
      const poses=[['FERMÉ',{},null],['POD DÉPLOYÉ',{podRaise:1,podPhase:'firing'},null],
        ['TRAPPE OUVERTE',{}, {kind:'hull',phase:'qte',taps:1,effortsCompleted:0,effortElapsed:.16}],
        ['TRAPPE + POD ARRACHÉS',{breached:true,podDestroyed:true,podPhase:'destroyed'},null]];
      const results=[];
      for(let i=0;i<poses.length;i++){
        const [label,patch,breach]=poses[i],x=350+i%2*720,y=430+Math.floor(i/2)*510,b={...base,...patch};
        c.fillStyle='#38434a';c.font='bold 24px sans-serif';c.fillText(label,x-240,y-370);
        c.save();c.translate(x,y);c.scale(1.7,1.7);drawInkBossTank(c,images,b,{time:1,breach});c.restore();
        const g=inkBossGeometry(b),p=inkBossPodGeometry(b);results.push({label,muzzle:g.muzzle,pod:p.displayMuzzle,guide:p.guide});
      }
      return results;
    }''')
    page.screenshot(path=str(OUT/'native-bastion-states.png'),full_page=True)
    (OUT/'native-bastion-states.json').write_text(json.dumps({'states':result,'errors':errors},indent=2))
    assert not errors,errors
    print(json.dumps({'passed':True,'output':str(OUT/'native-bastion-states.png')}))
    browser.close()
