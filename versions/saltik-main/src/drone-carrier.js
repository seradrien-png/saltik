export const CARRIER_MAX_HP=120;
export const CARRIER_BAY_HP=60;
export const CARRIER_DRONE_LIMIT=3;
export const CARRIER_DRONE_RECHARGE=3.4;
export const CARRIER_DOCK_SECONDS=1.15;
export const CARRIER_UNDOCK_SECONDS=.75;
export const CARRIER_RELOAD_SECONDS=1.8;

const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const positiveTime=dt=>Number.isFinite(dt)&&dt>0;
const measured=(geometry,actor,time)=>typeof geometry==='function'?geometry(actor,time):geometry;
const mouthOf=bay=>bay?.droneAnchor??bay?.muzzle??bay?.mouth??bay?.dockMouth??bay?.port;

export function createDroneCarrier(schedule,{y,random=0}={}){
  const sample=clamp(finite(random),0,1);
  return {...schedule,type:'carrier',y:finite(y,finite(schedule.y)),hp:CARRIER_MAX_HP,maxHp:CARRIER_MAX_HP,
    dir:schedule.dir===1?1:-1,vx:0,vy:0,phase:sample*Math.PI*2,hit:0,firePose:0,
    bays:Array.from({length:2},()=>({hp:CARRIER_BAY_HP,maxHp:CARRIER_BAY_HP,hit:0,launch:0})),
    backDestroyed:false,legDestroyed:false,immobilized:false,disabled:false,damageStage:'intact',knockedOut:false,koElapsed:0,
    neutralized:false,activeDroneCount:0,deployIn:0,deployCursor:0,
    droneSlots:Array.from({length:CARRIER_DRONE_LIMIT},(_,index)=>({active:false,recharge:.6+index*.9,bayIndex:null})),
    attackSeed:(Math.floor(sample*0xffffffff)>>>0)||0x9e3779b9,
    attackPhase:'idle',cooldown:.6+sample*.3,attackTimer:0,burstRemaining:0,
    reloadIn:0,reloadDuration:CARRIER_RELOAD_SECONDS};
}

export function isCarrierTargetable(e){
  return e?.type==='carrier'&&!e.neutralized&&!e.knockedOut&&!e.immobilized&&!e.disabled&&e.hp>0;
}

function stopAttacking(e){
  e.vx=0;e.attackPhase='idle';e.burstRemaining=0;e.attackTimer=0;e.reloadIn=0;e.firePose=0;
}

const damageResult=()=>({events:[],damage:0,bayDisabled:false,newlyDisabled:false,newlyKnockedOut:false,newlyBackDestroyed:false,newlyLegDestroyed:false});

export function damageDroneCarrier(e,damage){
  const result=damageResult(),events=result.events;
  if(!isCarrierTargetable(e)||!positiveTime(damage))return result;
  const before=e.hp;
  // HP measures combat readiness. Exhaustion knocks out the Saltik without
  // destroying its cabin, platforms or legs.
  e.hp=Math.max(0,before-damage);result.damage=before-e.hp;e.hit=.12;
  events.push({type:'carrier-hit',enemyId:e.id,carrierId:e.id,x:e.x,y:e.y-80,damage:result.damage});
  for(const bay of e.bays)bay.hit=.16;
  if(e.hp===0){
    e.knockedOut=true;e.koElapsed=0;e.immobilized=true;e.disabled=true;e.harmless=true;e.damageStage='knocked-out';
    e.backDestroyed=false;e.legDestroyed=false;
    result.newlyKnockedOut=true;result.newlyDisabled=true;stopAttacking(e);
    for(const bay of e.bays)bay.launch=0;
    events.push({type:'carrier-knocked-out',enemyId:e.id,carrierId:e.id,x:e.x,y:e.y});
  }
  return result;
}

export function damageCarrierBay(e,index,damage){
  if(!Number.isInteger(index)||!e?.bays?.[index])return damageResult();
  // Compatibility only: a physical hit damages the shared equipment once,
  // regardless of which cosmetic pad was struck.
  const result=damageDroneCarrier(e,damage);
  if(result.damage>0){
    const mouth=e.bayMuzzles?.[index]??{x:e.x,y:e.y-115};
    Object.assign(result.events[0],{type:'carrier-bay-hit',bayIndex:index,x:mouth.x,y:mouth.y});
  }
  return result;
}

