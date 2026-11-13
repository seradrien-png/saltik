import {jumpLegOffset,jumpLegExtension} from './jump-leg-pose.js';
import {sampleSupportSurface} from './support-pose.js';
import {plantInkWheel} from './ink-leg-support.js';
import {drawInkEnemyPods,inkEnemyPodGeometry} from './ink-pods.js';
import {inkHitImage} from './ink-hit-cache.js';
import {drawLunarPennants} from './lunar-pennants.js';

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
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;

// Three wheels are visible in the side painting; the fourth remains behind
// the cabin. These masks follow the original leg and small claw outlines.
// Neither elevated launcher strut is an arm.
export const INK_ENEMY_SALTIK_PARTS={
 legs:[
  {id:'rear-far',foot:[116,761],hinge:544,wheelTop:680,hub:[125,719,23,34,.36],polygon:[
   [219,512],[270,507],[303,529],[332,570],[333,599],[309,632],
   [268,674],[211,718],[174,755],[139,770],[91,766],[65,749],
   [57,724],[55,680],[72,638],[103,590],[147,547],[186,524],
  ]},
  {id:'rear-near',foot:[349,773],hinge:574,wheelTop:689,hub:[365,730,20,33,.34],polygon:[
   [386,538],[432,535],[470,549],[490,570],[500,600],[484,634],
   [459,677],[436,723],[411,760],[382,780],[316,782],[297,775],
   [283,741],[281,707],[283,674],[299,628],[326,582],[357,552],
  ]},
  {id:'front',foot:[913,767],hinge:574,wheelTop:698,hub:[888,726,24,33,-.4],polygon:[
   [754,540],[781,537],[814,555],[853,571],[896,613],[931,660],
   [956,702],[955,743],[937,773],[901,780],[881,780],[861,775],
   [845,762],[832,745],[823,727],[817,710],[799,705],[776,682],[755,652],[743,615],[741,577],
  ]},
 ],
 arms:[
  {id:'far-hand',pivot:[676,634],polygon:[[657,614],[683,617],[700,631],[707,647],[729,652],[740,670],[736,689],[722,704],[704,704],[689,690],[684,670],[667,659],[655,641]]},
  {id:'near-hand',pivot:[529,636],polygon:[[509,615],[537,617],[554,636],[566,650],[595,657],[621,673],[648,697],[651,719],[640,742],[618,750],[596,737],[574,735],[561,719],[553,696],[530,687],[514,671],[505,643]]},
 ],
 cannon:{id:'main-cannon',pivot:[720,401],muzzle:[851,394],polygon:[
  [618,365],[645,367],[672,376],[802,372],[825,367],[851,365],
  [870,377],[880,395],[875,417],[859,430],[830,433],[810,425],
  [691,425],[673,432],[648,437],[624,433],[613,413],[611,389],
 ]},
};

function splitAtY(points,y,lower){
 const result=[],inside=point=>lower?point[1]>=y:point[1]<=y;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);
  if(ai)result.push(a);
  if(ai!==bi){const t=(y-a[1])/(b[1]-a[1]);result.push([a[0]+(b[0]-a[0])*t,y]);}
 }
 return result;
}
for(const leg of INK_ENEMY_SALTIK_PARTS.legs){
 leg.strutPolygon=splitAtY(leg.polygon,leg.wheelTop,false);
 leg.wheelPolygon=splitAtY(leg.polygon,leg.wheelTop,true);
}
function rotatePoint(point,pivot,angle,offsetX=0){
 const x=point[0]+offsetX-pivot[0],y=point[1]-pivot[1],co=Math.cos(angle),si=Math.sin(angle);
 return[pivot[0]+x*co-y*si,pivot[1]+x*si+y*co];
}

