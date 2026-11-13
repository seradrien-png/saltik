const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
// Simulation-time animation only: never changes movement or collision state.
export function advanceJumpLegPose(actor,dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 const airborne=actor.onGround===false;
 if(!actor.jumpLegs&&!airborne)return;
 const s=actor.jumpLegs??(actor.jumpLegs={spread:0,airborne:false,age:0});
 if(airborne){
  if(!s.airborne){s.age=0;s.amplitude=actor.vy < -80?1:.35;}
  s.airborne=true;s.age+=dt;
  s.spread=s.amplitude*smooth(s.age/.10)*(1-.35*smooth((s.age-.22)/.35));
 }else{
  if(s.airborne){s.returnFrom=s.spread;s.returnAge=0;}
  s.airborne=false;s.returnAge=(s.returnAge??0)+dt;
  s.spread=(s.returnFrom??0)*(1-smooth(s.returnAge/.18));
 }
}
export function jumpLegOffset(actor,footX,anchorX,k,scale=1){
 if(actor.knockedOut||actor.gatlingInteraction||actor.btStage||actor.modernStage)return 0;
 return Math.sign(footX-anchorX)*12*scale/k*clamp(actor.jumpLegs?.spread??0);
}

// A stretched suspension and rigid wheel patch reveal the underside in flight.
export function jumpLegExtension(actor,k,scale=1){
 return Math.abs(jumpLegOffset(actor,1,0,k,scale))*.6;
}

// Restore the earlier suspension splay: only the feet shift outward, with a
// short eased extension. Keep the rig API, but never fan the whole leg sideways.
export function jumpLegPose(actor,part,anchorX){
 return{pivot:[part.foot[0],part.hinge],angle:0};
}
export function jumpLegPoint(pose,[x,y]){
 if(!pose.angle)return[x,y];const dx=x-pose.pivot[0],dy=y-pose.pivot[1],co=Math.cos(pose.angle),si=Math.sin(pose.angle);
 return[pose.pivot[0]+dx*co-dy*si,pose.pivot[1]+dx*si+dy*co];
}
export function applyJumpLegPose(c,pose){if(pose?.angle){c.translate(...pose.pivot);c.rotate(pose.angle);c.translate(-pose.pivot[0],-pose.pivot[1]);}}
