// Standard Gamepad: A jump, B evade, Y panic, LT lock, RT cannon, d-pad/stick move.
export function createBTGamepad(movement,weapons,read=()=>globalThis.navigator?.getGamepads?.()??[]){
 let armed=false,weaponsArmed=true;
 const move=['left','right','jump','crouch','drop','shift'],fire=['fire','missile','homing'];
 function clear(){for(const action of move)movement.cancel('bt-pad:'+action);for(const action of fire)weapons.cancel('bt-pad:'+action);armed=false;weaponsArmed=true;}
 return {clear,poll(active,weaponsActive=true){
  let pad;try{pad=[...read()].find(p=>p?.mapping==='standard');}catch{clear();return;}
  if(!active||!pad){clear();return;}
  const down=i=>!!pad.buttons[i]?.pressed||(pad.buttons[i]?.value??0)>.5,x=pad.axes[0]??0,y=pad.axes[1]??0;
  const state={left:x<-.25||down(14),right:x>.25||down(15),jump:down(0)||down(12),crouch:y>.4||down(13),drop:down(10),shift:down(1),fire:down(7),missile:down(6),homing:down(3)};
  if(!armed){if(!Object.values(state).some(Boolean))armed=true;return;}
  for(const action of move)movement.set('bt-pad:'+action,action,state[action]);if(!weaponsActive){for(const action of fire)weapons.cancel('bt-pad:'+action);weaponsArmed=false;}else{if(!weaponsArmed&&!fire.some(action=>state[action]))weaponsArmed=true;for(const action of fire)weapons.set('bt-pad:'+action,action,weaponsArmed&&state[action]);}
 }};
}
