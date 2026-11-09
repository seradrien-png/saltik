export const CARRIER_SHUTDOWN_PHASE_SECONDS=Object.freeze({approach:.55,unplug:1.05,settle:.6});
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const smooth=t=>t*t*(3-2*t);

// The red action creates this sequence once. The animation needs elapsed time,
// a real port and the two actors' feet; it never asks for additional taps.
export function createCarrierShutdown(player,carrier,point){
  const side=player.x<carrier.x?-1:1;
  const placement=point?.port?point:null;
  const port=point?.port??point??carrier.disconnectPoint??{x:carrier.x+side*18,y:carrier.y-61};
  const targetX=finite(placement?.x,carrier.x+side*74),targetY=finite(placement?.y,carrier.y);
  return {phase:'approach',elapsed:0,totalElapsed:0,enemyId:carrier.id,carrierId:carrier.id,
    fromX:player.x,fromY:player.y,x:player.x,y:player.y,targetX,targetY,
    dir:placement?.dir===1?1:placement?.dir===-1?-1:port.x>=targetX?1:-1,
    port:{x:port.x,y:port.y},disconnected:false};
}

export function advanceCarrierShutdown(current,dt){
  if(!current||!Number.isFinite(dt)||!(dt>0))return {shutdown:current??null,events:[]};
  const shutdown={...current},events=[];
  let remaining=dt;
  for(let transition=0;remaining>1e-9&&transition<3;transition++){
    const duration=CARRIER_SHUTDOWN_PHASE_SECONDS[shutdown.phase];
    if(duration===undefined)return {shutdown,events};
    const elapsed=Math.min(remaining,Math.max(0,duration-shutdown.elapsed));
    shutdown.elapsed+=elapsed;shutdown.totalElapsed+=elapsed;remaining-=elapsed;
    const progress=smooth(Math.min(1,shutdown.elapsed/duration));
    if(shutdown.phase==='approach'){
      shutdown.x=shutdown.fromX+(shutdown.targetX-shutdown.fromX)*progress;
      shutdown.y=shutdown.fromY+(shutdown.targetY-shutdown.fromY)*progress;
    }else{shutdown.x=shutdown.targetX;shutdown.y=shutdown.targetY;}
    if(shutdown.elapsed<duration-1e-9)break;
    if(shutdown.phase==='settle'){
      events.push({type:'carrier-shutdown-end',enemyId:shutdown.enemyId,carrierId:shutdown.carrierId,x:shutdown.targetX,y:shutdown.targetY});
      return {shutdown:null,events};
    }
    if(shutdown.phase==='unplug'&&!shutdown.disconnected){
      shutdown.disconnected=true;
      events.push({type:'carrier-disconnected',enemyId:shutdown.enemyId,carrierId:shutdown.carrierId,x:shutdown.port.x,y:shutdown.port.y});
    }
    shutdown.phase=shutdown.phase==='approach'?'unplug':'settle';shutdown.elapsed=0;
  }
  return {shutdown,events};
}
