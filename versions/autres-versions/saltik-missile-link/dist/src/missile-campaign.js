import {terrainHeight,surfaceHeight} from './world.js';
import {ARTILLERY_DAMAGE} from './missile-battery.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const emit=(g,type,x,y,extra={})=>g.events.push({type,x,y,...extra});
const APPROACH_STATIONS=[8200,10100];
export function createBatteryEncounter(){return {salvos:0,warning:0,activeSalvo:0,nextAllowed:0,interceptArmed:false,interceptHeld:false,engaged:false,escaped:false};}
export function createMissileCompanion(){return {active:false,x:30,y:terrainHeight(30),groundY:terrainHeight(30),dir:1,vx:0,tilt:0,dodge:0,flareFlash:0,flareCooldown:0,arriving:false};}
export function artilleryAlert(g){
 const s=g.batteryEncounter,link=g.missileLink;
 const incoming=g.projectiles?.some(p=>p.team==='enemy'&&p.longRange&&p.life>0);
 const visible=!!s&&!s.engaged&&(s.warning>0||!!incoming);
 return {visible,ready:visible&&link?.cooldown===0&&!s.interceptArmed,armed:!!s?.interceptArmed,warning:s?.warning??0,remaining:s?.warning??0,cooldown:link?.cooldown??0,salvo:(s?.warning>0?s.salvos+1:s?.salvos)??0};
}
export function advanceArtilleryApproach(g,input,dt,{spawn,launchSupport}={}){
 const s=g.batteryEncounter;if(!s)return;
 const held=!!input.intercept,pressed=(input.interceptPressed??(held&&!s.interceptHeld));s.interceptHeld=held;
 if(s.engaged){s.warning=0;s.interceptArmed=false;return;}
 const authored=g.schedule.some(e=>e.type==='battery');
 if(authored&&s.salvos<2&&s.warning===0&&g.maxX>=APPROACH_STATIONS[s.salvos]&&g.time>=s.nextAllowed){
  s.warning=3;s.activeSalvo=s.salvos+1;emit(g,'artillery-warning',g.player.x,g.player.y-150,{salvo:s.activeSalvo});
 }
 const alert=artilleryAlert(g);
 if(pressed&&alert.ready){
  if(s.warning>0){s.interceptArmed=true;g.missileLink.cooldown=7.5;g.missileLink.aiming=false;g.missileLink.held=false;}
  else launchSupport?.(g);
 }
 if(s.warning>0){
  s.warning=Math.max(0,s.warning-dt);
  if(s.warning<1e-8){
   s.warning=0;s.salvos++;s.nextAllowed=g.time+4.5;
   const v=g.viewport??{x:g.player.x-350,y:0,w:1280},origin={x:Math.min(18000,v.x+v.w+100),y:v.y-55};
   for(let i=0;i<4;i++)spawn?.({kind:'enemy-missile',team:'enemy',x:origin.x+i*36,y:origin.y-i*24,vx:-210-i*12,vy:135+i*17,damage:ARTILLERY_DAMAGE,radius:7,life:11,hp:1,locking:true,handDeflectable:true,age:0,trail:[],battery:true,artillery:true,longRange:true,salvo:s.salvos});
   emit(g,'battery-volley',origin.x,origin.y,{count:4,artillery:true});
   if(s.interceptArmed){s.interceptArmed=false;launchSupport?.(g,{reserved:true});}
  }
 }
}

