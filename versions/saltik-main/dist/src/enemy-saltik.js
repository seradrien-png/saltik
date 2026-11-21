import {BT_TUNING} from './bt-combat.js';
import {enemySaltikGeometry} from './enemy-saltik-art.js';

export const SALTIK_HP=48;
export const SALTIK_GUARD_HP=8;
export const SALTIK_LOCK_TIME=.82;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));

function randomDecision(e,key){
  let seed=e[key]>>>0||0x9e3779b9;
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  e[key]=seed>>>0;return e[key]/0x100000000;
}

function moveOnRoute(e,player,dt,movement,rushing){
  e.vx=0;
  if(!movement||!Number.isFinite(movement.minX)||!Number.isFinite(movement.maxX)||
    movement.minX>movement.maxX||typeof movement.groundAt!=='function')return;
  const {minX,maxX,groundAt,canOccupy}=movement;
  if(e.x<minX||e.x>maxX)return;
  const initialGround=groundAt(e.x);if(!Number.isFinite(initialGround))return;
  e.y=initialGround;e.vy=0;
  let remaining=dt;
  // Keep movement decisions at their own elapsed-time boundaries, not at frames.
  for(let decisions=0;remaining>1e-9&&decisions<128;decisions++){
    const toward=player.x>=e.x?1:-1;
    if(rushing){e.movementMode='rush';e.moveDirection=toward;e.moveSpeed=168;}
    else if(!(e.movementTimer>1e-9)){
      const distance=Math.abs(player.x-e.x),choice=randomDecision(e,'movementSeed');
      e.movementMode=distance>480?'advance':distance<180?'retreat':choice<.3?'advance':choice<.58?'retreat':'reposition';
      e.moveDirection=e.movementMode==='advance'?toward:e.movementMode==='retreat'?-toward:(randomDecision(e,'movementSeed')<.5?-1:1);
      e.moveSpeed=46+randomDecision(e,'movementSeed')*38;e.movementTimer=.55+randomDecision(e,'movementSeed')*.85;
    }
    const elapsed=rushing?remaining:Math.min(remaining,e.movementTimer);
    let displacement=e.moveDirection*e.moveSpeed*elapsed;
    if(rushing)displacement=toward*Math.min(Math.abs(displacement),Math.max(0,Math.abs(player.x-e.x)-68));
    const destination=clamp(e.x+displacement,minX,maxX),start=e.x;
    const samples=Math.max(1,Math.ceil(Math.abs(destination-start)/6));
    let blocked=false;
    // Check the complete swept route, including long frames, rather than just
    // accepting a landing point on the far side of a gap or solid obstacle.
    for(let sample=1;sample<=samples;sample++){
      const x=start+(destination-start)*sample/samples,y=groundAt(x);
      if(!Number.isFinite(y)||Math.abs(y-e.y)>30||(canOccupy&&!canOccupy(x))){blocked=true;break;}
      e.x=x;e.y=y;
    }
    e.vx=blocked||e.x===start?0:(e.x-start)/elapsed;
    remaining-=elapsed;if(!rushing)e.movementTimer=Math.max(0,e.movementTimer-elapsed);
  }
}


export function createEnemySaltik(schedule,{y,random=0}={}){
  const sample=clamp(Number.isFinite(random)?random:0,0,1),seed=(Math.floor(sample*0xffffffff)>>>0)||0x9e3779b9;
  return {...schedule,y,type:'saltik',hp:SALTIK_HP,maxHp:SALTIK_HP,
    phase:sample*Math.PI*2,hit:0,dir:schedule.dir===1?1:-1,vx:0,vy:0,firePose:0,guard:false,guardFlash:0,guardResponse:'deflect',guardCount:0,duelStarted:false,
    attackPhase:'idle',nextAttack:'gun',cooldown:.72+sample*.6,attackTimer:0,
    attackSeed:seed,movementSeed:(seed^0xa5a5a5a5)>>>0,lastAttack:null,attackStreak:0,
    movementMode:'idle',movementTimer:0,moveDirection:0,moveSpeed:0,
    burstRemaining:0,lockProgress:0,lockElapsed:0,podRaise:0,podLaunch:0};
}