export function inkEnemySaltikGeometry(e,time=0,{camera=0,scale=1,view='side'}={}){
 view=view==='front'?'front':'side';scale=Math.max(.01,finite(scale,1))*(e.artScale??1);
 const frame=INK_ENEMY_SALTIK_VIEWS[view]??INK_ENEMY_SALTIK_VIEWS.side;
 const k=PIXEL_SCALE*scale,flip=view==='front'?1:e.dir===-1?-1:1;
 const dodging=view==='side'&&e.guardFlash>0&&e.guardResponse==='dodge';
 const effort=dodging?Math.sin(Math.PI*clamp(e.guardFlash/.25)):0;
 const airborne=e.onGround===false,walking=!airborne&&view==='side'&&Math.abs(finite(e.vx))>5;
 const distance=finite(e.motionDistance,walking?time*finite(e.vx):0),phase=distance/11;
 const x=finite(e.x)-camera,y=finite(e.y),dir=e.dir===1?1:-1;
 const back=sampleSupportSurface(e.supportPose,finite(e.x)-50),front=sampleSupportSurface(e.supportPose,finite(e.x)+50);
 const slope=Number.isFinite(back)&&Number.isFinite(front)?Math.atan2(front-back,100):finite(e.supportPose?.tilt);
 const rotation=view==='side'?clamp(slope+finite(e.motionLean)-.13*effort*dir,-.34,.34):0;
 const offsetX=-dir*7*effort*scale;
 const heave=view==='side'?finite(e.supportPose?.heave)*scale:0;
 const bodyDrop=(walking?Math.sin(phase*2)*.65*scale:0)+(e.bt&&e.crouching?12*scale:0);
 const co=Math.cos(rotation),si=Math.sin(rotation);
 const sourcePoint=([px,py])=>{const xx=(px-frame.anchor[0])*k*flip,yy=(py-frame.anchor[1])*k;return{x:x+offsetX+xx*co-yy*si,y:y+heave+bodyDrop+xx*si+yy*co};};
 const legs=view==='front'?[]:INK_ENEMY_SALTIK_PARTS.legs.map((part,index)=>{
  const stride=walking?Math.sin(phase+(index===1?Math.PI:0))*10:0;
  const splay=jumpLegOffset(e,part.foot[0],frame.anchor[0],k,scale);
  const native=sourcePoint([part.foot[0]+stride+splay,part.foot[1]]);
  const lift=walking?Math.max(0,Math.sin(phase+(index===1?Math.PI:0)))*1.8*scale:0;
  let offset=airborne?(e.jumpLegs?jumpLegExtension(e,k,scale):-15):0,roll=stride+splay,grounded=false;
  // With no terrain supplied, leave the resting native leg exactly in place.
  // The duel masks these same pixels before drawing its held leg and hands.
  if(!airborne&&e.supportPose){
   const floor=at=>{const support=sampleSupportSurface(e.supportPose,finite(e.x)+(at-x)/scale);return Number.isFinite(support)?y+(support-y)*scale:NaN;};
   const planted=plantInkWheel(native,{k,cos:co,sin:si,floor,orientation:flip,maxOffset:140});
   offset=planted.offset;roll+=planted.roll;grounded=planted.grounded&&lift<.001;
  }
  offset-=lift/(k*co);
  return{...part,offset,roll,lift,grounded,stretch:1+offset/(part.wheelTop-part.hinge),
   spin:distance/(part.hub[3]*PIXEL_SCALE)*flip,
   contact:sourcePoint([part.foot[0]+roll,part.foot[1]+offset])};
 });
 const recoil=view==='side'?clamp(finite(e.cannonRecoil,finite(e.firePose)/.14)):0;
 const cannonPart={...INK_ENEMY_SALTIK_PARTS.cannon,offsetX:-22*recoil,rotation:view==='side'?-clamp(finite(e.cannonElevation),-.12,.18):0};
 const arms=view==='front'?[]:INK_ENEMY_SALTIK_PARTS.arms.map((part,index)=>({...part,
  rotation:walking?Math.sin(phase*.5+(index?Math.PI:0))*.035:0}));
 if(e.btAimTarget&&view==='side'){
  const pivot=sourcePoint(cannonPart.pivot),dx=e.btAimTarget.x-camera-pivot.x,dy=e.btAimTarget.y-pivot.y;
  cannonPart.rotation=Math.atan2((-dx*si+dy*co)/k,(dx*co+dy*si)/(k*flip))-Math.atan2(frame.muzzle[1]-cannonPart.pivot[1],frame.muzzle[0]-cannonPart.pivot[0]);
 }
 for(const [i,arm] of arms.entries())if(e.btGripTargets?.[i]){
  const target=e.btGripTargets[i],pivot=sourcePoint(arm.pivot),dx=target.x-camera-pivot.x,dy=target.y-pivot.y;
  const xx=(dx*co+dy*si)/(k*flip),yy=(-dx*si+dy*co)/k;
  const hand=i?[617,719]:[721,684],hx=hand[0]-arm.pivot[0],hy=hand[1]-arm.pivot[1];
  arm.btExtension=Math.max(-10,Math.min(400,Math.sqrt(Math.max(0,xx*xx+yy*yy-hx*hx))-hy));arm.btStretchY=arm.pivot[1]+12;arm.btWristY=i?690:654;
  arm.rotation=Math.atan2(yy,xx)-Math.atan2(hy+arm.btExtension,hx);
 }
 const cannonPoint=point=>sourcePoint(rotatePoint(point,cannonPart.pivot,cannonPart.rotation,cannonPart.offsetX));
 const muzzle=view==='side'?cannonPoint(frame.muzzle):sourcePoint(frame.muzzle);
 const gunBase=view==='side'?cannonPoint(frame.gunBase):sourcePoint(frame.gunBase);
 const raised=clamp(finite(e.podRaise)),deployment=raised*raised*(3-2*raised);
 const podParts=view==='front'?[]:[
  {id:'left-pod',pivot:[262,323],polygon:[[183,15],[407,10],[463,42],[473,135],[429,167],[338,156],[305,223],[282,285],[290,338],[248,350],[217,321],[236,279],[264,204],[280,151],[197,134],[176,86]]},
  {id:'right-pod',pivot:[775,346],polygon:[[775,42],[970,60],[994,89],[991,196],[940,221],[846,198],[828,267],[806,314],[802,357],[759,368],[738,336],[758,291],[785,223],[805,190],[769,158],[758,96]]},
 ].map((part,index)=>({...part,rotation:(index?-.045:.045)*deployment,offsetX:0}));
 if(e.bt)for(const [i,part] of podParts.entries()){
  const target=e.bt.aimPoints?.[i%e.bt.aimPoints.length];
  if(e.bt.panicFlash>0)part.rotation=(i?1:-1)*.25*Math.min(1,e.bt.panicFlash/.2);
  else if(e.bt.locking&&target){const pivot=sourcePoint(part.pivot),dx=target.x-camera-pivot.x,dy=target.y-pivot.y;part.rotation=Math.max(-.7,Math.min(.7,Math.atan2((-dx*si+dy*co)/k,(dx*co+dy*si)/(k*flip))-Math.atan2(-50,28)));}
 }
 const podSourcePoint=(point,index)=>{const part=podParts[index];return sourcePoint(part?rotatePoint(point,part.pivot,part.rotation):point);};
 const podSlots=view==='side'||e.bt?inkEnemyPodGeometry(e,{view,sourcePoint,podSourcePoint,k,rotation}):[];
 const activePods=podSlots.filter(slot=>slot.activeIndex>=0);
 const podMuzzles=view==='side'?activePods.map(slot=>slot.muzzle):frame.pods.map(sourcePoint),target=sourcePoint(frame.target);
 const podDirections=view==='side'?activePods.map(slot=>slot.axis):podMuzzles.map((mouth,i)=>unit(mouth,sourcePoint(frame.podBases[i])));
 const [sx,sy,sw,sh]=frame.crop,cropPolygon=[[sx,sy],[sx+sw,sy],[sx+sw,sy+sh],[sx,sy+sh]];
 const boundsPoints=[...cropPolygon.map(sourcePoint),
  ...legs.flatMap(part=>[
   ...part.strutPolygon.map(([px,py])=>sourcePoint([px+(py-part.hinge)*part.roll/(part.wheelTop-part.hinge),part.hinge+(py-part.hinge)*part.stretch])),
   ...part.wheelPolygon.map(([px,py])=>sourcePoint([px+part.roll,py+part.offset])),
  ]),...arms.flatMap(part=>part.polygon.map(point=>sourcePoint(rotatePoint(point,part.pivot,part.rotation)))),
  ...(view==='side'?cannonPart.polygon.map(cannonPoint):[])];
 const xs=boundsPoints.map(point=>point.x),ys=boundsPoints.map(point=>point.y);
 return{view,frame,crop:frame.crop,anchor:frame.anchor,cropPolygon,k,scale,flip,rotation,offsetX,heave,bodyDrop,x,y,sourcePoint,
  legs,arms,cannonPart,cannonPoint,muzzle,muzzleDirection:unit(muzzle,gunBase),cannon:view==='side'?cannonPoint(frame.cannon):sourcePoint(frame.cannon),podMuzzles,
  podDirections,podSlots,podParts,podSourcePoint,
  podsOpen:true,target,targetY:target.y,
  bounds:{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}};
}

