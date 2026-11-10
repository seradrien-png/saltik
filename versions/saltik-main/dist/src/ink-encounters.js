import {drawBossAssault,bossAssaultPodPose} from './boss-assault-art.js';
import {bossGeometry,bossCannonWarningProgress} from './boss-tank.js';
import {drawInkSaltik,inkSaltikGeometry,INK_SALTIK_CROP,INK_SALTIK_ANCHOR,INK_SALTIK_PARTS} from './ink-saltik.js';
import {drawInkEnemySaltik,inkEnemySaltikGeometry,INK_ENEMY_SALTIK_HEIGHT} from './ink-enemy-saltik.js';
import {inkFlash} from './ink-actors.js';
import {plantInkWheel} from './ink-leg-support.js';
import {drawInkPlayerPods} from './ink-pods.js';

const INK='#181815',PAPER='#f0e3c9',GRAY='#b9b1a4',TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>n*n*(3-2*n),lerp=(a,b,t)=>a+(b-a)*t;
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
// Pastel Bastion keeps the measured 1774 × 887 V1 hull envelope. The closed
// cassette and flush front hatch are painted into that native illustration.
// Only moving / broken parts come from the new 1536 × 1024 native sheet.
export const INK_BOSS_FRAME=Object.freeze({crop:[30,50,1720,788],anchor:[852,838],scale:370/1720,split:416});
export const INK_BOSS_PARTS=Object.freeze({
 launcher:{box:[565,140,437,237],struts:[663,348,170,29],foot:[555,374,463,124],anchor:[853,498],mouth:[615,195],guideWidth:56.4,scale:.2},
 ruined:{crop:[1090,211,422,209],anchor:[1330,420]},
 hatchSource:[470,512],
 hatches:[
  {crop:[81,731,384,176],anchor:[273,907]},
  {crop:[578,615,403,295],anchor:[779,910]},
  {crop:[1105,719,403,191],anchor:[1306,910]},
 ],
});
const BARREL_PIVOT=[789,324],BARREL_MOUTH=[130,324],UPPER_MOUTH=[125,176];
const BARREL_POLYGON=[[64,97],[851,97],[851,410],[64,410]];
const HATCH_LID_POLYGON=[[685,628],[738,614],[971,667],[974,693],[932,754],[753,725],[716,693]];
const HATCH_HANDLES=[[747,641],[856,659]];
const BREACH_ROOF_GUN={pivot:[842,413],muzzle:[1234,264],polygon:[[593,64],[707,37],[805,33],[890,57],[932,93],[966,132],[1003,166],[1034,209],[1139,213],[1158,198],[1206,188],[1242,191],[1269,207],[1284,237],[1287,284],[1276,313],[1253,333],[1218,340],[1172,331],[1144,312],[1040,317],[1012,330],[977,333],[935,367],[901,397],[866,426],[772,426],[704,405],[645,366],[603,309],[576,235],[564,170]]};
const HATCH_APERTURE=[[1212,775],[1430,788],[1401,854],[1210,835]];
const NATIVE_HAND_POINTS=[[870,1010],[1080,995]];
const POD_SHOULDER_POLYGON=[[1301,199],[1400,194],[1484,209],[1534,238],[1547,345],[1503,377],[1317,355],[1301,329]];
function polygon(c,points){c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();}
function rotate(point,pivot,angle){const x=point[0]-pivot[0],y=point[1]-pivot[1],co=Math.cos(angle),si=Math.sin(angle);return[pivot[0]+x*co-y*si,pivot[1]+x*si+y*co];}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function nativePart(c,image,part,x,y,k){const [sx,sy,w,h]=part.crop,[ax,ay]=part.anchor;c.drawImage(image,sx,sy,w,h,x+(sx-ax)*k,y+(sy-ay)*k,w*k,h*k);}

export function inkBossGeometry(b,{camera=0}={}){
 const physical=bossGeometry(b),k=INK_BOSS_FRAME.scale,[ax,ay]=INK_BOSS_FRAME.anchor;
 const x=b.x-camera,y=b.y,pivot={x:physical.turretPivot.x-camera,y:physical.turretPivot.y};
 const turretOffset={x:-173-(BARREL_MOUTH[0]-ax)*k,y:-100-(BARREL_MOUTH[1]-ay)*k};
 const barrelScaleX=Math.max(.18,Math.abs(Math.cos(finite(b.turretSpin))));
 const barrelAngle=b.breached?.3:0;
 const sourcePoint=([px,py])=>({x:x+(px-ax)*k,y:y+(py-ay)*k});
 const turretPoint=point=>{const p=sourcePoint(point);return{x:pivot.x+(p.x+turretOffset.x-pivot.x)*barrelScaleX,y:p.y+turretOffset.y};};
 const rawMouth=turretPoint(rotate(BARREL_MOUTH,BARREL_PIVOT,barrelAngle));
 const muzzle={x:physical.muzzle.x-camera,y:physical.muzzle.y};
 const barrelOffset={x:muzzle.x-rawMouth.x,y:muzzle.y-rawMouth.y};
 const barrelPoint=point=>{const p=turretPoint(rotate(point,BARREL_PIVOT,barrelAngle));return{x:p.x+barrelOffset.x,y:p.y+barrelOffset.y};};
 return{...physical,x,y,k,pivot,sourcePoint,turretPoint,turretOffset,barrelScaleX,barrelAngle,barrelOffset,barrelPoint,muzzle,upperMuzzle:barrelPoint(UPPER_MOUTH)};
}

