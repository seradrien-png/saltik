// The reference waterfall is one continuous painting, not independent columns.
export const BRIDGE_WATER_BOUNDS=[810,300,670,580];
const TIERS=[[1320,330,130,85],[1150,412,280,145],[980,558,400,245]];
const mod=(n,d)=>((n%d)+d)%d;
export function bridgeWaterMask(pixels,width,height){
 const blue=new Uint8Array(width*height),mask=new Uint8Array(width*height);
 for(let p=0;p<blue.length;p++){const i=p*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];blue[p]=pixels[i+3]>240&&g>70&&b>140&&g>r*1.18&&b>g*1.04?1:0;}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x,i=p*4;mask[p]=blue[p];if(mask[p]||pixels[i+3]<=240)continue;
  const r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(r<160||g<185||b<190||Math.max(r,g,b)-Math.min(r,g,b)>65)continue;
  // Only foam touching cool water qualifies; isolated clouds and pale cloth do not.
  for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[-3,0],[3,0],[0,-3],[0,3]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height&&blue[yy*width+xx]){mask[p]=1;break;}}
 }return mask;
}
export function bridgeWaterBands(time=0){
 const [x,y,w,h]=BRIDGE_WATER_BOUNDS,out=[];
 for(let at=0;at<h;at+=6){const size=Math.min(6,h-at),shift=Math.sin(time*1.5-at*.027)*1.15;out.push({sx:x+1+Math.sin(time*.9+at*.03)*.3,sy:Math.max(y,Math.min(y+h-size,y+at+shift)),sw:w-2,sh:size,dx:x+1,dy:y+at,dw:w-2,dh:size});}
 return out;
}
export function bridgeWaterVeils(time=0){
 return [0,.5].map(offset=>{const phase=mod(time*.7+offset,1);return{dy:phase*14,alpha:(1-Math.abs(phase*2-1))*.22};});
}
// Advect the original blue texture as a single sheet. Crossfading two
// full-width passes removes the wrap seam without independently sliding strips.
// At the bridge's screen scale the old 1px refraction was effectively still.
export function bridgeWaterFlow(time=0){
 return [0,.5].map(offset=>{const phase=mod(time*52/80+offset,1);return{dy:phase*80,alpha:(1-Math.abs(phase*2-1))*.78};});
}
export function bridgeWaterThreads(time=0){
 return TIERS.flatMap(([x,y,w,h],tier)=>Array.from({length:Math.ceil(w/18)},(_,i)=>{const length=9+(i%5)*3,travel=mod(time*(65+tier*55)+i*(h+length)*.618,h+length),phase=travel/(h+length);return{tier,x:x+w*(i+.5)/Math.ceil(w/18)+Math.sin(travel*.025+i)*.65,y:y+travel-length,length,alpha:Math.sin(phase*Math.PI)*(.14+(i%3)*.055)};}));
}
export function bridgeWaterMist(time=0){
 return TIERS.flatMap(([x,y,w,h],tier)=>Array.from({length:6},(_,i)=>{const phase=mod(time*.24+i*.173+tier*.2,1);return{tier,x:x+w*(.15+i*.12)+Math.sin(time*.4+i)*3,y:y+h-3-phase*12,rx:Math.min(22,w*.055)*(.65+phase),ry:3+phase*7,alpha:Math.sin(phase*Math.PI)*.18};}));
}
const cache=new WeakMap();
function bridgeMaterial(image){
 if(typeof document==='undefined'||!image.width)return null;
 if(cache.has(image))return cache.get(image);
 const [x,y,w,h]=BRIDGE_WATER_BOUNDS,texture=document.createElement('canvas');texture.width=w;texture.height=h;
 const c=texture.getContext('2d',{willReadFrequently:true});c.drawImage(image,x,y,w,h,0,0,w,h);const data=c.getImageData(0,0,w,h),mask=bridgeWaterMask(data.data,w,h);
 for(let p=0;p<mask.length;p++)data.data[p*4+3]=mask[p]?255:0;c.putImageData(data,0,0);
 const layer=document.createElement('canvas');layer.width=w;layer.height=h;const material={texture,layer,context:layer.getContext('2d')};cache.set(image,material);return material;
}
function paintBridgeWater(c,image,material,time,mist){
 const [bx,by]=BRIDGE_WATER_BOUNDS;
 c.globalAlpha=.48;for(const b of bridgeWaterBands(time))c.drawImage(material?.texture??image,b.sx-(material?bx:0),b.sy-(material?by:0),b.sw,b.sh,b.dx,b.dy,b.dw,b.dh);
 if(material)for(const v of bridgeWaterFlow(time)){c.globalAlpha=v.alpha;c.drawImage(material.texture,bx,by+v.dy);}
 c.strokeStyle='#d9fcff';c.lineCap='round';
 for(const p of bridgeWaterThreads(time)){const [tx,ty,tw,th]=TIERS[p.tier];c.save();c.beginPath();c.rect(tx,ty,tw,th);c.clip();c.globalAlpha=p.alpha;c.lineWidth=.65+(p.tier*.12);c.beginPath();c.moveTo(p.x,p.y-p.length);c.quadraticCurveTo(p.x+.4,p.y-p.length*.5,p.x,p.y);c.stroke();c.restore();}
 if(mist)for(const p of bridgeWaterMist(time)){c.save();c.translate(p.x,p.y);c.scale(p.rx,p.ry);const g=c.createRadialGradient(0,0,0,0,0,1);if(g?.addColorStop){g.addColorStop(0,'#e6faff');g.addColorStop(1,'#d1f6ff00');c.globalAlpha=p.alpha;c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();}c.restore();}
 // Fine expanding foam at the three actual landings, inside native water only.
 for(const [i,[tx,ty,tw,th]]of TIERS.entries())for(let j=0;j<3;j++){const phase=mod(time*.5+j/3+i*.2,1);c.globalAlpha=Math.sin(phase*Math.PI)*.15;c.lineWidth=.65;c.beginPath();c.ellipse(tx+tw*(.3+j*.2),ty+th-4,3+phase*11,.7+phase*1.2,0,0,Math.PI*2);c.stroke();}

}
export function drawRoyalBridgeWater(c,image,{x=0,y=0,scale=1,scaleY=scale,time=0,sourceCrop=null,mist=true}={}){
 if(!image)return;const [bx,by,bw,bh]=BRIDGE_WATER_BOUNDS;
 if(sourceCrop&&(sourceCrop[0]>=bx+bw||sourceCrop[0]+sourceCrop[2]<=bx||sourceCrop[1]>=by+bh||sourceCrop[1]+sourceCrop[3]<=by))return;
 const material=bridgeMaterial(image);
 c.save();c.globalAlpha=1;c.translate(x,y);c.scale(scale,scaleY);c.beginPath();c.rect(bx,by,bw,bh);c.clip();if(sourceCrop){c.beginPath();c.rect(...sourceCrop);c.clip();}
 if(material){
  // Rasterize the animated liquid once on a small reusable surface. One alpha
  // mask composite replaces an expensive complex-path clip on every ribbon.
  const layer=material.context;layer.save();layer.setTransform(1,0,0,1,0,0);layer.clearRect(0,0,bw,bh);layer.translate(-bx,-by);paintBridgeWater(layer,image,material,time,mist);
  layer.setTransform(1,0,0,1,0,0);layer.globalAlpha=1;layer.globalCompositeOperation='destination-in';layer.drawImage(material.texture,0,0);layer.restore();c.drawImage(material.layer,bx,by);
 }else paintBridgeWater(c,image,null,time,mist);
 c.restore();
}