function keepMediumRange(e,player,dt,movement){
  e.vx=0;
  const floor=movement?.groundAt??movement?.floor;
  if(!movement||typeof floor!=='function'||!Number.isFinite(movement.minX)||!Number.isFinite(movement.maxX)||movement.minX>movement.maxX)return;
  if(e.x<movement.minX||e.x>movement.maxX)return;
  const support=floor(e.x);if(!Number.isFinite(support))return;
  e.y=support;e.vy=0;
  const away=player.x>=e.x?-1:1,distance=Math.abs(player.x-e.x);
  const guardianX=finite(movement.guardian?.x,finite(movement.guardianX,NaN));
  let desired=e.x;
  // A carrier must visibly strafe even when the player holds position.
  // Push while firing, then reverse under drone cover through the reload.
  const range=e.attackPhase==='reload'?485:e.attackPhase==='burst'?335:365;
  desired=player.x+away*(distance>550?405:range);
  if(Number.isFinite(guardianX)){
    const behind=guardianX+away*155;
    desired=away>0?Math.max(desired,behind):Math.min(desired,behind);
  }
  const displacement=clamp(desired-e.x,-78*dt,78*dt);
  const destination=clamp(e.x+displacement,movement.minX,movement.maxX),start=e.x;
  const samples=Math.max(1,Math.ceil(Math.abs(destination-start)/5));
  for(let index=1;index<=samples;index++){
    const x=start+(destination-start)*index/samples,y=floor(x);
    if(!Number.isFinite(y)||Math.abs(y-e.y)>24||movement.canOccupy&&!movement.canOccupy(x))break;
    e.x=x;e.y=y;
  }
  e.vx=(e.x-start)/dt;
}

function refreshDocks(e,pose){
  e.bayMuzzles=e.bays.map((_,index)=>{
    const mouth=mouthOf(pose?.bays?.[index]);
    return mouth&&Number.isFinite(mouth.x)&&Number.isFinite(mouth.y)?{x:mouth.x,y:mouth.y}:{x:e.x-36+index*24,y:e.y-116};
  });
  if(pose?.port)e.disconnectPoint={x:pose.port.x,y:pose.port.y};
}

function deployEscort(e,drones,dt,deployments,events){
  const active=drones.filter(drone=>drone.type==='drone'&&drone.carrierId===e.id&&drone.hp>0&&!drone.retired);
  e.activeDroneCount=active.length;e.deployIn=Math.max(0,e.deployIn-dt);
  for(let index=0;index<e.droneSlots.length;index++){
    const slot=e.droneSlots[index],live=active.find(drone=>drone.slot===index);
    if(live){slot.active=true;slot.recharge=0;slot.bayIndex=live.bayIndex;}
    else if(slot.active){slot.active=false;slot.recharge=CARRIER_DRONE_RECHARGE;}
    else slot.recharge=Math.max(0,slot.recharge-dt);
  }
  if(e.backDestroyed||e.immobilized||e.disabled||active.length>=CARRIER_DRONE_LIMIT||e.deployIn>1e-9)return;
  const slot=e.droneSlots.findIndex(item=>!item.active&&item.recharge<=1e-9);
  if(slot<0)return;
  const occupied=new Set(active.filter(drone=>drone.carrierState==='docked'||drone.carrierState==='undock').map(drone=>drone.bayIndex));
  let bayIndex=-1;
  for(let offset=0;offset<e.bays.length;offset++){
    const index=(e.deployCursor+offset)%e.bays.length;
    if(e.bays[index].hp>0&&!occupied.has(index)){bayIndex=index;break;}
  }
  if(bayIndex<0)return;
  const mouth=e.bayMuzzles[bayIndex];
  deployments.push({type:'drone',carrierId:e.id,slot,bayIndex,x:mouth.x,y:mouth.y,
    dockOffsetX:mouth.x-e.x,dockOffsetY:mouth.y-e.y,scale:1,...(e.artScale?{artScale:e.artScale}:{}),dir:e.dir,
    hp:3,maxHp:3,vx:0,vy:0,phase:slot*1.7,hit:0,firePose:0,
    carrierState:'docked',dockElapsed:0,dockDuration:CARRIER_DOCK_SECONDS,undockElapsed:0,undockDuration:CARRIER_UNDOCK_SECONDS,
    role:'screen',roleElapsed:0,swarmElapsed:0,cooldown:1.1,harmless:false,retired:false});
  e.droneSlots[slot]={active:true,recharge:0,bayIndex};e.bays[bayIndex].launch=.45;
  e.deployCursor=(bayIndex+1)%e.bays.length;e.deployIn=.85;e.activeDroneCount++;
  events.push({type:'carrier-drone-deploy',enemyId:e.id,carrierId:e.id,slot,bayIndex,x:mouth.x,y:mouth.y});
  // One release per update: a delayed frame cannot place a stack of drones at
  // the same aperture, even when all initial deployment timers have expired.
}