export function inkBossPodGeometry(b,{camera=0,breach=null}={}){
 const physical=bossGeometry(b),part=INK_BOSS_PARTS.launcher,k=part.scale;
 const mount={x:physical.podMount.x-camera,y:physical.podMount.y};
 const pulling=breach?.kind==='pod'&&['qte','tear'].includes(breach.phase);
 const raise=pulling?0:clamp(finite(b.podRaise));
 const muzzle={x:physical.podMuzzle.x-camera,y:physical.podMuzzle.y};
 const v=pulling?inkBreachVisual(breach,b,{camera}):null,tear=pulling&&breach.phase==='tear'?smooth(clamp(finite(breach.elapsed)/.42)):0;
 const pull=v?.effort??0;
 const displayMuzzle=pulling?{x:mount.x-39-pull*5-tear*16,y:mount.y-6+pull*7-tear*30}:muzzle;
 let box={x:displayMuzzle.x+(part.box[0]-part.mouth[0])*k,y:displayMuzzle.y+(part.box[1]-part.mouth[1])*k,w:part.box[2]*k,h:part.box[3]*k};
 if(b.assaultArt&&pulling)box=bossAssaultPodPose(b,{camera,breach}).box;
 // A wide native armored sleeve joins the cassette to the actual shoulder.
 // There is no extra pedestal in the closed state: that state is the tank.
 const shoulder={x:mount.x+26,y:b.y-(pulling?90:111)},strutBottom=shoulder.y+(part.foot[1]-part.anchor[1])*k+3;
 const strutTop=pulling&&breach.phase==='tear'?Math.max(box.y+box.h-3,strutBottom-14):box.y+box.h-3;
 const guide={x:mount.x-21,y:strutTop,w:part.guideWidth,h:Math.max(0,strutBottom-strutTop)};
 return{mount,muzzle,displayMuzzle,raise,k,box,shoulder,guide,boxShift:box.y-mount.y,strutTop,strutHeight:Math.max(.1,guide.h),
  visible:pulling||raise>0||b.podPhase==='firing',ruined:!!b.podDestroyed||b.podPhase==='destroyed'};
}

export function inkBreachVisual(q,b,{camera=0}={}){
 if(!q||!b)return null;
 const active=q.phase==='qte'&&finite(q.effortsCompleted)<finite(q.taps);
 const effort=active?Math.sin(Math.PI*clamp(finite(q.effortElapsed)/.32)):0;
 const shots=finite(q.shotsFired),since=shots?finite(q.elapsed)-(.1+(shots-1)*.2):Infinity;
 const tearing=q.phase==='tear',broken=b.breached||['fire','eject','return'].includes(q.phase);
 return{kind:q.kind??'hull',phase:q.phase,effort,
  paintsPlayer:['qte','tear','fire'].includes(q.phase)||q.kind!=='pod'&&q.phase==='eject',
  hatchFrame:broken||tearing?2:finite(q.taps)>0?1:0,
  recoil:q.kind==='pod'&&q.phase==='qte'?clamp(1-finite(q.elapsed)/.15):q.phase==='fire'?clamp(1-since/.15):0,shot:shots,
  shotFlash:q.kind==='pod'?q.phase==='qte'&&finite(q.elapsed)<.12:q.phase==='fire'&&since>=0&&since<.085,
  x:finite(q.deckX,q.x)-camera,y:finite(q.deckY,q.y),
  hatch:b.assaultArt?{x:b.x-camera-60,y:b.y-122}:{x:b.x-camera+(INK_BOSS_PARTS.hatchSource[0]-INK_BOSS_FRAME.anchor[0])*INK_BOSS_FRAME.scale,y:b.y+(INK_BOSS_PARTS.hatchSource[1]-INK_BOSS_FRAME.anchor[1])*INK_BOSS_FRAME.scale},
 };
}

function chargeMarks(c,b,g,camera,time){
 if(b.chargePhase==='telegraph'){
  const end=finite(b.chargeTargetX,b.x-400)-camera,start=g.front.x-camera,ground=b.y-9;
  c.save();c.globalAlpha=.55+.25*Math.sin(time*14)**2;c.strokeStyle=INK;c.lineWidth=2;c.setLineDash([9,9]);
  c.beginPath();c.moveTo(start,ground);c.lineTo(end,ground);c.stroke();c.setLineDash([]);
  for(let x=start-32;x>end;x-=46){c.beginPath();c.moveTo(x+6,ground-6);c.lineTo(x-4,ground);c.lineTo(x+6,ground+6);c.stroke();}c.restore();
 }else if(b.chargePhase==='charge'){
  for(let i=0;i<5;i++){const drift=(time*105+i*19)%100;oval(c,g.hull.x+g.hull.w-camera+drift,b.y-8-i%2*8,8+i*2,3+i*.5,GRAY+'88');}
 }
}
function turretTransform(c,g){
 c.translate(g.pivot.x,g.pivot.y);c.scale(g.barrelScaleX,1);c.translate(-g.pivot.x,-g.pivot.y);
 c.translate(g.x+g.turretOffset.x,g.y+g.turretOffset.y);c.scale(g.k,g.k);c.translate(-INK_BOSS_FRAME.anchor[0],-INK_BOSS_FRAME.anchor[1]);
}
function drawLauncher(c,image,b,{camera=0,breach=null,time=0}={}){
 if(!image)return;
 const g=inkBossPodGeometry(b,{camera,breach}),p=INK_BOSS_PARTS.launcher;
 if(g.ruined){nativePart(c,image,INK_BOSS_PARTS.ruined,b.x-camera+126,b.y-100,.16);return;}
 if(!g.visible)return;
 const [sx,sy,sw,sh]=p.struts;
 if(g.guide.h>0)c.drawImage(image,sx,sy,sw,sh,g.guide.x,g.guide.y,g.guide.w,g.guide.h);
 const [bx,by,bw,bh]=p.box;
 c.drawImage(image,bx,by,bw,bh,g.box.x,g.box.y,g.box.w,g.box.h);
 // The native shoulder remains fixed while the cassette lifts or tears away.
 if(b.podFlash>0)inkFlash(c,g.displayMuzzle,Math.PI,1.4);
}

