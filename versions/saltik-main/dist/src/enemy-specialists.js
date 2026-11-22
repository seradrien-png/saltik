import {rollingLegPose} from './rolling-suspension.js';
import {drawJumpLegStrut} from './jump-leg-pose.js';
import {plantInkWheel} from './ink-leg-support.js';
import {groundedBTDefeatPose,drawNativeKOEyes,clipDefeatedSupport} from './grounded-bt-defeat.js';
import {sampleSupportSurface} from './support-pose.js';
import {wheelRollPhase,drawWheelRoll} from './wheel-roll.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Independent source coordinates measured on the new two-character painting.
const leg=(poly,hub,foot,hinge=480,wheelTop=610)=>({poly,hub,foot,hinge,wheelTop});
export const SPECIALIST_PROFILES={
 striker:{crop:[180,0,740,724],anchor:[550,704],height:700,eyes:[[622,418,33,36],[688,420,28,33]],target:[650,435],
  gun:{pivot:[625,173],muzzle:[859,145],poly:[[583,127],[638,122],[713,119],[782,102],[849,93],[877,113],[884,155],[866,182],[815,193],[718,206],[631,232],[590,213]]},
  slots:[[383,280],[419,281],[383,318],[419,319],[791,299],[824,299],[790,336],[824,336]],
  legs:[leg([[214,477],[264,443],[316,441],[353,463],[351,522],[324,573],[322,651],[300,703],[220,704],[193,658],[196,572]], [261,644,34,54],[264,700]),leg([[400,491],[448,450],[495,452],[533,486],[527,550],[507,608],[506,668],[482,706],[411,705],[382,654],[384,570]], [454,647,34,53],[454,703]),leg([[761,473],[812,454],[857,487],[879,540],[907,604],[908,664],[887,706],[804,705],[775,668],[770,600],[747,532]], [852,647,33,52],[852,700])]},
 longrange:{crop:[1190,0,960,724],anchor:[1667,704],height:700,eyes:[[1810,433,28,33]],target:[1780,452],
  slots:[[1416,236],[1476,239],[1416,291],[1476,294],[1977,249],[2039,253],[1977,305],[2039,308]],
  legs:[leg([[1244,497],[1298,454],[1352,450],[1400,482],[1409,534],[1380,585],[1389,663],[1362,706],[1270,707],[1221,662],[1222,576]], [1322,645,38,54],[1322,704]),leg([[1452,504],[1502,469],[1558,471],[1598,509],[1591,567],[1570,616],[1571,675],[1543,708],[1456,707],[1418,665],[1425,584]], [1503,648,36,52],[1503,704]),leg([[1938,488],[2000,468],[2054,501],[2078,559],[2110,614],[2114,668],[2088,708],[1996,707],[1959,670],[1952,599],[1924,542]], [2042,648,35,53],[2042,704])]}
};
SPECIALIST_PROFILES.striker.arms=[{pivot:[607,529],poly:[[579,513],[623,512],[651,541],[669,574],[675,609],[655,646],[616,648],[587,626],[575,584]]},{pivot:[727,530],poly:[[702,509],[743,508],[767,535],[788,573],[794,611],[778,643],[741,650],[706,631],[693,590]]}];
SPECIALIST_PROFILES.longrange.arms=[{pivot:[1546,477],poly:[[1491,445],[1546,434],[1594,457],[1637,492],[1679,546],[1696,590],[1681,638],[1645,660],[1597,631],[1565,581],[1518,542],[1480,492]]},{pivot:[1790,554],poly:[[1761,530],[1802,529],[1843,562],[1877,602],[1881,640],[1845,670],[1801,660],[1773,628],[1751,578]]}];
const profile=e=>SPECIALIST_PROFILES[e.enemyModel==='longrange'?'longrange':'striker'];
function split(poly,y,lower){const out=[],inside=p=>lower?p[1]>=y:p[1]<=y;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],aa=inside(a),bb=inside(b);if(aa)out.push(a);if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,y]);}}return out;}
function polygon(c,points){c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();}
export const isSpecialist=e=>['rust-striker','black-gold','longrange'].includes(e.enemyModel);
export function specialistGeometry(e,time=0,{camera=0,scale=1}={}){
 const p=profile(e),k=126/p.height*(e.artScale??1)*scale,flip=e.dir===-1?-1:1,x=e.x-camera,y=e.y;
 const dead=e.groundedDefeat,pose=dead?groundedBTDefeatPose(e,time):{settled:0,progress:0},drop=pose.settled*17+(e.supportPose?.heave??0)*(e.artScale??1)*scale;
 const tilt=clamp(e.supportPose?.tilt??0,-.32,.32),co=Math.cos(tilt),si=Math.sin(tilt);
 const point=([px,py])=>{const xx=(px-p.anchor[0])*k*flip,yy=(py-p.anchor[1])*k;return{x:x+xx*co-yy*si,y:y+drop+xx*si+yy*co};};
 const legs=p.legs.map(l=>{const native=point(l.foot),floor=at=>{const v=sampleSupportSurface(e.supportPose,at+camera);return e.supportPose?.surface&&!Number.isFinite(v)?NaN:v??y;},planted=plantInkWheel(native,{k,cos:co,sin:si,floor,orientation:flip,maxOffset:180}),{roll,offset}=planted;return{...l,...planted,suspension:rollingLegPose({...l,roll,offset},k,p.anchor[0],!dead&&e.onGround!==false),stretch:1+offset/(l.wheelTop-l.hinge),spin:wheelRollPhase(e,l.hub,k,flip),contact:point([l.foot[0]+roll,l.foot[1]+offset])};});
 let gun=null;if(p.gun){const pivot=point(p.gun.pivot),target=e.armyAimTarget;let angle=0;if(target&&!dead)angle=clamp(Math.atan2((target.y-pivot.y)/k,(target.x-camera-pivot.x)/(k*flip)),-.65,.65);
 const ca=Math.cos(angle),sa=Math.sin(angle),gunPoint=q=>point([p.gun.pivot[0]+(q[0]-p.gun.pivot[0])*ca-(q[1]-p.gun.pivot[1])*sa,p.gun.pivot[1]+(q[0]-p.gun.pivot[0])*sa+(q[1]-p.gun.pivot[1])*ca]);const muzzle=gunPoint(p.gun.muzzle),base=point(p.gun.pivot),n=Math.hypot(muzzle.x-base.x,muzzle.y-base.y)||1;gun={...p.gun,angle,muzzle,direction:{x:(muzzle.x-base.x)/n,y:(muzzle.y-base.y)/n}};}
 const arms=p.arms.map(arm=>{let angle=0;if(dead)for(let i=0;i<35;i++){const co=Math.cos(angle),si=Math.sin(angle),bottom=Math.max(...arm.poly.map(([x,y])=>arm.pivot[1]+(x-arm.pivot[0])*si+(y-arm.pivot[1])*co));if(bottom<=p.anchor[1]-drop/k)break;angle-=.04;}return{...arm,angle};});
 const podSlots=p.slots.map(([px,py],index)=>({index,activeIndex:index<4?index*2:(index-4)*2+1,muzzle:point([px,py]),base:point([px-8,py+28]),axis:{x:flip*.22,y:-.975},rx:16,ry:18,k}));
 const [sx,sy,sw,sh]=p.crop,corners=[[sx,sy],[sx+sw,sy],[sx,sy+sh],[sx+sw,sy+sh]].map(point),xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),target=point(p.target);
 return{p,k,flip,x,y,drop,tilt,pose,point,legs,arms,gun,target,targetY:target.y,muzzle:gun?.muzzle??podSlots[0].muzzle,muzzleDirection:gun?.direction??{x:flip,y:0},podSlots,podSlots8:podSlots,podMuzzles:[podSlots[0].muzzle,podSlots[4].muzzle],podDirections:[podSlots[0].axis,podSlots[4].axis],bounds:{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}};
}
export function drawSpecialist(c,image,e,{camera=0,time=0}={}){
 if(!image)return;const g=specialistGeometry(e,time,{camera}),{p,k,flip}=g,draw=()=>c.drawImage(image,...p.crop,...p.crop);
 c.save();if(e.groundedDefeat)clipDefeatedSupport(c,e,{camera});c.translate(g.x,g.y+g.drop);c.rotate(g.tilt);c.scale(k*flip,k);c.translate(-p.anchor[0],-p.anchor[1]);
 c.save();c.beginPath();c.rect(...p.crop);for(const l of g.legs)polygon(c,l.poly);for(const arm of g.arms)polygon(c,arm.poly);if(g.gun)polygon(c,g.gun.poly);c.clip('evenodd');draw();c.restore();
 for(const l of g.legs){drawJumpLegStrut(c,l,split(l.poly,l.wheelTop,false),draw,false);c.save();c.translate(l.roll,l.offset);c.beginPath();polygon(c,split(l.poly,l.wheelTop,true));c.clip();draw();drawWheelRoll(c,l,{disabled:e.groundedDefeat});c.restore();}
 if(g.gun){c.save();c.translate(...g.gun.pivot);c.rotate(g.gun.angle);c.translate(-g.gun.pivot[0],-g.gun.pivot[1]);c.beginPath();polygon(c,g.gun.poly);c.clip();draw();c.restore();}
 for(const arm of g.arms){c.save();c.translate(...arm.pivot);c.rotate(arm.angle);c.translate(-arm.pivot[0],-arm.pivot[1]);c.beginPath();polygon(c,arm.poly);c.clip();draw();c.restore();}
 for(const [i,[px,py]]of p.slots.entries())if(e.armyPodSpent?.[i]||e.longrangeSpent?.[i]){c.fillStyle='#14181b';c.beginPath();c.ellipse(px,py,15,18,0,0,Math.PI*2);c.fill();c.strokeStyle='#575d60';c.lineWidth=2;c.stroke();}
 if(e.groundedDefeat)drawNativeKOEyes(c,p.eyes,{progress:g.pose.progress});
 c.restore();return g;
}
