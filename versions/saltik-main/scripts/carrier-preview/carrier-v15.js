// Archived v15 renderer, only for reproducing the approved before/after previews.
import {sampleSupportSurface,computeSupportPose} from '/src/support-pose.js';
import {inkSaltikGeometry,INK_SALTIK_PARTS,INK_SALTIK_CROP,INK_SALTIK_HEIGHT} from '/src/ink-saltik.js';
import {plantInkWheel} from '/src/ink-leg-support.js';

// One intact native painting serves the entire encounter. The low, empty H
// platforms belong to the carrier; normal drones remain independent actors.
export const INK_CARRIER_ASSET='ink-carrier-support-dr01';
export const INK_CARRIER_CROP=Object.freeze([190,51,1160,931]);
export const INK_CARRIER_ANCHOR=Object.freeze([788,969]);
export const INK_CARRIER_HEIGHT=126;
export const INK_CARRIER_DOCK_CLEARANCE=66*(501-344)/376;
export const INK_CARRIER_FRAMES=Object.freeze([Object.freeze({id:'intact',crop:INK_CARRIER_CROP,destination:INK_CARRIER_CROP})]);
const PIXEL_SCALE=INK_CARRIER_HEIGHT/(976-56),ASPECT=1;
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const unit=(a,b)=>{const x=a.x-b.x,y=a.y-b.y,n=Math.hypot(x,y)||1;return{x:x/n,y:y/n};};
const rectangle=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const bound=points=>{const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};};
export const INK_CARRIER_BAYS=Object.freeze([
 {id:'front',muzzle:[495,359],base:[495,451],light:[388,432],polygon:[[283,370],[295,350],[330,333],[410,322],[538,321],[631,335],[686,355],[704,379],[704,429],[687,456],[643,474],[547,485],[425,482],[337,467],[292,443],[281,412]]},
 {id:'rear',muzzle:[1124,360],base:[1124,452],light:[1225,433],polygon:[[920,369],[937,349],[976,334],[1059,324],[1167,325],[1252,337],[1309,357],[1331,379],[1337,414],[1329,441],[1302,460],[1235,478],[1146,487],[1042,482],[960,464],[929,442],[917,408]]},
]);
// The masks carry the original outlines. Their shared vertical seams follow
// the actual overlap between the four visible tire assemblies. Virtual upper
// suspension pivots stay under the cabin as the intact struts compress at KO.
export const INK_CARRIER_PARTS={
 legs:[
  {id:'front-near',foot:[389,969],hinge:640,wheelTop:811,wheelCenter:[397,891],wheelRadius:[113,81],polygon:[[389,670],[447,665],[492,680],[517,711],[535,753],[559,783],[570,812],[570,982],[270,982],[270,790],[317,763],[348,720]]},
  {id:'front-far',foot:[652,960],hinge:635,wheelTop:809,wheelCenter:[665,882],wheelRadius:[91,79],polygon:[[619,745],[689,744],[739,777],[767,797],[800,799],[800,982],[570,982],[570,800],[590,775]]},
  {id:'rear-near',foot:[960,972],hinge:635,wheelTop:811,wheelCenter:[966,892],wheelRadius:[121,82],polygon:[[930,662],[997,656],[1041,673],[1073,713],[1092,754],[1105,792],[1105,982],[800,982],[800,809],[830,796],[850,783],[874,737],[903,693]]},
  {id:'rear-far',foot:[1230,968],hinge:635,wheelTop:807,wheelCenter:[1223,890],wheelRadius:[122,83],polygon:[[1174,651],[1226,652],[1254,672],[1268,702],[1296,732],[1320,770],[1344,812],[1351,862],[1351,982],[1105,982],[1105,793],[1097,749],[1109,706],[1136,673]]},
 ],
 cannon:{id:'front-left-gatling',pivot:[504,584],muzzle:[196,584],polygon:[[190,550],[277,550],[305,561],[357,561],[385,551],[431,551],[463,558],[497,561],[524,576],[541,596],[545,625],[538,649],[519,671],[488,678],[452,676],[426,671],[406,670],[386,661],[302,663],[268,668],[209,666],[190,650]]},
 head:{pivot:[736,748],polygon:[[548,610],[553,558],[575,501],[606,454],[648,422],[698,400],[778,388],[839,391],[884,406],[905,440],[922,474],[950,492],[951,521],[930,540],[915,549],[929,573],[931,601],[921,627],[930,652],[923,680],[906,705],[879,723],[849,739],[815,756],[770,772],[715,780],[651,771],[595,748],[561,715],[547,672]]},
 hands:[
  {id:'front-claw',pivot:[581,742],tip:[540,874],grip:[534,850],polygon:[[570,715],[594,716],[611,730],[611,751],[592,774],[581,797],[579,815],[563,830],[568,848],[563,866],[546,885],[532,886],[531,874],[539,858],[536,848],[528,848],[523,859],[525,875],[513,878],[500,862],[497,844],[504,829],[520,818],[525,798],[537,776],[545,751],[550,732]]},
  {id:'rear-claw',pivot:[809,744],tip:[791,874],grip:[786,850],polygon:[[800,716],[820,719],[831,731],[832,753],[824,775],[828,794],[837,808],[830,826],[817,835],[817,850],[807,872],[791,885],[780,885],[780,873],[792,858],[789,848],[781,849],[776,860],[779,873],[769,879],[755,868],[748,851],[750,834],[762,822],[777,817],[779,802],[785,789],[784,768],[783,744],[788,726]]},
 ],
 eyes:[{center:[595,628],radius:[39,49]},{center:[720,629],radius:[43,49]}],
 sensor:{center:[887,295],radius:[107,43]},
 socket:[1088,630],port:[1496,710],
};
// Reuse the hero's actual ivory forearms and rounded graphite hands. The
// old tiny claw masks remain only to erase their pixels from the carrier atlas.
const HERO_HAND_RATIO=(INK_SALTIK_HEIGHT/(1078-24))/PIXEL_SCALE;
const HERO_HAND_MOUNTS=[[581,742],[809,744]];
const HERO_HAND_TIPS=[[878,1020],[1085,1000]];
const HERO_HANDS=INK_SALTIK_PARTS.arms.map((source,index)=>{
 const pivot=HERO_HAND_MOUNTS[index],project=point=>[pivot[0]-(point[0]-source.pivot[0])*HERO_HAND_RATIO,pivot[1]+(point[1]-source.pivot[1])*HERO_HAND_RATIO];
 return {id:source.id,pivot,source,ratio:HERO_HAND_RATIO,tip:project(HERO_HAND_TIPS[index]),polygon:source.polygon.map(project)};
});
function halfPolygon(points,value,below,axis=1){const out=[],inside=p=>below?p[axis]>=value:p[axis]<=value;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);if(ai)out.push(a);if(ai!==bi){const t=(value-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
for(const part of INK_CARRIER_PARTS.legs){part.strutPolygon=halfPolygon(part.polygon,part.wheelTop,false);part.wheelPolygon=halfPolygon(part.polygon,part.wheelTop,true);}
function rotate(point,pivot,a,dx=0){const x=point[0]+dx-pivot[0],y=point[1]-pivot[1],co=Math.cos(a),si=Math.sin(a);return[pivot[0]+x*co-y*si,pivot[1]+x*si+y*co];}

export function inkCarrierGeometry(e,time=0,{camera=0,scale=1}={}){
 scale=Math.max(.01,finite(scale,1));const k=PIXEL_SCALE*scale,flip=e.dir===-1?-1:1,paintFlip=-flip,x=finite(e.x)-camera,y=finite(e.y);
 const settled=!!(e.shutdownSettled||e.shuttingDown||e.neutralized),knockedOut=!!(e.knockedOut||settled),koTime=Math.max(0,finite(e.koElapsed)),koProgress=settled?1:knockedOut?smooth(koTime/.6):0;
 const powerFade=e.neutralized?(Number.isFinite(e.neutralizedAt)?clamp((time-e.neutralizedAt)/.6):1):0;
 const effectsTime=e.neutralized?finite(e.neutralizedAt,time):time;
 const walking=!knockedOut&&Math.abs(finite(e.vx))>5,distance=finite(e.motionDistance,walking?time*finite(e.vx):0),phase=distance/12;
 const rear=sampleSupportSurface(e.supportPose,finite(e.x)-50),front=sampleSupportSurface(e.supportPose,finite(e.x)+50);
 const slope=Number.isFinite(rear)&&Number.isFinite(front)?Math.atan2(front-rear,100):finite(e.supportPose?.tilt);
 const tilt=clamp(slope+(knockedOut?0:finite(e.motionLean)),-.34,.34),co=Math.cos(tilt),si=Math.sin(tilt);
 const heave=finite(e.supportPose?.heave)*scale,bodyDrop=(17*koProgress+(walking?Math.sin(phase*2)*.55:0))*scale;
 const sourcePoint=([px,py])=>{const xx=(px-INK_CARRIER_ANCHOR[0])*k*ASPECT*paintFlip,yy=(py-INK_CARRIER_ANCHOR[1])*k;return{x:x+xx*co-yy*si,y:y+heave+bodyDrop+xx*si+yy*co};};
 const headPart={...INK_CARRIER_PARTS.head,rotation:knockedOut&&!settled?Math.sin(koTime*6.2)*.031*koProgress:0};
 const headPoint=point=>sourcePoint(rotate(point,headPart.pivot,headPart.rotation));
 const hands=INK_CARRIER_PARTS.hands.map(part=>({...part,rotation:.95*koProgress})),heroHands=HERO_HANDS.map((part,index)=>({...part,rotation:.12+.95*koProgress+(walking?Math.sin(phase+index*Math.PI)*.045:0)})),handPoint=(part,point)=>sourcePoint(rotate(point,part.pivot,part.rotation));
 const legs=INK_CARRIER_PARTS.legs.map((part,i)=>{
  const stride=walking?Math.sin(phase+(i%2?Math.PI:0))*18:0,native=sourcePoint([part.foot[0]+stride,part.foot[1]]);
  const floor=at=>{const sampled=sampleSupportSurface(e.supportPose,finite(e.x)+(at-x)/scale);return e.supportPose?.surface&&!Number.isFinite(sampled)?NaN:y+((sampled??finite(e.supportY,y))-y)*scale;};
  const planted=plantInkWheel(native,{k,cos:co,sin:si,floor,orientation:paintFlip,maxOffset:240}),roll=stride+planted.roll/ASPECT;
  return{...part,...planted,roll,stretch:1+planted.offset/(part.wheelTop-part.hinge),wheelSpin:walking?distance/(part.wheelRadius[1]*PIXEL_SCALE)*paintFlip:0,broken:false,contact:sourcePoint([part.foot[0]+roll,part.foot[1]+planted.offset])};
 });
 const cannonPart={...INK_CARRIER_PARTS.cannon,rotation:knockedOut?0:clamp(finite(e.cannonElevation),-.15,.22),offsetX:knockedOut?0:14*clamp(finite(e.cannonRecoil,finite(e.firePose)/.14))};
 const cannonPoint=point=>sourcePoint(rotate(point,cannonPart.pivot,cannonPart.rotation,cannonPart.offsetX));
 const muzzle=cannonPoint(cannonPart.muzzle),base=cannonPoint(cannonPart.pivot),target=headPoint([717,681]);
 const bays=INK_CARRIER_BAYS.map((bay,index)=>{const equipment=e.bays?.[index],hp=finite(equipment?.hp,12),maxHp=Math.max(1,finite(equipment?.maxHp,12)),muzzle=sourcePoint(bay.muzzle),base=sourcePoint(bay.base),droneAnchor={x:muzzle.x,y:muzzle.y-INK_CARRIER_DOCK_CLEARANCE*scale};return{...bay,index,hp,maxHp,dead:hp<=0,damage:1-clamp(hp/maxHp),muzzle,droneAnchor,base,direction:unit(muzzle,base),bounds:bound(bay.polygon.map(sourcePoint)),points:bay.polygon.map(sourcePoint)};});
 // The service lead is offered at KO. Its real connector adapts to the curved
 // approach surface so the original small hero claw can reach every frame.
 const frontAccess=e.serviceAccessSide==='front',serviceDirection=frontAccess?-flip:flip,servicePortAnchor=frontAccess?[80,710]:INK_CARRIER_PARTS.port,serviceSocketNative=frontAccess?[550,740]:INK_CARRIER_PARTS.socket;
 let port=sourcePoint(servicePortAnchor),servicePortNative=servicePortAnchor;
 if(knockedOut&&e.supportPose){
  const heroX=port.x+camera-56.75*serviceDirection,ground=at=>sampleSupportSurface(e.supportPose,at),heroY=ground(heroX);
  if(Number.isFinite(heroY)){
   const hero={x:heroX,y:heroY,dir:serviceDirection,onGround:true};hero.supportPose=computeSupportPose(hero,ground,null,1/60,{retainSurface:true});
   const pose=inkSaltikGeometry(hero,{camera,time:0}),pivot=pose.sourcePoint(pose.arms[1].pivot);
   const fits=[port,{x:port.x-serviceDirection*7,y:port.y+1.5},{x:port.x-serviceDirection*7,y:port.y+6}].every(p=>{const r=Math.hypot(p.x-pivot.x,p.y-pivot.y);return r>14&&r<28.15;});
   if(!fits){port={x:pivot.x+serviceDirection*24,y:pivot.y+2};const dx=port.x-x,dy=port.y-y-heave-bodyDrop;servicePortNative=[INK_CARRIER_ANCHOR[0]+(dx*co+dy*si)/(k*ASPECT*paintFlip),INK_CARRIER_ANCHOR[1]+(-dx*si+dy*co)/k];}
  }
 }
 const stars=knockedOut?Array.from({length:3},(_,i)=>{const a=effectsTime*2+i*Math.PI*2/3;return{...headPoint([731+Math.cos(a)*190,369+Math.sin(a)*95]),radius:(i===1?4.2:3.8)*scale,rotation:-a*.45,alpha:koProgress*(1-powerFade)};}):[];
 const points=[...rectangle(INK_CARRIER_CROP).map(sourcePoint),...legs.map(l=>l.contact),...cannonPart.polygon.map(cannonPoint),...headPart.polygon.map(headPoint),...heroHands.flatMap(part=>part.polygon.map(point=>handPoint(part,point)))];
 return{x,y,k,scale,aspect:ASPECT,flip,paintFlip,orientation:flip,tilt,rotation:tilt,heave,bodyDrop,knockedOut,koTime,koProgress,headPart,headPoint,hands,heroHands,handPoint,stars,spiralAngle:effectsTime*2.5,powerFade,damageStage:knockedOut?'knocked-out':'intact',frameIndex:0,frame:INK_CARRIER_FRAMES[0],sourcePoint,legs,hand:null,cannonPart,cannonPoint,muzzle,muzzleDirection:unit(muzzle,base),target,targetY:target.y,bays,bayBounds:bays.map(b=>b.bounds),smokeEmitters:[],bodyBounds:bound(rectangle([280,392,1065,586]).map(sourcePoint)),bounds:bound(points),port,servicePortNative,servicePortAnchor,serviceSocketNative,serviceDirection,socket:sourcePoint(serviceSocketNative),portDirection:{x:-serviceDirection*co,y:-serviceDirection*si}};
}
export function carrierShutdownPlacement(e,{camera=0,player={}}={}){
 const g=inkCarrierGeometry(e,0,{camera}),dir=g.serviceDirection,x=g.sourcePoint(g.servicePortAnchor).x-56.75*dir;
 const floor=sampleSupportSurface(e.supportPose,x+camera);
 return{x,y:finite(player.supportY,finite(floor,finite(e.y))),dir,port:g.port};
}
function polygon(c,points){c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();}
function clipPart(c,points,cutouts=[]){c.beginPath();polygon(c,points);c.clip();for(const part of cutouts){c.beginPath();polygon(c,rectangle(INK_CARRIER_CROP));polygon(c,part.polygon);c.clip('evenodd');}}
function nativeFrame(c,image){c.drawImage(image,...INK_CARRIER_CROP,...INK_CARRIER_CROP);}
function wheelInk(c,part){const [x,y]=part.wheelCenter,[rx,ry]=part.wheelRadius;c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();c.globalAlpha*=.32;c.strokeStyle='#f3e7c7';c.lineWidth=5;for(const a of [part.wheelSpin,part.wheelSpin+Math.PI]){c.beginPath();c.moveTo(x+Math.cos(a)*rx*.65,y+Math.sin(a)*ry*.65);c.lineTo(x+Math.cos(a)*rx*.65+3,y+Math.sin(a)*ry*.65+8);c.stroke();}c.restore();}
function koEyes(c,g){
 if(!g.knockedOut)return;
 for(const eye of INK_CARRIER_PARTS.eyes){
  const [x,y]=eye.center,[rx,ry]=eye.radius;c.save();c.beginPath();c.ellipse(x,y,rx*.93,ry*.93,0,0,Math.PI*2);c.clip();
  c.globalAlpha*=g.koProgress;c.fillStyle=g.powerFade>.5?'#b1b5a4':'#f0e4c5';c.fill();c.strokeStyle='#26373a';c.lineWidth=6;c.lineCap='round';c.lineJoin='round';c.beginPath();
  for(let i=0;i<=80;i++){const t=i/80,a=g.spiralAngle+t*Math.PI*4.5,r=t*.79,px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();c.restore();
 }
}
function koStars(c,g){for(const star of g.stars){if(star.alpha<=0)continue;c.save();c.globalAlpha*=star.alpha;c.translate(star.x,star.y);c.rotate(star.rotation);c.fillStyle='#edcf78';c.strokeStyle='#26373a';c.lineWidth=.8*g.scale;c.beginPath();polygon(c,Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=star.radius*(i%2?.43:1);return[Math.cos(a)*r,Math.sin(a)*r];}));c.fill();c.stroke();c.restore();}}
export function drawInkCarrier(c,image,e,{camera=0,time=0,scale=1,handsImage=null}={}){
 if(!image)return null;const g=inkCarrierGeometry(e,time,{camera,scale}),draw=()=>nativeFrame(c,image);
 c.save();c.imageSmoothingEnabled=true;c.translate(g.x,g.y+g.heave+g.bodyDrop);c.rotate(g.tilt);c.scale(g.k*g.aspect*g.paintFlip,g.k);c.translate(-INK_CARRIER_ANCHOR[0],-INK_CARRIER_ANCHOR[1]);
 c.save();clipPart(c,rectangle(INK_CARRIER_CROP),[...g.legs,g.cannonPart,g.headPart,...g.hands]);draw();c.restore();
 for(const part of g.legs){
  c.save();c.translate(0,part.hinge);c.transform(1,0,part.roll/(part.wheelTop-part.hinge),part.stretch,0,0);c.translate(0,-part.hinge);clipPart(c,part.strutPolygon,[g.headPart,...g.hands]);draw();c.restore();
  c.save();c.translate(part.roll,part.offset);clipPart(c,part.wheelPolygon,g.hands);draw();wheelInk(c,part);c.restore();
 }
 const head=g.headPart;c.save();c.translate(...head.pivot);c.rotate(head.rotation);c.translate(-head.pivot[0],-head.pivot[1]);clipPart(c,head.polygon,g.hands);draw();koEyes(c,g);c.restore();
 if(handsImage){
  for(const part of g.heroHands){c.save();c.translate(...part.pivot);c.rotate(part.rotation);c.scale(-part.ratio,part.ratio);c.translate(-part.source.pivot[0],-part.source.pivot[1]);c.beginPath();polygon(c,part.source.polygon);c.clip();c.drawImage(handsImage,...INK_SALTIK_CROP,...INK_SALTIK_CROP);c.restore();}
 }else for(const part of g.hands){c.save();c.translate(...part.pivot);c.rotate(part.rotation);c.translate(-part.pivot[0],-part.pivot[1]);clipPart(c,part.polygon);draw();c.restore();}
 const gun=g.cannonPart;c.save();c.translate(...gun.pivot);c.rotate(gun.rotation);c.translate(-gun.pivot[0]+gun.offsetX,-gun.pivot[1]);c.beginPath();polygon(c,gun.polygon);c.clip();draw();c.restore();
 for(const bay of g.bays)if(!g.knockedOut&&!bay.dead&&e.deployBay===bay.index&&e.deployFlash>0){const [mx,my]=INK_CARRIER_BAYS[bay.index].muzzle;c.save();c.globalAlpha*=clamp(e.deployFlash/.7);c.strokeStyle='#b7ffff';c.lineWidth=5;c.beginPath();c.ellipse(mx,my,164,35,0,0,Math.PI*2);c.stroke();c.restore();}
 if(e.attackPhase==='reload'&&!g.knockedOut){const amount=clamp(finite(e.reloadIn)/Math.max(.01,finite(e.reloadDuration,1.8)));c.strokeStyle='#18242a';c.lineWidth=16;c.beginPath();c.moveTo(373,678);c.lineTo(459,678);c.stroke();c.strokeStyle='#dca663';c.lineWidth=7;c.beginPath();c.moveTo(373,678);c.lineTo(373+86*(1-amount),678);c.stroke();}
 if(g.knockedOut){const [sx,sy]=g.serviceSocketNative,[px,py]=g.servicePortNative,outward=Math.sign(px-sx)||1;
  c.strokeStyle='#17242b';c.lineWidth=13;c.lineCap='round';c.beginPath();c.moveTo(sx,sy);c.bezierCurveTo(sx+outward*150,sy+45,px-outward*100,py-20,px,py);c.stroke();c.strokeStyle=e.neutralized?'#657477':'#9ee9df';c.lineWidth=4;c.stroke();
  c.fillStyle='#233138';c.strokeStyle='#161f25';c.lineWidth=5;c.beginPath();c.rect(px-22,py-17,44,34);c.fill();c.stroke();c.fillStyle='#d7c8a7';c.beginPath();c.rect(px-18,py-13,36,26);c.fill();c.stroke();
 }c.restore();koStars(c,g);
 if(e.firePose>0&&!g.knockedOut){c.save();c.translate(g.muzzle.x,g.muzzle.y);c.rotate(Math.atan2(g.muzzleDirection.y,g.muzzleDirection.x));c.scale(scale,scale);c.globalAlpha*=clamp(e.firePose/.14);c.fillStyle='#ffe6a6';c.strokeStyle='#405052';c.lineWidth=.8;c.beginPath();polygon(c,[[0,-1.8],[5,-4],[6,-1.6],[13,0],[6,1.6],[5,4],[0,1.8]]);c.fill();c.stroke();c.restore();}
 return g;
}