function drawAssaultHatch(c,parts,b,{camera,breach}){
 if(!parts)return;
 const staged=inkBreachVisual(breach,b,{camera}),frame=b.breached?2:staged?.kind==='hull'?staged.hatchFrame:0;
 if(!frame)return;
 const hatch=b.assaultArt?{x:b.x-camera-60,y:b.y-122}:inkBossGeometry(b,{camera}).sourcePoint(INK_BOSS_PARTS.hatchSource);
 const lid=inkBreachLidGeometry(breach,b,{camera});
 if(frame===1&&lid){
  c.save();c.beginPath();c.rect(-100000,-100000,200000,200000);polygon(c,HATCH_LID_POLYGON.map(lid.restPoint));c.clip('evenodd');
  nativePart(c,parts,INK_BOSS_PARTS.hatches[1],hatch.x,hatch.y,.16);c.restore();drawBreachLid(c,parts,lid);
 }else nativePart(c,parts,INK_BOSS_PARTS.hatches[frame],hatch.x,hatch.y,.16);
}

export function drawInkBossTank(c,images,b,{camera=0,time=0,breach=null}={}){
 if(b&&images['boss-assault-atlas']){
  if(b.hp>0)chargeMarks(c,b,bossGeometry(b),camera,time);
  const painted=drawBossAssault(c,images['boss-assault-atlas'],b,{camera,time,breach});
  if(b.hp>0)drawAssaultHatch(c,images['ink-boss-parts'],b,{camera,breach});
  return painted;
 }
 if(!b||b.hp<=0&&!breach||!images['ink-boss'])return false;
 const g=inkBossGeometry(b,{camera}),image=images['ink-boss'],parts=images['ink-boss-parts'];
 oval(c,g.x,b.y-2,168,8,INK+'66');chargeMarks(c,b,g,camera,time);
 c.save();if(b.hit>0)c.globalAlpha*=.72;
 c.save();c.translate(g.x,g.y);c.scale(g.k,g.k);c.translate(-852,-838);
 c.drawImage(image,30,416,1720,422,30,416,1720,422);c.restore();
 c.save();turretTransform(c,g);c.beginPath();polygon(c,[[30,50],[1750,50],[1750,416],[30,416]]);polygon(c,BARREL_POLYGON);if(b.podDestroyed||b.podPhase==='destroyed'||breach?.kind==='pod'&&['qte','tear'].includes(breach.phase))polygon(c,POD_SHOULDER_POLYGON);c.clip('evenodd');
 c.drawImage(image,30,50,1720,366,30,50,1720,366);c.restore();
 c.save();c.translate(g.barrelOffset.x,g.barrelOffset.y);turretTransform(c,g);
 c.translate(...BARREL_PIVOT);c.rotate(g.barrelAngle);c.translate(-BARREL_PIVOT[0],-BARREL_PIVOT[1]);
 c.beginPath();polygon(c,BARREL_POLYGON);c.clip();c.drawImage(image,30,50,1720,366,30,50,1720,366);c.restore();
 if(parts){
  const staged=inkBreachVisual(breach,b,{camera}),frame=b.breached?2:staged?.kind==='hull'?staged.hatchFrame:0;
  // The closed hatch is already one flush native armor face. Opening and
  // tearing replace that face with the same sheet's rim and mechanical hole.
  if(frame){
   const hatch=g.sourcePoint(INK_BOSS_PARTS.hatchSource),lid=inkBreachLidGeometry(breach,b,{camera});
   if(frame===1&&lid){
    c.save();c.beginPath();c.rect(-100000,-100000,200000,200000);polygon(c,HATCH_LID_POLYGON.map(lid.restPoint));c.clip('evenodd');nativePart(c,parts,INK_BOSS_PARTS.hatches[1],hatch.x,hatch.y,.16);c.restore();
    drawBreachLid(c,parts,lid);
   }else nativePart(c,parts,INK_BOSS_PARTS.hatches[frame],hatch.x,hatch.y,.16);
  }
 }
 c.restore();
 if(parts&&breach?.kind==='pod'&&['qte','tear'].includes(breach.phase)){
  const g=inkBossPodGeometry(b,{camera,breach}),part=INK_BOSS_PARTS.launcher;nativePart(c,parts,{crop:part.foot,anchor:part.anchor},g.shoulder.x,g.shoulder.y,part.scale);
 }
 drawLauncher(c,parts,b,{camera,time,breach});
 const warning=bossCannonWarningProgress(b);
 if(warning>0){c.save();c.globalAlpha=warning*.65;c.strokeStyle=INK;c.lineWidth=1.5;c.setLineDash([10,12]);c.beginPath();c.moveTo(g.muzzle.x,g.muzzle.y);c.lineTo(g.muzzle.x-900,g.muzzle.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(g.muzzle.x,g.muzzle.y,7+warning*7,0,TAU);c.stroke();c.restore();}
 if(b.cannonRecoil>.55){inkFlash(c,g.muzzle,Math.PI,1.5);inkFlash(c,g.upperMuzzle,Math.PI,1.2);}
 return true;
}

// Native handles, claws and roof samples drive the staging independently of
// gameplay. The player never borrows a defense pose to pull on the tank.
export function inkBreachLidGeometry(q,b,{camera=0}={}){
 if(!q||q.kind==='pod'||!['qte','tear','fire'].includes(q.phase)||q.phase==='qte'&&!finite(q.taps))return null;
 const v=inkBreachVisual(q,b,{camera}),part=INK_BOSS_PARTS.hatches[1],tear=q.phase==='fire'?1:q.phase==='tear'?smooth(clamp(finite(q.elapsed)/.42)):0;
 // The torn bottom corner remains caught in the existing hatch rim. The same
 // painted lid folds back beside the opening, rather than disappearing at fire.
 const pivot=[779,910],release=q.phase==='fire'||q.phase==='tear'&&finite(q.elapsed)/.42>.25;
 const lift=q.phase==='qte'?v.effort*7:tear*55,drift=q.phase==='qte'?-v.effort*4:-tear*22,angle=q.phase==='qte'?-v.effort*.035:-tear*.65;
 const restPoint=point=>[v.hatch.x+(point[0]-part.anchor[0])*.16,v.hatch.y+(point[1]-part.anchor[1])*.16];
 const point=source=>{const rotated=rotate(source,pivot,angle),p=restPoint(rotated);return{x:p[0]+drift,y:p[1]-lift};};
 return{part,pivot,angle,lift,drift,hatch:v.hatch,restPoint,point,hinge:point(pivot),handles:HATCH_HANDLES.map(point),release};
}
function drawBreachLid(c,image,lid){
 c.save();c.translate(lid.hatch.x+lid.drift,lid.hatch.y-lid.lift);c.scale(.16,.16);c.translate(-lid.part.anchor[0],-lid.part.anchor[1]);
 c.translate(...lid.pivot);c.rotate(lid.angle);c.translate(-lid.pivot[0],-lid.pivot[1]);c.beginPath();polygon(c,HATCH_LID_POLYGON);c.clip();c.drawImage(image,0,0);c.restore();
}
export function nativeReach(part,point,target,geometry,index){
 const pivot=geometry.sourcePoint(part.pivot),wx=target.x-pivot.x,wy=target.y-pivot.y,co=Math.cos(geometry.tilt),si=Math.sin(geometry.tilt);
 const dx=(wx*co+wy*si)/(geometry.k*geometry.orientation),dy=(-wx*si+wy*co)/geometry.k;
 const hx=point[0]-part.pivot[0],hy=point[1]-part.pivot[1],radius=Math.hypot(dx,dy);
 // Claws remain rigid; only the original short forearm compresses or extends.
 const extension=clamp(Math.sqrt(Math.max(0,radius*radius-hx*hx))-hy,index?-44:-65,90);
 const rotation=Math.atan2(dy,dx)-Math.atan2(hy+extension,hx);
 return gripArm({...part,wristY:index?936:957,stretchY:index?880:885},rotation,extension,geometry);
}
function bossSupportPose(b,p){
 const {roof,turretRoof}=bossGeometry(b),at=x=>x>=turretRoof.x1&&x<=turretRoof.x2?turretRoof.y:x>=roof.x1&&x<=roof.x2?roof.y:null;
 return{tilt:0,heave:0,surface:{x:p.x-100,step:1,heights:Array.from({length:201},(_,i)=>at(p.x-100+i))}};
}
function breachActorGeometry(p,b,{camera=0,lean=0,recoil=0,gripTargets=null,gripWeight=1}={}){
 let staged={...p,supportPose:null,supportY:p.y,tilt:-.14*lean,motionLean:0};
 let geo=inkSaltikGeometry(staged,{camera,time:0});
 if(gripTargets)for(let pass=0;pass<18;pass++){
  let dx=0,dy=0;
  for(let index=0;index<2;index++){
   const part=INK_SALTIK_PARTS.arms[index],hand=NATIVE_HAND_POINTS[index],pivot=geo.sourcePoint(part.pivot),wx=gripTargets[index].x-pivot.x,wy=gripTargets[index].y-pivot.y,distance=Math.hypot(wx,wy),hx=hand[0]-part.pivot[0],hy=hand[1]-part.pivot[1];
   const reach=clamp(distance,Math.hypot(hx,hy+(index?-44:-65))*geo.k+.001,Math.hypot(hx,hy+88)*geo.k-.001),shift=distance?1-reach/distance:0;dx+=wx*shift*.5;dy+=wy*shift*.5;
  }
  staged={...staged,x:staged.x+dx,y:staged.y+dy,supportPose:null};geo=inkSaltikGeometry(staged,{camera,time:0});
 }
 if(gripTargets&&gripWeight<1){staged={...staged,x:lerp(p.x,staged.x,gripWeight),y:lerp(p.y,staged.y,gripWeight)};geo=inkSaltikGeometry(staged,{camera,time:0});}
 const {roof,turretRoof}=bossGeometry(b),floor=x=>{x+=camera;return x>=turretRoof.x1&&x<=turretRoof.x2?turretRoof.y:x>=roof.x1&&x<=roof.x2?roof.y:NaN;};
 const co=Math.cos(geo.tilt),si=Math.sin(geo.tilt),legs=geo.legs.map(part=>{
  const native=geo.sourcePoint(part.foot),plant=plantInkWheel(native,{k:geo.k,cos:co,sin:si,orientation:geo.orientation,floor,maxOffset:420});
  return {...part,...plant,stretch:1+plant.offset/(part.wheelTop-part.hinge),contact:geo.sourcePoint([part.foot[0]+plant.roll,part.foot[1]+plant.offset])};
 });
 return {...geo,legs};
}
export function inkBreachPoseGeometry(q,b,{camera=0,time=0,player={}}={}){
 const v=inkBreachVisual(q,b,{camera});if(!v?.paintsPlayer)return null;
 if(q.phase==='eject')return breachEjectPose(q,b,{camera,time,player});
 const tearing=q.phase==='tear',tear=tearing?smooth(clamp(finite(q.elapsed)/.42)):0,pod=q.kind==='pod';
 const effort=tearing?Math.sin(Math.PI*clamp(finite(q.elapsed)/.42)):v.effort,lean=pod?0:q.phase==='fire'?1:tear;
 const p={...player,x:finite(q.deckX,q.x)+(pod?20:b.assaultArt?0:95)-(!pod?v.recoil*.45:0),y:finite(q.deckY,q.y),supportY:finite(q.deckY,q.y),supportClearance:undefined,tilt:0,motionLean:0,motionHeave:0,vx:0,vy:0,
  dir:pod?1:-1,turn:null,onGround:true,crouching:!pod,landingCompression:effort*.45+v.recoil*.25,jumpCompression:0,preJump:0,
  invulnerable:0,muzzle:0,mirvFlash:0,homingFlash:0,cannonRecoil:0,cannonElevation:0,melee:null,evasion:null,deflect:null};
 p.supportPose=bossSupportPose(b,p);
 const lid=inkBreachLidGeometry(q,b,{camera}),launcher=pod?inkBossPodGeometry(b,{camera,breach:q}):null;
 const gripWeight=tearing?1-smooth(clamp((finite(q.elapsed)/.42-.25)/.75)):q.phase==='fire'?0:1;
 const hullTargets=lid&&gripWeight>0?lid.handles:null;
 const geo=breachActorGeometry(p,b,{camera,lean,recoil:!pod?v.recoil:0,gripTargets:hullTargets,gripWeight});
 let targets;
 if(pod&&(q.phase==='fire'||tear>.2))targets=[{x:geo.sourcePoint(INK_SALTIK_PARTS.arms[0].pivot).x+16,y:geo.sourcePoint(INK_SALTIK_PARTS.arms[0].pivot).y-15},{x:geo.sourcePoint(INK_SALTIK_PARTS.arms[1].pivot).x+14,y:geo.sourcePoint(INK_SALTIK_PARTS.arms[1].pivot).y-10}];
 else if(pod)targets=[{x:launcher.box.x+26,y:launcher.box.y+8},{x:launcher.box.x+55,y:launcher.box.y+11}];
 else if(lid&&!lid.release)targets=hullTargets;
 else if(tearing||q.phase==='fire')targets=[{x:geo.sourcePoint(INK_SALTIK_PARTS.arms[0].pivot).x-7,y:geo.sourcePoint(INK_SALTIK_PARTS.arms[0].pivot).y-22},{x:geo.sourcePoint(INK_SALTIK_PARTS.arms[1].pivot).x-11,y:geo.sourcePoint(INK_SALTIK_PARTS.arms[1].pivot).y-18}];
 else targets=[{x:v.hatch.x-16,y:v.hatch.y-5},{x:v.hatch.x+15,y:v.hatch.y-4}];
 if(!pod&&tearing&&lid?.release)targets=targets.map((point,i)=>({x:lerp(point.x,lid.handles[i].x,gripWeight),y:lerp(point.y,lid.handles[i].y,gripWeight)}));
 if(!pod&&lid?.release)targets=targets.map((target,index)=>{const part=INK_SALTIK_PARTS.arms[index],pivot=geo.sourcePoint(part.pivot),hand=NATIVE_HAND_POINTS[index],hx=hand[0]-part.pivot[0],hy=hand[1]-part.pivot[1],distance=Math.hypot(target.x-pivot.x,target.y-pivot.y),radius=clamp(distance,Math.hypot(hx,hy+(index?-43:-64))*geo.k,Math.hypot(hx,hy+88)*geo.k);return{x:pivot.x+(target.x-pivot.x)*radius/(distance||1),y:pivot.y+(target.y-pivot.y)*radius/(distance||1)};});
 const arms=INK_SALTIK_PARTS.arms.map((part,index)=>nativeReach(part,NATIVE_HAND_POINTS[index],targets[index],geo,index));
 const target=pod?{x:launcher.box.x+22,y:launcher.box.y+launcher.box.h*.6}:{x:v.hatch.x-2,y:v.hatch.y-17};
 const part=pod?INK_SALTIK_PARTS.cannon:BREACH_ROOF_GUN,mount=geo.sourcePoint(part.pivot),nativeAim=Math.atan2(part.muzzle[1]-part.pivot[1],part.muzzle[0]-part.pivot[0]),recoil=22*v.recoil;
 const localAim=Math.atan2((target.y-mount.y)*Math.cos(geo.tilt)-(target.x-mount.x)*Math.sin(geo.tilt),((target.x-mount.x)*Math.cos(geo.tilt)+(target.y-mount.y)*Math.sin(geo.tilt))/geo.orientation);
 const rotation=pod?(v.shotFlash?localAim-nativeAim:0):(localAim-nativeAim)*lean;
 // Recoil is a short translation along the measured bore, in native space.
 const axial=point=>[point[0]-Math.cos(nativeAim)*recoil,point[1]-Math.sin(nativeAim)*recoil];
 const pivot=geo.sourcePoint(rotate(axial(part.pivot),part.pivot,rotation)),muzzle=geo.sourcePoint(rotate(axial(part.muzzle),part.pivot,rotation)),aim=Math.atan2(muzzle.y-pivot.y,muzzle.x-pivot.x);

 const aperture=pod?null:HATCH_APERTURE.map(([x,y])=>[v.hatch.x+(x-1306)*.16,v.hatch.y+(y-910)*.16]);
 return{v,p,geo,lid,launcher,effort,tear,arms,targets,handPoints:arms.map((arm,index)=>arm.handPoint(NATIVE_HAND_POINTS[index])),fire:{target,pivot,aim,recoil,rotation,muzzle,aperture,part},shooting:q.phase==='fire'&&!pod||pod&&v.shotFlash};
}
function breachEjectPose(q,b,{camera,time,player}){
 const start=inkBreachPoseGeometry({...q,phase:'fire',elapsed:1.25,shotsFired:6},b,{camera,time,player}),u=smooth(clamp(finite(q.elapsed)/.4));
 const p={...start.p,x:finite(player.x,finite(q.x,q.deckX)),y:finite(player.y,finite(q.y,q.deckY)),crouching:false,onGround:false,landingCompression:0,supportPose:null,supportY:undefined};
 const end=inkSaltikGeometry(p,{camera,time:0}),x=end.x+(start.geo.x-(finite(q.deckX,q.x)-camera))*(1-u),y=end.y+(start.geo.y-finite(q.deckY,q.y))*(1-u),tilt=lerp(start.geo.tilt,end.tilt,u),heave=lerp(start.geo.heave,end.heave,u),bodyDrop=lerp(start.geo.bodyDrop,end.bodyDrop,u),co=Math.cos(tilt),si=Math.sin(tilt);
 const sourcePoint=([px,py])=>{const xx=(px-INK_SALTIK_ANCHOR[0])*end.k*end.orientation,yy=(py-INK_SALTIK_ANCHOR[1])*end.k;return{x:x+xx*co-yy*si,y:y+heave+bodyDrop+xx*si+yy*co};};
 const legs=start.geo.legs.map((part,index)=>{const rest=end.legs[index],offset=lerp(part.offset,rest.offset,u),roll=lerp(part.roll,rest.roll,u),rotation=lerp(finite(part.rotation),0,u),pivot=part.pivot??[part.foot[0],part.hinge];return{...part,pivot,rotation,offset,roll,stretch:1+offset/(part.wheelTop-part.hinge),grounded:u===0&&part.grounded,contact:sourcePoint(rotate([part.foot[0]+roll,part.foot[1]+offset],pivot,rotation))};});
 const geo={...end,x,y,tilt,heave,bodyDrop,sourcePoint,legs},arms=start.arms.map(arm=>gripArm(arm,lerp(arm.rotation,0,u),lerp(arm.extension,0,u),geo)),handPoints=arms.map((arm,index)=>arm.handPoint(NATIVE_HAND_POINTS[index]));
 const part=start.fire.part??INK_SALTIK_PARTS.cannon,rotation=start.fire.rotation*(1-u),pivot=sourcePoint(part.pivot),muzzle=sourcePoint(rotate(part.muzzle,part.pivot,rotation));
 return{...start,v:inkBreachVisual(q,b,{camera}),p,geo,arms,handPoints,targets:handPoints,effort:0,shooting:false,fire:{...start.fire,rotation,pivot,muzzle,recoil:0,aim:Math.atan2(muzzle.y-pivot.y,muzzle.x-pivot.x)}};
}
function drawBreachActor(c,image,g,{camera=0,time=0}={}){
 const {geo,arms,shooting,fire}=g,draw=()=>c.drawImage(image,...INK_SALTIK_CROP,...INK_SALTIK_CROP);
 c.save();c.imageSmoothingEnabled=true;c.translate(geo.x,geo.y+geo.heave+geo.bodyDrop);c.rotate(geo.tilt);c.scale(geo.k*geo.orientation,geo.k);c.translate(-INK_SALTIK_ANCHOR[0],-INK_SALTIK_ANCHOR[1]);
 // Draw the native pieces once. Clipping a second whole actor would leave
 // suspension pixels outside the resting masks whenever a wheel overhangs.
 for(const leg of geo.legs){
  if(Number.isFinite(leg.rotation)){
   c.save();c.translate(...leg.pivot);c.rotate(leg.rotation);c.translate(-leg.pivot[0],-leg.pivot[1]);
   c.save();c.translate(0,leg.hinge);c.scale(1,leg.stretch);c.translate(0,-leg.hinge);c.beginPath();polygon(c,leg.strutPolygon);c.clip();draw();c.restore();
   c.save();c.translate(0,leg.offset);c.beginPath();polygon(c,leg.wheelPolygon);c.clip();draw();c.restore();c.restore();continue;
  }
  const loose=!leg.grounded,offset=loose?-65-g.effort*15:leg.offset,roll=loose?(leg.id==='front'?-22:22):leg.roll;
  c.save();c.translate(0,leg.hinge);c.transform(1,0,roll/(leg.wheelTop-leg.hinge),1+offset/(leg.wheelTop-leg.hinge),0,0);c.translate(0,-leg.hinge);c.beginPath();polygon(c,leg.strutPolygon);c.clip();draw();c.restore();
  c.save();c.translate(roll,offset);c.beginPath();polygon(c,leg.wheelPolygon);c.clip();draw();c.restore();
 }
 c.save();c.beginPath();const [x,y,w,h]=INK_SALTIK_CROP;c.rect(x,y,w,h);
 for(const part of [...geo.legs,...arms,fire.part??INK_SALTIK_PARTS.cannon])polygon(c,part.polygon);
 c.clip('evenodd');draw();c.restore();
 const part=fire.part??INK_SALTIK_PARTS.cannon,nativeAim=Math.atan2(part.muzzle[1]-part.pivot[1],part.muzzle[0]-part.pivot[0]);
 c.save();c.translate(...part.pivot);c.rotate(fire.rotation);c.translate(-part.pivot[0]-Math.cos(nativeAim)*fire.recoil,-part.pivot[1]-Math.sin(nativeAim)*fire.recoil);c.beginPath();polygon(c,part.polygon);c.clip();draw();c.restore();
 for(const arm of arms)drawGripArm(c,image,INK_SALTIK_CROP,arm);
 c.restore();
 drawInkPlayerPods(c,g.p,geo,{time});
 if(shooting&&g.v.shotFlash){
  c.save();if(fire.aperture){c.beginPath();polygon(c,fire.aperture);c.clip();}
  c.lineCap='round';c.strokeStyle='#e99d79';c.lineWidth=5;c.beginPath();c.moveTo(fire.muzzle.x,fire.muzzle.y);c.lineTo(fire.target.x,fire.target.y);c.stroke();c.strokeStyle='#fff0c9';c.lineWidth=2;c.stroke();
  inkFlash(c,fire.muzzle,fire.aim,fire.aperture ? .55 : .95);inkFlash(c,fire.target,fire.aim,fire.aperture ? .42 : .75);c.restore();
 }
}

export function drawInkBossBreach(c,images,q,b,{camera=0,time=0,player={}}={}){
 const g=inkBreachPoseGeometry(q,b,{camera,time,player});if(!g||!images['ink-saltik'])return false;
 if(['tear','fire','eject'].includes(q.phase)&&g.lid&&!g.lid.release&&images['ink-boss-parts'])drawBreachLid(c,images['ink-boss-parts'],g.lid);
 drawBreachActor(c,images['ink-saltik'],g,{camera,time});
 if(g.effort>.2){
  const targets=q.kind==='pod'?g.targets:g.lid?.handles??g.targets;c.save();c.strokeStyle=INK;c.lineWidth=1.5;
  for(const target of targets)for(let i=0;i<3;i++){const angle=-2.8+i*.6;c.beginPath();c.moveTo(target.x+Math.cos(angle)*8,target.y+Math.sin(angle)*8);c.lineTo(target.x+Math.cos(angle)*(11+g.effort*6),target.y+Math.sin(angle)*(11+g.effort*6));c.stroke();}c.restore();
 }
 return true;
}

export function inkDuelVisual(q,{camera=0,cameraY=0,width=1280,height=720}={}){
 if(!q)return null;
 const phase=q.phase,elapsed=finite(q.elapsed),world=['engage','qte'].includes(phase);
 const active=phase==='qte'&&finite(q.effortsCompleted)<finite(q.taps),effort=active?Math.sin(Math.PI*clamp(finite(q.effortElapsed)/.24)):0;
 const dir=q.dir===-1?-1:1,crackX=width*.56,crackY=height*.44,targetHeight=height*.64,targetScale=targetHeight/INK_ENEMY_SALTIK_HEIGHT,targetFoot=crackY+targetHeight*.5;
 const result={world,effort,dir,crackX,crackY,cracks:0,screen:null};
 if(world){const gap=115,lean=effort*1.5;result.player={x:q.x-dir*(gap*.5+lean),y:q.playerY};result.enemy={x:q.x+dir*(gap*.5-lean),y:q.enemyY};}
 else if(phase==='throw'){
  const u=smooth(clamp(elapsed/.48));result.screen={x:lerp(q.enemyX-camera,crackX,u),y:lerp(q.enemyY+cameraY,targetFoot,u),scale:lerp(1,targetScale,u),angle:-.12*Math.sin(u*Math.PI)*dir,alpha:1};
 }else if(phase==='impact'){
  const u=clamp(elapsed/.18);result.screen={x:crackX+Math.sin(u*Math.PI*4)*4*(1-u),y:targetFoot,scale:targetScale*(1+.045*Math.sin(u*Math.PI)),angle:0,alpha:1};result.cracks=1;
 }else if(phase==='slide'){
  const u=clamp(elapsed/.95),fall=smooth(u);result.screen={x:crackX+dir*fall*35,y:targetFoot+fall*(height+targetHeight*.65),scale:targetScale*(1-.12*fall),angle:dir*fall*.2,alpha:1-.15*u};result.cracks=1-.25*u;
 }else if(phase==='recover')result.cracks=.75*(1-clamp(elapsed/.2));
 return result;
}

// Only the two native lower-cabin hands move; the raised launcher struts stay put.
const DUEL_ENEMY_ARMS=[
 {pivot:[676,634],wristY:660,stretchY:642,polygon:[[657,614],[683,617],[700,631],[707,647],[729,652],[740,670],[736,689],[722,704],[704,704],[689,690],[684,670],[667,659],[655,641]]},
 {pivot:[529,636],wristY:681,stretchY:658,polygon:[[509,615],[537,617],[554,636],[566,650],[595,657],[621,673],[648,697],[651,719],[640,742],[618,750],[596,737],[574,735],[561,719],[553,696],[530,687],[514,671],[505,643]]},
];
const DUEL_ENEMY_FRONT_LEG={pivot:[762,574],foot:[909,748],polygon:[[754,540],[781,537],[814,555],[853,571],[896,613],[931,660],[956,702],[955,743],[937,767],[901,778],[864,762],[849,734],[830,713],[799,705],[776,682],[755,652],[743,615],[741,577]]};
function halfPolygon(points,y,below){
 const result=[],inside=p=>below?p[1]>=y:p[1]<=y;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ai=inside(a),bi=inside(b);if(ai)result.push(a);if(ai!==bi){const t=(y-a[1])/(b[1]-a[1]);result.push([a[0]+(b[0]-a[0])*t,y]);}}
 return result;
}
function gripArm(part,rotation,extension,geometry){
 const handPoint=point=>geometry.sourcePoint(rotate([point[0],point[1]+extension],part.pivot,rotation));
 return{...part,rotation,extension,k:geometry.k,handPoint};
}
export function inkDuelGripGeometry(q,{camera=0,player={}}={}){
 const v=inkDuelVisual(q,{camera});if(!v?.world)return null;
 const p={...player,x:v.player.x,y:v.player.y,supportY:v.player.y,supportPose:null,supportClearance:undefined,tilt:0,motionLean:0,motionHeave:0,dir:v.dir,turn:null,onGround:true,vx:0,vy:0,crouching:false,
  landingCompression:0,jumpCompression:0,preJump:0,melee:null,evasion:null,muzzle:0,mirvFlash:0,cannonRecoil:0,invulnerable:0,deflect:null};
 const e={x:v.enemy.x,y:v.enemy.y,dir:-v.dir,hp:1,podCycle:q.enemyPodCycle},pg=inkSaltikGeometry(p,{camera,time:0}),eg=inkEnemySaltikGeometry(e,0,{camera});
 const playerArms=INK_SALTIK_PARTS.arms.map((part,index)=>gripArm({...part,wristY:index?936:957,stretchY:index?880:885},index?-1.12-v.effort*.035:-.9, index?100:0,pg));
 const enemyArms=DUEL_ENEMY_ARMS.map((part,index)=>gripArm(part,index?-.4:-1-v.effort*.035,index?0:60,eg));
 return{v,p,e,pg,eg,playerArms,enemyArms,playerGrip:playerArms[1].handPoint([1080,995]),enemyGrip:enemyArms[0].handPoint([714,679])};
}
function withoutNativeParts(c,geometry,parts,draw){
 c.save();
 for(const part of parts){c.beginPath();c.rect(-100000,-100000,200000,200000);polygon(c,part.polygon.map(point=>{const p=geometry.sourcePoint(point);return[p.x,p.y];}));c.clip('evenodd');}
 draw();c.restore();
}
export function drawGripArm(c,image,crop,arm){
 const root=halfPolygon(arm.polygon,arm.stretchY,false),shaft=halfPolygon(halfPolygon(arm.polygon,arm.stretchY,true),arm.wristY,false),hand=halfPolygon(arm.polygon,arm.wristY,true);
 const draw=()=>c.drawImage(image,...crop,...crop);
 c.save();c.translate(...arm.pivot);c.rotate(arm.rotation);c.translate(-arm.pivot[0],-arm.pivot[1]);
 c.save();c.beginPath();polygon(c,root);c.clip();draw();c.restore();
 c.save();c.translate(0,arm.stretchY);c.scale(1,1+arm.extension/(arm.wristY-arm.stretchY));c.translate(0,-arm.stretchY);c.beginPath();polygon(c,shaft);c.clip();draw();c.restore();
 // Every claw is the original unscaled lower patch; only its short strut extends.
 c.save();c.translate(0,arm.extension);c.beginPath();polygon(c,hand);c.clip();draw();c.restore();c.restore();
}
function drawTuckedLeg(c,image,crop,part,angle){
 const foot=rotate(part.foot,part.pivot,angle),lift=part.foot[1]-foot[1];
 c.save();c.translate(0,lift);c.translate(...part.pivot);c.rotate(angle);c.translate(-part.pivot[0],-part.pivot[1]);c.beginPath();polygon(c,part.polygon);c.clip();c.drawImage(image,...crop,...crop);c.restore();
}
export function drawInkDuelWorld(c,images,q,{camera=0,time=0,player={},...viewport}={}){
 const g=inkDuelGripGeometry(q,{camera,player});if(!g||!images['ink-saltik']||!images['ink-enemy-saltik'])return false;
 const {v,p,e,pg,eg,playerArms,enemyArms}=g,front=INK_SALTIK_PARTS.legs[2];
 withoutNativeParts(c,eg,[...enemyArms,DUEL_ENEMY_FRONT_LEG],()=>drawInkEnemySaltik(c,images['ink-enemy-saltik'],e,{camera,time:0}));
 c.save();c.translate(e.x-camera,e.y);c.scale(eg.k*eg.flip,eg.k);c.translate(-eg.anchor[0],-eg.anchor[1]);
 drawTuckedLeg(c,images['ink-enemy-saltik'],eg.crop,DUEL_ENEMY_FRONT_LEG,.23);c.restore();
 withoutNativeParts(c,pg,[...playerArms,front],()=>drawInkSaltik(c,images['ink-saltik'],p,{camera,time:0}));
 c.save();c.translate(pg.x,pg.y);c.scale(pg.k*pg.orientation,pg.k);c.translate(-INK_SALTIK_ANCHOR[0],-INK_SALTIK_ANCHOR[1]);
 drawTuckedLeg(c,images['ink-saltik'],INK_SALTIK_CROP,{...front,pivot:[1144,742]},.27);
 for(const arm of playerArms)drawGripArm(c,images['ink-saltik'],INK_SALTIK_CROP,arm);c.restore();
 c.save();c.translate(e.x-camera,e.y);c.scale(eg.k*eg.flip,eg.k);c.translate(-eg.anchor[0],-eg.anchor[1]);
 for(const arm of enemyArms)drawGripArm(c,images['ink-enemy-saltik'],eg.crop,arm);c.restore();
 if(v.effort>.3){const x=(g.playerGrip.x+g.enemyGrip.x)/2,y=(g.playerGrip.y+g.enemyGrip.y)/2;c.save();c.strokeStyle=INK;c.lineWidth=1.3;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x-7+i*6,y-5);c.lineTo(x-4+i*6,y-12-v.effort*4);c.stroke();}c.restore();}
 return true;
}

