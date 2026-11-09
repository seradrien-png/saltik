import {enemySaltikGeometry} from './enemy-saltik-art.js';

export const SALTIK_HP=40;
export const SALTIK_GUARD_HP=8;
export const SALTIK_LOCK_TIME=.82;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));

function randomDecision(e,key){
  let seed=e[key]>>>0||0x9e3779b9;
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  e[key]=seed>>>0;return e[key]/0x100000000;
}

function finishAttack(e,kind){
  e.attackStreak=e.lastAttack===kind?(e.attackStreak??0)+1:1;e.lastAttack=kind;
  const roll=randomDecision(e,'attackSeed');
  // At most two of one attack in a row, so both weapons stay in the encounter.
  e.nextAttack=e.attackStreak>=2?(kind==='gun'?'missile':'gun'):(roll<.52?'gun':'missile');
  e.cooldown=kind==='gun'?.82+randomDecision(e,'attackSeed')*.65:1.35+randomDecision(e,'attackSeed')*.95;
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

export function advanceEnemySaltik(e,{player,dt,time=0,geometry=enemySaltikGeometry,movement}={}){
  const shots=[],events=[];
  if(!(dt>0)||e.hp<=0||e.neutralized||e.duelFinished||e.duelStarted||!player||player.hp<=0)return {shots,events};
  e.phase=(e.phase??0)+dt;e.firePose=Math.max(0,(e.firePose??0)-dt);
  e.guardFlash=Math.max(0,(e.guardFlash??0)-dt);
  if(e.guard||e.hp<=SALTIK_GUARD_HP){
    e.guard=true;e.attackPhase='idle';e.burstRemaining=0;e.attackTimer=0;
    e.lockProgress=0;e.lockElapsed=0;e.podRaise=0;e.podLaunch=0;e.firePose=0;
    moveOnRoute(e,player,dt,movement,true);e.dir=player.x>=e.x?1:-1;
    return {shots,events};
  }
  const inRange=Math.hypot(player.x-e.x,(player.y-32)-(e.y-43))<=1050;
  if(!inRange){
    // An interrupted lock must visibly earn the full telegraph after re-entry.
    if(e.attackPhase==='lock'||e.attackPhase==='launch'){
      e.nextAttack='missile';e.cooldown=.35;
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
    e.firePose=.14;const geometry=geo(),mount=geometry.muzzle,axis=geometry.muzzleDirection;
    const aim=axis?Math.atan2(axis.y,axis.x):Math.atan2(player.y-32-mount.y,player.x-mount.x),speed=285;
    shots.push({kind:'plasma',team:'enemy',x:mount.x,y:mount.y,vx:Math.cos(aim)*speed,vy:Math.sin(aim)*speed,
      damage:6,radius:4,life:4});
    event('enemyshot',mount);
  };
  const missiles=()=>{
    // Select the native open-door launch frame before measuring either mouth.
    e.attackPhase='launch';e.podRaise=1;e.lockProgress=1;e.podLaunch=.2;
    const geometry=geo();
    for(let i=0;i<2;i++){
      const mount=geometry.podMuzzles[i],axis=geometry.podDirections[i],length=Math.hypot(axis.x,axis.y)||1;
      shots.push({kind:'enemy-missile',team:'enemy',x:mount.x,y:mount.y,vx:axis.x/length*245,vy:axis.y/length*245,
        damage:10,radius:6,life:5,hp:1,locking:true,age:0,trail:[{x:mount.x,y:mount.y}]});
      event('enemy-missile',mount);
    }
  };
  // Consume phase boundaries rather than dropping excess dt; fixed-step callers
  // and occasional longer frames therefore keep the same attack cadence.
  let remaining=dt;
  for(let transitions=0;remaining>1e-9&&transitions<24;transitions++){
    if(e.attackPhase==='idle'){
      const cooldown=Math.max(0,e.cooldown??0);
      if(cooldown>remaining){e.cooldown=cooldown-remaining;break;}
      remaining-=cooldown;e.cooldown=0;
      if(e.nextAttack==='missile'){
        e.attackPhase='lock';e.lockElapsed=0;e.lockProgress=0;e.podRaise=0;e.attackTimer=SALTIK_LOCK_TIME;
        event('enemy-lock',geo().target);
      }else{
        e.attackPhase='burst';e.burstRemaining=2+Math.floor(randomDecision(e,'attackSeed')*3);
        e.burstInterval=.11+randomDecision(e,'attackSeed')*.075;e.attackTimer=0;
      }
      continue;
    }
    if(e.attackPhase==='burst'){
      const wait=Math.max(0,e.attackTimer??0);
      if(wait>remaining){e.attackTimer=wait-remaining;break;}
      remaining-=wait;gun();e.burstRemaining--;
      if(e.burstRemaining>0)e.attackTimer=e.burstInterval;
      else{e.attackPhase='idle';finishAttack(e,'gun');}
      continue;
    }
    if(e.attackPhase==='lock'){
      const elapsed=Math.min(remaining,e.attackTimer);e.attackTimer-=elapsed;remaining-=elapsed;e.lockElapsed+=elapsed;
      e.lockProgress=clamp(e.lockElapsed/SALTIK_LOCK_TIME,0,1);e.podRaise=clamp(e.lockElapsed/.22,0,1);
      if(e.attackTimer>1e-9)break;
      missiles();e.attackTimer=.2;continue;
    }
    if(e.attackPhase==='launch'){
      const elapsed=Math.min(remaining,e.attackTimer);e.attackTimer-=elapsed;remaining-=elapsed;e.podLaunch=e.attackTimer;
      if(e.attackTimer>1e-9)break;
      e.attackPhase='idle';finishAttack(e,'missile');e.lockProgress=0;e.lockElapsed=0;e.podRaise=0;e.podLaunch=0;
      continue;
    }
    e.attackPhase='idle';e.cooldown=.5;
  }
  return {shots,events};
}
