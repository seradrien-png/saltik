import {enemySaltikGeometry} from './enemy-saltik-art.js';

export const SALTIK_HP=24;
export const SALTIK_GUARD_HP=6;
export const SALTIK_LOCK_TIME=.82;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));

export function createEnemySaltik(schedule,{y,random=0}={}){
  const sample=clamp(Number.isFinite(random)?random:0,0,1);
  return {...schedule,y,type:'saltik',hp:SALTIK_HP,maxHp:SALTIK_HP,
    phase:sample*Math.PI*2,hit:0,dir:schedule.dir===1?1:-1,vx:0,vy:0,firePose:0,guard:false,guardFlash:0,guardResponse:'deflect',guardCount:0,duelStarted:false,
    attackPhase:'idle',nextAttack:'gun',cooldown:.72+sample*.6,attackTimer:0,
    burstRemaining:0,lockProgress:0,lockElapsed:0,podRaise:0,podLaunch:0};
}

export function advanceEnemySaltik(e,{player,dt,time=0,geometry=enemySaltikGeometry}={}){
  const shots=[],events=[];
  if(!(dt>0)||e.hp<=0||!player||player.hp<=0)return {shots,events};
  e.phase=(e.phase??0)+dt;e.firePose=Math.max(0,(e.firePose??0)-dt);
  e.guardFlash=Math.max(0,(e.guardFlash??0)-dt);
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
  e.dir=player.x>=e.x?1:-1;
  const geo=()=>typeof geometry==='function'?geometry(e,time):geometry??enemySaltikGeometry(e,time);
  const event=(type,mount)=>events.push({type,x:mount.x,y:mount.y,enemyId:e.id});
  const gun=()=>{
    e.firePose=.14;const mount=geo().muzzle;
    const aim=Math.atan2(player.y-32-mount.y,player.x-mount.x),speed=285;
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
      }else{e.attackPhase='burst';e.burstRemaining=3;e.attackTimer=0;}
      continue;
    }
    if(e.attackPhase==='burst'){
      const wait=Math.max(0,e.attackTimer??0);
      if(wait>remaining){e.attackTimer=wait-remaining;break;}
      remaining-=wait;gun();e.burstRemaining--;
      if(e.burstRemaining>0)e.attackTimer=.14;
      else{e.attackPhase='idle';e.nextAttack='missile';e.cooldown=1.15;}
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
      e.attackPhase='idle';e.nextAttack='gun';e.cooldown=1.95;e.lockProgress=0;e.lockElapsed=0;e.podRaise=0;e.podLaunch=0;
      continue;
    }
    e.attackPhase='idle';e.cooldown=.5;
  }
  return {shots,events};
}
