// Water-only registrations in the original paintings, including every tier
// under the bridges and the waterwheel's steps and lower pool.
export const ROYAL_WATERFALLS=Object.freeze({
 backdrop:[[814,291,24,43],[1506,175,25,78],[934,553,60,101],[1040,598,30,48],[1311,583,49,49],[909,699,207,63],[917,796,154,73]],
 bridge:[[1341,345,31,52],[1280,407,54,79],[1200,444,43,82],[1110,482,53,64],[1030,552,70,98],[1105,593,113,155],[1239,592,42,91]],
 organic:[[1109,52,44,39],[1052,122,50,42],[1024,176,42,72],[1006,245,27,35],[1128,399,55,43]]
});
const clamp=n=>Math.max(0,Math.min(1,n));
const mod=(n,d)=>((n%d)+d)%d;
export function waterfallRibbons(zone,time=0){
 const [x,y,w,h]=zone,bands=[];
 for(let at=2;at<h-4;at+=6){
  const size=Math.min(6,h-3-at),wave=Math.sin(at*.19-time*5.5)*2.2;
  bands.push({sx:x+2,sy:Math.max(y+1,Math.min(y+h-size-1,y+at-wave)),sw:w-4,sh:size,dx:x+2,dy:y+at,dw:w-4,dh:size});
 }
 return bands;
}
export function waterfallStreaks(zone,time=0){
 const [x,,w,h]=zone,count=Math.max(4,Math.min(14,Math.ceil(w/13))),length=Math.min(30,Math.max(7,h*.2)),speed=Math.max(18,h*.6);
 return Array.from({length:count*2},(_,i)=>({x:x+3+(i%count+.4)/(count+.2)*(w-6),head:mod(time*speed+i*(h+length)*.618,h+length),length,alpha:.32+.38*((i%3)/2)}));
}
const masks=new WeakMap();
function nativeWaterPath(image,zone){
 if(typeof document==='undefined'||typeof Path2D==='undefined'||!image.width)return null;
 let cache=masks.get(image);if(!cache){cache=new Map();masks.set(image,cache);}const key=zone.join(',');if(cache.has(key))return cache.get(key);
 const [x,y,w,h]=zone,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,x,y,w,h,0,0,w,h);const pixels=c.getImageData(0,0,w,h).data,path=new Path2D();
 // Read once when this painting first appears. Blue-water runs exclude the
 // gold rails, velvet, foliage and white clouds even inside a broad fall box.
 for(let yy=0;yy<h;yy+=2){let start=-1;for(let xx=0;xx<=w+1;xx+=2){const i=(Math.min(h-1,yy+1)*w+Math.min(w-1,xx+1))*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2],water=xx<w&&pixels[i+3]>100&&g>70&&b>140&&g>r*1.18&&b>g*1.04;
  if(water&&start<0)start=xx;if(!water&&start>=0){path.rect(x+start,y+yy,Math.min(xx,w)-start,Math.min(2,h-yy));start=-1;}
 }}
 cache.set(key,path);return path;
}
export function drawRoyalWaterfalls(c,image,kind,{x=0,y=0,scale=1,scaleY=scale,time=0,sourceCrop=null}={}){
 if(!image)return;
 const zones=(ROYAL_WATERFALLS[kind]??[]).filter(([zx,zy,w,h])=>!sourceCrop||(zx<sourceCrop[0]+sourceCrop[2]&&zx+w>sourceCrop[0]&&zy<sourceCrop[1]+sourceCrop[3]&&zy+h>sourceCrop[1]));
 if(!zones.length)return;
 c.save();c.globalAlpha=1;c.translate(x,y);c.scale(scale,scaleY);
 if(sourceCrop){c.beginPath();c.rect(...sourceCrop);c.clip();}
 for(const zone of zones){
  const [zx,zy,w,h]=zone;c.save();c.beginPath();c.rect(zx,zy,w,h);c.clip();const mask=nativeWaterPath(image,zone);if(mask)c.clip(mask);
  for(const b of waterfallRibbons(zone,time))c.drawImage(image,b.sx,b.sy,b.sw,b.sh,b.dx,b.dy,b.dw,b.dh);
  c.lineCap='round';c.strokeStyle='#e2ffff';c.lineWidth=Math.max(.7,Math.min(1.8,w/75));
  for(const s of waterfallStreaks(zone,time)){c.globalAlpha=s.alpha;c.beginPath();c.moveTo(s.x,zy+s.head-s.length);c.quadraticCurveTo(s.x+.7,zy+s.head-s.length*.5,s.x,zy+s.head);c.stroke();}
  // Small moving foam highlights remain in the painted water at each base.
  c.globalAlpha=.5;for(let i=0;i<2;i++){const phase=mod(time*.8+i*.5,1);c.beginPath();c.ellipse(zx+w*(.35+i*.3),zy+h-4,2+phase*Math.min(10,w*.08),.6+phase*1.1,0,0,Math.PI*2);c.stroke();}
  c.restore();
 }
 c.restore();
}