function polygon(c,points){c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();}

export function drawInkEnemySaltik(c,image,e,{camera=0,time=0,scale=1,view='side'}={}){
 if(!image||e.hp<=0)return null;
 const geo=inkEnemySaltikGeometry(e,time,{camera,scale,view});scale=geo.scale;
 const hit=e.hit>0?inkHitImage(image):null;
 const draw=()=>c.drawImage(hit??image,...geo.crop,...geo.crop);
 c.save();c.translate(geo.x+geo.offsetX,geo.y+geo.heave+geo.bodyDrop);c.rotate(geo.rotation);
 c.scale(geo.k*geo.flip,geo.k);c.translate(-geo.anchor[0],-geo.anchor[1]);c.imageSmoothingEnabled=true;
 if(e.hit>0&&!hit)c.filter='brightness(1.4)';
 if(geo.view==='front')draw();
 else{
  c.save();c.beginPath();polygon(c,geo.cropPolygon);
  for(const part of [...geo.legs,...geo.arms,geo.cannonPart,...geo.podParts])polygon(c,part.polygon);
  c.clip('evenodd');draw();c.restore();
  for(const part of geo.legs){
   c.save();c.translate(0,part.hinge);c.transform(1,0,part.roll/(part.wheelTop-part.hinge),part.stretch,0,0);c.translate(0,-part.hinge);
   c.beginPath();polygon(c,part.strutPolygon);c.clip();draw();c.restore();
   c.save();c.translate(part.roll,part.offset);
   c.beginPath();polygon(c,part.wheelPolygon);c.clip();draw();
   // Rotate only the existing inset hub texture inside its native projected
   // ellipse. The tire outline and the planted contact stay in the same place.
   /* Original wheel painting stays fixed. */
   c.restore();
  }
  for(const part of [geo.cannonPart,...geo.podParts,...geo.arms]){
   c.save();c.translate(...part.pivot);c.rotate(part.rotation);c.translate(-part.pivot[0]+finite(part.offsetX),-part.pivot[1]);
   if(part.btExtension!==undefined){
    const root=splitAtY(part.polygon,part.btStretchY,false),shaft=splitAtY(splitAtY(part.polygon,part.btStretchY,true),part.btWristY,false),hand=splitAtY(part.polygon,part.btWristY,true);
    c.save();c.beginPath();polygon(c,root);c.clip();draw();c.restore();
    c.save();c.translate(0,part.btStretchY);c.scale(1,1+part.btExtension/(part.btWristY-part.btStretchY));c.translate(0,-part.btStretchY);c.beginPath();polygon(c,shaft);c.clip();draw();c.restore();
    c.translate(0,part.btExtension);c.beginPath();polygon(c,hand);c.clip();draw();
   }else{c.beginPath();polygon(c,part.polygon);c.clip();draw();}c.restore();
  }
  // Faint light moves within the two existing eyes; no facial aperture moves.
  c.globalAlpha*=.08+.035*Math.sin(time*1.7);c.fillStyle=hit?'#ffffff':'#fff4db';
  for(const [x,y] of [[607,541],[704,541]]){c.beginPath();c.ellipse(x+Math.sin(time*.8)*1.4,y,2.4,3.2,0,0,Math.PI*2);c.fill();}
 }
 c.restore();
 drawLunarPennants(c,image,geo);
 drawInkEnemyPods(c,e,geo,{time});
 if(geo.view==='side')drawDefenseAndLock(c,e,geo,time);
 if(e.firePose>0&&geo.view==='side'){
  c.save();c.translate(geo.muzzle.x,geo.muzzle.y);c.rotate(Math.atan2(geo.muzzleDirection.y,geo.muzzleDirection.x));c.scale(scale*.7,scale*.7);
  c.fillStyle='#DF9A8B';c.strokeStyle='#414744';c.lineWidth=1.7;c.beginPath();c.moveTo(0,-3);c.lineTo(9,-8);c.lineTo(11,-3);c.lineTo(24,0);c.lineTo(11,3);c.lineTo(9,8);c.lineTo(0,3);c.closePath();c.fill();c.stroke();c.restore();
 }
 return geo;
}

