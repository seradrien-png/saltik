// Simulation and rendering share this finite, pause-safe cinema clock.
export const ROYAL_FINALE_TIMING=Object.freeze({run:1.4,jump:1.6,ride:1.4,pov:3.6,total:8});
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const mix=(a,b,t)=>a+(b-a)*t;
export function createRoyalFinale(player){return {active:true,completed:false,elapsed:0,stage:'run',startWorld:{x:player.x,y:player.y,artScale:player.artScale??1}};}
function stageAt(t){return t<1.4?'run':t<3?'jump':t<8?'ride':'complete';}
export function advanceRoyalFinale(finale,dt){
 if(!finale?.active||!(dt>0)||!Number.isFinite(dt))return false;
 finale.elapsed=Math.min(ROYAL_FINALE_TIMING.total,finale.elapsed+dt);finale.stage=stageAt(finale.elapsed);
 if(finale.elapsed>=ROYAL_FINALE_TIMING.total){finale.active=false;finale.completed=true;return true;}
 return false;
}
export function getRoyalFinalePose(finale,{startX=.34,startY=.72,aspect=16/9,eelStart={x:1.65,y:.36,scale:.9,flip:-1},backSocket={x:.58,y:.22}}={}){
 if(!finale)return null;
 const t=finale.elapsed,stage=stageAt(t),progress=clamp(stage==='run'?t/1.4:stage==='jump'?(t-1.4)/1.6:(t-3)/5);
 // The atmospheric eel's exact transform becomes the first cinema transform.
 // It approaches while Saltik runs and jumps; it never respawns at boarding.
 const approach=ease(t/3),departure=ease((t-3)/2.8),flip=eelStart.flip??-1;
 const eel={x:mix(eelStart.x,.72,approach)+.14*departure,y:mix(eelStart.y,.43,approach)-.09*departure,scale:mix(eelStart.scale,.8,approach)-.08*departure,flip};
 const rider={x:eel.x+(flip<0?.5-backSocket.x:backSocket.x-.5)*eel.scale,y:eel.y+(backSocket.y-.5)*eel.scale*aspect/(1024/340)};
 let player;
 if(stage==='run')player={x:startX+.12*ease(progress),y:startY,scale:1,angle:0};
 else if(stage==='jump'){
  const u=ease(progress);player={x:mix(startX+.12,rider.x,u),y:mix(startY,rider.y,u)-Math.sin(progress*Math.PI)*.2,scale:mix(1,.54,u),angle:-Math.sin(progress*Math.PI)*.16};
 }else player={...rider,scale:.54*eel.scale/.8,angle:0};
 return {stage,stageProgress:progress,player,eel,rider,boarded:t>=3,pov:ease((t-4.4)/1.3),travel:clamp((t-4.4)/3.6),complete:!!finale.completed};
}