function trackDefensiveGun(e,player,dt,time,geometry){
  // The painted turret follows the target; velocity is still sampled from the
  // resulting native bore, rather than inventing an unrelated shot direction.
  let remaining=.8*dt;
  for(let i=0;i<3&&remaining>1e-9;i++){
    const pose=measured(geometry,e,time),mouth=pose?.muzzle,axis=pose?.muzzleDirection;
    if(!mouth||!axis)break;
    const desired=Math.atan2(player.y-32-mouth.y,player.x-mouth.x),angle=Math.atan2(axis.y,axis.x);
    const error=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));
    const sign=finite(pose.cannonElevationSign,-(e.dir===1?1:-1));
    const change=clamp(error*sign,-remaining,remaining),before=finite(e.cannonElevation);
    e.cannonElevation=clamp(before+change,-.15,.22);remaining-=Math.abs(e.cannonElevation-before);
    if(Math.abs(error)<1e-5||Math.abs(e.cannonElevation-before)<1e-9)break;
  }
}
function defensiveGun(e,{player,dt,time,geometry},shots,events){
  if(Math.hypot(player.x-e.x,player.y-e.y)>1000){
    e.attackPhase='idle';e.burstRemaining=0;e.reloadIn=0;e.cooldown=Math.max(.6,e.cooldown);return;
  }
  let remaining=dt;
  for(let transition=0;transition<8&&remaining>1e-9&&shots.length<2;transition++){
    if(e.attackPhase==='reload'){
      if(e.reloadIn>remaining){e.reloadIn-=remaining;return;}
      remaining-=e.reloadIn;e.reloadIn=0;e.attackPhase='idle';e.cooldown=0;
    }
    if(e.attackPhase==='idle'){
      if(e.cooldown>remaining){e.cooldown-=remaining;break;}
      remaining-=Math.max(0,e.cooldown);e.cooldown=0;e.attackPhase='burst';e.burstRemaining=9;e.attackTimer=0;
    }
    const wait=Math.max(0,e.attackTimer);
    if(wait>remaining){e.attackTimer=wait-remaining;break;}
    remaining-=wait;e.firePose=.14;
    const pose=measured(geometry,e,time),mouth=pose?.muzzle;
    if(mouth){
      const axis=pose.muzzleDirection,angle=axis?Math.atan2(axis.y,axis.x):Math.atan2(player.y-32-mouth.y,player.x-mouth.x);
      shots.push({kind:'plasma',team:'enemy',x:mouth.x,y:mouth.y,vx:Math.cos(angle)*260,vy:Math.sin(angle)*260,damage:5,radius:4,life:4});
      events.push({type:'enemyshot',enemyId:e.id,carrierId:e.id,x:mouth.x,y:mouth.y});
    }
    e.burstRemaining--;
    if(e.burstRemaining>0)e.attackTimer=.13;
    else{e.attackPhase='reload';e.reloadIn=e.reloadDuration;e.attackTimer=0;}
  }
}

