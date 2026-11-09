export const MELEE_WINDUP=.08,MELEE_IMPACT=.12,MELEE_RECOVERY=.35,MELEE_RECHARGE=.70,MELEE_DAMAGE=6;
const duration={windup:MELEE_WINDUP,impact:MELEE_IMPACT,recovery:MELEE_RECOVERY};
const next={windup:'impact',impact:'recovery',recovery:'idle'};

export function createMeleeState(){return{phase:'idle',elapsed:0,cooldown:0,targetKey:null,hit:false};}
export function cancelMelee(state){state.phase='idle';state.elapsed=0;state.targetKey=null;state.hit=false;}
export function beginMelee(state,targetKey){
  Object.assign(state,{phase:'windup',elapsed:0,cooldown:MELEE_RECHARGE,targetKey,hit:false});
}
export function advanceMelee(state,dt){
  state.cooldown=Math.max(0,state.cooldown-dt);
  if(state.phase==='idle')return;
  state.elapsed+=dt;
  while(state.phase!=='idle'&&state.elapsed>=duration[state.phase]){
    state.elapsed-=duration[state.phase];state.phase=next[state.phase];
    if(state.phase==='idle')cancelMelee(state);
  }
}