export function inkGlassCrackSegments(x,y,width,height){
 const segments=[],rays=[];
 // Long fractures run all the way to the frame, with uneven twin branches
 // and short rings around the point where the native enemy hits the glass.
 for(let i=0;i<15;i++){
  const angle=i*TAU/15+.07*Math.sin(i*7.3),dx=Math.cos(angle),dy=Math.sin(angle);
  const edge=Math.min(dx>0?(width-x)/dx:dx<0?-x/dx:Infinity,dy>0?(height-y)/dy:dy<0?-y/dy:Infinity),points=[[x,y]];
  for(let j=1;j<=7;j++){const t=j/7,side=j===7?0:Math.sin(i*13+j*4.1)*Math.min(width,height)*.018*t;points.push([clamp(x+dx*edge*t-dy*side,0,width),clamp(y+dy*edge*t+dx*side,0,height)]);}
  segments.push(points);rays.push(points);
  for(const j of [2,4,5]){
   const [bx,by]=points[j],a=angle+((i+j)%2?-.45:.5),length=edge*(j===5?.19:.27);
   segments.push([[bx,by],[clamp(bx+Math.cos(a)*length*.5,0,width),clamp(by+Math.sin(a)*length*.5,0,height)],[clamp(bx+Math.cos(a+.16)*length,0,width),clamp(by+Math.sin(a+.16)*length,0,height)]]);
  }
 }
 for(const ring of [1,2])for(let i=0;i<rays.length;i++)if((i+ring)%3){const a=rays[i][ring],b=rays[(i+1)%rays.length][ring];segments.push([a,[(a[0]+b[0])*.5+Math.sin(i*9)*4,(a[1]+b[1])*.5+Math.cos(i*7)*4],b]);}
 return segments;
}
function glassCracks(c,x,y,width,height,alpha){
 if(alpha<=0)return;
 const segments=inkGlassCrackSegments(x,y,width,height);
 c.save();c.globalAlpha*=alpha;c.lineJoin='round';c.lineCap='round';
 for(const [color,lineWidth] of [[INK+'e8',3.5],[PAPER+'dd',1.15]]){c.strokeStyle=color;c.lineWidth=lineWidth;c.beginPath();for(const points of segments)points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();}c.restore();
}

export function drawInkDuelScreen(c,images,q,viewport={}){
 const v=inkDuelVisual(q,viewport);if(!v||!v.screen&&v.cracks<=0||!images['ink-enemy-saltik'])return false;
 if(v.screen){const p=v.screen;c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.globalAlpha*=p.alpha;
  drawInkEnemySaltik(c,images['ink-enemy-saltik'],{x:0,y:0,hp:1,podCycle:q.enemyPodCycle},{view:'front',scale:p.scale});c.restore();}
 glassCracks(c,v.crackX,v.crackY,viewport.width??1280,viewport.height??720,v.cracks);return true;
}
