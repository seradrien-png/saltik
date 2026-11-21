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
 e.armyNext=.8+(e.armyPhase%1.2);e.armyPending=[];e.vx=0;e.dir=-1;
 return e;
}
function advance(e,{g,dt,groundAt,geometry}){
 if(!e.armyRole)return null;
 const shots=[],events=[],p=g.player;
 if(!(dt>0)||e.hp<=0||e.neutralized||e.duelFinished)return {shots,events};
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
  const geo=pose(),podIndex=kind==='rocket'?[1,2,5][index]:[0,4][index%2];
  const mount=kind==='gun'?(geo.muzzle??{x:e.x+e.dir*38,y:e.y-43}):((geo.podSlots8??geo.podSlots)?.[podIndex]?.muzzle??geo.podMuzzles?.[index%2]??geo.muzzle??{x:e.x+e.dir*20,y:e.y-72});
  const axis=kind==='gun'&&(e.enemyModel==='rust-striker'||e.armyRole==='bt-support')?geo.muzzleDirection:null;
  const angle=(axis?Math.atan2(axis.y,axis.x):Math.atan2(p.y-35-mount.y,p.x-mount.x))+(kind==='rocket'?(index-1)*.14:0),speed=kind==='guided'?225:kind==='rocket'?345:330;
  const missile=kind==='guided',rocket=kind==='rocket',barrelGuided=missile&&e.type!=='saltik',launchAxis=geo.muzzleDirection??{x:Math.cos(angle),y:Math.sin(angle)};
  if(missile||rocket)e.armyPodSpent[podIndex]=true;
  shots.push({kind:missile?'enemy-missile':rocket?'enemy-rocket':'plasma',team:'enemy',sourceEnemyId:e.id,
   x:mount.x,y:mount.y,vx:missile?(barrelGuided?launchAxis.x*speed:e.dir*130):Math.cos(angle)*speed,vy:missile?(barrelGuided?launchAxis.y*speed:-160-index*35):Math.sin(angle)*speed,
   damage:missile?8:rocket?6:e.type==='saltik'?6:4,radius:missile||rocket?5:3.5,life:missile?5:3.4,
   ...(missile?{hp:1,locking:true,age:0,trail:[{...mount}]}:{}),...(rocket?{armyRocket:true,splash:34,trail:[{...mount}]}:{})});
  e.firePose=.13;e.attackPhase=missile?'launch':rocket?'rocket':'burst';
  event(missile?'enemy-missile':'enemyshot',mount);
  if(e.armyRole==='heavy')event(kind==='gun'?'red-army-cannon':`red-army-${kind}`,mount,{burstIndex:index});
 };
 if(!inRange){e.armyPending=[];e.lockProgress=0;e.podRaise=0;e.attackPhase='idle';e.armyNext=Math.max(e.armyNext,e.armyClock+.35);return {shots,events};}
 if(e.armyClock>=e.armyNext){
  // A line alternates short attack windows instead of every defender firing
  // in the same frame. Queued defenders hold their position and try again.
  if((g.enemies??[]).filter(a=>a!==e&&a.hp>0&&a.armyPending?.length).length>=3){e.armyNext=e.armyClock+.25;return {shots,events};}
  const heavy=e.armyRole==='heavy',support=e.armyRole==='bt-support',missile=e.armyRole==='missile-team';
  e.armyPodSpent.fill(false);e.armyAttackAt=e.armyClock;
  const kind=heavy?['gun','guided','rocket'][e.armyCycle%3]:support?['gun','guided'][e.armyCycle%2]:missile?'guided':'gun';
  const count=kind==='guided'?2:3,telegraph=kind==='guided'?.85:kind==='rocket'?.5:0;
  if(telegraph){e.attackPhase='lock';e.podRaise=1;e.lockProgress=.01;event('enemy-lock',pose().target??{x:e.x,y:e.y-65},{weapon:kind});}
  for(let i=0;i<count;i++)e.armyPending.push({at:e.armyClock+telegraph+i*(kind==='gun'?.16:.18),kind,index:i});
  e.armyNext=e.armyClock+(heavy?3.4:support?4.4:missile?5.3:e.armyRole==='gunner'?3.8:4.8);e.armyCycle++;
 }
 for(const pending of e.armyPending)if(pending.at<=e.armyClock+1e-9){fire(pending.kind,pending.index);pending.fired=true;}
 e.armyPending=e.armyPending.filter(s=>!s.fired);
 if(e.armyPending.length&&e.attackPhase==='lock')e.lockProgress=Math.min(1,(e.lockProgress??0)+dt/.85);
 e.armyReloadProgress=clamp((e.armyClock-(e.armyAttackAt??0))/3.4,0,1);
 if(!e.armyPending.length){e.podRaise=0;e.lockProgress=0;if(e.firePose<=0)e.attackPhase='idle';}
 return {shots,events};
}
export function createRedArmyHooks(){return {spawnAhead:1900,initialize,advance};}
