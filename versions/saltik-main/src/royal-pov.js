import {drawInkEnemy} from './ink-actors.js';
import {projectRoyalPovPoint} from './royal-pov-combat.js';
// Independent painted depth planes converge on a distant gate. Every moving
// element uses simulation time, including the mounted combat and descent.
const cloudCache=new WeakMap();
function paintedCloud(image){
 if(!image||typeof document==='undefined')return null;
 if(cloudCache.has(image))return cloudCache.get(image);
 const tile=document.createElement('canvas');tile.width=640;tile.height=240;const q=tile.getContext('2d');
 // Preserve a native painted cloud bank; feather only its outer sky margin.
 q.drawImage(image,image.width*.42,image.height*.065,image.width*.2,image.height*.13,0,0,640,240);
 q.globalCompositeOperation='destination-in';q.translate(320,120);q.scale(1,.375);const mask=q.createRadialGradient(0,0,40,0,0,320);mask.addColorStop(0,'#fff');mask.addColorStop(.5,'#fff');mask.addColorStop(1,'#fff0');q.fillStyle=mask;q.fillRect(-320,-320,640,640);cloudCache.set(image,tile);return tile;
}
export function royalPovDepth(index,travel=0){return ((index*.173+travel*.38)%1+1)%1;}
const landingCache=new WeakMap();
function paintedLanding(image){
 if(typeof document==='undefined')return image;if(landingCache.has(image))return landingCache.get(image);
 const tile=document.createElement('canvas');tile.width=960;tile.height=480;const c=tile.getContext('2d');c.drawImage(image,0,image.height*.46,image.width,image.height*.54,0,0,960,480);
 c.globalCompositeOperation='destination-in';const edge=c.createLinearGradient(0,0,0,100);edge.addColorStop(0,'#fff0');edge.addColorStop(.85,'#fff');c.fillStyle=edge;c.fillRect(0,0,960,480);landingCache.set(image,tile);return tile;
}
export function drawRoyalPov(c,images,{width:w,height:h,time=0,travel=0,alpha=1,combat=null,phase='combat',descent=0}={}){
 if(!(alpha>0))return;
 c.save();c.globalAlpha=alpha;
 const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#182752');sky.addColorStop(.48,'#a998bd');sky.addColorStop(.76,'#e9c9b7');sky.addColorStop(1,'#c5b9cb');c.fillStyle=sky;c.fillRect(0,0,w,h);
 const image=images['royal-world'];
 if(image){
  // The painted horizon is one distant plane; nearer cloud banks expand past
  // the camera separately, making forward travel visible in depth.
  const iw=w*(1.03+travel*.09),ih=iw*image.height/image.width;
  c.save();c.globalAlpha=alpha*.8;c.drawImage(image,(w-iw)/2,h*.48-ih*.45,iw,ih);c.restore();
  const mist=c.createLinearGradient(0,h*.52,0,h);mist.addColorStop(0,'#d5c1d300');mist.addColorStop(.5,'#c9b5d3dd');mist.addColorStop(1,'#bca9ce');c.fillStyle=mist;c.fillRect(0,h*.52,w,h*.48);
 }
 // The painted rainbow remains the single coherent distant arch.
 const gateScale=1+travel*.32,gx=w*.51,gy=h*.43,gw=w*.14*gateScale,gh=gw*2/3;
 const vista=images['desert-red-vista'],gate=images['hd-lunar-gate'];
 if(gate){c.save();c.shadowColor='#ffe2a588';c.shadowBlur=h*.014;c.drawImage(gate,gx-gw/2,gy-gh,gw,gh);c.restore();}
 if(vista){
  c.save();c.beginPath();c.ellipse(gx,gy-gh*.68,gw*.16,gh*.25,0,0,Math.PI*2);c.clip();
  c.drawImage(vista,gx-gw*.22,gy-gh*.96,gw*.44,gh*.57);c.restore();
 }
 // During the final descent the next landscape rises out of the cloud bank
 // and grows beneath the same mounted viewpoint; no cut to a separate scene.
 if(descent>0&&vista){
  const d=Math.min(1,descent),landW=w*(1.2+d*.65),landH=h*(.36+d*.22);
  c.save();c.globalAlpha=alpha*Math.min(1,d*2);c.drawImage(paintedLanding(vista),(w-landW)/2,h-landH,landW,landH);c.restore();
 }
 // Native embroidered cloud paintings expand past the camera on independent
 // depth planes; their feathered sky margins keep the banks airy.
 const cloud=paintedCloud(image);
 if(cloud)for(let i=0;i<12;i++){
  const z=royalPovDepth(i,travel),side=i%2?1:-1,x=w*.51+side*w*(.13+z*z*.66),y=h*(.48+z*z*.57)-Math.max(0,descent)*h*.14,cw=w*(.1+z*z*.38),ch=cw*.375;
  c.save();c.globalAlpha=alpha*(.12+z*.32);c.drawImage(cloud,x-cw/2,y-ch/2,cw,ch);c.restore();
 }
 if(combat&&!combat.closed&&phase!=='descent')drawPovCombat(c,images,combat,w,h,time);
 if(descent>0){
  const landing=c.createLinearGradient(0,h*.5,0,h);landing.addColorStop(0,'#e9c9b700');landing.addColorStop(1,`rgba(231,201,170,${Math.min(1,descent)*.65})`);c.fillStyle=landing;c.fillRect(0,h*.5,w,h*.5);
 }
 const bob=Math.sin(time*2.2)*h*.006+Math.max(0,descent)*h*.15;
 c.save();c.translate(0,bob);
 const eel=images['royal-eel-pov'];
 if(eel){const ew=w*.68,eh=ew*eel.height/eel.width;c.drawImage(eel,(w-ew)/2,h-eh*.66,ew,eh);}
 else{
  // Perspective velvet ridge fallback, replaced by the approved rear-view art
  // when available. The dorsal seam and crown share the flight's small heave.
  const velvet=c.createLinearGradient(w*.3,0,w*.7,0);velvet.addColorStop(0,'#392b5b');velvet.addColorStop(.35,'#79618d');velvet.addColorStop(.5,'#a68aa1');velvet.addColorStop(.64,'#65507c');velvet.addColorStop(1,'#2a254c');c.fillStyle=velvet;c.beginPath();c.moveTo(w*.16,h*1.1);c.bezierCurveTo(w*.27,h*.78,w*.43,h*.78,w*.465,h*.57);c.quadraticCurveTo(w*.5,h*.51,w*.535,h*.57);c.bezierCurveTo(w*.57,h*.78,w*.73,h*.78,w*.84,h*1.1);c.fill();
  c.strokeStyle='#d6bbca66';c.lineWidth=w*.004;c.beginPath();c.moveTo(w*.5,h*.59);c.bezierCurveTo(w*.47,h*.74,w*.54,h*.88,w*.5,h*1.1);c.stroke();
  c.fillStyle='#cba45d';c.strokeStyle='#ffe1a2';c.lineWidth=2;c.beginPath();c.moveTo(w*.465,h*.58);c.lineTo(w*.457,h*.52);c.lineTo(w*.484,h*.545);c.lineTo(w*.5,h*.49);c.lineTo(w*.516,h*.545);c.lineTo(w*.543,h*.52);c.lineTo(w*.535,h*.58);c.closePath();c.fill();c.stroke();
 }
 c.restore();c.restore();
}

