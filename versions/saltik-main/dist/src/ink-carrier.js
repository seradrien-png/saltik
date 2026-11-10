import {sampleSupportSurface,computeSupportPose} from './support-pose.js';
import {inkSaltikGeometry} from './ink-saltik.js';
import {plantInkWheel} from './ink-leg-support.js';
import {drawLunarPennants} from './lunar-pennants.js';

// One intact approved painting serves the entire encounter. The raised, empty H
// platforms belong to the carrier; normal drones remain independent actors.
export const INK_CARRIER_ASSET='ink-carrier-raised-dr01';
export const INK_CARRIER_CROP=Object.freeze([0,21,1309,1153]);
export const INK_CARRIER_ANCHOR=Object.freeze([700,1158]);
export const INK_CARRIER_HEIGHT=140;
export const INK_CARRIER_DOCK_CLEARANCE=66*(501-344)/376;
export const INK_CARRIER_FRAMES=Object.freeze([Object.freeze({id:'intact',crop:INK_CARRIER_CROP,destination:INK_CARRIER_CROP})]);
const PIXEL_SCALE=INK_CARRIER_HEIGHT/INK_CARRIER_CROP[3],ASPECT=1;
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const unit=(a,b)=>{const x=a.x-b.x,y=a.y-b.y,n=Math.hypot(x,y)||1;return{x:x/n,y:y/n};};
const rectangle=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const bound=points=>{const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};};
export const INK_CARRIER_BAYS=Object.freeze([
 {id:'rear',muzzle:[310,198],base:[310,312],light:[163,279],polygon:[[15,203],[51,168],[136,143],[277,130],[429,137],[545,164],[592,196],[608,233],[605,289],[569,320],[455,344],[272,352],[115,331],[29,300],[10,266]]},
 {id:'front',muzzle:[1025,210],base:[1025,323],light:[1150,290],polygon:[[745,207],[792,175],[882,151],[1014,142],[1141,151],[1248,177],[1298,211],[1308,250],[1303,299],[1268,326],[1164,350],[1010,360],[866,346],[783,320],[745,289]]},
]);
// The masks carry the original outlines. Their shared vertical seams follow
// the actual overlap between the four visible tire assemblies. Virtual upper
// suspension pivots stay under the cabin as the intact struts compress at KO.
export const INK_CARRIER_PARTS={
 legs:[
  {id:'rear-near',foot:[120,1115],hinge:741,wheelTop:1008,wheelCenter:[134,1045],wheelRadius:[85,71],polygon:[[0,790],[161,730],[276,730],[330,800],[330,1174],[0,1174]]},
  {id:'rear-far',foot:[500,1115],hinge:745,wheelTop:1008,wheelCenter:[500,1043],wheelRadius:[65,74],occluded:true,polygon:[]},
  {id:'front-near',foot:[440,1142],hinge:755,wheelTop:1043,wheelCenter:[444,1071],wheelRadius:[91,72],polygon:[[330,805],[441,735],[566,733],[650,820],[650,1174],[330,1174]]},
  {id:'front-far',foot:[1200,1127],hinge:755,wheelTop:1029,wheelCenter:[1197,1062],wheelRadius:[75,66],polygon:[[985,745],[1100,755],[1309,900],[1309,1174],[985,1174]]},
 ],
 cannon:{id:'side-right-gatling',pivot:[415,620],muzzle:[642,619],polygon:[[170,582],[187,552],[220,520],[294,507],[375,504],[471,503],[520,527],[546,572],[630,573],[648,584],[655,615],[645,654],[605,672],[548,672],[505,712],[435,730],[332,733],[240,718],[199,692],[177,654]]},
 head:{pivot:[820,865],polygon:[[720,603],[920,600],[965,640],[1015,665],[1012,745],[1005,825],[961,860],[954,904],[908,927],[765,931],[684,907],[646,865],[614,808],[619,729],[636,668],[674,630]]},
 hands:[
  {id:'near-claw',pivot:[703,879],tip:[760,1025],grip:[788,986],polygon:[[646,841],[692,831],[744,853],[775,883],[816,906],[846,941],[862,978],[850,1010],[829,1038],[805,1043],[794,1026],[806,1009],[813,986],[800,968],[784,950],[780,970],[789,992],[790,1019],[780,1041],[759,1045],[745,1031],[730,1009],[726,982],[733,956],[717,937],[685,931],[650,906],[637,877]]},
  {id:'far-claw',pivot:[902,912],tip:[946,981],grip:[944,960],polygon:[[869,889],[897,883],[923,902],[945,927],[959,949],[961,972],[946,996],[928,995],[927,980],[934,962],[927,946],[909,936],[893,934],[879,919]]},
 ],
 eyes:[{center:[812,751],radius:[44,58]},{center:[946,750],radius:[40,54]}],
 sensor:{center:[740,345],radius:[56,31]},
 socket:[342,680],port:[-185,790],
};
// Three wheel assemblies are visible in this three-quarter painting. The
// fourth contact stays behind the near wheel; never draw a duplicate patch.
function halfPolygon(points,value,below,axis=1){const out=[],inside=p=>below?p[axis]>=value:p[axis]<=value;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);if(ai)out.push(a);if(ai!==bi){const t=(value-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
for(const part of INK_CARRIER_PARTS.legs){part.strutPolygon=halfPolygon(part.polygon,part.wheelTop,false);part.wheelPolygon=halfPolygon(part.polygon,part.wheelTop,true);}
function rotate(point,pivot,a,dx=0){const x=point[0]+dx-pivot[0],y=point[1]-pivot[1],co=Math.cos(a),si=Math.sin(a);return[pivot[0]+x*co-y*si,pivot[1]+x*si+y*co];}

export function inkCarrierGeometry(e,time=0,{camera=0,scale=1}={}){
 scale=Math.max(.01,finite(scale,1))*(e.artScale??1);const k=PIXEL_SCALE*scale,flip=e.dir===-1?-1:1,paintFlip=flip,x=finite(e.x)-camera,y=finite(e.y);
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
 const hands=INK_CARRIER_PARTS.hands.map((part,index)=>({...part,rotation:-.5*koProgress+(walking?Math.sin(phase+index*Math.PI)*.035:0)})),handPoint=(part,point)=>sourcePoint(rotate(point,part.pivot,part.rotation));
 const legs=INK_CARRIER_PARTS.legs.map((part,i)=>{
  const stride=walking?Math.sin(phase+(i%2?Math.PI:0))*18:0,native=sourcePoint([part.foot[0]+stride,part.foot[1]]);
  const floor=at=>{const sampled=sampleSupportSurface(e.supportPose,finite(e.x)+(at-x)/scale);return e.supportPose?.surface&&!Number.isFinite(sampled)?NaN:y+((sampled??finite(e.supportY,y))-y)*scale;};
  const planted=plantInkWheel(native,{k,cos:co,sin:si,floor,orientation:paintFlip,maxOffset:240}),roll=stride+planted.roll/ASPECT;
  return{...part,...planted,roll,stretch:1+planted.offset/(part.wheelTop-part.hinge),wheelSpin:walking?distance/(part.wheelRadius[1]*PIXEL_SCALE)*paintFlip:0,broken:false,contact:sourcePoint([part.foot[0]+roll,part.foot[1]+planted.offset])};
 });
 const cannonPart={...INK_CARRIER_PARTS.cannon,rotation:knockedOut?0:clamp(finite(e.cannonElevation),-.15,.22),offsetX:knockedOut?0:-14*clamp(finite(e.cannonRecoil,finite(e.firePose)/.14))};
 const cannonPoint=point=>sourcePoint(rotate(point,cannonPart.pivot,cannonPart.rotation,cannonPart.offsetX));
 const muzzle=cannonPoint(cannonPart.muzzle),base=cannonPoint(cannonPart.pivot),target=headPoint([870,803]);
 const bays=INK_CARRIER_BAYS.map((bay,index)=>{const equipment=e.bays?.[index],hp=finite(equipment?.hp,12),maxHp=Math.max(1,finite(equipment?.maxHp,12)),muzzle=sourcePoint(bay.muzzle),base=sourcePoint(bay.base),droneAnchor={x:muzzle.x,y:muzzle.y-INK_CARRIER_DOCK_CLEARANCE*scale};return{...bay,index,hp,maxHp,dead:hp<=0,damage:1-clamp(hp/maxHp),muzzle,droneAnchor,base,direction:unit(muzzle,base),bounds:bound(bay.polygon.map(sourcePoint)),points:bay.polygon.map(sourcePoint)};});
 // The service lead is offered at KO. Its real connector adapts to the curved
 // approach surface so the original small hero claw can reach every frame.
 const frontAccess=e.serviceAccessSide==='front',serviceDirection=frontAccess?-flip:flip,servicePortAnchor=frontAccess?[1550,790]:INK_CARRIER_PARTS.port,serviceSocketNative=frontAccess?[1000,680]:INK_CARRIER_PARTS.socket;
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
 const stars=knockedOut?Array.from({length:3},(_,i)=>{const a=effectsTime*2+i*Math.PI*2/3;return{...headPoint([870+Math.cos(a)*190,555+Math.sin(a)*90]),radius:(i===1?4.2:3.8)*scale,rotation:-a*.45,alpha:koProgress*(1-powerFade)};}):[];
 const points=[...rectangle(INK_CARRIER_CROP).map(sourcePoint),...legs.map(l=>l.contact),...cannonPart.polygon.map(cannonPoint),...headPart.polygon.map(headPoint),...hands.flatMap(part=>part.polygon.map(point=>handPoint(part,point)))];
 return{x,y,k,scale,aspect:ASPECT,flip,paintFlip,orientation:flip,cannonElevationSign:paintFlip,tilt,rotation:tilt,heave,bodyDrop,knockedOut,koTime,koProgress,headPart,headPoint,hands,handPoint,stars,spiralAngle:effectsTime*2.5,powerFade,damageStage:knockedOut?'knocked-out':'intact',frameIndex:0,frame:INK_CARRIER_FRAMES[0],sourcePoint,legs,hand:null,cannonPart,cannonPoint,muzzle,muzzleDirection:unit(muzzle,base),target,targetY:target.y,bays,bayBounds:bays.map(b=>b.bounds),smokeEmitters:[],bodyBounds:bound(rectangle([160,380,1120,780]).map(sourcePoint)),bounds:bound(points),port,servicePortNative,servicePortAnchor,serviceSocketNative,serviceDirection,socket:sourcePoint(serviceSocketNative),portDirection:{x:-serviceDirection*co,y:-serviceDirection*si}};
}
export function carrierShutdownPlacement(e,{camera=0,player={}}={}){
 const g=inkCarrierGeometry(e,0,{camera}),dir=g.serviceDirection,x=g.sourcePoint(g.servicePortAnchor).x-56.75*dir;
 const floor=sampleSupportSurface(e.supportPose,x+camera);
 return{x,y:finite(player.supportY,finite(floor,finite(e.y))),dir,port:g.port};
}
function polygon(c,points){if(!points.length)return;c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();}
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
 if(!image)return null;const g=inkCarrierGeometry(e,time,{camera,scale}),draw=()=>nativeFrame(c,image);scale=g.scale;
 c.save();c.imageSmoothingEnabled=true;c.translate(g.x,g.y+g.heave+g.bodyDrop);c.rotate(g.tilt);c.scale(g.k*g.aspect*g.paintFlip,g.k);c.translate(-INK_CARRIER_ANCHOR[0],-INK_CARRIER_ANCHOR[1]);
 c.save();clipPart(c,rectangle(INK_CARRIER_CROP),[...g.legs,g.cannonPart,g.headPart,...g.hands]);draw();c.restore();
 for(const part of g.legs){
  if(part.occluded)continue;
  c.save();c.translate(0,part.hinge);c.transform(1,0,part.roll/(part.wheelTop-part.hinge),part.stretch,0,0);c.translate(0,-part.hinge);clipPart(c,part.strutPolygon,[g.headPart,...g.hands]);draw();c.restore();
  c.save();c.translate(part.roll,part.offset);clipPart(c,part.wheelPolygon,g.hands);draw();wheelInk(c,part);c.restore();
 }
 const head=g.headPart;c.save();c.translate(...head.pivot);c.rotate(head.rotation);c.translate(-head.pivot[0],-head.pivot[1]);clipPart(c,head.polygon,g.hands);draw();koEyes(c,g);c.restore();
 for(const part of g.hands){c.save();c.translate(...part.pivot);c.rotate(part.rotation);c.translate(-part.pivot[0],-part.pivot[1]);clipPart(c,part.polygon);draw();c.restore();}
 const gun=g.cannonPart;c.save();c.translate(...gun.pivot);c.rotate(gun.rotation);c.translate(-gun.pivot[0]+gun.offsetX,-gun.pivot[1]);c.beginPath();polygon(c,gun.polygon);c.clip();draw();c.restore();
 for(const bay of g.bays)if(!g.knockedOut&&!bay.dead&&e.deployBay===bay.index&&e.deployFlash>0){const [mx,my]=INK_CARRIER_BAYS[bay.index].muzzle;c.save();c.globalAlpha*=clamp(e.deployFlash/.7);c.strokeStyle='#b7ffff';c.lineWidth=5;c.beginPath();c.ellipse(mx,my,164,35,0,0,Math.PI*2);c.stroke();c.restore();}
 if(e.attackPhase==='reload'&&!g.knockedOut){const amount=clamp(finite(e.reloadIn)/Math.max(.01,finite(e.reloadDuration,1.8)));c.strokeStyle='#18242a';c.lineWidth=12;c.beginPath();c.moveTo(250,695);c.lineTo(320,695);c.stroke();c.strokeStyle='#dca663';c.lineWidth=5;c.beginPath();c.moveTo(250,695);c.lineTo(250+70*(1-amount),695);c.stroke();}
 if(g.knockedOut){const [sx,sy]=g.serviceSocketNative,[px,py]=g.servicePortNative,outward=Math.sign(px-sx)||1;
  c.strokeStyle='#17242b';c.lineWidth=13;c.lineCap='round';c.beginPath();c.moveTo(sx,sy);c.bezierCurveTo(sx+outward*150,sy+45,px-outward*100,py-20,px,py);c.stroke();c.strokeStyle=e.neutralized?'#657477':'#9ee9df';c.lineWidth=4;c.stroke();
  c.fillStyle='#233138';c.strokeStyle='#161f25';c.lineWidth=5;c.beginPath();c.rect(px-22,py-17,44,34);c.fill();c.stroke();c.fillStyle='#d7c8a7';c.beginPath();c.rect(px-18,py-13,36,26);c.fill();c.stroke();
 }c.restore();drawLunarPennants(c,image,g,true);koStars(c,g);
 if(e.firePose>0&&!g.knockedOut){c.save();c.translate(g.muzzle.x,g.muzzle.y);c.rotate(Math.atan2(g.muzzleDirection.y,g.muzzleDirection.x));c.scale(scale,scale);c.globalAlpha*=clamp(e.firePose/.14);c.fillStyle='#ffe6a6';c.strokeStyle='#405052';c.lineWidth=.8;c.beginPath();polygon(c,[[0,-1.8],[5,-4],[6,-1.6],[13,0],[6,1.6],[5,4],[0,1.8]]);c.fill();c.stroke();c.restore();}
 return g;
}
