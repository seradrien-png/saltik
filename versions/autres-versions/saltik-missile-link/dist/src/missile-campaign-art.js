import {tachikomaGeometry} from './tachikoma-pose.js';
import {batterySpriteSize,drawBatteryNative} from './missile-link-art.js';
import {terrainHeight,surfaceHeight} from './world.js';

const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
// Measured contours of the idle cells' TWO existing small forearms and hands.
// All masks stop below the eye rims and outside the rigid service faceplate.
const PLAYER_ARMS=[
 {pivot:[133,861],tip:[111,901],polygon:[[119,852],[130,853],[136,859],[139,873],[133,886],[131,902],[124,915],[115,922],[104,920],[96,915],[91,907],[90,897],[92,886],[94,872],[100,859],[109,853]]},
 {pivot:[219,862],tip:[186,903],polygon:[[209,852],[221,853],[229,863],[230,875],[224,890],[216,901],[210,914],[202,923],[188,925],[175,921],[165,914],[160,906],[160,897],[164,888],[174,879],[181,868],[194,858]]}
];
const ENEMY_ARMS=[
 {pivot:[142,377],tip:[123,420],polygon:[[127,370],[139,367],[150,373],[158,385],[159,397],[154,412],[147,424],[140,436],[128,442],[117,441],[107,435],[102,425],[102,413],[105,401],[112,389],[117,376]]},
 {pivot:[240,381],tip:[208,426],polygon:[[235,371],[250,369],[261,378],[266,391],[263,405],[253,417],[240,428],[230,439],[216,448],[202,447],[188,439],[182,428],[183,416],[190,404],[204,395],[215,385],[223,377]]}
];
const ALLY_ARMS=[
 {pivot:[294,377],tip:[327,425],polygon:[[282,369],[294,365],[307,373],[315,388],[323,398],[337,401],[349,410],[356,422],[353,438],[341,450],[326,451],[313,441],[304,430],[299,414],[287,402],[278,387]]},
 {pivot:[397,377],tip:[426,425],polygon:[[387,367],[399,366],[412,375],[422,390],[428,401],[440,405],[449,416],[452,430],[446,442],[435,451],[422,452],[409,444],[401,432],[396,416],[385,402],[380,386]]}
];
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function rotate([x,y],angle){return [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];}
function transformedTip(arm){const [x,y]=rotate([(arm.tip[0]-arm.pivot[0])*arm.stretch,(arm.tip[1]-arm.pivot[1])*arm.stretch],arm.rotation);return [arm.pivot[0]+x,arm.pivot[1]+y];}
function bodyPoint(body,[x,y]){const [xx,yy]=rotate([x*body.flip,y],body.tilt);return {x:body.x+xx,y:body.y+yy};}
function inversePoint(body,point){const [x,y]=rotate([point.x-body.x,point.y-body.y],-body.tilt);return [x*body.flip,y];}
function aimArm(arm,body,target,effort,index,contact){
 const [tx,ty]=inversePoint(body,target),a=Math.atan2(arm.tip[1]-arm.pivot[1],arm.tip[0]-arm.pivot[0]);
 const desired=Math.atan2(ty-arm.pivot[1],tx-arm.pivot[0]);
 return {...arm,rotation:contact?desired-a+.10*(1-effort):(.22+effort*.26)*(index?1:-1),stretch:contact?1.18+effort*.12:1};
}
function playerBody(p,{camera=0,dir=p.dir,tilt=p.tilt??0,target=null,effort=0,celebrate=0}={}){
 const pose={...p,dir,tilt,vx:0,vy:0,onGround:true,crouching:false,damagePose:false,melee:null,evasion:null,deflect:null,turn:null,supportPose:null,cannonElevation:0};
 const geo=tachikomaGeometry(pose,0,{camera}),body={x:p.x-camera,y:p.y,tilt:geo.tilt,flip:geo.mirror,height:99,geo};
 const point=([x,y])=>[(x-geo.feet[0])*geo.k,(y-512-geo.feet[1])*geo.k];
 body.arms=PLAYER_ARMS.map((arm,i)=>{
  const part={...arm,pivot:point(arm.pivot),tip:point(arm.tip),polygon:arm.polygon.map(point),sourcePolygon:arm.polygon};
  return target?aimArm(part,body,target,effort,i,i===0):{...part,rotation:(i?1:-1)*celebrate,stretch:1};
 });
 body.contact=bodyPoint(body,transformedTip(body.arms[0]));return body;
}
function batteryBody(team,actor,{camera=0,target=null,effort=0,celebrate=0}={}){
 const size=batterySpriteSize(team),k=size/512;
 const body={team,x:actor.x-camera,y:actor.y,height:99,size,k,tilt:actor.tilt??0,flip:team==='ally'?(actor.dir===-1?-1:1):(actor.dir===1?-1:1),pose:actor.pose??'idle'};
 const point=([x,y])=>[(x-256)*k,(y-500)*k],source=team==='ally'?ALLY_ARMS:ENEMY_ARMS,contactIndex=team==='ally'?1:0;
 body.arms=source.map((arm,i)=>{
  const local={...arm,pivot:point(arm.pivot),tip:point(arm.tip),polygon:arm.polygon.map(point),sourcePolygon:arm.polygon};
  return target?aimArm(local,body,target,effort,i,i===contactIndex):{...local,rotation:(i?1:-1)*celebrate,stretch:1};
 });
 body.contact=bodyPoint(body,transformedTip(body.arms[contactIndex]));return body;
}
function drawPlayer(c,images,body,pass='all'){
 const sheet=images.tachikoma;if(!sheet)return false;const g=body.geo,draw=()=>c.drawImage(sheet,...g.crop,g.dx,g.dy,g.crop[2]*g.k,g.crop[3]*g.k);
 c.save();c.imageSmoothingEnabled=false;c.translate(body.x,body.y);c.rotate(body.tilt);c.scale(body.flip,1);
 if(pass!=='arms'){c.save();c.beginPath();c.rect(g.dx,g.dy,g.crop[2]*g.k,g.crop[3]*g.k);
 for(const arm of body.arms){arm.polygon.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}c.clip('evenodd');draw();c.restore();}
 if(pass!=='body')for(const arm of body.arms){c.save();c.translate(...arm.pivot);c.rotate(arm.rotation);c.scale(arm.stretch,arm.stretch);c.translate(-arm.pivot[0],-arm.pivot[1]);path(c,arm.polygon);c.clip();draw();c.restore();}
 c.restore();return true;
}
function drawBattery(c,images,body,pass='all'){
 if(!images['missile-batteries'])return false;const native=([x,y])=>[x/body.k+256,y/body.k+500];
 const parts=body.arms?.map(arm=>({...arm,pivot:native(arm.pivot),polygon:arm.polygon.map(native)}))??[];
 c.save();c.translate(body.x,body.y);c.rotate(body.tilt);c.scale(body.flip,1);
 drawBatteryNative(c,images['missile-batteries'],body.team,0,0,body.size,body.pose,false,0,parts,pass);c.restore();return true;
}

