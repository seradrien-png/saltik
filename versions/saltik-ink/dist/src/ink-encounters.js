import {bossGeometry,bossCannonWarningProgress} from './boss-tank.js';
import {drawInkSaltik,inkSaltikGeometry,INK_SALTIK_CROP,INK_SALTIK_ANCHOR,INK_SALTIK_PARTS} from './ink-saltik.js';
import {drawInkEnemySaltik,inkEnemySaltikGeometry,INK_ENEMY_SALTIK_HEIGHT} from './ink-enemy-saltik.js';
import {inkFlash} from './ink-actors.js';

const INK='#181815',PAPER='#f0e3c9',GRAY='#afa48e',TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>n*n*(3-2*n),lerp=(a,b,t)=>a+(b-a)*t;
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
// Measured native alpha edges. The main illustration is 1774 × 887;
// the separate launcher/hatch sheet is 1536 × 1024, with unequal gutters.
export const INK_BOSS_FRAME=Object.freeze({crop:[30,50,1720,788],anchor:[852,838],scale:370/1720,split:416});
export const INK_BOSS_PARTS=Object.freeze({
 launcher:{box:[532,64,485,288],struts:[737,318,226,184],foot:[747,494,264,55],anchor:[881,543],mouth:[643,180],scale:39/238},
 ruined:{crop:[1137,208,352,341],anchor:[1303,543]},
 hatches:[
  {crop:[35,708,478,233],anchor:[271,941]},
  {crop:[545,620,476,321],anchor:[783,941]},
  {crop:[1054,610,459,354],anchor:[1283,941]},
 ],
});
const BARREL_PIVOT=[789,324],BARREL_MOUTH=[130,324],UPPER_MOUTH=[125,176];
const BARREL_POLYGON=[[64,97],[851,97],[851,410],[64,410]];
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
 const displayMuzzle=pulling?{x:mount.x-39,y:mount.y-39}:muzzle;
 const boxShift=displayMuzzle.y-mount.y-(part.mouth[1]-part.anchor[1])*k;
 const strutTop=(352-part.anchor[1])*k+boxShift,strutBottom=(494-part.anchor[1])*k;
 return{mount,muzzle,displayMuzzle,raise,k,boxShift,strutTop,strutHeight:Math.max(.1,strutBottom-strutTop),ruined:!!b.podDestroyed||b.podPhase==='destroyed'};
}