export function advanceDroneCarrier(e,{player,dt,time=0,geometry,movement,drones=[]}={}){
  const shots=[],deployments=[],events=[];
  if(!positiveTime(dt)||!e)return {shots,deployments,events};
  if(e.neutralized||e.shuttingDown){stopAttacking(e);return {shots,deployments,events};}
  if(e.knockedOut){
    stopAttacking(e);e.koElapsed=finite(e.koElapsed)+dt;e.hit=Math.max(0,finite(e.hit)-dt);
    for(const bay of e.bays){bay.hit=Math.max(0,bay.hit-dt);bay.launch=0;}
    refreshDocks(e,measured(geometry,e,time));return {shots,deployments,events};
  }
  if(e.hp<=0)return {shots,deployments,events};
  if(!player||player.hp<=0)return {shots,deployments,events};
  e.phase+=dt;e.hit=Math.max(0,e.hit-dt);e.firePose=Math.max(0,e.firePose-dt);
  for(const bay of e.bays){bay.hit=Math.max(0,bay.hit-dt);bay.launch=Math.max(0,bay.launch-dt);}
  if(!e.disabled&&!e.immobilized)e.dir=player.x>=e.x?1:-1;
  if(!e.disabled&&!e.immobilized)keepMediumRange(e,player,dt,movement);else e.vx=0;
  refreshDocks(e,measured(geometry,e,time));
  if(e.disabled||e.immobilized){stopAttacking(e);return {shots,deployments,events};}
  deployEscort(e,drones,dt,deployments,events);
  trackDefensiveGun(e,player,dt,time,geometry);
  defensiveGun(e,{player,dt,time,geometry},shots,events);
  return {shots,deployments,events};
}

function retireDrone(drone,dt,events){
  drone.harmless=true;drone.carrierState='retire';drone.role='retire';drone.firePose=0;drone.cooldown=Infinity;
  drone.retireElapsed=(drone.retireElapsed??0)+dt;
  drone.vx=(drone.dir===1?1:-1)*90;drone.vy=-95;drone.x+=drone.vx*dt;drone.y+=drone.vy*dt;
  if(drone.retireElapsed>=1.2&&!drone.retired){
    drone.retired=true;drone.hp=0;
    events.push({type:'carrier-drone-retired',enemyId:drone.id,carrierId:drone.carrierId,x:drone.x,y:drone.y});
  }
}

function aimDrone(drone,player,time,geometry){
  drone.dir=player.x>=drone.x?1:-1;drone.aimRotation=0;
  let pose=measured(geometry,drone,time);
  if(typeof geometry==='function')for(let index=0;index<4&&pose?.muzzle&&pose?.muzzleDirection;index++){
    const axis=pose.muzzleDirection,mouth=pose.muzzle;
    const delta=Math.atan2(player.y-32-mouth.y,player.x-mouth.x)-Math.atan2(axis.y,axis.x);
    drone.aimRotation+=Math.atan2(Math.sin(delta),Math.cos(delta));pose=geometry(drone,time);
  }
  return pose;
}