export function batteryClashVisual(clash,{camera=0}={}){
 if(!clash||!['engage','qte','release'].includes(clash.phase))return null;
 const active=clash.phase==='qte'&&(clash.effortsCompleted??0)<clash.taps;
 const effort=active?Math.sin(Math.PI*clamp((clash.effortElapsed??0)/.24)):0;
 const grip=clash.phase==='release'?1-smooth(clamp(clash.elapsed/.5)):clash.phase==='engage'?smooth(clamp(clash.elapsed/.35)):1;
 const tilt=clamp(Math.atan2(clash.enemyY-clash.playerY,Math.abs(clash.enemyX-clash.playerX))*(clash.dir??1),-.20,.20);
 const target={x:(clash.playerX+clash.enemyX)*.5-camera,y:(clash.playerY+clash.enemyY)*.5-25};
 const player=playerBody({x:clash.playerX,y:clash.playerY,dir:clash.dir},{camera,tilt,target,effort}),enemy=batteryBody('enemy',{x:clash.enemyX,y:clash.enemyY,dir:-clash.dir,tilt},{camera,target,effort});
 for(const body of [player,enemy]){for(const arm of body.arms){arm.rotation*=grip;arm.stretch=1+(arm.stretch-1)*grip;}body.contact=bodyPoint(body,transformedTip(body.arms[0]));}
 return {effort:Math.abs(effort)<1e-9?0:effort,effortIndex:active?(clash.effortsCompleted??0)+1:0,player,enemy};
}
export function drawBatteryClash(c,images,clash,options={}){
 const v=batteryClashVisual(clash,options);if(!v||!images.tachikoma||!images['missile-batteries'])return false;
 oval(c,v.player.x,v.player.y,39,4,'#091c1a66');oval(c,v.enemy.x,v.enemy.y,39,4,'#091c1a66');
 drawBattery(c,images,v.enemy,'body');drawPlayer(c,images,v.player,'body');
 drawBattery(c,images,v.enemy,'arms');drawPlayer(c,images,v.player,'arms');return true;
}