function drawPovCombat(c,images,s,w,h,time){
 const project=p=>projectRoyalPovPoint(p,w,h),art=images['royal-enemies']??images['ink-enemies'];
 for(const e of [...s.enemies].sort((a,b)=>b.x-a.x)){
  const p=project(e),scale=p.scale*w/1280*1.45;
  if(art)drawInkEnemy(c,art,{...e,x:p.x,y:p.y,scale,artScale:1},{time});
  // Native damage remains visible in the perspective projection.
  if(e.hp<e.maxHp){c.fillStyle='#302d4bc9';c.fillRect(p.x-22*scale,p.y-36*scale,44*scale,3);c.fillStyle='#f5d18d';c.fillRect(p.x-22*scale,p.y-36*scale,44*scale*Math.max(0,e.hp)/e.maxHp,3);}
  const locks=(s.locks??[]).filter(lock=>lock.targetId===e.id).length;
  if(locks){c.save();c.strokeStyle='#b9f4ee';c.lineWidth=1.5;c.strokeRect(p.x-35*scale,p.y-29*scale,70*scale,54*scale);c.fillStyle='#d8fff3';c.font=`${Math.max(10,12*scale)}px sans-serif`;c.fillText(String(locks),p.x+39*scale,p.y-20*scale);c.restore();}
 }
 for(const shot of s.projectiles){
  const p=project(shot),old=project({x:shot.x-shot.vx*.045,y:shot.y-shot.vy*.045});
  c.save();c.strokeStyle=shot.kind==='homing'?'#b9f4ee':shot.btHeavy?'#ffe5ba':shot.kind==='bullet'?'#ffe3a7':'#ecc2fc';c.lineWidth=(shot.kind==='bullet'?2:4)*Math.max(.45,p.scale);c.lineCap='round';c.shadowColor=c.strokeStyle;c.shadowBlur=shot.kind==='bullet'?5:9;
  c.beginPath();c.moveTo(old.x,old.y);c.lineTo(p.x,p.y);c.stroke();
  if(shot.trail?.length>1){c.globalAlpha=.45;c.lineWidth=2;c.beginPath();shot.trail.forEach((q,i)=>{const a=project(q);if(i)c.lineTo(a.x,a.y);else c.moveTo(a.x,a.y);});c.stroke();}c.restore();
 }
 for(const effect of s.effects){
  const p=project(effect),t=1-effect.life/effect.maxLife,r=(effect.type==='explosion'?35:12)*p.scale*(.4+t);
  c.save();c.globalAlpha=1-t;c.strokeStyle=effect.type==='explosion'?'#ffce98':'#fff2bf';c.lineWidth=3;c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4;c.moveTo(p.x+Math.cos(a)*r*.45,p.y+Math.sin(a)*r*.45);c.lineTo(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r);}c.stroke();c.restore();
 }
 const target=s.enemies.filter(e=>e.hp>0).sort((a,b)=>a.x+Math.abs(a.y-460)*.3-b.x-Math.abs(b.y-460)*.3)[0];
 const aim=target?project(target):{x:w*.5,y:h*.42},r=w*.013;
 c.save();c.strokeStyle=target?'#fff0c8d9':'#e8dcf58c';c.lineWidth=1.5;c.beginPath();
 for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){c.moveTo(aim.x+dx*r,aim.y+dy*r*.4);c.lineTo(aim.x+dx*r,aim.y+dy*r);c.lineTo(aim.x+dx*r*.4,aim.y+dy*r);}c.stroke();c.restore();
}
