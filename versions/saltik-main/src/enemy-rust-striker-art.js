// The additional hostile Striker has its own 1254px rust-orange painting.
// Positions below are measured in that source, never in a player costume atlas.
import {sampleSupportSurface} from './support-pose.js';
import {plantInkWheel} from './ink-leg-support.js';
import {drawGroundedBTDefeat} from './grounded-bt-defeat.js';
export const ENEMY_RUST_STRIKER={size:[1254,1254],anchor:[630,1200],height:1180,
 body:[285,400,775,470],target:[832,715],
 guns:[
  {pivot:[798,272],muzzle:[1112,248],polygon:[[786,200],[882,190],[1002,183],[1061,178],[1119,188],[1151,210],[1157,250],[1140,286],[1092,311],[1025,308],[956,324],[846,347],[796,337]]},
  {pivot:[793,366],muzzle:[953,355],polygon:[[771,337],[838,325],[895,322],[941,323],[966,335],[973,358],[961,381],[934,391],[893,386],[819,405],[779,404]]}
 ],
 slots:[[338,445,32,35],[408,447,32,35],[338,521,32,35],[409,524,32,35],[1018,483,28,31],[1079,485,28,31],[1019,551,28,30],[1080,554,28,30]],
 legs:[
  {hinge:760,wheelTop:984,foot:[144,1187],poly:[[58,812],[121,764],[205,761],[286,791],[341,849],[328,916],[300,983],[296,1102],[257,1192],[66,1192],[16,1119],[14,1003],[29,903]]},
  {hinge:790,wheelTop:1010,foot:[474,1200],poly:[[392,808],[473,779],[552,799],[597,846],[620,917],[609,1006],[604,1116],[556,1209],[386,1210],[349,1134],[350,1035],[369,941]]},
  {hinge:785,wheelTop:982,foot:[1119,1178],poly:[[1002,764],[1064,766],[1115,794],[1164,835],[1191,899],[1243,974],[1247,1095],[1212,1178],[1039,1192],[1010,1135],[1016,1031],[1002,951],[980,871]]}
 ]};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