export function inkBreachVisual(q,b,{camera=0}={}){
 if(!q||!b)return null;
 const active=q.phase==='qte'&&finite(q.effortsCompleted)<finite(q.taps);
 const effort=active?Math.sin(Math.PI*clamp(finite(q.effortElapsed)/.32)):0;
 const shots=finite(q.shotsFired),since=shots?finite(q.elapsed)-(.1+(shots-1)*.2):Infinity;
 const tearing=q.phase==='tear',broken=b.breached||['fire','eject','return'].includes(q.phase);
 return{kind:q.kind??'hull',phase:q.phase,effort,
  paintsPlayer:['qte','tear','fire'].includes(q.phase),
  hatchFrame:broken||tearing&&finite(q.elapsed)>.16?2:effort>.3||tearing?1:0,
  shotFlash:q.kind==='pod'?q.phase==='qte'&&finite(q.elapsed)<.12:q.phase==='fire'&&since>=0&&since<.085,
  x:finite(q.deckX,q.x)-camera,y:finite(q.deckY,q.y),
  hatch:{x:b.x-camera-60,y:b.y-78},
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
 const g=inkBossPodGeometry(b,{camera,breach}),p=INK_BOSS_PARTS.launcher,[ax,ay]=p.anchor;
 // The gameplay mount is above the sloping rear armor. Native hydraulic
 // columns and a second bolted foot join that mount to the actual turret.
 const pedestalHeight=43;
 c.drawImage(image,737,318,226,184,g.mount.x-22,g.mount.y-1,37,pedestalHeight);
 c.drawImage(image,747,494,264,55,g.mount.x-22,g.mount.y+pedestalHeight-7,43,9);
 if(g.ruined){nativePart(c,image,INK_BOSS_PARTS.ruined,g.mount.x,g.mount.y,g.k);return;}
 const [sx,sy,sw,sh]=p.struts;
 c.drawImage(image,sx,sy,sw,sh,g.mount.x+(sx-ax)*g.k,g.mount.y+g.strutTop,sw*g.k,g.strutHeight);
 const [bx,by,bw,bh]=p.box;
 c.drawImage(image,bx,by,bw,bh,g.mount.x+(bx-ax)*g.k,g.mount.y+(by-ay)*g.k+g.boxShift,bw*g.k,bh*g.k);
 const [fx,fy,fw,fh]=p.foot;
 c.drawImage(image,fx,fy,fw,fh,g.mount.x+(fx-ax)*g.k,g.mount.y+(fy-ay)*g.k,fw*g.k,fh*g.k);
 if(b.podFlash>0)inkFlash(c,g.displayMuzzle,Math.PI,1.4);
}

export function drawInkBossTank(c,images,b,{camera=0,time=0,breach=null}={}){
 if(!b||b.hp<=0&&!breach||!images['ink-boss'])return false;
 const g=inkBossGeometry(b,{camera}),image=images['ink-boss'],parts=images['ink-boss-parts'];
 oval(c,g.x,b.y-2,168,8,INK+'66');chargeMarks(c,b,g,camera,time);
 c.save();if(b.hit>0)c.globalAlpha*=.72;
 c.save();c.translate(g.x,g.y);c.scale(g.k,g.k);c.translate(-852,-838);
 c.drawImage(image,30,416,1720,422,30,416,1720,422);c.restore();
 c.save();turretTransform(c,g);c.beginPath();polygon(c,[[30,50],[1750,50],[1750,416],[30,416]]);polygon(c,BARREL_POLYGON);c.clip('evenodd');
 c.drawImage(image,30,50,1720,366,30,50,1720,366);c.restore();
 c.save();c.translate(g.barrelOffset.x,g.barrelOffset.y);turretTransform(c,g);
 c.translate(...BARREL_PIVOT);c.rotate(g.barrelAngle);c.translate(-BARREL_PIVOT[0],-BARREL_PIVOT[1]);
 c.beginPath();polygon(c,BARREL_POLYGON);c.clip();c.drawImage(image,30,50,1720,366,30,50,1720,366);c.restore();
 if(parts){
  const staged=inkBreachVisual(breach,b,{camera}),frame=b.breached?2:staged?.kind==='hull'?staged.hatchFrame:0;
  nativePart(c,parts,INK_BOSS_PARTS.hatches[frame],b.x-camera-60,b.y-78,.16);
 }
 c.restore();drawLauncher(c,parts,b,{camera,time,breach});
 const warning=bossCannonWarningProgress(b);
 if(warning>0){c.save();c.globalAlpha=warning*.65;c.strokeStyle=INK;c.lineWidth=1.5;c.setLineDash([10,12]);c.beginPath();c.moveTo(g.muzzle.x,g.muzzle.y);c.lineTo(g.muzzle.x-900,g.muzzle.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(g.muzzle.x,g.muzzle.y,7+warning*7,0,TAU);c.stroke();c.restore();}
 if(b.cannonRecoil>.55){inkFlash(c,g.muzzle,Math.PI,1.5);inkFlash(c,g.upperMuzzle,Math.PI,1.2);}
 return true;
}

function fireIntoHatch(c,image,p,target,{camera=0,time=0,shotFlash=false}={}){
 const actor={...p,dir:1,turn:null,deflect:null,cannonElevation:0,cannonRecoil:0,mirvFlash:0,muzzle:0};
 const geo=inkSaltikGeometry(actor,{camera,time}),part=INK_SALTIK_PARTS.cannon;
 // Hide the resting native barrel, then articulate that same painted patch
 // downward. The faceplate and both small hands remain native rigid pieces.
 c.save();c.beginPath();c.rect(-100000,-100000,200000,200000);polygon(c,part.polygon.map(point=>{const v=geo.sourcePoint(point);return[v.x,v.y];}));c.clip('evenodd');
 drawInkSaltik(c,image,actor,{camera,time});c.restore();
 const pivot=geo.sourcePoint(part.pivot),aim=Math.atan2(target.y-pivot.y,target.x-pivot.x);
 const nativeAim=Math.atan2(part.muzzle[1]-part.pivot[1],part.muzzle[0]-part.pivot[0]),rotation=aim-nativeAim,recoil=shotFlash?22:0;
 c.save();c.translate(geo.x,geo.y+geo.heave+geo.bodyDrop);c.scale(geo.k,geo.k);c.translate(-INK_SALTIK_ANCHOR[0],-INK_SALTIK_ANCHOR[1]);
 c.translate(...part.pivot);c.rotate(rotation);c.translate(-part.pivot[0]-recoil,-part.pivot[1]);
 c.beginPath();polygon(c,part.polygon);c.clip();c.drawImage(image,...INK_SALTIK_CROP,...INK_SALTIK_CROP);c.restore();
 if(shotFlash){
  const point=rotate([part.muzzle[0]-recoil,part.muzzle[1]],part.pivot,rotation),muzzle=geo.sourcePoint(point);
  c.save();c.lineCap='round';c.strokeStyle=INK;c.lineWidth=5;c.beginPath();c.moveTo(muzzle.x,muzzle.y);c.lineTo(target.x,target.y);c.stroke();c.strokeStyle=PAPER;c.lineWidth=2;c.stroke();c.restore();
  inkFlash(c,muzzle,aim,.8);inkFlash(c,target,aim,.7);
 }
}

export function drawInkBossBreach(c,images,q,b,{camera=0,time=0,player={}}={}){
 const v=inkBreachVisual(q,b,{camera});if(!v?.paintsPlayer||!images['ink-saltik'])return false;
 const tearing=q.phase==='tear',effort=tearing?Math.sin(Math.PI*clamp(finite(q.elapsed)/.42)):v.effort;
 const p={...player,x:finite(q.deckX,q.x),y:finite(q.deckY,q.y),supportY:finite(q.deckY,q.y),supportPose:null,tilt:0,vx:0,vy:0,
  dir:1,turn:null,onGround:true,crouching:true,invulnerable:0,muzzle:0,mirvFlash:0,cannonRecoil:0,melee:null,evasion:null,
  deflect:{active:true,elapsed:.04+effort*.11}};
 if(q.kind!=='pod'&&q.phase==='fire')fireIntoHatch(c,images['ink-saltik'],p,{x:v.hatch.x,y:v.hatch.y-12},{camera,time,shotFlash:v.shotFlash});
 else{
  drawInkSaltik(c,images['ink-saltik'],p,{camera,time});
  if(q.kind==='pod'&&v.shotFlash){const g=inkBossPodGeometry(b,{camera,breach:q});inkFlash(c,g.displayMuzzle,Math.PI,1.1);}
 }
 if(tearing&&effort>.2){
  c.save();c.strokeStyle=INK;c.lineWidth=1.5;const x=q.kind==='pod'?b.x-camera+61:v.hatch.x,y=q.kind==='pod'?b.y-163:v.hatch.y-14;
  for(let i=0;i<4;i++){const a=-2.6+i*.7;c.beginPath();c.moveTo(x+Math.cos(a)*9,y+Math.sin(a)*7);c.lineTo(x+Math.cos(a)*(14+effort*8),y+Math.sin(a)*(10+effort*8));c.stroke();}c.restore();
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
 const p={...player,x:v.player.x,y:v.player.y,supportY:v.player.y,supportPose:null,supportClearance:undefined,tilt:0,dir:v.dir,turn:null,onGround:true,vx:0,vy:0,crouching:false,
  landingCompression:0,jumpCompression:0,preJump:0,melee:null,evasion:null,muzzle:0,mirvFlash:0,cannonRecoil:0,invulnerable:0,deflect:null};
 const e={x:v.enemy.x,y:v.enemy.y,dir:-v.dir,hp:1},pg=inkSaltikGeometry(p,{camera,time:0}),eg=inkEnemySaltikGeometry(e,0,{camera});
 const playerArms=INK_SALTIK_PARTS.arms.map((part,index)=>gripArm({...part,wristY:index?936:957,stretchY:index?880:885},index?-1.12-v.effort*.035:-.9, index?100:0,pg));
 const enemyArms=DUEL_ENEMY_ARMS.map((part,index)=>gripArm(part,index?-.4:-1-v.effort*.035,index?0:60,eg));
 return{v,p,e,pg,eg,playerArms,enemyArms,playerGrip:playerArms[1].handPoint([1080,995]),enemyGrip:enemyArms[0].handPoint([714,679])};
}
function withoutNativeParts(c,geometry,parts,draw){
 c.save();
 for(const part of parts){c.beginPath();c.rect(-100000,-100000,200000,200000);polygon(c,part.polygon.map(point=>{const p=geometry.sourcePoint(point);return[p.x,p.y];}));c.clip('evenodd');}
 draw();c.restore();
}
function drawGripArm(c,image,crop,arm){
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

function glassCracks(c,x,y,width,height,alpha){
 if(alpha<=0)return;
 const segments=[];
 for(let i=0;i<9;i++){
  const angle=i*TAU/9+.15*Math.sin(i*7.3),length=Math.min(width*.33,height*(.29+.11*Math.sin(i*2.1)**2)),points=[[x,y]];
  for(let j=1;j<=4;j++){const a=angle+Math.sin(i*13+j*4.1)*.11;points.push([x+Math.cos(a)*length*j/4,y+Math.sin(a)*length*j/4]);}segments.push(points);
  const [bx,by]=points[2],branch=angle+(i%2?-.5:.55);segments.push([[bx,by],[bx+Math.cos(branch)*length*.16,by+Math.sin(branch)*length*.16],[bx+Math.cos(branch+.2)*length*.29,by+Math.sin(branch+.2)*length*.29]]);
 }
 c.save();c.globalAlpha*=alpha;c.lineJoin='round';c.lineCap='round';
 for(const [color,lineWidth] of [[INK+'dd',3],[PAPER+'dd',1.1]]){c.strokeStyle=color;c.lineWidth=lineWidth;c.beginPath();for(const points of segments)points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();}c.restore();
}

export function drawInkDuelScreen(c,images,q,viewport={}){
 const v=inkDuelVisual(q,viewport);if(!v||!v.screen&&v.cracks<=0||!images['ink-enemy-saltik'])return false;
 if(v.screen){const p=v.screen;c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.globalAlpha*=p.alpha;
  drawInkEnemySaltik(c,images['ink-enemy-saltik'],{x:0,y:0,hp:1},{view:'front',scale:p.scale});c.restore();}
 glassCracks(c,v.crackX,v.crackY,viewport.width??1280,viewport.height??720,v.cracks);return true;
}
