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
 return Math.sign(footX-anchorX)*8*scale/k*clamp(actor.jumpLegs?.spread??0);
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

function splitStrut(points,y,lower){
 const out=[],inside=p=>lower?p[1]>=y:p[1]<=y;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],aa=inside(a),bb=inside(b);
  if(aa)out.push(a);
  if(aa!==bb){const t=(y-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,y]);}
 }
 return out;
}
// Keep the original cabin attachment pixels fixed. Shearing a mask above its
// hinge moves its edge away from the unchanged body cutout and opens a seam.
export function drawJumpLegStrut(c,part,points,draw,anchored){
 const paint=poly=>{if(poly.length<3)return;c.beginPath();c.moveTo(...poly[0]);for(const p of poly.slice(1))c.lineTo(...p);c.closePath();c.clip();draw();};
 if(anchored){c.save();paint(splitStrut(points,part.hinge,false));c.restore();}
 c.save();c.translate(0,part.hinge);c.transform(1,0,part.roll/(part.wheelTop-part.hinge),part.stretch,0,0);c.translate(0,-part.hinge);
 paint(anchored?splitStrut(points,part.hinge,true):points);c.restore();
}
