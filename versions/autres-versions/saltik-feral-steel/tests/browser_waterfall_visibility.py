"""Compare actual waterfall pixels at phone scale against the prior shimmer."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess,json,base64

OUT=Path('/tmp/feral-waterfall-visibility');OUT.mkdir(exist_ok=True)
BASELINE='35bc65334a4af09d10bb99d446bb6cd19330e986'
old=subprocess.check_output(['git','show',BASELINE+':src/background-motion.js'],text=True)
PROBE="""async oldSource=>{
 const current=await import('./src/background-motion.js');
 const old=await import(URL.createObjectURL(new Blob([oldSource],{type:'application/javascript'})));
 const image=new Image();image.src='./assets/canyon.webp';await image.decode();
 const width=844,height=Math.round(941*width/1672),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 function frame(fn,time){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,width,height);c.drawImage(image,0,0,width,height);fn(c,image,{x:0,y:0,w:width,h:height,time,sourceHeight:image.height});return c.getImageData(0,0,width,height).data;}
 function diff(a,b,r){const x=Math.round(r[0]*width/1672),y=Math.round(r[1]*height/941),w=Math.round(r[2]*width/1672),h=Math.round(r[3]*height/941);let sum=0,changed=0,n=0;
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=(yy*width+xx)*4;let peak=0;for(let k=0;k<3;k++){const d=Math.abs(a[i+k]-b[i+k]);sum+=d;peak=Math.max(peak,d);}changed+=peak>=8;n++;}return{mean:sum/(n*3),changedFraction:changed/n};}
 const before=frame(old.drawCanyonMotion,1),after=frame(old.drawCanyonMotion,1.15),nowA=frame(current.drawCanyonMotion,1),nowB=frame(current.drawCanyonMotion,1.15);
 const regions=[[904,353,54,94],[978,509,72,106],[939,678,61,57]];
 const comparison=regions.map(region=>({region,old:diff(before,after,region),current:diff(nowA,nowB,region)}));
 const stone=diff(nowA,nowB,[780,190,70,70]);
 // A short capture of the actual renderer, enlarged only for inspection.
 const demo=document.createElement('canvas');demo.width=768;demo.height=600;const dc=demo.getContext('2d');
 const frames=[];
 for(let i=0;i<36;i++){dc.setTransform(2.5,0,0,2.5,-850*2.5,-330*2.5);dc.drawImage(image,0,0);current.drawCanyonMotion(dc,image,{x:0,y:0,w:image.width,h:image.height,time:i/12,sourceHeight:image.height});frames.push(demo.toDataURL('image/png').split(',')[1]);}
 return{comparison,stone,frames};
}"""
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':844,'height':390});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:4173',wait_until='networkidle');result=page.evaluate(PROBE,old)
 frames=result.pop('frames');folder=OUT/'frames';folder.mkdir(exist_ok=True)
 for i,frame in enumerate(frames):(folder/f'{i:04d}.png').write_bytes(base64.b64decode(frame))
 subprocess.run(['ffmpeg','-y','-v','error','-framerate','12','-i',str(folder/'%04d.png'),'-c:v','libvpx-vp9','-b:v','0','-crf','28','-pix_fmt','yuv420p','/workspace/deliverables/Cascades-animees.webm'],check=True)
 for r in result['comparison']:
  assert r['current']['mean']>3 and r['current']['changedFraction']>.25,r
  assert r['current']['mean']>r['old']['mean']*2.5,r
 assert result['stone']['mean']==0 and not errors,(result['stone'],errors)
 result.update(phoneScale=[844,475],pageErrors=errors);(OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result));b.close()