export function advanceEnemySaltik(e,{player,dt,time=0,geometry=enemySaltikGeometry,movement,enemyProjectileCount=0}={}){
  const shots=[],events=[];
  if(!(dt>0)||e.hp<=0||e.neutralized||e.duelFinished||e.duelStarted||!player||player.hp<=0)return {shots,events};
  e.phase=(e.phase??0)+dt;e.firePose=Math.max(0,(e.firePose??0)-dt);
  e.podLaunch=Math.max(0,(e.podLaunch??0)-dt);if(e.attackPhase==='idle'&&e.podLaunch<=0)e.podRaise=0;
  e.guardFlash=Math.max(0,(e.guardFlash??0)-dt);
  e.guard=false;
  const inRange=Math.hypot(player.x-e.x,(player.y-32)-(e.y-43))<=1050;
  if(!inRange){
    // An interrupted lock must visibly earn the full telegraph after re-entry.
    if(e.attackPhase==='lock'||e.attackPhase==='launch'){
      e.nextAttack='missile';e.cooldown=.35;e.missileCooldown=.35;
    }else if(e.attackPhase==='burst'){
      e.nextAttack='missile';e.cooldown=.65;e.burstRemaining=0;e.attackTimer=0;
    }
    e.attackPhase='idle';e.lockProgress=0;e.lockElapsed=0;e.podRaise=0;e.podLaunch=0;
    return {shots,events};
  }
  moveOnRoute(e,player,dt,movement,false);
  e.dir=player.x>=e.x?1:-1;
  const geo=()=>typeof geometry==='function'?geometry(e,time):geometry??enemySaltikGeometry(e,time);
  const event=(type,mount)=>events.push({type,x:mount.x,y:mount.y,enemyId:e.id});
  const gun=()=>{
    if(enemyProjectileCount+shots.length>=48)return;
    e.firePose=.14;const geometry=geo(),mount=geometry.muzzle,axis=geometry.muzzleDirection;
    const aim=axis?Math.atan2(axis.y,axis.x):Math.atan2(player.y-32-mount.y,player.x-mount.x),speed=420;
    shots.push({kind:'plasma',team:'enemy',x:mount.x,y:mount.y,vx:Math.cos(aim)*speed,vy:Math.sin(aim)*speed,
      damage:BT_TUNING.cannonDamage,btHeavy:true,radius:6,life:4,sourceEnemyId:e.id});
    event('enemyshot',mount);
  };
  e.btMainClock??=e.cooldown??.72;e.btMainIndex??=0;
  e.missileStock??=BT_TUNING.capacity;e.missileLoaded??=Array(BT_TUNING.capacity).fill(true);e.missileVolley??=0;e.missileQuiet??=0;e.missileRefill??=0;e.missileCooldown??=1.6;
  e.missileQuiet+=dt;
  if(e.missileQuiet>=BT_TUNING.refillDelay&&e.missileStock<BT_TUNING.capacity&&e.attackPhase!=='lock'&&e.attackPhase!=='launch'){
    e.missileRefill+=dt;
    while(e.missileRefill>=BT_TUNING.refillInterval&&e.missileStock<BT_TUNING.capacity){e.missileStock++;e.missileLoaded[e.missileLoaded.indexOf(false)]=true;e.missileRefill-=BT_TUNING.refillInterval;}
  }
  // Same heavy triple and interval as the playable BT, independent of the pods.
  e.btMainClock-=dt;
  while(e.btMainClock<=1e-9){gun();e.btMainIndex++;e.btMainClock+=e.btMainIndex%3===0?BT_TUNING.burstInterval-BT_TUNING.burstDuration:BT_TUNING.burstDuration/2;}
  let remaining=dt;
  for(let transitions=0;remaining>1e-9&&transitions<64;transitions++){
    if(e.attackPhase!=='lock'&&e.attackPhase!=='launch'){
      if(e.missileCooldown>remaining){e.missileCooldown-=remaining;break;}
      remaining-=Math.max(0,e.missileCooldown);
      if(e.missileStock<2){e.missileCooldown=.5;continue;}
      e.missileSalvoCount=Math.min(e.missileStock,8,2**Math.min(3,e.missileVolley+1));e.missileSalvoFired=0;
      e.attackPhase='lock';e.lockElapsed=0;e.lockProgress=0;e.podRaise=1;
      e.missileLockDuration=SALTIK_LOCK_TIME+e.missileSalvoCount*BT_TUNING.acquire;e.attackTimer=e.missileLockDuration;
      events.push({type:'enemy-lock',...geo().target,enemyId:e.id,salvoCount:e.missileSalvoCount});
      continue;
    }
    const elapsed=Math.min(remaining,Math.max(0,e.attackTimer));remaining-=elapsed;e.attackTimer-=elapsed;
    if(e.attackPhase==='lock'){
      e.lockElapsed+=elapsed;e.lockProgress=clamp(e.lockElapsed/e.missileLockDuration,0,1);
      if(e.attackTimer>1e-9)break;
      e.attackPhase='launch';e.podLaunch=.2;e.attackTimer=0;
    }
    if(e.attackPhase==='launch'){
      if(e.attackTimer>1e-9)break;
      if(enemyProjectileCount+shots.length>=48){e.attackTimer=.16;break;}
      const geometry=geo(),i=e.missileSalvoFired,tube=[0,4,1,5,2,6,3,7,8,12,9,13,10,14,11,15].find(index=>e.missileLoaded[index]),slot=geometry.btTubes?.[tube%8]??geometry.podSlots8?.[tube%8]??geometry.podSlots?.[tube%8];
      const mount=slot?.muzzle??geometry.podMuzzles[i%2];
      // The real mouth supplies the origin; the loft gives interception time.
      shots.push({kind:'enemy-missile',team:'enemy',sourceEnemyId:e.id,x:mount.x,y:mount.y,
        vx:(slot?.axis?.y<-.35?slot.axis.x:e.dir*.25)*245,vy:(slot?.axis?.y<-.35?slot.axis.y:-1)*245,damage:BT_TUNING.missileDamage,radius:6,life:7,hp:1,locking:true,hostileLoft:true,
        age:0,salvoCount:e.missileSalvoCount,salvoIndex:i,trail:[{...mount}]});
      event('enemy-missile',mount);e.missileLastTube=tube;e.missileLoaded[tube]=false;e.missileStock--;e.missileSalvoFired++;e.missileQuiet=0;e.missileRefill=0;
      if(e.missileSalvoFired<e.missileSalvoCount)e.attackTimer=.16;
      else{e.missileVolley++;e.attackPhase='idle';e.podLaunch=.2;e.podRaise=1;e.lockProgress=0;e.missileCooldown=4.4;}
    }
  }
  return {shots,events};
}
