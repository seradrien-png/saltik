import {btFinishHold} from './bt-finish-timing.js';
// The anchor and actor coordinates are world-space foot positions. The
// renderer can pose both locked actors without moving their physical support.
export const DUEL_PHASE_SECONDS=Object.freeze({engage:.45,throw:.48,impact:.18,slide:.95,recover:.2});
export const DUEL_EFFORT_SECONDS=.24;

export function createSaltikDuel(player,enemy,random=Math.random){
  return {throwVariant:Math.min(3,Math.max(0,Math.floor(random()*4))),phase:'engage',elapsed:0,taps:0,effortsCompleted:0,effortElapsed:0,enemyId:enemy.id,
    x:(player.x+enemy.x)/2,y:(player.y+enemy.y)/2,
    dir:enemy.x>=player.x?1:-1,
    playerX:player.x,enemyX:enemy.x,playerY:player.y,enemyY:enemy.y,
    qteHeld:false,qteArmed:false};
}

export function advanceSaltikDuel(current,qte,dt){
  if(!current||!(dt>0))return {duel:current,events:[]};
  const duel={...current},events=[];
  const event=(type,extra={})=>events.push({type,x:duel.x,y:duel.y,enemyId:duel.enemyId,throwVariant:duel.throwVariant??0,...extra});
  if(duel.phase==='qte'){
    const held=!!qte;
    if(!held)duel.qteArmed=true;
    if(held&&!duel.qteHeld&&duel.qteArmed&&duel.taps<5){
      duel.taps++;event('duel-tap',{taps:duel.taps});duel.qteArmed=false;
    }
    duel.qteHeld=held;
    // Taps queue strokes; presentation reads the active stroke's elapsed time.
    // Consume elapsed time across boundaries so rapid presses still finish all five.
    let remaining=dt;
    while(duel.effortsCompleted<duel.taps&&remaining>0){
      const needed=DUEL_EFFORT_SECONDS-duel.effortElapsed;
      if(remaining<needed-1e-9){duel.effortElapsed+=remaining;break;}
      remaining-=needed;duel.effortsCompleted++;duel.effortElapsed=0;
    }
    if(duel.taps===5&&duel.effortsCompleted===5){
      duel.phase='throw';duel.elapsed=0;event('duel-throw');
    }
    return {duel,events};
  }
  const duration=DUEL_PHASE_SECONDS[duel.phase];
  if(duration===undefined)return {duel,events};
  const previousElapsed=duel.elapsed;
  duel.elapsed=Math.min(duration,duel.elapsed+dt);
  if(duel.phase==='slide'&&previousElapsed<btFinishHold(duel)&&duel.elapsed>=btFinishHold(duel)){
    if(duel.throwVariant===2)event('duel-slide');
    if(duel.throwVariant===3)event('duel-ricochet');
  }
  if(duel.elapsed<duration-1e-9)return {duel,events};
  const next={engage:'qte',throw:'impact',impact:'slide',slide:'recover',recover:null}[duel.phase];
  if(next===null){event('duel-end');return {duel:null,events};}
  duel.phase=next;duel.elapsed=0;
  if(next==='qte'){duel.qteHeld=!!qte;duel.qteArmed=false;}
  if(next==='impact')event('duel-impact');
  return {duel,events};
}