export function advanceCarrierDrone(drone,{carrier,player,dt,time=0,groundAt,geometry}={}){
  const shots=[],events=[];
  if(!positiveTime(dt)||!drone||drone.hp<=0||drone.retired)return {shots,events};
  const attached=drone.carrierState==='docked'||drone.carrierState==='undock';
  if(!carrier||carrier.hp<=0||carrier.neutralized||carrier.immobilized||carrier.disabled||drone.carrierState==='retire'||carrier.backDestroyed&&attached){
    retireDrone(drone,dt,events);return {shots,events};
  }
  if(!player||player.hp<=0)return {shots,events};
  drone.phase=finite(drone.phase)+dt;drone.firePose=Math.max(0,finite(drone.firePose)-dt);drone.hit=Math.max(0,finite(drone.hit)-dt);
  if(attached){
    let releaseTime=dt;
    const mouth=carrier.bayMuzzles?.[drone.bayIndex]??{x:carrier.x+finite(drone.dockOffsetX),y:carrier.y+finite(drone.dockOffsetY,-116)};
    if(drone.carrierState==='docked'){
      const wait=Math.max(0,CARRIER_DOCK_SECONDS-finite(drone.dockElapsed));
      drone.dockElapsed=Math.min(CARRIER_DOCK_SECONDS,finite(drone.dockElapsed)+dt);
      drone.x=mouth.x;drone.y=mouth.y;drone.vx=carrier.vx??0;drone.vy=carrier.vy??0;
      if(releaseTime+1e-9<wait)return {shots,events};
      releaseTime=Math.max(0,releaseTime-wait);drone.carrierState='undock';
    }
    drone.undockElapsed=Math.min(CARRIER_UNDOCK_SECONDS,finite(drone.undockElapsed)+releaseTime);
    const progress=drone.undockElapsed/CARRIER_UNDOCK_SECONDS;
    const oldX=drone.x,oldY=drone.y;
    drone.x=mouth.x+(carrier.dir===1?1:-1)*8*progress*progress;drone.y=mouth.y-72*progress;
    drone.vx=(drone.x-oldX)/dt;drone.vy=(drone.y-oldY)/dt;
    if(progress>=1-1e-9){drone.carrierState='escort';events.push({type:'carrier-drone-undocked',enemyId:drone.id,carrierId:carrier.id,bayIndex:drone.bayIndex,x:drone.x,y:drone.y});}
    return {shots,events};
  }
  const slot=clamp(Math.floor(finite(drone.slot)),0,2),screenDuration=2.4+slot*.3,attackDuration=1.8;
  drone.swarmElapsed=finite(drone.swarmElapsed)+dt;
  const cycle=(drone.swarmElapsed+slot*.65)%(screenDuration+attackDuration);
  drone.role=cycle<screenDuration?'screen':'attack';drone.roleElapsed=cycle<screenDuration?cycle:cycle-screenDuration;
  const toward=player.x>=carrier.x?1:-1,wave=Math.sin(time*1.8+slot*2.1)*12;
  // Both roles stay on the carrier's side of the player, including at close
  // range; a fixed offset would otherwise send a drone behind either actor.
  const distance=Math.abs(player.x-carrier.x);
  const screenOffset=Math.min(105+slot*36,distance*(.38+slot*.08));
  const attackOffset=clamp(distance-(125+slot*28),distance*.45,distance*.8);
  const targetX=carrier.x+toward*(drone.role==='screen'?screenOffset:attackOffset);
  let targetY=(drone.role==='screen'?carrier.y-145-slot*25:player.y-130-slot*24)+wave;
  const floor=typeof groundAt==='function'?groundAt(targetX):NaN;
  if(Number.isFinite(floor))targetY=Math.min(targetY,floor-55);
  const dx=targetX-drone.x,dy=targetY-drone.y,length=Math.hypot(dx,dy)||1;
  const travel=Math.min(length,(drone.role==='screen'?145:195)*dt);
  drone.vx=dx/length*travel/dt;drone.vy=dy/length*travel/dt;drone.x+=drone.vx*dt;drone.y+=drone.vy*dt;
  drone.dir=player.x>=drone.x?1:-1;drone.cooldown=Math.max(0,finite(drone.cooldown)-dt);
  if(drone.cooldown<=1e-9&&Math.hypot(player.x-drone.x,player.y-drone.y)<1000&&!drone.harmless){
    drone.firePose=.16;
    const pose=aimDrone(drone,player,time,geometry),mouth=pose?.muzzle;
    if(mouth){
      const axis=pose.muzzleDirection,angle=axis?Math.atan2(axis.y,axis.x):Math.atan2(player.y-32-mouth.y,player.x-mouth.x);
      shots.push({kind:'plasma',team:'enemy',x:mouth.x,y:mouth.y,vx:Math.cos(angle)*270,vy:Math.sin(angle)*270,damage:5,radius:4,life:4});
      events.push({type:'enemyshot',enemyId:drone.id,carrierId:carrier.id,x:mouth.x,y:mouth.y});
    }
    drone.cooldown=drone.role==='screen'?1.9:1.25;
  }
  return {shots,events};
}
