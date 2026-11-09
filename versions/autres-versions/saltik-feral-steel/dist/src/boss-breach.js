// All anchors are world-space feet coordinates. Presentation may read phase,
// elapsed, taps and effortElapsed without influencing the assault.
import {bossGeometry} from './boss-tank.js';
export const BREACH_PHASE_SECONDS=Object.freeze({leap:.72,tear:.42,fire:1.25,eject:.4});
export const BREACH_EFFORT_SECONDS=.32;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createBossBreach(player,boss,held=false,kind='hull'){
  const geometry=bossGeometry(boss),deck=geometry.roof;
  const deckX=kind==='pod'?geometry.access.x:deck.x1+40;
  const deckY=kind==='pod'?geometry.access.y:deck.y;
  const distance=Math.abs(deckX-player.x);
  return {kind,phase:'leap',elapsed:0,taps:0,effortsCompleted:0,effortElapsed:0,shotsFired:0,
    fromX:player.x,fromY:player.y,x:player.x,y:player.y,
    deckX,deckY,leapDuration:Math.max(.72,Math.min(1.8,distance/600)),
    leapHeight:Math.max(90,Math.min(220,distance*.20),Math.abs(player.y-deckY)*.4),
    qteHeld:!!held,qteArmed:false};
}

export function advanceBossBreach(current,held,dt,{grounded=false}={}){
  if(!current||!(dt>0))return {breach:current,events:[]};
  const breach={...current},events=[];
  if(breach.phase==='return'){
    if(grounded)return {breach:null,events:[{type:'breach-end'}]};
    breach.elapsed+=dt;return {breach,events};
  }
  if(breach.phase==='qte'){
    // Presentation time lets the arrival shot finish while the QTE itself
    // remains untimed and its pulling effort keeps a separate clock.
    breach.elapsed+=dt;
    const pressed=!!held;
    if(!pressed)breach.qteArmed=true;
    if(pressed&&!breach.qteHeld&&breach.qteArmed&&breach.taps<3){
      breach.taps++;breach.qteArmed=false;
      events.push({type:'breach-tap',taps:breach.taps});
    }
    breach.qteHeld=pressed;
    let remaining=dt;
    while(breach.effortsCompleted<breach.taps&&remaining>0){
      const needed=BREACH_EFFORT_SECONDS-breach.effortElapsed;
      if(remaining<needed-1e-9){breach.effortElapsed+=remaining;break;}
      remaining-=needed;breach.effortsCompleted++;breach.effortElapsed=0;
    }
    if(breach.taps===3&&breach.effortsCompleted===3){
      breach.phase='tear';breach.elapsed=0;events.push({type:'breach-tear'});
    }
    return {breach,events};
  }
  const duration=breach.phase==='leap'?breach.leapDuration??BREACH_PHASE_SECONDS.leap:
    breach.kind==='pod'&&breach.phase==='fire'?.25:BREACH_PHASE_SECONDS[breach.phase];
  if(duration===undefined)return {breach,events};
  const elapsedBefore=breach.elapsed;
  breach.elapsed=clamp(breach.elapsed+dt,0,duration);
  if(breach.phase==='fire'&&breach.kind==='hull'){
    for(let i=(breach.shotsFired??0)+1;i<=6;i++){
      const at=.1+(i-1)*.2;
      if(elapsedBefore<at&&breach.elapsed>=at){breach.shotsFired=i;events.push({type:'breach-shot',shot:i});}
    }
  }
  if(breach.elapsed<duration-1e-9)return {breach,events};
  const next={leap:'qte',tear:'fire',fire:'eject',eject:'return'}[breach.phase];
  breach.phase=next;breach.elapsed=0;
  if(next==='qte'){
    breach.qteHeld=!!held;breach.qteArmed=false;
    if(breach.kind==='pod')events.push({type:'breach-shot',shot:1});
  }
  if(next==='fire')events.push({type:breach.kind==='pod'?'pod-destroyed':'breach-hole'});
  if(next==='eject')events.push({type:breach.kind==='pod'?'pod-fire':'breach-fire'});
  if(next==='return')events.push({type:'breach-return'});
  return {breach,events};
}
