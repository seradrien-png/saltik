import {jumpLegOffset,jumpLegExtension,jumpLegPose,jumpLegPoint,applyJumpLegPose} from './jump-leg-pose.js';
import {sampleSupportSurface} from './support-pose.js';
import {plantInkWheel} from './ink-leg-support.js';
import {podSlotPresentation} from './ink-pods.js';
const A=[365,706],K=126/689,TAU=Math.PI*2;
const finite=n=>Number.isFinite(n)?n:0,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Coordinates measured on the registered 724px angular Striker reference.
export const MODERN_STRIKER={anchor:A,height:689,
 guns:[{pivot:[375,207],muzzle:[650,156],polygon:[[299,72],[704,72],[704,249],[299,249]]},{pivot:[375,207],muzzle:[556,220],polygon:[[392,216],[454,207],[501,210],[543,202],[565,202],[575,216],[573,233],[558,242],[532,238],[489,241],[435,246],[403,244]]}],
 rockets:[[213,271],[248,271],[213,309],[248,309],[598,295],[627,295],[598,327],[627,327]],
 legs:[{foot:[93,706],hinge:432,wheelTop:582,hub:[86,646,39,50],polygon:[[17,554],[62,468],[108,420],[157,431],[215,466],[208,526],[207,550],[207,724],[0,724],[0,580]]},{foot:[287,706],hinge:445,wheelTop:584,hub:[284,648,41,51],polygon:[[220,523],[270,449],[310,432],[347,443],[393,479],[401,540],[401,724],[207,724],[207,615]]},{foot:[653,695],hinge:457,wheelTop:587,hub:[654,643,31,45],polygon:[[564,452],[600,446],[637,469],[666,505],[702,548],[720,597],[724,724],[585,724],[605,590],[555,562],[543,506]]}],
 arms:[{pivot:[416,529],hand:[451,605],stretchY:552,wristY:575,polygon:[[392,512],[428,510],[449,531],[465,555],[485,565],[500,591],[500,619],[483,639],[449,650],[420,639],[401,622],[399,595],[401,572],[388,547]]},{pivot:[526,529],hand:[555,605],stretchY:552,wristY:575,polygon:[[507,512],[538,510],[554,530],[571,557],[590,570],[602,592],[602,620],[584,639],[550,648],[526,637],[511,618],[510,590],[514,572],[501,548]]}]};
