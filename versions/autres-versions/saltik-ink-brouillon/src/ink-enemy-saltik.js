// Two native cream-and-ink views of the same four-legged enemy. Apertures are
// measured in the 1983 × 793 reference atlas, so drawing and launches share pixels.
// The side cutout faces right; its two raised pods keep their native jointed struts.
export const INK_ENEMY_SALTIK_VIEWS=Object.freeze({
 side:Object.freeze({crop:[55,10,940,770],anchor:[521,772],muzzle:[851,394],gunBase:[720,401],cannon:[744,394],pods:[[358,90],[917,145]],podBases:[[250,100],[802,151]],body:[365,325,393,295],target:[600,550],hand:[713,677],lock:[560,480]}),
 front:Object.freeze({crop:[1084,27,850,753],anchor:[1506,772],muzzle:[1506,420],gunBase:[1506,449],cannon:[1506,386],pods:[[1268,119],[1747,119]],podBases:[[1268,159],[1747,159]],body:[1320,332,370,340],target:[1506,550],hand:[1587,716],lock:[1506,480]})
});
// Keep the cabin comparable to the player's cabin; the raised launchers retain
// their full height instead of squeezing the whole machine into a short box.
const PIXEL_SCALE=70/393;
export const INK_ENEMY_SALTIK_HEIGHT=770*PIXEL_SCALE;
const unit=(a,b)=>{const x=a.x-b.x,y=a.y-b.y,n=Math.hypot(x,y)||1;return{x:x/n,y:y/n};};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function inkEnemySaltikGeometry(e,time=0,{camera=0,scale=1,view='side'}={}){
 const frame=INK_ENEMY_SALTIK_VIEWS[view]??INK_ENEMY_SALTIK_VIEWS.side;
 const k=PIXEL_SCALE*scale,flip=view==='front'?1:e.dir===-1?-1:1;
 const dodging=view==='side'&&e.guardFlash>0&&e.guardResponse==='dodge';
 const effort=dodging?Math.sin(Math.PI*clamp(e.guardFlash/.25)):0;
 const dir=e.dir===1?1:-1,rotation=-.13*effort*dir,offsetX=-dir*7*effort*scale;
 const co=Math.cos(rotation),si=Math.sin(rotation);
 const sourcePoint=([px,py])=>{const x=(px-frame.anchor[0])*k*flip,y=(py-frame.anchor[1])*k;return{x:e.x-camera+offsetX+x*co-y*si,y:e.y+x*si+y*co};};
 const [sx,sy,sw,sh]=frame.crop,corner=sourcePoint([sx,sy]),opposite=sourcePoint([sx+sw,sy+sh]);
 const muzzle=sourcePoint(frame.muzzle),gunBase=sourcePoint(frame.gunBase);
 const podMuzzles=frame.pods.map(sourcePoint),target=sourcePoint(frame.target);
 return{view,frame,crop:frame.crop,anchor:frame.anchor,k,scale,flip,rotation,offsetX,sourcePoint,
  muzzle,muzzleDirection:unit(muzzle,gunBase),cannon:sourcePoint(frame.cannon),podMuzzles,
  podDirections:podMuzzles.map((mouth,i)=>unit(mouth,sourcePoint(frame.podBases[i]))),
  podsOpen:true,target,targetY:target.y,
  bounds:{x:Math.min(corner.x,opposite.x),y:corner.y,w:Math.abs(opposite.x-corner.x),h:sh*k}};
}
export function drawInkEnemySaltik(c,image,e,{camera=0,time=0,scale=1,view='side'}={}){
 if(!image||e.hp<=0)return null;
 const geo=inkEnemySaltikGeometry(e,time,{camera,scale,view});
 const [sx,sy,sw,sh]=geo.crop,[ax,ay]=geo.anchor;
 c.save();c.translate(e.x-camera+geo.offsetX,e.y);c.rotate(geo.rotation);c.scale(geo.flip,1);c.imageSmoothingEnabled=true;
 if(e.hit>0)c.filter='brightness(1.4)';
 c.drawImage(image,sx,sy,sw,sh,(sx-ax)*geo.k,(sy-ay)*geo.k,sw*geo.k,sh*geo.k);
 c.restore();
 if(view==='side')drawDefenseAndLock(c,e,geo,time);
 if(e.firePose>0&&view==='side'){
  c.save();c.translate(geo.muzzle.x,geo.muzzle.y);c.rotate(Math.atan2(geo.muzzleDirection.y,geo.muzzleDirection.x));c.scale(scale*.7,scale*.7);
  c.fillStyle='#f0e3c9';c.strokeStyle='#181815';c.lineWidth=1.7;c.beginPath();c.moveTo(0,-3);c.lineTo(9,-8);c.lineTo(11,-3);c.lineTo(24,0);c.lineTo(11,3);c.lineTo(9,8);c.lineTo(0,3);c.closePath();c.fill();c.stroke();c.restore();
 }
 return geo;
}

function drawDefenseAndLock(c,e,geo,time){
 const scale=geo.scale;
 if(e.guard){
  // A small ink brace sits in front of the existing native hands. Flashing
  // ricochets explain blocked ranged hits without adding another arm.
  const p=geo.sourcePoint(geo.frame.hand),dir=e.dir===1?1:-1;
  c.save();c.strokeStyle='#181815';c.lineWidth=1.8*scale;c.lineCap='round';
  c.beginPath();c.moveTo(p.x-dir*3*scale,p.y-7*scale);c.lineTo(p.x+dir*2*scale,p.y);c.lineTo(p.x-dir*3*scale,p.y+7*scale);c.stroke();
  if(e.guardFlash>0&&e.guardResponse==='deflect'){
   const flash=clamp(e.guardFlash/.25),reach=(8+flash*8)*scale;
   c.lineWidth=2*scale;c.beginPath();
   for(const angle of [-.9,0,.9]){const dx=dir*Math.cos(angle),dy=Math.sin(angle);c.moveTo(p.x+dx*5*scale,p.y+dy*5*scale);c.lineTo(p.x+dx*reach,p.y+dy*reach);}c.stroke();
   c.strokeStyle='#f0e3c9';c.lineWidth=.8*scale;c.beginPath();c.arc(p.x,p.y,5*scale,-1,1);c.stroke();
  }
  c.restore();
 }
 if(e.attackPhase==='lock'){
  const progress=clamp(e.lockProgress??0),center=geo.sourcePoint(geo.frame.lock);
  c.save();const alpha=c.globalAlpha;c.strokeStyle='#181815';c.lineWidth=1.2*scale;c.globalAlpha*=.5;c.setLineDash([3*scale,5*scale]);
  c.beginPath();c.arc(center.x,center.y,46*scale,0,Math.PI*2);c.stroke();c.setLineDash([]);c.globalAlpha=alpha;
  c.lineWidth=2.4*scale;c.beginPath();c.arc(center.x,center.y,46*scale,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
  for(const mouth of geo.podMuzzles){c.beginPath();c.arc(mouth.x,mouth.y,(3+progress*3+Math.sin(time*20)*.4)*scale,0,Math.PI*2);c.stroke();}
  c.restore();
 }
}