function actorFloor(g,e,x){const route=g.platforms.find(p=>p.id===e.platformId);return route&&x>=route.x1&&x<=route.x2?surfaceHeight(route,x):terrainHeight(x);}
export function advanceBatteryMovement(g,e,dt,inView){
 const p=g.player;if(e.hp<=0)return;
 if(inView&&!e.engaged&&!e.retreating){e.engaged=true;g.batteryEncounter.engaged=true;}
 if(!e.engaged&&!e.retreating)return;
 if(e.retreating){
  e.retreatElapsed=(e.retreatElapsed??0)+dt;e.vx=(e.retreatDir??1)*320;e.dir=e.retreatDir??1;
  e.smokeIn=(e.smokeIn??0)-dt;e.flareIn=(e.flareIn??0)-dt;
  if(e.smokeIn<=0){e.smokeIn=.13;emit(g,'escape-smoke',e.x-e.dir*35,e.y-20,{radius:34});}
  if(e.flareIn<=0){e.flareIn=.65;releaseFlares(g,e,'enemy',4);}
 }else{
  const current=g.platforms.find(r=>r.id===e.platformId);
  if(e.exitRoute&&e.onGround!==false&&!e.platformId)e.exitRoute=null;
  if(!e.exitRoute&&current&&p.platformId!==current.id&&p.y>e.y+45)e.exitRoute={id:current.id,x:e.x-current.x1<current.x2-e.x?current.x1-70:current.x2+70};
  let desired=g.platforms.find(r=>r.id===p.platformId);
  // Climb the lower bank first: a normal hop cannot reach tier two from soil.
  while(desired?.lower&&e.platformId!==desired.lower.id&&e.platformId!==desired.id)desired=g.platforms.find(r=>r.id===desired.lower.id);
  const changingRoute=desired&&e.platformId!==desired.id;
  const entry=changingRoute?(e.x>(desired.x1+desired.x2)*.5?desired.x2-65:desired.x1+65):null;
  const pursuitX=e.exitRoute?.x??entry??p.x,dx=pursuitX-e.x;e.dir=dx>=0?1:-1;
  e.vx=Math.abs(dx)>(e.exitRoute||changingRoute?4:78)?e.dir*255:0;
  // A real ballistic hop lets this Saltik follow an elevated route. It never
  // snaps its feet vertically to the player's tier.
  const elevated=changingRoute&&e.x>=desired.x1-60&&e.x<=desired.x2+60&&surfaceHeight(desired,clamp(e.x,desired.x1,desired.x2))<e.y-45;
  const obstacle=g.obstacles.find(o=>o.hp>0&&Math.abs(o.x-e.x)<o.w*.5+55&&o.h>18);
  e.jumpIn=Math.max(0,(e.jumpIn??0)-dt);
  if(e.onGround!==false&&(elevated||obstacle)&&e.jumpIn===0){e.vy=-690;e.onGround=false;e.jumpIn=1.35;}
 }
 const oldY=e.y;e.x+=e.vx*dt;
 if(e.onGround===false){
  e.vy=(e.vy??0)+1350*dt;e.y+=e.vy*dt;
  const candidates=[{y:terrainHeight(e.x),id:null,tier:0},...g.platforms.filter(r=>e.x>=r.x1&&e.x<=r.x2).map(r=>({y:surfaceHeight(r,e.x),id:r.id,tier:r.tier}))].sort((a,b)=>a.y-b.y);
  const landing=candidates.find(f=>e.vy>=0&&oldY<=f.y+7&&e.y>=f.y);
  if(landing){e.y=landing.y;e.platformId=landing.id;e.tier=landing.tier;e.vy=0;e.onGround=true;}
 }else{
  const floor=actorFloor(g,e,e.x);
  if(floor>e.y+28){e.onGround=false;e.vy=0;e.platformId=null;e.tier=0;}
  else e.y=floor;
 }
 const route=g.platforms.find(r=>r.id===e.platformId);if(!route){e.platformId=null;e.tier=0;}
 e.tilt=clamp(Math.atan2(actorFloor(g,e,e.x+35)-actorFloor(g,e,e.x-35),70),-.24,.24);
 if(e.retreating&&(e.retreatElapsed>4.5||e.x>g.viewport.x+g.viewport.w+220)){e.escaped=true;e.hp=0;g.batteryEncounter.escaped=true;emit(g,'battery-escaped',e.x,e.y);}
}
export function canClashBattery(g,e){const p=g.player;return e.type==='battery'&&e.hp>0&&e.engaged&&!e.retreating&&!e.clashStarted&&!p.evasion?.active&&p.onGround&&e.onGround!==false&&!p.obstacleId&&(p.platformId??null)===(e.platformId??null)&&Math.abs(e.x-p.x)<=105&&Math.abs(e.y-p.y)<60;}
export function startBatteryClash(g,e){
 const p=g.player,dir=e.x>=p.x?1:-1;e.clashStarted=true;e.vx=0;p.vx=0;p.vy=0;
 const route=g.platforms.find(r=>r.id===p.platformId),middle=(p.x+e.x)*.5;
 const center=route?clamp(middle,route.x1+90,route.x2-90):middle;
 e.dir=-dir;p.dir=dir;
 g.batteryClash={phase:'engage',elapsed:0,taps:0,effortsCompleted:0,effortElapsed:0,enemyId:e.id,playerX:p.x,playerY:p.y,enemyX:e.x,enemyY:e.y,x:middle,y:(p.y+e.y)/2,dir,qteHeld:false,qteArmed:false,fromPlayerX:p.x,fromEnemyX:e.x,stagePlayerX:center-dir*40,stageEnemyX:center+dir*40};
 g.projectiles=[];g.missileLink.flights=[];g.batteryEncounter.warning=0;g.batteryEncounter.interceptArmed=false;
 emit(g,'battery-clash',g.batteryClash.x,g.batteryClash.y);
}
export function advanceBatteryClash(g,held,dt){
 const q=g.batteryClash;if(!q)return;
 if(g.batteryClashInputSuspended){q.qteHeld=!!held;q.qteArmed=false;g.batteryClashInputSuspended=false;}
 if(q.phase==='qte'){
  if(!held)q.qteArmed=true;
  if(held&&!q.qteHeld&&q.qteArmed&&q.taps<3){q.taps++;q.qteArmed=false;emit(g,'duel-tap',q.x,q.y,{taps:q.taps});}
  q.qteHeld=!!held;let remaining=dt;
  while(q.effortsCompleted<q.taps&&remaining>0){const needed=.24-q.effortElapsed;if(remaining<needed-1e-9){q.effortElapsed+=remaining;break;}remaining-=needed;q.effortsCompleted++;q.effortElapsed=0;}
  if(q.taps===3&&q.effortsCompleted===3){q.phase='release';q.elapsed=0;emit(g,'battery-release',q.x,q.y);}
 }else{
  q.elapsed+=dt;
  if(q.phase==='engage'){
   const u=clamp(q.elapsed/.45,0,1),t=u*u*(3-2*u),e=g.enemies.find(e=>e.id===q.enemyId),p=g.player;
   p.x=q.fromPlayerX+(q.stagePlayerX-q.fromPlayerX)*t;p.y=actorFloor(g,p,p.x);
   if(e){e.x=q.fromEnemyX+(q.stageEnemyX-q.fromEnemyX)*t;e.y=actorFloor(g,e,e.x);q.enemyX=e.x;q.enemyY=e.y;}
   q.playerX=p.x;q.playerY=p.y;q.x=(q.playerX+q.enemyX)*.5;q.y=(q.playerY+q.enemyY)*.5;
  }
  if(q.phase==='engage'&&q.elapsed>=.45){q.phase='qte';q.elapsed=0;q.qteHeld=!!held;q.qteArmed=false;}
  else if(q.phase==='release'&&q.elapsed>=.5){
   const e=g.enemies.find(e=>e.id===q.enemyId);
   if(e){e.retreating=true;e.retreatElapsed=0;e.retreatOrigin=e.x;e.retreatDir=q.dir;e.flareIn=0;e.smokeIn=0;}
   g.batteryClash=null;g.player.invulnerable=Math.max(g.player.invulnerable,1.4);emit(g,'battery-retreat',q.x,q.y);
  }
 }
}

