"""Actual native-asset rendering regression; run against a source server with /assets available."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os
OUT=Path('/tmp/royal-bridge-water-flow'); OUT.mkdir(exist_ok=True)
PROBE="""async()=>{
 const water=await import('/src/royal-bridge-water.js');
 const image=new Image();image.src='/assets/royal-quarter-bridge.png';await image.decode();
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 c.drawImage(image,0,0);const native=c.getImageData(0,0,canvas.width,canvas.height).data;
 const [bx,by,bw,bh]=water.BRIDGE_WATER_BOUNDS;
 const crop=c.getImageData(bx,by,bw,bh),mask=water.bridgeWaterMask(crop.data,bw,bh);
 function frame(t){c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(image,0,0);water.drawRoyalBridgeWater(c,image,{time:t});return c.getImageData(0,0,canvas.width,canvas.height).data;}
 const a=frame(0),pngZero=canvas.toDataURL('image/png').split(',')[1],b=frame(.5),paused=frame(.5);let count=0,changed=0,sum=0,outside=0,nativeOutside=0,pause=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const p=y*canvas.width+x,i=p*4,inside=x>=bx&&x<bx+bw&&y>=by&&y<by+bh&&mask[(y-by)*bw+x-bx];let delta=0;
  for(let k=0;k<4;k++){delta=Math.max(delta,Math.abs(a[i+k]-b[i+k]));pause+=b[i+k]!==paused[i+k];}
  if(inside){count++;sum+=delta;changed+=delta>=8;}else{outside+=delta>0;nativeOutside+=[0,1,2,3].some(k=>native[i+k]!==b[i+k]);}
 }
 const small=document.createElement('canvas');small.width=Math.round(canvas.width*.42);small.height=Math.round(canvas.height*.42);const sc=small.getContext('2d',{willReadFrequently:true});
 function reduced(pixels){c.putImageData(new ImageData(pixels,canvas.width,canvas.height),0,0);sc.clearRect(0,0,small.width,small.height);sc.drawImage(canvas,0,0,small.width,small.height);return sc.getImageData(0,0,small.width,small.height).data;}
 const sa=reduced(a),sb=reduced(b);let screenCount=0,screenChanged=0,screenSum=0;
 for(let yy=0;yy<small.height;yy++)for(let xx=0;xx<small.width;xx++){const x=Math.floor(xx/.42)-bx,y=Math.floor(yy/.42)-by;if(x<2||x>=bw-2||y<2||y>=bh-2||!mask[y*bw+x])continue;const i=(yy*small.width+xx)*4,peak=Math.max(...[0,1,2].map(k=>Math.abs(sa[i+k]-sb[i+k])));screenCount++;screenChanged+=peak>=8;screenSum+=peak;}
 c.putImageData(new ImageData(b,canvas.width,canvas.height),0,0);
 return{count,changedFraction:changed/count,meanPeak:sum/count,outside,nativeOutside,pause,screen:{scale:.42,changedFraction:screenChanged/screenCount,meanPeak:screenSum/screenCount},pngZero,png:canvas.toDataURL('image/png').split(',')[1]};
}"""
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page();page.goto(os.environ.get('ROYAL_TEST_URL','http://127.0.0.1:4182/tests/'),wait_until='domcontentloaded')
 result=page.evaluate(PROBE)
 import base64
 (OUT/'frame-zero.png').write_bytes(base64.b64decode(result.pop('pngZero')))
 (OUT/'frame-half-second.png').write_bytes(base64.b64decode(result.pop('png')))
 (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
 assert result['count']>40000,result
 assert result['changedFraction']>.65,result
 assert result['meanPeak']>20,result
 assert result['outside']==0,result
 assert result['nativeOutside']==0,result
 assert result['pause']==0,result
 assert result['screen']['changedFraction']>.5,result
 assert result['screen']['meanPeak']>10,result
 browser.close()