function drawDefenseAndLock(c,e,geo,time){
 const scale=geo.scale;
 if(e.guard){
  // A small ink brace sits in front of the existing native hands. Flashing
  // ricochets explain blocked ranged hits without adding another arm.
  const p=geo.sourcePoint(geo.frame.hand),dir=e.dir===1?1:-1;
  c.save();c.strokeStyle='#414744';c.lineWidth=1.8*scale;c.lineCap='round';
  c.beginPath();c.moveTo(p.x-dir*3*scale,p.y-7*scale);c.lineTo(p.x+dir*2*scale,p.y);c.lineTo(p.x-dir*3*scale,p.y+7*scale);c.stroke();
  if(e.guardFlash>0&&e.guardResponse==='deflect'){
   const flash=clamp(e.guardFlash/.25),reach=(8+flash*8)*scale;
   c.strokeStyle='#FFF4DA';c.lineWidth=2*scale;c.beginPath();
   for(const angle of [-.9,0,.9]){const dx=dir*Math.cos(angle),dy=Math.sin(angle);c.moveTo(p.x+dx*5*scale,p.y+dy*5*scale);c.lineTo(p.x+dx*reach,p.y+dy*reach);}c.stroke();
   c.strokeStyle='#FFF4DA';c.lineWidth=.8*scale;c.beginPath();c.arc(p.x,p.y,5*scale,-1,1);c.stroke();
  }
  c.restore();
 }
 if(e.attackPhase==='lock'){
  const progress=clamp(e.lockProgress??0),center=geo.sourcePoint(geo.frame.lock);
  c.save();const alpha=c.globalAlpha;c.strokeStyle='#B97064';c.lineWidth=1.2*scale;c.globalAlpha*=.5;c.setLineDash([3*scale,5*scale]);
  c.beginPath();c.arc(center.x,center.y,46*scale,0,Math.PI*2);c.stroke();c.setLineDash([]);c.globalAlpha=alpha;
  c.strokeStyle='#DF9A8B';c.lineWidth=2.4*scale;c.beginPath();c.arc(center.x,center.y,46*scale,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
  for(const mouth of geo.podMuzzles){c.beginPath();c.arc(mouth.x,mouth.y,(3+progress*3+Math.sin(time*20)*.4)*scale,0,Math.PI*2);c.stroke();}
  c.restore();
 }
}