function poly(c,points){c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();}
function split(points,y,lower){const out=[],inside=p=>lower?p[1]>=y:p[1]<=y;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],aa=inside(a),bb=inside(b);if(aa)out.push(a);if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,y]);}}return out;}
const pointBounds=points=>{const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};};
export function enemyRustStrikerGeometry(e,time=0,{camera=0,scale=1}={}){
 const p=ENEMY_RUST_STRIKER,k=126/p.height*scale*(e.artScale??1),flip=e.dir===-1?-1:1,x=finite(e.x)-camera,y=finite(e.y),rotation=clamp(finite(e.supportPose?.tilt),-.32,.32),co=Math.cos(rotation),si=Math.sin(rotation);
 const sourcePoint=([px,py])=>{const xx=(px-p.anchor[0])*k*flip,yy=(py-p.anchor[1])*k;return{x:x+xx*co-yy*si,y:y+xx*si+yy*co};};
 const guns=p.guns.map((gun,index)=>{const pivot=sourcePoint(gun.pivot),target=e.armyAimTarget??e.aimTarget;let angle=0;
  if(target){const dx=target.x-camera-pivot.x,dy=target.y-pivot.y;angle=Math.atan2((-dx*si+dy*co)/k,(dx*co+dy*si)/(k*flip))-Math.atan2(gun.muzzle[1]-gun.pivot[1],gun.muzzle[0]-gun.pivot[0]);angle=clamp(angle,-.7,.7);}
  const recoil=-finite(e.firePose)/.13*(index?4:11),ca=Math.cos(angle),sa=Math.sin(angle),point=([px,py])=>{const dx=px-gun.pivot[0],dy=py-gun.pivot[1];return sourcePoint([gun.pivot[0]+dx*ca-dy*sa+recoil,gun.pivot[1]+dx*sa+dy*ca]);},muzzle=point(gun.muzzle),base=point(gun.pivot),n=Math.hypot(muzzle.x-base.x,muzzle.y-base.y)||1;
  return{...gun,angle,recoil,point,muzzle,direction:{x:(muzzle.x-base.x)/n,y:(muzzle.y-base.y)/n}};
 });
 const legs=p.legs.map(leg=>{const contact=sourcePoint(leg.foot),floor=at=>{const value=sampleSupportSurface(e.supportPose,at+camera);return Number.isFinite(value)?value:y;};const planted=plantInkWheel(contact,{k,cos:co,sin:si,floor,orientation:flip,maxOffset:180});return{...leg,...planted,strut:split(leg.poly,leg.wheelTop,false),wheel:split(leg.poly,leg.wheelTop,true),stretch:1+planted.offset/(leg.wheelTop-leg.hinge),contact:sourcePoint([leg.foot[0]+planted.roll,leg.foot[1]+planted.offset])};});
 const podSlots=p.slots.map(([px,py,rx,ry],index)=>{const muzzle=sourcePoint([px,py]),base=sourcePoint([px-18,py+30]),dx=muzzle.x-base.x,dy=muzzle.y-base.y,n=Math.hypot(dx,dy)||1;return{index,activeIndex:index===0?0:index===4?1:-1,muzzle,base,axis:{x:dx/n,y:dy/n},rx,ry,k};});
 const corners=[[10,20],[1248,20],[1248,1212],[10,1212]].map(sourcePoint),target=sourcePoint(p.target),muzzle=guns[0].muzzle;
 return{x,y,k,flip,rotation,sourcePoint,legs,guns,muzzle,cannon:muzzle,muzzleDirection:guns[0].direction,cannonDirection:guns[0].direction,
  podSlots,podSlots8:podSlots,podMuzzles:[podSlots[0].muzzle,podSlots[4].muzzle],podDirections:[podSlots[0].axis,podSlots[4].axis],target,targetY:target.y,bounds:pointBounds(corners)};
}
export function drawEnemyRustStriker(c,image,e,{camera=0,time=0,scale=1}={}){
 if(!image)return null;
 if(e.groundedDefeat){
  const live={...e,hp:1,groundedDefeat:false,neutralized:false,defeated:false,firePose:0,hit:0,armyPodSpent:Array(8).fill(true),armyReloadProgress:0},frozen=e.defeatStartedAt??time,geo=enemyRustStrikerGeometry(live,frozen,{camera:0,scale});
  return drawGroundedBTDefeat(c,()=>{c.save();c.filter='brightness(.65) saturate(.6)';drawEnemyRustStriker(c,image,live,{camera,time:frozen,scale});c.restore();},e,{camera,time,contacts:geo.legs.map(l=>l.contact)});
 }
 const g=enemyRustStrikerGeometry(e,time,{camera,scale}),p=ENEMY_RUST_STRIKER;
 const dead=e.hp<=0||e.neutralized||e.defeated,elapsed=finite(e.defeatElapsed,finite(e.defeat?.elapsed,finite(e.groundDefeat?.elapsed,1))),fall=dead?clamp(elapsed/.45):0;
 c.save();c.translate(g.x,g.y);if(dead){c.translate(0,-4*scale);c.rotate((g.flip===1?.13:-.13)*fall);c.scale(1,1-fall*.28);}c.rotate(g.rotation);c.scale(g.k*g.flip,g.k);c.translate(-p.anchor[0],-p.anchor[1]);c.imageSmoothingEnabled=true;
 const draw=()=>c.drawImage(image,0,0,...p.size,0,0,...p.size);
 // Preserve the original silhouette, masking only truly moving barrel and leg patches.
 c.save();c.beginPath();c.rect(0,0,...p.size);for(const part of [...g.guns,...g.legs])poly(c,part.polygon??part.poly);c.clip('evenodd');draw();c.restore();
 for(const leg of g.legs){c.save();c.translate(0,leg.hinge);c.transform(1,0,leg.roll/(leg.wheelTop-leg.hinge),leg.stretch,0,0);c.translate(0,-leg.hinge);c.beginPath();poly(c,leg.strut);c.clip();draw();c.restore();c.save();c.translate(leg.roll,leg.offset);c.beginPath();poly(c,leg.wheel);c.clip();draw();c.restore();}
 for(const gun of g.guns){c.save();c.translate(gun.pivot[0]+gun.recoil,gun.pivot[1]);c.rotate(gun.angle);c.translate(-gun.pivot[0],-gun.pivot[1]);c.beginPath();poly(c,gun.polygon);c.clip();draw();c.restore();}
 if(!dead)for(const [index,[px,py,rx,ry]]of p.slots.entries()){
  if(!e.armyPodSpent?.[index])continue;const reload=clamp((finite(e.armyReloadProgress)-.85)/.15);
  c.save();c.translate(px,py);c.fillStyle='#161713';c.beginPath();c.ellipse(0,0,rx*.94,ry*.94,0,0,Math.PI*2);c.fill();c.strokeStyle='#7e4e2e';c.lineWidth=3;c.stroke();
  if(reload>0){c.save();c.beginPath();c.ellipse(0,0,rx*.92,ry*.92,0,0,Math.PI*2);c.clip();c.translate((1-reload)*rx*2,0);c.drawImage(image,px-rx,py-ry,rx*2,ry*2,-rx,-ry,rx*2,ry*2);c.restore();}c.restore();
 }
 c.restore();return g;
}