export function releaseFlares(g,actor,team,count=6){
 const dir=team==='player'?1:-(actor.retreatDir??1);actor.flareFlash=.6;
 for(let i=0;i<count;i++)g.countermeasures.push({id:'flare-'+g.nextFlareId++,team,x:actor.x+dir*26,y:actor.y-65,vx:dir*(250+i*22),vy:-220-i*22,life:3.8,age:0});
 emit(g,'flares',actor.x,actor.y-70,{team});
}
export function advanceMissileCompanion(g,dt){
 const a=g.missileCompanion,p=g.player;if(!a)return;
 if(g.boss?.hp>0&&!a.active){a.active=true;a.arriving=true;a.x=clamp((g.viewport?.x??p.x-350)-130,p.x-700,p.x-240);a.y=terrainHeight(a.x);a.groundY=a.y;emit(g,'ally-arrival',p.x,p.y);}
 if(!a.active)return;
 a.flareFlash=Math.max(0,a.flareFlash-dt);a.flareCooldown=Math.max(0,a.flareCooldown-dt);a.dodge=Math.max(0,a.dodge-dt);
 const goal=Math.min(p.x+125,g.boss?.hp>0?g.boss.x-250:Infinity),dx=goal-a.x;
 const rushing=g.boss?.dx<0&&a.x>g.boss.x-380;
 a.vx=clamp(dx*3,rushing?-650:-290,350);a.x+=a.vx*dt;a.dir=p.x>=a.x?1:-1;a.arriving=Math.abs(dx)>35;
 a.groundY=terrainHeight(a.x);a.tilt=clamp(Math.atan2(terrainHeight(a.x+35)-terrainHeight(a.x-35),70),-.24,.24);
 const dangers=g.projectiles.filter(s=>s.team==='enemy'&&s.life>0);
 if(a.dodge===0&&dangers.some(s=>Math.hypot(s.x-a.x,s.y-(a.y-45))<260))a.dodge=.8;
 a.y=a.groundY-(a.dodge>0?Math.sin(Math.PI*(1-a.dodge/.8))*55:0);
 const missiles=dangers.filter(s=>s.kind==='enemy-missile'&&s.locking!==false&&!s.decoyId&&Math.hypot(s.x-p.x,s.y-p.y)<1250);
 if(missiles.length&&a.flareCooldown===0){a.flareCooldown=4;releaseFlares(g,a,'player');}
}
export function advanceCountermeasures(g,dt){
 for(const f of g.countermeasures){f.age+=dt;f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=Math.exp(-dt*.4);f.vy+=85*dt;}
 g.countermeasures=g.countermeasures.filter(f=>f.life>0);
 for(const shot of g.projectiles){
  if(shot.life<=0||shot.decoyId||!((shot.kind==='homing'&&shot.team==='player')||(shot.kind==='enemy-missile'&&shot.team==='enemy'&&shot.locking!==false)))continue;
  const flare=g.countermeasures.filter(f=>f.team!==shot.team&&Math.hypot(f.x-shot.x,f.y-shot.y)<1500).sort((a,b)=>Math.hypot(a.x-shot.x,a.y-shot.y)-Math.hypot(b.x-shot.x,b.y-shot.y))[0];
  if(flare){shot.decoyId=flare.id;shot.decoyPoint={x:flare.x,y:flare.y};g.stats.flareDiversions=(g.stats.flareDiversions??0)+1;}
 }
 for(const f of g.missileLink.flights){
  if(f.targetType==='projectile'||f.targetType==='flare'||f.life<=0)continue;
  const flare=g.countermeasures.find(v=>v.team==='enemy'&&Math.hypot(v.x-f.x,v.y-f.y)<650);
  if(flare){f.targetType='flare';f.targetId=flare.id;f.goal={x:flare.x,y:flare.y};}
 }
}
export function steerToCountermeasure(g,shot,dt){
 if(!shot.decoyId)return false;
 const f=g.countermeasures.find(f=>f.id===shot.decoyId);
 if(f)shot.decoyPoint={x:f.x,y:f.y};
 const goal=shot.decoyPoint;if(!goal)return true;
 const dx=goal.x-shot.x,dy=goal.y-shot.y,d=Math.hypot(dx,dy)||1,speed=Math.max(310,Math.hypot(shot.vx,shot.vy)),blend=1-Math.exp(-dt*8);
 shot.vx+=(dx/d*speed-shot.vx)*blend;shot.vy+=(dy/d*speed-shot.vy)*blend;return true;
}