export function companionVisual(g,{camera=0}={}){
 const a=g.missileCompanion;if(!a?.active)return null;
 const walking=Math.abs(a.vx??0)>20,rock=walking?Math.sin((g.time??0)*15)*.018:0;
 return {...batteryBody('ally',{...a,tilt:(a.tilt??0)+rock+(a.dodge>0?-.09*a.dir*Math.sin(clamp(a.dodge/.8)*Math.PI):0)},{camera}),
  groundY:a.groundY??a.y,pose:g.missileLink?.launchFlash>0?'fire':'idle',flareFlash:a.flareFlash??0};
}
export function drawMissileCompanion(c,images,g,options={}){
 const v=companionVisual(g,options);if(!v||!images['missile-batteries'])return false;
 oval(c,v.x,v.groundY,42,4,'#091c1a66');
 // Idle arms stay authored during movement; their masks are for close gestures.
 drawBattery(c,images,{...v,arms:[]});
 if(v.flareFlash>0){c.save();c.globalCompositeOperation='screen';c.globalAlpha=clamp(v.flareFlash/.6);oval(c,v.x-v.flip*19,v.y-52,8,6,'#fff3ba');c.restore();}return true;
}
function victoryGround(g,x){
 const p=g.player,a=g.missileCompanion,route=g.platforms?.find(r=>r.id===p.platformId);
 if(route&&x>=route.x1&&x<=route.x2)return surfaceHeight(route,x);
 // Physical boss terrain is sampled directly. Small isolated art fixtures
 // retain their supplied support plane rather than acquiring a new floor.
 if(g.platforms)return terrainHeight(x);
 return mix(p.y,a.groundY??a.y,clamp((x-p.x)/((a.x-p.x)||1)));
}
export function pairedVictoryVisual(g,{camera=0,age=0}={}){
 const a=g.missileCompanion;if(!a?.active)return null;
 const p=g.player,dir=Math.sign(a.x-p.x)||1,middle=(p.x+a.x)*.5;
 const approach=smooth(clamp(age/.9)),gap=Math.min(80,Math.abs(a.x-p.x)),px=mix(p.x,middle-dir*gap*.5,approach),ax=mix(a.x,middle+dir*gap*.5,approach);
 const py=victoryGround(g,px),ay=victoryGround(g,ax),target={x:middle-camera,y:(py+ay)*.5-25};
 const bump=age<.9?0:Math.sin(Math.PI*clamp((age-.9)/.9)),celebrate=age>1.8?.3+Math.sin((age-1.8)*8)*.15:0;
 const touching=age>=.65&&age<1.8;
 return {middle:middle-camera,player:playerBody({...p,x:px,y:py,dir},{camera,target:touching?target:null,effort:bump,celebrate}),
  ally:batteryBody('ally',{...a,x:ax,y:ay,dir:-dir,tilt:0,pose:'idle'},{camera,target:touching?target:null,effort:bump,celebrate})};
}
export function drawPairedVictory(c,images,g,options={}){
 const v=pairedVictoryVisual(g,options);if(!v||!images.tachikoma||!images['missile-batteries'])return false;
 oval(c,v.player.x,v.player.y,39,4,'#091c1a66');oval(c,v.ally.x,v.ally.y,42,4,'#091c1a66');
 drawBattery(c,images,v.ally,'body');drawPlayer(c,images,v.player,'body');
 drawBattery(c,images,v.ally,'arms');drawPlayer(c,images,v.player,'arms');return true;
}

export function drawCountermeasures(c,g,{camera=0}={}){
 let count=0;for(const f of g.countermeasures??[]){
  if(!(f.life>0))continue;count++;const x=f.x-camera,fade=clamp(f.life/.35),age=f.age??0,ally=f.team==='player';
  c.save();
  for(let i=5;i>0;i--){const lag=i*.045;c.globalAlpha=fade*(1-i/7)*.24;oval(c,x-(f.vx??0)*lag,f.y-(f.vy??0)*lag-i*1.3,3+i*1.9+age*3,2+i*1.6+age*2,'#697165');}
  c.globalCompositeOperation='screen';c.globalAlpha=fade;
  const halo=c.createRadialGradient(x,f.y,0,x,f.y,19);halo.addColorStop(0,'#fff8d5');halo.addColorStop(.22,ally?'#dafa9c':'#ffca85');halo.addColorStop(1,'#ffbd5100');
  oval(c,x,f.y,19,15,halo);oval(c,x,f.y,2.4,1.8,'#fffde6');
  c.strokeStyle=ally?'#edffc0':'#ffd6a6';c.lineWidth=1;c.beginPath();c.moveTo(x-5,f.y);c.lineTo(x+5,f.y);c.moveTo(x,f.y-4);c.lineTo(x,f.y+4);c.stroke();c.restore();
 }return count;
}
export function drawBatteryRetreat(c,e,{camera=0}={}){
 if(!e.retreating)return false;const elapsed=e.retreatElapsed??e.phase??0,dir=e.dir??1;
 c.save();for(let i=7;i>0;i--){const age=(elapsed+i*.11)%1.05,back=age*110;c.globalAlpha=(1-age/1.05)*.30;
  oval(c,e.x-camera-dir*(27+back),e.y-38-age*29,10+age*21,8+age*15,i%2?'#7e8173':'#3d4947');}c.restore();return true;
}
