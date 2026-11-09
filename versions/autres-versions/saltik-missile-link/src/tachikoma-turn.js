// Body facing is independent of immediate movement intent. Authored octants
// make both full reversals pass through the front of the mechanical cabin.
export const TURN_DURATION=.60;
export function createTachikomaTurn(dir=1){
  const yaw=dir===-1?Math.PI:0;
  return {yaw,targetYaw:yaw,active:false};
}
export function advanceTachikomaTurn(turn,dir,dt){
  turn.targetYaw=dir===-1?Math.PI:0;
  const step=Math.PI/TURN_DURATION*(Number.isFinite(dt)?Math.max(0,dt):0),error=turn.targetYaw-turn.yaw;
  if(Math.abs(error)<=step+1e-10)turn.yaw=turn.targetYaw;
  else turn.yaw+=Math.sign(error)*step;
  turn.active=Math.abs(turn.targetYaw-turn.yaw)>1e-10;
  return turn;
}
export function tachikomaTurnFrame(turn){
  const yaw=Number.isFinite(turn?.yaw)?turn.yaw:0;
  return ((Math.round(yaw/(Math.PI/4))%8)+8)%8;
}
