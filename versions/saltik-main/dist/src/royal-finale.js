// Pure timeline shared by simulation and rendering. Coordinates are viewport
// fractions; the renderer supplies the captured world-space starting anchor.
export const ROYAL_FINALE_TIMING=Object.freeze({run:1,jump:1.5,ride:3,total:5.5});
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>n*n*(3-2*n);
const mix=(a,b,t)=>a+(b-a)*t;
export function createRoyalFinale(player){return {active:true,completed:false,elapsed:0,stage:'run',startWorld:{x:player.x,y:player.y,artScale:player.artScale??1}};}
export function advanceRoyalFinale(finale,dt){
 if(!finale?.active||!(dt>0)||!Number.isFinite(dt))return false;
 finale.elapsed=Math.min(ROYAL_FINALE_TIMING.total,finale.elapsed+dt);
 finale.stage=finale.elapsed<1?'run':finale.elapsed<2.5?'jump':finale.elapsed<5.5?'ride':'complete';
 if(finale.elapsed>=ROYAL_FINALE_TIMING.total){finale.active=false;finale.completed=true;return true;}
 return false;
}
export function getRoyalFinalePose(finale,{startX=.34,startY=.72}={}){
 if(!finale)return null;
 const t=finale.elapsed,stage=t<1?'run':t<2.5?'jump':t<5.5?'ride':'complete';
 const progress=clamp(stage==='run'?t:stage==='jump'?(t-1)/1.5:(t-2.5)/3);
 const departure=ease(clamp((t-2.5)/3));
 // Eel center and back socket are stable at boarding, then recede together.
 const eel={x:mix(.78,1.22,departure),y:mix(.48,.24,departure),scale:mix(.54,.24,departure)};
 const rider={x:eel.x-.08*eel.scale,y:eel.y-.115*eel.scale};
 let player;
 if(stage==='run')player={x:startX+.12*progress*progress,y:startY,scale:1,angle:0};
 else if(stage==='jump'){
  const u=ease(progress);player={x:mix(startX+.12,rider.x,u),y:mix(startY,rider.y,u)-Math.sin(progress*Math.PI)*.18,scale:mix(1,.48,u),angle:-Math.sin(progress*Math.PI)*.16};
 }else player={...rider,scale:.48*eel.scale/.54,angle:0};
 return {stage,stageProgress:progress,player,eel,rider,boarded:stage==='ride'||stage==='complete',complete:!!finale.completed};
}
