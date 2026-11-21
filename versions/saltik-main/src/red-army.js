import {advanceEnemySaltik,createEnemySaltik} from './enemy-saltik.js';
// Defensive sections exist at world positions before entering the camera.
// A section holds a short sector: its guns, patrol and flanker do not migrate
// across the whole map into a procession following the player's camera.
export function createRedArmySchedule(){
 const sections=[
  ['west-dunes',1450],['first-ridge',2600],['bunker-approach',3650],['west-bunker',4900],
  ['bunker-rearguard',6200],['red-saddle',7000],['eye-passage',9000],['bone-rearguard',10150],
  ['high-dunes',11400],['east-approach',12350],['east-bunker',13500],['east-rearguard',14750],
  ['broken-ridge',15900],['iron-saddle',17600],['deep-dunes',18200],['last-ridge',19400],
  ['escape-approach',20600],['escape-rearguard',21800]
 ];
 const schedule=[];
 for(const [index,[group,center]] of sections.entries()){
  const roles=[['patrol','soldier',-220],['gunner','turret',-80],['missile-team','walker',45],['flanker','soldier',180],['overwatch','drone',310]];
  for(const [role,type,offset] of roles){
   const x=center+offset;
   schedule.push({id:`red-army-${group}-${role}`,type,x,anchorX:x,armyRole:role,armyGroup:group,
    patrolMin:center-330,patrolMax:center+410,armyPhase:index*.67+roles.findIndex(r=>r[0]===role)*.43});
  }
  if(['west-bunker','eye-passage','east-bunker'].includes(group)){
   const gun=schedule.find(e=>e.armyGroup===group&&e.armyRole==='gunner');
   gun.platformId=group==='eye-passage'?'eye-passage-tunnel':`${group}-gallery`;gun.tier=1;
   if(group==='eye-passage')gun.x=gun.anchorX=9320;
   const x=group==='eye-passage'?9380:center+100;
   schedule.push({id:`red-army-${group}-bt-support`,type:'saltik',armyRole:'bt-support',armyGroup:group,
    x,anchorX:x,patrolMin:x,patrolMax:x,platformId:gun.platformId,tier:1,armyPhase:index*.53});
  }
 }
 for(const [index,x] of [7000,11400,17600].entries())schedule.push({id:`red-army-rust-striker-${index}`,type:'saltik',enemyModel:'rust-striker',
  x,anchorX:x,armyRole:'heavy',armyGroup:sections.reduce((best,s)=>Math.abs(s[1]-x)<Math.abs(best[1]-x)?s:best)[0],
  patrolMin:x-180,patrolMax:x+200,armyPhase:index*.61});
 return schedule.sort((a,b)=>a.x-b.x);
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function initialize(e){
 if(!e.armyRole)return e;
 e.anchorX??=e.x;e.armyPhase??=0;e.armyClock=0;e.armyCycle=0;
 e.armyPodSpent=Array(8).fill(false);e.armyReloadProgress=1;
 e.armyGuidedNext=0;e.armyMirvNext=2.6;e.armyMainSpent=0;e.armyMainReload=0;e.armyMainNext=0;e.armyMissileCycle=0;
 e.armyNext=.8+(e.armyPhase%1.2);e.armyPending=[];e.vx=0;e.dir=-1;
 return e;
}
function advance(e,{g,dt,groundAt,geometry}){
 if(!e.armyRole)return null;
 const shots=[],events=[],p=g.player;
 if(e.armyRole==='bt-support'){if(e.btMainClock===undefined){const state=createEnemySaltik({id:e.id,x:e.x},{y:e.y});for(const [key,value] of Object.entries(state))if(e[key]===undefined)e[key]=value;}e.btAimTarget={x:p.x,y:p.y-35};return advanceEnemySaltik(e,{player:p,dt,time:g.time,geometry,enemyProjectileCount:g.projectiles.filter(s=>s.team==='enemy'&&s.life>0).length});}
 if(!(dt>0)||e.hp<=0||e.neutralized||e.duelFinished||p.hp<=0){if(e.hp<=0||e.neutralized||e.duelFinished||p.hp<=0)e.armyPending=[];return {shots,events};}
 e.armyClock+=dt;if(e.type==='saltik')e.phase=(e.phase??0)+dt;e.firePose=Math.max(0,(e.firePose??0)-dt);
 e.guard=false;e.guardFlash=0;
 const previous=e.x,t=e.armyClock+e.armyPhase;
 if(e.armyRole==='patrol')e.x=clamp(e.anchorX+Math.sin(t*.60)*125,e.patrolMin,e.patrolMax);
 else if(e.armyRole==='flanker'){
  const goal=clamp(p.x+(e.anchorX>=p.x?220:-220),e.patrolMin,e.patrolMax);
  e.x+=clamp(goal-e.x,-68*dt,68*dt);
 }else if(e.armyRole==='heavy')e.x=clamp(e.anchorX+Math.sin(t*.44)*88,e.patrolMin,e.patrolMax);
 else if(e.armyRole==='overwatch')e.x=clamp(e.anchorX+Math.sin(t*.43)*105,e.patrolMin,e.patrolMax);
 e.vx=(e.x-previous)/dt;e.y=groundAt(e.x)+(e.type==='drone'?-150+Math.sin(t*1.8)*25:0);
 e.dir=p.x>=e.x?1:-1;e.armyAimTarget={x:p.x,y:p.y-35};if(e.armyRole==='bt-support')e.btAimTarget=e.armyAimTarget;e.movementMode=e.vx>3?'advance':e.vx<-3?'retreat':'hold';
 // Rear guards stop firing when passed; upper guns remain on their own route.
 const inRange=Math.abs(p.x-e.x)<880&&p.x-e.x<420&&Math.abs(p.y-e.y)<330;
 const event=(type,mount,extra={})=>events.push({type,x:mount.x,y:mount.y,enemyId:e.id,time:g.time,...extra});
 const pose=()=>geometry?.(e,g.time)??{};
 const fire=(kind,index=0)=>{
  if(g.projectiles.filter(s=>s.team==='enemy'&&s.life>0).length+shots.length>=36)return;
  const geo=pose(),podIndex=kind==='guided'?[0,4,1,5,2,6,3,7][index%8]:0;
  const mount=kind==='gun'||kind==='mirv'?(geo.muzzle??{x:e.x+e.dir*38,y:e.y-43}):((geo.podSlots8??geo.podSlots)?.[podIndex]?.muzzle??geo.podMuzzles?.[index%2]??geo.muzzle??{x:e.x+e.dir*20,y:e.y-72});
  const podAxis=(geo.podSlots8??geo.podSlots)?.[podIndex]?.axis??geo.podDirections?.[index%2];
  const axis=kind==='gun'&&(e.enemyModel==='rust-striker'||e.armyRole==='bt-support')?geo.muzzleDirection:null;
  const angle=(axis?Math.atan2(axis.y,axis.x):Math.atan2(p.y-35-mount.y,p.x-mount.x))+(kind==='rocket'?(index-1)*.14:0),speed=kind==='guided'?245:330;
  const missile=kind==='guided',mirv=kind==='mirv',rocket=kind==='rocket',barrelGuided=missile&&e.type!=='saltik',launchAxis=geo.muzzleDirection??{x:Math.cos(angle),y:Math.sin(angle)};
  if(missile||rocket)e.armyPodSpent[podIndex]=true;
  shots.push({kind:missile?'enemy-missile':mirv?'enemy-mirv':rocket?'enemy-rocket':'plasma',team:'enemy',sourceEnemyId:e.id,
   x:mount.x,y:mount.y,vx:mirv?e.dir*360:missile?(barrelGuided?launchAxis.x*speed:(podAxis?.x??e.dir*.25)*speed):Math.cos(angle)*speed,vy:mirv?-300:missile?(barrelGuided?launchAxis.y*speed:(podAxis?.y??-1)*speed):Math.sin(angle)*speed,
   damage:missile?8:mirv?6:e.armyRole==='bt-support'?3:e.type==='saltik'?1:4,radius:missile||rocket?5:3.5,life:missile?5:3.4,
   ...(e.armyRole==='bt-support'&&kind==='gun'?{btHeavy:true}:{}),...(missile?{hp:1,locking:true,hostileLoft:!barrelGuided,age:0,salvoIndex:index,salvoCount:e.armySalvoCount,trail:[{...mount}]}:{}),...(mirv?{hp:1,age:0,dir:e.dir,splash:65,trail:[{...mount}]}:{}),...(rocket?{armyRocket:true,splash:34,trail:[{...mount}]}:{})});
  if(missile)e.armySalvoFired=index+1;e.firePose=.13;if(!(kind==='gun'&&e.armyRole==='heavy'&&e.armyPending?.length))e.attackPhase=missile?'launch':rocket?'rocket':'burst';
  event(missile?'enemy-missile':'enemyshot',mount);
  if(e.armyRole==='heavy')event(kind==='gun'?'red-army-cannon':`red-army-${kind}`,mount,{burstIndex:index});
 };
 if(!inRange){e.armyMainNext=e.armyClock+.095;e.armyPending=[];e.lockProgress=0;e.podRaise=0;e.attackPhase='idle';e.armyNext=Math.max(e.armyNext,e.armyClock+.35);return {shots,events};}
 // Rust inherits the playable Striker's three-second stream and 1.32s reload.
 // Secondary weapons run independently, so its identity survives pod locks.
 if(e.armyRole==='heavy'){
  e.armyMainReload=Math.max(0,e.armyMainReload-dt);
  if(e.armyMainReload<=0){
   if(e.armyMainSpent>=3){e.armyMainSpent=0;e.armyMainNext=e.armyClock;}
   e.armyMainSpent+=dt;
   while(e.armyMainNext<=e.armyClock+1e-9){fire('gun');e.armyMainNext+=.095;}
   if(e.armyMainSpent>=3){e.armyMainReload=1.32;event('enemy-reload',pose().muzzle??{x:e.x,y:e.y-43});}
  }
 }
 if(e.armyClock>=e.armyNext&&!e.armyPending.length){
  if((g.enemies??[]).filter(a=>a!==e&&a.hp>0&&a.armyPending?.length).length>=3){e.armyNext=e.armyClock+.25;return {shots,events};}
  const heavy=e.armyRole==='heavy',support=e.armyRole==='bt-support',missile=e.armyRole==='missile-team';
  e.armyPodSpent.fill(false);e.armyAttackAt=e.armyClock;
  const kind=heavy?(e.armyClock>=e.armyGuidedNext?'guided':'mirv'):support?(e.armyCycle%2?'guided':'gun'):missile?'guided':'gun';
  const count=kind==='guided'?(support?Math.min(8,2**(++e.armyMissileCycle)):heavy?3:2):kind==='mirv'?1:3;
  const telegraph=kind==='guided'?(support?.65+count*.16:.85):kind==='mirv'?.64:0;
  e.armySalvoCount=kind==='guided'?count:0;e.armySalvoFired=0;
  if(telegraph){e.attackPhase='lock';e.podRaise=1;e.lockProgress=.01;event('enemy-lock',pose().target??{x:e.x,y:e.y-65},{weapon:kind,salvoCount:count});}
  if(heavy){if(kind==='guided')e.armyGuidedNext=e.armyClock+9.5;else e.armyMirvNext=e.armyClock+5.2;}
  e.armyLockDuration=telegraph;
  for(let i=0;i<count;i++)e.armyPending.push({at:e.armyClock+telegraph+i*(kind==='gun'?.2:.16),kind,index:i});
  e.armyNext=heavy?Math.min(e.armyGuidedNext,e.armyMirvNext):e.armyClock+(support?4.4:missile?5.3:e.armyRole==='gunner'?3.8:4.8);e.armyCycle++;
 }
 for(const pending of e.armyPending)if(pending.at<=e.armyClock+1e-9){fire(pending.kind,pending.index);pending.fired=true;}
 e.armyPending=e.armyPending.filter(s=>!s.fired);
 if(e.armyPending.length&&e.attackPhase==='lock')e.lockProgress=Math.min(1,(e.lockProgress??0)+dt/(e.armyLockDuration||.85));
 e.armyReloadProgress=clamp((e.armyClock-(e.armyAttackAt??0))/3.4,0,1);
 if(!e.armyPending.length){e.podRaise=0;e.lockProgress=0;if(e.firePose<=0)e.attackPhase='idle';}
 return {shots,events};
}
export function createRedArmyHooks(){return {spawnAhead:1900,initialize,advance};}