function polygon(c,p){c.moveTo(...p[0]);for(const q of p.slice(1))c.lineTo(...q);c.closePath();}
function split(p,y,lower){const out=[],inside=q=>lower?q[1]>=y:q[1]<=y;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],aa=inside(a),bb=inside(b);if(aa)out.push(a);if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,y]);}}return out;}
function rot(p,pivot,a,dx=0){const x=p[0]-pivot[0],y=p[1]-pivot[1],co=Math.cos(a),si=Math.sin(a);return[pivot[0]+x*co-y*si+dx,pivot[1]+x*si+y*co];}
export function augmentModernGeometry(p,base,{camera=0,time=0,sampleGround}={}){
 const k=K*base.scale,orientation=base.orientation,co=Math.cos(base.tilt),si=Math.sin(base.tilt);
 const nativePoint=([px,py])=>{const x=(px-A[0])*k*orientation,y=(py-A[1])*k;return{x:base.x+x*co-y*si,y:base.y+base.heave+base.bodyDrop+x*si+y*co};};
 const modernArms=MODERN_STRIKER.arms.map((arm,i)=>{let rotation=base.arms[i].rotation,extension=0;const target=p.modernGripTargets?.[i];
  if(target){const pivot=nativePoint(arm.pivot),wx=target.x-camera-pivot.x,wy=target.y-pivot.y,dx=(wx*co+wy*si)/(k*orientation),dy=(-wx*si+wy*co)/k,hx=arm.hand[0]-arm.pivot[0],hy=arm.hand[1]-arm.pivot[1];extension=clamp(Math.sqrt(Math.max(0,dx*dx+dy*dy-hx*hx))-hy,-25,240);rotation=Math.atan2(dy,dx)-Math.atan2(hy+extension,hx);}
  return{...arm,rotation,extension,handPoint:q=>nativePoint(rot([q[0],q[1]+extension],arm.pivot,rotation))};});
 const modernLegs=MODERN_STRIKER.legs.map(part=>{const jumpPose=jumpLegPose(p,part,A[0]),legPoint=q=>nativePoint(jumpLegPoint(jumpPose,q));let offset=base.airborne?(p.jumpLegs?0:-15-base.compression*22):0,roll=base.airborne?0:jumpLegOffset(p,part.foot[0],A[0],k,base.scale),grounded=false;const splay=roll,native=legPoint([part.foot[0]+splay,part.foot[1]]);
  if(!base.airborne){const floor=at=>{const world=at+camera,support=sampleGround?.(world)??sampleSupportSurface(p.supportPose,world);if(p.supportPose?.surface&&!Number.isFinite(support))return NaN;return support??p.supportY??p.y;};({offset,roll,grounded}=plantInkWheel(native,{k,cos:co,sin:si,floor,orientation,maxOffset:220}));roll+=splay;}
  return{...part,jumpPose,offset,roll,grounded,stretch:1+offset/(part.wheelTop-part.hinge),contact:legPoint([part.foot[0]+roll,part.foot[1]+offset]),spin:finite(p.motionDistance)/(part.hub[3]*K)*orientation,strut:split(part.polygon,part.wheelTop,false),wheel:split(part.polygon,part.wheelTop,true)};});
 const modernGuns=MODERN_STRIKER.guns.map((part,i)=>{let rotation=-(base.weaponsLocked?0:clamp(finite(p.cannonElevation),0,1.1)),recoil=-(i?finite(p.muzzle)/.07*4:finite(p.cannonRecoil)*7);if(p.modernAimTarget){const a=nativePoint(part.pivot),wx=p.modernAimTarget.x-camera-a.x,wy=p.modernAimTarget.y-a.y;rotation=Math.atan2((-wx*si+wy*co)/k,(wx*co+wy*si)/(k*orientation))-Math.atan2(part.muzzle[1]-part.pivot[1],part.muzzle[0]-part.pivot[0]);}
  const point=q=>nativePoint(rot(q,part.pivot,rotation,recoil)),muzzle=point(part.muzzle),pivot=point(part.pivot),length=Math.hypot(muzzle.x-pivot.x,muzzle.y-pivot.y)||1;return{...part,rotation,recoil,point,muzzle,direction:{x:(muzzle.x-pivot.x)/length,y:(muzzle.y-pivot.y)/length}};});
 const modernTubes=MODERN_STRIKER.rockets.map((q,i)=>{const muzzle=nativePoint(q),raw=nativePoint([q[0]-15,q[1]+28]);return{muzzle,base:raw,activeIndex:[2,4,7].indexOf(i)};});
 const boundsPoints=[[12,17],[723,17],[723,706],[12,706]].map(nativePoint).concat(modernLegs.map(l=>l.contact),modernGuns.flatMap(g=>g.polygon.map(g.point))),xs=boundsPoints.map(q=>q.x),ys=boundsPoints.map(q=>q.y);
 return{...base,modern:true,nativeK:k,nativePoint,modernArms,modernLegs,modernGuns,modernTubes,cannon:modernGuns[0].muzzle,cannonBase:modernGuns[0].point(modernGuns[0].pivot),cannonAngle:Math.atan2(modernGuns[0].direction.y,modernGuns[0].direction.x),coaxPart:modernGuns[1],coaxPoint:modernGuns[1].point,arm:modernGuns[1].muzzle,armDirection:modernGuns[1].direction,face:nativePoint([496,438]),bounds:{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}};
}
function transform(c,part){c.translate(part.pivot[0]+(part.recoil??0),part.pivot[1]);c.rotate(part.rotation);c.translate(-part.pivot[0],-part.pivot[1]);}
export function drawModernStriker(c,image,p,geo,{time=0}={}){
 const draw=()=>c.drawImage(image,0,0,724,724,0,0,724,724);c.save();c.imageSmoothingEnabled=true;if(p.invulnerable>0&&Math.floor(time*18)%2)c.globalAlpha*=.65;c.translate(geo.x,geo.y+geo.heave+geo.bodyDrop);c.rotate(geo.tilt);c.scale(geo.nativeK*geo.orientation,geo.nativeK);c.translate(-A[0],-A[1]);
 // Rigid tire patches remain planted; only the connecting suspension compresses.
 const drawLeg=()=>{c.save();for(const arm of geo.modernArms){c.beginPath();c.rect(0,0,724,724);polygon(c,arm.polygon);c.clip('evenodd');}draw();c.restore();};
 for(const leg of geo.modernLegs){c.save();applyJumpLegPose(c,leg.jumpPose);c.save();c.translate(0,leg.hinge);c.transform(1,0,leg.roll/(leg.wheelTop-leg.hinge),leg.stretch,0,0);c.translate(0,-leg.hinge);c.beginPath();polygon(c,leg.strut);c.clip();drawLeg();c.restore();c.save();c.translate(leg.roll,leg.offset);c.beginPath();polygon(c,leg.wheel);c.clip();drawLeg();
 /* Original wheel painting stays fixed. */c.restore();c.restore();}
 c.save();c.beginPath();c.rect(0,0,724,540);c.clip();for(const part of [...geo.modernLegs,...geo.modernArms,...geo.modernGuns]){c.beginPath();c.rect(0,0,724,724);polygon(c,part.polygon);c.clip('evenodd');}draw();c.restore();
 for(const [index,gun]of geo.modernGuns.entries()){c.save();transform(c,gun);c.beginPath();polygon(c,gun.polygon);c.clip();if(index===0){c.beginPath();c.rect(0,0,724,724);polygon(c,geo.modernGuns[1].polygon);c.clip('evenodd');}draw();c.restore();}
 for(const arm of geo.modernArms){c.save();transform(c,arm);if(!arm.extension){c.beginPath();polygon(c,arm.polygon);c.clip();draw();}else{for(const [poly,kind]of [[split(arm.polygon,arm.stretchY,false),0],[split(split(arm.polygon,arm.stretchY,true),arm.wristY,false),1],[split(arm.polygon,arm.wristY,true),2]]){c.save();if(kind===1){c.translate(0,arm.stretchY);c.scale(1,1+arm.extension/(arm.wristY-arm.stretchY));c.translate(0,-arm.stretchY);}else if(kind===2)c.translate(0,arm.extension);c.beginPath();polygon(c,poly);c.clip();draw();c.restore();}}c.restore();}
 // Keep all eight physical apertures while retaining the original 3-round balance.
 for(const [i,[x,y]]of MODERN_STRIKER.rockets.entries()){const ammo=i<4?0:i<6?1:2,slot=podSlotPresentation(p,ammo);if(slot.round>=1)continue;c.fillStyle='#171b1a';c.beginPath();c.ellipse(x,y,i<4?11:9,12,0,0,TAU);c.fill();}
 c.restore();return geo;
}
